import assert from 'node:assert/strict';
import {LEAGUE,readLeague,unlockedTier,totalStars,challengeGoals,awardTier,addStats} from '../src/beybattle/progression.js';
import {ROSTER,ARENAS,BLADE_TIERS} from '../src/beybattle/roster.js';

const fresh=readLeague(null);
assert.equal(totalStars(fresh),0);assert.equal(unlockedTier(fresh),0);assert.equal(fresh.medals.length,9);
assert.deepEqual(readLeague({medals:[3,0,3,2]}).medals,[3,0,0,0,0,0,0,0,0],'later tiers require a contiguous cleared path');
assert.deepEqual(readLeague({medals:[5,2,-1,'3',NaN]}).medals,[3,2,0,0,0,0,0,0,0]);
assert.equal(awardTier(fresh,1,{guards:100},true).stars,0,'locked tiers cannot be awarded');
const stats=addStats(addStats({}, {rushHits:1,guards:1}),{rushHits:1,specials:2});
assert.equal(stats.rushHits,2);assert.equal(stats.guards,1);assert.equal(stats.specials,2);
const first=awardTier(fresh,0,stats,true);assert.equal(first.stars,3);assert(first.improved);assert.equal(unlockedTier(first.league),1);
assert.equal(totalStars(fresh),0,'awarding does not mutate the input save');
const replay=awardTier(first.league,0,{},true);assert.equal(replay.stars,1);assert.equal(replay.league.medals[0],3);assert(!replay.improved);
assert.deepEqual(awardTier(first.league,1,{},false).league,first.league,'losses keep stars and tier access');
let complete=fresh;
for(let i=0;i<LEAGUE.length;i++){
 const tier=LEAGUE[i];assert(ROSTER[tier.rival]);assert(ARENAS.some(a=>a.id===tier.arena));assert(BLADE_TIERS[tier.name.toUpperCase()]);
 const targetStats=Object.fromEntries(tier.goals.map(([key,n])=>[key,n]));
 assert(challengeGoals(i,targetStats,true).every(g=>g.done));
 complete=awardTier(complete,i,targetStats,true).league;
}
assert.equal(totalStars(complete),27);assert.equal(unlockedTier(complete),8);
assert.deepEqual(readLeague(JSON.parse(JSON.stringify(complete))),complete,'completed save round trips');
assert(ROSTER.every(c=>BLADE_TIERS[c.tier]));assert.equal(ROSTER[31].tier,'GOD');assert.equal(ROSTER[32].tier,'UNKNOWN');
console.log('League checks passed: legacy-safe saves, nine sequential unlocks, skill goals, best stars, loss protection, 33 historical blade tiers.');
