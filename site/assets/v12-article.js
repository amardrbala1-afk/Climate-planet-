/* Article contents and reading indicator. No changes to CMS text or data. */
const main=document.querySelector('.article-main');const article=main?.querySelector('.article-body');
if(main&&article){
 const wrapper=document.createElement('div');wrapper.className='v12-article-grid';
 const toc=document.createElement('aside');toc.className='v12-article-toc';toc.setAttribute('aria-label','في هذا المقال');
 const headings=[...article.querySelectorAll('h2,h3')].filter(h=>h.textContent.trim());
 const title=document.createElement('h2');title.textContent='في هذا المقال';toc.append(title);
 if(headings.length){headings.forEach((h,i)=>{if(!h.id)h.id='section-'+(i+1);const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent.trim();toc.append(a)})}
 else{const p=document.createElement('p');p.textContent='مقال علمي من كوكب المناخ';toc.append(p)}
 article.before(wrapper);wrapper.append(toc,article);
 const bar=document.createElement('div');bar.className='v12-reading-bar';document.body.append(bar);
 const sync=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);bar.style.width=(Math.min(100,Math.max(0,scrollY/max*100)))+'%'};
 window.addEventListener('scroll',sync,{passive:true});sync();
}
