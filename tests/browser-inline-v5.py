from playwright.sync_api import sync_playwright
from pathlib import Path
from bs4 import BeautifulSoup
import json,base64,re
root=Path(__file__).resolve().parents[1];base=root/'dist';out=root/'tests/screenshots';out.mkdir(parents=True,exist_ok=True)
soup=BeautifulSoup((base/'index.html').read_text(),'html.parser')
for tag in list(soup.select('script[src],link[href]')):tag.decompose()
for css in ['style.css','v3.css','v4.css','v5.css']:
 s=soup.new_tag('style');s.string=(base/'assets'/css).read_text();soup.head.append(s)
logo=(base/'images/brand/climate-planet-transparent.png');logo_data='data:image/png;base64,'+base64.b64encode(logo.read_bytes()).decode()
for img in soup.find_all('img'):
 if img.get('src','').startswith('/images/brand'):
  img['src']=logo_data
html=str(soup)
files=['app.js','space.js','v3.js','operations.js','models.js','v4.js','v5.js','games-v5.js']
js=[(p,(base/'assets'/p).read_text()) for p in files]
city_json=json.loads((base/'data/cities.json').read_text());cosmos=json.loads((base/'data/cosmos-v3.json').read_text());archive=json.loads((base/'data/jerusalem-snow.json').read_text());catalog=json.loads((base/'data/forecast-maps.json').read_text());posts=json.loads((base/'data/posts.json').read_text())
weather={'current':{'temperature_2m':20,'relative_humidity_2m':36,'apparent_temperature':18,'weather_code':1,'wind_speed_10m':3,'uv_index':3,'is_day':1,'cloud_cover':43,'time':'2026-11-20T10:00'},'daily':{'time':['2026-11-20']*7,'temperature_2m_max':[22]*7,'temperature_2m_min':[12]*7,'precipitation_probability_max':[10]*7,'precipitation_sum':[0.4]*7,'wind_gusts_10m_max':[20]*7,'uv_index_max':[5]*7},'hourly':{'time':['2026-11-20T'+str(i).zfill(2)+':00' for i in range(24)],'temperature_2m':[20]*24,'precipitation_probability':[8]*24,'precipitation':[0]*24,'wind_speed_10m':[4]*24}}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader'])
 for width,height,name in [(1440,900,'desktop'),(390,844,'mobile')]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True)
  page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('(data)=>{window.fetch=(u)=>{const url=String(u);if(url.includes("cities.json"))return Promise.resolve(new Response(JSON.stringify(data.cities),{status:200}));if(url.includes("cosmos-v3.json"))return Promise.resolve(new Response(JSON.stringify(data.cosmos),{status:200}));if(url.includes("jerusalem-snow.json"))return Promise.resolve(new Response(JSON.stringify(data.archive),{status:200}));if(url.includes("forecast-maps.json"))return Promise.resolve(new Response(JSON.stringify(data.catalog),{status:200}));if(url.includes("posts.json"))return Promise.resolve(new Response(JSON.stringify(data.posts),{status:200}));if(url.includes("maps.json"))return Promise.resolve(new Response("[]",{status:200}));if(url.includes("api.open-meteo.com"))return Promise.resolve(new Response(JSON.stringify(data.weather),{status:200}));return Promise.reject(new Error("network unavailable in inline test: "+url))};}',{'cities':city_json,'cosmos':cosmos,'archive':archive,'catalog':catalog,'posts':posts,'weather':weather})
  for filename,code in js:
   try:page.evaluate('(code)=>{(0,eval)(code)}',code)
   except Exception as e:print(name,'SCRIPT ERROR',filename,str(e)[:400]);break
  page.wait_for_timeout(400)
  print(name,'home h1',page.locator('#home h1').inner_text().replace('\n',' '),'scrollWidth',page.evaluate('document.documentElement.scrollWidth'))
  page.screenshot(path=str(out/f'{name}-home.png'))
  page.evaluate("location.hash='#games'");page.wait_for_timeout(200)
  print(name,'games visible',page.locator('#games').is_visible());page.screenshot(path=str(out/f'{name}-games.png'))
  page.locator('#v5SpaceStart').click();page.wait_for_timeout(250);print(name,'game cover hidden',page.locator('#v5SpaceCover').is_hidden());page.screenshot(path=str(out/f'{name}-game-space.png'))
  page.locator('[data-v5-game="forecast"]').click();page.locator('#v5ForecastAnswers button').nth(1).click();print(name,'forecast',page.locator('#v5ForecastFeedback').inner_text()[:110])
  page.locator('[data-v5-game="geology"]').click();page.locator('#v5GeologyRun').click();page.wait_for_timeout(200);print(name,'geo score',page.locator('#v5Erosion').inner_text());page.screenshot(path=str(out/f'{name}-geology.png'))
  page.evaluate("location.hash='#operations'");page.wait_for_timeout(100)
  img=base/'images/maps/europe-base.webp';img_data='data:image/webp;base64,'+base64.b64encode(img.read_bytes()).decode()
  page.locator('#v5MapBase').evaluate('(el,u)=>el.src=u',img_data)
  page.wait_for_timeout(300);page.screenshot(path=str(out/f'{name}-map.png'))
  print(name,'map field choices',page.locator('#v5Field option').all_text_contents(),'map download disabled',page.locator('#v5MapDownload').is_disabled())
  page.locator('#v5Region').select_option('levant');page.wait_for_timeout(100);print(name,'levant choices',page.locator('#v5Field option').all_text_contents())
  page.locator('#v5OpsTabs [data-v5-ops="gallery"]').click();print(name,'gallery visible',page.locator('.v4-model-gallery').is_visible())
  page.evaluate("location.hash='#space'");page.wait_for_timeout(200)
  y=page.evaluate("['spaceCanvas','cosmosCards','spaceObjectName','spaceArticle'].map(id=>Math.round(document.getElementById(id).getBoundingClientRect().y))")
  print(name,'space vertical order',y);page.screenshot(path=str(out/f'{name}-space.png'))
  page.evaluate("location.hash='#weather'");page.wait_for_timeout(100)
  print(name,'studio',page.locator('[data-template]').count(),'stickers',page.locator('[data-sticker]').count())
  print(name,'JS errors',errors[:8]);context.close()
 browser.close()
