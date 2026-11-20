/* Climate Planet — educational 3D planetarium + sourced encyclopedia.
 * Bodies/sizes/orbits on screen are illustrative, deliberately NOT ephemerides or scale models.
 * Planet textures: Solar System Scope CC BY 4.0, attribution linked in the interface.
 */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wiki=(title)=>'https://en.wikipedia.org/wiki/'+title;
const objects=[
 {id:'mercury',category:'planets',name:'عطارد',latin:'MERCURY',color:'#a1a09a',icon:'☿',summary:'أصغر كواكب المجموعة الشمسية وأقربها إلى الشمس. سطحه صخري مليء بالفوهات، وله غلاف خارجي رقيق للغاية.',facts:[['النوع','صخري'],['قطره','4,879 كم'],['مدة السنة','88 يومًا أرضيًا'],['الموقع','الأول من الشمس']],source:wiki('Mercury_(planet)'),radius:3.3,size:.35,speed:2.1,texture:'2k_mercury.jpg'},
 {id:'venus',category:'planets',name:'الزهرة',latin:'VENUS',color:'#e4be84',icon:'♀',summary:'كوكب صخري شديد السخونة بسبب الغلاف الجوي الكثيف وتأثير الاحتباس الحراري الشديد.',facts:[['النوع','صخري'],['قطره','12,104 كم'],['مدة السنة','225 يومًا'],['الغلاف الجوي','كثيف جدًا']],source:wiki('Venus'),radius:4.9,size:.60,speed:1.65,texture:'2k_venus_atmosphere.jpg'},
 {id:'earth',category:'planets',name:'الأرض',latin:'EARTH',color:'#3d83db',icon:'🌍',summary:'الكوكب الثالث من الشمس والوحيد الذي نعرف يقينًا بوجود حياة على سطحه. تمتاز الأرض بمحيطاتها وغلافها الجوي.',facts:[['النوع','صخري'],['القطر','12,742 كم'],['مدة السنة','365.25 يومًا'],['الأقمار الطبيعية','القمر']],source:wiki('Earth'),radius:6.7,size:.64,speed:1.35,texture:'2k_earth_daymap.jpg'},
 {id:'mars',category:'planets',name:'المريخ',latin:'MARS',color:'#c66748',icon:'♂',summary:'كوكب صحراوي بارد نسبيًا، معروف بلونه الأحمر الناتج عن أكاسيد الحديد، وتوجد أدلة على وجود مياه سائلة قديمة.',facts:[['النوع','صخري'],['القطر','6,779 كم'],['مدة السنة','687 يومًا'],['أقماره','فوبوس وديموس']],source:wiki('Mars'),radius:8.7,size:.49,speed:1.03,texture:'2k_mars.jpg'},
 {id:'jupiter',category:'planets',name:'المشتري',latin:'JUPITER',color:'#e0b48f',icon:'♃',summary:'أكبر كواكب المجموعة الشمسية، عملاق غازي يمتاز بأحزمة سحابية وعاصفة شهيرة تسمى البقعة الحمراء العظيمة.',facts:[['النوع','عملاق غازي'],['القطر','نحو 139,820 كم'],['مدة السنة','11.86 سنة'],['سمة مميزة','البقعة الحمراء']],source:wiki('Jupiter'),radius:11.5,size:1.34,speed:.7,texture:'2k_jupiter.jpg'},
 {id:'saturn',category:'planets',name:'زحل',latin:'SATURN',color:'#ddcaa0',icon:'♄',summary:'عملاق غازي محاط بحلقات واسعة تتكون أساسًا من جسيمات جليدية وصخور صغيرة.',facts:[['النوع','عملاق غازي'],['القطر','نحو 116,460 كم'],['مدة السنة','29.45 سنة'],['سمة مميزة','الحلقات الجليدية']],source:wiki('Saturn'),radius:14.7,size:1.09,speed:.52,texture:'2k_saturn.jpg'},
 {id:'uranus',category:'planets',name:'أورانوس',latin:'URANUS',color:'#90dee6',icon:'♅',summary:'عملاق جليدي يظهر بلون مزرق نتيجة الميثان في غلافه الجوي، ويمتلك ميلًا محوريًا استثنائيًا.',facts:[['النوع','عملاق جليدي'],['القطر','نحو 50,724 كم'],['مدة السنة','84 سنة'],['ميل المحور','نحو 98°']],source:wiki('Uranus'),radius:17.2,size:.87,speed:.39,texture:'2k_uranus.jpg'},
 {id:'neptune',category:'planets',name:'نبتون',latin:'NEPTUNE',color:'#4778e2',icon:'♆',summary:'أبعد كواكب المجموعة الشمسية الثمانية عن الشمس، عملاق جليدي معروف برياحه الشديدة.',facts:[['النوع','عملاق جليدي'],['القطر','نحو 49,244 كم'],['مدة السنة','165 سنة'],['الموقع','الثامن من الشمس']],source:wiki('Neptune'),radius:19.6,size:.84,speed:.3,texture:'2k_neptune.jpg'},
 {id:'moon',category:'moons',name:'القمر',latin:'MOON',color:'#d6d4c9',icon:'🌕',summary:'القمر الطبيعي الوحيد للأرض، يؤثر في ظاهرة المد والجزر ويُظهر الوجه نفسه للأرض تقريبًا بسبب الدوران المتزامن.',facts:[['يدور حول','الأرض'],['المتوسط التقريبي للبعد','384,400 كم'],['الدورة المدارية','نحو 27.3 يومًا']],source:wiki('Moon')},
 {id:'europa',category:'moons',name:'أوروبا',latin:'EUROPA',color:'#c7ad82',icon:'◉',summary:'قمر جليدي للمشتري؛ يُرجّح وجود محيط مائي تحت قشرته الجليدية، وله أهمية في البحث عن بيئات قابلة للحياة.',facts:[['يدور حول','المشتري'],['السطح','قشرة جليدية'],['الاهتمام العلمي','محيط تحت السطح']],source:wiki('Europa_(moon)')},
 {id:'titan',category:'moons',name:'تيتان',latin:'TITAN',color:'#f1b867',icon:'◍',summary:'أكبر أقمار زحل، يمتلك غلافًا جويًا كثيفًا وبحيرات وبحارًا من الهيدروكربونات السائلة.',facts:[['يدور حول','زحل'],['نوع الغلاف','غني بالنيتروجين'],['سطحه','بحيرات ميثان وإيثان']],source:wiki('Titan_(moon)')},
 {id:'ganymede',category:'moons',name:'غانيميد',latin:'GANYMEDE',color:'#b3a59b',icon:'◯',summary:'أكبر قمر في المجموعة الشمسية، يدور حول المشتري ويمتلك مجالًا مغناطيسيًا خاصًا به.',facts:[['يدور حول','المشتري'],['القطر','نحو 5,268 كم'],['السمة','مجال مغناطيسي ذاتي']],source:wiki('Ganymede_(moon)')},
 {id:'sirius',category:'stars',name:'الشِّعرى اليمانية',latin:'SIRIUS',color:'#aed7ff',icon:'✦',summary:'ألمع نجوم سماء الليل كما تُرى من الأرض، وينتمي إلى نظام نجمي ثنائي في كوكبة الكلب الأكبر.',facts:[['النوع','نظام نجمي ثنائي'],['المسافة','نحو 8.6 سنة ضوئية'],['الكوكبة','الكلب الأكبر']],source:wiki('Sirius')},
 {id:'betelgeuse',category:'stars',name:'منكب الجوزاء',latin:'BETELGEUSE',color:'#f68d69',icon:'✹',summary:'نجم عملاق أحمر في كوكبة الجبار، معروف بتغير لمعانه وكونه في مرحلة متقدمة من تطوره النجمي.',facts:[['النوع','عملاق أحمر فائق'],['الكوكبة','الجبار'],['السطوع','متغير']],source:wiki('Betelgeuse')},
 {id:'polaris',category:'stars',name:'النجم القطبي',latin:'POLARIS',color:'#c9e2ff',icon:'✧',summary:'نجم قريب من اتجاه القطب السماوي الشمالي، ويستخدم للاستدلال على الشمال الجغرافي في نصف الكرة الشمالي.',facts:[['الاسم','بولاريس'],['الكوكبة','الدب الأصغر'],['الأهمية','تحديد الشمال']],source:wiki('Polaris')},
 {id:'milkyway',category:'galaxies',name:'درب التبانة',latin:'MILKY WAY',color:'#bdb4f2',icon:'✺',summary:'المجرة الحلزونية القضيبية التي تضم النظام الشمسي، ونحن نرى من الأرض جزءًا من قرصها المضئ.',facts:[['النوع','حلزونية قضيبية'],['تضم','النظام الشمسي'],['المجموعة','المجموعة المحلية']],source:wiki('Milky_Way')},
 {id:'andromeda',category:'galaxies',name:'المرأة المسلسلة',latin:'ANDROMEDA / M31',color:'#a2bffa',icon:'✺',summary:'مجرة حلزونية كبيرة ضمن المجموعة المحلية، تبعد نحو 2.5 مليون سنة ضوئية عنا.',facts:[['الاسم الآخر','M31'],['المسافة','نحو 2.5 مليون سنة ضوئية'],['النوع','حلزونية']],source:wiki('Andromeda_Galaxy')},
 {id:'triangulum',category:'galaxies',name:'مجرة المثلث',latin:'TRIANGULUM / M33',color:'#c8a8ed',icon:'✺',summary:'مجرة حلزونية ضمن المجموعة المحلية تقع في اتجاه كوكبة المثلث، أصغر من درب التبانة والمرأة المسلسلة.',facts:[['الاسم الآخر','M33'],['النوع','حلزونية'],['المجموعة','المجموعة المحلية']],source:wiki('Triangulum_Galaxy')},
 {id:'iss',category:'stations',name:'محطة الفضاء الدولية',latin:'ISS',color:'#8cc9e6',icon:'🛰️',summary:'مختبر مداري مأهول تتعاون في تشغيله وكالات فضاء دولية لإجراء الأبحاث في ظروف الجاذبية الصغرى.',facts:[['النوع','محطة مدارية مأهولة'],['المدار','أرضي منخفض'],['المهام','أبحاث علمية وتجارب']],source:wiki('International_Space_Station')},
 {id:'tiangong',category:'stations',name:'محطة تيانغونغ',latin:'TIANGONG',color:'#9ebbd1',icon:'🛰️',summary:'محطة فضائية صينية معيارية في مدار أرضي منخفض تُستخدم لإجراء تجارب وأبحاث علمية.',facts:[['النوع','محطة فضائية'],['المدار','أرضي منخفض'],['الدولة المشغلة','الصين']],source:wiki('Tiangong_space_station')},
 {id:'webb',category:'stations',name:'تلسكوب جيمس ويب',latin:'JWST',color:'#e9c67c',icon:'🔭',summary:'مرصد فضائي يعمل أساسًا في نطاق الأشعة تحت الحمراء لدراسة المجرات المبكرة والنجوم والكواكب الخارجية.',facts:[['النوع','مرصد فضائي'],['الموقع','قرب نقطة L2 شمس–أرض'],['المجال','الأشعة تحت الحمراء']],source:wiki('James_Webb_Space_Telescope')}
];
let focusOnPlanet=()=>{};const planetObjects=objects.filter(o=>o.category==='planets');let category='planets',selected='earth',cosmosDetails=new Map(),searchTerm='';const select=(item)=>{if(!item)return;selected=item.id;$('spaceObjectName').textContent=item.name;$('spaceObjectLatin').textContent=item.latin;$('spaceObjectDesc').textContent=item.summary;$('spaceFacts').innerHTML=item.facts.map(([label,value])=>`<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('');renderArticle(item);document.querySelectorAll('.celestial-card').forEach(b=>b.classList.toggle('is-selected',b.dataset.object===item.id));focusOnPlanet(item.category==='planets'?item.id:null)};
function renderCards(){const rows=objects.filter(x=>x.category===category&&(!searchTerm||(x.name+' '+x.latin+' '+x.summary).toLowerCase().includes(searchTerm)));$('cosmosCards').innerHTML=rows.map(o=>`<button type="button" class="celestial-card ${o.id===selected?'is-selected':''}" data-object="${esc(o.id)}"><span class="celestial-orb" style="color:${o.color}">${o.icon}</span><span><b>${esc(o.name)}</b><small>${esc(o.latin)}</small></span></button>`).join('');$('cosmosCards').querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>select(objects.find(o=>o.id===b.dataset.object))))}

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

$('cosmosFilters').addEventListener('click',e=>{const b=e.target.closest('[data-cosmos]');if(!b)return;category=b.dataset.cosmos;document.querySelectorAll('#cosmosFilters button').forEach(x=>x.classList.toggle('is-on',x===b));renderCards()});renderCards();select(objects.find(x=>x.id==='earth'));
let started=false;
const createFallback=()=>{
 const holder=$('spaceCanvas');holder.innerHTML='<div class="space-fallback"><p>تعذر تحميل مشهد WebGL. تبقى الموسوعة والملفات العلمية متاحة، ويمكن اختيار كوكب من القائمة.</p><div>'+planetObjects.map(p=>`<button data-fallback="${p.id}" type="button" style="border-color:${p.color}">${p.icon} ${p.name}</button>`).join('')+'</div></div>';
 holder.querySelectorAll('[data-fallback]').forEach(b=>b.addEventListener('click',()=>select(objects.find(o=>o.id===b.dataset.fallback))));
};
async function startThree(){
 if(started)return;started=true;
 try{
  const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
  const holder=$('spaceCanvas'),scene=new THREE.Scene();scene.background=new THREE.Color(0x020817);
  const camera=new THREE.PerspectiveCamera(49,1,.08,240);
  const renderer=new THREE.WebGLRenderer({antialias:window.devicePixelRatio<2,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const labels=document.createElement('div');labels.className='v4-planet-labels';holder.replaceChildren(renderer.domElement,labels);
  scene.add(new THREE.AmbientLight(0x91a9d8,1.36));const solarLight=new THREE.PointLight(0xffedd0,210,100,1.35);scene.add(solarLight);
  // SpriteMaterial without a texture renders a rectangular billboard. Use a circular, alpha-faded glow instead.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=256;const ctx=glowCanvas.getContext('2d');
  const gradient=ctx.createRadialGradient(128,128,6,128,128,128);
  gradient.addColorStop(0,'rgba(255,223,134,.90)');gradient.addColorStop(.22,'rgba(255,170,71,.42)');gradient.addColorStop(.60,'rgba(255,130,43,.12)');gradient.addColorStop(1,'rgba(255,130,43,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(1.38,48,32),new THREE.MeshBasicMaterial({color:0xffd27b}));scene.add(sun);
  const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  sunGlow.scale.set(7.3,7.3,1);sun.add(sunGlow);
  let seed=193;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const starPositions=[];
  for(let i=0;i<2300;i++){const theta=rand()*Math.PI*2,phi=Math.acos(2*rand()-1),r=63+rand()*50;starPositions.push(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xc6e2ff,size:.24,sizeAttenuation:true})));
  const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous');const planets=[];const meshes=[];
  for(const planet of planetObjects){
   const orbit=new THREE.Mesh(new THREE.RingGeometry(planet.radius-.009,planet.radius+.009,160),new THREE.MeshBasicMaterial({color:0x527994,side:THREE.DoubleSide,transparent:true,opacity:.25}));orbit.rotation.x=-Math.PI/2;scene.add(orbit);
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(planet.size,42,30),new THREE.MeshStandardMaterial({color:planet.color,roughness:.97,metalness:0}));mesh.userData.objectId=planet.id;scene.add(mesh);meshes.push(mesh);
   const label=document.createElement('button');label.type='button';label.className='v4-planet-label';label.textContent=planet.name;label.setAttribute('aria-label','التركيز على '+planet.name);label.addEventListener('click',()=>select(planet));labels.append(label);
   planets.push({obj:planet,mesh,label,phase:planet.radius*.8});
   if(planet.id==='saturn'){
    const rings=new THREE.Mesh(new THREE.RingGeometry(1.38,2.1,110),new THREE.MeshBasicMaterial({color:0xf1d5a9,side:THREE.DoubleSide,transparent:true,opacity:.72,depthWrite:false}));rings.rotation.x=-1.13;rings.rotation.y=.12;mesh.add(rings);
   }
   loader.load('https://www.solarsystemscope.com/textures/download/'+planet.texture,tex=>{tex.colorSpace=THREE.SRGBColorSpace;mesh.material.map=tex;mesh.material.color.set(0xffffff);mesh.material.needsUpdate=true},undefined,()=>{});
  }
  let yaw=.2,pitch=.69,distance=48,focusId=null,active=true,dragDistance=0;
  const target=new THREE.Vector3(),wantedTarget=new THREE.Vector3(),pointers=new Map();let pinchLength=0;
  const range=()=>focusId?[Math.max(2.1,(planets.find(p=>p.obj.id===focusId)?.obj.size||.65)*2.4),22]:[14,78];
  const clampZoom=x=>{const [mn,mx]=range();distance=Math.max(mn,Math.min(mx,x))};
  focusOnPlanet=id=>{
   if(id&&!planets.some(p=>p.obj.id===id))return;
   focusId=id;distance=id?Math.max(3.3,(planets.find(p=>p.obj.id===id)?.obj.size||1)*5.8):48;
   labels.querySelectorAll('.v4-planet-label').forEach((label,index)=>label.classList.toggle('is-selected',planets[index].obj.id===id));
  };
  $('spaceZoomIn')?.addEventListener('click',()=>clampZoom(distance*.78));$('spaceZoomOut')?.addEventListener('click',()=>clampZoom(distance*1.3));
  $('spaceReset')?.addEventListener('click',()=>focusOnPlanet(null));
  function fit(){const width=holder.clientWidth,height=holder.clientHeight;if(width<10||height<10)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
  fit();const ro=new ResizeObserver(fit);ro.observe(holder);
  const canvas=renderer.domElement;canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);dragDistance=0;canvas.setPointerCapture(e.pointerId);if(pointers.size===2){const a=[...pointers.values()];pinchLength=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);}});
  canvas.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);const dx=e.clientX-old[0],dy=e.clientY-old[1];dragDistance+=Math.abs(dx)+Math.abs(dy);
   if(pointers.size>=2){const a=[...pointers.values()],len=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinchLength>0&&len>0)clampZoom(distance*pinchLength/len);pinchLength=len;return;}
   yaw+=dx*.007;pitch=Math.max(-1.30,Math.min(1.30,pitch+dy*.006));
  });
  function onRelease(e){if(!pointers.has(e.pointerId))return;const wasMulti=pointers.size>1;pointers.delete(e.pointerId);pinchLength=0;
   if(wasMulti||dragDistance>8||e.type!=='pointerup')return;
   const rect=canvas.getBoundingClientRect(),point=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(point,camera);const hits=ray.intersectObjects(meshes);
   if(hits.length)select(objects.find(x=>x.id===hits[0].object.userData.objectId));
  }
  canvas.addEventListener('pointerup',onRelease);canvas.addEventListener('pointercancel',onRelease);
  canvas.addEventListener('wheel',e=>{e.preventDefault();clampZoom(distance*(e.deltaY>0?1.12:.89))},{passive:false});
  const speed=$('orbitSpeed');let last=performance.now();const world=new THREE.Vector3();
  function animate(now){requestAnimationFrame(animate);if(!active||document.hidden){last=now;return}const dt=Math.min((now-last)/1000,.05);last=now;
   const multi=Number(speed?.value)||2,reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   for(const p of planets){if(!reduced)p.phase+=dt*p.obj.speed*.16*multi;p.mesh.position.set(Math.cos(p.phase)*p.obj.radius,0,Math.sin(p.phase)*p.obj.radius);if(!reduced)p.mesh.rotation.y+=dt*.25*multi;}
   const focused=planets.find(x=>x.obj.id===focusId);wantedTarget.copy(focused?.mesh.position||new THREE.Vector3());target.lerp(wantedTarget,.1);
   camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);camera.updateMatrixWorld();
   for(const p of planets){world.copy(p.mesh.position);world.y+=p.obj.size+(.26*distance/30);world.project(camera);const show=world.z>-1&&world.z<1&&Math.abs(world.x)<1.12&&Math.abs(world.y)<1.12;p.label.hidden=!show;if(show){p.label.style.left=(world.x*.5+.5)*100+'%';p.label.style.top=(-world.y*.5+.5)*100+'%';}}
   renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  document.addEventListener('planet-page',event=>{active=event.detail.page==='space';if(active)fit()});
 }catch(error){console.warn('Space viewer fallback',error);createFallback()}
}
document.addEventListener('planet-page',event=>{if(event.detail.page==='space')startThree()});if(location.hash==='#space')startThree();
