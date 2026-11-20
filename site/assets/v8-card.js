/* Climate Planet V8 — cinematic, diorama and meteorological-pro city cards.
 * PNG and WebM are rendered from the same real Open-Meteo daily forecast.
 * All artwork is local; no screenshot of foreign sites or invented values.
 */
const el=id=>document.getElementById(id);
const preset={cinematic:{a:'#061a35',b:'#0d7391',tint:'#70f7ee'},diorama:{a:'#0b3e49',b:'#308078',tint:'#ffe0a0'},pro:{a:'#051428',b:'#143a60',tint:'#85cafa'}};
let state={city:null,data:null,index:0,art:null,logo:null};
const num=v=>v===null||v===undefined||!Number.isFinite(+v)?null:+v;
const nstr=(v,unit='',decimal=0)=>num(v)===null?'—':Number(v).toFixed(decimal)+unit;
const conditions=code=>code>=95?'عواصف رعدية':([71,73,75,77,85,86].includes(code)?'ثلوج':([61,63,65,80,81,82].includes(code)?'أمطار':([45,48].includes(code)?'ضباب':code===0?'سماء صافية':code===3?'سماء غائمة':'أجواء متغيرة')));
const weatherType=code=>code>=95||[61,63,65,80,81,82].includes(code)?'rain':[71,73,75,77,85,86].includes(code)?'snow':'clear';
const style=()=>document.querySelector('input[name="v8style"]:checked')?.value||'cinematic';
const day=()=>{const d=state.data?.daily,i=state.index;if(!d?.time?.[i])return null;return{date:d.time[i],max:num(d.temperature_2m_max?.[i]),min:num(d.temperature_2m_min?.[i]),rain:num(d.precipitation_sum?.[i]),chance:num(d.precipitation_probability_max?.[i]),wind:num(d.wind_gusts_10m_max?.[i]),code:d.weather_code?.[i]??-1}};
const dateLabel=d=>new Intl.DateTimeFormat('ar',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
function status(msg){el('v6CardStatus').textContent=msg}
async function loadImage(src){const img=new Image();img.src=src;try{await img.decode();return img}catch{return null}}
function updatePreview(){const rec=day(),c=state.city,scene=el('v6CardScene'),box=el('v6CardPreview');box.className='v8-card-preview '+style();box.dataset.motion=el('v8MotionToggle').checked?'on':'off';
 if(!rec||!c){el('v6PreviewCity').textContent='اختر مدينة';el('v6PreviewTemp').textContent='—';el('v6PreviewDate').textContent='اختر التاريخ';return}
 const art=window.ClimateCityArt?.url(c);scene.style.backgroundImage=art?`url("${art}")`:'';
 box.dataset.weather=weatherType(rec.code);
 el('v6PreviewCity').textContent=c.ar||c.name;el('v6PreviewTemp').textContent='العظمى '+nstr(rec.max,'°')+' · الصغرى '+nstr(rec.min,'°');el('v6PreviewDate').textContent=dateLabel(rec.date)+' · '+conditions(rec.code);
 status('توقعات '+dateLabel(rec.date)+' · بيانات Open-Meteo');
}
document.addEventListener('climate-weather-ready',async evt=>{state.city=evt.detail.city;state.data=evt.detail.json;state.index=0;const dates=state.data?.daily?.time||[],sel=el('v6CardDay');sel.replaceChildren();for(let i=0;i<dates.length;i++)sel.append(new Option(dateLabel(dates[i]),String(i)));sel.disabled=!dates.length;
 el('downloadWeatherCard').disabled=!dates.length;el('v8ExportVideo').disabled=!dates.length||!supportsWebM();state.art=null;
 updatePreview();loadImage(window.ClimateCityArt?.url(state.city)||'/images/landmarks/generic.svg').then(img=>state.art=img);
});
el('v6CardDay').addEventListener('change',()=>{state.index=Number(el('v6CardDay').value)||0;updatePreview();document.dispatchEvent(new CustomEvent('v8-card-date-change',{detail:{index:state.index}}))});
document.querySelectorAll('input[name="v8style"]').forEach(x=>x.addEventListener('change',updatePreview));el('v8MotionToggle').addEventListener('change',updatePreview);
function gradient(ctx,x,y,w,h,c1,c2){const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(x,y,w,h)}
function cover(ctx,img,x,y,w,h,contain=false){if(!img)return;const ir=img.width/img.height,dr=w/h;let dw,dh;if((ir>dr)===!contain){dh=h;dw=h*ir}else{dw=w;dh=w/ir}ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function print(ctx,value,x,y,size,maxWidth,weight=700,color='#fff'){ctx.textAlign='right';ctx.direction='rtl';ctx.fillStyle=color;ctx.font=`${weight} ${size}px Cairo, "IBM Plex Sans Arabic", Arial,sans-serif`;ctx.fillText(String(value),x,y,maxWidth)}
const amount=v=>v==null?'—':v.toFixed(1);
function draw(ctx,W,H,phase=0){const rec=day(),city=state.city;if(!rec||!city)throw Error('No weather data');const design=style(),colors=preset[design],portrait=H>W*1.13,margin=Math.round(Math.min(W,H)*.055);
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);gradient(ctx,0,0,W,H,colors.a,colors.b);
 // Unique landmark illustration per city; named monuments when curated, distinct vector skyline otherwise.
 ctx.save();if(design==='diorama'){
  const width=W-margin*1.1,height=H*(portrait?.48:.82);round(ctx,margin*.55,H*(portrait?.14:.10),width,height,Math.max(18,margin*.35));ctx.clip();if(state.art)cover(ctx,state.art,margin*.55,H*(portrait?.14:.10),width,height,true);
 }else if(design==='pro'){
  ctx.globalAlpha=.22;if(state.art)cover(ctx,state.art,0,0,W,H);ctx.globalAlpha=1;
 }else{if(state.art)cover(ctx,state.art,0,0,W,H);}
 ctx.restore();
 const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(1,13,29,.38)');shade.addColorStop(.48,design==='diorama'?'rgba(0,8,24,.02)':'rgba(0,8,24,.20)');shade.addColorStop(1,'rgba(1,10,23,.95)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 // Weather motion uses the same condition code as the actual selected daily forecast.
 ctx.save();const mood=weatherType(rec.code);const count=mood==='clear'?0:55;
 for(let i=0;i<count;i++){const x=((i*137.7+phase*(mood==='snow'?15:60))%(W+150))-60,y=((i*77.71+phase*(mood==='snow'?26:95))%(H+150))-50;
  if(mood==='snow'){ctx.fillStyle='rgba(234,253,255,.62)';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,7);ctx.fill()}
  else{ctx.strokeStyle='rgba(172,232,255,.33)';ctx.lineWidth=1.2+i%2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+25);ctx.stroke()}}
 if(mood==='clear'){const sunR=Math.max(34,Math.min(W,H)*.065);const x=W*.19,y=H*.20;const g=ctx.createRadialGradient(x,y,4,x,y,sunR*2.7);g.addColorStop(0,'#fff9d6');g.addColorStop(.3,'rgba(255,210,135,.66)');g.addColorStop(1,'rgba(255,210,135,0)');ctx.fillStyle=g;ctx.fillRect(x-sunR*3,y-sunR*3,sunR*6,sunR*6)}
 ctx.restore();
 // Hierarchy: logo, city, day, actual max/min + precipitation, source.
 const headerSize=Math.round(Math.min(W,H)*.029);const heroSize=Math.round(Math.min(W,H)*(portrait?.075:.071));const valSize=Math.round(Math.min(W,H)*(portrait?.083:.087));
 print(ctx,'كوكب المناخ / CLIMATE PLANET',W-margin,margin*1.5,headerSize,W-margin*3,800,colors.tint);
 if(state.logo)ctx.drawImage(state.logo,margin*.65,margin*.52,Math.min(W,H)*.102,Math.min(W,H)*.102);
 const cityY=portrait?H*.65:H*.64;
 print(ctx,city.ar||city.name,W-margin,cityY,heroSize,W-margin*2,900,'#fff');
 print(ctx,dateLabel(rec.date)+' · '+conditions(rec.code),W-margin,cityY+heroSize*.79,Math.round(heroSize*.34),W-margin*2,700,'#d6fbf9');
 const metricY=cityY+heroSize*2.00;
 print(ctx,'العظمى '+nstr(rec.max,'°')+' · الصغرى '+nstr(rec.min,'°'),W-margin,metricY,valSize,W-margin*2,900,colors.tint);
 print(ctx,'درجات الحرارة المتوقعة لليوم',W-margin,metricY+valSize*.55,Math.round(valSize*.27),W-margin*2,600,'#d5eff1');
 const foot=H-margin*1.9;round(ctx,margin,foot-42,W-margin*2,Math.max(50,margin*.96),Math.max(10,margin*.15));ctx.fillStyle='rgba(255,255,255,.12)';ctx.fill();
 print(ctx,`الأمطار ${amount(rec.rain)} ملم  ·  فرصة الهطول ${nstr(rec.chance,'%')}  ·  الهبات ${nstr(rec.wind,' كم/س')}`,W-margin*1.35,foot-1,Math.max(16,Math.round(Math.min(W,H)*.023)),W-margin*2.8,700,'#f1ffff');
 print(ctx,'توقع عددي · المصدر Open-Meteo · ليس رصد محطة',W-margin,H-margin*.70,Math.round(Math.min(W,H)*.016),W-margin*2,500,'#c1d9e2');
}
function downloadBlob(blob,name){if(!blob)throw Error('فشل إنشاء الملف');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000)}
const fileName=ext=>`ClimatePlanet-V8-${String(state.city?.id||'city').replace(/[^\w-]/g,'')}-${day()?.date||'day'}-${style()}.${ext}`;
function size(){const [w,h]=el('v8PosterSize').value.split('x').map(Number);return{w,h}}
async function setup(){if(!state.city||!day())throw Error('اختر المدينة واليوم أولًا');await document.fonts?.ready;state.art=state.art||await loadImage(window.ClimateCityArt?.url(state.city)||'/images/landmarks/generic.svg');state.logo=state.logo||await loadImage('/images/brand/climate-planet-transparent.png')}
async function download(){const btn=el('downloadWeatherCard');btn.disabled=true;status('جارٍ تجهيز البطاقة…');try{await setup();const {w,h}=size(),cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h,0);const blob=await new Promise(r=>cv.toBlob(r,'image/png'));downloadBlob(blob,fileName('png'));status('تم تنزيل البطاقة '+w+' × '+h+' ليوم '+day().date)}catch(err){status('تعذر تصدير البطاقة: '+err.message);throw err}finally{btn.disabled=false}}
window.ClimatePoster={download}; // Legacy download button handler resolves this function dynamically.
function supportsWebM(){return typeof MediaRecorder!=='undefined'&&!!HTMLCanvasElement.prototype.captureStream&&['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].some(x=>MediaRecorder.isTypeSupported(x))}
async function exportVideo(){const btn=el('v8ExportVideo');btn.disabled=true;try{await setup();if(!supportsWebM())throw Error('متصفحك لا يدعم تصدير WebM');
 const {w,h}=size(),factor=Math.min(1,820/Math.max(w,h)),cw=Math.round(w*factor),ch=Math.round(h*factor),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const ctx=cv.getContext('2d');
 const stream=cv.captureStream(12),mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x)),chunks=[];
 const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2200000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const completion=new Promise((resolve,reject)=>{rec.onerror=e=>reject(e.error||new Error('تعذر التسجيل'));rec.onstop=()=>resolve(new Blob(chunks,{type:mime}))});
 status('تسجيل حركة الطقس…');rec.start(200);
 for(let i=0;i<50;i++){draw(ctx,cw,ch,i/10);await new Promise(r=>setTimeout(r,95))}
 rec.stop();const blob=await completion;stream.getTracks().forEach(t=>t.stop());downloadBlob(blob,fileName('webm'));status('تم تنزيل فيديو WebM مدته نحو خمس ثوانٍ · البيانات من Open-Meteo');
 }catch(e){status('تعذر إنشاء الفيديو: '+e.message)}finally{btn.disabled=false}}
el('v8ExportVideo').addEventListener('click',exportVideo);
updatePreview();
