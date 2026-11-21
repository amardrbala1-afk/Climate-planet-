/* Climate Planet V11 — simple navigation and local editorial search.
 * Progressive enhancement: all primary pages still work without this module. */
const byId=id=>document.getElementById(id);
const modal=byId('v11SearchDialog');
const openButton=byId('v11OpenSearch');
const closeButton=byId('v11CloseSearch');
const input=byId('v11SearchInput');
const output=byId('v11SearchResults');
const sections=[
 {title:'طقس المدن',sub:'الحالة الحالية والتوقعات الساعية',page:'weather',words:'طقس حرارة مدن توقعات اليوم الغد ملابس'},
 {title:'الخرائط الجوية',sub:'GFS والنماذج العددية',page:'operations',words:'خرائط نموذج نماذج gfs ecmwf ضغط 500 850 مطر أمطار'},
 {title:'أرشيف ثلوج القدس',sub:'المواسم والعواصف التاريخية',page:'archive',words:'قدس ثلج شتاء ثلوج أرشيف تاريخ 1950'},
 {title:'المقالات والتحليلات',sub:'مقالات ونشرات وخرائط',page:'journal',words:'مقال تقارير تحليل أخبار مناخ'},
 {title:'موسوعة الفضاء',sub:'الكواكب والأجرام والمهمات',page:'space',words:'فضاء زحل شمس كواكب نجوم فلك قمر مجرة'},
 {title:'الألعاب العلمية',sub:'لعبة فضاء وتحدي المتنبئ',page:'games',words:'العاب تعليمية تفاعلية لعبة'}
];
const normalize=t=>String(t||'').normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').toLocaleLowerCase('ar').trim();
let cityIndex=[],articleIndex=[],loaded=false,lastFocus=null;
const escapeText=x=>String(x||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function item(title,subtitle,type,key){return `<button type="button" class="v11-search-result" role="option" data-v11-type="${escapeText(type)}" data-v11-key="${escapeText(key)}"><span><b>${escapeText(title)}</b><small>${escapeText(subtitle)}</small></span><span aria-hidden="true">←</span></button>`}
function render(){if(!output)return;const q=normalize(input.value),results=[];
 for(const s of sections){if(!q||normalize(s.title+' '+s.words).includes(q))results.push(item(s.title,s.sub,'page',s.page))}
 if(q.length>0){
  for(const c of cityIndex.filter(c=>normalize((c.ar||c.name)+' '+(c.name||'')).includes(q)).slice(0,8))results.push(item(c.ar||c.name,'مدينة · توقعات الطقس','city',c.ar||c.name));
  for(const a of articleIndex.filter(a=>normalize(a.title+' '+(a.summary||'')).includes(q)).slice(0,4))results.push(item(a.title,'مقال علمي','article',a.slug));
 }
 output.innerHTML=results.length?results.slice(0,15).join(''):'<p class="v11-search-empty">لا توجد نتائج مطابقة. جرّب كلمة أقصر أو اسم مدينة أخرى.</p>';
}
async function loadSearchData(){if(loaded)return;loaded=true;
 try{const r=await fetch('/data/cities.json',{cache:'force-cache'});if(r.ok){const data=await r.json();cityIndex=Array.isArray(data)?data:[]}}catch(e){console.debug('City search offline',e)}
 try{const r=await fetch('/data/posts.json',{cache:'force-cache'});if(r.ok){const data=await r.json();articleIndex=Array.isArray(data)?data:[]}}catch(e){console.debug('Article search offline',e)}
 render();
}
function openSearch(){if(!modal)return;lastFocus=document.activeElement;modal.hidden=false;document.body.classList.add('v11-search-open');input.value='';render();input.focus();loadSearchData()}
function closeSearch(){if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove('v11-search-open');lastFocus?.focus?.()}
openButton?.addEventListener('click',openSearch);
closeButton?.addEventListener('click',closeSearch);
modal?.addEventListener('click',e=>{if(e.target.closest('[data-v11-close]'))closeSearch()});
input?.addEventListener('input',render);
output?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-v11-type]');if(!btn)return;
 const type=btn.dataset.v11Type,key=btn.dataset.v11Key;
 if(type==='article'){
  window.location.assign('/articles/'+encodeURIComponent(key)+'/');return;
 }
 closeSearch();
 if(type==='page'){location.hash='#'+key;return}
 if(type==='city'){
  location.hash='#weather';
  const set=()=>{
   const field=byId('citySearch');if(!field)return;
   field.value=key;field.dispatchEvent(new Event('input',{bubbles:true}));
   const list=byId('citiesList');const match=[...(list?.querySelectorAll('[data-city]')||[])].find(b=>normalize(b.textContent).includes(normalize(key)));
   if(match)match.click();
  };
  requestAnimationFrame(()=>requestAnimationFrame(set));
 }
});
document.addEventListener('keydown',e=>{
 if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))){e.preventDefault();openSearch()}
 if(e.key==='Escape'){closeSearch();const nav=byId('primaryNav');if(nav?.classList.contains('open')){nav.classList.remove('open');byId('navToggle')?.setAttribute('aria-expanded','false')}}
 if(!modal?.hidden&&e.key==='Tab'){
  const focusables=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(n=>n.offsetParent!==null);
  if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
});
// Direct links to major blocks avoid hidden content and do not change the page route.
document.querySelectorAll('[data-v11-scroll]').forEach(button=>button.addEventListener('click',()=>{
 const page=button.closest('.page'),target=page?.querySelector(button.dataset.v11Scroll);
 if(!target)return;
 target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}));
// Click outside mobile nav closes it; route handler owns page transitions.
document.addEventListener('pointerdown',e=>{
 const nav=byId('primaryNav'),toggle=byId('navToggle');
 if(nav?.classList.contains('open')&&!nav.contains(e.target)&&!toggle?.contains(e.target)){
  nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')
 }
});
// Back to top: compact and only shown when needed.
const topButton=document.createElement('button');topButton.type='button';topButton.className='v11-back-top';topButton.setAttribute('aria-label','العودة إلى أعلى الصفحة');topButton.textContent='↑';document.body.append(topButton);
topButton.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
const revealTop=()=>topButton.classList.toggle('visible',window.scrollY>540);
window.addEventListener('scroll',revealTop,{passive:true});revealTop();
// Skip navigation without changing the SPA hash or resetting the active page.
document.querySelector('.v11-skip')?.addEventListener('click',e=>{
 e.preventDefault();const main=byId('mainContent');main?.focus({preventScroll:true});main?.scrollIntoView({block:'start',behavior:'instant'});
});
byId('primaryNav')?.addEventListener('click',e=>{
 if(!e.target.closest('a[data-nav]'))return;
 byId('primaryNav').classList.remove('open');byId('navToggle')?.setAttribute('aria-expanded','false');
});
