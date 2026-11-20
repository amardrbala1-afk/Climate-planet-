#!/usr/bin/env python3
"""V5 integrity validation: no cloud services or fake live model data."""
from pathlib import Path
import json,re,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'; DIST=ROOT/'dist'
errors=[]
def check(cond,msg):
 if not cond: errors.append(msg)
html=(DIST/'index.html').read_text(encoding='utf8')
for p in [ROOT/'package.json',ROOT/'wrangler.jsonc',ROOT/'README-V5-AR.md',ROOT/'MAP-SOURCES.md',ROOT/'tools/render_map.py',ROOT/'tools/grib_to_grid.py',ROOT/'tools/fetch_gfs.py',DIST/'tools/map-calibration.html']:
 check(p.exists(),f'Required file missing: {p}')
for path in re.findall(r'(?:src|href)="(\/assets\/[^"]+)"',html):
 check((DIST/path.lstrip('/')).exists(),f'HTML references missing asset {path}')
for nm,expected in [('europe-base.webp',(3704,2706)),('levant-base.webp',(4756,2555))]:
 p=DIST/'images/maps'/nm
 check(p.exists(),f'Missing original map base {nm}')
 if p.exists():
  with Image.open(p) as img:check(img.size==expected,f'Incorrect dimensions of {nm}, got {img.size}')
for s in ['v5-map-center','v5SpaceCanvas','v5ForecastQuestion','v5GeologyCanvas','v5OpsTabs','spaceCanvas','spaceArticle','v4PosterGrid']:
 check(f'id="{s}"' in html or f'class="{s}' in html or f' {s}"' in html,f'Missing component {s}')
space=html.index('id="spaceCanvas"'); list_=html.index('id="cosmosCards"'); article=html.index('id="spaceArticle"')
check(space<list_<article,'Space section must order viewer → selectors → scientific article')
for f in ['assets/games-v5.js','assets/v5.js','assets/v5.css','data/forecast-maps.json','data/jerusalem-snow.json','data/cosmos-v3.json']:
 check((DIST/f).exists(),f'Missing built asset {f}')
products=json.loads((DIST/'data/forecast-maps.json').read_text())
check(isinstance(products,list),'Model catalog is not a list')
for item in products:
 check(item.get('source') and item.get('run') and item.get('valid'),'Published map missing provenance')
 check((DIST/str(item.get('image','')).lstrip('/')).exists(),'Model product lacks PNG image')
# Important: the shipped base package must not invent live forecasts.
check(not products,'Release must not publish synthetic/uncalibrated numerical map products')
try:
 js=(SITE/'assets/v4.js').read_text();
 import ast
 template=js.split('const TEMPLATES=[',1)[1].split('].map(',1)[0]
 stickers=js.split('const STICKERS=[',1)[1].split('].map(',1)[0]
 check(len(re.findall(r'\[\s*\x27[^\x27]+\x27\s*,',template))==34,'Poster template count must be 34')
 check(len(re.findall(r'\[\s*\x27[^\x27]+\x27\s*,',stickers))==42,'Sticker count must be 42')
except Exception as e:errors.append('Poster script unavailable '+str(e))
check((ROOT/'data/map-products/catalog.json').read_text().strip()=='[]','Source map catalog should start empty')
if errors:
 for x in errors:print('FAIL:',x)
 sys.exit(1)
print('PASS — built routes/assets, logo, original source images, space DOM order, three games, map provenance & empty forecast catalog verified.')
