// League medals describe completed challenges, never hidden stat bonuses.
export const LEAGUE = [
 {name:'Novice',rival:15,arena:'stadium',difficulty:'rookie',theme:'First sparks',tip:'Learn the rhythm: dash in, then guard the reply.',goals:[['rushHits',2,'Land 2 dash hits'],['guards',1,'Block 1 hit']]},
 {name:'Apprentice',rival:16,arena:'stadium',difficulty:'rookie',theme:'Find your timing',tip:'Watch the orange warning. Guard as the rush begins.',goals:[['guards',2,'Block 2 hits'],['cleanLaunches',1,'Make 1 clean launch']]},
 {name:'Advanced',rival:17,arena:'cyber',difficulty:'challenger',theme:'Power at the center',tip:'The glowing center charges your special faster. Steer in to claim it.',goals:[['specials',1,'Use your special'],['rushHits',3,'Land 3 dash hits']]},
 {name:'Elite',rival:2,arena:'rail',difficulty:'challenger',theme:'Ride the lightning',tip:'Dash near the rim for a rail boost. Guard when your rival does the same.',goals:[['rails',1,'Ride the rail once'],['guards',2,'Block 2 hits']]},
 {name:'Champion',rival:0,arena:'glacier',difficulty:'challenger',theme:'Keep your cool',tip:'The icy floor carries your momentum. A late guard opens a counter.',goals:[['perfects',1,'Make a perfect guard'],['specials',2,'Use 2 specials']]},
 {name:'Legendary',rival:28,arena:'volcano',difficulty:'expert',theme:'Into the fire',tip:'Keep away from the glowing rim. Counter after a perfect guard.',goals:[['counters',1,'Land a counter-dash'],['guards',3,'Block 3 hits']]},
 {name:'Mythical',rival:20,arena:'void',difficulty:'expert',theme:'Close encounters',tip:'Space is tight. Wait for a guard to fade before you strike.',goals:[['perfects',2,'Make 2 perfect guards'],['rushHits',4,'Land 4 dash hits']]},
 {name:'Transcendent',rival:30,arena:'cyber',difficulty:'master',theme:'The dragon’s test',tip:'This rival saves its special and reads your rush. Mix your timing.',goals:[['counters',2,'Land 2 counter-dashes'],['specials',2,'Use 2 specials']]},
 {name:'God',rival:31,arena:'stadium',difficulty:'master',theme:'Master the pattern',tip:'The final rival waits for openings. Guard, counter, then unleash your special.',goals:[['perfects',3,'Make 3 perfect guards'],['counters',2,'Land 2 counter-dashes']]}
];

export function readLeague(value){
 const medals=LEAGUE.map((_,i)=>Math.max(0,Math.min(3,Number.isInteger(value?.medals?.[i])?value.medals[i]:0)));
 // A later unlock must follow a completed earlier challenge.
 let gap=false;for(let i=0;i<medals.length;i++){if(gap)medals[i]=0;if(!medals[i])gap=true;}
 return {version:1,medals};
}
export function unlockedTier(league){const first=league.medals.findIndex(n=>n===0);return first<0?LEAGUE.length-1:first;}
export function totalStars(league){return league.medals.reduce((a,b)=>a+b,0);}
export function challengeGoals(index,stats={},won=false){return [
 {label:'Win the duel',done:won,value:won?1:0,target:1},
 ...LEAGUE[index].goals.map(([key,target,label])=>({label,done:(stats[key]||0)>=target,value:Math.min(target,stats[key]||0),target}))
 ];}
export function awardTier(league,index,stats,won){
 const next=readLeague(league),goals=challengeGoals(index,stats,won);
 if(!won||index>unlockedTier(next))return {league:next,stars:0,improved:false,goals};
 const stars=goals.filter(g=>g.done).length,improved=stars>next.medals[index];
 next.medals[index]=Math.max(next.medals[index],stars);
 return {league:next,stars,improved,goals};
}
export function addStats(total,stats){for(const key of ['hits','guards','dashes','specials','damage','perfects','counters','rushHits','rails','cleanLaunches'])total[key]=(total[key]||0)+(stats[key]||0);return total;}
