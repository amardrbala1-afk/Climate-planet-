#!/usr/bin/env python3
"""Optional source-backed ERA5 historical chart production for Jerusalem winter dossiers.

Does NOT run in web request handlers. A registered CDS API key, accepted dataset
licence and internet connection are required. Without real ERA5 input, no maps
are produced, and manifest entries are not fabricated.

Example:
  pip install -r tools/requirements-era5.txt
  python tools/era5_historical.py --date 2013-12-12 --hour 12

Requested fields: 500 hPa geopotential (converted to dam) and 850 hPa
temperature (converted to °C), ERA5 reanalysis at selected UTC hour. The
selected time is NOT necessarily the storm peak. Never label a model analysis
as a direct measurement of snow depth.
"""
import argparse, datetime as dt, json, math, os, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image,ImageFilter,ImageDraw
from scipy.interpolate import LinearNDInterpolator

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from worldfile import WorldFile

COLORS={
 'z500':[(520,(82,39,130,220)),(528,(93,74,167,210)),(536,(59,107,208,192)),(552,(79,186,232,182)),(560,(0,0,0,0)),(800,(207,70,70,170))],
 't850':[(-1,(103,46,166,210)),(2,(39,76,185,200)),(6,(40,141,214,186)),(12,(76,178,220,175)),(16,(151,216,228,146)),(20,(0,0,0,0)),(300,(224,109,67,175))],
}
def request_era5(date, hour, target):
 try:import cdsapi
 except ImportError as e:raise RuntimeError('Missing cdsapi; pip install -r tools/requirements-era5.txt') from e
 if not (os.environ.get('CDSAPI_KEY') or Path.home().joinpath('.cdsapirc').is_file()):
  raise RuntimeError('A licensed Copernicus CDS account/API configuration is required (.cdsapirc or CDSAPI_KEY)')
 request={'product_type':['reanalysis'],'variable':['geopotential','temperature'],'pressure_level':['500','850'],
          'year':[f'{date.year:04d}'],'month':[f'{date.month:02d}'],'day':[f'{date.day:02d}'],
          'time':[f'{hour:02d}:00'],'area':[63,-11,9,48],
          'data_format':'grib','download_format':'unarchived'}
 cdsapi.Client().retrieve('reanalysis-era5-pressure-levels',request,str(target))
 if not target.is_file() or target.stat().st_size<4000:raise ValueError('ERA5 request returned no credible GRIB payload')
 return request

def parse_grib(path):
 try:import eccodes
 except ImportError as e:raise RuntimeError('eccodes Python bindings are required') from e
 result={}
 with open(path,'rb') as f:
  while True:
   gid=eccodes.codes_grib_new_from_file(f)
   if gid is None:break
   try:
    short=eccodes.codes_get(gid,'shortName');level=int(eccodes.codes_get(gid,'level'))
    if (short,level) not in {('z',500),('t',850)}:continue
    key='z500' if short=='z' else 't850'
    if key in result:raise ValueError('Duplicate ERA5 field for same time and pressure level')
    lat=eccodes.codes_get_array(gid,'latitudes');lon=eccodes.codes_get_array(gid,'longitudes');values=eccodes.codes_get_array(gid,'values')
    if len(values)<10000 or len(lat)!=len(lon) or len(lon)!=len(values):raise ValueError('Incomplete ERA5 grid')
    # geopotential m2/s2 -> geopotential height decameters; kelvin -> Celsius
    converted=values/(9.80665*10) if key=='z500' else values-273.15
    result[key]=(np.asarray(lon),np.asarray(lat),np.asarray(converted))
   finally:eccodes.codes_release(gid)
 if set(result)!={'z500','t850'}:raise ValueError('Both ERA5 500 hPa geopotential and 850 hPa temperature must be available')
 return result

def render_field(field,triplet,output):
 import scipy.ndimage
 lon,lat,values=triplet
 width,height=1350,round(1350*5625/4500)
 wf=WorldFile.read(ROOT/'tools/georef/europe.pgw');wf.verify('europe',4500,5625)
 yy,xx=np.mgrid[0:height,0:width]
 llon,llat=wf.image_to_lonlat((xx+.5)*4500/width,(yy+.5)*5625/height)
 lon=((lon+180)%360)-180
 interp=LinearNDInterpolator(np.column_stack([lon,lat]),values,fill_value=np.nan)
 sample=interp(llon,llat)
 if np.isfinite(sample).mean()<.68:raise ValueError('ERA5 field does not cover the calibrated Europe map extent')
 rgba=np.zeros((height,width,4),dtype=np.uint8)
 bounds=COLORS[field]
 for i,(bound,color) in enumerate(bounds):
  previous=bounds[i-1][0] if i else -math.inf
  if i==0:mask=sample<=bound
  else:mask=(sample>previous)&(sample<=bound)
  rgba[mask&np.isfinite(sample)]=color
 if field=='t850':
  # Mask ocean with land polygons instead of guessing from the topographic artwork.
  from shapely.geometry import shape
  from shapely.ops import unary_union
  from shapely import contains_xy
  geo=json.loads((ROOT/'tools/land/ne-110m-land.geojson').read_text());land=unary_union([shape(f['geometry']) for f in geo['features']])
  for y in range(0,height,128):
   end=min(y+128,height)
   rgba[y:end,:,3]=np.where(contains_xy(land,llon[y:end],llat[y:end]),rgba[y:end,:,3],0)
 overlay=Image.fromarray(rgba,'RGBA').filter(ImageFilter.GaussianBlur(1.1))
 bg=Image.open(ROOT/'site/images/maps/europe-base.webp').convert('RGBA').resize((width,height))
 composite=Image.alpha_composite(bg,overlay).convert('RGB')
 draw=ImageDraw.Draw(composite);draw.rectangle((22,22,width-22,105),fill='#071b2c')
 draw.text((40,43),f'Climate Planet  |  ERA5 {field}  |  {output.stem[:10]} UTC',fill='#dbedf4')
 composite.save(output,optimize=True)

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--date',required=True,help='YYYY-MM-DD')
 ap.add_argument('--hour',type=int,choices=[0,6,12,18],default=12)
 args=ap.parse_args();date=dt.date.fromisoformat(args.date)
 if date.year<1950 or date>dt.date.today():ap.error('Date must be in historical range 1950–today')
 if date.month not in (12,1,2):ap.error('Only Jerusalem winter months 12, 1, 2 are supported')
 with tempfile.TemporaryDirectory(prefix='climate-era5-') as td:
  target=Path(td)/'era5.grib';req=request_era5(date,args.hour,target);fields=parse_grib(target)
  dest=ROOT/'site/images/era5';dest.mkdir(parents=True,exist_ok=True)
  candidates=[]
  for field,values in fields.items():
   name=f'{date.isoformat()}-{args.hour:02d}utc-{field}.png';out=dest/name
   render_field(field,values,out)
   candidates.append({'date':date.isoformat(),'hourUTC':args.hour,'layer':field,'image':'/images/era5/'+name,
                      'source':'Copernicus Climate Change Service (C3S), ERA5 reanalysis','dataset':'reanalysis-era5-pressure-levels',
                      'kind':'model reanalysis; not observed snow depth'})
  path=ROOT/'data/era5-historical.json';existing=json.loads(path.read_text(encoding='utf8'))
  ids={(x['date'],x['hourUTC'],x['layer']) for x in candidates}
  merged=[x for x in existing if (x['date'],x['hourUTC'],x['layer']) not in ids]+candidates
  path.write_text(json.dumps(sorted(merged,key=lambda x:(x['date'],x['hourUTC'],x['layer']),reverse=True),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  print(json.dumps({'produced':len(candidates),'date':str(date),'hourUTC':args.hour,'source':'CDS ERA5','request':req},ensure_ascii=False))
if __name__=='__main__':
 try:main()
 except Exception as e:
  print('ERA5 historical render failed: '+str(e),file=sys.stderr);sys.exit(2)
