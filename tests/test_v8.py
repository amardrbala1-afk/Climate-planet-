"""Offline, deterministic V8 tests. Fixture values are never published to site."""
import sys
import json
import tempfile
import unittest
from pathlib import Path
import numpy as np
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import schedule_gfs,aggregate_rain

class V8(unittest.TestCase):
    def test_schedule_exactly_thirteen_and_twelve(self):
        self.assertEqual(schedule_gfs.HOURS,tuple(range(0,73,6)))
        tasks=schedule_gfs.tasks()
        self.assertEqual(len(tasks),51)
        self.assertEqual(sum(f=='rain' for _,f,*_ in tasks),12)
        self.assertEqual(sum(f!='rain' for _,f,*_ in tasks),39)
        self.assertEqual(sum(len(range(w,73,6)) for w in schedule_gfs.ACCUM_WINDOWS),26)
        self.assertEqual(schedule_gfs.sid('levant','rain','20261120','00',72,6),'gfs-levant-rain-2026112000-f072')
        self.assertEqual(schedule_gfs.sid('levant','rain','20261120','00',72,24),'gfs-levant-rain-2026112000-f072-a024')
    def test_aggregation_raw_grids_not_colours(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache=Path(tmp)
            a=np.array([[34.0,35.0,1.0],[34.1,35.1,2.0],[34.2,35.2,3.0],[34.3,35.3,4.0]]*14)
            for h in [6,12,18,24]:
                arr=a.copy();arr[:,2]*=h/6
                np.savetxt(cache/f'rain-f{h:03d}.csv',arr,delimiter=',',header='lat,lon,value',comments='')
            coords,values=aggregate_rain.aggregate(cache,24,24)
            self.assertEqual(len(values),56)
            self.assertTrue(np.allclose(values[0],10))
            self.assertTrue(np.allclose(coords[0],(34.0,35.0)))
            vals=np.loadtxt(cache/'rain-f024.csv',delimiter=',',skiprows=1)
            vals[0,0]=40
            np.savetxt(cache/'rain-f024.csv',vals,delimiter=',',header='lat,lon,value',comments='')
            with self.assertRaises(ValueError):aggregate_rain.aggregate(cache,24,24)
    def test_validation_fails_without_images(self):
        original=schedule_gfs.ROOT
        with tempfile.TemporaryDirectory() as tmp:
            base=Path(tmp);(base/'data/map-products').mkdir(parents=True)
            name=schedule_gfs.sid('levant','rain','20261120','00',12,12)
            (base/'data/map-products/catalog.json').write_text(json.dumps([{'id':name,'region':'levant','field':'rain','model':'GFS','forecastHour':12,'accumHours':12,'image':'/images/maps/forecast/'+name+'.png'}]))
            schedule_gfs.ROOT=base
            try:
                with self.assertRaises(ValueError):schedule_gfs.verify_product('levant','rain','20261120','00',12,12)
                output=base/'site/images/maps/forecast';output.mkdir(parents=True)
                (output/(name+'.png')).write_bytes(b'\x89PNG\r\n\x1a\n'+b'X'*201)
                self.assertEqual(schedule_gfs.verify_product('levant','rain','20261120','00',12,12),name)
            finally:schedule_gfs.ROOT=original
    def test_source_html_controls(self):
        soup=BeautifulSoup((ROOT/'site/index.html').read_text(encoding='utf8'),'html.parser')
        for id in ('v8AccumHours','v8AnimateExport','v8PosterSize','v8ExportVideo','v8CityCompareSelect','v8LeadersGrid'):
            self.assertIsNotNone(soup.find(id=id),id)
        self.assertEqual([b.get('data-v5-game') for b in soup.select('[data-v5-game]')],['space','forecast'])
        self.assertEqual(len(soup.select('input[name="v8style"]')),3)
        self.assertEqual(len(soup.select('#v8AccumHours option')),5)
    def test_workflow_dispatch_and_schedule(self):
        text=(ROOT/'.github/workflows/forecast-main.yml').read_text()
        self.assertIn('python tools/schedule_gfs.py',text)
        self.assertIn('timeout-minutes: 110',text)
        self.assertIn('workflow_dispatch:',text)
        self.assertFalse((ROOT/'.github/workflows/forecast-maps.yml').exists())
    def test_no_artificial_forecast_in_catalog(self):
        entries=json.loads((ROOT/'data/map-products/catalog.json').read_text())
        self.assertIsInstance(entries,list)
        for p in entries:
            self.assertIn(p['source'].split()[0],['NOAA','ECMWF','DWD'])
            self.assertTrue((ROOT/'site'/p['image'].lstrip('/')).is_file())

if __name__=='__main__':unittest.main(verbosity=2)
