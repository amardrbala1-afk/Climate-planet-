#!/usr/bin/env python3
"""Scheduled publication from NOAA NOMADS after usual forecast availability.

This script never fabricates weather data. Each product must pass GRIB metadata,
world-file calibration, field/interval verification and raster coverage checks.
GitHub Actions provides internet access; the current offline environment cannot.
"""
import argparse
from datetime import datetime,timedelta,timezone
import subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TASKS=[('europe','z500',24,None),('europe','t850',24,None),('levant','t2m',24,None),('levant','rain',6,6)]

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--date',help='YYYYMMDD UTC, default newest likely published run')
    p.add_argument('--cycle',choices=('00','06','12','18'))
    p.add_argument('--dry-run',action='store_true')
    p.add_argument('--allow-partial',action='store_true',help='Keep successful products even if other products fail')
    args=p.parse_args()
    reference=datetime.now(timezone.utc)-timedelta(hours=5)
    cycle=args.cycle or f'{reference.hour//6*6:02d}'
    date=args.date or reference.strftime('%Y%m%d')
    success=0;errors=[]
    for region,field,hour,accum in TASKS:
        cmd=[sys.executable,str(ROOT/'tools/publish_gfs.py'),'--date',date,'--cycle',cycle,'--region',region,'--field',field,'--forecast-hour',str(hour)]
        if accum:cmd+=['--accum-hours',str(accum)]
        if args.dry_run:cmd+=['--dry-run']
        print(f'\n>>> {region} {field} f{hour:03d} {date} {cycle}Z',flush=True)
        try:subprocess.run(cmd,check=True,timeout=250);success+=1
        except (subprocess.CalledProcessError,subprocess.TimeoutExpired) as exc:
            print('NOT PUBLISHED:',exc,file=sys.stderr);errors.append((region,field))
    if not args.dry_run and success:
        subprocess.run([sys.executable,str(ROOT/'tools/prune_forecasts.py')],check=True)
    print(f'Finished: {success}/{len(TASKS)} {"requests validated" if args.dry_run else "products processed"}; failed {errors}')
    if (errors and not args.allow_partial) or success==0:raise SystemExit(2)
if __name__=='__main__':main()
