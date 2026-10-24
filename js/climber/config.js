'use strict';
const $ = id => document.getElementById(id);
const canvas = $('game');
let ctx = canvas.getContext('2d');
const W = 400, GROUND = 560, PLAT_H = 13, GRAVITY = .34, JUMP = -9.1;
let H = 600, scale = 1;
const WORLDS = [
 {name:'First Flight',symbol:'◈',color:'#183f50',accent:'#9df0d0',sky:['#123449','#214d60']},
 {name:'Cloud Gardens',symbol:'☁',color:'#24445d',accent:'#a5d9ff',sky:['#17394e','#37637a']},
 {name:'Ember Peaks',symbol:'♨',color:'#593936',accent:'#ffbe94',sky:['#392536','#6d4145']},
 {name:'Aurora Rise',symbol:'❖',color:'#3b345a',accent:'#d0b6ff',sky:['#222a4c','#453f72']},
 {name:'Star Sanctuary',symbol:'✦',color:'#394e5a',accent:'#ffe096',sky:['#15273b','#31465c']}
];
const CLIMB_TIERS = [{name:'Novice',at:0},{name:'Apprentice',at:2},{name:'Elite',at:4},{name:'Champion',at:6},{name:'Legendary',at:8},{name:'God',at:10}];
const BLADES = [
 {id:'comet',name:'Comet',symbol:'➤',tip:'Quick turns. Precise landings.',force:.74,drag:.87,burst:-11.5,pickup:29,color:'#98d8ff'},
 {id:'nimbus',name:'Nimbus',symbol:'☁',tip:'Gentle steering. Reach stars more easily.',force:.55,drag:.88,burst:-11.5,pickup:40,color:'#a5f0d5'},
 {id:'volt',name:'Volt',symbol:'ϟ',tip:'A bigger burst. More momentum.',force:.59,drag:.89,burst:-13,pickup:29,color:'#ffe096'}
];
// Hand-authored routes introduce one idea at a time. Each character is one landing:
// n steady, m moving, f crumble, b spring, c checkpoint. No mandatory burst gaps.
const STAGES = [
 {name:'Launchpad',route:'nnnncnnnn',x:[200,155,105,160,205,260,305,250,190],gap:77,hint:'Hold ← or →. Your blade bounces by itself.'},
 {name:'Star Trail',route:'nnnbncnnnnn',x:[220,280,225,165,110,165,225,280,225,165,210],gap:80,hint:'Land in a platform’s bright center to charge your burst.'},
 {name:'Cloud Cruise',route:'nnmnncmnnmn',x:[150,205,265,220,160,110,165,225,285,235,180],gap:81,hint:'Blue platforms drift. Aim where they are going.'},
 {name:'Spring Garden',route:'nbnmncbnmnnb',x:[205,145,100,165,225,280,225,165,110,170,230,185],gap:82,hint:'Gold springs send you higher. Steer gently on the way down.'},
 {name:'Ember Steps',route:'nnfnncfnbnnfn',x:[170,110,165,225,285,230,170,110,165,225,280,220,165],gap:84,hint:'Pink platforms crumble after a bounce, then return.'},
 {name:'Sunset Sprint',route:'nmfnbcnmnfnbnn',x:[230,285,225,165,110,165,225,280,225,165,110,170,225,180],gap:85,hint:'Chain new center landings. Three clean landings refill a burst.'},
 {name:'Aurora Drift',route:'nmnbncmmnfnbnn',x:[155,110,170,230,285,230,170,115,175,235,285,225,170,225],gap:87,hint:'A gentle crosswind comes in waves. Watch the sky arrows.'},
 {name:'Prism Passage',route:'nfmnbcnmfbnmnfn',x:[225,280,225,165,110,165,225,280,225,170,110,165,225,180,230],gap:88,hint:'Save a burst for a tricky landing. Stars recharge it too.'},
 {name:'Orbit Run',route:'nmbnfcnmnbfnmnn',x:[155,105,165,225,285,225,165,110,170,230,280,220,160,210,165],gap:90,hint:'Read the wind, follow the stars, and choose your next landing.'},
 {name:'The Sky Crown',route:'nmfbncnmfbnmnfnnn',x:[225,280,225,165,110,165,225,280,220,160,110,170,230,280,225,180,230],gap:91,hint:'Your final climb. Every skill has a moment to shine.'}
];
STAGES.forEach((s,i)=>{s.world=Math.floor(i/2);s.width=i<2?100:i<6?90:82;s.stars=5+Math.floor(i/2);});
function rankFor(cleared){return CLIMB_TIERS.filter(t=>cleared>=t.at).at(-1);}
function resize(){
 const layout=document.querySelector('.game-layout');
 const landscape=innerHeight<=500&&innerWidth>=600;
 H=landscape?400:600;
 const availableH=layout.clientHeight||Math.max(220,innerHeight-230);
 const availableW=innerWidth<=700?innerWidth-28:Math.min(500,layout.clientWidth-(innerWidth>1000?440:innerWidth>700&&!landscape?210:0));
 scale=Math.max(.2,Math.min(availableW/W,availableH/H,1.25));
 const dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(W*scale*dpr);canvas.height=Math.round(H*scale*dpr);
 canvas.style.width=W*scale+'px';canvas.style.height=H*scale+'px';
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 if(typeof player!=='undefined'&&player){camera=Math.min(GROUND-H+50,player.y-H*.55);previousCamera=camera;}
}
window.addEventListener('resize',resize);
