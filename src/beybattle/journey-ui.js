import {ROSTER,ROLES} from './roster.js';
import {JOURNEY_KEY,COMPANIONS,CHARACTERS,CHAPTERS,freshJourney,readJourney,beginJourney,visitChapter,chooseDialogue,advanceDialogue,finishJourneyDuel,storyText} from './journey.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Atlas positions are presentation-only: existing journey saves stay compatible.
const PORTRAITS={sora:[0,0],ren:[1,0],mio:[2,0],aki:[3,0],yuki:[0,1],kaede:[1,1],trainer:[2,1]};
const title=value=>value.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export class TrainerJourney {
 constructor(root,{battle,home,storage}){
  this.root=root;this.battle=battle;this.home=home;this.storage=storage;this.storageOK=storage.storageOK;
  this.state=readJourney(storage.read(JOURNEY_KEY,null));
  this.tab='map';this.starter=0;this.resetPending=false;
  root.addEventListener('click',e=>this.click(e));
  root.addEventListener('submit',e=>{if(e.target.id!=='trainer-form')return;e.preventDefault();this.state=beginJourney(new FormData(e.target).get('trainer-name'),this.starter);this.save();this.render(true);});
 }
 save(){this.storageOK=this.storage.write(JOURNEY_KEY,this.state);}
 text(text){return escape(storyText(text,this.state,title(ROSTER[this.state.starter??0].name)));}
 portrait(id,classes=''){
  const cell=PORTRAITS[id];if(!cell)return '';
  return `<span class="trainer-portrait ${classes}" data-portrait="${id}" role="img" aria-label="${this.text(CHARACTERS[id].name)||'Your trainer'} portrait" style="--portrait-x:${cell[0]*100/3}%;--portrait-y:${cell[1]*100}%;--portrait-color:${CHARACTERS[id].color}"></span>`;
 }
 open(){this.resetPending=false;this.render();}
 render(focus=false){
  const s=this.state,active=s.starter!==null,finished=s.completed===CHAPTERS.length;
  this.root.innerHTML=`<div class="journey-top"><button class="text-button" data-journey="home">← Beybattle</button><span class="journey-label">A trainer’s tale</span><span class="journey-save" role="status">${this.storage.user?'Saved for '+escape(this.storage.user.name)+' · see Trainer for sync status':this.storageOK?'Progress saves on this device':'Storage unavailable · progress lasts this visit'}</span></div>
   ${active?`<div class="traveler-strip">${this.portrait('trainer','traveler-avatar')}<img src="assets/blades/${s.starter}.webp" alt=""><div><b>${escape(s.name)}</b><span>${title(ROSTER[s.starter].name)} · ${finished?'Wind Road champion':'Bey trainer'}</span></div><div class="seal-count"><b>${s.completed}<small> / 6</small></b><span>Wind seals</span></div></div>`:''}
   ${!active?this.starters():s.scene?this.dialogue():this.map()}`;
  if(focus){const heading=this.root.querySelector('[data-story-focus]');heading?.focus({preventScroll:true});}
 }
 starters(){return `<div class="journey-intro"><div><p class="eyebrow">Story mode · The Wind Road</p><h2 data-story-focus tabindex="-1">A partner.<br>A promise.<br><em>A world beyond.</em></h2><p>Leave your village with a Bey at your side. Follow the wind road, meet your rivals, and discover what makes a trainer.</p><div class="journey-facts"><span>6 chapters</span><span>Dialogue & choices</span><span>Saved journey</span></div></div><div class="journey-prologue">${this.portrait('sora','prologue-avatar')}<blockquote>“The road doesn’t ask you to be a champion.<br>It only asks you to begin.”</blockquote><span>— Sora, workshop keeper</span></div></div>
  <form id="trainer-form"><div class="starter-heading"><div><p class="eyebrow">01 / Your first companion</p><h3>Choose a Bey. Find your rhythm.</h3><p>Each has its own style. All three can complete the journey.</p></div><label for="trainer-name">Trainer name<input id="trainer-name" name="trainer-name" maxlength="20" placeholder="Your name" autocomplete="off" required value=""></label></div><div class="starter-grid">${COMPANIONS.map(c=>`<button type="button" class="starter-card" data-starter="${c.id}" aria-pressed="${this.starter===c.id}"><span>${c.style}</span><img src="assets/blades/${c.id}.webp" alt=""><h4>${title(ROSTER[c.id].name)}</h4><p>${c.tip}</p><small>${ROSTER[c.id].specialName} · ${ROLES[ROSTER[c.id].role].label}</small><b class="starter-selection">${this.starter===c.id?'Selected companion':'Choose companion'}</b></button>`).join('')}</div><div class="journey-start"><p>Your companion stays with you for this journey.<br>League Run and Quick Duel still have all 33 blades.</p><button class="button primary" type="submit">Begin your journey <span>→</span></button></div></form>`;}
 map(){
  const s=this.state,finished=s.completed===CHAPTERS.length,next=CHAPTERS[Math.min(s.completed,5)];
  return `<div class="journey-heading"><div><p class="eyebrow">${finished?'Six seals / A promise kept':'The Wind Road / Chapter '+String(s.completed+1).padStart(2,'0')}</p><h2 data-story-focus tabindex="-1">${finished?'Every road leads to a story.':'Beyond the familiar sky.'}</h2><p>${finished?'Your first journey is complete. Revisit a region, or read the memories you made.':next.objective}</p></div><div class="journey-tabs" aria-label="Journey view"><button data-journey="map" aria-pressed="${this.tab==='map'}">Region map</button><button data-journey="journal" aria-pressed="${this.tab==='journal'}">Travel journal</button></div></div>
  ${this.tab==='journal'?this.journal():`<div class="world-map"><img src="assets/wind-road.svg" alt="A winding road from Hoshimi Village through cedar forests, a railway crossing, Mirror Lake and Ember Pass to the Sky Spire"><span class="map-caption">The Wind Road <small>A map of places, and the people we meet.</small></span>${CHAPTERS.map((c,i)=>`<button class="map-pin ${i<s.completed?'visited':''} ${i===s.completed?'current':''}" style="--x:${c.x}%;--y:${c.y}%;--region:${c.color}" data-chapter="${i}" ${i>s.completed?'disabled':''} aria-label="${c.place}. ${i>s.completed?'Locked':i<s.completed?'Revisit':'Travel here'}"><span>${i<s.completed?'✓':i+1}</span><b>${c.place}</b></button>`).join('')}</div><div class="region-list">${CHAPTERS.map((c,i)=>`<button class="region-card ${i===s.completed?'current':''}" data-chapter="${i}" ${i>s.completed?'disabled':''}>${this.portrait(c.character,'region-avatar')}<span class="region-number">${i<s.completed?'✓':String(i+1).padStart(2,'0')}</span><div><small>${c.place}</small><h3>${c.title}</h3><p>${i>s.completed?'Earn the '+CHAPTERS[i-1].seal+' seal to unlock.':i<s.completed?c.seal+' seal earned · Revisit':c.subtitle}</p></div><span aria-hidden="true">${i>s.completed?'—':'→'}</span></button>`).join('')}</div>`}
  <div class="journey-bottom"><p>${finished?'✦ Wind Road champion · Six seals earned':s.completed+' of 6 seals earned · Follow the road and make memories with your companion.'}</p><button class="text-button" data-journey="reset">Start a new journey</button></div>${this.resetPending?`<div class="reset-confirm" role="group" aria-label="Start over confirmation"><p>Replace this trainer’s journey? Your story progress will be erased. League Run and Skybound progress stay saved.</p><button class="button secondary" data-journey="cancel-reset">Keep my journey</button><button class="button primary" data-journey="confirm-reset">Start over</button></div>`:''}`;
 }
 journal(){const s=this.state;return `<div class="travel-journal"><div class="journal-intro"><span class="eyebrow">${escape(s.name)}’s travel journal</span><h3>The things we carry.</h3><p>Wind seals mark the road. These are the moments that made it yours.</p></div>${CHAPTERS.map((c,i)=>{const choice=c.before.find(l=>l.choices)?.choices.find(v=>v.id===s.choices[i]);return `<article class="journal-entry ${i<s.completed?'':'unwritten'}"><span>${i<s.completed?'✦':'○'}</span><div><small>${c.place} / ${c.seal} seal</small><h4>${c.title}</h4><p>${i<s.completed?c.recap:i===s.completed?'Your next chapter is waiting.':'A page yet to be written.'}</p>${choice?`<blockquote>“${choice.label}”</blockquote>`:''}</div></article>`;}).join('')}</div>`;}
 dialogue(){
  const s=this.state,{chapter,part,line}=s.scene,c=CHAPTERS[chapter],lines=c[part],entry=lines[line],character=CHARACTERS[entry.speaker];
  const choice=entry.choices?.find(v=>v.id===s.choices[chapter]);
  const featured=choice&&entry.replySpeaker?entry.replySpeaker:entry.speaker==='narrator'?c.character:entry.speaker;
  const transcript=lines.slice(0,line+1).map(l=>{const selected=l.choices?.find(v=>v.id===s.choices[chapter]);return `<p><b>${this.text(CHARACTERS[l.speaker].name)}:</b> ${this.text(l.text)}</p>${selected?`<p><b>Your reply:</b> ${selected.label}</p><p><b>${this.text(CHARACTERS[l.replySpeaker||l.speaker].name)}:</b> ${this.text(selected.reply)}</p>`:''}`;}).join('');
  return `<div class="story-scene" style="--region:${c.color}"><div class="scene-landscape" aria-hidden="true"></div><div class="scene-stage"><div class="scene-title"><p class="eyebrow">Chapter ${String(chapter+1).padStart(2,'0')} / ${c.place}</p><h2>${c.title}</h2><p>${c.subtitle}</p></div><figure class="scene-character">${this.portrait(featured,'scene-avatar')}<figcaption><small>${entry.speaker==='narrator'?'On this road':choice&&entry.replySpeaker?'Replying':'Speaking'}</small><strong>${this.text(CHARACTERS[featured].name)}</strong><span>${CHARACTERS[featured].role}</span></figcaption></figure></div>${part==='after'?`<div class="scene-seal">✦ ${c.seal} seal earned</div>`:''}
   <div class="dialogue-panel">${entry.speaker==='narrator'?`<div class="speaker-crest" style="--speaker:${character.color}" aria-hidden="true">${character.mark}</div>`:this.portrait(entry.speaker,'speaker-avatar')}<div class="dialogue-content"><div class="speaker-heading"><h3>${this.text(character.name)}</h3><span>${character.role}</span><small>${line+1} / ${lines.length}</small></div><p class="dialogue-text" data-story-focus tabindex="-1">${this.text(entry.text)}</p>${choice?`<p class="chosen-line">You chose: ${choice.label}</p><p class="dialogue-reply">${entry.replySpeaker?`<b>${this.text(CHARACTERS[entry.replySpeaker].name)}: </b>`:''}${this.text(choice.reply)}</p>`:''}${entry.choices&&!choice?`<div class="dialogue-choices" aria-label="Your reply">${entry.choices.map(v=>`<button data-choice="${v.id}">${v.label}<span>→</span></button>`).join('')}</div>`:`<button class="button primary dialogue-next" data-journey="next">${line===lines.length-1?(part==='before'?'Enter the stadium':chapter===5?'Complete the journey':'Return to the road'):'Continue'} <span>→</span></button>`}</div></div></div>
   <div class="scene-footer"><button class="text-button" data-journey="leave-scene">← Region map</button><span>${part==='before'?c.objective:'The '+c.seal+' seal is yours. Your progress is saved'+(this.storageOK?' on this device.':' for this visit.')}</span><details class="dialogue-history"><summary>Conversation log</summary><div>${transcript}</div></details></div>`;
 }
 click(e){
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.starter!==undefined){
   this.starter=+b.dataset.starter;
   this.root.querySelectorAll('[data-starter]').forEach(el=>{const chosen=+el.dataset.starter===this.starter;el.setAttribute('aria-pressed',chosen);el.querySelector('.starter-selection').textContent=chosen?'Selected companion':'Choose companion';});return;
  }
  if(b.dataset.chapter!==undefined){this.state=visitChapter(this.state,+b.dataset.chapter);this.save();this.render(true);return;}
  if(b.dataset.choice){this.state=chooseDialogue(this.state,b.dataset.choice);this.save();this.render(true);return;}
  switch(b.dataset.journey){
   case 'home':this.home();return;
   case 'next':{const step=advanceDialogue(this.state);this.state=step.state;this.save();if(step.action==='battle'){this.battle(step.chapter,this.state.starter);return;}break;}
   case 'leave-scene':this.state.scene=null;this.save();break;
   case 'map':case 'journal':this.tab=b.dataset.journey;break;
   case 'reset':this.resetPending=true;this.render();this.root.querySelector('[data-journey="cancel-reset"]').focus();return;
   case 'cancel-reset':this.resetPending=false;break;
   case 'confirm-reset':this.state=freshJourney();this.resetPending=false;this.tab='map';this.save();break;
   default:return;
  }
  this.render(true);
 }
 complete(chapter,won){this.state=finishJourneyDuel(this.state,chapter,won);this.save();}
}
