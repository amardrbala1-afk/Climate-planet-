"""Offline validation suite; use with `npm test`."""
import json,sys,unittest,importlib.util
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
class SiteSuite(unittest.TestCase):
 def test_dom_scope(self):
  soup=BeautifulSoup((ROOT/'site/index.html').read_text(),'html.parser')
  self.assertIsNone(soup.select_one('#v4Studio'))
  self.assertFalse(soup.select('[data-v5-game="geology"], [data-v5-game-panel="geology"]'))
  self.assertEqual([x['data-v5-game'] for x in soup.select('[data-v5-game]')],['space','forecast'])
  for key in ['v6CardDay','v8PosterSize','downloadWeatherCard','v6QuizIllustration','v5MapBase']:
   self.assertIsNotNone(soup.find(id=key),key)
  for s in soup.select('script[src]'):
   self.assertTrue((ROOT/'site'/s['src'].lstrip('/')).exists(),s['src'])
  for c in soup.select('link[rel="stylesheet"]'):
   if c.get('href','').startswith('/'):self.assertTrue((ROOT/'site'/c['href'].lstrip('/')).exists())
 def test_real_source_not_misrepresented(self):
  catalog=json.loads((ROOT/'data/map-products/catalog.json').read_text())
  self.assertIsInstance(catalog,list)
  self.assertFalse(any(str(x.get('source','')).lower().startswith('synthetic') for x in catalog),'Never ship synthetic weather')
 def test_dist_build_exists(self):
  self.assertTrue((ROOT/'dist/index.html').is_file())
  self.assertTrue((ROOT/'dist/assets/v8-card.js').is_file())
  self.assertTrue((ROOT/'dist/assets/questions-v6.js').is_file())
 def test_city_seed_count(self):
  rows=json.loads((ROOT/'data/cities.json').read_text())
  self.assertEqual(len({c['id'] for c in rows}),len(rows))
  self.assertGreaterEqual(len(rows),100)
 def test_precip_metadata_fail_closed(self):
  sys.path.insert(0,str(ROOT/'tools'))
  from publish_gfs import parse_step_range,validate_grib_variable,SPEC
  from types import SimpleNamespace
  self.assertEqual(parse_step_range('0-6'),(0,6))
  with self.assertRaises(ValueError):parse_step_range('6')
  good={'GRIB_shortName':'tp','GRIB_typeOfLevel':'surface','GRIB_level':0,'units':'kg m**-2','GRIB_dataDate':20261120,'GRIB_dataTime':0,'GRIB_stepRange':'0-6','GRIB_stepType':'accum'}
  self.assertEqual(validate_grib_variable(SimpleNamespace(attrs=good),SPEC[('levant','rain')],'20261120','00',6,'rain',6),'mm')
  bad={**good,'GRIB_stepRange':'3-6'}
  with self.assertRaises(ValueError):validate_grib_variable(SimpleNamespace(attrs=bad),SPEC[('levant','rain')],'20261120','00',6,'rain',6)
  bad={**good,'GRIB_dataDate':20261119}
  with self.assertRaises(ValueError):validate_grib_variable(SimpleNamespace(attrs=bad),SPEC[('levant','rain')],'20261120','00',6,'rain',6)
if __name__=='__main__':unittest.main(verbosity=2)
