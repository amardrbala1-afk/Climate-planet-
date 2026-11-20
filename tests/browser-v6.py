from pathlib import Path
from playwright.sync_api import sync_playwright
import io,json
from PIL import Image
base=Path(__file__).resolve().parent
shots=base/'v6-screenshots';shots.mkdir(exist_ok=True)
mock={
 'timezone':'Asia/Jerusalem','timezone_abbreviation':'EET',
 'current':{'time':'2026-11-20T10:00','temperature_2m':20,'relative_humidity_2m':55,'apparent_temperature':19,'weather_code':2,'wind_speed_10m':13,'uv_index':2.8,'is_day':1,'cloud_cover':30},
 'daily':{'time':['2026-11-20','2026-11-21','2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26'],
          'weather_code':[2,3,61,0,71,2,1], 'temperature_2m_max':[20,21,16,24,9,15,18], 'temperature_2m_min':[11,10,7,13,1,8,9],
          'precipitation_probability_max':[10,20,81,1,78,20,5], 'precipitation_sum':[0,0,12,0,9,0,0],
          'wind_gusts_10m_max':[25,22,42,14,35,28,16], 'uv_index_max':[3,3,2,5,1,2,4]},
 'hourly':{'time':['2026-11-20T%02d:00'%h for h in range(10,24)]+['2026-11-21T%02d:00'%h for h in range(0,18)],'temperature_2m':[18+i/7 for i in range(32)],'precipitation_probability':[10]*32,'precipitation':[0]*32,'wind_speed_10m':[13]*32}}
assert len(mock['hourly']['time'])==32
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader'])
 for width,name in [(390,'mobile'),(1440,'desktop')]:
  ctx=browser.new_context(viewport={'width':width,'height':870},accept_downloads=True)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(mock)))
  page.goto('http://127.0.0.1:8877/',wait_until='domcontentloaded');page.wait_for_timeout(900)
  assert page.locator('#home').is_visible()
  assert page.locator('#v4Studio').count()==0
  assert page.locator('script[src*="games-v5.js"]').count()==0
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
  page.screenshot(path=str(shots/f'{name}-home.png'))
  page.evaluate('location.hash="#games"');page.wait_for_timeout(150)
  assert page.locator('#v5GameTabs button').count()==2
  page.locator('#v5SpaceStart').click();page.wait_for_timeout(380)
  assert page.locator('#v5SpaceCover').is_hidden()
  page.screenshot(path=str(shots/f'{name}-spacegame.png'))
  page.locator('[data-v5-game="forecast"]').click()
  assert page.locator('#v5ForecastAnswers button').count()==3
  page.locator('#v6QuizLevels [data-level="advanced"]').click()
  assert 'من 12' in page.locator('#v5ForecastCount').inner_text()
  page.locator('#v5ForecastAnswers button').first.click()
  assert page.locator('#v5ForecastFeedback').inner_text()
  page.screenshot(path=str(shots/f'{name}-quiz.png'))
  page.evaluate('location.hash="#weather"')
  page.wait_for_function("document.querySelectorAll('#v6CardDay option').length === 7",timeout=5000)
  page.locator('#v6CardDay').select_option('2')
  assert '2026' in page.locator('#v6PreviewDate').inner_text()
  assert '16' in page.locator('#v6PreviewTemp').inner_text()
  page.screenshot(path=str(shots/f'{name}-city-card.png'))
  with page.expect_download(timeout=10000) as event:page.locator('#downloadWeatherCard').click()
  download=event.value
  dest=shots/f'{name}-daily-card.png';download.save_as(str(dest))
  im=Image.open(dest);assert im.size==(1350,1080),im.size
  print(name,'download',download.suggested_filename,im.size)
  scene_unique=page.evaluate("window.ClimateCityArt.url({id:'seed-123',ar:'مدينة ألف',name:'A',lat:33,lon:35}) !== window.ClimateCityArt.url({id:'seed-124',ar:'مدينة باء',name:'B',lat:34,lon:36})")
  assert scene_unique
  page.evaluate('location.hash="#operations"');page.wait_for_timeout(200)
  assert page.locator('#v5MapOverlay').is_hidden()
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
  print(name,'errors',errors[:8]);assert not errors,errors
  ctx.close()
 browser.close()
