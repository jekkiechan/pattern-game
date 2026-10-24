import assert from 'node:assert/strict';
import {Match,STEP} from '../src/beybattle/engine.js';

// Compare visible-input policies against the same final rival and seed set.
// A deliberate block/counter should beat blindly pressing every available move.
const results={};
for(const policy of ['idle','mash','timed']){
 const result=results[policy]={wins:0,perfects:0,counters:0};
 for(let seed=1;seed<=80;seed++){
  const match=new Match(0,31,{seed,difficulty:'master'});match.launch(.5);
  while(match.state==='playing'){
   const [player,rival]=match.blades,distance=Math.hypot(player.x-rival.x,player.z-rival.z);
   if(policy==='timed'){
    if(rival.rush>.01&&distance<3.2)match.guard(0);
    if(player.counterReady>0||rival.warning<=0&&rival.rush<=0&&rival.guard<=0)match.dash(0);
    if(player.energy>=100&&player.spin<82&&rival.guard<=0)match.special(0);
   }else if(policy==='mash'){match.guard(0);match.dash(0);match.special(0);}
   match.step(STEP);
  }
  if(match.winner===0)result.wins++;
  result.perfects+=match.blades[0].stats.perfects;result.counters+=match.blades[0].stats.counters;
 }
}
assert(results.timed.wins>=results.mash.wins+15,'reading rushes must reward skill more than repeating every action');
assert(results.timed.wins>results.idle.wins+30,'the player’s choices must change the battle outcome');
assert(results.timed.counters>=40,'earned counter-dashes must connect often enough to feel useful');
console.log('Tactics checks passed (80 fixed-seed attempts each):',JSON.stringify(results));
