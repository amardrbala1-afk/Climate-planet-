/* Climate Planet V3 regional forecast explorer.
 * Real, point-based daily data from Open-Meteo; NOT gridded synoptic model/radar output.
 * All samples come from public named localities; the map never generates synthetic values.
 */
const SITES=[
 ['القدس','فلسطين',31.7683,35.2137],['غزة','فلسطين',31.5017,34.4668],['الخليل','فلسطين',31.5326,35.0998],['نابلس','فلسطين',32.2211,35.2544],
 ['رام الله','فلسطين',31.9029,35.2062],['عمّان','الأردن',31.9539,35.9106],['إربد','الأردن',32.5556,35.8500],['العقبة','الأردن',29.5319,35.0061],['السلط','الأردن',32.0392,35.7272],
 ['دمشق','سوريا',33.5138,36.2765],['حلب','سوريا',36.2021,37.1343],['حمص','سوريا',34.7324,36.7137],['اللاذقية','سوريا',35.5317,35.7901],['درعا','سوريا',32.6189,36.1021],['دير الزور','سوريا',35.336,40.145],
 ['بيروت','لبنان',33.8938,35.5018],['طرابلس','لبنان',34.4367,35.8497],['صيدا','لبنان',33.5630,35.3710],['صور','لبنان',33.2710,35.2038]
];
const el=id=>document.getElementById(id);
let map=null,points=[],forecast=[],selectedDay=0,selectedLayer='temperature',started=false,playTimer=null,baseLayer=null,baseStyle='terrain';
const nums=(a,idx)=>a?.[idx]===null||a?.[idx]===undefined?null:Number(a[idx]);
const pretty=(v,d=0)=>Number.isFinite(v)?v.toFixed(d):'—';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(row,i)=>{
 if(!row)return null;
 const key={temperature:'temperature_2m_max',precipitation:'precipitation_sum',wind:'wind_speed_10m_max'}[selectedLayer];
 return nums(row.daily?.[key],i);
};
const hue=(v)=>selectedLayer==='temperature' ? v<=0?'#8a7aea':v<=9?'#65b8f0':v<=19?'#35c9bc':v<=29?'#ffc565':'#f27866' : selectedLayer==='precipitation'?v<1?'#9cb8c4':v<5?'#5ab7ed':v<20?'#36d1b0':v<40?'#ffc76e':'#fb7f73':v<15?'#5bc6b8':v<30?'#e6c16b':v<55?'#f59664':'#e06be4';
const unit=()=>({temperature:'°',precipitation:' مم',wind:' كم/س'})[selectedLayer];
function mapUrl(){const u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',SITES.map(x=>x[2]).join(','));u.searchParams.set('longitude',SITES.map(x=>x[3]).join(','));u.searchParams.set('daily','temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code');u.searchParams.set('timezone','auto');u.searchParams.set('forecast_days','7');return u.toString()}
const status=s=>el('opsStatus').textContent=s;
function lazyLeaflet(){if(window.L)return Promise.resolve(window.L);return new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';sc.onload=()=>window.L?resolve(window.L):reject(Error('No Leaflet export'));sc.onerror=()=>reject(Error('Map library CDN unavailable'));document.head.append(sc)})}
async function mapInit(){if(map)return;try{const L=await lazyLeaflet();map=L.map('opsMap',{zoomControl:false,scrollWheelZoom:false,preferCanvas:true}).setView([33.45,36.3],6);L.control.zoom({position:'bottomleft'}).addTo(map);setBaseStyle('terrain');
 }catch(e){map=null;status('الخريطة الأساسية غير متاحة، لكن جدول توقعات المدن سيبقى متاحًا.');el('opsMap').innerHTML='<div class="ops-map-fallback">تعذر تحميل خرائط التفاعل من الشبكة. بيانات المدن تظهر في البطاقات أسفل الخريطة.</div>';console.warn(e)}}
function setBaseStyle(style){baseStyle=style;const L=window.L;if(!map||!L)return;if(baseLayer)map.removeLayer(baseLayer);const topo=style==='terrain';baseLayer=L.tileLayer(topo?'https://tile.openmaps.fr/opentopomap/{z}/{x}/{y}.png':'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:topo?17:19,minZoom:4,attribution:topo?'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="https://openmaps.fr/">OpenTopoMap-R / openmaps.fr ♥</a>':'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});baseLayer.addTo(map);document.querySelectorAll('#v4MapStyles [data-mapstyle]').forEach(b=>b.classList.toggle('is-on',b.dataset.mapstyle===style));}
document.getElementById('v4MapStyles')?.addEventListener('click',e=>{const b=e.target.closest('[data-mapstyle]');if(b)setBaseStyle(b.dataset.mapstyle)});
async function fetchForecast(force=false){if(!force){try{const value=JSON.parse(sessionStorage.getItem('cp:ops:v3')||'null');if(value&&Date.now()-value.t<45*60*1000&&value.data.length===SITES.length)return value.data}catch{}}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
 try{const response=await fetch(mapUrl(),{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(!Array.isArray(data)||data.length!==SITES.length)throw Error('Point forecast response malformed');if(!data.every(d=>Array.isArray(d?.daily?.time)))throw Error('Missing forecast days');try{sessionStorage.setItem('cp:ops:v3',JSON.stringify({t:Date.now(),data}))}catch{}return data}finally{clearTimeout(timeout)}
}
function draw(){el('opsLegend').textContent=({temperature:'الحرارة العظمى المتوقعة بالدرجة المئوية',precipitation:'الهطول التراكمي اليومي بالمليمتر',wind:'أعلى سرعة رياح يومية بالكيلومتر/ساعة'})[selectedLayer];
 if(forecast.length===0)return;
 const date=forecast[0]?.daily?.time?.[selectedDay];el('opsDayLabel').textContent=date?new Intl.DateTimeFormat('ar',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'—';
 const boxes=[];
 if(map){const L=window.L;for(const marker of points)map.removeLayer(marker);points=[]}
 for(let i=0;i<SITES.length;i++){
 const [name,country,lat,lon]=SITES[i],n=val(forecast[i],selectedDay),shade=n===null?'#a8afc1':hue(n);const text=n===null?'—':pretty(n)+(selectedLayer==='temperature'?'°':'');
 const suffix=n===null?'غير متاح':`${pretty(n,selectedLayer==='precipitation'?1:0)}${unit()}`;
 boxes.push(`<button type="button" class="ops-city" data-ops-city="${i}"><span class="ops-mini-dot" style="background:${shade}"></span><strong>${esc(name)}</strong><small>${esc(country)}</small><b>${esc(suffix)}</b></button>`);
 if(map){const html=`<div class="ops-pin" style="--pin:${shade}" title="${esc(name)}"><span>${esc(name)}</span><b>${esc(text)}</b></div>`;const marker=L.marker([lat,lon],{icon:L.divIcon({className:'ops-pin-shell',html,iconSize:[85,50],iconAnchor:[42,26]})}).addTo(map);
 marker.bindPopup(`<div dir="rtl"><b>${esc(name)} · ${esc(country)}</b><p>${esc(suffix)} — ${esc(date||'')}</p><button onclick="document.dispatchEvent(new CustomEvent('ops-open-city',{detail:{name:'${esc(name)}'}}))">تفاصيل الطقس ←</button></div>`);points.push(marker)}
 }
 el('opsCityCards').innerHTML=boxes.join('');el('opsCityCards').querySelectorAll('[data-ops-city]').forEach(btn=>btn.addEventListener('click',()=>openCity(SITES[Number(btn.dataset.opsCity)][0])));
 el('opsDays').innerHTML=(forecast[0]?.daily?.time||[]).slice(0,7).map((d,i)=>`<button type="button" data-day="${i}" class="${i===selectedDay?'is-on':''}">${new Intl.DateTimeFormat('ar',{weekday:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'))}</button>`).join('');el('opsDays').querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>setDay(Number(b.dataset.day))));
}
function openCity(name){const items=window.ClimatePlanet?.getCities?.()||[];const chosen=items.find(c=>(c.ar||c.name)===name)||items.find(c=>(c.ar||c.name).includes(name));if(chosen){location.hash='#weather';setTimeout(()=>window.ClimatePlanet.pickCity(chosen),100)}else{status('المدينة غير موجودة في دليل المناطق الحالي؛ يمكن مراجعة بياناتها على الخريطة.')}}
document.addEventListener('ops-open-city',e=>openCity(e.detail.name));
function setDay(d){selectedDay=Math.max(0,Math.min(6,d));el('opsDay').value=String(selectedDay);draw()}
function stop(){if(playTimer){clearInterval(playTimer);playTimer=null}el('opsPlay').textContent='▶ تشغيل'}
el('opsDay').addEventListener('input',e=>{stop();setDay(Number(e.target.value))});el('opsPlay').addEventListener('click',()=>{if(playTimer){stop();return}if(!forecast.length)return;el('opsPlay').textContent='Ⅱ إيقاف';playTimer=setInterval(()=>setDay((selectedDay+1)%7),1700)});
el('opsLayers').addEventListener('click',e=>{const b=e.target.closest('[data-layer]');if(!b)return;selectedLayer=b.dataset.layer;el('opsLayers').querySelectorAll('button').forEach(x=>x.classList.toggle('is-on',x===b));draw()});
el('opsReload').addEventListener('click',()=>run(true));
async function run(force=false){status('تحميل أحدث توقعات عينة المدن…');el('opsReload').disabled=true;try{
 await mapInit();forecast=await fetchForecast(force);draw();status('✓ توقعات '+forecast.length+' مدينة · آخر جلب '+new Intl.DateTimeFormat('ar',{hour:'2-digit',minute:'2-digit'}).format(new Date())+' · المصدر Open-Meteo');
 }catch(err){console.warn('Operations forecast',err);forecast=[];draw();el('opsCityCards').innerHTML='<div class="empty-inline">تعذر تحميل التوقعات من المصدر الآن. لن نعرض قيَمًا افتراضية أو مخترعة.</div>';status('تعذر الاتصال بالمصدر. جرّب التحديث لاحقًا.')}finally{el('opsReload').disabled=false}}
document.addEventListener('planet-page',e=>{if(e.detail.page==='operations'){if(document.querySelector('[data-v5-panel=cities]')?.hidden)return;if(!started){started=true;run()}else{setTimeout(()=>map?.invalidateSize(),60)}}else stop()});
document.getElementById('v5OpsTabs')?.addEventListener('click',e=>{if(e.target.closest('[data-v5-ops=cities]')){if(!started){started=true;run()}else{setTimeout(()=>map?.invalidateSize(),80)}}});
if((location.hash==='#operations'||(!location.hash&&document.querySelector('[data-page=operations]')?.classList.contains('is-active')))&&!document.querySelector('[data-v5-panel=cities]')?.hidden){started=true;run()}
