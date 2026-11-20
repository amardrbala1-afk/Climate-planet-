#!/usr/bin/env python3
"""Extract a selected weather model field from GRIB2 or NetCDF into lat,lon,value CSV.

Requires pip install xarray cfgrib eccodes (for GRIB2) or xarray netCDF4 (NetCDF).
Always inspect available variables/coordinates and select exactly one time/step.
Do NOT interpret total precipitation as a 6-hour interval automatically.
"""
import argparse, csv, sys
from pathlib import Path
import numpy as np

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('input');p.add_argument('output');p.add_argument('--variable',required=True)
    p.add_argument('--level',type=int);p.add_argument('--time-index',type=int);p.add_argument('--step-index',type=int)
    p.add_argument('--engine',choices=['cfgrib','netcdf4'],default='cfgrib');p.add_argument('--subtract-csv',help='CSV of earlier cumulative field; subtract values only if source metadata confirms same run and compatible accumulation')
    a=p.parse_args()
    try:import xarray as xr
    except ImportError:sys.exit('Missing optional dependency: pip install xarray cfgrib eccodes')
    kw={'engine':a.engine}
    if a.engine=='cfgrib':
        kw['backend_kwargs']={'indexpath':''}
        if a.level is not None:kw['backend_kwargs']['filter_by_keys']={'typeOfLevel':'isobaricInhPa','level':a.level}
    ds=xr.open_dataset(a.input,**kw)
    if a.variable not in ds:
        raise ValueError(f'Variable {a.variable!r} absent. Available: {list(ds.data_vars)}; inspect GRIB attributes and shortName.')
    arr=ds[a.variable]
    for dim,index in [('time',a.time_index),('step',a.step_index)]:
        if dim in arr.dims and arr.sizes[dim]>1:
            if index is None:raise ValueError(f'{dim} has {arr.sizes[dim]} entries: choose --{dim}-index explicitly. Available: {arr[dim].values}')
            arr=arr.isel({dim:index})
    for dim in list(arr.dims):
        if dim not in ('latitude','longitude','lat','lon'):
            if arr.sizes[dim]!=1:raise ValueError(f'Multiple levels/steps in dimension {dim}; choose a single field first.')
            arr=arr.isel({dim:0})
    lat=next((n for n in ('latitude','lat') if n in arr.coords),None);lon=next((n for n in ('longitude','lon') if n in arr.coords),None)
    if not lat or not lon:raise ValueError('Latitude/longitude coordinate arrays absent. Convert to regular geographic coordinates before using this exporter.')
    lav=np.asarray(arr[lat].values);lov=np.asarray(arr[lon].values);vals=np.asarray(arr.values)
    if lav.ndim==1 and lov.ndim==1:
        lon2,lat2=np.meshgrid(lov,lav)
    elif lav.ndim==2 and lov.ndim==2:lat2,lon2=lav,lov
    else:raise ValueError('Unsupported latitude/longitude coordinate shape')
    if vals.shape!=lat2.shape:raise ValueError(f'Data array {vals.shape} does not match coordinates {lat2.shape}.')
    prior={}
    if a.subtract_csv:
        with open(a.subtract_csv,newline='',encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):prior[(round(float(r['lat']),5),round(float(r['lon']),5))]=float(r['value'])
    total=0
    with open(a.output,'w',newline='',encoding='utf8') as f:
        w=csv.writer(f);w.writerow(['lat','lon','value'])
        for y,x,v in zip(lat2.ravel(),lon2.ravel(),vals.ravel()):
            if not np.isfinite(y) or not np.isfinite(x) or not np.isfinite(v):continue
            lo=(float(x)+180)%360-180;la=float(y);z=float(v)
            if prior:
                k=(round(la,5),round(lo,5))
                if k not in prior:continue
                z-=prior[k]
                if z<-.0001:raise ValueError('Negative accumulated precipitation after subtraction: wrong source field/cycle or interval')
            w.writerow([f'{la:.5f}',f'{lo:.5f}',f'{max(0,z) if prior else z:.6f}']);total+=1
    print(f'Wrote {total} physical model grid points to {a.output}. Original units: {arr.attrs.get("units","not declared")}.')
    if total<25:raise ValueError('Insufficient points from the selected field.')
if __name__=='__main__':
    try:main()
    except Exception as exc:print(f'GRIB/NetCDF extraction failed: {exc}',file=sys.stderr);sys.exit(2)
