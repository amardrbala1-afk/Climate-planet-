"""Offline V11 Chromium smoke test, including the existing modules and new navigation.
Requires playwright, bs4 and a local Chromium. No external network is used.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json, base64
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'tests/v11-screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
SCRIPTS=['app.js','space.js','v3.js','operations.js','models.js','city-scenes-v6.js','v5.js','games-v6.js','v7-maps.js','v8-city.js','v8-card.js','v8-maps.js','v9-weather.js','v10-space.js','v10-archive.js','v11.js']
CSS=['style.css','v3.css','v4.css','v5.css','v7.css','v6.css','v8.css','v9.css','v10.css','v11.css']

def init_page(page):
 soup=BeautifulSoup((ROOT/'dist/index.html').read_text(),'html.parser')
 for tag in list(soup.select('script,link[href]')):tag.decompose()
 # Inline imagery for browser sandbox; production serves ordinary original image assets.
 for img in soup.select('img[src^="/images/"]'):
  src=img.get('src','');original=ROOT/'site'/src.lstrip('/')
  if original.is_file() and original.stat().st_size<6_000_000:
   mime='image/webp' if src.endswith('.webp') else 'image/svg+xml' if src.endswith('.svg') else 'image/png'
   img['src']='data:'+mime+';base64,'+base64.b64encode(original.read_bytes()).decode('ascii')
 page.set_content(str(soup),wait_until='domcontentloaded')
 for css in CSS:page.add_style_tag(content=(ROOT/'site/assets'/css).read_text())
 data={}
 for path in (ROOT/'dist/data').glob('*.json'):
  try:data['/data/'+path.name]=json.loads(path.read_text())
  except ValueError:continue
 page.evaluate("sets=>{window.__sets=sets;window.fetch=async(url)=>{let k=String(url);if(Object.hasOwn(window.__sets,k))return new Response(JSON.stringify(window.__sets[k]),{status:200});return new Response('{}',{status:503})}}",data)
 for src in SCRIPTS:
  code=(ROOT/'site/assets'/src).read_text()
  # In about:blank, resolve the existing relative module imports to data URLs.
  for dep in ('questions-v6.js','weather-icons-v9.js'):
   code=code.replace('./'+dep,'data:text/javascript;base64,'+base64.b64encode((ROOT/'site/assets'/dep).read_bytes()).decode('ascii'))
  page.add_script_tag(content=code,type='module')

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,name in [(390,'mobile'),(1440,'desktop')]:
  page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1,reduced_motion='reduce',accept_downloads=True)
  errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
  init_page(page);page.wait_for_timeout(700)
  assert page.locator('#home').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth-innerWidth')<=2
  page.screenshot(path=str(SHOTS/f'{name}-home.png'),full_page=True)
  if width<600:
   page.locator('#navToggle').click();assert page.locator('#primaryNav').is_visible()
   page.screenshot(path=str(SHOTS/f'{name}-menu.png'))
   page.locator('#primaryNav a[data-nav="weather"]').click()
  else:page.locator('#primaryNav a[data-nav="weather"]').click()
  page.wait_for_timeout(350)
  assert page.locator('#weather').is_visible()
  page.screenshot(path=str(SHOTS/f'{name}-weather.png'))
  page.locator('#v11OpenSearch').click();assert page.locator('#v11SearchDialog').is_visible()
  page.locator('#v11SearchInput').fill('القدس');page.wait_for_timeout(250)
  assert page.locator('#v11SearchResults .v11-search-result').count()>=1
  page.screenshot(path=str(SHOTS/f'{name}-search.png'))
  page.keyboard.press('Escape');assert page.locator('#v11SearchDialog').is_hidden()
  page.evaluate("location.hash='#archive'");page.wait_for_timeout(350);assert page.locator('#archive').is_visible()
  page.screenshot(path=str(SHOTS/f'{name}-archive.png'))
  page.evaluate("location.hash='#space'");page.wait_for_timeout(450);assert page.locator('#space').is_visible()
  page.screenshot(path=str(SHOTS/f'{name}-space.png'))
  assert page.evaluate('document.documentElement.scrollWidth-innerWidth')<=2
  assert not errors, errors
  print(name,'V11 navigation/search/archive/space PASS')
  page.close()
 browser.close()
print('V11 offline browser smoke: PASS')
