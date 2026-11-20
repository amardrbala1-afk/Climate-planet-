#!/usr/bin/env python3
"""Combine *verified raw* 6-hour NOAA APCP grids into 12/24/48/72h maps.

Each component is decoded and validated by publish_gfs.py. Frames from one
run must have identical geolocation arrays and finite non-negative values.
We never sum already coloured/rendered pixels or combine different cycles.
"""
from __future__ import annotations
import argparse
import csv
import subprocess
import sys
import tempfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
WINDOWS=(12,24,48,72)

def read_grid(path):
    if not path.is_file():raise ValueError(f'Missing verified six-hour grid: {path.name}')
    data=np.loadtxt(path,delimiter=',',skiprows=1,dtype=np.float64)
    if data.ndim!=2 or data.shape[1]!=3 or len(data)<50:raise ValueError(f'Invalid grid: {path.name}')
    if not np.all(np.isfinite(data)) or np.any(data[:,2]<-1e-4):raise ValueError('Nonfinite or negative raw APCP')
    return data

def aggregate(cache,window,end):
    hours=range(end-window+6,end+1,6)
    first=None;total=None
    for h in hours:
        data=read_grid(cache/f'rain-f{h:03d}.csv')
        if first is None:
            first=data[:,:2].copy();total=np.zeros(len(data),dtype=np.float64)
        elif data.shape!= (len(first),3) or not np.allclose(first,data[:,:2],rtol=0,atol=1e-6):
            raise ValueError(f'Grid coordinates differ at f{h:03d}, accumulation cannot be combined')
        total+=np.clip(data[:,2],0,None)
    if len(tuple(hours))!=window//6:raise ValueError('Incomplete rain window')
    return first,total

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--cache-dir',type=Path,required=True)
    p.add_argument('--date',required=True)
    p.add_argument('--cycle',required=True)
    p.add_argument('--max-hour',type=int,default=72)
    p.add_argument('--windows',nargs='+',type=int,choices=WINDOWS,default=WINDOWS)
    args=p.parse_args()
    if args.max_hour%6 or args.max_hour>72:raise SystemExit('max-hour must be a six-hour step <=72')
    for window in sorted(set(args.windows)):
        for end in range(window,args.max_hour+1,6):
            coords,amount=aggregate(args.cache_dir,window,end)
            with tempfile.TemporaryDirectory(prefix='v8-rain-') as tmp:
                f=Path(tmp)/'accum.csv'
                with f.open('w',newline='',encoding='utf8') as fp:
                    w=csv.writer(fp);w.writerow(['lat','lon','value'])
                    for (lat,lon),value in zip(coords,amount):w.writerow((lat,lon,value))
                cmd=[sys.executable,str(ROOT/'tools/render_map.py'),'--csv',str(f),'--region','levant','--field','rain',
                     '--model','GFS','--run',f'{args.date[:4]}-{args.date[4:6]}-{args.date[6:8]}T{args.cycle}',
                     '--forecast-hour',str(end),'--accum-hours',str(window),'--unit','mm',
                     '--source','NOAA NOMADS GFS 0.25° (sum of verified 6h APCP)','--pixels','1450']
                subprocess.run(cmd,check=True,timeout=240)
            print(f'ACCUM VERIFIED (from source grids): {window}h ending +{end:03d}, {amount.max():.1f} mm max',flush=True)

if __name__=='__main__':main()
