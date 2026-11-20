"""V10 invariant tests; do not touch published GFS catalogs or external APIs."""
import json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class V10(unittest.TestCase):
 def test_astronomy_science_catalog(self):
  old=json.loads((ROOT/'data/cosmos-v3.json').read_text());extra=json.loads((ROOT/'data/cosmos-v10.json').read_text());all_ids=[i['id'] for i in old['items']]+[i['id'] for i in extra['objects']]
  self.assertEqual(len(all_ids),106)
  self.assertEqual(len(set(all_ids)),106)
  self.assertEqual(len(extra['objects']),len(extra['articles']))
  for o,a in zip(extra['objects'],extra['articles']):
   self.assertEqual(o['id'],a['id']);self.assertGreaterEqual(len(o['summary']),25);self.assertEqual(len(a['sections']),3)
   self.assertTrue(a['sourceURL'].startswith('https://en.wikipedia.org/wiki/'))
   self.assertTrue(all(len(section['body'])>25 for section in a['sections']))
  for category in ['moons','stars','dwarf','nebulae','missions','galaxies','exoplanets','clusters']:
   self.assertTrue(any(o['category']==category for o in extra['objects']))
 def test_archive_source_fidelity(self):
  old=json.loads((ROOT/'data/jerusalem-snow.json').read_text());self.assertEqual(len(old['records']),86)
  depths={i['date']:i['depthCm'] for i in old['records']}
  for date,amount in [('1950-02-04',70),('1992-02-23',45),('2013-12-12',65),('2015-02-19',35)]:self.assertEqual(depths[date],amount)
  self.assertTrue(all(r['source'] and r['date'] for r in old['records']))
 def test_ui_and_build_assets(self):
  h=(ROOT/'site/index.html').read_text()
  for item in ['v10WinterTimeline','v10DecadeFilters','v10Dossiers','v10DossierDetail','v10CosmosCounter','v10SkyDate','v10CompareA','v10CompareB','v10SnowCardEvent','v10QuizOptions','v10TourNext']:
   self.assertIn('id="'+item+'"',h)
  for f in ['site/assets/v10.css','site/assets/v10-archive.js','site/assets/v10-space.js','dist/data/cosmos-v10.json','dist/data/era5-historical.json']:
   self.assertTrue((ROOT/f).is_file(),f)
 def test_no_synthetic_reanalysis(self):
  self.assertEqual(json.loads((ROOT/'data/era5-historical.json').read_text()),[])
  self.assertIn('CDSAPI_KEY',(ROOT/'tools/era5_historical.py').read_text())
 def test_gfs_forecast_pipeline_preserved(self):
  before=Path('/mnt/data/climate-v9')
  if before.exists():
   for p in ['.github/workflows/forecast-main.yml','tools/schedule_gfs.py','tools/publish_gfs.py','data/map-products/catalog.json']:
    self.assertEqual((ROOT/p).read_bytes(),(before/p).read_bytes(),p)
if __name__=='__main__':unittest.main(verbosity=2)
