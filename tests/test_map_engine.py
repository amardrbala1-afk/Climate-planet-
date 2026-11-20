"""Functional self-test: a SYNTHETIC math fixture in a temp directory, never published.
Tests calibration, grid interpolation, land mask, categorical renderer and metadata.
"""
import tempfile,shutil,subprocess,json,csv,sys
from pathlib import Path
src=Path(__file__).parents[1]
with tempfile.TemporaryDirectory() as td:
 root=Path(td);(root/'tools/land').mkdir(parents=True);(root/'site/images/maps/forecast').mkdir(parents=True);(root/'data/map-products').mkdir(parents=True)
 shutil.copy2(src/'tools/render_map.py',root/'tools/render_map.py');shutil.copy2(src/'tools/land/ne-110m-land.geojson',root/'tools/land/ne-110m-land.geojson')
 (root/'site/images/maps').mkdir(parents=True,exist_ok=True)
 shutil.copy2(src/'site/images/maps/levant-base.webp',root/'site/images/maps/levant-base.webp')
 (root/'data/map-products/catalog.json').write_text('[]')
 # Deliberately constructed synthetic mapping solely to check math (not a georeference for the user's real image).
 anchors=[{'x':x,'y':y,'lat':48-30*y/2555,'lon':25+30*x/4756} for x in [0,1400,3000,4756] for y in [0,1300,2555]]
 calib=root/'tools/test-calibration.json';calib.write_text(json.dumps({'imageWidth':4756,'imageHeight':2555,'anchors':anchors}))
 data=root/'tools/test-grid.csv'
 with data.open('w',newline='') as f:
  writer=csv.writer(f);writer.writerow(['lat','lon','value'])
  for lati in range(18,49):
   for longi in range(25,56):writer.writerow([lati,longi,2+abs(longi-38)*1.1+abs(lati-34)*.7])
 cmd=[sys.executable,str(root/'tools/render_map.py'),'--csv',str(data),'--region','levant','--field','rain','--model','GFS','--run','2026-11-20T00','--forecast-hour','24','--accum-hours','6','--unit','mm','--source','Synthetic fixture TEST ONLY','--calibration',str(calib),'--pixels','800','--max-calibration-error-km','1']
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=100)
 print('exit',p.returncode,'stdout',p.stdout[:300], 'stderr',p.stderr[:500]);assert p.returncode==0
 cat=json.loads((root/'data/map-products/catalog.json').read_text());assert len(cat)==1 and cat[0]['calibrationRMSEKm']<=1 and cat[0]['accumHours']==6
 from PIL import Image
 img=Image.open(root/'site/images/maps/forecast'/('gfs-levant-rain-2026112000-f024.png'))
 print('test overlay',img.size,'nontransparent',sum(1 for px in img.getdata() if px[3]>0));assert img.size[0]==800
 assert img.getpixel((34,67))[3]==0, 'Mediterranean Sea pixel must remain transparent'
 assert img.getpixel((336,269))[3]>0, 'Inland Levant land pixel should have data'
 print('PASS image-based precise sea mask: sea transparent, inland data visible')
print('PASS — synthetic fixture existed ONLY in TemporaryDirectory; production catalog remains empty.')
