/* CLIMATE PLANET — page layout controller. Existing meteorological engines are preserved. */
const $=id=>document.getElementById(id);
const menu=$('v12More');
menu?.addEventListener('click',()=>{$('navToggle')?.click();if($('primaryNav')?.classList.contains('open')){$('primaryNav')?.querySelector('[data-nav]')?.focus({preventScroll:true})}});
// Keep shortcut icons in sync with original app router, including browser back/forward.
function updateDock(){const page=location.hash.slice(1).split('?')[0]||'home';document.querySelectorAll('.v12-bottom-nav a[data-nav]').forEach(a=>{const yes=a.dataset.nav===page;a.classList.toggle('selected',yes);if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
window.addEventListener('hashchange',updateDock);updateDock();
// Editorial feed reuses exactly the site-published CMS JSON, with no invented content.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{const el=$('v12HomeStories');if(!el)return;try{
 const res=await fetch('/data/posts.json');if(!res.ok)throw Error('posts unavailable');const rows=await res.json();
 const latest=[...(Array.isArray(rows)?rows:[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,4);
 el.innerHTML=latest.length?latest.map((p,i)=>`<a class="v12-story-row" href="/articles/${encodeURIComponent(p.slug)}/"><span class="num">${String(i+1).padStart(2,'0')}</span><div><strong>${escape(p.title)}</strong><small>${escape(p.category||'مقال علمي')}${p.date?' · '+escape(p.date):''}</small></div><span aria-hidden="true">↖</span></a>`).join(''):'<div class="empty-inline">لا توجد مقالات منشورة بعد.</div>';
 }catch(e){el.innerHTML='<div class="empty-inline">يمكن متابعة المقالات من قسم المقالات والتحليلات.</div>'}
})();
// Clear helper for mobile drawer without interfering with the original route function.
document.querySelectorAll('.v12-rail a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{$('primaryNav')?.classList.remove('open');$('navToggle')?.setAttribute('aria-expanded','false')}));
