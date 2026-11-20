"""V8 browser tests with mocked API/forecast sources; test fixtures never shipped."""
from __future__ import annotations
from pathlib import Path
import json
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'tests/v8-screenshots';SHOTS.mkdir(exist_ok=True)
wx={'timezone':'Asia/Jerusalem','current':{'time':'2026-11-20T10:00','temperature_2m':20,'relative_humidity_2m':55,'apparent_temperature':19,'weather_code':2,'wind_speed_10m':13,'uv_index':2.8,'is_day':1,'cloud_cover':30},
'daily':{'time':[f'2026-11-{d:02d}' for d in range(20,27)],'weather_code':[2,3,61,0,71,2,1],'temperature_2m_max':[20,21,16,24,9,15,18],'temperature_2m_min':[11,10,7,13,1,8,9],'precipitation_probability_max':[10,20,81,1,78,20,5],'precipitation_sum':[0,0,12,0,9,0,0],'wind_gusts_10m_max':[25,22,42,14,35,28,16],'uv_index_max':[3,3,2,5,1,2,4],'sunrise':[f'2026-11-{d:02d}T06:30' for d in range(20,27)],'sunset':[f'2026-11-{d:02d}T16:45' for d in range(20,27)]},
'hourly':{'time':[f'2026-11-20T{h:02d}:00' for h in range(10,24)]+[f'2026-11-21T{h:02d}:00' for h in range(18)],'temperature_2m':[18+i/7 for i in range(32)],'precipitation_probability':[10]*32,'precipitation':[0]*32,'wind_speed_10m':[13]*32}}
# Synthetic fixture *only for the browser test*; never copied to site or catalog.
rows=[]
for h in range(0,73,6):
 for field in ['z500','t850']:
  rows.append({'id':f'gfs-europe-{field}-2026112000-f{h:03d}','region':'europe','field':field,'model':'GFS','run':'2026-11-20 00:00','forecastHour':h,'valid':f'2026-11-{20+h//24:02d} {h%24:02d}:00','label':field,'source':'NOAA GFS 0.25° [OFFLINE TEST FIXTURE]','image':f'/images/maps/forecast/gfs-europe-{field}-2026112000-f{h:03d}.png'})
 if h:
  for acc in (6,12,24,48,72):
   if h<acc:continue
   sid=f'gfs-levant-rain-2026112000-f{h:03d}'+(f'-a{acc:03d}' if acc!=6 else '')
   rows.append({'id':sid,'region':'levant','field':'rain','model':'GFS','run':'2026-11-20 00:00','forecastHour':h,'accumHours':acc,'valid':'2026-11-21 00:00','label':'rain','source':'NOAA GFS 0.25° [OFFLINE TEST FIXTURE]','image':'/images/maps/forecast/'+sid+'.png'})
img=SHOTS/'fixture.png';Image.new('RGBA',(400,500),(65,150,155,115)).save(img)
from bs4 import BeautifulSoup
soup=BeautifulSoup((ROOT/'dist/index.html').read_text(),'html.parser')
for tag in list(soup.select('link[href],script')):tag.decompose()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,label in [(390,'mobile'),(1440,'desktop')]:
  ctx=browser.new_context(viewport={'width':width,'height':900},accept_downloads=True,reduced_motion='reduce')
  page=ctx.new_page();page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda ex:errors.append(str(ex)))
  page.set_content(str(soup),wait_until='domcontentloaded')
  for css in ['style.css','v3.css','v4.css','v5.css','v6.css','v7.css','v8.css']:
   page.add_style_tag(content=(ROOT/'site/assets'/css).read_text())
  datasets={'/data/cities.json':json.loads((ROOT/'data/cities.json').read_text()),'/data/cosmos-v3.json':json.loads((ROOT/'data/cosmos-v3.json').read_text()),'/data/jerusalem-snow.json':json.loads((ROOT/'data/jerusalem-snow.json').read_text()),'/data/forecast-maps.json':rows,'/data/posts.json':[],'/data/maps.json':[]}
  page.evaluate('({data,wx})=>{window.__wx=wx;window.__data=data;window.fetch=async(url)=>{const key=String(url);if(key.includes("open-meteo.com"))return new Response(JSON.stringify(window.__wx),{status:200});const payload=window.__data[key];if(payload!==undefined)return new Response(JSON.stringify(payload),{status:200});return new Response("{}",{status:404})}}',{'data':datasets,'wx':wx})
  for fn in ['app.js','v3.js','city-scenes-v6.js','v5.js','v7-maps.js','v8-city.js','v8-card.js','v8-maps.js']:
   page.add_script_tag(content=(ROOT/'site/assets'/fn).read_text(),type='module')
  page.wait_for_timeout(900)
  page.evaluate("() => {if(window.ClimateCityArt){window.ClimateCityArt.url = c => 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(window.ClimateCityArt.svg(c));}}")
  page.evaluate("location.hash='#weather'")
  page.wait_for_function('document.querySelectorAll("#v6CardDay option").length===7',timeout=7000)
  page.locator('#v6CardDay').select_option('2')
  page.locator('input[name="v8style"][value="diorama"] + span').click(force=True)
  assert 'أمطار' in page.locator('#v6PreviewDate').inner_text()
  assert '16°' in page.locator('#v6PreviewTemp').inner_text()
  assert '12.0' in page.locator('#v8CityRain').inner_text()
  assert '06:30' in page.locator('#v8Sunrise').inner_text()
  page.locator('#v8PosterSize').select_option('1080x1350')
  page.screenshot(path=str(SHOTS/f'{label}-weather-v8.png'))
  with page.expect_download(timeout=25000) as event:page.locator('#downloadWeatherCard').click()
  dest=SHOTS/f'{label}-poster-v8.png';event.value.save_as(str(dest));assert Image.open(dest).size==(1080,1350)
  print(label,'poster downloaded',flush=True);page.locator('#v8CityCompareToggle').click(force=True)
  assert page.locator('#v8CityComparePanel').is_visible()
  print(label,'compare toggled',flush=True);page.evaluate("location.hash='#operations'")
  print(label,'operations opened',flush=True);page.locator('#v5Model').select_option('GFS')
  page.wait_for_timeout(400)
  print(label,'model selected',page.locator('#v8BatchStatus').inner_text(),flush=True);assert page.locator('#v7TimeSlider').is_enabled()
  assert '13/13' in page.locator('#v8BatchStatus').inner_text(),page.locator('#v8BatchStatus').inner_text()
  page.locator('#v7TimeSlider').fill('12');page.wait_for_timeout(90)
  assert 'f072' in page.locator('#v5ForecastHour').input_value()
  print(label,'slider tested',flush=True);page.locator('#v5Region').select_option('levant');page.wait_for_timeout(160)
  print(label,'region selected',flush=True);page.locator('#v5Field').select_option('rain');page.wait_for_timeout(170);page.locator('#v8AccumHours').select_option('12');page.wait_for_timeout(180)
  assert '11/11' in page.locator('#v8BatchStatus').inner_text(),page.locator('#v8BatchStatus').inner_text()
  page.screenshot(path=str(SHOTS/f'{label}-maps-v8.png'))
  overflow=page.evaluate('document.documentElement.scrollWidth-innerWidth')
  print(label,'overflow',overflow,'JS errors',errors)
  assert overflow<5 and not errors,(overflow,errors)
  ctx.close()
 browser.close()
print('PASS V8 OFFLINE browser smoke tests with isolated mock forecast sources')
