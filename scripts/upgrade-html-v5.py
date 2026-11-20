from bs4 import BeautifulSoup
from pathlib import Path
p=Path(__file__).parents[1]/'site/index.html'
soup=BeautifulSoup(p.read_text(encoding='utf8'),'html.parser')
def fragment(html):
    return BeautifulSoup(html,'html.parser')
def append_html(target,html):
    sub=fragment(html)
    for child in list(sub.contents): target.append(child)
# Version metadata; formal audience-facing labels
soup.select_one('meta[name="description"]')['content']='كوكب المناخ: التوقعات الجوية والخرائط العددية والمقالات والأرشيف المناخي وموسوعة الفضاء والألعاب العلمية.'
soup.select_one('.brand small').clear()
soup.select_one('.brand small').append('CLIMATE PLANET')
for key,new in [('span.v3-stamp','منصة الطقس والعلوم التفاعلية')]:
  x=soup.select_one(key)
  if x: x.clear();x.append(new)
for selector,text in [('#home .section-heading h2','أقسام كوكب المناخ'),('#operations .page-head p','خرائط النماذج العددية وتوقعات المدن، مع بيانات المصدر وتوقيت إصدار التوقع.'),('.home-footer-panel b','مصادر موثوقة')]:
  x=soup.select_one(selector)
  if x: x.clear();x.append(text)
# Build new game main navigation and additional home card
nav=soup.select_one('#primaryNav')
nav.append(fragment('<a href="#games" data-nav="games">الألعاب العلمية</a>').a)
footer_links=soup.select_one('.footer-links')
footer_links.append(fragment('<a href="#games">الألعاب العلمية</a>').a)
portal=soup.select_one('#home .portal-grid')
append_html(portal, '''<a href="#games" class="portal-card v5-games-portal"><span class="portal-no">SCIENCE GAMES</span><span class="portal-graphic">✦</span><h3>الألعاب العلمية</h3><p>رحلة فضائية، وتحديات الأرصاد، وتجارب في علوم الأرض.</p><span class="portal-cta">استكشف الألعاب ←</span></a>''')
# Space stage appears FIRST, object selection second, scientific writing third
space=soup.select_one('#space')
sub=space.select_one('.cosmos-sub')
tools=space.select_one('.cosmos-tools')
filters=space.select_one('#cosmosFilters')
cards=space.select_one('#cosmosCards')
stage=space.select_one('.cosmos-layout')
object_panel=stage.select_one('.object-panel')
object_panel.extract()
for x in [sub,tools,filters,cards]:x.extract()
# Place list below solar system viewer
cursor=stage
for x in [sub,tools,filters,cards,object_panel]:
    cursor.insert_after(x);cursor=x
stage['class']=['cosmos-layout','v4-space-layout','v5-space-stage']
soup.select_one('#space .page-head p').string='رحلة تفاعلية بين الكواكب والأجرام، ترافقها موسوعة علمية عربية.'
soup.select_one('#space .cosmos-encyclopedia-head h2').string='الموسوعة العلمية'
soup.select_one('#space .cosmos-encyclopedia-head p').string='معلومات وحقائق فلكية مرتبة بحسب الجرم المختار.'
soup.select_one('#space .cosmos-sub b').string='دليل الأجرام السماوية'
soup.select_one('#space .cosmos-sub p').string='اختر نوع الجرم ثم تصفح ملفه العلمي.'
# Operations: one uncluttered tab at a time
ops=soup.select_one('#operations')
opshead=ops.select_one('.page-head')
tabs=fragment('''<div class="v5-ops-tabs" id="v5OpsTabs" role="tablist" aria-label="الأقسام الجوية"><button type="button" class="is-on" data-v5-ops="maps" role="tab" aria-selected="true">الخرائط العددية</button><button type="button" data-v5-ops="cities" role="tab" aria-selected="false">توقعات المدن</button><button type="button" data-v5-ops="gallery" role="tab" aria-selected="false">مكتبة الخرائط</button></div>''').div
opshead.insert_after(tabs)
map_viewer=fragment('''<section class="v5-map-center" data-v5-panel="maps" aria-label="الخرائط الجوية العددية">
<div class="v5-map-summary"><h2>خرائط النماذج العددية</h2><span id="v5MapStamp">—</span></div>
<div class="v5-map-controls">
<label>المنطقة<select id="v5Region"><option value="europe">أوروبا وشمال إفريقيا</option><option value="levant">بلاد الشام</option></select></label>
<label>الطبقة<select id="v5Field"><option value="z500">ارتفاعات 500 hPa</option><option value="t850">حرارة 850 hPa</option></select></label>
<label>النموذج<select id="v5Model"><option value="ECMWF">ECMWF</option><option value="GFS">GFS</option><option value="ICON">ICON</option></select></label>
<label>ساعة التوقع<select id="v5ForecastHour"><option value="">أحدث خريطة متاحة</option></select></label>
</div>
<div class="v5-map-wrapper"><div id="v5MapViewport" class="v5-map-viewport" tabindex="0" aria-label="الخريطة الجوية يمكن تكبيرها أو تحريكها">
<div class="v5-map-transform" id="v5MapTransform"><img id="v5MapBase" src="/images/maps/europe-base.webp" alt="الخريطة التضاريسية لأوروبا وشمال إفريقيا" draggable="false"><img id="v5MapOverlay" alt="طبقة توقعات النموذج العددي" hidden draggable="false"></div>
<div class="v5-map-notice" id="v5MapNotice">اختر النموذج وساعة التوقع لعرض الخريطة المتاحة.</div>
</div><div class="v5-map-zooms"><button type="button" id="v5ZoomIn" aria-label="تقريب الخريطة">＋</button><button type="button" id="v5ZoomOut" aria-label="إبعاد الخريطة">－</button><button type="button" id="v5ZoomReset">ملاءمة</button></div></div>
<div class="v5-map-below"><div class="v5-map-gradient" id="v5MapLegend"></div><label class="v5-opacity">شفافية الطبقة <input id="v5MapOpacity" type="range" min="15" max="100" value="90"></label><button type="button" class="btn secondary" id="v5MapDownload" disabled>تنزيل الخريطة</button></div>
<div class="v5-map-source" id="v5MapSource" aria-live="polite">لا توجد خريطة منشورة لهذا الاختيار.</div></section>''').section
# insert after tabs then content existing in panels
ops.insert(ops.index(tabs)+1,map_viewer)
for selector,key in [('.ops-panel','cities'),('.v4-model-gallery','gallery')]:
    x=ops.select_one(selector)
    x['data-v5-panel']=key
    x['hidden']=''
# Remove editorial/developer references from audience-facing paragraph with meaningful info retained
opstiny=ops.select_one('.tiny-note')
if opstiny: opstiny.string='توقعات النماذج العددية قابلة للتغير؛ يُعرض المصدر ووقت التشغيل مع كل خريطة متاحة.'
# Game page after archive
main=soup.select_one('#mainContent')
games=fragment('''<section id="games" class="page" data-page="games" aria-labelledby="gamesTitle">
<div class="page-head"><div><span class="overline">CLIMATE PLANET · SCIENCE ARCADE</span><h1 id="gamesTitle">الألعاب <em>العلمية</em></h1><p>تجارب تفاعلية تجمع علوم الفلك والأرصاد والجيولوجيا.</p></div><span class="head-chip">ثلاث ألعاب مجانية</span></div>
<div class="v5-game-tabs" id="v5GameTabs" role="tablist"><button type="button" class="is-on" data-v5-game="space" aria-selected="true">🚀 رحلة فضائية</button><button type="button" data-v5-game="forecast" aria-selected="false">🌦 تحدي المتنبئ</button><button type="button" data-v5-game="geology" aria-selected="false">🌋 مختبر الأرض</button></div>
<div class="v5-game-screen" data-v5-game-panel="space">
<div class="v5-game-header"><h2>رحلة عبر المجموعة الشمسية</h2><p>وجّه مركبتك، اجمع بلورات الطاقة وتجنب الاصطدام بالنيازك.</p></div>
<div class="v5-game-stats"><span>النتيجة <b id="v5SpaceScore">0</b></span><span>المستوى <b id="v5SpaceLevel">1</b></span><span>المحاولات <b id="v5SpaceLives">3</b></span><span>أفضل نتيجة <b id="v5SpaceBest">0</b></span></div>
<div class="v5-space-canvas-wrap"><canvas id="v5SpaceCanvas" width="860" height="460" aria-label="لعبة قيادة المركبة الفضائية"></canvas><div class="v5-space-cover" id="v5SpaceCover"><span>🚀</span><strong>الرحلة الفضائية</strong><p>اجمع بلورات الطاقة لتنتقل بين الكواكب.</p><button type="button" id="v5SpaceStart">ابدأ الرحلة</button></div></div>
<div class="v5-game-actions"><button id="v5SpacePause" type="button">إيقاف مؤقت</button><button id="v5SpaceRestart" type="button">إعادة البداية</button><span>التحكم: الأسهم / WASD أو أزرار اللمس</span></div><div class="v5-touch-pad" id="v5TouchPad"><button data-move="up" aria-label="أعلى">▲</button><div><button data-move="left" aria-label="يسار">◀</button><button data-move="down" aria-label="أسفل">▼</button><button data-move="right" aria-label="يمين">▶</button></div></div>
</div>
<div class="v5-game-screen" data-v5-game-panel="forecast" hidden><div class="v5-game-header"><h2>تحدي المتنبئ الجوي</h2><p>اقرأ معطيات الطقس واختر التوقع الأقرب للصواب.</p></div>
<div class="v5-forecast-progress"><span id="v5ForecastCount">السؤال 1 من 12</span><span>النقاط <b id="v5ForecastScore">0</b></span></div>
<div class="v5-forecast-case"><small id="v5ForecastTopic">الأرصاد الجوية</small><h3 id="v5ForecastQuestion"></h3><div class="v5-case-facts" id="v5ForecastFacts"></div><div class="v5-forecast-answers" id="v5ForecastAnswers"></div><div class="v5-answer-feedback" id="v5ForecastFeedback" aria-live="polite"></div></div><div class="v5-game-actions"><button id="v5ForecastNext" type="button" disabled>السؤال التالي</button><button id="v5ForecastRestart" type="button">إعادة التحدي</button><span>الأسئلة التعليمية لا تمثل نشرات جوية حالية.</span></div></div>
<div class="v5-game-screen" data-v5-game-panel="geology" hidden><div class="v5-game-header"><h2>مختبر سطح الأرض</h2><p>اختبر تأثير المطر والانحدار والغطاء النباتي في انجراف التربة.</p></div>
<div class="v5-geology-controls"><label>شدة الهطول <strong id="v5RainLabel">50 مم/ساعة</strong><input id="v5Rain" type="range" min="5" max="100" value="50" step="5"></label><label>انحدار السطح <strong id="v5SlopeLabel">25°</strong><input id="v5Slope" type="range" min="0" max="50" value="25" step="5"></label><label>الغطاء النباتي <strong id="v5PlantsLabel">40%</strong><input id="v5Plants" type="range" min="0" max="100" value="40" step="10"></label></div>
<div class="v5-geology-panel"><canvas id="v5GeologyCanvas" width="860" height="330" aria-label="محاكاة تعليمية مبسطة لجريان الماء والتعرية"></canvas><div class="v5-geology-results"><div>مؤشر الجريان <b id="v5Runoff">—</b></div><div>مؤشر الانجراف <b id="v5Erosion">—</b></div><div>تصنيف التعرية <b id="v5ErosionClass">—</b></div></div></div><div class="v5-game-actions"><button type="button" id="v5GeologyRun">شغّل التجربة</button><button type="button" id="v5GeologyReset">إعادة الضبط</button><span>نموذج توعوي مبسط، وليس تقديرًا هندسيًا أو تنبؤًا بالمخاطر.</span></div></div>
</section>''').section
main.append(games)
# Load new assets, ordered after existing module dependencies
soup.head.append(fragment('<link rel="stylesheet" href="/assets/v5.css">').link)
soup.body.append(fragment('<script type="module" src="/assets/v5.js"></script>').script)
soup.body.append(fragment('<script type="module" src="/assets/games-v5.js"></script>').script)
# Remove redundant dev-looking text from operations gallery; save attribution
for t in soup.select('.v4-model-refs span'):
  t.string='الخرائط المنشورة من مصادر خارجية تخضع لحقوق أصحابها.'
p.write_text(str(soup),encoding='utf8')
print('V5 HTML upgraded',p.stat().st_size)
