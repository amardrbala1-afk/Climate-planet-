/* Climate Planet V5: two self-contained, touch-friendly science games.
   Space simulation is an intentionally educational arcade game.
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
const planets=[['الأرض','#1b8ed6'],['المريخ','#c96a45'],['المشتري','#e3af76'],['زحل','#d8bb82'],['أورانوس','#65d1d9'],['نبتون','#466bdc'],['عطارد','#b9b9b2'],['الزهرة','#dfb578']];
function drawSpace(){if(!c)return;
 const w=canvas.width,h=canvas.height,t=space.time;c.clearRect(0,0,w,h);
 const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#02071b');bg.addColorStop(.55,'#082345');bg.addColorStop(1,'#030d23');c.fillStyle=bg;c.fillRect(0,0,w,h);
 // Procedural parallax nebula clouds and starfield
 for(let j=0;j<5;j++){const x=(j*241+150)%w,y=(j*157+92)%h,r=130+j*36;const n=c.createRadialGradient(x,y,5,x,y,r);n.addColorStop(0,j%2?'rgba(68,62,180,.17)':'rgba(39,175,191,.14)');n.addColorStop(1,'rgba(1,5,18,0)');c.fillStyle=n;c.fillRect(x-r,y-r,r*2,r*2)}
 for(const s of space.stars){const x=(s.x-t*(8+s.r*13)%w+w)%w;const tw=s.a+.19*Math.sin(t*1.7+s.y);c.fillStyle=`rgba(214,241,255,${Math.max(.12,tw)})`;c.beginPath();c.arc(x,s.y,s.r,0,Math.PI*2);c.fill();if(s.r>1.5){c.strokeStyle='rgba(147,212,255,.20)';c.beginPath();c.moveTo(x-4,s.y);c.lineTo(x+4,s.y);c.moveTo(x,s.y-4);c.lineTo(x,s.y+4);c.stroke()}}
 const [name,color]=planets[(space.level-1)%planets.length];const x=710,y=124,r=name==='المشتري'?102:name==='زحل'?95:83;
 c.save();c.translate(x,y);if(name==='زحل'){c.strokeStyle='rgba(244,218,155,.53)';c.lineWidth=23;c.beginPath();c.ellipse(0,0,r*1.45,r*.42,-.23,0,Math.PI*2);c.stroke()}
 const globe=c.createRadialGradient(-r*.40,-r*.48,8,10,10,r*1.38);globe.addColorStop(0,'#fff7db');globe.addColorStop(.18,color);globe.addColorStop(.75,color);globe.addColorStop(1,'#071324');c.fillStyle=globe;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.save();c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();c.strokeStyle=name==='المشتري'||name==='زحل'?'rgba(255,232,183,.35)':'rgba(207,249,251,.20)';c.lineWidth=14;for(let i=-3;i<4;i++){const yy=i*27+(Math.sin(t*.18+i)*4);c.beginPath();c.ellipse(0,yy,r*1.3,16,0,0,Math.PI*2);c.stroke()}c.restore();c.restore();
 c.font='700 19px Cairo, sans-serif';c.textAlign='center';c.fillStyle='#e5faff';c.fillText(`الوجهة: ${name}`,710,252);
 for(const rock of space.asteroids){c.save();c.translate(rock.x,rock.y);c.rotate(rock.rot);const a=c.createRadialGradient(-rock.r*.35,-rock.r*.35,1,0,0,rock.r*1.25);a.addColorStop(0,'#e6d5c3');a.addColorStop(.48,'#8793a4');a.addColorStop(1,'#344559');c.fillStyle=a;c.strokeStyle='#c5b4a3';c.lineWidth=2;c.beginPath();for(let i=0;i<10;i++){const rad=i*Math.PI/5,rr=rock.r*(.82+((i+Math.round(rock.seed))%4)*.072);i?c.lineTo(Math.cos(rad)*rr,Math.sin(rad)*rr):c.moveTo(Math.cos(rad)*rr,Math.sin(rad)*rr)}c.closePath();c.fill();c.stroke();for(let k=0;k<3;k++){c.beginPath();c.arc(rock.r*(k%2?-.3:.3),rock.r*(k-1)*.25,rock.r*(.12+k*.035),0,7);c.fillStyle='rgba(35,48,67,.52)';c.fill()}c.restore()}
 for(const gem of space.gems){c.save();c.translate(gem.x,gem.y);c.rotate(t*2);c.shadowBlur=18+5*Math.sin(t*5);c.shadowColor='#65fff1';c.fillStyle='#8cfff0';c.beginPath();c.moveTo(0,-gem.r);c.lineTo(gem.r*.77,0);c.lineTo(0,gem.r);c.lineTo(-gem.r*.77,0);c.closePath();c.fill();c.restore()}
 const s=space.ship;c.save();c.translate(s.x,s.y);if(space.invuln>0&&Math.floor(t*12)%2)c.globalAlpha=.4;
 const flare=14+Math.sin(t*27)*7;c.fillStyle='#ffb267';c.beginPath();c.moveTo(-17,0);c.lineTo(-22-flare,-7);c.lineTo(-22-flare,7);c.closePath();c.fill();c.shadowColor='#38ebfa';c.shadowBlur=28;c.fillStyle='#4df2e8';c.beginPath();c.moveTo(28,0);c.quadraticCurveTo(10,-22,-17,-16);c.lineTo(-8,-3);c.lineTo(-18,14);c.quadraticCurveTo(10,20,28,0);c.fill();c.shadowBlur=0;c.fillStyle='#e6ffff';c.beginPath();c.ellipse(2,0,9,7,0,0,7);c.fill();c.fillStyle='#197ab9';c.beginPath();c.arc(2,0,4.5,0,7);c.fill();c.restore();
 c.fillStyle='rgba(223,247,255,.75)';c.font='14px Cairo, sans-serif';c.textAlign='right';c.fillText('مغامرة تعليمية · حركة ودرجات ومستويات',w-20,h-17);
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


// Keep off-screen animation stopped to reduce mobile battery use.
function setGame(name){if(!['space','forecast'].includes(name))return;currentGame=name;for(const b of document.querySelectorAll('#v5GameTabs [data-v5-game]')){const on=b.dataset.v5Game===name;b.classList.toggle('is-on',on);b.setAttribute('aria-selected',String(on))}for(const el of document.querySelectorAll('[data-v5-game-panel]'))el.hidden=el.dataset.v5GamePanel!==name;if(name!=='space')pauseSpace(true)}
document.getElementById('v5GameTabs')?.addEventListener('click',e=>{const b=e.target.closest('[data-v5-game]');if(b)setGame(b.dataset.v5Game)});
document.addEventListener('planet-page',e=>{if(e.detail.page!=='games')pauseSpace(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseSpace(true)});

// Independent illustrated weather-forecast quiz, no geology-game dependencies.
import {QUESTIONS} from './questions-v6.js';
let selectedLevel='all',quiz=[],quizIndex=0,quizScore=0,quizAnswered=false;
const shuffled=arr=>arr.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(r=>r.x);
function resetQuiz(){const pool=selectedLevel==='all'?QUESTIONS:QUESTIONS.filter(x=>x.level===selectedLevel);quiz=shuffled(pool).slice(0,selectedLevel==='all'?18:Math.min(12,pool.length));quizIndex=0;quizScore=0;paintQuiz()}
function paintQuiz(){const d=quiz[quizIndex];$('v5ForecastScore').textContent=String(quizScore);$('v5ForecastAnswers').replaceChildren();$('v5ForecastFeedback').textContent='';$('v5ForecastNext').disabled=true;quizAnswered=false;
 if(!d){$('v5ForecastTopic').textContent='اكتمل التحدي';$('v5ForecastQuestion').textContent='النتيجة: '+quizScore+' / '+quiz.length*10+' نقطة';$('v5ForecastCount').textContent='اكتمل التحدي';$('v5ForecastFacts').replaceChildren();$('v6QuizSymbol').textContent='🏆';$('v5ForecastFeedback').textContent='يمكنك إعادة المحاولة أو تغيير المستوى.';return}
 $('v5ForecastTopic').textContent=d.tag;$('v5ForecastQuestion').textContent=d.question;$('v5ForecastCount').textContent=`السؤال ${quizIndex+1} من ${quiz.length}`;$('v6QuizSymbol').textContent=d.icon||'🌤️';$('v6QuizIllustration').dataset.level=d.level;
 $('v5ForecastFacts').replaceChildren(...(d.facts||[]).map(s=>{const span=document.createElement('span');span.textContent=s;return span}));
 d.answers.forEach((answer,i)=>{const b=document.createElement('button');b.type='button';b.textContent=answer;b.addEventListener('click',()=>answerQuiz(i));$('v5ForecastAnswers').append(b)});
 $('v5ForecastNext').textContent=quizIndex===quiz.length-1?'عرض النتيجة':'السؤال التالي';
}
function answerQuiz(choice){if(quizAnswered)return;const d=quiz[quizIndex];quizAnswered=true;const correct=choice===d.correct;if(correct)quizScore+=10;$('v5ForecastScore').textContent=String(quizScore);for(const [i,b] of [...$('v5ForecastAnswers').children].entries()){b.disabled=true;b.classList.toggle('correct',i===d.correct);b.classList.toggle('wrong',i===choice&&!correct)}
 const strong=document.createElement('strong');strong.textContent=correct?'إجابة صحيحة · +10 نقاط':'إجابة غير صحيحة';const info=document.createElement('p');info.textContent=d.why;$('v5ForecastFeedback').replaceChildren(strong,info);$('v5ForecastNext').disabled=false;
}
$('v5ForecastNext').addEventListener('click',()=>{quizIndex++;paintQuiz()});$('v5ForecastRestart').addEventListener('click',resetQuiz);
$('v6QuizLevels').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(!b)return;selectedLevel=b.dataset.level;for(const it of $('v6QuizLevels').querySelectorAll('button'))it.classList.toggle('is-on',it===b);resetQuiz()});
resetQuiz();
