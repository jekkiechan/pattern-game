import {ROSTER,ROLES,SPECIALS,ARENAS,STARTERS,BLADE_TIERS,abilityDescription} from './roster.js';
import {LEAGUE,readLeague,unlockedTier,totalStars,challengeGoals,awardTier,addStats} from './progression.js';
import {Match,STEP} from './engine.js';
import {Display} from './renderer.js';
import {Sound} from './audio.js';
import {CanvasDisplay} from './fallback.js';
import {TrainerJourney} from './journey-ui.js';
import {CHAPTERS} from './journey.js';
const $=id=>document.getElementById(id);
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
const saved=read('beybattleLeague',{}),old=read('beybattleSave',{}),oldSettings=read('patternSettings',{});
const options={sound:saved.sound??oldSettings.sound??true,motion:saved.motion??!matchMedia('(prefers-reduced-motion: reduce)').matches,
 low:saved.low??false,difficulty:['rookie','challenger','expert'].includes(saved.difficulty)?saved.difficulty:'rookie',
 player:Number.isInteger(saved.player)&&ROSTER[saved.player]?saved.player:0,arena:ARENAS.some(a=>a.id===saved.arena)?saved.arena:'stadium',
 wins:Number(saved.wins)||0,trophies:Math.max(Number(saved.trophies)||0,Number(old.wins)||0),league:readLeague(saved.league),trained:!!saved.trained};
function save(){try{localStorage.setItem('beybattleLeague',JSON.stringify(options));}catch{}}
const sound=new Sound(options.sound);
let display;
try{display=new Display($('scene'),{low:options.low,motion:options.motion});}catch(error){
 const fresh=document.createElement('canvas');fresh.id='scene';fresh.setAttribute('aria-label','Blade preview');$('scene').replaceWith(fresh);
 display=new CanvasDisplay(fresh,{low:options.low,motion:options.motion});
 console.info('Using the Canvas compatibility renderer.');
}
let screen='home',mode='duel',filter='starters',tierFilter='all',selected=options.player,arena=options.arena,rival=1,leagueTier=unlockedTier(options.league);
let session=null,match=null,paused=false,acc=0,last=0,hudClock=0,launchClock=0,noticeTime=0,finishDelay=0,finishHandled=false,practiceStep=0;
let pointerId=null,inspectX=0,keys=new Set(),practiceReturn='duel';
const journey=new TrainerJourney($('journey-screen'),{battle:startJourneyBattle,home});
function openJourney(){closeDialogs();paused=false;match=null;session=null;mode='journey';show('journey');}
function startJourneyBattle(chapter,starter){
 const c=CHAPTERS[chapter];mode='journey';selected=starter;arena=c.arena;rival=c.rival;sound.start();
 session={mode,player:starter,rivals:[rival],stage:0,score:[0,0],round:1,won:false,duelComplete:false,stats:{},chapter,arena,difficulty:c.difficulty};
 newRound();
}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2700);}
function portrait(id){return `assets/blades/${id}.webp`;}
function chooseRival(){if(mode==='league'){rival=LEAGUE[leagueTier].rival;}else{const pool=ROSTER.filter(c=>c.id!==selected&&c.id!==rival);rival=pool[Math.floor(Math.random()*pool.length)].id;}updateRival();}
function updateRival(){if(rival===selected&&mode!=='league')rival=(selected+1)%ROSTER.length;$('rival-name').textContent=ROSTER[rival].name;$('rival-portrait').src=portrait(rival);$('rival-caption').textContent=mode==='league'?LEAGUE[leagueTier].name.toUpperCase()+' TIER RIVAL':mode==='championship'?'FIRST CHALLENGER':'YOUR RIVAL';}
function show(next){
 screen=next;document.querySelectorAll('main>.screen').forEach(el=>el.hidden=el.id!==next+'-screen');
 document.body.classList.toggle('in-battle',next==='battle');keys.clear();cancelPointer();
 if(next==='home'){$('home-view').append($('scene'));display.select(selected);updateFeatured();updateRecord();}
 if(next==='league')renderLeague();
 if(next==='journey')journey.open();
 if(next==='setup'){$('setup-view').append($('scene'));display.select(selected);renderCollection();updateInspector();updateRival();updateSettings();}
 if(next==='battle'){$('battle-view').prepend($('scene'));display.battle(match);updateHUD();}
 display.resize();acc=0;last=performance.now();window.scrollTo(0,0);
}
function updateRecord(){
 const frontier=unlockedTier(options.league),complete=options.league.medals.every(Boolean);
 $('record-line').textContent=options.wins||options.trophies?`${options.wins} duel wins · ${options.trophies} trophies · ${totalStars(options.league)} league stars`:'Progress saves on this device. Every blade is ready to play.';
 $('league-preview-rank').textContent=complete?'GOD TIER CONQUERED':LEAGUE[frontier].name.toUpperCase()+' TIER';
 $('league-preview-stars').textContent=totalStars(options.league)+' / 27 ★';
 $('league-preview-fill').style.width=(totalStars(options.league)/27*100)+'%';
 $('league-preview-copy').textContent=complete?'Replay your favorite rivals and collect every skill star.':`${LEAGUE[frontier].theme} · ${frontier+1} of 9 tiers`;
 $('play-league').innerHTML=(totalStars(options.league)?'CONTINUE LEAGUE RUN':'START LEAGUE RUN')+' <span>→</span>';
}
function renderLeague(){
 const frontier=unlockedTier(options.league),stars=totalStars(options.league);
 $('league-stars').textContent=stars+' / 27';
 $('league-map').innerHTML=LEAGUE.map((tier,i)=>{const medals=options.league.medals[i],locked=i>frontier;return `<button class="league-node ${i===frontier?'current':''} ${medals?'complete':''}" data-tier="${i}" ${locked?'disabled':''} style="--tier:${BLADE_TIERS[tier.name.toUpperCase()].color}" aria-label="${tier.name} tier. ${locked?'Win the previous tier to unlock':medals?medals+' of 3 stars. Replay':'Ready to play'}"><span class="tier-node-top"><b>${String(i+1).padStart(2,'0')}</b><span>${locked?'LOCKED':medals?'★'.repeat(medals)+'☆'.repeat(3-medals):'UP NEXT'}</span></span><img src="${portrait(tier.rival)}" alt="" loading="lazy"><strong>${tier.name}</strong><span class="tier-theme">${tier.theme}</span><small>${ROSTER[tier.rival].name}</small><span class="tier-venue">${ARENAS.find(a=>a.id===tier.arena).name}</span><span class="tier-node-play">${locked?'Win '+LEAGUE[i-1].name:medals?'REPLAY CHALLENGE ↻':'ENTER THIS TIER →'}</span></button>`;}).join('');
 $('league-summary').textContent=options.league.medals.every(Boolean)?'All nine tiers conquered. Chase the remaining skill stars, one great move at a time.':'Win a duel to unlock the next tier. Two bonus skill stars reward clever play. Your best result stays saved.';
}
function updateFeatured(){const c=ROSTER[selected];$('featured-name').textContent=c.name;$('featured-role').textContent=ROLES[c.role].label.toUpperCase();$('featured-role').style.color=ROLES[c.role].color;document.querySelectorAll('#featured-switches button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.id===selected));}
function setup(nextMode){
 mode=nextMode;session=null;match=null;paused=false;closeDialogs();arena=mode==='league'?LEAGUE[leagueTier].arena:options.arena;
 $('setup-mode').textContent=mode==='league'?LEAGUE[leagueTier].name.toUpperCase()+' TIER / LOADOUT':nextMode.toUpperCase()+' / LOADOUT';
 $('change-rival').hidden=['championship','league'].includes(mode);$('match-settings').hidden=mode==='league';$('league-context').hidden=mode!=='league';
 if(mode==='league'){const tier=LEAGUE[leagueTier];$('league-context-title').textContent=`${leagueTier+1} / 9 · ${tier.theme}`;$('league-context-copy').textContent=tier.tip;$('league-goals').innerHTML=challengeGoals(leagueTier).map(g=>`<span>☆ ${g.label}</span>`).join('');}
 $('start-match').innerHTML=mode==='practice'?'START PRACTICE <span>→</span>':mode==='championship'?'VIEW YOUR BRACKET <span>→</span>':mode==='league'?'CHALLENGE '+LEAGUE[leagueTier].name.toUpperCase()+' <span>→</span>':'ENTER STADIUM <span>→</span>';chooseRival();show('setup');
}
function updateInspector(){
 const c=ROSTER[selected],role=ROLES[c.role];$('blade-name').textContent=c.name;$('blade-role').textContent=role.label.toUpperCase();$('blade-role').style.color=role.color;$('blade-number').textContent='NO. '+String(c.id+1).padStart(3,'0');$('blade-desc').textContent=c.description;
 $('blade-stats').innerHTML=role.stats.map((n,i)=>`<div aria-label="${['Attack','Defense','Endurance'][i]} ${n} out of 5"><span>${['ATTACK','DEFENSE','ENDURANCE'][i]}</span><div class="stat-ticks">${Array.from({length:5},(_,j)=>`<i class="${j<n?'on':''}"></i>`).join('')}</div></div>`).join('');
 $('special-name').textContent=c.specialName;$('special-desc').textContent=abilityDescription(c);$('role-tip').textContent=role.tip;
 $('blade-tier').textContent=BLADE_TIERS[c.tier].label.toUpperCase()+' TIER';$('blade-tier').style.setProperty('--tier',BLADE_TIERS[c.tier].color);
 options.player=selected;save();
}
function selectBlade(id){selected=id;display.select(id);updateInspector();updateRival();document.querySelectorAll('.blade-card').forEach(c=>c.setAttribute('aria-pressed',+c.dataset.id===id));}
const filters=[['starters','Starter picks'],['all','All 33'],['attack','Attack'],['defense','Defense'],['stamina','Stamina'],['balance','Balance']];
function renderCollection(){
 $('blade-filters').innerHTML=filters.map(([key,label])=>`<button data-filter="${key}" aria-pressed="${filter===key}">${label}</button>`).join('');
 const query=$('blade-search').value.trim().toLowerCase();const cards=ROSTER.filter(c=>(query?true:filter==='all'||filter==='starters'&&STARTERS.includes(c.id)||c.role===filter)&&(tierFilter==='all'||c.tier===tierFilter)&&(!query||c.name.toLowerCase().includes(query)||c.role.includes(query)||c.tier.toLowerCase().includes(query)));
 $('blade-grid').innerHTML=cards.map(c=>`<button class="blade-card" data-id="${c.id}" aria-pressed="${selected===c.id}" aria-label="${c.name}, ${ROLES[c.role].label}, ${BLADE_TIERS[c.tier].label} tier"><img src="${portrait(c.id)}" alt="" width="128" height="96" loading="lazy" decoding="async"><b>${c.name}</b><span>${ROLES[c.role].label.toUpperCase()}</span><small class="tier-badge" style="--tier:${BLADE_TIERS[c.tier].color}">${BLADE_TIERS[c.tier].label.toUpperCase()}</small></button>`).join('');
 $('empty-search').hidden=cards.length>0;
}
function updateSettings(){
 const desc={rookie:'Longer warnings and a forgiving rival. A good place to learn.',challenger:'A reactive rival with the same stats and cooldowns as you.',expert:'A quicker rival that guards more often. No extra damage or health.'};
 document.querySelectorAll('[data-difficulty]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.difficulty===options.difficulty));$('difficulty-desc').textContent=desc[options.difficulty];
 $('arena-options').innerHTML=ARENAS.map(a=>`<button class="arena-option" data-arena="${a.id}" aria-pressed="${arena===a.id}"><i style="--arena-color:${a.color}"></i>${a.name}</button>`).join('');
 const ar=ARENAS.find(a=>a.id===arena);$('arena-desc').textContent=ar.description;$('settings-summary').textContent=ar.name+' · '+options.difficulty[0].toUpperCase()+options.difficulty.slice(1);if(mode!=='league')options.arena=arena;save();
}
function startSession(){
 sound.start();session={mode,player:selected,rivals:[rival],stage:0,score:[0,0],round:1,won:false,duelComplete:false,stats:{},tier:leagueTier,arena,difficulty:mode==='league'?LEAGUE[leagueTier].difficulty:options.difficulty};
 if(mode==='championship'){
  const pool=ROSTER.filter(c=>c.id!==selected);session.rivals=[];
  for(let i=0;i<3;i++){const at=Math.floor(Math.random()*pool.length);session.rivals.push(pool.splice(at,1)[0].id);}
  showBracket();
 }else newRound();
}
function newRound(){
 session.duelComplete=false;session.won=false;
 paused=false;closeDialogs();match=new Match(session.player,session.rivals[session.stage],{seed:Math.floor(Math.random()*1e8),arena:session.arena,difficulty:session.difficulty,practice:mode==='practice'});
 finishHandled=false;finishDelay=0;launchClock=0;practiceStep=0;$('launch-panel').hidden=false;$('coach').hidden=true;$('battle-announcement').textContent='';$('rival-warning').hidden=true;
 ['dash','guard','special'].forEach(name=>$(name+'-button').classList.remove('coach-focus'));
 $('match-label').textContent=mode==='practice'?'PRACTICE · NO LOSING':`${mode==='journey'?CHAPTERS[session.chapter].place:mode==='league'?LEAGUE[session.tier].name.toUpperCase()+' TIER':mode==='championship'?`CHAMPIONSHIP ${session.stage+1}/3`:'DUEL'} · ROUND ${session.round}`;
 $('battle-objective').hidden=!['league','journey'].includes(mode);$('practice-tip').hidden=mode==='practice'||mode==='journey'||options.trained;
 if(mode==='journey')$('battle-objective').textContent=`${CHAPTERS[session.chapter].objective} Dash · Q / Guard · E / Special · Space`;
 $('arena-label').textContent=ARENAS.find(a=>a.id===arena).name.toUpperCase();show('battle');
}
function launch(auto=false){if(screen!=='battle'||match?.state!=='ready'||paused)return;sound.start();const phase=(Math.sin(launchClock*2.7)+1)/2;const quality=auto?.5:1-Math.abs(phase-.5)*2;match.launch(quality);$('launch-panel').hidden=true;
 announce(auto?'LET IT RIP!':quality>=.8?'CLEAN LAUNCH! +14 ENERGY':'LET IT RIP!',1.2);if(mode==='practice'){$('coach').hidden=false;coach();}}
function announce(text,seconds=1.4){$('battle-announcement').textContent=text;noticeTime=seconds;}
function action(type){if(screen!=='battle'||!match||paused||match.state!=='playing')return;sound.start();
 if(type==='dash')match.dash(0,match.blades[0].steer);if(type==='guard')match.guard(0);if(type==='special')match.special(0);updateHUD();
}
function coach(){
 const b=match.blades[0];
 if(practiceStep===0&&b.stats.dashes>0){practiceStep=1;toast('Nice dash. Now watch for the orange rush warning.');}
 if(practiceStep===1&&b.stats.guards>0){practiceStep=2;b.energy=100;toast('Blocked! Your special is ready.');}
 if(practiceStep===2&&b.stats.specials>0){practiceStep=3;finishDelay=.9;finishHandled=true;announce('YOU’VE GOT THIS!',.9);return;}
 const steps=[['Dash into your rival.','Tap Dash. Your blade aims at your rival automatically.'],['Guard the incoming rush.','Wait for “GUARD NOW”, then tap Guard to block the hit.'],['Unleash your signature move.','Tap the gold Special button. One tap is all it takes.']];
 if(practiceStep<3){$('coach-progress').textContent=`0${practiceStep+1} OF 03`;$('coach-title').textContent=steps[practiceStep][0];$('coach-copy').textContent=steps[practiceStep][1];}
 ['dash','guard','special'].forEach((name,i)=>$(name+'-button').classList.toggle('coach-focus',i===practiceStep));
}
function updateHUD(){
 if(!match)return;const [a,b]=match.blades;
 $('player-name').textContent=a.cfg.name;$('opponent-name').textContent=b.cfg.name;
 [a,b].forEach((blade,i)=>{const pre=i?'opponent':'player';$(pre+'-spin').style.transform=`scaleX(${blade.spin/100})`;$(pre+'-spin-number').textContent=Math.ceil(blade.spin);$(pre+'-status').textContent=blade.guard>0?'GUARDING':blade.specialTime>0?'SPECIAL':blade.spin<25?'LOW SPIN':match.state==='ready'?'READY':'SPINNING';});
 $('player-score').innerHTML=Array.from({length:2},(_,i)=>`<i class="${i<session.score[0]?'won':''}"></i>`).join('');$('opponent-score').innerHTML=Array.from({length:2},(_,i)=>`<i class="${i<session.score[1]?'won':''}"></i>`).join('');
 $('round-time').textContent=`0:${String(Math.floor(match.time)).padStart(2,'0')}`;
 const ready=match.state==='playing'&&!paused;
 for(const [name,cd,total,label]of [['dash',a.dashCD,3.2,a.counterReady>0?'Counter now!':'Close the gap'],['guard',a.guardCD,3.6,'Block a rush']]){
  $(name+'-button').disabled=!ready||cd>0;$(name+'-status').textContent=cd>0?`Ready in ${cd.toFixed(1)}s`:label;$(name+'-button').querySelector('i').style.transform=`scaleX(${1-cd/total})`;
 }
 $('special-button').disabled=!ready||a.energy<100;$('special-button').classList.toggle('ready',a.energy>=100);$('special-status').textContent=a.energy>=100?'Ready to unleash':`Energy ${Math.floor(a.energy)}%`;$('special-button').querySelector('i').style.transform=`scaleX(${a.energy/100})`;
 const distance=Math.hypot(a.x-b.x,a.z-b.z),incoming=b.warning>0||b.rush>0,urgent=b.rush>0&&distance<3.5||b.warning>0&&b.warning<.12&&distance<2.4;
 $('rival-warning').hidden=!(incoming&&match.state==='playing');$('rival-warning').textContent=urgent?'RUSH! · GUARD NOW':b.rush>0?'RIVAL RUSHING · GET READY':'RIVAL WINDING UP…';$('rival-warning').classList.toggle('urgent',urgent);
 $('guard-button').classList.toggle('incoming',urgent&&a.guardCD<=0&&ready);$('dash-button').classList.toggle('counter-ready',a.counterReady>0&&ready);
 $('dash-button').querySelector('b').textContent=a.counterReady>0?'COUNTER':'DASH';
 $('battle-hint').textContent=a.counterReady>0?`Perfect guard! Tap Counter in ${a.counterReady.toFixed(1)}s for a stronger reply.`:urgent?'Guard now! A well-timed block opens a counter-dash.':b.warning>0?'Rival winding up. Get ready to guard as the rush begins.':match.arena==='volcano'&&match.time%10>7?'The outer ring is heating up! Steer toward the center.':a.energy>=100?'Your signature move is ready. Tap Special.':b.guard>0?'Rival is guarding. Wait for the shield to fade before you dash.':a.spin<25?'Low spin. Guard a rush, then make your next dash count.':match.time>32?'Final spin! The safe area is closing in.':match.time<5?'Your blade moves on its own. You choose when to strike.':match.arena==='cyber'?'Hold the glowing center to charge your Special faster.':match.arena==='rail'?'Near the outer rail? Dash to ride it for a speed boost.':'Dash to attack. Time your guard. Counter to strike back.';
 if(mode==='league'){
  const goals=challengeGoals(session.tier,addStats({...session.stats},a.stats)),bonus=goals.slice(1),goal=bonus.find(g=>!g.done)||bonus[1];
  $('battle-objective').textContent=bonus.every(g=>g.done)?'★ Both skill stars ready! Win the duel to keep them.':`☆ ${goal.label} · ${goal.value} / ${goal.target}`;
 }
}
function finishRound(){
 $('result-reward').hidden=true;
 $('result-loadout').hidden=mode==='journey';
 const resultBack=$('result-screen').querySelector('.back-home');resultBack.textContent=mode==='journey'?'Return to journey':'Back to home';resultBack.onclick=mode==='journey'?openJourney:home;
 if(mode==='practice'){
  options.trained=true;save();
  $('result-eyebrow').textContent='PRACTICE COMPLETE';$('result-title').textContent='You’re ready.';$('result-description').textContent='Dash, guard, special. You’ve got the basics. Now meet your first rival.';$('result-score').innerHTML='';$('result-tip').textContent='Watch your rival, not just your own blade. The orange warning is your cue to guard.';$('result-next').textContent=practiceReturn==='league'?'BACK TO YOUR LEAGUE TIER →':'PLAY A REAL DUEL →';$('result-next').onclick=()=>setup(practiceReturn);
 }else{
  const winner=match.winner;if(winner!==null)session.score[winner]++;addStats(session.stats,match.blades[0].stats);
  const done=session.score.some(s=>s>=2);session.duelComplete=done;session.won=session.score[0]>=2;
  if(done&&session.won){options.wins++;if(mode==='championship'&&session.stage===2){options.trophies++;const legacy=read('beybattleSave',{});try{localStorage.setItem('beybattleSave',JSON.stringify({...legacy,wins:options.trophies,lastWinChar:ROSTER[selected].name}));}catch{}}save();}
  $('result-eyebrow').textContent=done?(mode==='championship'&&session.won&&session.stage===2?'CHAMPIONSHIP COMPLETE':'DUEL COMPLETE'):match.reason.toUpperCase();
  $('result-title').textContent=done?(session.won?(mode==='championship'&&session.stage===2?'Champion!':'Duel won!'):'Good battle.'):(winner===null?'Evenly matched.':winner===0?'Round won.':'Rival takes the round.');
  $('result-description').textContent=done?(session.won?'You read the battle and made your moves count.':'Your next attempt starts fresh. Every round is a chance to find your timing.'):(winner===null?'Both blades finished together. Replay this round.':`First to two wins. ${winner===0?'Keep your momentum.':'You can turn this around.'}`);
  $('result-score').innerHTML=`<div><span>YOU</span>${session.score[0]}</div><b class="divider">—</b><div><span>RIVAL</span>${session.score[1]}</div>`;
  const stats=match.blades[0].stats;$('result-tip').textContent=stats.guards===0?'Try this: wait for “GUARD NOW”, then tap Guard. It blocks 75% of incoming damage.':stats.specials===0?'Try this: watch the gold energy bar. When it fills, one tap unleashes your signature move.':stats.perfects===0?'Level up your timing: guard just as a rush hits to earn a perfect block and a counter-dash.':ROLES[ROSTER[selected].role].tip;
  $('result-next').textContent=!done?'NEXT ROUND →':mode==='championship'&&session.won&&session.stage<2?'NEXT CHALLENGER →':mode==='championship'&&!session.won?'RETRY THIS CHALLENGER →':'REMATCH →';
  $('result-next').onclick=()=>{if(!done){session.round++;newRound();}else if(mode==='championship'&&session.won&&session.stage<2){session.stage++;session.score=[0,0];session.round=1;showBracket();}else{session.score=[0,0];session.round=1;if(mode==='championship'&&session.won)session.stage=0;newRound();}};
  if(done){
   const originalNext=$('result-next').onclick;$('result-next').onclick=()=>{session.stats={};originalNext();};
  }
  if(mode==='league'){
   const tier=LEAGUE[session.tier],award=awardTier(options.league,session.tier,session.stats,done&&session.won);
   $('result-reward').hidden=false;$('result-reward').innerHTML=`<p class="reward-title">${done&&session.won?'★'.repeat(award.stars)+'☆'.repeat(3-award.stars)+' · '+tier.name.toUpperCase()+' TIER CLEARED':tier.name.toUpperCase()+' TIER · SKILL STARS'}</p><div>${award.goals.map(g=>`<span class="${g.done?'earned':''}">${g.done?'★':'☆'} ${g.label} <small>${g.value}/${g.target}</small></span>`).join('')}</div>`;
   if(done&&session.won){
    options.league=award.league;save();$('result-title').textContent=session.tier===8?'God tier conquered!':tier.name+' conquered!';
    $('result-description').textContent=session.tier===8?'Nine tiers. Nine rivals. You mastered the league. Replay any tier to collect every skill star.':`${LEAGUE[session.tier+1].name} tier is unlocked. Your ${award.stars} ${award.stars===1?'star is':'stars are'} saved. Replay anytime to improve your best.`;
    $('result-next').textContent=session.tier===8?'VIEW MY LEAGUE →':'NEXT TIER · '+LEAGUE[session.tier+1].name.toUpperCase()+' →';
    $('result-next').onclick=()=>{if(session.tier===8){match=null;show('league');}else{leagueTier=session.tier+1;setup('league');}};
   }else if(done){$('result-description').textContent='Your unlocked tiers and best stars are safe. Try this rival again with a fresh start.';$('result-next').textContent='TRY THIS TIER AGAIN →';}
  }
  if(mode==='journey'&&done){
   const chapter=session.chapter,c=CHAPTERS[chapter];
   journey.complete(chapter,session.won);
   $('result-eyebrow').textContent=c.place+' · '+(session.won?'Seal earned':'A chance to try again');
   $('result-title').textContent=session.won?c.seal+' seal earned.':'The road is still yours.';
   $('result-description').textContent=session.won?`${c.title} · Your partner and your story move forward.`:'Every trainer loses sometimes. Retry with full spin, or return to the map. Your earned seals are safe.';
   $('result-next').textContent=session.won?'Continue the story →':'Try this duel again →';
   $('result-next').onclick=session.won?openJourney:()=>startJourneyBattle(chapter,journey.state.starter);
  }
 }
 $('result-emblem').innerHTML=`<img src="${portrait(selected)}" alt="${ROSTER[selected].name}">`;
 const s=session.duelComplete?session.stats:match.blades[0].stats;$('result-stats').innerHTML=[['DASH HITS',s.rushHits],['PERFECT GUARDS',s.perfects],['SPECIALS',s.specials]].map(([label,n])=>`<div><b>${n||0}</b><span>${label}</span></div>`).join('');
 $('result-screen').classList.toggle('celebrate',mode==='practice'||match.winner===0);sound.play(mode==='practice'||match.winner===0?'win':'lose');show('result');
}
function showBracket(){
 $('bracket-list').innerHTML=session.rivals.map((id,i)=>`<div class="bracket-rival ${i===session.stage?'current':''}"><small>${['OPENING DUEL','SEMI-FINAL','FINAL'][i]}</small><img src="${portrait(id)}" alt=""><b>${ROSTER[id].name}</b><span>${i<session.stage?'WON ✓':i===session.stage?'UP NEXT':'WAITING'}</span></div>`).join('');show('bracket');
}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function openDialog(id){if(screen==='battle')paused=true;keys.clear();cancelPointer();if(!$(id).open)$(id).showModal();}
function pause(){if(screen==='battle'&&!document.querySelector('dialog[open]'))openDialog('pause-dialog');}
function home(){closeDialogs();paused=false;match=null;session=null;show('home');}
function warmup(){if(mode!=='practice')practiceReturn=mode==='league'?'league':'duel';setup('practice');startSession();}
$('play-duel').onclick=()=>setup('duel');$('play-practice').onclick=()=>{practiceReturn='duel';setup('practice');};$('play-championship').onclick=()=>setup('championship');
$('play-league').onclick=()=>show('league');$('league-map').onclick=e=>{const b=e.target.closest('[data-tier]');if(b&&!b.disabled){leagueTier=+b.dataset.tier;setup('league');}};
$('play-journey').onclick=openJourney;
$('tier-filter').innerHTML='<option value="all">All tiers</option>'+Object.entries(BLADE_TIERS).map(([key,tier])=>`<option value="${key}">${tier.label}</option>`).join('');
$('tier-filter').onchange=e=>{tierFilter=e.target.value;filter='all';renderCollection();};
$('practice-tip').onclick=warmup;
$('home-link').onclick=()=>screen==='battle'?pause():home();document.querySelectorAll('.back-home').forEach(b=>b.onclick=home);
$('blade-filters').onclick=e=>{const button=e.target.closest('[data-filter]');if(button){filter=button.dataset.filter;renderCollection();}};
$('blade-search').oninput=renderCollection;$('blade-grid').onclick=e=>{const button=e.target.closest('[data-id]');if(button)selectBlade(+button.dataset.id);};
$('difficulty-options').onclick=e=>{const b=e.target.closest('[data-difficulty]');if(b){options.difficulty=b.dataset.difficulty;updateSettings();}};
$('arena-options').onclick=e=>{const b=e.target.closest('[data-arena]');if(b){arena=b.dataset.arena;updateSettings();}};
$('change-rival').onclick=chooseRival;$('start-match').onclick=startSession;$('bracket-next').onclick=newRound;
$('launch-button').onclick=()=>launch();$('auto-launch').onclick=()=>launch(true);
$('dash-button').onclick=()=>action('dash');$('guard-button').onclick=()=>action('guard');$('special-button').onclick=()=>action('special');
$('pause-button').onclick=pause;$('resume-button').onclick=()=>{$('pause-dialog').close();paused=false;};$('quit-match').onclick=()=>mode==='journey'?openJourney():home();
$('settings-button').onclick=()=>openDialog('settings-dialog');$('help-button').onclick=()=>openDialog('help-dialog');
$('pause-help').onclick=()=>{$('pause-dialog').close();openDialog('help-dialog');};$('help-practice').onclick=warmup;$('leave-practice').onclick=()=>setup(practiceReturn);$('result-loadout').onclick=()=>setup(mode);
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]')){paused=false;acc=0;last=performance.now();}});
$('sound-setting').checked=options.sound;$('motion-setting').checked=!options.motion;$('quality-setting').checked=options.low;
function applyOptions(){sound.enabled=options.sound;display.motion=options.motion;document.body.classList.toggle('reduced-motion',!options.motion);save();}
$('sound-setting').onchange=e=>{options.sound=e.target.checked;applyOptions();};$('motion-setting').onchange=e=>{options.motion=!e.target.checked;applyOptions();};$('quality-setting').onchange=e=>{options.low=e.target.checked;display.quality(options.low);applyOptions();};
$('scene').addEventListener('pointerdown',e=>{if(e.button!==0||pointerId!==null||paused)return;pointerId=e.pointerId;inspectX=e.clientX;$('scene').setPointerCapture(e.pointerId);if(screen==='battle'&&match?.state==='playing')match.blades[0].steer=display.point(e.clientX,e.clientY);});
$('scene').addEventListener('pointermove',e=>{if(pointerId!==e.pointerId||paused)return;if(screen==='battle'){if(match&&match.state==='playing')match.blades[0].steer=display.point(e.clientX,e.clientY);}else if(display.hero){display.hero.rotation.y+=(e.clientX-inspectX)*.012;inspectX=e.clientX;}});
function cancelPointer(){const id=pointerId;pointerId=null;if(id!==null&&$('scene').hasPointerCapture(id))$('scene').releasePointerCapture(id);if(match)match.blades[0].steer=null;}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(event,cancelPointer);
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;
 if(document.querySelector('dialog[open]'))return;
 if(screen!=='battle')return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 keys.add(e.code);if(e.repeat)return;
 if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();pause();}
 if(e.code==='Space'){match.state==='ready'?launch():action('special');}
 if(e.code==='KeyQ')action('dash');if(e.code==='KeyE')action('guard');
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();cancelPointer();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();acc=0;last=performance.now();});
window.addEventListener('resize',()=>display.resize());
function keyboardSteer(){if(!match||pointerId!==null)return;const b=match.blades[0];const x=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);const z=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);b.steer=x||z?{x:b.x+x*3,z:b.z+z*3}:null;}
let frameCount=0,slowFrames=0;
$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();toast('Graphics interrupted. Your battle is paused.');});
$('scene').addEventListener('webglcontextrestored',()=>{display.resize();toast('Graphics restored. Resume when you’re ready.');});
function frame(ts){
 const elapsed=last?(ts-last)/1000:0,dt=Math.min(elapsed,.08);last=ts;frameCount++;
 if(screen==='battle'&&!paused&&match?.time>3&&!options.low){slowFrames=elapsed>.035?slowFrames+1:Math.max(0,slowFrames-1);if(slowFrames>90){options.low=true;display.quality(true);$('quality-setting').checked=true;save();toast('Performance mode enabled for smoother play.');}}
 if(!document.hidden){
  if(screen==='battle'&&!paused){
   if(match.state==='ready'){launchClock+=dt;$('launch-marker').style.left=`${(Math.sin(launchClock*2.7)+1)*49}%`;}
   if(match.state==='playing'&&practiceStep<3){keyboardSteer();acc+=dt;let n=0;while(acc>=STEP&&n<10){match.step(STEP);acc-=STEP;n++;}if(n===10)acc=0;
    for(const e of match.events.splice(0)){display.event(e);sound.play(e.type);if(e.type==='special')announce(e.i===0?e.name.toUpperCase():`RIVAL · ${e.name.toUpperCase()}`,1.2);if(e.type==='block'&&e.i===0&&match.blades[0].counterReady<=0)announce('NICE GUARD!',.7);if(e.type==='perfect'&&e.i===0)announce('PERFECT GUARD · COUNTER!',1);if(e.type==='counter'&&e.i===0)announce('COUNTER STRIKE! +3',.8);if(e.type==='rail'&&e.i===0)announce('RAIL RUSH!',.7);if(e.type==='finalspin')announce('FINAL SPIN · RING CLOSING',1.5);}
    if(mode==='practice')coach();
   }
   if(match.state==='over'&&!finishHandled){finishHandled=true;finishDelay=1;announce(match.winner===null?'DOUBLE FINISH':match.winner===0?'ROUND WON':'SPIN OUT',1);}
   if(finishDelay>0){finishDelay-=dt;if(finishDelay<=0){finishRound();}}
   noticeTime-=dt;if(noticeTime<=0)$('battle-announcement').textContent='';
   hudClock+=dt;if(hudClock>.08){updateHUD();hudClock=0;}
   if(screen==='battle'){display.render(dt,match.state==='playing'?acc/STEP:1);const pos=display.project(match.blades[0].x,match.blades[0].z);$('you-label').style.left=pos.x+'px';$('you-label').style.top=(pos.y-18)+'px';}
  }else if((screen==='home'||screen==='setup')&&frameCount%2===0){display.render(dt*2);}
 }
 requestAnimationFrame(frame);
}
$('featured-switches').innerHTML=[0,2,31].map(id=>`<button data-id="${id}" aria-label="Inspect ${ROSTER[id].name}" aria-pressed="${selected===id}"><img src="${portrait(id)}" alt=""></button>`).join('');
$('featured-switches').onclick=e=>{const b=e.target.closest('[data-id]');if(b){selected=+b.dataset.id;display.select(selected);updateFeatured();}};
applyOptions();show('home');display.render(0);$('loading-note').hidden=true;requestAnimationFrame(frame);
// Inspection surface for reproducible browser regression tests.
window.__bey={get match(){return match;},get screen(){return screen;},get session(){return session;},get paused(){return paused;},get league(){return options.league;},get journey(){return structuredClone(journey.state);},display,roster:ROSTER,setup};
