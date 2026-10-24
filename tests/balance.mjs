import assert from 'node:assert/strict';
import {Match,STEP} from '../src/beybattle/engine.js';
import {ROSTER} from '../src/beybattle/roster.js';
const arg=(key,defaultValue)=>process.argv.find(a=>a.startsWith(key+'='))?.split('=')[1]??defaultValue;
const quick=process.argv.includes('--quick'),seeds=Number(arg('--seeds',quick?2:32)),arena=arg('--arena','stadium'),seedBase=Number(arg('--seed',145));
const wins=ROSTER.map(()=>0),games=ROSTER.map(()=>0),durations=[];
let matches=0,draws=0;
for(let a=0;a<ROSTER.length;a++)for(let b=a+1;b<ROSTER.length;b++)for(let s=0;s<seeds;s++){
 const swap=s%2,left=swap?b:a,right=swap?a:b;
 const m=new Match(left,right,{bots:true,arena,seed:seedBase+Math.floor(s/2)*7741+a*104729+b*13007});m.launch(.5);
 while(m.state==='playing')m.step(STEP);
 const ids=[left,right];games[a]++;games[b]++;matches++;durations.push(m.time);
 if(m.winner===null){wins[a]+=.5;wins[b]+=.5;draws++;}else wins[ids[m.winner]]++;
 assert(m.blades.every(b=>[b.x,b.z,b.spin,b.energy,b.burst].every(Number.isFinite)));
}
const rates=ROSTER.map((c,i)=>({id:i,name:c.name,role:c.role,special:c.special,winRate:+(wins[i]/games[i]*100).toFixed(1)}));
const roles={};for(const c of rates){const r=roles[c.role]??={sum:0,n:0};r.sum+=c.winRate;r.n++;}
const report={simulationHz:1/STEP,arena,seedBase,seeds,matches,draws,averageSeconds:+(durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(1),roles:Object.fromEntries(Object.entries(roles).map(([k,v])=>[k,+(v.sum/v.n).toFixed(1)])),roster:rates};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--gate')){assert(rates.every(c=>c.winRate>=40&&c.winRate<=60),'Roster win rates outside 40–60%');}
