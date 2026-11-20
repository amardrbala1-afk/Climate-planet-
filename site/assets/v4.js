/* Climate Planet V4 — locally authored landmark illustrations and social publishing studio.
   Forecast posters MUST use received Open-Meteo data. Illustrative stickers do not imply official warnings. */
const V4=document;
const id=key=>V4.getElementById(key);
const safe=text=>String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const landmarkNames={
 'القدس':'jerusalem','دمشق':'damascus','عمّان':'amman','عمان':'amman','حلب':'aleppo','بيروت':'beirut','جسر الشغور':'jisr-al-shughur',
 'حماة':'hama','إدلب':'idlib','اللاذقية':'latakia','العقبة':'aqaba','إربد':'irbid','طرابلس':'tripoli','نابلس':'nablus','غزة':'gaza','حمص':'homs','دير الزور':'deir-ez-zor','البتراء':'petra'
};
const cityNames=['القدس','دمشق','حلب','عمّان','بيروت','جسر الشغور','حماة','إدلب','إربد','اللاذقية','غزة','نابلس'];
const photoFor=name=>'/images/landmarks/'+(landmarkNames[name]||'generic')+'.svg';
let lastWeather=null,lastCity=null,posterIndex='daily',theme='ocean';
function currentCity(){return window.ClimatePlanet?.getCity?.()||lastCity}
function posterData(){const city=currentCity(),w=lastWeather?.city?.id===city?.id?lastWeather.json:null;return {city,w}}
function fillComparisonCities(){const select=id('v4ComparisonCity');if(!select)return;const existing=select.value;const options=(window.ClimatePlanet?.getCities?.()||[]).slice(0,1000);select.innerHTML='<option value="">اختر المدينة الثانية</option>'+options.map(c=>`<option value="${safe(c.id)}">${safe(c.ar||c.name)}</option>`).join('');if(options.some(c=>c.id===existing))select.value=existing;}
function renderLandmarks(){const holder=id('v4LandmarkCards');if(!holder)return;holder.innerHTML=cityNames.map(name=>`<button class="v4-landmark" type="button" data-landmark="${safe(name)}"><img src="${photoFor(name)}" alt="رسم توضيحي لمعالم ${safe(name)}" loading="lazy"><b>${safe(name)}</b><small>استكشف طقس المدينة</small></button>`).join('');holder.querySelectorAll('[data-landmark]').forEach(btn=>btn.addEventListener('click',()=>{
 const all=window.ClimatePlanet?.getCities?.()||[];const selected=all.find(x=>(x.ar||x.name)===btn.dataset.landmark);if(!selected){id('v4PosterStatus').textContent='هذه المدينة غير متاحة في دليل المدن الحالي.';return}
 window.ClimatePlanet.pickCity(selected);id('v4SelectedLandmark')?.scrollIntoView({behavior:'smooth',block:'center'});
}));}
function updateLandmark(city){if(!city)return;const location=city.ar||city.name||'',box=id('v4SelectedLandmark');if(!box)return;box.style.backgroundImage=`linear-gradient(90deg,rgba(5,23,38,.60),rgba(5,23,38,.14)),url("${photoFor(location)}")`;box.setAttribute('aria-label','رسم تخيلي لمعالم '+location);}
document.addEventListener('climate-cities-ready',()=>{renderLandmarks();fillComparisonCities()});renderLandmarks();fillComparisonCities();
document.addEventListener('climate-weather-ready',event=>{lastWeather=event.detail;lastCity=event.detail.city;updateLandmark(lastCity);id('v4PosterStatus').textContent='تم تحديث بيانات '+(lastCity.ar||lastCity.name)+'؛ يمكنك تنزيل البطاقة الآن.'});
const TEMPLATES=[
 ['daily','☁️','بطاقة الطقس اليومية','آخر توقع متاح'],['morning','🌅','صباح المدينة','درجات اليوم وتوقعاته'],['night','🌙','مساء اليوم','حالة الليل بصورة أنيقة'],
 ['rain','🌧️','متابعة الأمطار','فرصة المطر اليوم'],['wind','💨','الرياح والهبات','سرعة الرياح'],['snow','❄️','احتمالات الثلوج','سجل تنبؤي دون تهويل'],
 ['heat','☀️','تنبيه الأجواء الحارة','الراحة الحرارية'],['cold','🧊','الأجواء الباردة','درجة الحرارة المحسوسة'],['fog','🌫️','الضباب والرؤية','وصف حالة الطقس'],
 ['clothes','🧥','ماذا ترتدي؟','نصيحة ملابس إرشادية'],['transport','🚌','حركة المواصلات','ظروف جوية لا قرارات طرق'],['schools','🏫','المدارس والجامعات','إرشادات دون إعلان تعطيل'],
 ['farming','🌱','المزارع والطقس','تنبيه زراعي استرشادي'],['weekend','🏞️','نزهة وعطلة','الطقس وفرصة الهطول'],['windshear','🌪️','ملصق عاصفة','مراقبة الرياح فقط'],
 ['compare','⚖️','مقارنة مدينتين','قيمتان من المصدر'],['archive','📜','ذاكرة ثلوج القدس','مادة أرشيفية علمية'],['cosmos','🪐','حقيقة من الفضاء','معلومة علمية عامة'],['humidity','💧','رطوبة الهواء','الرطوبة النسبية'],['cloudcover','☁️','الغطاء السحابي','نسبة السحب الحالية'],['uv','🕶️','الأشعة فوق البنفسجية','مؤشر الأشعة'],['dailyhigh','🌡️','أعلى حرارة اليوم','درجة الحرارة العظمى'],['dailylow','🌡️','أدنى حرارة اليوم','درجة الحرارة الصغرى'],['gusts','〰️','هبات الرياح','الهبات اليومية القصوى'],['rainamount','🌧️','كميات الأمطار','الهطول اليومي بالملم'],['weekrain','💧','أمطار الأسبوع','مجموع الهطول خلال الأيام المتاحة'],['weekhigh','☀️','حرارة الأسبوع','أعلى قيمة في فترة التوقع'],['temperaturegap','🌤️','الفارق الحراري','الفرق بين العظمى والصغرى'],['skyconditions','🌥️','حالة الغيوم','نسبة الغطاء السحابي'],['windnow','🍃','الرياح الآن','توقع الرياح في المدينة'],['earth-science','🌍','معلومة عن الأرض','موسوعة الفضاء'],['moon-science','🌕','معلومة عن القمر','موسوعة الفضاء'],['galaxy-science','🌌','المجرات البعيدة','موسوعة الفضاء'],['geo-facts','⛰️','علوم الأرض','معلومة جيولوجية']
].map(([key,icon,title,subtitle])=>({key,icon,title,subtitle,weather:!['archive','cosmos','earth-science','moon-science','galaxy-science','geo-facts'].includes(key)}));
const STICKERS=[['sun','☀️','أجواء مشمسة'],['cloud','☁️','غيوم'],['rain','🌧️','أمطار'],['snow','❄️','ثلوج'],['thunder','⛈️','رعد وبرق'],['hail','🧊','برد'],['wind','💨','رياح'],['fog','🌫️','ضباب'],['dust','🌪️','غبار'],['frost','🥶','صقيع'],['summer','🌡️','حرارة'],['winter','🌨️','شتاء'],['umbrella','☂️','احمل مظلة'],['coat','🧥','ملابس دافئة'],['school','🏫','المدارس'],['bus','🚌','تنقل'],['road','🛣️','الطرق'],['farm','🌱','الزراعة'],['mountain','⛰️','المرتفعات'],['moon','🌙','سماء الليلة'],['earth','🌎','كوكب الأرض'],['orbit','🪐','المجموعة الشمسية'],['alert','⚠️','تنبيه إرشادي'],['history','📚','من الأرشيف'],['satellite','🛰️','قمر صناعي'],['telescope','🔭','رصد فلكي'],['sunset','🌇','غروب الشمس'],['sunrise','🌅','شروق الشمس'],['flood','🌊','سيول'],['ice','🧊','جليد'],['icecrystal','💠','بلورات ثلج'],['stormwatch','🌀','عاصفة'],['pressure','📉','ضغط جوي'],['temperature','🌡️','حرارة'],['forecast','🗓️','نشرة جوية'],['maps','🗺️','خرائط'],['europa','🌍','أوروبا'],['raincloud','🌦️','سحب ممطرة'],['blizzard','❄️','عاصفة ثلجية'],['star','⭐','نجوم'],['galaxy','🌌','مجرات'],['volcano','🌋','براكين']].map(([key,icon,title])=>({key,icon,title}));
function renderTemplates(){const el=id('v4PosterGrid');if(!el)return;id('v4ComparisonControl').hidden=posterIndex!=='compare';el.innerHTML=TEMPLATES.map((t,i)=>`<button type="button" class="v4-poster-choice ${t.key===posterIndex?'is-selected':''}" data-template="${t.key}" style="--tone:${i%4}"><span class="v4-poster-emoji">${t.icon}</span><b>${t.title}</b><small>${t.subtitle}</small></button>`).join('');el.querySelectorAll('[data-template]').forEach(btn=>btn.addEventListener('click',()=>{posterIndex=btn.dataset.template;renderTemplates();id('v4PosterStatus').textContent='القالب المحدد: '+TEMPLATES.find(t=>t.key===posterIndex).title}));}
function renderStickers(){const el=id('v4StickerGrid');if(!el)return;el.innerHTML=STICKERS.map(s=>`<button type="button" class="v4-sticker" data-sticker="${s.key}" title="تنزيل PNG شفاف"><span>${s.icon}</span><b>${s.title}</b><small>↓ PNG</small></button>`).join('');el.querySelectorAll('[data-sticker]').forEach(btn=>btn.addEventListener('click',async()=>{try{await downloadSticker(STICKERS.find(s=>s.key===btn.dataset.sticker))}catch(err){console.error(err);alert('تعذر إنشاء الملصق الآن.')}}));}
const THEMES={ocean:['#061421','#104a63','#40d7cd','#f7ffff'],glacier:['#0b1737','#155b86','#7ce5ef','#efffff'],sunset:['#2e2033','#b25053','#ffd18f','#fff8e7'],storm:['#08101d','#2d405f','#9cbfff','#f0f6ff']};
const waitImage=url=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url});
async function getLogo(){return waitImage('/images/brand/climate-planet-transparent.png')}
const number=x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))?null:Number(x);
const round=x=>x===null?'—':Math.round(x).toLocaleString('ar');
function setFont(ctx,size,weight=700){ctx.font=`${weight} ${size}px Cairo, "IBM Plex Sans Arabic",sans-serif`}
function printFitted(ctx,value,x,y,maxWidth,size,weight=700){setFont(ctx,size,weight);let str=String(value||'');while(ctx.measureText(str).width>maxWidth&&str.length>3)str=str.slice(0,-2);if(str!==String(value||''))str+='…';ctx.fillText(str,x,y)}
function roundRect(ctx,x,y,w,h,r=18){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function climateStatus(t,w){const c=w.current,d=w.daily;
 const f=x=>Number.isFinite(Number(x))&&x!==null&&x!==undefined?Number(x):null;
 if(t.key==='humidity')return ['الرطوبة النسبية',f(c.relative_humidity_2m)===null?'—':Math.round(f(c.relative_humidity_2m))+'%','من بيانات التوقع الحالية'];
 if(['cloudcover','skyconditions'].includes(t.key))return ['الغطاء السحابي',f(c.cloud_cover)===null?'—':Math.round(f(c.cloud_cover))+'%','نسبة السحب المتوقعة'];
 if(t.key==='uv')return ['مؤشر الأشعة UV',f(c.uv_index)===null?'—':f(c.uv_index).toFixed(1),'قيمة النموذج الحالية'];
 if(t.key==='dailyhigh')return ['العظمى اليوم',f(d?.temperature_2m_max?.[0])===null?'—':Math.round(f(d.temperature_2m_max[0]))+'°','أعلى حرارة متوقعة خلال اليوم'];
 if(t.key==='dailylow')return ['الصغرى اليوم',f(d?.temperature_2m_min?.[0])===null?'—':Math.round(f(d.temperature_2m_min[0]))+'°','أدنى حرارة متوقعة خلال اليوم'];
 if(t.key==='gusts')return ['هبات الرياح',f(d?.wind_gusts_10m_max?.[0])===null?'—':Math.round(f(d.wind_gusts_10m_max[0]))+' كم/س','أقصى هبة متوقعة اليوم'];
 if(t.key==='rainamount')return ['هطول اليوم',f(d?.precipitation_sum?.[0])===null?'—':f(d.precipitation_sum[0]).toFixed(1)+' ملم','تراكم اليوم المتوقع'];
 if(t.key==='weekrain'){const arr=(d?.precipitation_sum||[]).map(f).filter(x=>x!==null);return ['هطول الأيام القادمة',arr.length?arr.reduce((a,b)=>a+b,0).toFixed(1)+' ملم':'—',arr.length+' أيام من التوقعات متاحة']}
 if(t.key==='weekhigh'){const arr=(d?.temperature_2m_max||[]).map(f).filter(x=>x!==null);return ['أعلى حرارة في الفترة',arr.length?Math.round(Math.max(...arr))+'°':'—',arr.length+' أيام من التوقعات متاحة']}
 if(t.key==='temperaturegap'){const mx=f(d?.temperature_2m_max?.[0]),mn=f(d?.temperature_2m_min?.[0]);return ['المدى الحراري اليومي',mx!==null&&mn!==null?(mx-mn).toFixed(1)+'°':'—','الفرق بين العظمى والصغرى المتوقعتين']}
 if(t.key==='windnow')return ['الرياح الآن',f(c.wind_speed_10m)===null?'—':Math.round(f(c.wind_speed_10m))+' كم/س','سرعة الرياح المتوقعة'];
if(t.key==='rain')return ['فرصة المطر اليوم',`${round(number(d?.precipitation_probability_max?.[0]))}%`,'الاحتمال لا يساوي كمية الهطول'];
 if(t.key==='wind'||t.key==='windshear')return ['سرعة الرياح',`${round(number(c.wind_speed_10m))} كم/س`,'الرياح وفق توقع نقطة المدينة'];
 if(t.key==='cold')return ['الحرارة المحسوسة',`${round(number(c.apparent_temperature))}°`,'انتبه للهواء البارد'];
 if(t.key==='heat')return ['الحرارة المحسوسة',`${round(number(c.apparent_temperature))}°`,'حافظ على شرب المياه'];
 if(t.key==='snow'){const wx=Number(c.weather_code);return ['الثلوج في المدينة',([71,73,75,77,85,86].includes(wx)?'رمز ثلجي':'لا يظهر رمز ثلجي'),'حالة متوقعة وليست رصدًا'];}
 if(t.key==='clothes'){const temp=number(c.apparent_temperature);return ['اقتراح الملابس',temp===null?'غير متاح':temp<=5?'معطف ثقيل':temp<=15?'سترة دافئة':temp<=25?'ملابس خفيفة':'ملابس صيفية','إرشاد عام يتأثر بالرياح والنشاط'];}
 if(t.key==='transport')return ['الرياح للتنقل',`${round(number(c.wind_speed_10m))} كم/س`,'تحقق من الجهات الرسمية للطرق'];
 if(t.key==='schools')return ['طقس اليوم للطلاب',`${round(number(c.temperature_2m))}°`,'لا يتضمن إعلان تعطيل أو دوام'];
 if(t.key==='farming')return ['الحرارة للزراعة',`${round(number(d?.temperature_2m_min?.[0]))}° أدنى`,'نصيحة استرشادية للمزارعين'];
 if(t.key==='weekend')return ['فرصة هطول اليوم',`${round(number(d?.precipitation_probability_max?.[0]))}%`,'تحقق من التوقع للموعد المقصود'];
 if(t.key==='fog')return ['حالة السماء',`${round(number(c.cloud_cover))}% سحب`,'لا تتوفر هنا قياسات رؤية مباشرة'];
 return ['درجة الحرارة الآن',`${round(number(c.temperature_2m))}°`,'توقع/تحليل عددي وليس رصد محطة'];}
function saveCanvas(canvas,name){return new Promise((resolve,reject)=>{canvas.toBlob(blob=>{if(!blob)return reject(Error('Canvas export unavailable'));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.download=name;a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);resolve()},'image/png')})}
async function drawPoster(){
 const template=TEMPLATES.find(t=>t.key===posterIndex)||TEMPLATES[0],{city,w}=posterData();if(template.weather&&(!city||!w?.current))throw Error('اختر مدينة وانتظر تحميل بياناتها قبل تنزيل هذا القالب.');
 let comparison=null;
 if(template.key==='compare'){
   const other=(window.ClimatePlanet?.getCities?.()||[]).find(c=>c.id===id('v4ComparisonCity').value);
   if(!other||other.id===city.id)throw Error('اختر مدينة ثانية مختلفة للمقارنة.');
   const url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',other.lat);url.searchParams.set('longitude',other.lon);url.searchParams.set('current','temperature_2m');url.searchParams.set('timezone','auto');
   const response=await fetch(url.toString());if(!response.ok)throw Error('تعذر جلب بيانات المدينة الثانية.');const data=await response.json();const secondTemp=number(data.current?.temperature_2m);
   if(secondTemp===null)throw Error('درجة حرارة المدينة الثانية غير متاحة الآن.');comparison={other,secondTemp,time:data.current?.time||'—'};
 }
 const [W,H]=id('v4PosterSize').value.split('x').map(Number),themeId=id('v4PosterTheme').value,colors=THEMES[themeId]||THEMES.ocean;
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');const min=Math.min(W,H),pad=Math.round(min*.056),portrait=H>W*1.2;
 const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,colors[0]);grad.addColorStop(.56,colors[1]);grad.addColorStop(1,colors[0]);ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 // original design shapes, without false meteorological information
 ctx.lineWidth=2;for(let i=0;i<13;i++){ctx.strokeStyle=`rgba(173,242,244,${.045+i*.001})`;ctx.beginPath();ctx.moveTo(i*W/11-100,0);ctx.lineTo(i*W/11-200,H);ctx.stroke()}
 const rg=ctx.createRadialGradient(W*.28,H*.72,2,W*.28,H*.72,min*.65);rg.addColorStop(0,colors[2]+'55');rg.addColorStop(1,colors[2]+'00');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle=colors[2]+'88';ctx.lineWidth=3;roundRect(ctx,pad*.5,pad*.5,W-pad,H-pad,Math.floor(min*.03));ctx.stroke();
 const img=await waitImage(photoFor(city?.ar||city?.name||'generic'));
 const art=portrait?{x:pad,y:H*.145,w:W-2*pad,h:H*.27}:{x:pad,y:H*.205,w:W*.41,h:H*.56};
 if(img){ctx.save();roundRect(ctx,art.x,art.y,art.w,art.h,min*.022);ctx.clip();ctx.drawImage(img,art.x,art.y,art.w,art.h);ctx.restore();}
 else{ctx.fillStyle=colors[1];roundRect(ctx,art.x,art.y,art.w,art.h,min*.025);ctx.fill()}
 ctx.direction='rtl';ctx.textAlign='right';ctx.fillStyle=colors[2];printFitted(ctx,'كوكب المناخ  ·  CLIMATE PLANET',W-pad,pad*1.38,W*.7,Math.round(min*.030),800);
 const logo=await getLogo();if(logo)ctx.drawImage(logo,pad*.56,pad*.55,min*.10,min*.10);
 ctx.fillStyle='#ffffff';const mainX=W-pad;const headlineY=portrait?H*.48:H*.29;
 printFitted(ctx,template.title,mainX,headlineY,portrait?W-pad*2:W*.48,Math.round(min*.065),800);
 const town=city?.ar||city?.name||'كوكب المناخ';ctx.fillStyle=colors[2];printFitted(ctx,template.weather?town:'موسوعة كوكب المناخ',mainX,headlineY+min*.075,W*.75,Math.round(min*.047),800);
 let metric='معلومة علمية',descriptor='محتوى توثيقي من كوكب المناخ';
 if(template.weather){[descriptor,metric]=climateStatus(template,w);if(comparison){metric=`${round(number(w.current.temperature_2m))}° / ${round(comparison.secondTemp)}°`;descriptor=`${city.ar||city.name} × ${comparison.other.ar||comparison.other.name}`}}else if(template.key==='archive'){metric='1950—2026';descriptor='أرشيف القدس الشتوي | موثق حسب المصدر'}else if(template.key==='cosmos'){metric='21 جرمًا';descriptor='موسوعة فضائية عربية داخل الموقع'}
 else if(template.key==='earth-science'){metric='≈ 365.25 يومًا';descriptor='مدة السنة المدارية للأرض تقريبًا'}
 else if(template.key==='moon-science'){metric='≈ 29.5 يومًا';descriptor='متوسط الدورة الاقترانية لأطوار القمر'}
 else if(template.key==='galaxy-science'){metric='درب التبانة';descriptor='المجرة التي تنتمي إليها مجموعتنا الشمسية'}
 else if(template.key==='geo-facts'){metric='الغلاف الصخري';descriptor='جزء من بنية الأرض الخارجية'}
 const metricY=portrait?H*.66:H*.53;ctx.fillStyle='#ffffff';printFitted(ctx,metric,mainX,metricY,portrait?W-pad*2:W*.48,Math.round(min*(portrait?.115:.105)),800);
 ctx.fillStyle=colors[2];printFitted(ctx,descriptor,mainX,metricY+min*.08,portrait?W-pad*2:W*.48,Math.round(min*.031),700);
 const footerY=H-pad*1.55;ctx.fillStyle='rgba(255,255,255,.12)';roundRect(ctx,pad,footerY-min*.098,W-2*pad,min*.115,min*.015);ctx.fill();
 let details='محتوى تحريري · يحتاج متابعة تحديثات المصادر';
 if(template.weather){const c=w.current,d=w.daily;details=comparison?`حرارة متوقعة | ${c.time||'—'} ↔ ${comparison.time}`:`المحسوسة ${round(number(c.apparent_temperature))}°  |  الرياح ${round(number(c.wind_speed_10m))} كم/س  |  رطوبة ${round(number(c.relative_humidity_2m))}%`;}
 ctx.fillStyle='#f0feff';printFitted(ctx,details,W-pad*1.30,footerY-min*.021,W-pad*3,Math.round(min*.028),700);
 ctx.fillStyle='#bad8e2';const date=template.weather?(w.current.time||'—').replace('T',' '):new Date().toLocaleDateString('ar');
 printFitted(ctx,`المصدر: ${template.weather?'Open-Meteo · توقع عددي': 'كوكب المناخ · محتوى تحريري'}  |  ${date}`,W-pad*1.2,H-pad*.74,W-pad*2,Math.round(min*.019),500);
 return {canvas,name:`ClimatePlanet-V4-${template.key}-${city?.id||'science'}-${W}x${H}.png`};
}
async function downloadPoster(){const btn=id('v4DownloadPoster');if(btn){btn.disabled=true;btn.textContent='جاري تجهيز الصورة…'}try{await document.fonts?.ready;const {canvas,name}=await drawPoster();await saveCanvas(canvas,name);id('v4PosterStatus').textContent='✓ تم تجهيز بطاقة '+TEMPLATES.find(t=>t.key===posterIndex).title+' بجودة '+canvas.width+' × '+canvas.height;}catch(err){id('v4PosterStatus').textContent=err.message;throw err}finally{if(btn){btn.disabled=false;btn.textContent='↓ تنزيل القالب المختار PNG'}}}
const old =window.ClimatePoster;window.ClimatePoster={...old,download:downloadPoster,templates:TEMPLATES};
async function downloadSticker(sticker){await document.fonts?.ready;const cv=document.createElement('canvas');cv.width=800;cv.height=800;const c=cv.getContext('2d');
 const gradient=c.createLinearGradient(130,100,650,710);gradient.addColorStop(0,'#134f6aec');gradient.addColorStop(1,'#0b273ee6');c.fillStyle=gradient;c.shadowColor='#53ebe6';c.shadowBlur=34;roundRect(c,65,105,670,595,135);c.fill();c.shadowBlur=0;c.lineWidth=13;c.strokeStyle='#66f1e5';roundRect(c,65,105,670,595,135);c.stroke();
 c.textAlign='center';c.fillStyle='white';c.font='240px sans-serif';c.fillText(sticker.icon,400,405);setFont(c,63,800);c.fillText(sticker.title,400,580);
 const logo=await getLogo();if(logo)c.drawImage(logo,640,605,75,75);await saveCanvas(cv,'ClimatePlanet-Sticker-'+sticker.key+'.png');}
id('v4PosterSize')?.addEventListener('change',()=>{id('v4PosterStatus').textContent='تم اختيار المقاس '+id('v4PosterSize').value});
id('v4PosterTheme')?.addEventListener('change',()=>{theme=id('v4PosterTheme').value});
id('v4DownloadPoster')?.addEventListener('click',()=>downloadPoster().catch(console.warn));
renderTemplates();renderStickers();
// User-curated uploaded forecast images only; don't scrape or misrepresent Météociel screenshots.
let modelItems=[];let activeModel='all';
function renderModelGallery(){const root=id('v4ModelCards');if(!root)return;const items=modelItems.filter(m=>activeModel==='all'||String(m.model||'').toUpperCase()===activeModel);
 root.innerHTML=items.length?items.map(m=>{const title=safe(m.title||'خريطة جوية'),src=String(m.image||'');const valid=/^\/images\/[a-z0-9_./-]+$/i.test(src);return `<article class="v4-model-card">${valid?`<img loading="lazy" alt="${title}" src="${safe(src)}">`:'<div class="v4-model-placeholder">▧</div>'}<div><span>${safe(m.model||'نموذج غير محدد')} · ${safe(m.layer||'طبقة غير محددة')}</span><h3>${title}</h3><p>تشغيل ${safe(m.run||'غير محدد')} · ساعة +${safe(m.forecastHour??'؟')}</p><small>${safe(m.source||'كوكب المناخ')}</small></div></article>`}).join(''):'<div class="v4-model-empty"><span>🗺️</span><h3>الخرائط المنشورة</h3><p>لا توجد خرائط منشورة لهذا النموذج في الوقت الحالي.</p></div>';
}
id('v4ModelFilters')?.addEventListener('click',e=>{const btn=e.target.closest('[data-model]');if(!btn)return;activeModel=btn.dataset.model;id('v4ModelFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('is-on',x===btn));renderModelGallery()});
fetch('/data/maps.json').then(r=>r.ok?r.json():[]).then(x=>{modelItems=Array.isArray(x)?x:[];renderModelGallery()}).catch(()=>renderModelGallery());
