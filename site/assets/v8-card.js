/* Climate Planet V8 — cinematic, diorama and meteorological-pro city cards.
 * PNG and WebM are rendered from the same real Open-Meteo daily forecast.
 * All artwork is local; no screenshot of foreign sites or invented values.
 */
import {weatherIcon,iconPath,weatherDescription} from './weather-icons-v9.js';
const el=id=>document.getElementById(id);
const preset={cinematic:{a:'#061a35',b:'#0d7391',tint:'#70f7ee'},diorama:{a:'#0b3e49',b:'#308078',tint:'#ffe0a0'},pro:{a:'#051428',b:'#143a60',tint:'#85cafa'},aurora:{a:'#07152f',b:'#11605d',tint:'#b2ffe2'}};
let state={city:null,data:null,index:0,art:null,logo:null,wxIcon:null,wxIconPath:''};
const num=v=>v===null||v===undefined||!Number.isFinite(+v)?null:+v;
const nstr=(v,unit='',decimal=0)=>num(v)===null?'—':Number(v).toFixed(decimal)+unit;
const conditions=weatherDescription;
const weatherType=code=>['rain','storm','drizzle'].includes(weatherIcon(code))?'rain':weatherIcon(code)==='snow'?'snow':'clear';
const style=()=>document.querySelector('input[name="v8style"]:checked')?.value||'cinematic';
const day=()=>{const d=state.data?.daily,i=state.index;if(!d?.time?.[i])return null;return{date:d.time[i],max:num(d.temperature_2m_max?.[i]),min:num(d.temperature_2m_min?.[i]),rain:num(d.precipitation_sum?.[i]),chance:num(d.precipitation_probability_max?.[i]),wind:num(d.wind_gusts_10m_max?.[i]),code:d.weather_code?.[i]??-1}};
const dateLabel=d=>new Intl.DateTimeFormat('ar',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
function status(msg){el('v6CardStatus').textContent=msg}
async function loadImage(src){const img=new Image();img.src=src;try{await img.decode();return img}catch{return null}}
function updatePreview(){const rec=day(),c=state.city,scene=el('v6CardScene'),box=el('v6CardPreview');box.className='v8-card-preview '+style();box.dataset.motion=el('v8MotionToggle').checked?'on':'off';
 if(!rec||!c){el('v6PreviewCity').textContent='اختر مدينة';el('v6PreviewTemp').textContent='—';el('v6PreviewDate').textContent='اختر التاريخ';return}
 const art=window.ClimateCityArt?.url(c);scene.style.backgroundImage=art?`url("${art}")`:'';
 box.dataset.weather=weatherType(rec.code);
 const icon=iconPath(weatherIcon(rec.code,true));const image=el('v9PreviewConditionIcon');if(image)image.src=icon;
 if(icon!==state.wxIconPath){state.wxIconPath=icon;state.wxIcon=null;loadImage(icon).then(img=>{if(state.wxIconPath===icon)state.wxIcon=img})}
 el('v6PreviewCity').textContent=c.ar||c.name;el('v6PreviewTemp').textContent='العظمى '+nstr(rec.max,'°')+' · الصغرى '+nstr(rec.min,'°');el('v6PreviewDate').textContent=dateLabel(rec.date)+' · '+conditions(rec.code);
 status('توقعات '+dateLabel(rec.date)+' · بيانات Open-Meteo');
}
document.addEventListener('climate-weather-ready',async evt=>{state.city=evt.detail.city;state.data=evt.detail.json;state.index=0;const dates=state.data?.daily?.time||[],sel=el('v6CardDay');sel.replaceChildren();for(let i=0;i<dates.length;i++)sel.append(new Option(dateLabel(dates[i]),String(i)));sel.disabled=!dates.length;
 el('downloadWeatherCard').disabled=!dates.length;el('v8ExportVideo').disabled=!dates.length||!supportsWebM();state.art=null;state.wxIcon=null;state.wxIconPath='';
 updatePreview();loadImage(window.ClimateCityArt?.url(state.city)||'/images/landmarks/generic.svg').then(img=>state.art=img);
});
el('v6CardDay').addEventListener('change',()=>{state.index=Number(el('v6CardDay').value)||0;updatePreview();document.dispatchEvent(new CustomEvent('v8-card-date-change',{detail:{index:state.index}}))});
document.querySelectorAll('input[name="v8style"]').forEach(x=>x.addEventListener('change',updatePreview));el('v8MotionToggle').addEventListener('change',updatePreview);
function gradient(ctx,x,y,w,h,c1,c2){const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(x,y,w,h)}
function cover(ctx,img,x,y,w,h,contain=false){if(!img)return;const ir=img.width/img.height,dr=w/h;let dw,dh;if((ir>dr)===!contain){dh=h;dw=h*ir}else{dw=w;dh=w/ir}ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function print(ctx,value,x,y,size,maxWidth,weight=700,color='#fff'){ctx.textAlign='right';ctx.direction='rtl';ctx.fillStyle=color;ctx.font=`${weight} ${size}px Cairo, "IBM Plex Sans Arabic", Arial,sans-serif`;ctx.fillText(String(value),x,y,maxWidth)}
const amount=v=>v==null?'—':v.toFixed(1);
function draw(ctx,W,H,phase=0){
 const rec=day(),city=state.city;if(!rec||!city)throw Error('No weather data');
 const design=style(),palette=preset[design]||preset.cinematic,portrait=H>W*1.13,min=Math.min(W,H),pad=Math.round(min*.058);
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
 gradient(ctx,0,0,W,H,palette.a,palette.b);
 // City artwork is a background identity illustration, never an atmospheric observation.
 if(state.art){ctx.save();ctx.globalAlpha=design==='diorama'?.57:design==='pro'?.21:.38;cover(ctx,state.art,0,0,W,H);ctx.restore();}
 const haze=ctx.createLinearGradient(0,0,W,H);
 haze.addColorStop(0,'rgba(2,13,30,.72)');haze.addColorStop(.58,design==='diorama'?'rgba(1,18,29,.31)':'rgba(2,14,31,.52)');haze.addColorStop(1,'rgba(1,11,27,.95)');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);
 // Atmospheric lighting, softly drifting, intentionally abstract.
 const glowX=W*.22+Math.sin(phase*.6)*W*.018,glowY=H*.28;
 const aura=ctx.createRadialGradient(glowX,glowY,1,glowX,glowY,min*.52);
 aura.addColorStop(0,(design==='aurora'?'rgba(88,236,187,.21)':'rgba(102,220,244,.16)'));aura.addColorStop(1,'rgba(63,184,205,0)');ctx.fillStyle=aura;ctx.fillRect(0,0,W,H);
 // Animated precipitation in WebM, no overlay when daily WMO code doesn't warrant it.
 const wx=weatherType(rec.code),flakes=wx==='snow'?40:wx==='rain'?42:0;
 for(let i=0;i<flakes;i++){
   const x=(i*113.91+Math.sin(i*3)*49+phase*(wx==='rain'?41:13))%(W+100)-50;
   const y=(i*72.71+phase*(wx==='rain'?91:22))%(H+100)-50;
   if(wx==='snow'){ctx.beginPath();ctx.fillStyle='rgba(224,247,255,.62)';ctx.arc(x,y,Math.max(1.5,min*.002)*(1+i%3),0,Math.PI*2);ctx.fill()}
   else{ctx.beginPath();ctx.strokeStyle='rgba(150,223,251,.30)';ctx.lineWidth=Math.max(1,min*.0018);ctx.moveTo(x,y);ctx.lineTo(x-7,y+23);ctx.stroke()}
 }
 // Fine editorial structure.
 ctx.strokeStyle='rgba(189,244,251,.25)';ctx.lineWidth=Math.max(1,min*.0015);
 ctx.beginPath();ctx.moveTo(pad,H*.14);ctx.lineTo(W-pad,H*.14);ctx.stroke();
 ctx.direction='rtl';
 const logoSize=min*.082;
 if(state.logo)ctx.drawImage(state.logo,pad*.78,pad*.62,logoSize,logoSize);
 print(ctx,'كوكب المناخ  /  CLIMATE PLANET',W-pad,pad*1.32,Math.round(min*.026),W-pad*2.7,800,palette.tint);
 print(ctx,'نشرة الطقس اليومية',W-pad,pad*1.85,Math.round(min*.019),W-pad*2.7,600,'#c5e2eb');
 // Large semi-realistic local SVG icon from this project's icon library.
 const iconSize=Math.round(min*(portrait?.31:.30)),ix=pad*.85,iy=H*(portrait?.17:.19);
 if(state.wxIcon){ctx.save();ctx.shadowColor='rgba(35,140,179,.28)';ctx.shadowBlur=25;ctx.drawImage(state.wxIcon,ix,iy,iconSize,iconSize);ctx.restore();}
 const titleY=H*(portrait?.48:.41);
 print(ctx,city.ar||city.name,W-pad,titleY,Math.round(min*(portrait?.066:.077)),W-pad*2.4,900,'#FFFFFF');
 print(ctx,dateLabel(rec.date),W-pad,titleY+min*.061,Math.round(min*.027),W-pad*2.2,700,'#c6ecf2');
 print(ctx,conditions(rec.code),W-pad,titleY+min*.108,Math.round(min*.035),W-pad*2.2,700,palette.tint);
 const valY=H*(portrait?.715:.67);
 const headline=rec.max==null?'—':Math.round(rec.max)+'°';
 print(ctx,headline,W-pad,valY,Math.round(min*(portrait?.139:.150)),W-pad*2.3,900,'#fff');
 print(ctx,'العظمى اليوم',W-pad,valY+min*.035,Math.round(min*.025),W-pad*2.5,600,'#b5d9e4');
 print(ctx,'الصغرى '+nstr(rec.min,'°'),W-pad,valY+min*.099,Math.round(min*.045),W-pad*2.4,750,palette.tint);
 // Data footer. Real, source-backed fields only.
 const y=H*(portrait?.864:.845),h=min*.107;
 round(ctx,pad,y,W-2*pad,h,min*.018);ctx.fillStyle='rgba(5,31,49,.73)';ctx.fill();ctx.strokeStyle='rgba(162,235,245,.24)';ctx.lineWidth=1.6;ctx.stroke();
 const footerText=`الهطول ${amount(rec.rain)} ملم    |    فرصة المطر ${nstr(rec.chance,'%')}    |    الهبات ${nstr(rec.wind,' كم/س')}`;
 print(ctx,footerText,W-pad*1.36,y+h*.61,Math.round(min*.025),W-pad*2.5,700,'#edfaff');
 print(ctx,'المصدر: Open-Meteo · توقع عددي وليس رصد محطة',W-pad,H-pad*.50,Math.round(min*.017),W-pad*2.3,500,'#b5d3df');
}
function downloadBlob(blob,name){if(!blob)throw Error('فشل إنشاء الملف');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000)}
const fileName=ext=>`ClimatePlanet-V9-${String(state.city?.id||'city').replace(/[^\w-]/g,'')}-${day()?.date||'day'}-${style()}.${ext}`;
function size(){const [w,h]=el('v8PosterSize').value.split('x').map(Number);return{w,h}}
async function setup(){if(!state.city||!day())throw Error('اختر المدينة واليوم أولًا');await document.fonts?.ready;state.art=state.art||await loadImage(window.ClimateCityArt?.url(state.city)||'/images/landmarks/generic.svg');state.logo=state.logo||await loadImage('/images/brand/climate-planet-transparent.png');state.wxIcon=await loadImage(iconPath(weatherIcon(day().code,true)));state.wxIconPath=iconPath(weatherIcon(day().code,true))}
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
