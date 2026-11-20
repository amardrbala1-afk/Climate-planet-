from pathlib import Path
p=Path(__file__).resolve().parents[1]
app=p/'site/assets/app.js';s=app.read_text()
s=s.replace("['home','weather','journal','space','archive']", "['home','operations','weather','journal','space','archive']")
s=s.replace("home:'الرئيسية',weather:'طقس المدن'", "home:'الرئيسية',operations:'مركز العمليات الجوية',weather:'طقس المدن'")
s=s.replace("url.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,uv_index_max');", "url.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,uv_index_max');url.searchParams.set('hourly','temperature_2m,precipitation_probability,precipitation,wind_speed_10m');")
s=s.replace('paintWeather(json)}catch(error)', "paintWeather(json);document.dispatchEvent(new CustomEvent('climate-weather-ready',{detail:{json,city}}))}catch(error)")
s=s.replace("cities=Array.isArray(data)?data:[];$('homeCities')", "cities=Array.isArray(data)?data:[];document.dispatchEvent(new CustomEvent('climate-cities-ready',{detail:{cities}}));$('homeCities')")
s += "\n// The V3 widgets access this public, read-only interface instead of duplicating the V2 city selection.\nwindow.ClimatePlanet={getCities:()=>cities.slice(),getCity:()=>selectedCity,pickCity};\n"
app.write_text(s)
sp=p/'site/assets/space.js';t=sp.read_text()
t=t.replace("const planetObjects=objects.filter(o=>o.category==='planets');let category='planets',selected='earth';", "const planetObjects=objects.filter(o=>o.category==='planets');let category='planets',selected='earth',cosmosDetails=new Map(),searchTerm='';")
t=t.replace("$('spaceWiki').href=item.source;document.querySelectorAll", "renderArticle(item);document.querySelectorAll")
t=t.replace("const rows=objects.filter(x=>x.category===category)", "const rows=objects.filter(x=>x.category===category&&(!searchTerm||(x.name+' '+x.latin+' '+x.summary).toLowerCase().includes(searchTerm)))")
insert='''
const renderArticle=item=>{
 const article=cosmosDetails.get(item.id), el=$('spaceArticle'); if(!el)return;
 if(!article){el.innerHTML='<div class="empty-inline">جاري تحميل الملف العلمي لهذا الجرم…</div>';return;}
 const safe=esc;
 $('spaceCitation').textContent='مستند إلى: ويكيبيديا · '+article.sourceTitle+' · تحرير علمي عربي داخل الموقع';
 el.innerHTML=`<div class="article-intro"><span class="overline">${safe(item.category.toUpperCase())} · SPACE FILE</span><h3>${safe(item.name)} <em>— ${safe(article.headline)}</em></h3><p>${safe(item.summary)}</p></div><div class="encyclopedia-chapters">${article.sections.map((s,i)=>`<article class="encyclopedia-chapter"><div class="chapter-index">0${i+1}</div><div><h4>${safe(s.heading)}</h4><p>${safe(s.body)}</p></div></article>`).join('')}</div><div class="cosmos-didyouknow"><b>✦ ${safe(article.fact)}</b></div><div class="cosmos-source-note">المرجع التحريري: ويكيبيديا الحرة — «${safe(article.sourceTitle)}». النص العربي محرّر داخل كوكب المناخ، وليس رابطًا يحوّلك إلى الموقع الخارجي.</div>`;
};
fetch('/data/cosmos-v3.json').then(r=>{if(!r.ok)throw Error('Cosmos database unavailable');return r.json()}).then(data=>{cosmosDetails=new Map(data.items.map(o=>[o.id,o]));renderArticle(objects.find(o=>o.id===selected));}).catch(err=>{$('spaceArticle').textContent='المعلومات غير متاحة بسبب تعذر تحميل قاعدة الموسوعة.';console.warn(err)});
$('spaceSearch')?.addEventListener('input',e=>{searchTerm=e.target.value.trim().toLocaleLowerCase('ar');renderCards()});
$('spaceRandom')?.addEventListener('click',()=>{const random=objects[Math.floor(Math.random()*objects.length)];category=random.category;searchTerm='';$('spaceSearch').value='';document.querySelectorAll('#cosmosFilters button').forEach(x=>x.classList.toggle('is-on',x.dataset.cosmos===category));renderCards();select(random);document.getElementById('spaceArticle')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'})});
'''
t=t.replace("$('cosmosFilters').addEventListener('click'",insert+"\n$('cosmosFilters').addEventListener('click'",1)
# pause / resume in Three.js without breaking fallback
# simplify no pause; the user has speed settings already
sp.write_text(t)
b=p/'scripts/build.mjs';z=b.read_text()
z=z.replace("await cp(path.join(root,'data','cities.json'),path.join(dist,'data','cities.json'));", "await cp(path.join(root,'data','cities.json'),path.join(dist,'data','cities.json'));await cp(path.join(root,'data','cosmos-v3.json'),path.join(dist,'data','cosmos-v3.json')); ")
z=z.replace("DEFAULT_SITE_URL='https://mute-silence-5660.amardrbala1.workers.dev'", "DEFAULT_SITE_URL='https://climate-planet.climateplanet.workers.dev'")
z=z.replace('Built V2:', 'Built V3:')
z=z.replace("'2026-11-20'", "'2026-11-20'")
b.write_text(z)
pa=p/'package.json';u=pa.read_text().replace('"version": "2.0.0"','"version": "3.0.0"').replace('Climate Planet V2:','Climate Planet V3:');pa.write_text(u)
wr=p/'wrangler.jsonc';u=wr.read_text().replace('mute-silence-5660','climate-planet');wr.write_text(u)
