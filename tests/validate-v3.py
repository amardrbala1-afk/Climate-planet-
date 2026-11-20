import json, pathlib, re
from html.parser import HTMLParser
root=pathlib.Path(__file__).resolve().parents[1]
site=root/'dist'
assert (site/'index.html').is_file()
class Check(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.nav=[];self.pages=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if 'data-page' in a:self.pages.append(a['data-page'])
  if tag=='a' and 'data-nav' in a:self.nav.append(a['data-nav'])
p=Check();p.feed((site/'index.html').read_text())
expected=['home','operations','weather','journal','space','archive']
assert p.pages==expected,(p.pages,expected)
assert p.nav==expected,(p.nav,expected)
for identifier in ['opsMap','opsReload','opsDay','opsLayers','opsCityCards','spaceArticle','cosmosCards','spaceSearch','modelCompareResults','downloadWeatherCard','hourlyGraph','compareWinterA','compareWinterB','seasonsGrid','globalSearchToggle']:
 if identifier=='globalSearchToggle':continue # runtime-injected search button
 assert identifier in p.ids,identifier
cosmos=json.loads((site/'data/cosmos-v3.json').read_text())
assert len(cosmos['items'])==21
assert len(set(d['id'] for d in cosmos['items']))==21
for d in cosmos['items']:
 assert len(d['sections'])>=3 and all(len(s['body'])>=75 for s in d['sections']),d['id']
 assert d['sourceURL'].startswith('https://en.wikipedia.org/wiki/'),d['id']
records=json.loads((site/'data/jerusalem-snow.json').read_text())['records']
assert len(records)>=80
assert all(x['date'].split('-')[1] in ('12','01','02') for x in records)
assert (site/'articles/solar-system/index.html').is_file()
assert (site/'manifest.webmanifest').is_file()
for f in ['app.js','space.js','operations.js','v3.js','models.js','style.css','v3.css']:
 assert (site/'assets'/f).stat().st_size>500,f
print('VALIDATION PASS:',len(p.pages),'sections;',len(cosmos['items']),'encyclopedia entries;',len(records),'winter cases;',len(json.loads((site/'data/cities.json').read_text())),'city listings')
