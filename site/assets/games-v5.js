/* Climate Planet V5: three self-contained, touch-friendly science games.
   Space physics and geology index are explicitly educational illustrations.
   No external game scripts, accounts, tracking or paid services. */
const $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const reduced=window.matchMedia?.('(prefers-reduced-motion:reduce)')?.matches;
let currentGame='space';
const space={active:false,paused:false,score:0,level:1,lives:3,time:0,ship:{x:135,y:230,r:18},asteroids:[],gems:[],keys:new Set(),touch:new Set(),stars:[],last:0,raf:0,best:0,invuln:0};
const canvas=$('v5SpaceCanvas'),c=canvas?.getContext('2d');
for(let i=0;i<155;i++)space.stars.push({x:((i*739+37)%859),y:((i*313+55)%461),r:(i%5===0?1.9:.65),a:.35+(i%9)/15});
try{space.best=Number(localStorage.getItem('cp:v5:space-best')||0)}catch{}
function updateSpaceUI(){ $('v5SpaceScore').textContent=space.score; $('v5SpaceLevel').textContent=space.level;$('v5SpaceLives').textContent=space.lives;$('v5SpaceBest').textContent=Math.max(space.best,space.score) }
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function coverSpace(title,message,action){const el=$('v5SpaceCover');el.hidden=false;el.querySelector('strong').textContent=title;el.querySelector('p').textContent=message;$('v5SpaceStart').textContent=action}
function resetSpace(){space.score=0;space.level=1;space.lives=3;space.time=0;space.ship.x=125;space.ship.y=230;space.asteroids=[];space.gems=[];space.invuln=0;space.keys.clear();space.touch.clear();updateSpaceUI();drawSpace()}
function startSpace(){resetSpace();space.active=true;space.paused=false;space.last=0;$('v5SpaceCover').hidden=true;$('v5SpacePause').textContent='إيقاف مؤقت';cancelAnimationFrame(space.raf);space.raf=requestAnimationFrame(tickSpace)}
function stopSpace(){space.active=false;cancelAnimationFrame(space.raf);if(space.score>space.best){space.best=space.score;try{localStorage.setItem('cp:v5:space-best',String(space.best))}catch{}}updateSpaceUI();coverSpace('انتهت الرحلة',`جمعت ${space.score} نقطة، ووصلت إلى المستوى ${space.level}.`,'رحلة جديدة')}
function pauseSpace(force){if(!space.active)return;space.paused=force===undefined?!space.paused:force;$('v5SpacePause').textContent=space.paused?'متابعة':'إيقاف مؤقت';if(!space.paused){space.last=0;space.raf=requestAnimationFrame(tickSpace)}else cancelAnimationFrame(space.raf)}
function rnd(start,end){return start+Math.random()*(end-start)}
const planets=[['الأرض','#1b8ed6'],['المريخ','#c96a45'],['المشتري','#e3af76'],['زحل','#d8bb82'],['أورانوس','#65d1d9'],['نبتون','#466bdc']];
function drawSpace(){if(!c)return;
 const w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#030d23');g.addColorStop(.63,'#09162e');g.addColorStop(1,'#071e30');c.fillStyle=g;c.fillRect(0,0,w,h);
 for(const star of space.stars){const off=space.time*8*star.r;c.fillStyle=`rgba(205,241,255,${star.a})`;c.beginPath();c.arc((star.x-off%w+w)%w,star.y,star.r,0,Math.PI*2);c.fill()}
 const planet=planets[(space.level-1)%planets.length];const pg=c.createRadialGradient(710,105,8,710,105,101);pg.addColorStop(0,'#ffffff');pg.addColorStop(.2,planet[1]);pg.addColorStop(1,'#0a2340');c.fillStyle=pg;c.beginPath();c.arc(710,105,92,0,Math.PI*2);c.fill();c.fillStyle='rgba(250,251,255,.7)';c.font='600 18px Cairo, sans-serif';c.textAlign='center';c.fillText(planet[0],710,220);
 for(const rock of space.asteroids){c.save();c.translate(rock.x,rock.y);c.rotate(rock.rot);c.fillStyle='#788d9c';c.strokeStyle='#c2d0d5';c.lineWidth=2;c.beginPath();for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=rock.r*(.8+((i*7+rock.seed)%5)*.068);const x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?c.moveTo(x,y):c.lineTo(x,y)}c.closePath();c.fill();c.stroke();c.fillStyle='#344958';c.beginPath();c.arc(-rock.r*.24,-rock.r*.1,rock.r*.2,0,7);c.fill();c.restore()}
 for(const gem of space.gems){const glow=16+5*Math.sin(space.time*4+gem.y);c.save();c.shadowBlur=glow;c.shadowColor='#5efbea';c.translate(gem.x,gem.y);c.rotate(space.time*2);c.fillStyle='#68fff1';c.beginPath();c.moveTo(0,-gem.r);c.lineTo(gem.r*.76,0);c.lineTo(0,gem.r);c.lineTo(-gem.r*.76,0);c.closePath();c.fill();c.restore()}
 const s=space.ship;c.save();c.translate(s.x,s.y);if(space.invuln>0&&Math.floor(space.time*12)%2)c.globalAlpha=.35;c.shadowColor='#59fafa';c.shadowBlur=18;c.fillStyle='#7bffff';c.beginPath();c.moveTo(24,0);c.lineTo(-16,-15);c.lineTo(-9,0);c.lineTo(-16,15);c.closePath();c.fill();c.shadowBlur=0;c.fillStyle='#267bb1';c.beginPath();c.arc(0,0,6,0,7);c.fill();const fire=10+Math.sin(space.time*28)*4;c.fillStyle='#ffc265';c.beginPath();c.moveTo(-15,0);c.lineTo(-15-fire,-5);c.lineTo(-15-fire,5);c.fill();c.restore();
 c.fillStyle='rgba(226,246,251,.65)';c.font='15px Cairo, sans-serif';c.textAlign='right';c.fillText('محاكاة فضائية تعليمية',w-20,h-17);
}
function tickSpace(now){if(!space.active||space.paused)return;if(!document.querySelector('#games')?.classList.contains('is-active')||currentGame!=='space'||document.hidden){pauseSpace(true);return}
 let dt=clamp(space.last?(now-space.last)/1000:1/60,.005,.04);space.last=now;space.time+=dt;
 let dx=(space.keys.has('ArrowRight')||space.keys.has('d')||space.touch.has('right')?1:0)-(space.keys.has('ArrowLeft')||space.keys.has('a')||space.touch.has('left')?1:0),dy=(space.keys.has('ArrowDown')||space.keys.has('s')||space.touch.has('down')?1:0)-(space.keys.has('ArrowUp')||space.keys.has('w')||space.touch.has('up')?1:0);const norm=Math.hypot(dx,dy)||1;space.ship.x=clamp(space.ship.x+dx/norm*330*dt,28,canvas.width-28);space.ship.y=clamp(space.ship.y+dy/norm*330*dt,25,canvas.height-25);
 space.invuln=Math.max(0,space.invuln-dt);
 // Time-based spawns, with bounded entity counts on mobile.
 if(Math.random()<dt*(.8+space.level*.23)&&space.asteroids.length<17){space.asteroids.push({x:canvas.width+36,y:rnd(30,canvas.height-30),r:rnd(13,31),speed:rnd(100,175)+space.level*20,rot:rnd(0,7),seed:Math.random()*10})}
 if(Math.random()<dt*1.18&&space.gems.length<7){space.gems.push({x:canvas.width+30,y:rnd(40,canvas.height-40),r:14,speed:125+space.level*13})}
 const hit=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
 for(const rock of space.asteroids){rock.x-=rock.speed*dt;rock.rot+=dt*.8;if(space.invuln<=0&&hit(rock,space.ship,rock.r+12)){space.lives--;space.invuln=1.4;rock.x=-100;updateSpaceUI();if(space.lives<=0){stopSpace();drawSpace();return}}}
 for(const gem of space.gems){gem.x-=gem.speed*dt;if(hit(gem,space.ship,26)){gem.x=-100;space.score+=10;const next=1+Math.floor(space.score/70);if(next>space.level){space.level=next;space.lives=Math.min(5,space.lives+1)}updateSpaceUI()}}
 space.asteroids=space.asteroids.filter(x=>x.x>-50);space.gems=space.gems.filter(x=>x.x>-50);
 drawSpace();space.raf=requestAnimationFrame(tickSpace)
}
$('v5SpaceStart').addEventListener('click',startSpace);$('v5SpaceRestart').addEventListener('click',startSpace);$('v5SpacePause').addEventListener('click',()=>pauseSpace());
window.addEventListener('keydown',e=>{if(!document.querySelector('#games')?.classList.contains('is-active')||currentGame!=='space')return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(k)){space.keys.add(k);e.preventDefault()}});
window.addEventListener('keyup',e=>{space.keys.delete(e.key.length===1?e.key.toLowerCase():e.key)});
for(const b of document.querySelectorAll('#v5TouchPad [data-move]')){const action=b.dataset.move;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);space.touch.add(action)});for(const typ of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(typ,()=>space.touch.delete(action))}
canvas.addEventListener('pointermove',e=>{if(e.buttons!==1||!space.active||space.paused)return;const box=canvas.getBoundingClientRect();space.ship.x=clamp((e.clientX-box.left)*canvas.width/box.width,28,canvas.width-28);space.ship.y=clamp((e.clientY-box.top)*canvas.height/box.height,25,canvas.height-25)});
drawSpace();updateSpaceUI();

// Forecaster: authored training cases; not live numerical forecasts.
const cases=[
 {tag:'طبقة 500 hPa',question:'تشير الخرائط إلى انخفاض كبير في ارتفاعات 500 هكتوباسكال نحو شرق المتوسط. ما الذي يرجّحه ذلك؟',facts:['أخدود علوي','انخفاض في الارتفاعات','امتداد نحو الجنوب'],answers:['مرتفع علوي دافئ','أخدود جوي علوي','موجة حر سطحية مؤكدة'],correct:1,why:'انخفاض ارتفاعات 500 hPa غالبًا ما يرتبط بأخدود علوي، لكنه وحده لا يؤكد هطول الأمطار.'},
 {tag:'حرارة 850 hPa',question:'تسجل طبقة 850 هكتوباسكال حرارة -4° فوق منطقة مرتفعة. هل يكفي ذلك للجزم بتساقط الثلوج؟',facts:['850 hPa: -4°','الارتفاع: 1000 م','مستوى التجمد السطحي غير معروف'],answers:['نعم في كل الأحوال','لا، نحتاج البروفيل الحراري والرطوبة والهطول','يمنع تساقط الثلوج'],correct:1,why:'حرارة 850 hPa مؤشر مهم لكن تقدير الثلوج يحتاج بنية العمود الهوائي وحرارة السطح والهطول.'},
 {tag:'قياس الهطول',question:'يسجل مقياس المطر 18 ملم خلال 24 ساعة، ماذا تعني القيمة؟',facts:['كمية هطول: 18 مم','الفترة: 24 ساعة'],answers:['18 لترًا تقريبًا لكل متر مربع','18 لترًا في كل مدينة','ارتفاع ثلج 18 سم حتمًا'],correct:0,why:'كل مليمتر من الماء السائل يساوي لترًا واحدًا لكل متر مربع، وليس مقدارًا محددًا من الثلوج.'},
 {tag:'توقعات المدن',question:'نموذجان يختلفان في كمية المطر المتوقعة للمدينة ذاتها، ما التصرف العلمي الأنسب؟',facts:['النموذج A: 9 ملم','النموذج B: 32 ملم'],answers:['اختيار القيمة الأعلى تلقائيًا','إعلان الفيضان','عرض عدم اليقين مع مراجعة بقية المعطيات'],correct:2,why:'اختلاف النماذج يعكس عدم يقين ينبغي توضيحه ولا يكفي وحده لصدور تحذير.'},
 {tag:'ضغط السطح',question:'انخفاض الضغط السطحي مع زيادة تدرّج خطوط تساوي الضغط يشير غالبًا إلى:',facts:['الضغط: 997 hPa','خطوط متقاربة'],answers:['رياح أقوى نسبيًا','سكون تام للرياح','غياب أي فرصة للمطر'],correct:0,why:'زيادة تدرج الضغط قوة دافعة للرياح، وتتأثر السرعة بالاحتكاك والقوى الأخرى.'},
 {tag:'سرعة الرياح',question:'سرعة الرياح 60 كم/س تساوي تقريبًا كم مترًا في الثانية؟',facts:['60 كم/ساعة','1 م/ث = 3.6 كم/ساعة'],answers:['6.0 م/ث','16.7 م/ث','36 م/ث'],correct:1,why:'نقسم كم/ساعة على 3.6: إذًا 60 ÷ 3.6 ≈ 16.7 م/ث.'},
 {tag:'أرصاد سطحية',question:'ارتفاع الرطوبة النسبية إلى 95% قرب السطح مع تبريد ليلي، ما الظاهرة المحتملة؟',facts:['رطوبة: 95%','رياح ضعيفة','ليلة صافية'],answers:['ضباب إشعاعي في الظروف المناسبة','عاصفة رملية حتمية','منخفض علوي مؤكد'],correct:0,why:'التبريد والرطوبة العالية والرياح الخفيفة قد تساعد على تشكل الضباب، لكن لا تجعله حتميًا.'},
 {tag:'التوقع الزمني',question:'في نموذج أمطار تراكمية، ما الفرق بين تراكم 6 ساعات وتراكم 24 ساعة؟',facts:['تراكم 06 ساعات','تراكم 24 ساعة'],answers:['لا يوجد فرق','الفترة التي تُجمع خلالها كمية الهطول','الحد الأقصى لسرعة الرياح'],correct:1,why:'المجموع التراكمي يعتمد على النافذة الزمنية؛ المقارنة تتطلب توحيد مدة التراكم.'},
 {tag:'الموجات الحارة',question:'عندما ترتفع درجة الحرارة المحسوسة فوق الحرارة الفعلية، ما العامل الذي قد يساهم بذلك؟',facts:['حرارة 34°','رطوبة مرتفعة'],answers:['زيادة الرطوبة مع الحر','نقص الضغط وحده','غياب الشمس دائمًا'],correct:0,why:'الرطوبة المرتفعة تحد من تبخر العرق، وقد تزيد الإجهاد الحراري والحرارة المحسوسة.'},
 {tag:'الارتفاع الجغرافي',question:'لماذا قد تختلف حرارة منطقة جبلية عن مدينة ساحلية مجاورة؟',facts:['منطقة على ارتفاع 1400 م','مدينة ساحلية على 30 م'],answers:['الارتفاع والتضاريس والكتل الهوائية','التوقيت وحده','الخط الجغرافي وحده'],correct:0,why:'الارتفاع يؤثر في الحرارة لكن الفروق تعتمد كذلك على التضاريس والرياح والكتلة الهوائية.'},
 {tag:'الثلوج',question:'أيها أكثر دقة عند نشر خبر عن تراكم الثلوج؟',facts:['طبقات حرارية باردة','توقع هطول','لا توجد قياسات تراكم أرضية'],answers:['الإعلان عن 40 سم مؤكد','ذكر احتمال الثلوج مع عدم اليقين','الجزم بعدم تساقط أي ثلج'],correct:1,why:'تنبؤات الثلج حساسة للحرارة والهطول والارتفاع، ولا يمكن استنتاج تراكم محدد من دليل واحد.'},
 {tag:'مصادر الطقس',question:'ما المعلومات الأساسية التي ينبغي إرفاقها بخريطة نموذج عددي؟',facts:['خريطة ارتفاعات 500 hPa','أُنتجت من بيانات مفتوحة'],answers:['لون الخريطة فقط','اسم النموذج وتوقيت التشغيل وساعة التوقع والمصدر','اسم المصمم فقط'],correct:1,why:'لتقييم أي خريطة توقعات، يجب معرفة النموذج والتشغيل والطبقة وساعة التوقع والمصدر.'}
];
let caseIndex=0,caseScore=0,answered=false;
function renderCase(){const d=cases[caseIndex];if(!d){$('v5ForecastQuestion').textContent='اكتمل التحدي';$('v5ForecastTopic').textContent='النتيجة النهائية';$('v5ForecastFacts').innerHTML='';$('v5ForecastAnswers').innerHTML='';$('v5ForecastFeedback').textContent=`${caseScore} من ${cases.length*10} نقطة. يمكنك إعادة التحدي والمحاولة مرة أخرى.`;$('v5ForecastNext').disabled=true;$('v5ForecastCount').textContent='اكتمل التحدي';return}
 answered=false;$('v5ForecastCount').textContent=`السؤال ${caseIndex+1} من ${cases.length}`;$('v5ForecastScore').textContent=caseScore;$('v5ForecastTopic').textContent=d.tag;$('v5ForecastQuestion').textContent=d.question;$('v5ForecastFacts').replaceChildren(...d.facts.map(s=>{const x=document.createElement('span');x.textContent=s;return x}));$('v5ForecastAnswers').replaceChildren(...d.answers.map((answer,i)=>{const b=document.createElement('button');b.type='button';b.textContent=answer;b.addEventListener('click',()=>answerCase(i));return b}));$('v5ForecastFeedback').textContent='';$('v5ForecastNext').disabled=true;$('v5ForecastNext').textContent=caseIndex===cases.length-1?'عرض النتيجة':'السؤال التالي'
}
function answerCase(which){if(answered)return;answered=true;const d=cases[caseIndex],correct=which===d.correct;if(correct)caseScore+=10;$('v5ForecastScore').textContent=caseScore;[...$('v5ForecastAnswers').children].forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===d.correct);b.classList.toggle('wrong',i===which&&!correct)});$('v5ForecastFeedback').innerHTML=`<strong>${correct?'إجابة صحيحة (+10)':'إجابة غير صحيحة'}</strong><p>${d.why}</p>`;$('v5ForecastNext').disabled=false}
$('v5ForecastNext').addEventListener('click',()=>{caseIndex++;renderCase()});$('v5ForecastRestart').addEventListener('click',()=>{caseIndex=0;caseScore=0;renderCase()});renderCase();

// Geology: dimensionless, intentionally illustrative erosion/runoff indicators.
const geoCanvas=$('v5GeologyCanvas'),g=geoCanvas.getContext('2d');let geoProgress=0,geoRaf=0,geoOutcome=null;
function readGeo(){return{rain:Number($('v5Rain').value),slope:Number($('v5Slope').value),plants:Number($('v5Plants').value)}}
function geoReadouts(){const {rain,slope,plants}=readGeo();$('v5RainLabel').textContent=rain+' مم/ساعة';$('v5SlopeLabel').textContent=slope+'°';$('v5PlantsLabel').textContent=plants+'%'}
for(const k of ['v5Rain','v5Slope','v5Plants'])$(k).addEventListener('input',()=>{geoReadouts();drawGeo()});
function calcGeo(){const {rain,slope,plants}=readGeo();const runoff=clamp((rain/100)*(.55+slope/110)*(1-plants*.0045)*100,0,100);const erosion=clamp(Math.pow(rain/100,1.15)*Math.pow(.25+slope/48,1.2)*(1-.78*plants/100)*115,0,100);return{runoff:Math.round(runoff),erosion:Math.round(erosion),classification:erosion<18?'منخفض':erosion<43?'متوسط':'مرتفع'}}
function drawGeo(){const {rain,slope,plants}=readGeo(),w=geoCanvas.width,h=geoCanvas.height;g.clearRect(0,0,w,h);const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#102c44');bg.addColorStop(1,'#061624');g.fillStyle=bg;g.fillRect(0,0,w,h);
 const soilY=x=>270-(slope/50)*(x/w)*160;g.beginPath();g.moveTo(0,h);g.lineTo(0,soilY(0));for(let x=0;x<=w;x+=8)g.lineTo(x,soilY(x));g.lineTo(w,h);g.closePath();g.fillStyle='#856044';g.fill();g.strokeStyle='#cfab7c';g.lineWidth=4;g.stroke();
 for(let i=0;i<80;i++){const x=(i*97)%w,y=soilY(x);if((i%10)*10<plants){g.strokeStyle='#5fc482';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x-7,y-15);g.moveTo(x,y);g.lineTo(x+7,y-19);g.stroke();g.fillStyle='#70db92';g.fillRect(x-5,y-18,11,5)}}
 if(geoProgress>0){g.strokeStyle='#62d5ff';g.lineWidth=2+rain/30;g.beginPath();for(let x=0;x<w*geoProgress;x+=12){const y=soilY(x)-3+Math.sin(x*.03)*2;x===0?g.moveTo(x,y):g.lineTo(x,y)}g.stroke();for(let i=0;i<80;i++){const xx=((i*157+geoProgress*130)%w),yy=(i*101+geoProgress*510)%h;if(yy<soilY(xx)-10&&i<rain*.75){g.strokeStyle='rgba(126,214,255,.6)';g.lineWidth=1;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx-4,yy+12);g.stroke()}}}
 g.fillStyle='#e1eff7';g.font='17px Cairo, sans-serif';g.textAlign='right';g.fillText('نموذج تعليمي للتعرية والجريان',w-22,30);
}
function runGeo(){cancelAnimationFrame(geoRaf);geoOutcome=calcGeo();$('v5Runoff').textContent=geoOutcome.runoff+'/100';$('v5Erosion').textContent=geoOutcome.erosion+'/100';$('v5ErosionClass').textContent=geoOutcome.classification;geoProgress=.001;const t0=performance.now();const loop=t=>{geoProgress=clamp((t-t0)/(reduced?400:1600),0,1);drawGeo();if(geoProgress<1&&document.querySelector('#games')?.classList.contains('is-active')&&currentGame==='geology')geoRaf=requestAnimationFrame(loop)};geoRaf=requestAnimationFrame(loop)}
$('v5GeologyRun').addEventListener('click',runGeo);$('v5GeologyReset').addEventListener('click',()=>{$('v5Rain').value=50;$('v5Slope').value=25;$('v5Plants').value=40;geoProgress=0;geoOutcome=null;for(const i of ['v5Runoff','v5Erosion','v5ErosionClass'])$(i).textContent='—';geoReadouts();cancelAnimationFrame(geoRaf);drawGeo()});geoReadouts();drawGeo();
// Tab navigation stops CPU work when a game isn't visible.
function setGame(name){currentGame=name;document.querySelectorAll('#v5GameTabs [data-v5-game]').forEach(b=>{const yes=b.dataset.v5Game===name;b.classList.toggle('is-on',yes);b.setAttribute('aria-selected',String(yes))});document.querySelectorAll('[data-v5-game-panel]').forEach(p=>p.hidden=p.dataset.v5GamePanel!==name);if(name!=='space')pauseSpace(true);if(name!=='geology')cancelAnimationFrame(geoRaf)}
$('v5GameTabs').addEventListener('click',e=>{const b=e.target.closest('[data-v5-game]');if(b)setGame(b.dataset.v5Game)});
document.addEventListener('planet-page',e=>{if(e.detail.page!=='games')pauseSpace(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseSpace(true)});
