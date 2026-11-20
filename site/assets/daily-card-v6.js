/* Single-purpose city/day weather card generator.
 * Forecast values and dates come ONLY from the city's received Open-Meteo JSON.
 * Future-day card excludes any current weather observation mislabeled as future.
 */
const $card=id=>document.getElementById(id);
let state={city:null,payload:null,index:0};
const numeric=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
const format=v=>v===null?'—':Math.round(v).toLocaleString('ar');
const weatherLabel=code=>({0:'صحو',1:'صحو غالبًا',2:'غائم جزئيًا',3:'غائم',45:'ضباب',48:'ضباب',51:'رذاذ',53:'رذاذ',55:'رذاذ',61:'أمطار خفيفة',63:'أمطار',65:'أمطار غزيرة',71:'ثلوج خفيفة',73:'ثلوج',75:'ثلوج كثيفة',80:'زخات مطر',81:'زخات مطر',82:'زخات غزيرة',95:'عواصف رعدية',96:'عواصف رعدية',99:'عواصف رعدية'})[code]||'طقس متغير';
const weatherIcon=code=>code>=95?'⛈️':[71,73,75,77,85,86].includes(code)?'❄️':[61,63,65,80,81,82].includes(code)?'🌧️':[45,48].includes(code)?'🌫️':code===0?'☀️':'🌤️';
const stylePresets={sky:{top:'#06273c',bottom:'#107b91',accent:'#6af0e3'},night:{top:'#090c25',bottom:'#213b69',accent:'#a4c2ff'},winter:{top:'#0a2038',bottom:'#397aa0',accent:'#bdeaff'}};
const theme=()=>stylePresets[$card('v6CardStyle').value]||stylePresets.sky;
const current=()=>{const d=state.payload?.daily,i=state.index;if(!d?.time?.[i])return null;return{day:d.time[i],max:numeric(d.temperature_2m_max?.[i]),min:numeric(d.temperature_2m_min?.[i]),prob:numeric(d.precipitation_probability_max?.[i]),mm:numeric(d.precipitation_sum?.[i]),gust:numeric(d.wind_gusts_10m_max?.[i]),code:d.weather_code?.[i]??-1}};
function dayName(date){return new Intl.DateTimeFormat('ar',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))}
function setStatus(msg){$card('v6CardStatus').textContent=msg}
function paintPreview(){const c=state.city,rec=current();const scene=$card('v6CardScene');$card('v6CardPreview').dataset.style=$card('v6CardStyle').value;if(!c||!rec){$card('v6PreviewCity').textContent='اختر مدينة';$card('v6PreviewTemp').textContent='—';$card('v6PreviewDate').textContent='بانتظار التوقعات';scene.style.backgroundImage='';return}
 const url=window.ClimateCityArt?.url(c);scene.style.backgroundImage=url?`linear-gradient(180deg,rgba(5,17,34,.07),rgba(5,17,34,.78)),url("${url}")`:'';$card('v6PreviewCity').textContent=c.ar||c.name;$card('v6PreviewTemp').textContent=format(rec.max)+'° / '+format(rec.min)+'°';$card('v6PreviewDate').textContent=dayName(rec.day)+' · '+weatherLabel(rec.code);
 $card('v6CardPreview').dataset.weather=[61,63,65,80,81,82,95,96,99].includes(rec.code)?'rain':[71,73,75,77,85,86].includes(rec.code)?'snow':'clear';setStatus('البيانات المتاحة: '+dayName(rec.day)+' · Open-Meteo');}
document.addEventListener('climate-weather-ready',e=>{state.city=e.detail.city;state.payload=e.detail.json;state.index=0;const days=state.payload?.daily?.time||[];const sel=$card('v6CardDay');sel.replaceChildren();for(let i=0;i<days.length;i++){const o=document.createElement('option');o.value=String(i);o.textContent=dayName(days[i]);sel.append(o)}sel.disabled=!days.length;$card('downloadWeatherCard').disabled=!days.length;paintPreview()});
$card('v6CardDay').addEventListener('change',e=>{state.index=Number(e.target.value)||0;paintPreview()});
$card('v6CardStyle').addEventListener('change',paintPreview);
async function loadImage(url){const img=new Image();img.src=url;try{await img.decode();return img}catch{return null}}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function coverImage(ctx,img,x,y,w,h){if(!img)return;const ir=img.width/img.height,dr=w/h;let sx=0,sy=0,sw=img.width,sh=img.height;if(ir>dr){sw=img.height*dr;sx=(img.width-sw)/2}else{sh=img.width/dr;sy=(img.height-sh)/2}ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)}
function createGradient(ctx,W,H,p){const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,p.top);g.addColorStop(1,p.bottom);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function ellipse(ctx,x,y,w,h,c){ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
function text(ctx,t,x,y,size,color='#fff',weight=700,maxWidth=1180){ctx.direction='rtl';ctx.textAlign='right';ctx.fillStyle=color;ctx.font=`${weight} ${size}px Cairo,"IBM Plex Sans Arabic",Arial,sans-serif`;ctx.fillText(t,x,y,maxWidth)}
async function drawCardFrame(ctx,W,H,phase=0){const rec=current(),city=state.city;if(!rec||!city)throw Error('لا توجد بيانات صالحة للبطاقة');const p=theme(),rh=H/1080,rw=W/1350;ctx.setTransform(rw,0,0,rh,0,0);ctx.clearRect(0,0,1350,1080);createGradient(ctx,1350,1080,p);
 const img=await loadImage(window.ClimateCityArt?.url(city)||'/images/landmarks/generic.svg');if(img){ctx.save();rounded(ctx,45,225,590,600,28);ctx.clip();coverImage(ctx,img,45,225,590,600);ctx.restore();}
 else { // Never leave a blank city panel if an image cannot load on mobile.
  ctx.save();rounded(ctx,45,225,590,600,28);ctx.clip();const g=ctx.createLinearGradient(50,225,550,825);g.addColorStop(0,'#12516c');g.addColorStop(1,'#3b8c82');ctx.fillStyle=g;ctx.fillRect(45,225,590,600);
  ctx.fillStyle='rgba(241,242,204,.72)';ellipse(ctx,200,345,60,60,'#efdb9c');const seed=String(city.id).split('').reduce((a,c)=>a*31+c.charCodeAt(0),1);
  for(let i=0;i<11;i++){const xx=50+i*58,hh=90+Math.abs((seed+i*59)%150);ctx.fillStyle=i%2?'#285669':'#19394f';ctx.fillRect(xx,805-hh,52,hh);for(let j=0;j<3;j++){ctx.fillStyle='rgba(255,220,168,.64)';ctx.fillRect(xx+9+j*12,822-hh,7,13)}}
  text(ctx,'مشهد توضيحي · '+(city.ar||city.name),600,777,26,'#f4fbff',700,490);ctx.restore();}

 const shine=ctx.createRadialGradient(245,810,20,245,810,470);shine.addColorStop(0,p.accent+'55');shine.addColorStop(1,p.accent+'00');ctx.fillStyle=shine;ctx.fillRect(0,260,700,760);
 // Animated front-layer artwork — exported PNG is a still at phase 0.
 const isRain=[61,63,65,80,81,82,95,96,99].includes(rec.code),isSnow=[71,73,75,77,85,86].includes(rec.code);
 if(isRain||isSnow){ctx.save();rounded(ctx,45,225,590,600,28);ctx.clip();for(let i=0;i<46;i++){const x=50+(i*139)%580,y=225+((i*211+phase*250)%620);ctx.strokeStyle=isSnow?'rgba(239,251,255,.72)':'rgba(104,213,249,.54)';ctx.lineWidth=isSnow?3:2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(isSnow?2:9),y+(isSnow?5:17));ctx.stroke()}ctx.restore()}
 text(ctx,'كوكب المناخ',1250,112,53,'#ffffff',800);text(ctx,'CLIMATE PLANET',1248,155,26,p.accent,700);
 text(ctx,city.ar||city.name,1250,298,94,'#ffffff',800,580);text(ctx,dayName(rec.day),1250,364,31,'#dbeff5',600,580);
 text(ctx,weatherIcon(rec.code)+' '+weatherLabel(rec.code),1250,450,50,p.accent,800,590);text(ctx,'العظمى',1250,535,30,'#daeaf0');text(ctx,format(rec.max)+'°',1250,665,136,'#fff',800);text(ctx,'الصغرى '+format(rec.min)+'°',1250,728,45,'#d4eef5',700);
 ctx.fillStyle='rgba(2,15,32,.53)';rounded(ctx,52,853,1246,131,20);ctx.fill();const cells=[['فرصة الأمطار',rec.prob===null?'—':format(rec.prob)+'%'],['كمية المطر',rec.mm===null?'—':rec.mm.toFixed(1)+' ملم'],['هبّات الرياح',rec.gust===null?'—':format(rec.gust)+' كم/س']];for(let i=0;i<cells.length;i++){const x=1220-i*395;text(ctx,cells[i][0],x,901,27,'#9cd6e0',600,320);text(ctx,cells[i][1],x,950,37,'#fff',800,325)}
 text(ctx,'المصدر: Open-Meteo · توقع عددي · '+(state.payload?.timezone_abbreviation||'توقيت محلي'),1230,1038,23,'#c6e9e9',500,1080);
 const logo=await loadImage('/images/brand/climate-planet-transparent.png');if(logo){ctx.drawImage(logo,60,47,164,164)}
 ctx.setTransform(1,0,0,1,0,0);
}
function saveBlob(blob,name){if(!blob)throw Error('فشل التصدير');const url=URL.createObjectURL(blob),a=document.createElement('a');a.download=name;a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function download(){if(!state.city||!current())throw Error('اختر المدينة والتاريخ');const btn=$card('downloadWeatherCard');btn.disabled=true;setStatus('تجهيز البطاقة…');try{await document.fonts?.ready;const can=document.createElement('canvas');can.width=1350;can.height=1080;const ctx=can.getContext('2d');await drawCardFrame(ctx,can.width,can.height);const blob=await new Promise(resolve=>can.toBlob(resolve,'image/png'));saveBlob(blob,`ClimatePlanet-${String(state.city.id).replace(/[^a-z0-9-]/ig,'')}-${current().day}.png`);setStatus('تم تجهيز بطاقة '+(state.city.ar||state.city.name)+' ليوم '+current().day)}finally{btn.disabled=false}}
window.ClimatePoster={download};
// original V3 click handler resolves window.ClimatePoster dynamically.
