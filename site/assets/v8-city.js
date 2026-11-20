/* V8 city dashboard, comparative forecast and daily Levant pulse.
   Every displayed metric is fetched from Open-Meteo, never synthetic. */
const byId=id=>document.getElementById(id);
const number=v=>v===null||v===undefined||!Number.isFinite(+v)?null:+v;
const fmt=(v,unit='')=>number(v)===null?'—':Math.round(+v)+unit;
let latest=null,selectedDate=0,batch=null,comparisonController=null;
const norm=s=>String(s||'').normalize('NFKD').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه');
const dayDesc=(d,i)=>{const code=d?.weather_code?.[i];return code>=95?'احتمال عواصف رعدية':code>=80?'فرص زخات':code>=71&&code<=77?'أجواء ثلجية':code>=61&&code<=67?'أمطار متوقعة':code===3?'سماء غائمة':code===0?'سماء صافية':'حالة جوية متغيرة'};
function updateCity(){if(!latest)return;const {city,json}=latest;const d=json.daily||{},i=selectedDate;
 byId('v8CityHeadline').textContent=(city.ar||city.name)+' · '+dayDesc(d,i);
 byId('v8CityTiming').textContent=(d.time?.[i]||'—')+' · المصدر Open-Meteo · بيانات تنبؤية';
 byId('v8CityMax').textContent=fmt(d.temperature_2m_max?.[i],'°');
 byId('v8CityMin').textContent=fmt(d.temperature_2m_min?.[i],'°');
 byId('v8CityRain').textContent=number(d.precipitation_sum?.[i])===null?'—':Number(d.precipitation_sum[i]).toFixed(1)+' ملم';
 byId('v8CityGust').textContent=fmt(d.wind_gusts_10m_max?.[i],' كم/س');
 const feel=d.temperature_2m_min?.[i];const gust=d.wind_gusts_10m_max?.[i];const rain=d.precipitation_sum?.[i];const tips=[];
 if(number(feel)!==null&&feel<=4)tips.push('ملابس شتوية دافئة');else if(number(feel)!==null&&feel<=14)tips.push('ملابس متعددة الطبقات');else tips.push('ملابس ملائمة للحرارة');
 if(number(gust)!==null&&gust>=50)tips.push('انتباه للرياح القوية');
 if(number(rain)!==null&&rain>=5)tips.push('تجهيز مظلة أو سترة مقاومة للمطر');
 byId('v8DayDescriptor').textContent=tips.join(' · ');
 const sunrise=d.sunrise?.[i],sunset=d.sunset?.[i];byId('v8Sunrise').textContent=sunrise?.split('T')[1]||'—';byId('v8Sunset').textContent=sunset?.split('T')[1]||'—';
 if(!byId('v8CityComparePanel').hidden&&byId('v8CityCompareSelect').value)loadComparison();
}
function populateCities(){const select=byId('v8CityCompareSelect');const current=select.value;const list=window.ClimatePlanet?.getCities?.()||[];select.replaceChildren();const first=new Option('اختر مدينة ثانية','');select.append(first);
 for(const city of list.slice(0,1000)){const opt=new Option(city.ar||city.name,String(city.id));select.append(opt)}select.value=current;}
byId('v8CityCompareToggle').addEventListener('click',()=>{const panel=byId('v8CityComparePanel');panel.hidden=!panel.hidden;if(!panel.hidden){populateCities();if(byId('v8CityCompareSelect').value)loadComparison()}});
async function loadComparison(){const first=latest?.city;const option=byId('v8CityCompareSelect').value;if(!first||!option)return;
 const city=window.ClimatePlanet?.getCities?.().find(c=>String(c.id)===option);const el=byId('v8CityCompareResult');if(!city)return;
 if(city.id===first.id){el.textContent='اختر مدينة مختلفة عن المدينة الأساسية.';return}
 comparisonController?.abort();comparisonController=new AbortController();el.textContent='تحميل مقارنة المدينتين…';
 const url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',city.lat);url.searchParams.set('longitude',city.lon);url.searchParams.set('daily','temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max');url.searchParams.set('timezone','auto');url.searchParams.set('forecast_days','7');
 try{const res=await fetch(url,{signal:comparisonController.signal});if(!res.ok)throw Error('HTTP '+res.status);const other=(await res.json()).daily,date=latest.json.daily?.time?.[selectedDate];const i=other.time?.indexOf(date);if(i<0)throw Error('لا توجد توقعات لنفس التاريخ');
 const r=[['العظمى',latest.json.daily.temperature_2m_max?.[selectedDate],other.temperature_2m_max?.[i],'°'],['الصغرى',latest.json.daily.temperature_2m_min?.[selectedDate],other.temperature_2m_min?.[i],'°'],['الأمطار',latest.json.daily.precipitation_sum?.[selectedDate],other.precipitation_sum?.[i],' ملم']];
 el.replaceChildren();const title=document.createElement('strong');title.textContent=(first.ar||first.name)+' × '+(city.ar||city.name)+' — '+date;el.append(title);
 const table=document.createElement('div');table.className='v8-city-compare-grid';for(const [n,a,b,u] of r){const row=document.createElement('p');row.textContent=`${n}: ${a==null?'—':(+a).toFixed(u===' ملم'?1:0)+u} مقابل ${b==null?'—':(+b).toFixed(u===' ملم'?1:0)+u}`;table.append(row)}el.append(table);
 }catch(e){if(e.name!=='AbortError')el.textContent='تعذرت المقارنة الآن. '+e.message}}
byId('v8CityCompareSelect').addEventListener('change',loadComparison);
document.addEventListener('climate-weather-ready',e=>{latest=e.detail;selectedDate=0;updateCity();populateCities()});
document.addEventListener('v8-card-date-change',e=>{selectedDate=e.detail.index;updateCity()});
document.addEventListener('climate-cities-ready',()=>{populateCities();loadLeaders()});
const featured=['القدس','عمان','عمّان','دمشق','بيروت','حلب','إربد','نابلس','اللاذقية','غزة','طرابلس','حمص','حماة','جسر الشغور'];
function chooseLeaders(){const list=window.ClimatePlanet?.getCities?.()||[];const results=[],ids=new Set();for(const wanted of featured){const c=list.find(x=>norm(x.ar||x.name)===norm(wanted));if(c&&!ids.has(String(c.id))){results.push(c);ids.add(String(c.id))}}return results.slice(0,11)}
async function loadLeaders(){const host=byId('v8LeadersGrid');if(!host)return;const cities=chooseLeaders();if(cities.length<2){host.textContent='لم تُحمّل قائمة المدن بعد.';return}
 const url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',cities.map(x=>x.lat).join(','));url.searchParams.set('longitude',cities.map(x=>x.lon).join(','));url.searchParams.set('current','temperature_2m,wind_speed_10m');url.searchParams.set('daily','precipitation_probability_max');url.searchParams.set('timezone','auto');url.searchParams.set('forecast_days','1');
 try{let rows;if(batch&&Date.now()-batch.t<20*60e3)rows=batch.rows;else{const response=await fetch(url);if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();rows=Array.isArray(data)?data:[data];batch={t:Date.now(),rows}}
 const list=cities.map((city,i)=>({city,t:number(rows[i]?.current?.temperature_2m),wind:number(rows[i]?.current?.wind_speed_10m),rain:number(rows[i]?.daily?.precipitation_probability_max?.[0])}));
 const valid=(key,descending)=>list.filter(x=>x[key]!==null).sort((a,b)=>descending?b[key]-a[key]:a[key]-b[key]);
 const cards=[['☀️','أعلى حرارة',valid('t',true)[0],'t','°'],['❄️','أقل حرارة',valid('t',false)[0],'t','°'],['💨','أقوى رياح',valid('wind',true)[0],'wind',' كم/س'],['🌧️','أعلى احتمال مطر',valid('rain',true)[0],'rain','%']];
 host.replaceChildren();for(const [icon,title,rec,key,unit] of cards){const item=document.createElement('div');item.className='v8-leader';const sm=document.createElement('small');sm.textContent=icon+' '+title;const name=document.createElement('b');name.textContent=rec?.city?.ar||rec?.city?.name||'غير متاح';const v=document.createElement('strong');v.textContent=rec?Math.round(rec[key])+unit:'—';item.append(sm,name,v);host.append(item)}
 byId('v8LeadersSource').textContent='مقارنة مدن مختارة فقط · Open-Meteo · أرقام توقعية وليست رصدًا رسميًا';
 }catch(e){host.textContent='تعذر تحميل مقارنة المدن الآن. يمكن متابعة طقس كل مدينة من قسم الطقس.'}
}
byId('v8LeadersRefresh')?.addEventListener('click',()=>{batch=null;loadLeaders()});
if(window.ClimatePlanet?.getCities?.().length)loadLeaders();
