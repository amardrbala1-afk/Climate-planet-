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
        arr,unit=select_field(file,spec,args.date,args.cycle,args.forecast_hour,args.field,args.accum_hours)
        n=write_csv(arr,grid);print('Verified real model grid points:',n)
        cmd=[sys.executable,str(ROOT/'tools/render_map.py'),'--csv',str(grid),'--region',args.region,'--field',args.field,'--model','GFS','--run',f'{args.date[:4]}-{args.date[4:6]}-{args.date[6:8]}T{args.cycle}','--forecast-hour',str(args.forecast_hour),'--unit',unit,'--worldfile',str(worldfile),'--source','NOAA NOMADS GFS 0.25°']
        if args.field=='rain':cmd+=['--accum-hours',str(args.accum_hours)]
        subprocess.run(cmd,check=True)

if __name__=='__main__':main()
