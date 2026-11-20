#!/usr/bin/env python3
"""Climate Planet V7 — produce a provenance-tagged, georeferenced overlay from data CSV.

This does not download or infer model forecasts. It fails closed if the PNG
world-file footprint is incorrect, the field unit is unknown, or model coverage
is too sparse. All published maps are reproducible from the supplied CSV and GCPs.

Example (after completing calibration, using real, gridded GFS data):
 python tools/render_map.py --csv my_gfs_t850.csv --region europe --field t850 \
   --model GFS --run 2026-11-20T00 --forecast-hour 48 --unit K \
   --calibration tools/calibration/europe.json --source 'NOAA GFS via NOMADS'
"""
import argparse, csv, datetime as dt, json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy.interpolate import LinearNDInterpolator, RegularGridInterpolator
from scipy.ndimage import binary_closing
from shapely.geometry import shape, box
from shapely.ops import unary_union
from shapely import contains_xy
from worldfile import WorldFile

ROOT=Path(__file__).resolve().parents[1]
BASE={'europe':(4500,5625,{'z500','t850'}),'levant':(3240,4050,{'t2m','rain'})}
COLORS={'z500':[(lambda x:x<520,(53,27,89,228)),(lambda x:((x >= 520) & (x < 528)),(109,59,182,215)),(lambda x:((x >= 528) & (x < 536)),(41,90,190,204)),(lambda x:((x >= 536) & (x < 552)),(76,172,224,207)),(lambda x:((x >= 552) & (x < 560)),(0,0,0,0)),(lambda x:x>=560,(206,69,77,220))],
        't850':[(lambda x:x<=0,(113,47,163,220)),(lambda x:((x > 0) & (x <= 2)),(25,57,149,221)),(lambda x:((x > 2) & (x <= 6)),(32,111,207,215)),(lambda x:((x > 6) & (x <= 12)),(75,176,220,211)),(lambda x:((x > 12) & (x <= 16)),(155,216,232,171)),(lambda x:((x > 16) & (x < 20)),(0,0,0,0)),(lambda x:x>=20,(215,113,58,216))],
        't2m':[(lambda x:x<=0,(139,46,187,225)),(lambda x:((x > 0) & (x <= 2)),(17,61,177,220)),(lambda x:((x > 2) & (x <= 4)),(38,145,216,212)),(lambda x:((x > 4) & (x <= 6)),(117,202,237,192)),(lambda x:((x > 6) & (x <= 10)),(170,208,99,169)),(lambda x:x>10,(0,0,0,0))],
        'rain':[(lambda x:x<1,(0,0,0,0)),(lambda x:((x >= 1) & (x < 10)),(235,216,50,238)),(lambda x:((x >= 10) & (x < 30)),(239,141,42,235)),(lambda x:((x >= 30) & (x < 100)),(219,49,59,236)),(lambda x:((x >= 100) & (x < 120)),(154,38,75,235)),(lambda x:x>=120,(124,50,180,239))]}

def calibration_fit(path,source_width,source_height,max_error):
    obj=json.loads(Path(path).read_text(encoding='utf8')); anchors=obj.get('anchors',[])
    if obj.get('imageWidth')!=source_width or obj.get('imageHeight')!=source_height:
        raise ValueError('Calibration source pixel dimensions do not match the attached map. Refusing to shift weather data.')
    if len(anchors)<4:raise ValueError('At least four matched control points are required, prefer 10–15 distributed across the image.')
    xy=np.array([(float(a['x'])/source_width,float(a['y'])/source_height) for a in anchors]);ll=np.array([(float(a['lat']),float(a['lon'])) for a in anchors]);
    if not np.all(np.isfinite(xy)) or not np.all(np.isfinite(ll)):raise ValueError('Non-finite calibration control points')
    if any(np.any(xy<0,axis=1)) or any(np.any(xy>1,axis=1)):raise ValueError('Pixel position out of bounds')
    quadratic=len(anchors)>=9
    def design(x,y):return np.column_stack([np.ones_like(x),x,y,x*x,x*y,y*y]) if quadratic else np.column_stack([np.ones_like(x),x,y])
    a=design(xy[:,0],xy[:,1]);coef,_,rank,_=np.linalg.lstsq(a,ll,rcond=None)
    if rank<a.shape[1]:raise ValueError('Reference anchors are collinear/ill-conditioned. Spread them over the map.')
    pred=a@coef;dy=(pred[:,0]-ll[:,0])*111.2;dx=(pred[:,1]-ll[:,1])*111.2*np.cos(np.deg2rad(ll[:,0]));dist=np.hypot(dx,dy)
    error=float(np.sqrt(np.mean(dist**2)));worst=float(np.max(dist))
    if error>max_error:raise ValueError(f'Calibration RMSE {error:.1f} km exceeds permitted {max_error:.1f} km; refine the anchor positions. Worst anchor: {worst:.1f} km')
    return coef,design,error,worst

def read_csv(path):
    points=[];values=[]
    with open(path,encoding='utf-8-sig',newline='') as fh:
        rows=csv.DictReader(fh);columns=set(rows.fieldnames or ())
        if not {'lat','lon','value'}<=columns and not {'latitude','longitude','value'}<=columns:
            raise ValueError('CSV must have lat, lon, value (or latitude, longitude, value) headers.')
        for row in rows:
            try:la=float(row.get('lat',row.get('latitude')));lo=float(row.get('lon',row.get('longitude')));v=float(row['value'])
            except (ValueError,TypeError):continue
            if abs(la)>90 or abs(lo)>360 or not np.isfinite(v):continue
            if lo>180:lo-=360
            points.append((lo,la));values.append(v)
    if len(points)<25:raise ValueError('Insufficient valid grid samples (need at least 25): no map is published')
    pts=np.array(points);vs=np.array(values)
    # Duplicate (lat,lon) points make triangulation unstable: keep first.
    pts,ids=np.unique(pts,axis=0,return_index=True);vs=vs[ids]
    return pts,vs

def read_interp(points,values):
    xs=np.unique(points[:,0]);ys=np.unique(points[:,1]);
    if len(xs)*len(ys)==len(values):
        arr=np.full((len(ys),len(xs)),np.nan)
        ix=np.searchsorted(xs,points[:,0]);iy=np.searchsorted(ys,points[:,1]);arr[iy,ix]=values
        if np.all(np.isfinite(arr)):
            reg=RegularGridInterpolator((ys,xs),arr,bounds_error=False,fill_value=np.nan)
            return lambda lon,lat:reg(np.column_stack([lat.ravel(),lon.ravel()])).reshape(lat.shape)
    lin=LinearNDInterpolator(points,values,fill_value=np.nan)
    return lambda lon,lat:lin(lon,lat)

def value_units(v,field,unit):
    units={'z500':{'m','dam','geopotential'},'t850':{'K','C'},'t2m':{'K','C'},'rain':{'mm'}}
    if unit not in units[field]:raise ValueError('Unit '+unit+' invalid for '+field+'; use '+','.join(sorted(units[field])))
    if field=='z500':return v/10 if unit=='m' else v/9.80665/10 if unit=='geopotential' else v
    if field in ('t850','t2m'):return v-273.15 if unit=='K' else v
    return v

def land_geometry():
    src=ROOT/'tools/land/ne-110m-land.geojson';data=json.loads(src.read_text());return unary_union([shape(x['geometry']) for x in data['features']])

def main():
    ap=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    for flag in ['csv','region','field','model','run','unit','source']:ap.add_argument('--'+flag,required=True)
    ap.add_argument('--calibration',help='Legacy GCP JSON; only for older maps')
    ap.add_argument('--worldfile',help='Owner-supplied PNG world file (.pgw), assumed EPSG:3857; default tools/georef/REGION.pgw')
    ap.add_argument('--forecast-hour',required=True,type=int);ap.add_argument('--accum-hours',type=int);ap.add_argument('--pixels',type=int,default=1800);ap.add_argument('--max-calibration-error-km',type=float,default=15)
    args=ap.parse_args();a=args
    if a.region not in BASE:ap.error('region must be europe or levant')
    nativeW,nativeH,permitted=BASE[a.region]
    if a.field not in permitted:ap.error('field/region combination not supported')
    if a.model not in ('ECMWF','GFS','ICON'):ap.error('model must be ECMWF, GFS or ICON')
    if a.forecast_hour<0 or a.forecast_hour>384:ap.error('forecast hour is out of supported range')
    if a.field=='rain' and (a.accum_hours not in (6,12,18,24,48,72) or a.forecast_hour<a.accum_hours):
        ap.error('precipitation must provide --accum-hours 6,12,18,24,48 or 72; input CSV must contain that specific interval, not an entire-run total')
    try:run=dt.datetime.strptime(a.run,'%Y-%m-%dT%H').replace(tzinfo=dt.timezone.utc)
    except ValueError:ap.error('--run must be YYYY-MM-DDTHH, UTC')
    if not 750<=a.pixels<=3000:ap.error('pixels must be in 750–3000')
    worldfile=Path(a.worldfile) if a.worldfile else ROOT/'tools/georef'/f'{a.region}.pgw'
    if worldfile.is_file():
        wf=WorldFile.read(worldfile);extent=wf.verify(a.region,nativeW,nativeH)
        rmse=maxerr=None
        georef='PGW (EPSG:3857 assumed and extent checked)'
    elif a.calibration:
        coef,design,rmse,maxerr=calibration_fit(a.calibration,nativeW,nativeH,a.max_calibration_error_km)
        georef='GCP / fitted lat-lon'
    else:raise ValueError('No verified source map world file found. Refusing to publish')
    pts,vs=read_csv(a.csv);vs=value_units(vs,a.field,a.unit)
    if a.field=='rain' and np.nanmin(vs)<-.001:ap.error('negative precipitation data; ensure correct interval')
    interp=read_interp(pts,vs)
    width=a.pixels;height=round(width*nativeH/nativeW)
    # Squares are intentionally adjacent, not shadows or artificial precipitation blobs.
    block=12 if a.field=='rain' else 1
    ww=math.ceil(width/block);hh=math.ceil(height/block)
    xx=((np.arange(ww)+.5)*block/width).clip(0,1);yy=((np.arange(hh)+.5)*block/height).clip(0,1)
    xx,yy=np.meshgrid(xx,yy)
    if worldfile.is_file():
        # .pgw coefficients refer to *centres* of pixels; no guessed lat-lon scaling.
        lon,lat=wf.image_to_lonlat(xx*nativeW-.5,yy*nativeH-.5)
    else:
        gl=design(xx.ravel(),yy.ravel())@coef;lat=gl[:,0].reshape(hh,ww);lon=gl[:,1].reshape(hh,ww)
    vals=interp(lon,lat)
    alpha=np.isfinite(vals)
    # A malformed or wrong-area grid must never be published as a blank or deceptive forecast.
    cover=float(np.mean(alpha))
    if cover<.60:raise ValueError(f'Only {cover:.0%} of the raster is covered by data; verify coordinates, model domain and calibration')
    if a.field=='rain':
        vals=np.repeat(np.repeat(vals,block,axis=0),block,axis=1)[:height,:width]
        lat=np.repeat(np.repeat(lat,block,axis=0),block,axis=1)[:height,:width]
        lon=np.repeat(np.repeat(lon,block,axis=0),block,axis=1)[:height,:width]
    arr=np.zeros((*vals.shape,4),dtype=np.uint8)
    for predicate,color in COLORS[a.field]:
        m=predicate(vals)&np.isfinite(vals);arr[m]=color
    if a.field=='z500':
        # Light 4-dam height contours, computed from the actual field values.
        # Preserve data coverage mask; these strokes are visualization only.
        steps=np.floor(vals/4)
        mask=np.zeros(vals.shape,dtype=bool)
        mask[:,1:] |= (steps[:,1:]!=steps[:,:-1]) & np.isfinite(vals[:,1:]) & np.isfinite(vals[:,:-1])
        mask[1:,:] |= (steps[1:,:]!=steps[:-1,:]) & np.isfinite(vals[1:,:]) & np.isfinite(vals[:-1,:])
        arr[mask]=(197,230,242,125)
    if a.field in ('rain','t850','t2m'):
        # Original user-supplied map bases encode their seas in a distinct, dark
        # cyan palette. An image-derived coastline mask is noticeably more exact
        # than a low-resolution world polygon at coastlines and islands. It is
        # an artwork mask, not an authoritative geographical shoreline dataset.
        original=ROOT/'site/images/maps'/f'{a.region}-base.webp'
        if original.is_file():
            with Image.open(original) as src:
                rgb=np.asarray(src.convert('RGB').resize((arr.shape[1],arr.shape[0]),Image.Resampling.LANCZOS)).astype(np.int16)
            r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
            sea=(b>g+2)&(b>r*1.12)&(b>19)&(g>12)
            # Close tiny isolated dark-water holes caused by border labels or
            # compressed terrain textures, without erasing larger inland lakes.
            sea=binary_closing(sea,structure=np.ones((3,3)),border_value=0)
            arr[sea,3]=0
        else:
            # Fallback for minimal installations without bundled map artwork.
            geom=land_geometry()
            mask=contains_xy(geom,lon.ravel(),lat.ravel()).reshape(vals.shape)
            arr[~mask,3]=0
    if a.field!='rain':
        # Soft two-pixel antialiasing for atmospheric boundaries; never modify data before classification.
        out=Image.fromarray(arr,'RGBA').filter(ImageFilter.GaussianBlur(1.3))
    else:out=Image.fromarray(arr,'RGBA')
    sid=f'{a.model.lower()}-{a.region}-{a.field}-{run:%Y%m%d%H}-f{a.forecast_hour:03d}'
    if a.field=='rain' and a.accum_hours!=6: sid+=f'-a{a.accum_hours:03d}'
    loc=ROOT/'site/images/maps/forecast';loc.mkdir(parents=True,exist_ok=True)
    path=loc/f'{sid}.png';out.save(path,optimize=True)
    catalog=ROOT/'data/map-products/catalog.json';data=json.loads(catalog.read_text());data=[x for x in data if x.get('id')!=sid]
    valid=run+dt.timedelta(hours=a.forecast_hour)
    labels={'z500':'ارتفاعات 500 hPa','t850':'حرارة 850 hPa','t2m':'حرارة 2m','rain':'تراكم الأمطار'}
    item={'id':sid,'region':a.region,'field':a.field,'label':labels[a.field],'model':a.model,'run':run.strftime('%Y-%m-%d %H:%M'),'forecastHour':a.forecast_hour,'valid':valid.strftime('%Y-%m-%d %H:%M'),'source':a.source,'image':'/images/maps/forecast/'+sid+'.png','calibrationRMSEKm':round(rmse,2) if rmse is not None else None,'georeference':georef,'coverage':round(cover,3),'unit':a.unit}
    if a.accum_hours:item['accumHours']=a.accum_hours
    data.append(item);data.sort(key=lambda x:(x['run'],x['forecastHour']),reverse=True)
    catalog.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'file':str(path),'map':sid,'coverage':round(cover,3),'calibrationRMSEkm':round(rmse,2) if rmse is not None else None,'maxAnchorErrorKm':round(maxerr,2) if maxerr is not None else None,'georeference':georef,'imageSize':[width,height]},ensure_ascii=False))

if __name__=='__main__':
    try:main()
    except (ValueError,KeyError) as e:print('Invalid map input:',e,file=sys.stderr);sys.exit(2)
