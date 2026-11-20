/* Source-verifiable V7 time animation and model/run comparison.
 * Never generate or interpolate numerical model data in the browser.
 * Views only source-tagged images from data/forecast-maps.json.
 */
const el=id=>document.getElementById(id);
const region=el('v5Region'),field=el('v5Field'),model=el('v5Model'),hour=el('v5ForecastHour');
const play=el('v7Play'),stop=el('v7Stop'),timeline=el('v7TimeSlider'),timelabel=el('v7TimeText');
const compare=el('v7CompareToggle'),compareMode=el('v7CompareMode'),split=el('v7CompareSplit'),compareStatus=el('v7CompareStatus'),compareImg=el('v7MapCompareOverlay');
let catalog=[],playlist=[],interval=null,comparison=null,compareEnabled=false,active=false;
const validPath=s=>/^\/images\/maps\/forecast\/[a-z0-9_.-]+\.png$/i.test(String(s||''));
function stopPlaying(){if(interval!==null){clearInterval(interval);interval=null}active=false;play.textContent='▶ تشغيل الساعات';stop.disabled=!playlist.length}
function matches(){return catalog.filter(x=>x.region===region.value&&x.field===field.value&&x.model===model.value&&validPath(x.image))}
function getCurrent(){return catalog.find(x=>x.id===hour.value)||null}
function setSelected(i){if(!playlist.length)return;timeline.value=String(i);hour.value=playlist[i].id;hour.dispatchEvent(new Event('change'));timelabel.textContent=`+${playlist[i].forecastHour} ساعة · ${playlist[i].valid||''} UTC`;updateComparison()}
function rebuild(){stopPlaying();const valid=matches().sort((a,b)=>String(b.run).localeCompare(String(a.run)));const newest=valid[0]?.run;playlist=valid.filter(x=>x.run===newest).sort((a,b)=>Number(a.forecastHour)-Number(b.forecastHour));let selected=playlist.findIndex(x=>x.id===hour.value);if(selected<0)selected=0;timeline.max=String(Math.max(0,playlist.length-1));timeline.value=String(selected);timeline.disabled=playlist.length<2;play.disabled=playlist.length<2;stop.disabled=!playlist.length;timelabel.textContent=playlist.length?`+${playlist[selected].forecastHour} ساعة · ${playlist[selected].valid||''} UTC`:'بانتظار أول تشغيل منشور';updateComparison()}
function candidate(){const curr=getCurrent();if(!curr)return null;const options=catalog.filter(x=>x.region===curr.region&&x.field===curr.field&&Number(x.forecastHour)===Number(curr.forecastHour)&&validPath(x.image)&&x.id!==curr.id);
 if(compareMode.value==='previous')return options.filter(x=>x.model===curr.model&&String(x.run)<String(curr.run)).sort((a,b)=>String(b.run).localeCompare(String(a.run)))[0]||null;
 return options.filter(x=>x.model!==curr.model).sort((a,b)=>String(b.run).localeCompare(String(a.run)))[0]||null;
}
function applySplit(){compareImg.style.clipPath=`inset(0 ${100-Number(split.value)}% 0 0)`}
function updateComparison(){comparison=candidate();const curr=getCurrent();compare.disabled=!comparison;split.disabled=!comparison||!compareEnabled;if(!comparison){compareEnabled=false;compare.textContent='⇄ تفعيل المقارنة';compareImg.hidden=true;compareStatus.textContent=curr?'لا تتوفر خريطة ثانية مماثلة لساعة التوقع':'لا توجد خرائط منشورة للمقارنة';return}
 compareStatus.textContent=`${comparison.model} · تشغيل ${comparison.run} UTC`;
 if(compareEnabled){compareImg.hidden=false;compareImg.src=comparison.image;applySplit()}else compareImg.hidden=true;
}
for(const s of [region,field,model])s.addEventListener('change',()=>queueMicrotask(rebuild));
hour.addEventListener('change',()=>{const i=playlist.findIndex(x=>x.id===hour.value);if(i>=0){timeline.value=String(i);timelabel.textContent=`+${playlist[i].forecastHour} ساعة · ${playlist[i].valid||''} UTC`;}updateComparison()});
timeline.addEventListener('input',()=>setSelected(Number(timeline.value)));
play.addEventListener('click',()=>{if(!playlist.length||playlist.length<2)return;if(active){stopPlaying();return}if(Number(timeline.value)>=playlist.length-1)setSelected(0);active=true;play.textContent='Ⅱ إيقاف مؤقت';interval=setInterval(()=>{const i=Number(timeline.value)+1;if(i>=playlist.length){stopPlaying();return}setSelected(i)},1200)});
stop.addEventListener('click',stopPlaying);
compareMode.addEventListener('change',()=>{compareEnabled=false;compare.textContent='⇄ تفعيل المقارنة';updateComparison()});
compare.addEventListener('click',()=>{if(!comparison)return;compareEnabled=!compareEnabled;compare.textContent=compareEnabled?'✕ إغلاق المقارنة':'⇄ تفعيل المقارنة';split.disabled=!compareEnabled;updateComparison()});
split.addEventListener('input',applySplit);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlaying()});
document.addEventListener('planet-page',e=>{if(e.detail?.page!=='operations')stopPlaying()});
fetch('/data/forecast-maps.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).then(x=>{catalog=Array.isArray(x)?x.filter(p=>p&&p.id&&['GFS','ECMWF','ICON'].includes(p.model)&&Number.isFinite(Number(p.forecastHour))&&validPath(p.image)&&p.source&&p.run):[];rebuild()}).catch(()=>{catalog=[];rebuild()});
