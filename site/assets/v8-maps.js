/* Climate Planet V8 map enhancements. UI never invents missing frames. */
const e=id=>document.getElementById(id);
const C=()=>window.V8Atlas?.getCatalog?.()||[];
const PL=()=>window.V8Atlas?.getPlaylist?.()||[];
const curr=()=>window.V8Atlas?.getCurrent?.();
let composite=false,pointController=null;
const accum=e('v8AccumHours');const field=e('v5Field'),region=e('v5Region'),model=e('v5Model'),hour=e('v5ForecastHour');
function refreshExtras(){const rain=field.value==='rain';e('v8RainWindowLabel').hidden=!rain;
 const frames=PL(),max=rain?Math.max(0,Math.floor(72/Number(accum.value))):13;
 const exp=rain?Math.max(0,Math.floor((72-Number(accum.value))/6)+1):13;
 e('v8BatchStatus').textContent=frames.length?`${frames.length}/${exp} إطار منشور · ${frames.at(-1).model} · آخر تحديث ${frames.at(-1).run} UTC`:`لا تتوفر إطارات موثقة حاليًا · يلزم نشر تشغيل GFS`;
 e('v8AnimateExport').disabled=frames.length<2||!canRecord();const canComposite=region.value==='europe'&&['z500','t850'].includes(field.value);
 e('v8CompositeToggle').disabled=!canComposite;if(!canComposite){composite=false;e('v8CompositeToggle').setAttribute('aria-pressed','false')}
 showComposite();preloadNeighbors();}
function preloadNeighbors(){const list=PL(),pos=list.findIndex(x=>x.id===hour.value);for(const o of list.slice(Math.max(0,pos),Math.max(0,pos)+3)){const img=new Image();img.src=o.image}}
function showComposite(){const other=e('v8CompositeOverlay'),c=curr();if(!c||!composite){other.hidden=true;other.removeAttribute('src');return}
 const wanted=c.field==='z500'?'t850':'z500';const partner=C().find(x=>x.region==='europe'&&x.field===wanted&&x.model===c.model&&x.run===c.run&&Number(x.forecastHour)===Number(c.forecastHour));
 if(!partner){other.hidden=true;e('v8BatchStatus').textContent='لا توجد طبقة مرافقة لنفس تشغيل النموذج والساعة';return}other.src=partner.image;other.hidden=false;other.style.opacity='.50';}
accum.addEventListener('change',()=>{field.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(refreshExtras)});
for(const x of [field,region,model,hour,e('v7TimeSlider')])x.addEventListener(x.type==='range'?'input':'change',()=>queueMicrotask(refreshExtras));
e('v8CompositeToggle').addEventListener('click',()=>{composite=!composite;e('v8CompositeToggle').setAttribute('aria-pressed',String(composite));showComposite()});
const catalogTimer=setInterval(()=>{if(C().length){clearInterval(catalogTimer);refreshExtras()}},350);
setTimeout(()=>{clearInterval(catalogTimer);refreshExtras()},7000);
function canRecord(){return typeof MediaRecorder!=='undefined'&&!!HTMLCanvasElement.prototype.captureStream&&['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].some(x=>MediaRecorder.isTypeSupported(x))}
const loadImg=async url=>{const img=new Image();img.src=url;await img.decode();return img};
async function exportSequence(){const btn=e('v8AnimateExport'),list=PL();if(!canRecord()||list.length<2)return;btn.disabled=true;let stream=null;
 try{
 const bg=await loadImg(e('v5MapBase').src);const overlays=await Promise.all(list.map(x=>loadImg(x.image)));
 const ratio=bg.naturalHeight/bg.naturalWidth,W=790,H=Math.round(W*ratio),cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d'),mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
 stream=cv.captureStream(10);const r=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1900000}),pieces=[];r.ondataavailable=ev=>{if(ev.data.size)pieces.push(ev.data)};
 const finished=new Promise((resolve,reject)=>{r.onerror=ev=>reject(ev.error||Error('Record failure'));r.onstop=()=>resolve(new Blob(pieces,{type:mime}))});r.start(300);
 for(let i=0;i<list.length;i++){
  ctx.clearRect(0,0,W,H);ctx.drawImage(bg,0,0,W,H);ctx.globalAlpha=.92;ctx.drawImage(overlays[i],0,0,W,H);ctx.globalAlpha=1;
  const bottom=H-115,g=ctx.createLinearGradient(0,bottom,0,H);g.addColorStop(0,'rgba(1,12,24,.15)');g.addColorStop(1,'rgba(1,12,24,.97)');ctx.fillStyle=g;ctx.fillRect(0,bottom,W,115);ctx.font='bold 22px Cairo,sans-serif';ctx.textAlign='right';ctx.direction='rtl';ctx.fillStyle='#f3ffff';ctx.fillText(`كوكب المناخ · ${list[i].label} · +${list[i].forecastHour} ساعة`,W-17,H-65,W-40);
  ctx.font='14px Cairo,sans-serif';ctx.fillStyle='#a9e6e9';ctx.fillText(`${list[i].model} · ${list[i].run} UTC · المصدر ${list[i].source}`,W-17,H-32,W-40);
  await new Promise(resolve=>setTimeout(resolve,Math.max(260,Number(e('v8AnimationSpeed').value)*.55)));
 }
 r.stop();const blob=await finished;if(!blob.size)throw Error('No encoded frames');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ClimatePlanet-V8-${list[0].field}-${list[0].run.replaceAll(':','-')}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(err){console.error(err);e('v8BatchStatus').textContent='تعذر تصدير تسلسل الصور: '+err.message}finally{stream?.getTracks().forEach(t=>t.stop());btn.disabled=PL().length<2||!canRecord()}}
e('v8AnimateExport').addEventListener('click',exportSequence);
// Georeferenced click locator + independently labelled Open-Meteo GFS point forecast.
const bounds={europe:{w:-10.5987449511,n:63.109776194,e:47.5510558032,s:9.260142019},levant:{w:23.9972362,n:47.71616557,e:53.069623373,s:17.79964121}};
const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));const unmerc=y=>(2*Math.atan(Math.exp(y))-Math.PI/2)*180/Math.PI;
e('v5MapViewport').addEventListener('click',async event=>{
 const current=curr();if(!current)return;const base=e('v5MapBase'),rect=base.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;if(x<0||x>1||y<0||y>1)return;
 const b=bounds[region.value],lon=b.w+(b.e-b.w)*x,lat=unmerc(merc(b.n)+(merc(b.s)-merc(b.n))*y);
 const info=e('v8PointForecast');info.textContent=`الموقع: ${lat.toFixed(3)}° شمالًا، ${lon.toFixed(3)}° شرقًا · تحميل توقع نقطة مكمّل…`;
 pointController?.abort();pointController=new AbortController();const vars={z500:'geopotential_height_500hPa',t850:'temperature_850hPa',t2m:'temperature_2m',rain:'precipitation'};
 const url=new URL('https://api.open-meteo.com/v1/gfs');url.searchParams.set('latitude',lat.toFixed(4));url.searchParams.set('longitude',lon.toFixed(4));url.searchParams.set('hourly',vars[current.field]);url.searchParams.set('timezone','UTC');url.searchParams.set('forecast_days','5');
 try{const r=await fetch(url,{signal:pointController.signal});if(!r.ok)throw Error('HTTP '+r.status);const json=await r.json(),arr=json.hourly?.[vars[current.field]],times=json.hourly?.time;const when=(current.valid||'').replace(' ','T');const i=times?.findIndex(x=>x===when);const val=i>=0?arr?.[i]:null;
 let suffix=current.field==='rain'?' ملم/ساعة':current.field==='z500'?' متر':' °م';
 info.textContent=`الموقع ${lat.toFixed(2)}°N، ${lon.toFixed(2)}°E · ${val==null?'لا توجد قيمة متاحة لنفس الساعة':Number(val).toFixed(1)+suffix} · Open-Meteo GFS: بيانات مكمّلة قد تختلف عن تشغيل خريطة NOAA الأصلية`;
 }catch(err){if(err.name!=='AbortError')info.textContent=`الموقع ${lat.toFixed(2)}°N، ${lon.toFixed(2)}°E · تعذر تحميل توقع النقطة المكمّل`}
});
