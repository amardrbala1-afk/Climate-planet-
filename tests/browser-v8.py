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
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
http=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=http.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{http.server_port}/'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,label in [(390,'mobile'),(1440,'desktop')]:
  ctx=browser.new_context(viewport={'width':width,'height':900},accept_downloads=True)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/data/forecast-maps.json',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(rows)))
  page.route('**/images/maps/forecast/*.png',lambda r:r.fulfill(status=200,content_type='image/png',body=img.read_bytes()))
  page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(wx)))
  page.route('**/api.open-meteo.com/v1/gfs*',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(wx)))
  page.route('**/fonts.googleapis.com/**',lambda r:r.abort())
  page.route('**/fonts.gstatic.com/**',lambda r:r.abort())
  page.goto(URL,wait_until='domcontentloaded')
  page.wait_for_timeout(650)
  assert page.locator('#v8LeadersGrid').count()==1
  page.evaluate("location.hash='#weather'")
  page.wait_for_function('document.querySelectorAll("#v6CardDay option").length===7',timeout=7000)
  page.locator('#v6CardDay').select_option('2')
  page.locator('input[name="v8style"][value="diorama"]').check()
  assert page.locator('#v6PreviewDate').inner_text().find('أمطار')>=0
  assert '16°' in page.locator('#v6PreviewTemp').inner_text()
  assert '12.0' in page.locator('#v8CityRain').inner_text()
  assert '06:30' in page.locator('#v8Sunrise').inner_text()
  page.locator('#v8PosterSize').select_option('1080x1350')
  page.locator('#v8PosterStudio').count() if False else None
  page.screenshot(path=str(SHOTS/f'{label}-weather-v8.png'))
  with page.expect_download(timeout=25000) as d:page.locator('#downloadWeatherCard').click()
  dest=SHOTS/f'{label}-poster-v8.png';d.value.save_as(str(dest));assert Image.open(dest).size==(1080,1350)
  page.locator('input[name="v8style"][value="cinematic"]').check()
  page.locator('#v8CityCompareToggle').click()
  assert page.locator('#v8CityComparePanel').is_visible()
  page.evaluate("location.hash='#operations'")
  page.locator('#v5Model').select_option('GFS')
  page.wait_for_timeout(500)
  assert page.locator('#v7TimeSlider').is_enabled()
  assert '13/13' in page.locator('#v8BatchStatus').inner_text(),page.locator('#v8BatchStatus').inner_text()
  page.locator('#v7TimeSlider').fill('12');page.wait_for_timeout(50)
  assert 'f072' in page.locator('#v5ForecastHour').input_value()
  page.locator('#v5Region').select_option('levant');page.wait_for_timeout(80)
  page.locator('#v8AccumHours').select_option('12');page.wait_for_timeout(150)
  assert '11/11' in page.locator('#v8BatchStatus').inner_text(),page.locator('#v8BatchStatus').inner_text()
  page.screenshot(path=str(SHOTS/f'{label}-maps-v8.png'))
  page.evaluate("location.hash='#games'")
  page.locator('[data-v5-game="forecast"]').click()
  assert page.locator('#v5ForecastAnswers button').count()==3
  # No overflow on mobile
  overflow=page.evaluate('document.documentElement.scrollWidth-innerWidth')
  print(label,'overflow',overflow,'JS errors',errors)
  assert overflow<5 and not errors,(overflow,errors)
  ctx.close()
 browser.close()
http.shutdown()
print('PASS V8 OFFLINE browser smoke tests (real data are never mocked on the deployed site)')
