import assert from 'node:assert/strict';
import {CHAPTERS,COMPANIONS,freshJourney,readJourney,beginJourney,visitChapter,chooseDialogue,advanceDialogue,finishJourneyDuel,storyText} from '../src/beybattle/journey.js';
import {ROSTER,ARENAS} from '../src/beybattle/roster.js';
assert.deepEqual(readJourney(null),freshJourney());
assert.deepEqual(readJourney({version:1,starter:100}),freshJourney());
assert.equal(beginJourney('<Ada>',0).name,'Ada');
for(const c of CHAPTERS){assert(ROSTER[c.rival]);assert(ARENAS.some(a=>a.id===c.arena));}
for(const companion of COMPANIONS){
 let state=beginJourney('Haru',companion.id);
 assert.equal(state.starter,companion.id);
 const locked=visitChapter(state,5);assert.equal(locked.scene.chapter,0);
 for(let i=0;i<CHAPTERS.length;i++){
  state=visitChapter(state,i);
  let step;
  do{
   step=advanceDialogue(state);state=step.state;
   if(step.action==='choice'){
    const entry=CHAPTERS[i].before[state.scene.line];
    assert.equal(advanceDialogue(chooseDialogue(state,'invalid')).action,'choice');
    state=chooseDialogue(state,entry.choices[companion.id===0?0:1].id);
    assert.deepEqual(readJourney(JSON.parse(JSON.stringify(state))),state,'Dialogue resumes after reload');
   }
  }while(step.action!=='battle');
  assert.equal(state.completed,i);
  assert.deepEqual(finishJourneyDuel(state,i,false),state,'Loss cannot award a seal');
  state=finishJourneyDuel(state,i,true);assert.equal(state.completed,i+1);assert.equal(state.scene.part,'after');
  do{step=advanceDialogue(state);state=step.state;}while(step.action!=='map');
  assert.equal(state.scene,null);
 }
 assert.equal(state.completed,6);
 assert.equal(finishJourneyDuel(visitChapter(state,0),0,true).completed,6,'Replay preserves all seals');
 assert(!storyText('{name} {blade} {motive} {memory} {ending}',state,'Drake').includes('{'));
}
const corrupted=readJourney({version:1,name:'Haru',starter:0,completed:0,scene:{chapter:0,part:'before',line:999}});
assert.equal(advanceDialogue(corrupted).action,'choice','Corrupt cursor cannot bypass a choice');
assert.equal(readJourney({...corrupted,scene:{chapter:5,part:'after',line:0}}).scene,null);
assert.equal(readJourney({...corrupted,completed:Infinity}).completed,0);
console.log('Journey checks passed: all 3 starters, 6 chapters, locked routes, choices, loss/replay protection, save recovery and ending.');
