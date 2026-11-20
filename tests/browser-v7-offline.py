"""V7 map toolbar browser checks; fixture is NEVER included in deployed forecast catalog."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
html=BeautifulSoup((ROOT/'dist/index.html').read_text(), 'html.parser')
for tag in list(html.select('link[href],script')):tag.decompose()
html.select_one('#home')['class']=[v for v in html.select_one('#home').get('class',[]) if v!='is-active']
html.select_one('#operations')['class']=html.select_one('#operations').get('class',[])+['is-active']
records=[
 {'id':'gfs-europe-z500-2026112000-f024','region':'europe','field':'z500','model':'GFS','forecastHour':24,'run':'2026-11-20 00:00','valid':'2026-11-21 00:00','source':'NOAA GFS 0.25°','image':'/images/maps/forecast/gfs-europe-z500-2026112000-f024.png'},
 {'id':'gfs-europe-z500-2026112000-f048','region':'europe','field':'z500','model':'GFS','forecastHour':48,'run':'2026-11-20 00:00','valid':'2026-11-22 00:00','source':'NOAA GFS 0.25°','image':'/images/maps/forecast/gfs-europe-z500-2026112000-f048.png'},
 {'id':'gfs-europe-z500-2026111900-f024','region':'europe','field':'z500','model':'GFS','forecastHour':24,'run':'2026-11-19 00:00','valid':'2026-11-20 00:00','source':'NOAA GFS 0.25°','image':'/images/maps/forecast/gfs-europe-z500-2026111900-f024.png'},
 {'id':'ecmwf-europe-z500-2026112000-f024','region':'europe','field':'z500','model':'ECMWF','forecastHour':24,'run':'2026-11-20 00:00','valid':'2026-11-21 00:00','source':'ECMWF Open Data','image':'/images/maps/forecast/ecmwf-europe-z500-2026112000-f024.png'},
]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':820})
  errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
  page.set_content(str(html),wait_until='domcontentloaded')
  for css in ['style.css','v3.css','v4.css','v5.css','v6.css','v7.css']:
   page.add_style_tag(content=(ROOT/'site/assets'/css).read_text())
  page.evaluate('data=>{window.fetch=async()=>new Response(JSON.stringify(data),{status:200});}',records)
  for js in ['v5.js','v7-maps.js']:
   page.add_script_tag(content=(ROOT/'site/assets'/js).read_text(),type='module')
  page.wait_for_timeout(600)
  page.locator('#v5Model').select_option('GFS')
  page.wait_for_timeout(80)
  assert not page.locator('#v7Play').is_disabled(), 'Two hours should enable time playback'
  assert not page.locator('#v7CompareToggle').is_disabled(), 'Prior run is eligible for comparison'
  page.locator('#v7TimeSlider').fill('1')
  page.wait_for_timeout(100)
  assert page.locator('#v5ForecastHour').input_value()=='gfs-europe-z500-2026112000-f048'
  page.locator('#v7TimeSlider').fill('0')
  page.locator('#v7CompareToggle').click()
  assert not page.locator('#v7MapCompareOverlay').is_hidden()
  page.locator('#v7CompareSplit').fill('75')
  assert '25%' in (page.locator('#v7MapCompareOverlay').evaluate('(x)=>x.style.clipPath'))
  page.locator('#v7CompareMode').select_option('other-model')
  assert not page.locator('#v7CompareToggle').is_disabled()
  page.locator('#v5Region').select_option('levant')
  page.wait_for_timeout(75)
  assert page.locator('#v7Play').is_disabled()
  assert page.locator('#v7CompareToggle').is_disabled()
  assert not errors,errors
  print('PASS V7 map playback and comparison',width,'px; browser JS errors',errors)
  page.close()
 browser.close()
