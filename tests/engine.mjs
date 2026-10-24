import assert from 'node:assert/strict';
import {Match,STEP} from '../src/beybattle/engine.js';
import {ROSTER,ARENAS} from '../src/beybattle/roster.js';
import './progression.mjs';
import './tactics.mjs';
const run=(m,seconds)=>{for(let i=0;i<seconds/STEP;i++)m.step();};
const fresh=()=>{const m=new Match(0,1);m.launch();return m;};
{
 const m=fresh();assert(m.dash(0));assert(!m.dash(0));assert(m.guard(0));assert(!m.guard(0));assert(!m.special(0));
 const raw=10*m.blades[0].role.resistance;assert.equal(m.damage(0,10,1),raw*.25);assert.equal(m.blades[0].stats.guards,1);
 const spin=m.blades[0].spin;run(m,.1);assert(m.blades[0].spin<spin);assert(m.blades[0].dashCD>3);
}
for(const c of ROSTER){
 const m=new Match(c.id,(c.id+1)%33);m.launch();m.blades[0].spin=50;m.blades[0].energy=100;
 assert(m.special(0));assert(!m.special(0));assert.equal(m.blades[0].stats.specials,1);assert(m.blades[0].spin<=100);
 run(m,2);assert(m.blades.every(b=>[b.spin,b.energy,b.x,b.z].every(Number.isFinite)));
}
for(const a of ARENAS){
 const m=new Match(0,5,{arena:a.id,bots:true});m.launch();run(m,51);assert.equal(m.state,'over');assert(m.time<=50.02);
}
{
 const a=new Match(4,32,{seed:543,bots:true}),b=new Match(4,32,{seed:543,bots:true});a.launch();b.launch();run(a,20);run(b,20);
 assert.deepEqual(a.blades.map(x=>[x.spin,x.x,x.z]),b.blades.map(x=>[x.spin,x.x,x.z]));assert.equal(a.winner,b.winner);
 const m=new Match(0,1,{practice:true});m.launch();run(m,120);assert.equal(m.state,'playing');assert(m.blades.every(b=>b.spin>=25));
}
{
 const m=fresh(),[a,b]=m.blades;a.x=-.5;b.x=.5;a.z=b.z=0;a.vx=-2;b.vx=2;a.vz=b.vz=0;const before=a.spin;
 m.step();assert(Math.abs(before-a.spin-a.role.decay*STEP)<.001,'separating overlap cannot inflict damage');
 const n=new Match(0,1,{arena:'rail'});n.launch();n.blades[0].x=4.5;n.blades[0].z=0;n.dash(0);assert.equal(n.blades[0].railCD,5);assert.equal(n.events.filter(e=>e.type==='rail').length,1);
}
{
 const clean=new Match(0,1);clean.launch(1);assert.equal(clean.blades[0].energy,14);assert.equal(clean.blades[1].energy,6);assert.equal(clean.blades[0].stats.cleanLaunches,1);
 const standard=fresh();assert.equal(standard.blades[0].energy,6);assert.equal(standard.blades[1].energy,6);
 const invalid=new Match(0,1);invalid.launch(NaN);assert(invalid.blades.every(b=>Number.isFinite(b.vx)&&b.energy===6));
}
{
 const m=fresh(),[a,b]=m.blades;m.dash(0);m.guard(0);b.rush=.4;const before=a.energy;
 const damage=m.damage(0,10,1);assert(Math.abs(damage-10*a.role.resistance*.1)<1e-9,'fresh shield blocks 90% of a rush');
 assert.equal(a.stats.perfects,1);assert.equal(a.counterReady,1.8);assert.equal(a.dashCD,0);assert(a.energy>=before+12);
 m.damage(0,10,1);assert.equal(a.stats.perfects,1,'one perfect reward per guard');
 assert(m.dash(0));assert.equal(a.counterReady,0);assert.equal(a.guard,0,'counter dash trades away the remaining shield');
 a.x=-.5;b.x=.5;a.z=b.z=0;a.vx=5;b.vx=-5;a.vz=b.vz=0;m.step();
 assert.equal(a.stats.counters,1);assert.equal(a.stats.rushHits,1);assert(m.events.some(e=>e.type==='counter'));
 run(m,1);assert.equal(a.stats.counters,1,'counter bonus only lands once');
 const late=fresh();late.guard(0);late.blades[0].guard=.6;late.blades[1].rush=.4;
 assert.equal(late.damage(0,10,1),10*late.blades[0].role.resistance*.25);assert.equal(late.blades[0].counterReady,0);
 const expires=fresh();expires.guard(0);expires.blades[1].rush=.4;expires.damage(0,10,1);run(expires,1.9);assert.equal(expires.blades[0].counterReady,0);
}
{
 const baseline=new Match(0,31,{difficulty:'rookie'});
 for(const difficulty of ['rookie','challenger','expert','master']){
  const m=new Match(0,31,{difficulty});assert.equal(m.blades[1].spin,100);assert.equal(m.blades[0].spin,100);
  assert.deepEqual(m.blades.map(b=>b.role),baseline.blades.map(b=>b.role),'difficulty cannot change either blade’s combat stats');
  m.launch();run(m,51);assert.equal(m.state,'over');
 }
 const m=new Match(0,1,{practice:true});m.launch();run(m,34);assert.equal(m.events.filter(e=>e.type==='finalspin').length,1);
}
console.log('Engine checks passed: cooldowns, 33 specials, 6 arenas, deterministic simulation, practice, collision, rail, launch energy, perfect guards, counters, fair AI tiers.');
