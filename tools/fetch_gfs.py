#!/usr/bin/env python3
"""Download one SUBSET of a published NOAA GFS 0.25° run via NOMADS GRIB filter.

This is an operator-only utility. It does not run on the visitor website.
Source: https://nomads.ncep.noaa.gov/gribfilter.php?ds=gfs_0p25
Please respect NOAA's usage guidelines and avoid repeated requests during outages.
Precipitation APCP step ranges vary: validate the GRIB metadata before rendering.
"""
import argparse,json,urllib.parse,urllib.request,hashlib
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--date',required=True,help='UTC YYYYMMDD');p.add_argument('--cycle',choices=['00','06','12','18'],required=True);p.add_argument('--forecast-hour',type=int,required=True)
p.add_argument('--region',choices=['europe','levant'],required=True);p.add_argument('--field',choices=['z500','t850','t2m','rain'],required=True);p.add_argument('--output',required=True);p.add_argument('--dry-run',action='store_true')
a=p.parse_args()
if not (len(a.date)==8 and a.date.isdigit()):p.error('Date format YYYYMMDD UTC')
if not 0<=a.forecast_hour<=384:p.error('Forecast hour must be 0...384')
# Hard crop for manageable downloads. Map pixel projection and geographic bounds
# still need independent calibration; do not treat this bounding box as a map georeference.
bounds={'europe':(-22,60,76,10),'levant':(23,55,46,16)}[a.region]
params={'file':f'gfs.t{a.cycle}z.pgrb2.0p25.f{a.forecast_hour:03d}','subregion':'','leftlon':bounds[0],'rightlon':bounds[1],'toplat':bounds[2],'bottomlat':bounds[3],'dir':f'/gfs.{a.date}/{a.cycle}/atmos'}
if a.field=='z500':params|={'var_HGT':'on','lev_500_mb':'on'}
elif a.field=='t850':params|={'var_TMP':'on','lev_850_mb':'on'}
elif a.field=='t2m':params|={'var_TMP':'on','lev_2_m_above_ground':'on'}
else:params|={'var_APCP':'on','lev_surface':'on'}
url='https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?'+urllib.parse.urlencode(params)
print('Source: NOAA NOMADS · GFS 0.25°');print('URL:',url)
if a.dry_run:raise SystemExit(0)
req=urllib.request.Request(url,headers={'User-Agent':'ClimatePlanet-ScientificMapGenerator/5.0 (educational)'})
with urllib.request.urlopen(req,timeout=90) as resp:
 data=resp.read(35*1024*1024)
 if resp.status!=200 or len(data)<500 or data[:4]!=b'GRIB':raise ValueError('NOAA did not return a GRIB2 dataset. Check forecast cycle and file availability.')
 if len(data)>=35*1024*1024:raise ValueError('GRIB subset unexpectedly large; narrow the domain')
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
meta={'source':'NOAA NOMADS / GFS 0.25°','runDate':a.date,'cycle':a.cycle,'forecastHour':a.forecast_hour,'field':a.field,'region':a.region,'sha256':hashlib.sha256(data).hexdigest(),'downloadUrl':url,'note':'APCP accumulation interval must be validated from GRIB time-range metadata, not assumed'}
out.with_suffix(out.suffix+'.source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
print('Wrote',out,len(data),'bytes; SHA256',meta['sha256'])
