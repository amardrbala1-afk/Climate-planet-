/** Climate Planet V10 — supplementary astronomy museum, no fabricated ephemerides. */
const $ = id => document.getElementById(id);
const safe = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bodies = [
 {id:'sun',name:'الشمس',diameter:1392700,color:'#ffcf68',type:'نجم',gravity:274},
 {id:'jupiter',name:'المشتري',diameter:139820,color:'#c9a17d',type:'عملاق غازي',gravity:24.79},
 {id:'saturn',name:'زحل',diameter:116460,color:'#d8c7a8',type:'عملاق غازي',gravity:10.44},
 {id:'uranus',name:'أورانوس',diameter:50724,color:'#83d8e0',type:'عملاق جليدي',gravity:8.69},
 {id:'neptune',name:'نبتون',diameter:49244,color:'#6d8bff',type:'عملاق جليدي',gravity:11.15},
 {id:'earth',name:'الأرض',diameter:12742,color:'#51a8dd',type:'كوكب صخري',gravity:9.81},
 {id:'venus',name:'الزهرة',diameter:12104,color:'#e1bd87',type:'كوكب صخري',gravity:8.87},
 {id:'mars',name:'المريخ',diameter:6779,color:'#d37b5a',type:'كوكب صخري',gravity:3.71},
 {id:'mercury',name:'عطارد',diameter:4879,color:'#adadad',type:'كوكب صخري',gravity:3.70},
 {id:'moon',name:'القمر',diameter:3475,color:'#c7c8d0',type:'قمر طبيعي',gravity:1.62},
 {id:'pluto',name:'بلوتو',diameter:2377,color:'#d2b2a0',type:'كوكب قزم',gravity:.62}
];
function initComparison(){
 const one=$('v10CompareA'),two=$('v10CompareB');if(!one||!two)return;
 const options=bodies.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');one.innerHTML=options;two.innerHTML=options;
 one.value='earth';two.value='jupiter';
 function render(){const a=bodies.find(x=>x.id===one.value),b=bodies.find(x=>x.id===two.value);if(!a||!b)return;
  const biggest=Math.max(a.diameter,b.diameter);const circle=x=>{const d=Math.max(14,Math.round(160*Math.sqrt(x.diameter/biggest)));return `<div class="v10-bodyitem"><div class="v10-orb" style="--orb:${safe(x.color)};width:${d}px;height:${d}px"></div><strong>${x.name}</strong><span>${x.diameter.toLocaleString('en-US')} كم</span></div>`};
  const ratio=(Math.max(a.diameter,b.diameter)/Math.min(a.diameter,b.diameter));
  $('v10SizeCompare').innerHTML=`<div class="v10-orb-comparison">${circle(a)}${circle(b)}</div><div class="v10-compare-result"><b>نسبة القطر: ${ratio.toLocaleString('ar',{maximumFractionDigits:1})} : 1</b><p>الجرم الأكبر قطرًا هو ${a.diameter>b.diameter?a.name:b.name}. الأقطار تقريبية، والأحجام الظاهرة مصغرة وفق مقياس بصري غير خطّي لتسهيل المشاهدة.</p><div class="v10-gravity-row"><span>${a.name}: جاذبية سطحية ${a.gravity} م/ث²</span><span>${b.name}: ${b.gravity} م/ث²</span></div></div>`;
 }
 one.addEventListener('change',render);two.addEventListener('change',render);render();
}
const guidedStops=[
 {id:'earth',name:'الأرض',headline:'بداية الرحلة',body:'نبدأ من الكوكب الثالث حيث الغلاف الجوي والمحيطات والحياة المعروفة.'},
 {id:'moon',name:'القمر',headline:'الجار الأقرب',body:'القمر الطبيعي للأرض؛ تتغير أطواره وفق مواضعه النسبية من الشمس والأرض.'},
 {id:'mars',name:'المريخ',headline:'عالم جيولوجي',body:'نقترب من كوكب يحمل دلائل على مياه سائلة قديمة على سطحه.'},
 {id:'jupiter',name:'المشتري',headline:'العملاق الغازي',body:'أكبر الكواكب، وتظهر أحزمته السحابية والبقعة الحمراء الشهيرة.'},
 {id:'saturn',name:'زحل',headline:'عالم الحلقات',body:'حلقات جليدية وصخرية تدور في نظام معقد حول كوكب غازي ضخم.'},
 {id:'neptune',name:'نبتون',headline:'الحد البعيد',body:'نصل إلى أبعد الكواكب الثمانية، عالم جليدي ذو رياح قوية.'}
];
let tourStep=0;
function initGuidedTour(){const view=$('v10TourStage');if(!view)return;function update(){const stop=guidedStops[tourStep];view.innerHTML=`<span>${tourStep+1} / ${guidedStops.length} · ${safe(stop.headline)}</span><h4>${safe(stop.name)}</h4><p>${safe(stop.body)}</p>`;$('v10TourPrev').disabled=tourStep===0;$('v10TourNext').textContent=tourStep===guidedStops.length-1?'إعادة الجولة':'المحطة التالية';window.ClimatePlanetSpace?.selectById(stop.id)}$('v10TourPrev').onclick=()=>{tourStep=Math.max(0,tourStep-1);update()};$('v10TourNext').onclick=()=>{tourStep=(tourStep+1)%guidedStops.length;update()};update()}
const missionRecords=[
 ['1977','انطلاق فوياجر','بدأت مهمتا فوياجر استكشاف الكواكب الخارجية، ثم واصل المسباران رحلتهما بعيدًا عن الشمس.'],
 ['1990','هابل في المدار','انطلق تلسكوب هابل لدراسة الكون خارج تأثير تشويش الغلاف الجوي الأرضي.'],
 ['1997','إطلاق كاسيني','بدأت رحلة طويلة إلى زحل انتهت بدراسة حلقاته وأقماره على مدى سنوات.'],
 ['2004','وصول كاسيني إلى زحل','دخل المسبار مدار زحل، وتبعته مهمة هويغنز إلى قمر تيتان.'],
 ['2015','التحليق قرب بلوتو','أرسلت نيو هورايزنز أول صور مفصلة عن قرب للكوكب القزم.'],
 ['2021','هبوط برسيفيرانس','هبطت العربة في فوهة جيزيرو لدراسة تاريخ المياه والصخور على المريخ.'],
 ['2022','أرتميس 1','رحلة غير مأهولة لمركبة أوريون حول القمر لاختبار الأنظمة.'],
 ['2023','عودة عينات بينو','وصلت عينات أوسايرس–ريكس إلى الأرض للتحليل المخبري.']
];
function initMissions(){const el=$('v10MissionTrail');if(!el)return;el.innerHTML=missionRecords.map(([year,title,note])=>`<article><time>${year}</time><div><h3>${safe(title)}</h3><p>${safe(note)}</p></div></article>`).join('');$('v10LoadNasaEyes')?.addEventListener('click',()=>{const parent=$('v10EyesFrame');if(parent.querySelector('iframe'))return;parent.innerHTML='<iframe title="NASA Eyes on the Solar System" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen src="https://eyes.nasa.gov/apps/solar-system/"></iframe><p class="minor">إذا لم يسمح موقع NASA بعرض التجربة داخل إطار، افتح <a target="_blank" rel="noopener" href="https://eyes.nasa.gov/apps/solar-system/">NASA Eyes في نافذة مستقلة</a>.</p>'})}
function skyPhase(date){
 // Simple synodic phase approximation; not astrometric ephemeris.
 const newMoonEpoch=Date.UTC(2000,0,6,18,14),period=29.530588853*86400000;
 const value=((Date.parse(date+'T12:00:00Z')-newMoonEpoch)%period+period)%period/period;
 const lit=(1-Math.cos(2*Math.PI*value))/2;
 const label=value<.035||value>.965?'محاق':value<.215?'هلال متزايد':value<.285?'تربيع أول':value<.465?'أحدب متزايد':value<.535?'بدر':value<.715?'أحدب متناقص':value<.785?'تربيع أخير':'هلال متناقص';
 return {value,lit,label};
}
async function renderSky(){const input=$('v10SkyDate');const date=input?.value;const view=$('v10SkyView');if(!date||!view)return;const phase=skyPhase(date);
 const crescent=phase.value<.5?'متزايد':'متناقص';
 view.innerHTML=`<div class="v10-moon-disc" style="--moon-angle:${Math.round(phase.value*360)}deg"><div class="v10-moon-inner">☾</div></div><div class="v10-sky-data"><h3>${phase.label}</h3><p>الإضاءة التقريبية: <b>${Math.round(phase.lit*100)}%</b> · ${crescent}</p><p>الأرقام نموذج مبسط للدورة القمرية، وليست قياسات فلكية دقيقة لموقع القمر أو وقت ظهوره.</p><div id="v10SunClock">حساب وقت الشروق والغروب من بيانات الطقس…</div><small>رؤية الكواكب والنجوم تتطلب حسابات للموقع والوقت والظروف الجوية، ولا تُعرض هنا كقيم مؤكدة.</small></div>`;
 const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jerusalem'});const ahead=(Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000;
 if(ahead<0||ahead>6){$('v10SunClock').textContent='الشروق والغروب: البيانات اليومية متاحة للأيام السبعة القادمة فقط.';return}
 try{const url='https://api.open-meteo.com/v1/forecast?latitude=31.78&longitude=35.23&daily=sunrise,sunset&timezone=Asia%2FJerusalem&forecast_days=7';const resp=await fetch(url,{signal:AbortSignal.timeout(9500)});if(!resp.ok)throw Error('Weather service');const data=await resp.json();if(input.value!==date)return;const i=data.daily?.time?.indexOf(date)??-1;const s=i>=0?data.daily.sunrise?.[i]:null,e=i>=0?data.daily.sunset?.[i]:null;$('v10SunClock').textContent=s&&e?`الشروق: ${s.slice(11,16)} · الغروب: ${e.slice(11,16)} · المصدر: Open-Meteo`:'لا تتوفر بيانات شروق وغروب للتاريخ المختار.'}catch{$('v10SunClock').textContent='تعذر جلب الشروق والغروب حاليًا. تظهر بيانات القمر التقديرية فقط.'}
}
function initSky(){const field=$('v10SkyDate');if(!field)return;field.value=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jerusalem'});field.addEventListener('change',renderSky);renderSky()}
const questions=[
 ['أي كوكب يحمل أشهر منظومة حلقات مرئية؟',['الزهرة','زحل','المريخ'],1,'حلقات زحل مكونة من جسيمات جليدية وصخرية.'],
 ['ما أكبر أقمار المجموعة الشمسية؟',['غانيميد','القمر','تيتان'],0,'غانيميد التابع للمشتري هو الأكبر من حيث القطر.'],
 ['أين يقع سديم الجبار؟',['في كوكبة الجبار','قرب المريخ','حول نبتون'],0,'سديم الجبار منطقة تشكل نجوم في كوكبة الجبار.'],
 ['ما وظيفة تلسكوب جيمس ويب الأساسية؟',['استكشاف قاع البحر','رصد الكون بالأشعة تحت الحمراء','قياس مطر الأرض'],1,'يرصد ويب الأشعة تحت الحمراء لدراسة النجوم والمجرات والأغلفة.'],
 ['أي مهمة زارت بلوتو عن قرب سنة 2015؟',['فوياجر 1','نيو هورايزنز','جونو'],1,'حلقت نيو هورايزنز بجوار بلوتو عام 2015.'],
 ['أي جرم تُرصد فيه براكين كثيرة نشطة؟',['آيو','تريتون','ميماس'],0,'تُنشط قوى المد والجزر باطن آيو.'],
 ['ما المجرة التي ينتمي إليها النظام الشمسي؟',['المرأة المسلسلة','درب التبانة','مجرة المثلث'],1,'النظام الشمسي جزء من قرص درب التبانة.'],
 ['لماذا لا يعني وجود كوكب في المنطقة الصالحة نظريًا وجود حياة؟',['لأنها تحدد المسافة فقط تقريبًا','لأن الكواكب لا تدور','لأن الأقمار لا وجود لها'],0,'الحياة تحتاج عوامل أخرى، بما فيها خصائص الغلاف الجوي والسطح.'],
 ['ما المقصود بالكوكب القزم؟',['نجم صغير','جسم يدور حول الشمس ولم يخلُ محيط مداره','قمر يدور حول الأرض'],1,'هذا أحد شروط التمييز في تعريف الاتحاد الفلكي الدولي.'],
 ['أي نجم هو أقرب نجم معروف للشمس؟',['سهيل','منكب الجوزاء','بروكسيما قنطورس'],2,'بروكسيما قنطورس أقرب نجم معروف إلى الشمس.'],
 ['ما الكوكب الذي هبطت عليه عربة برسيفيرانس؟',['المريخ','الزهرة','عطارد'],0,'وصلت برسيفيرانس إلى المريخ سنة 2021.'],
 ['ما سبب ظهور سديم رأس الحصان داكنًا؟',['غبار يحجب الضوء','لأنه ثقب أسود','لا يوجد فيه غاز'],0,'سحابة الغبار المعتمة تحجب ضوء الخلفية.']
];
let qindex=0,correct=0,answered=false;
function renderQuiz(){if(qindex>=questions.length){$('v10QuizState').textContent=`النتيجة: ${correct} / ${questions.length}`;$('v10QuizQuestion').textContent='انتهى الاختبار الفلكي';$('v10QuizOptions').innerHTML='';$('v10QuizFeedback').textContent='يمكن إعادة التجربة مع مراجعة الملفات العلمية في الموسوعة.';$('v10QuizNext').textContent='بدء اختبار جديد';return}
 const [question,answers]=questions[qindex];$('v10QuizState').textContent=`سؤال ${qindex+1} من ${questions.length} · ${correct} إجابة صحيحة`;$('v10QuizQuestion').textContent=question;$('v10QuizFeedback').textContent='';$('v10QuizOptions').innerHTML=answers.map((s,i)=>`<button type="button" data-quiz-answer="${i}">${safe(s)}</button>`).join('');answered=false;$('v10QuizNext').textContent='السؤال التالي';}
function initQuiz(){if(!$('v10QuizQuestion'))return;renderQuiz();$('v10QuizOptions').addEventListener('click',e=>{const btn=e.target.closest('[data-quiz-answer]');if(!btn||answered)return;answered=true;const choice=Number(btn.dataset.quizAnswer),[,,right,why]=questions[qindex];if(choice===right)correct++;$('v10QuizOptions').querySelectorAll('button').forEach(x=>{x.disabled=true;x.classList.toggle('correct',Number(x.dataset.quizAnswer)===right);x.classList.toggle('incorrect',x===btn&&choice!==right)});$('v10QuizFeedback').textContent=(choice===right?'صحيح. ':'إجابة غير صحيحة. ')+why});$('v10QuizNext').addEventListener('click',()=>{if(qindex>=questions.length){qindex=0;correct=0}else if(answered)qindex++;renderQuiz()});}
function initTabs(){const tabs=$('v10SpaceTabs');if(!tabs)return;tabs.addEventListener('click',e=>{const button=e.target.closest('[data-v10-panel]');if(!button)return;tabs.querySelectorAll('button').forEach(x=>{const on=x===button;x.classList.toggle('is-active',on);x.setAttribute('aria-selected',String(on))});document.querySelectorAll('[data-v10-panel-body]').forEach(x=>{const on=x.dataset.v10PanelBody===button.dataset.v10Panel;x.classList.toggle('is-active',on);x.hidden=!on})})}
initTabs();initComparison();initMissions();initSky();initQuiz();initGuidedTour();
