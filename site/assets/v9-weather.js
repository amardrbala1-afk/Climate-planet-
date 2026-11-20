import{iconPath,weatherIcon,weatherDescription}from'./weather-icons-v9.js';
/** V9 premium presentation on top of V8 real forecasts; no invented readings. */
const el=id=>document.getElementById(id);
let active=null, selected=0;
const num=n=>n==null||!Number.isFinite(+n)?null:+n;
const signed=n=>num(n)==null?'—':Math.round(+n)+'°';
const shortDate=s=>{
 try{return new Intl.DateTimeFormat('ar',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'))}catch{return s||'—'}
};
function applyCurrent(json){
 const c=json?.current;if(!c)return;
 const icon=weatherIcon(c.weather_code,c.is_day!==0);
 el('v9HeroConditionIcon').src=iconPath(icon);
 el('v9HeroConditionIcon').alt=weatherDescription(c.weather_code);
 el('skyLabel').textContent=weatherDescription(c.weather_code);
 const hero=el('v9WeatherHero');hero.dataset.v9Weather=icon;
 const days=el('weatherDays').querySelectorAll('.day-icon');
 days.forEach((node,i)=>{const w=json.daily?.weather_code?.[i],img=document.createElement('img');img.src=iconPath(weatherIcon(w,true));img.alt=weatherDescription(w);img.width=44;img.height=44;img.loading='lazy';node.replaceChildren(img)});
}
function drawWeek(){
 const grid=el('v9WeekGrid');if(!grid)return;grid.replaceChildren();
 if(!active?.json?.daily?.time?.length){grid.textContent='لا تتوفر بيانات الأيام القادمة الآن.';return}
 const d=active.json.daily;
 d.time.slice(0,7).forEach((date,i)=>{
   const b=document.createElement('button');b.type='button';b.className='v9-day-card'+(selected===i?' is-selected':'');b.setAttribute('aria-pressed',String(selected===i));
   const code=d.weather_code?.[i],img=document.createElement('img');img.src=iconPath(weatherIcon(code,true));img.alt=weatherDescription(code);img.width=52;img.height=52;
   const day=document.createElement('span');day.className='v9-day-date';day.textContent=i===0?'اليوم':shortDate(date);
   const temps=document.createElement('strong');temps.textContent=signed(d.temperature_2m_max?.[i])+' / '+signed(d.temperature_2m_min?.[i]);
   const label=document.createElement('small');label.textContent=weatherDescription(code);
   const rain=document.createElement('em');const ch=num(d.precipitation_probability_max?.[i]);rain.textContent=ch==null?'هطول: —':'هطول: '+Math.round(ch)+'%';
   b.append(day,img,temps,label,rain);b.addEventListener('click',()=>{
     const select=el('v6CardDay');if(select?.options?.length>i){select.value=String(i);select.dispatchEvent(new Event('change',{bubbles:true}));}
   });grid.append(b)
 });
}

function drawHourly(){
 const grid=el('v9HourlyGrid');if(!grid)return;grid.replaceChildren();
 const h=active?.json?.hourly, current=active?.json?.current;
 if(!h?.time?.length){grid.textContent='التوقعات الساعية غير متاحة.';return}
 let begin=h.time.findIndex(t=>t>=String(current?.time||''));if(begin<0)begin=0;
 const forecast=h.time.slice(begin).slice(0,25);
 if(!forecast.length){grid.textContent='لا تتوفر ساعات توقع لهذه الفترة.';return}
 for(let k=0;k<forecast.length;k+=3){const i=begin+k;
   const item=document.createElement('div');item.className='v9-hour-item';
   const time=document.createElement('b');time.textContent=h.time[i]?.split('T')[1]||'—';
   const code=h.weather_code?.[i];
   if(code!==undefined&&code!==null){const img=document.createElement('img');img.src=iconPath(weatherIcon(code,h.is_day?.[i]!==0));img.alt=weatherDescription(code);img.width=47;img.height=47;item.append(time,img)}else item.append(time);
   const temp=document.createElement('strong');temp.textContent=signed(h.temperature_2m?.[i]);
   const rain=document.createElement('small');const chance=num(h.precipitation_probability?.[i]);rain.textContent=chance==null?'—':Math.round(chance)+'% مطر';
   item.append(temp,rain);grid.append(item);
 }
}

function weatherReady(e){active=e.detail;selected=0;applyCurrent(active.json);drawWeek();drawHourly();el('v9WeatherHero').classList.add('v9-has-data');}
document.addEventListener('climate-weather-ready',weatherReady);
document.addEventListener('v8-card-date-change',e=>{selected=e.detail.index||0;drawWeek()});
// Keep current temperature clearly differentiated from the selected forecast day.
const status=el('v9WeatherHero')?.querySelector('.weather-kicker');if(status)status.textContent='حالة الطقس الحالية · كوكب المناخ';

document.addEventListener('climate-weather-loading',()=>{
 el('v9WeatherHero').classList.remove('v9-has-data');
 el('v9WeekGrid').textContent='جاري تحديث التوقعات…';
 el('v9HourlyGrid').textContent='جاري تحديث التوقعات الساعية…';
});
document.addEventListener('climate-weather-error',()=>{
 active=null;el('v9WeekGrid').textContent='لم تتوفر بيانات التوقعات لهذه المدينة.';
 el('v9HourlyGrid').textContent='التوقعات الساعية غير متاحة حاليًا.';
});
