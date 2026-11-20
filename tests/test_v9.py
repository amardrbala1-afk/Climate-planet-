"""Offline deterministic checks for V9's professional weather experience.
These tests do not use real-time weather and do not publish mock values.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess
import unittest
import xml.etree.ElementTree as ET
from importlib.util import find_spec
ROOT=Path(__file__).resolve().parents[1]
EXPECTED=['cloudy','drizzle','fog','humidity','moon','overcast','partly-cloudy-night','partly-cloudy','rain-probability','rain','snow','storm','sun','thermometer','uv','wind']
class V9(unittest.TestCase):
 def test_icon_collection_svg_integrity(self):
  folder=ROOT/'site/images/weather-v9'
  self.assertEqual(sorted(p.stem for p in folder.glob('*.svg')),sorted(EXPECTED))
  for name in EXPECTED:
   svg=ET.parse(folder/(name+'.svg')).getroot()
   self.assertEqual(svg.attrib['viewBox'],'0 0 256 256')
   self.assertTrue(svg.tag.endswith('svg'))
 def test_source_consistency_and_no_missing_controls(self):
  soup=BeautifulSoup((ROOT/'site/index.html').read_text(),'html.parser')
  required=['weatherTitle','weatherMotion','v9HeroConditionIcon','tempNow','skyLabel','weatherUpdated','forecastProvider','v9WeekGrid','v9PreviewConditionIcon','v6CardDay','v8PosterSize','downloadWeatherCard','v8ExportVideo','selectedCity','v8CityMax','v8CityRain','v4LandmarkCards']
  for ident in required:self.assertEqual(len(soup.select('#'+ident)),1,ident)
  ids=[el['id'] for el in soup.select('[id]')]
  self.assertEqual(len(ids),len(set(ids)),'Duplicate id(s) in V9')
  self.assertEqual(len(soup.select('[data-v5-game]')),2)
  self.assertEqual(len(soup.select('input[name="v8style"]')),4)
  self.assertIsNotNone(soup.select_one('link[href="/assets/v9.css"]'))
  self.assertIsNotNone(soup.select_one('script[src="/assets/v9-weather.js"]'))
  self.assertIsNotNone(soup.select_one('#v9WeatherHero .v9-hero-content'))
 def test_script_wmo_codes_and_assets(self):
  js="import {weatherIcon} from './site/assets/weather-icons-v9.js'; const cases=[[0,true,'sun'],[0,false,'moon'],[2,true,'partly-cloudy'],[2,false,'partly-cloudy-night'],[3,true,'overcast'],[45,true,'fog'],[53,true,'drizzle'],[61,true,'rain'],[71,true,'snow'],[95,true,'storm']];for(const [c,d,w] of cases){if(weatherIcon(c,d)!==w)process.exit(7)}"
  out=subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,capture_output=True,text=True)
  self.assertEqual(out.returncode,0,out.stderr)
 def test_no_new_map_or_workflow_modifications(self):
  old=Path('/mnt/data/climate-v8')
  for sub in ['tools/publish_gfs.py','tools/schedule_gfs.py','.github/workflows/forecast-main.yml','data/map-products/catalog.json']:
   self.assertEqual((ROOT/sub).read_bytes(),(old/sub).read_bytes(),sub)
 def test_output_bundle_contains_assets(self):
  for f in ['assets/v9.css','assets/v9-weather.js','assets/weather-icons-v9.js','images/weather-v9/sun.svg','images/weather-v9/rain.svg']:
   self.assertTrue((ROOT/'dist'/f).is_file(),f)
if __name__=='__main__':unittest.main(verbosity=2)
