"""Offline Chromium smoke test with controlled Open-Meteo response.
No external networking is required; tests code interactions, not the live API.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'tests/v6-screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
wx={'timezone':'Asia/Jerusalem','timezone_abbreviation':'EET',
'current':{'time':'2026-11-20T10:00','temperature_2m':20,'relative_humidity_2m':55,'apparent_temperature':19,'weather_code':2,'wind_speed_10m':13,'uv_index':2.8,'is_day':1,'cloud_cover':30},
'daily':{'time':[f'2026-11-{d:02d}' for d in range(20,27)],'weather_code':[2,3,61,0,71,2,1], 'temperature_2m_max':[20,21,16,24,9,15,18], 'temperature_2m_min':[11,10,7,13,1,8,9], 'precipitation_probability_max':[10,20,81,1,78,20,5], 'precipitation_sum':[0,0,12,0,9,0,0], 'wind_gusts_10m_max':[25,22,42,14,35,28,16], 'uv_index_max':[3,3,2,5,1,2,4]},
'hourly':{'time':[f'2026-11-20T{h:02d}:00' for h in range(10,24)]+[f'2026-11-21T{h:02d}:00' for h in range(18)],'temperature_2m':[18+i/7 for i in range(32)],'precipitation_probability':[10]*32,'precipitation':[0]*32,'wind_speed_10m':[13]*32}}
responses={'/data/cities.json':json.loads((ROOT/'data/cities.json').read_text()),'/data/cosmos-v3.json':json.loads((ROOT/'data/cosmos-v3.json').read_text()),'/data/jerusalem-snow.json':json.loads((ROOT/'data/jerusalem-snow.json').read_text()),'/data/forecast-maps.json':[],'/data/posts.json':[],'/data/maps.json':[]}
html=BeautifulSoup((ROOT/'dist/index.html').read_text(),'html.parser')
for el in list(html.select('link[href],script[src],script:not([src])')):el.decompose()
init_js="""window.fetch=async(url)=>{let key=String(url);if(key.includes('open-meteo.com'))return new Response(JSON.stringify(window.__wx),{status:200,headers:{'Content-Type':'application/json'}});let data=window.__data[key];if(data!==undefined)return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});return new Response('{}',{status:404});};"""
qjs=(ROOT/'site/assets/questions-v6.js').read_text().replace('export const QUESTIONS','const QUESTIONS')
gamejs=(ROOT/'site/assets/games-v6.js').read_text().replace("import {QUESTIONS} from './questions-v6.js';",qjs)
with sync_playwright() as pw:
 browser_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else pw.chromium.executable_path
 browser=pw.chromium.launch(executable_path=browser_path,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,label in [(390,'mobile'),(1440,'desktop')]:
  context=browser.new_context(viewport={'width':width,'height':850},accept_downloads=True)
  page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(str(html),wait_until='domcontentloaded')
  for style in ['style.css','v3.css','v4.css','v5.css','v6.css']:
   page.add_style_tag(content=(ROOT/'site/assets'/style).read_text())
  page.evaluate('({d,w})=>{window.__data=d;window.__wx=w}',{'d':responses,'w':wx})
  page.evaluate(init_js)
  for fn in ['app.js','v3.js','city-scenes-v6.js','v5.js']:
   page.add_script_tag(content=(ROOT/'site/assets'/fn).read_text(),type='module')
  page.add_script_tag(content=gamejs,type='module')
  page.add_script_tag(content=(ROOT/'site/assets/daily-card-v6.js').read_text(),type='module')
  page.wait_for_timeout(800)
  assert page.locator('#home').is_visible()
  assert page.locator('#v4Studio').count()==0
  assert page.locator('[data-v5-game="geology"]').count()==0
  page.evaluate("location.hash='#games'");page.wait_for_timeout(100)
  assert page.locator('#v5GameTabs button').count()==2
  page.locator('#v5SpaceStart').click();page.wait_for_timeout(380)
  assert page.locator('#v5SpaceCover').is_hidden()
  page.screenshot(path=str(SHOTS/f'{label}-space-game.png'))
  page.locator('[data-v5-game="forecast"]').click()
  assert page.locator('#v5ForecastAnswers button').count()==3
  page.locator('#v6QuizLevels [data-level="advanced"]').click()
  assert '12' in page.locator('#v5ForecastCount').inner_text()
  page.locator('#v5ForecastAnswers button').first.click()
  assert 'إجابة' in page.locator('#v5ForecastFeedback').inner_text()
  page.screenshot(path=str(SHOTS/f'{label}-weather-quiz.png'))
  page.evaluate("location.hash='#weather'");page.wait_for_timeout(450)
  page.wait_for_function("document.querySelectorAll('#v6CardDay option').length === 7",timeout=4000)
  page.locator('#v6CardDay').select_option('2')
  assert '16' in page.locator('#v6PreviewTemp').inner_text()
  page.screenshot(path=str(SHOTS/f'{label}-daily-card-ui.png'))
  with page.expect_download(timeout=10000) as download_event:page.locator('#downloadWeatherCard').click()
  saved=SHOTS/f'{label}-daily-card.png';download_event.value.save_as(str(saved))
  assert Image.open(saved).size==(1350,1080)
  assert page.evaluate("window.ClimateCityArt.url({id:'x1',ar:'مدينتي الأولى',lat:34,lon:36}) !== window.ClimateCityArt.url({id:'x2',ar:'مدينتي الثانية',lat:33,lon:35})")
  page.evaluate("location.hash='#operations'");page.wait_for_timeout(120)
  assert page.locator('#v5MapOverlay').is_hidden()
  print(label,'browser JS errors:',errors)
  assert not errors, errors
  context.close()
 browser.close()
print('PASS: offline browser interactions, card export and quiz on desktop + mobile')
