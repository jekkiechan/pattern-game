let state='title',currentStage=0,player=null,platforms=[],collectStars=[],particles=[],trailParticles=[];
let camera=0,frameCount=0,starsCollected=0,starsTotal=0,paused=false,clearFlash=0,pendingStage=null;
let checkpoint=null,run=null,toastFrames=0,coachFrames=0,actionPress=false,dropping=false;
const keys={},held={left:false,right:false,drop:false};
let touchX=null,arenaPointer=null,storageAvailable=true,audioContext=null;
function readSave(){try{const v=JSON.parse(localStorage.getItem('climberSkybound')||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
const rawSave=readSave();
const progress={version:1,medals:Array.from({length:10},(_,i)=>Math.max(0,Math.min(7,Number(rawSave.medals?.[i])|0))),blade:BLADES.some(b=>b.id===rawSave.blade)?rawSave.blade:'comet',sound:rawSave.sound===true,reduced:typeof rawSave.reduced==='boolean'?rawSave.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
function completed(){let n=0;while(n<10&&(progress.medals[n]&1))n++;return n;}
let bestStage=completed();
function saveProgress(){try{localStorage.setItem('climberSkybound',JSON.stringify(progress));}catch{storageAvailable=false;$('save-note').textContent='Saving is unavailable. Your progress lasts for this visit.';$('save-note').classList.add('storage-notice');}}
function sound(kind){if(!progress.sound)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const now=audioContext.currentTime;const tones=kind==='clear'?[523,659,784]:kind==='star'?[740,988]:kind==='burst'?[260,520]:kind==='checkpoint'?[440,660]:[380];tones.forEach((f,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+i*.08);g.gain.setValueAtTime(.035,now+i*.08);g.gain.exponentialRampToValueAtTime(.001,now+i*.08+.16);o.connect(g);g.connect(audioContext.destination);o.start(now+i*.08);o.stop(now+i*.08+.17);});}catch{}}
function announce(text){$('game-status').textContent=text;}
function toast(text,frames=110){$('toast').textContent=text;$('toast').hidden=false;toastFrames=frames;announce(text);}
function coach(text,frames=360){$('coach').textContent=text;$('coach').hidden=false;coachFrames=frames;}
function settingsUI(){document.body.classList.toggle('reduced-motion',progress.reduced);$('sound-button').textContent=progress.sound?'Sound on':'Sound off';$('sound-button').setAttribute('aria-pressed',progress.sound);$('sound-button').setAttribute('aria-label',progress.sound?'Mute sound':'Enable sound');$('motion-button').textContent=progress.reduced?'Motion reduced':'Motion on';$('motion-button').setAttribute('aria-pressed',progress.reduced);}
$('sound-button').onclick=()=>{progress.sound=!progress.sound;saveProgress();settingsUI();sound('star');};
$('motion-button').onclick=()=>{progress.reduced=!progress.reduced;saveProgress();settingsUI();};
function renderHome(){
 bestStage=completed();const rank=rankFor(bestStage);$('rank-name').textContent=rank.name;
 const count=progress.medals.reduce((a,m)=>a+Boolean(m&1)+Boolean(m&2)+Boolean(m&4),0);$('medal-total').textContent=count+' / 30 ✦';
 $('continue-button').innerHTML=(bestStage===0?'LET’S CLIMB':bestStage===10?'CHASE ALL THE MEDALS':'CONTINUE · STAGE '+(bestStage+1))+' <span>→</span>';
 $('tier-track').innerHTML=CLIMB_TIERS.map(t=>`<div class="tier-step ${bestStage>=t.at?'earned':''}"><span>${t.name}</span><small>${t.at===0?'START':t.at+' clears'}</small></div>`).join('');
 $('stage-map').innerHTML=STAGES.map((s,i)=>{const w=WORLDS[s.world],m=progress.medals[i];return `<button class="stage-card ${i===bestStage?'next':''}" data-stage="${i}" style="--world:${w.color};--accent:${w.accent}" ${i>bestStage?'disabled':''} aria-label="Stage ${i+1}, ${s.name}${i>bestStage?', locked':', '+[1,2,4].filter(b=>m&b).length+' of 3 medals'}"><span class="stage-no">${String(i+1).padStart(2,'0')}<span>${i>bestStage?'LOCKED':i===bestStage?'UP NEXT':'REPLAY'}</span></span><span class="stage-symbol">${w.symbol}</span><b>${s.name}</b><small>${w.name}</small><span class="medal-row" aria-hidden="true">${[1,2,4].map(b=>m&b?'◆':'◇').join('')}</span></button>`;}).join('');
 $('stage-map').querySelectorAll('button').forEach(el=>el.onclick=()=>startStage(Number(el.dataset.stage)));
 $('blade-choices').innerHTML=BLADES.map(b=>`<button class="blade-choice" data-blade="${b.id}" aria-pressed="${progress.blade===b.id}"><span>${b.symbol}</span><b>${b.name}</b><small>${b.tip}</small></button>`).join('');
 $('blade-choices').querySelectorAll('button').forEach(el=>el.onclick=()=>{progress.blade=el.dataset.blade;saveProgress();renderHome();});
}
function clearInput(){Object.keys(keys).forEach(k=>keys[k]=false);Object.keys(held).forEach(k=>held[k]=false);document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));touchX=null;arenaPointer=null;dropping=false;actionPress=false;}
function pauseClimber(value){if(state!=='playing')return;paused=value;clearInput();$('climber-pause').textContent=paused?'Resume':'Pause';if(paused){if(!$('pause-dialog').open)$('pause-dialog').showModal();}else{if($('pause-dialog').open)$('pause-dialog').close();lastTick=0;accumulator=0;canvas.focus({preventScroll:true});}}
function showHome(){state='title';paused=false;clearInput();$('pause-dialog').close();$('result-dialog').close();$('home-screen').hidden=false;$('play-screen').hidden=true;$('climber-pause').hidden=true;document.body.classList.remove('in-game');renderHome();$('continue-button').focus({preventScroll:true});}
$('continue-button').onclick=()=>startStage(Math.min(bestStage,9));
$('climber-pause').onclick=()=>pauseClimber(!paused);$('climber-paused').onclick=()=>pauseClimber(false);
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();pauseClimber(false);});
$('result-dialog').addEventListener('cancel',e=>{e.preventDefault();showHome();});
$('map-button').onclick=showHome;$('pause-map').onclick=showHome;$('result-map').onclick=showHome;
$('restart-button').onclick=()=>startStage(currentStage);$('replay-button').onclick=()=>startStage(currentStage);
$('next-button').onclick=()=>currentStage<9?startStage(currentStage+1):showHome();
$('burst-button').onclick=()=>{if(!paused&&state==='playing')actionPress=true;};
for(const [id,key] of [['left-button','left'],['right-button','right'],['drop-button','drop']]){const b=$(id);b.onpointerdown=e=>{if(paused||state!=='playing')return;e.preventDefault();held[key]=true;b.classList.add('held');b.setPointerCapture(e.pointerId);};const release=()=>{held[key]=false;b.classList.remove('held');};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;}
canvas.onpointerdown=e=>{if(paused||state!=='playing')return;e.preventDefault();arenaPointer=e.pointerId;touchX=e.clientX;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});};
canvas.onpointermove=e=>{if(e.pointerId===arenaPointer)touchX=e.clientX;};
const endArena=()=>{touchX=null;arenaPointer=null;};canvas.onpointerup=endArena;canvas.onpointercancel=endArena;canvas.onlostpointercapture=endArena;
document.addEventListener('keydown',e=>{
 const ui=e.target.closest('button,a,input,select');
 if(e.code==='Escape'||e.code==='KeyP'){if(state==='playing'){e.preventDefault();if(!e.repeat)pauseClimber(!paused);}return;}
 if(state!=='playing'||paused)return;
 if((e.code==='Space'||e.code==='Enter')&&ui)return;
 if(['ArrowLeft','ArrowRight','ArrowDown','KeyA','KeyD','KeyS','Space'].includes(e.code))e.preventDefault();
 keys[e.code]=true;if(e.code==='Space'&&!e.repeat)actionPress=true;
});
document.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('blur',()=>{clearInput();if(state==='playing')pauseClimber(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pauseClimber(true);});
settingsUI();renderHome();
