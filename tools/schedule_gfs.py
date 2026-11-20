#!/usr/bin/env python3
"""V8 GFS: source-verified 0..72h frames, 6-hour rain and derived accumulations.

Publish is atomic at the Git commit level: the workflow commits only after this
script has verified every requested PNG/catalog entry. Existing published maps
remain untouched if a job fails. Every cumulative product sums verified RAW
6-hour gridded values, never coloured pixels.
"""
from __future__ import annotations
import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HOURS=tuple(range(0,73,6))
FIELDS=(('europe','z500'),('europe','t850'),('levant','t2m'))
ACCUM_WINDOWS=(12,24,48,72)

def tasks():
    return [(region,field,h,None) for h in HOURS for region,field in FIELDS] + [
        ('levant','rain',h,6) for h in HOURS if h>0]

def sid(region,field,date,cycle,hour,accum):
    base=f'gfs-{region}-{field}-{date}{cycle}-f{hour:03d}'
    return base+(f'-a{accum:03d}' if field=='rain' and accum!=6 else '')

def verify_product(region,field,date,cycle,hour,accum):
    name=sid(region,field,date,cycle,hour,accum)
    catalog=ROOT/'data/map-products/catalog.json'
    rows=json.loads(catalog.read_text(encoding='utf8'))
    hits=[r for r in rows if r.get('id')==name]
    if len(hits)!=1:raise ValueError(f'CATALOG ERROR {name}: {len(hits)} matches')
    row=hits[0]
    if row.get('model')!='GFS' or row.get('region')!=region or row.get('field')!=field or int(row.get('forecastHour',-1))!=hour:
        raise ValueError(f'Incorrect field or hour: {name}')
    if field=='rain' and int(row.get('accumHours',-1))!=accum:raise ValueError(f'Bad accumulation window: {name}')
    expected='/images/maps/forecast/'+name+'.png'
    if row.get('image')!=expected:raise ValueError(f'Incorrect image path: {name}')
    png=ROOT/'site'/expected.lstrip('/')
    if not png.is_file() or png.stat().st_size<200 or png.read_bytes()[:8]!=b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'Missing or invalid PNG: {name}')
    return name

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--date',help='UTC YYYYMMDD; defaults to newest likely available')
    p.add_argument('--cycle',choices=['00','06','12','18'])
    p.add_argument('--dry-run',action='store_true')
    p.add_argument('--hours',type=int,default=72,choices=[6,12,18,24,30,36,42,48,54,60,66,72],help='Coverage for tests; production defaults to 72h')
    p.add_argument('--allow-partial',action='store_true',help='Legacy option ignored: fail closed')
    args=p.parse_args(argv)
    ref=datetime.now(timezone.utc)-timedelta(hours=5)
    date=args.date or ref.strftime('%Y%m%d');cycle=args.cycle or f'{ref.hour//6*6:02d}'
    date_dt=datetime.strptime(date,'%Y%m%d')
    if date_dt.year<2020 or date_dt.year>datetime.now(timezone.utc).year+1:p.error('Invalid model date')
    planned=[t for t in tasks() if t[2]<=args.hours]
    windows=[a for a in ACCUM_WINDOWS if a<=args.hours]
    if args.dry_run:
        print(f'V8 DRY RUN: run={date} {cycle}Z, hours=0..{args.hours} every 6h, tasks={len(planned)}')
        for r,f,h,a in planned:print(f'CHECK {r} {f} +{h:03d}'+(f' accumulation {a}h' if a else ''))
        print('Cumulative windows:',windows,'(built from verified raw six-hour series)')
        return 0
    with tempfile.TemporaryDirectory(prefix='climate-v8-grids-') as td:
        cache=Path(td);failures=[]
        for i,(region,field,h,accum) in enumerate(planned,1):
            cmd=[sys.executable,str(ROOT/'tools/publish_gfs.py'),'--date',date,'--cycle',cycle,'--region',region,
                '--field',field,'--forecast-hour',str(h),'--pixels','1450']
            if accum:cmd+=['--accum-hours',str(accum),'--cache-precip-dir',str(cache)]
            print(f'[{i:02d}/{len(planned)}] {region} {field} +{h:03d} UTC cycle {date}{cycle}',flush=True)
            result=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=480)
            print(result.stdout[-5000:],flush=True)
            if result.returncode:failures.append((region,field,h,str(result.returncode)));break
            try:verify_product(region,field,date,cycle,h,accum)
            except ValueError as exc:failures.append((region,field,h,str(exc)));break
        if failures:
            print('::error::Forecast batch incomplete; no Git publication',failures,flush=True)
            return 2
        if windows:
            cmd=[sys.executable,str(ROOT/'tools/aggregate_rain.py'),'--cache-dir',str(cache),'--date',date,
                '--cycle',cycle,'--max-hour',str(args.hours),'--windows',*map(str,windows)]
            result=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=1800)
            print(result.stdout[-6000:],flush=True)
            if result.returncode:
                print('::error::Cumulative rainfall generation failed; no Git publication',flush=True)
                return 2
        for h in range(0,args.hours+1,6):
            for r,f in FIELDS:verify_product(r,f,date,cycle,h,None)
            if h>0:verify_product('levant','rain',date,cycle,h,6)
        for window in windows:
            for h in range(window,args.hours+1,6):
                verify_product('levant','rain',date,cycle,h,window)
        subprocess.run([sys.executable,str(ROOT/'tools/prune_forecasts.py')],check=True)
        print('V8_COMPLETE: verified every instantaneous, 6-hour and cumulative product',flush=True)
        return 0

if __name__=='__main__':raise SystemExit(main())
