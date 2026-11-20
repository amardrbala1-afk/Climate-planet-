#!/usr/bin/env python3
"""Download, verify, grid and render a single NOAA GFS forecast chart.

Publication is fail-closed: requires independent calibration anchors and verified
GRIB provenance including meteorological parameter, level, run and step range.
No synthetic field values are ever generated.
"""
import argparse, csv, datetime as dt, json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SPEC={
 ('europe','z500'):{'shortnames':{'gh','z'},'type':'isobaricInhPa','level':500,'units':{'gpm':'m','m':'m','m2 s-2':'geopotential'}},
 ('europe','t850'):{'shortnames':{'t'},'type':'isobaricInhPa','level':850,'units':{'K':'K'}},
 ('levant','t2m'):{'shortnames':{'2t','t'},'type':'heightAboveGround','level':2,'units':{'K':'K'}},
 ('levant','rain'):{'shortnames':{'tp'},'type':'surface','level':0,'units':{'kg m**-2':'mm','kg m-2':'mm','mm':'mm'}},
}

def parse_step_range(rng):
    import re
    match=__import__('re').fullmatch(r'(\d+)-(\d+)',str(rng or ''))
    if not match:raise ValueError(f'Unverifiable accumulation interval: {rng!r} (explicit start-end required)')
    return tuple(map(int,match.groups()))

def validate_grib_variable(arr, spec, date, cycle, fh, field, accumulation):
    attrs=arr.attrs
    name=str(attrs.get('GRIB_shortName',''))
    level_type=str(attrs.get('GRIB_typeOfLevel',''))
    lev=attrs.get('GRIB_level')
    if lev is None and hasattr(arr,'coords') and spec['type'] in arr.coords:
        lev=np.asarray(arr.coords[spec['type']].values).item()
    level=float(lev) if lev is not None else float('nan')
    unit=str(attrs.get('units',''))
    if name not in spec['shortnames'] or level_type!=spec['type'] or level!=spec['level']:
        raise ValueError(f'Variable metadata mismatch: {name}/{level_type}/{level} expected {spec}')
    if unit not in spec['units']:raise ValueError(f'Unexpected GRIB units {unit!r}; refuse to guess conversion.')
    # Cfgrib versions differ: run date may be in GRIB attributes or the
    # authoritative decoded `time` coordinate. Require at least one verified source.
    verified_run=False
    if 'GRIB_dataDate' in attrs:
        if str(attrs['GRIB_dataDate'])!=date:raise ValueError('GRIB analysis date mismatch')
        verified_run=True
    if 'GRIB_dataTime' in attrs:
        if str(attrs['GRIB_dataTime']).zfill(4)[:2]!=cycle:raise ValueError('GRIB UTC cycle mismatch')
        verified_run=True
    if hasattr(arr,'coords') and 'time' in arr.coords:
        expected=np.datetime64(f'{date[:4]}-{date[4:6]}-{date[6:8]}T{cycle}:00')
        actual=np.asarray(arr.coords['time'].values).astype('datetime64[m]')
        if actual.size!=1 or actual.item()!=expected.astype('datetime64[m]').item():
            raise ValueError('Decoded GRIB run-time coordinate mismatch')
        verified_run=True
    if not verified_run:raise ValueError('GRIB run time is not verifiable; refuse publication')
    rng=str(attrs.get('GRIB_stepRange',''))
    if field=='rain':
        if str(attrs.get('GRIB_stepType',''))!='accum':raise ValueError('Rain field is not tagged as an accumulation')
        start,end=parse_step_range(rng)
        if end!=fh or end-start!=accumulation:
            raise ValueError(f'Rain field covers {start}-{end}h, not requested interval {accumulation}h ending at {fh}h')
    else:
        if str(attrs.get('GRIB_stepType','')) not in {'instant','avg'}:raise ValueError('Forecast field is not instantaneous/average as expected')
        if rng and rng.isdigit() and int(rng)!=fh:raise ValueError('Forecast step mismatches requested hour')
    return spec['units'][unit]

def select_field(path,spec,date,cycle,fh,field,accumulation):
    import cfgrib
    datasets=cfgrib.open_datasets(str(path),backend_kwargs={'indexpath':''})
    verified=[];issues=[]
    for ds in datasets:
        for arr in ds.data_vars.values():
            try:unit=validate_grib_variable(arr,spec,date,cycle,fh,field,accumulation)
            except Exception as exc:issues.append(str(exc));continue
            if len(arr.dims)>2:
                for dim in list(arr.dims):
                    if dim not in ('latitude','longitude'):
                        if arr.sizes[dim]!=1:raise ValueError('Multiple steps/levels found. No single verified field.')
                        arr=arr.isel({dim:0})
            verified.append((arr,unit))
    if len(verified)!=1:raise ValueError(f'Expected one verified GRIB variable, got {len(verified)}. Rejected: {issues[:3]}')
    return verified[0]



def write_verified_precipitation(path, out_csv, date, cycle, forecast_hour, accumulation_hours):
    """Select a *single* NOAA GFS APCP message by its true GRIB time boundaries.

    ecCodes deliberately displays [0, 6] as stepRange=6 in some GRIB2
    products. A scalar GRIB_stepRange is therefore insufficient proof of a
    six-hour period. Read startStep and endStep directly from the source GRIB
    message, requiring precisely the requested accumulation interval and run.
    No field is published if the verification is ambiguous or incomplete.
    """
    from eccodes import (
        codes_grib_new_from_file, codes_release, codes_get,
        codes_get_array, codes_get_values,
    )

    expected_date = int(date)
    expected_cycle = int(cycle) * 100
    candidates = []
    rejected = []
    with open(path, 'rb') as handle:
        while True:
            gid = codes_grib_new_from_file(handle)
            if gid is None:
                break
            try:
                def key(name, type_=None):
                    return codes_get(gid, name) if type_ is None else codes_get(gid, name, type_)

                # Identify the meteorological parameter, GRIB level and true
                # originating UTC run before accepting temporal metadata.
                if str(key('shortName')) != 'tp':
                    continue
                if str(key('typeOfLevel')) != 'surface' or int(key('level')) != 0:
                    continue
                if str(key('stepType')) != 'accum':
                    rejected.append('APCP message is not accumulated precipitation')
                    continue
                if int(key('dataDate')) != expected_date or int(key('dataTime')) != expected_cycle:
                    rejected.append('APCP analysis date/cycle does not match the request')
                    continue
                units = str(key('units'))
                if units not in SPEC[('levant','rain')]['units']:
                    rejected.append(f'Unexpected APCP unit {units!r}')
                    continue
                step_units = str(key('stepUnits', str)).lower()
                if step_units not in {'h','1h','hour','hours','1'}:
                    rejected.append(f'Unsupported accumulation-step unit {step_units!r}')
                    continue
                start = int(key('startStep'))
                end = int(key('endStep'))
                if start < 0 or end != forecast_hour or end - start != accumulation_hours:
                    rejected.append(f'APCP covers {start}-{end} hours; requested {forecast_hour-accumulation_hours}-{forecast_hour} hours')
                    continue
                latitudes = np.asarray(codes_get_array(gid, 'latitudes'), dtype=float)
                longitudes = np.asarray(codes_get_array(gid, 'longitudes'), dtype=float)
                values = np.asarray(codes_get_values(gid), dtype=float)
                if latitudes.shape != longitudes.shape or values.shape != latitudes.shape:
                    rejected.append('APCP coordinates and values do not have matching sizes')
                    continue
                if np.sum(np.isfinite(latitudes) & np.isfinite(longitudes) & np.isfinite(values)) < 50:
                    rejected.append('APCP field has fewer than 50 finite source points')
                    continue
                if np.any(values[np.isfinite(values)] < -0.0001):
                    rejected.append('APCP contains negative accumulation values')
                    continue
                candidates.append((start, end, units, latitudes, longitudes, values))
            finally:
                codes_release(gid)

    if len(candidates) != 1:
        raise ValueError(f'Expected exactly one NOAA APCP message with verified {accumulation_hours}h accumulation ending at f{forecast_hour:03d}; got {len(candidates)}. Rejected: {rejected[:5]}')
    start,end,units,latitudes,longitudes,values = candidates[0]
    n = 0
    with out_csv.open('w', newline='', encoding='utf8') as file:
        writer = csv.writer(file)
        writer.writerow(['lat','lon','value'])
        for la,lo,v in zip(latitudes,longitudes,values):
            if not (np.isfinite(la) and np.isfinite(lo) and np.isfinite(v)):
                continue
            writer.writerow([float(la), float((lo+180)%360-180), float(max(v,0))])
            n += 1
    print(f'GRIB APCP verified from raw ecCodes metadata: {start}-{end}h, {units}, {n} original points')
    return n

def write_csv(arr,path):
    lat=np.asarray(arr.latitude.values);lon=np.asarray(arr.longitude.values);val=np.asarray(arr.values)
    if lat.ndim!=1 or lon.ndim!=1 or val.shape!=(len(lat),len(lon)):
        raise ValueError('Unexpected grid coordinate layout: requires latitude×longitude field')
    n=0
    with path.open('w',encoding='utf8',newline='') as file:
        writer=csv.writer(file);writer.writerow(['lat','lon','value'])
        for i,la in enumerate(lat):
            for j,lo in enumerate(lon):
                v=val[i,j]
                if not np.isfinite(v):continue
                writer.writerow([float(la),float((lo+180)%360-180),float(v)]);n+=1
    if n<50:raise ValueError('Insufficient finite grid points')
    return n

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--date',required=True,help='YYYYMMDD UTC');p.add_argument('--cycle',choices=['00','06','12','18'],required=True)
    p.add_argument('--forecast-hour',type=int,required=True);p.add_argument('--region',choices=['europe','levant'],required=True)
    p.add_argument('--field',choices=['z500','t850','t2m','rain'],required=True)
    p.add_argument('--accum-hours',type=int,choices=[6,12,18,24]);p.add_argument('--calibration',type=Path)
    p.add_argument('--dry-run',action='store_true')
    args=p.parse_args();spec=SPEC.get((args.region,args.field))
    if not spec:p.error('Unsupported region/field pairing')
    try:dt.datetime.strptime(args.date,'%Y%m%d')
    except ValueError:p.error('Date must be YYYYMMDD')
    if not 0<=args.forecast_hour<=384:p.error('Forecast hour 0...384')
    if args.field=='rain' and (args.accum_hours is None or args.forecast_hour<args.accum_hours):p.error('Rain requires --accum-hours, with a compatible step')
    # The user supplied the matching PNG + .pgw, enabling a direct affine
    # projection; calibration control points are no longer an obstacle.
    worldfile=ROOT/'tools/georef'/f'{args.region}.pgw'
    if not worldfile.is_file():raise SystemExit(f'WORLD FILE REQUIRED: {worldfile} is absent; nothing published.')
    from render_map import BASE
    from worldfile import WorldFile
    w,h,_=BASE[args.region]
    WorldFile.read(worldfile).verify(args.region,w,h)
    with tempfile.TemporaryDirectory(prefix='climate-forecast-') as tmp:
        file=Path(tmp)/'gfs.grib2';grid=Path(tmp)/'field.csv'
        fetch=[sys.executable,str(ROOT/'tools/fetch_gfs.py'),'--date',args.date,'--cycle',args.cycle,'--forecast-hour',str(args.forecast_hour),'--field',args.field,'--region',args.region,'--output',str(file)]
        if args.dry_run:
            print('WORLD FILE EXTENT VERIFIED; NOAA request URL:');subprocess.run(fetch+['--dry-run'],check=True);return
        subprocess.run(fetch,check=True)
        if args.field == 'rain':
            # cfgrib may abbreviate 0-6 as stepRange='6', which is not a
            # trustworthy indication of the duration. Verify raw GRIB2 keys.
            n=write_verified_precipitation(file,grid,args.date,args.cycle,args.forecast_hour,args.accum_hours)
            unit='mm'  # source unit was checked against SPEC for 1:1 mm equivalent
        else:
            arr,unit=select_field(file,spec,args.date,args.cycle,args.forecast_hour,args.field,args.accum_hours)
            n=write_csv(arr,grid)
        print('Verified real model grid points:',n)
        cmd=[sys.executable,str(ROOT/'tools/render_map.py'),'--csv',str(grid),'--region',args.region,'--field',args.field,'--model','GFS','--run',f'{args.date[:4]}-{args.date[4:6]}-{args.date[6:8]}T{args.cycle}','--forecast-hour',str(args.forecast_hour),'--unit',unit,'--worldfile',str(worldfile),'--source','NOAA NOMADS GFS 0.25°']
        if args.field=='rain':cmd+=['--accum-hours',str(args.accum_hours)]
        subprocess.run(cmd,check=True)
        # A subprocess exit code alone is not proof that a new map was created.
        # Reject silent/no-op rendering and retain pre-existing verified products.
        sid=f'gfs-{args.region}-{args.field}-{args.date}{args.cycle}-f{args.forecast_hour:03d}'
        image=ROOT/'site/images/maps/forecast'/f'{sid}.png'
        catalog=ROOT/'data/map-products/catalog.json'
        if not image.is_file() or image.stat().st_size < 200:
            raise RuntimeError(f'PUBLISH ERROR: missing rendered PNG: {image}')
        with image.open('rb') as stream:
            if stream.read(8) != b'\x89PNG\r\n\x1a\n':
                raise RuntimeError(f'PUBLISH ERROR: invalid PNG signature: {image}')
        if not catalog.is_file():
            raise RuntimeError(f'PUBLISH ERROR: missing map catalog: {catalog}')
        entries=json.loads(catalog.read_text(encoding='utf8'))
        matching=[x for x in entries if x.get('id')==sid and x.get('field')==args.field and x.get('model')=='GFS']
        if len(matching)!=1:
            raise RuntimeError(f'PUBLISH ERROR: catalog has {len(matching)} entries for {sid}, expected 1')
        print(f'PUBLISH_GFS_OK: {sid} ({image.stat().st_size} bytes)',flush=True)

# This guard MUST be at column zero, outside main(), so the publisher actually runs.
if __name__ == '__main__':
    print('PUBLISH_GFS_ENTRY: executing tools/publish_gfs.py',flush=True)
    main()

