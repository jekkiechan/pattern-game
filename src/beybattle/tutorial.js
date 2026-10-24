// Lightweight, finite demonstrations. No extra renderer or simulation is needed.
export const LESSONS = [
 {id:'dash',name:'Dash',symbol:'➤',title:'Close the gap.',copy:'Tap Dash to rush toward your rival.',practice:'Tap the highlighted Dash button.'},
 {id:'guard',name:'Guard',symbol:'◇',title:'Meet the rush.',copy:'When the rival rushes in, tap Guard.',practice:'Wait for “GUARD NOW”, then tap Guard.'},
 {id:'special',name:'Special',symbol:'✦',title:'Make it count.',copy:'Fill the gold meter. Tap Special once.',practice:'Your meter is full. Tap Special.'},
];

export function moveScene(step,player=0,rival=2){
 const lesson=LESSONS[step];
 return `<div class="move-scene move-${lesson.id}" aria-hidden="true">
  <div class="demo-arena"></div><div class="demo-path">${step===1?'←':'→'}</div>
  <div class="demo-blade demo-player"><span class="demo-label demo-you-label">YOU</span><span class="demo-shield">◇</span><span class="demo-wave"></span><img src="assets/blades/${player}.webp" alt="" width="96" height="80"></div>
  <div class="demo-blade demo-rival"><span class="demo-label demo-rival-label">RIVAL</span><img src="assets/blades/${rival}.webp" alt="" width="96" height="80"></div>
  <span class="demo-impact">${step===1?'◇':'✦'}</span>
  <div class="demo-energy"><span>ENERGY</span><i><b></b></i><span>✦</span></div>
 </div>`;
}

export class VisualTutorial {
 constructor(dialog){
  this.dialog=dialog;this.step=0;
  this.tabs=dialog.querySelector('#lesson-tabs');
  this.tabs.innerHTML=LESSONS.map((l,i)=>`<button data-lesson="${i}" aria-pressed="false"><span aria-hidden="true">${l.symbol}</span>${l.name}</button>`).join('');
  this.tabs.addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b)this.show(+b.dataset.lesson);});
  dialog.querySelector('#lesson-replay').onclick=()=>this.show(this.step);
  dialog.querySelector('#lesson-next').onclick=()=>this.show((this.step+1)%LESSONS.length);
 }
 show(step=0){
  this.step=step;const l=LESSONS[step];
  this.tabs.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));
  this.dialog.querySelector('#lesson-scene').innerHTML=moveScene(step);
  this.dialog.querySelector('#lesson-title').textContent=l.title;
  this.dialog.querySelector('#lesson-copy').textContent=l.copy;
  this.dialog.querySelector('#lesson-count').textContent=`${step+1} / 3`;
  this.dialog.querySelector('#lesson-next').textContent=step===2?'Back to Dash ↻':'Next move →';
 }
}
