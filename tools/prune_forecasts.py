#!/usr/bin/env python3
"""Retain a small, verified forecast catalog; prevents repository bloat.

Only deletes generated files whose name is explicitly in the removed catalog
records and located underneath site/images/maps/forecast. Does not touch
manual editorial maps or records from other models.
"""
from pathlib import Path
from collections import defaultdict
import json
ROOT=Path(__file__).resolve().parents[1]
CAT=ROOT/'data/map-products/catalog.json'
OUT=ROOT/'site/images/maps/forecast'

def prune(keep=3):
    records=json.loads(CAT.read_text(encoding='utf-8'))
    buckets=defaultdict(list); retained=[]; removed=[]
    for rec in records:
        if rec.get('model')!='GFS':
            retained.append(rec);continue
        buckets[(rec.get('region'),rec.get('field'),rec.get('forecastHour'))].append(rec)
    for key,entries in buckets.items():
        # Deduplicate by id; newest run first.
        entries.sort(key=lambda rec:(str(rec.get('run','')),str(rec.get('id',''))),reverse=True)
        retained.extend(entries[:keep]);removed.extend(entries[keep:])
    keep_img={str(r.get('image','')) for r in retained}
    for rec in removed:
        img=str(rec.get('image',''))
        if not img.startswith('/images/maps/forecast/') or img in keep_img:continue
        path=ROOT/'site'/img.lstrip('/')
        if path.parent==OUT and path.suffix.lower()=='.png':path.unlink(missing_ok=True)
    retained.sort(key=lambda x:(str(x.get('run','')),int(x.get('forecastHour',0))),reverse=True)
    CAT.write_text(json.dumps(retained,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'Kept {len(retained)} verified forecasts; pruned {len(removed)} old GFS records')

if __name__=='__main__':prune()
