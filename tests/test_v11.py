"""V11 editorial navigation and preservation checks. Requires no network."""
from pathlib import Path
from bs4 import BeautifulSoup
import unittest, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
class V11Site(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.source=BeautifulSoup((ROOT/'site/index.html').read_text(), 'html.parser')
  cls.dist=BeautifulSoup((ROOT/'dist/index.html').read_text(),'html.parser')
 def test_structure_and_content(self):
  s=self.source
  self.assertEqual(len(s.select('.page')),7)
  for key in ('home','operations','weather','journal','space','archive','games'):
   self.assertEqual(len(s.find_all(id=key)),1)
   self.assertEqual(len(s.select(f'#primaryNav a[data-nav="{key}"]')),1)
  self.assertEqual(len(s.select('.v11-front-hero')),1)
  self.assertEqual(len(s.select('.v11-onpage')),6)
  self.assertEqual(len(s.select('.v11-skip')),1)
  self.assertEqual(len(s.select('#v11SearchDialog')),1)
 def test_css_and_js_last(self):
  s=self.dist
  self.assertIsNotNone(s.select_one('head link[href="/assets/v11.css"]'))
  self.assertIsNotNone(s.select_one('script[src="/assets/v11.js"]'))
  self.assertTrue((ROOT/'dist/assets/v11.css').stat().st_size>10000)
  self.assertTrue((ROOT/'dist/assets/v11.js').stat().st_size>1500)
  self.assertNotIn("$('globalSearchToggle').addEventListener", (ROOT/'site/assets/v3.js').read_text())
 def test_legacy_components_remain(self):
  s=self.source
  for id in ('v5MapViewport','v7Play','v8AccumHours','citySearch','citiesList','v10DossierDetail','spaceSearch','v10CosmosCounter','v10SkyView','v8LeadersGrid'):
   self.assertIsNotNone(s.find(id=id),id)
 def test_editorial_articles(self):
  articles=list((ROOT/'dist/articles').glob('*/index.html'))
  self.assertGreaterEqual(len(articles),3)
  for a in articles:
   s=BeautifulSoup(a.read_text(),'html.parser')
   self.assertIsNotNone(s.find('link',href='/assets/v11-article.css'))
   self.assertIn('v11-article',s.body.get('class',[]))
 def test_pwa_and_no_mock_forecasts(self):
  self.assertIn('v11-editorial', (ROOT/'site/sw.js').read_text())
  cat=json.loads((ROOT/'data/map-products/catalog.json').read_text())
  self.assertIsInstance(cat,list)
  for rec in cat:
   self.assertNotIn('synthetic',json.dumps(rec).lower())
 def test_data_preservation(self):
  for p in ['data/cosmos-v10.json','data/jerusalem-snow.json','tools/publish_gfs.py','tools/schedule_gfs.py','site/images/maps/levant-base.webp','site/images/maps/europe-base.webp']:
   self.assertTrue((ROOT/p).is_file(),p)
if __name__=='__main__':unittest.main(verbosity=2)
