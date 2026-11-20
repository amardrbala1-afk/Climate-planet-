"""Real Chromium smoke tests of V10 homepage, archives and space museum."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'tests/v10-screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=srv.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{srv.server_address[1]}'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,name in [(390,'mobile'),(1440,'desktop')]:
  context=browser.new_context(viewport={'width':width,'height':920},device_scale_factor=1,accept_downloads=True,reduced_motion='reduce')
  page=context.new_page();page.set_default_timeout(14000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  # The environment blocks localhost navigation. Inject the real rendered DOM,
  # styles and modules in an isolated page, with JSON sources from build outputs.
  from bs4 import BeautifulSoup
  soup=BeautifulSoup((ROOT/'dist/index.html').read_text(), 'html.parser')
  for tag in list(soup.select('script,link[href]')):tag.decompose()
  # Inline brand assets only in the screenshot harness: about:blank cannot resolve /images paths.
  import base64
  for img in soup.select('img[src^="/images/brand/"]'):
   src=img.get('src','');original=ROOT/'site'/src.lstrip('/')
   if original.is_file():
    mime='image/webp' if src.endswith('.webp') else 'image/png'
    img['src']=f'data:{mime};base64,'+base64.b64encode(original.read_bytes()).decode('ascii')
  page.set_content(str(soup),wait_until='domcontentloaded')
  for css in ['style.css','v3.css','v4.css','v5.css','v6.css','v7.css','v8.css','v9.css','v10.css']:
   source=ROOT/'site/assets'/css
   if source.exists():page.add_style_tag(content=source.read_text())
  import json
  sets={}
  for key in ['cities.json','cosmos-v3.json','cosmos-v10.json','jerusalem-snow.json','era5-historical.json']:
   sets['/data/'+key]=json.loads((ROOT/'dist/data'/key).read_text())
  for key in ['posts.json','maps.json','archive.json','forecast-maps.json']:
   sets['/data/'+key]=json.loads((ROOT/'dist/data'/key).read_text())
  page.evaluate("(sets)=>{window.__sets=sets;window.fetch=async(url)=>{const key=String(url);if(Object.hasOwn(window.__sets,key))return new Response(JSON.stringify(window.__sets[key]),{status:200});return new Response('{}',{status:503})}}",sets)
  for src in ['app.js','space.js','v3.js','v10-space.js','v10-archive.js']:
   page.add_script_tag(content=(ROOT/'site/assets'/src).read_text(),type='module')
  page.wait_for_timeout(850)
  page.wait_for_selector('.v10-feature-duo')
  page.screenshot(path=str(SHOTS/f'{name}-home.png'),full_page=False)
  assert '106' in page.locator('#home').inner_text()
  page.evaluate("location.hash='#archive'")
  page.wait_for_function("document.querySelectorAll('[data-v10-season]').length >= 70",timeout=15000)
  assert len(page.locator('[data-v10-season]').all())==77
  assert len(page.locator('[data-v10-dossier]').all())==4
  assert '70 سم' in page.locator('#v10DossierDetail').inner_text()
  page.locator('[data-v10-decade="1990"]').click()
  assert len(page.locator('[data-v10-season]').all())==10
  page.locator('[data-v10-decade="all"]').click()
  page.evaluate('window.scrollTo(0,0)')
  page.screenshot(path=str(SHOTS/f'{name}-archive.png'),full_page=False)
  page.locator('#v10SnowCardEvent').select_option('2013-12-12')
  with page.expect_download(timeout=17000) as action:page.locator('#v10DownloadSnowCard').click()
  dest=SHOTS/f'{name}-snow-card.png';action.value.save_as(str(dest));assert Image.open(dest).size==(1350,1080)
  page.evaluate("location.hash='#space'")
  page.wait_for_function("document.querySelector('#v10CosmosCounter')?.textContent.includes('106')",timeout=18000)
  assert '106' in page.locator('#v10CosmosCounter').inner_text()
  page.locator('#cosmosFilters [data-cosmos="nebulae"]').click()
  assert len(page.locator('#cosmosCards button').all())>=12
  page.locator('#spaceSearch').fill('آيو')
  assert 'آيو' in page.locator('#cosmosCards').inner_text()
  page.locator('#cosmosCards button').first.click()
  assert 'براكين' in page.locator('#spaceObjectDesc').inner_text()
  page.locator('[data-v10-panel="comparison"]').click()
  page.locator('#v10CompareA').select_option('moon')
  assert 'القمر' in page.locator('#v10SizeCompare').inner_text()
  page.locator('[data-v10-panel="missions"]').click()
  assert len(page.locator('#v10MissionTrail article').all())==8
  assert 'الأرض' in page.locator('#v10TourStage').inner_text()
  page.locator('#v10TourNext').click()
  assert 'القمر' in page.locator('#v10TourStage').inner_text()
  assert 'القمر' in page.locator('#spaceObjectName').inner_text()
  page.locator('[data-v10-panel="sky"]').click()
  assert page.locator('#v10SkyView').is_visible()
  page.locator('[data-v10-panel="quiz"]').click()
  page.locator('#v10QuizOptions button').nth(1).click()
  assert 'صحيح' in page.locator('#v10QuizFeedback').inner_text()
  page.evaluate('window.scrollTo(0,0)')
  page.screenshot(path=str(SHOTS/f'{name}-space.png'),full_page=False)
  widthDiff=page.evaluate('document.documentElement.scrollWidth-innerWidth')
  print(name,'overflow',widthDiff,'pageerrors',errors,flush=True)
  assert widthDiff<5,(name,widthDiff)
  assert not errors,errors
  context.close()
 browser.close()
srv.shutdown()
print('V10 Chromium browser smoke tests: PASS')
