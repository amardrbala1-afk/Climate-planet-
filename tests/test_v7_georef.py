#!/usr/bin/env python3
"""Map V7 alignment and render smoke test using SYNTHETIC data in a temp repo.
No synthetic weather layer is copied to production site or forecast catalog.
"""
import sys,subprocess,tempfile,shutil,csv,json
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from worldfile import WorldFile

EXPECTED={'europe':((4500,5625),(-10.60,63.11,47.55,9.26)),
          'levant':((3240,4050),(24.0,47.72,53.07,17.80))}

def assert_lonlat(region,lon,lat):
    wf=WorldFile.read(ROOT/'tools/georef'/f'{region}.pgw');w,h=EXPECTED[region][0]
    px,py=wf.lonlat_to_image(lon,lat)
    out=wf.image_to_lonlat(px,py)
    assert np.allclose(out,(lon,lat),atol=1e-8),(region,out,lon,lat)
    assert 0<=px<w and 0<=py<h,(region,px,py)

for region,(wh,bounds) in EXPECTED.items():
    img=Image.open(ROOT/'site/images/maps'/f'{region}-base.webp')
    assert img.size==wh,('Image/world file dimensions mismatch',region,img.size,wh)
    wf=WorldFile.read(ROOT/'tools/georef'/f'{region}.pgw')
    got=wf.verify(region,*wh)
    assert np.allclose(got,bounds,atol=.13)
    print(region,'PASS image',wh,'bounds',got)
for reg,lon,lat in [('europe',2.35,48.85),('europe',35.22,31.77),('levant',35.22,31.77),('levant',36.29,33.51)]:
    assert_lonlat(reg,lon,lat)
print('PASS EPSG:3857 inverse location round trips')

# The renderer is tested in an isolated directory; never insert TEST field into public catalog.
with tempfile.TemporaryDirectory(prefix='cp-v7-map-test-') as d:
    root=Path(d)
    for sub in ['tools','tools/land','tools/georef','site/images/maps/forecast','data/map-products']:
        (root/sub).mkdir(parents=True,exist_ok=True)
    for filename in ['render_map.py','worldfile.py']:
        shutil.copy2(ROOT/'tools'/filename,root/'tools'/filename)
    shutil.copy2(ROOT/'tools/land/ne-110m-land.geojson',root/'tools/land/ne-110m-land.geojson')
    shutil.copy2(ROOT/'tools/georef/levant.pgw',root/'tools/georef/levant.pgw')
    shutil.copy2(ROOT/'site/images/maps/levant-base.webp',root/'site/images/maps/levant-base.webp')
    (root/'data/map-products/catalog.json').write_text('[]',encoding='utf-8')
    csvpath=root/'test-grid.csv'
    with csvpath.open('w',newline='',encoding='utf-8') as file:
        w=csv.writer(file);w.writerow(['lat','lon','value'])
        for lat in range(17,50):
            for lon in range(23,55):
                w.writerow([lat,lon,5+abs(lat-32)*.23+abs(lon-37)*.35])
    run=[sys.executable,str(root/'tools/render_map.py'),'--csv',str(csvpath),'--region','levant','--field','rain','--model','GFS','--run','2026-11-20T00','--forecast-hour','6','--accum-hours','6','--unit','mm','--source','TEST ONLY - never publish','--pixels','750']
    proc=subprocess.run(run,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=120)
    assert proc.returncode==0,proc.stderr+'\n'+proc.stdout
    records=json.loads((root/'data/map-products/catalog.json').read_text())
    assert len(records)==1 and records[0]['georeference'].startswith('PGW')
    over=Image.open(root/'site/images/maps/forecast'/records[0]['image'].split('/')[-1]).convert('RGBA')
    factor=over.width/3240
    wf=WorldFile.read(ROOT/'tools/georef/levant.pgw')
    def alpha(lon,lat):
        x,y=wf.lonlat_to_image(lon,lat)
        return over.getpixel((min(over.width-1,max(0,int(x*factor))),min(over.height-1,max(0,int(y*factor)))))[3]
    print('Sea alpha',alpha(30,34),'Damascus alpha',alpha(36.3,33.5))
    assert alpha(30,34)==0,'Rain must not appear over Mediterranean sea'
    assert alpha(36.3,33.5)>0,'Rain should remain visible over Damascus land'
    print('PASS synthetic fixture renderer and precise coastline-mask smoke test')
cat=json.loads((ROOT/'data/map-products/catalog.json').read_text(encoding='utf8'))
assert not any('TEST ONLY' in str(x) for x in cat),'Do not publish fixture as genuine weather'
print('PASS production catalog clean of synthetic weather')
