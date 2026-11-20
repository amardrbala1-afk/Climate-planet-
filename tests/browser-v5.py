from playwright.sync_api import sync_playwright
from pathlib import Path
p=Path('/mnt/data/climate-v5/tests/screenshots');p.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader'])
 for width,height,name in [(1440,900,'desktop'),(390,844,'mobile')]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True)
  page=context.new_page();errors=[];console=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
  page.goto('http://127.0.0.1:8976/',wait_until='domcontentloaded',timeout=18000)
  page.wait_for_timeout(1100)
  print(name,'initial h1',page.locator('#home h1').inner_text().replace('\n',' '),'scroll_width',page.evaluate('document.documentElement.scrollWidth'))
  page.screenshot(path=str(p/f'{name}-home.png'))
  page.evaluate("location.hash='#operations'");page.wait_for_timeout(450)
  print(name,'map image src',page.locator('#v5MapBase').get_attribute('src'), 'ops tabs',page.locator('#v5OpsTabs button').count())
  page.locator('#v5Region').select_option('levant');page.wait_for_timeout(300)
  print(name,'levant controls',[a.get_attribute('value') for a in page.locator('#v5Field option').all()]);print(name,'map overlay visible?',page.locator('#v5MapOverlay').is_visible())
  page.screenshot(path=str(p/f'{name}-operations.png'))
  page.locator('#v5OpsTabs button[data-v5-ops="gallery"]').click();print(name,'gallery unhidden',page.locator('[data-v5-panel="gallery"]').is_visible())
  page.evaluate("location.hash='#games'");page.wait_for_timeout(300)
  print(name,'games visible',page.locator('#games').is_visible());page.screenshot(path=str(p/f'{name}-games.png'))
  page.locator('#v5SpaceStart').click();page.wait_for_timeout(800)
  print(name,'game first score',page.locator('#v5SpaceScore').inner_text(),'cover hidden',page.locator('#v5SpaceCover').is_hidden());page.screenshot(path=str(p/f'{name}-game-space.png'))
  page.locator('[data-v5-game="forecast"]').click();page.locator('#v5ForecastAnswers button').nth(1).click();print(name,'weather game feedback',page.locator('#v5ForecastFeedback').inner_text()[:80]);page.screenshot(path=str(p/f'{name}-game-weather.png'))
  page.locator('[data-v5-game="geology"]').click();page.locator('#v5GeologyRun').click();page.wait_for_timeout(300);print(name,'geology runoff',page.locator('#v5Runoff').inner_text())
  page.screenshot(path=str(p/f'{name}-game-geology.png'))
  page.evaluate("location.hash='#space'");page.wait_for_timeout(1500)
  arr=page.evaluate("['spaceCanvas','cosmosCards','spaceObjectName','spaceArticle'].map(id=>[id,document.getElementById(id).getBoundingClientRect().y])")
  print(name,'space order',arr);page.screenshot(path=str(p/f'{name}-space.png'))
  page.evaluate("location.hash='#weather'");page.wait_for_timeout(450)
  print(name,'poster buttons',page.locator('[data-template]').count(),'stickers',page.locator('[data-sticker]').count())
  page.locator('[data-template="earth-science"]').click();
  try:
   with page.expect_download(timeout=12000) as ev:page.locator('#v4DownloadPoster').click()
   d=ev.value;print(name,'poster',d.suggested_filename);d.save_as(str(p/f'{name}-poster.png'))
  except Exception as e: print(name,'POSTER FAILED',str(e)[:180],page.locator('#v4PosterStatus').inner_text())
  print(name,'final scrollWidth',page.evaluate('document.documentElement.scrollWidth'),'errors',errors[:7],'console-errors',console[:5]);context.close()
 browser.close()
