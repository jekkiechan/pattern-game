// Authored story and save transitions. Kept independent of the DOM and battle simulation.
export const JOURNEY_KEY = 'patternTrainerJourney';
export const COMPANIONS = [
 {id:0,style:'The brave heart',tip:'Attack · Rush in and make your openings count.'},
 {id:6,style:'The steady guardian',tip:'Defense · Read a rush, guard, then answer.'},
 {id:11,style:'The patient spirit',tip:'Stamina · Keep your rhythm and outlast your rival.'}
];
export const CHARACTERS = {
 sora:{name:'Sora',role:'Workshop keeper',mark:'S',color:'#d5bb83'},
 ren:{name:'Ren',role:'Your traveling rival',mark:'R',color:'#df9d91'},
 mio:{name:'Mio',role:'Forest courier',mark:'M',color:'#9cc4b2'},
 aki:{name:'Aki',role:'Railway engineer',mark:'A',color:'#9ebbd3'},
 yuki:{name:'Yuki',role:'Keeper of the lake',mark:'Y',color:'#b4c8de'},
 kaede:{name:'Kaede',role:'Mountain guardian',mark:'K',color:'#d9aa82'},
 narrator:{name:'The wind road',role:'Journey',mark:'✦',color:'#cbb887'},
 trainer:{name:'{name}',role:'Bey trainer',mark:'◆',color:'#e2ce9c'}
};
const line=(speaker,text)=>({speaker,text});
export const CHAPTERS = [
 {place:'Hoshimi Village',title:'A first spark',subtitle:'Every journey begins with someone who believes in you.',seal:'Spark',rival:15,character:'ren',arena:'stadium',difficulty:'rookie',color:'#c8ae77',x:12,y:77,
  objective:'Meet Ren at the village ring. Win a first-to-two duel to earn the Spark seal.',
  recap:'You and Ren left Hoshimi with a promise: reach the summit together.',
  before:[line('narrator','Paper lanterns sway outside Sora’s workshop. Beyond the gate, an old road climbs toward the silent Sky Spire.'),line('sora','{name}, {blade} is yours now. A Bey is a partner. Learn its rhythm, and let it learn yours.'),{speaker:'ren',text:'Six wind seals open the Spire. I’m going after them. What are you hoping to find out there?',choices:[{id:'wonder',label:'A world I haven’t seen.',reply:'Then take the long way with me. I hear even the forests have stadiums.'},{id:'courage',label:'The courage to face anyone.',reply:'Good. But promise we’ll help each other up when we lose.'}]},line('ren','One friendly duel before we go? Two rounds wins it. Watch for my rush, guard, then dash back!')],
  after:[line('ren','Okay, that was a real spark! I’ll have to practice on the road.'),line('sora','The Spark seal is yours. Follow the cedar path. And remember: a rival can be a friend you haven’t caught up with yet.'),line('trainer','Come on, {blade}. Let’s see what’s beyond the gate.')]
 },
 {place:'Whispering Cedars',title:'Listen to the forest',subtitle:'Between the trees, even silence has a rhythm.',seal:'Root',rival:6,character:'mio',arena:'stadium',difficulty:'rookie',color:'#8eb6a0',x:29,y:52,
  objective:'Help Mio test the cedar ring. Win her duel to earn the Root seal.',
  recap:'Mio taught you that listening is its own kind of strength.',
  before:[line('narrator','Sunlight falls in narrow ribbons. A courier kneels beside a wooden stadium, gathering letters scattered by the wind.'),line('mio','Thanks for stopping to help. Most trainers just run past on their way to the Spire.'),{speaker:'mio',text:'Before we battle, listen. What do you hear?',choices:[{id:'leaves',label:'The leaves, moving together.',reply:'Exactly. A guard works the same way: meet the force, then let it pass.'},{id:'bey',label:'My Bey, waiting to launch.',reply:'It sounds eager! Let the other blade rush first, then find your reply.'}]},line('mio','I keep the Root seal. Show me you can listen to a rival’s movements. I’ll use Knight Shield.')],
  after:[line('mio','You waited for the right moment. The forest would approve.'),line('ren','I took a shortcut. It was… mostly mud. Please don’t tell Sora.'),line('mio','Take the Root seal and follow the tracks east. Aki will know how to get you across the ravine.')]
 },
 {place:'Lantern Crossing',title:'A bridge of light',subtitle:'Some roads only appear when you dare to move.',seal:'Rail',rival:2,character:'aki',arena:'rail',difficulty:'challenger',color:'#c9a269',x:46,y:69,
  objective:'Challenge Aki on the rail arena. Dash near the rim for a boost.',
  recap:'You lit the crossing and found a route through the mountain pass.',
  before:[line('narrator','The last train has gone. Across the ravine, lanterns blink along an unfinished bridge.'),line('aki','The crossing opens at dusk. Until then, want to try the station’s rail stadium?'),line('ren','{motive}'),{speaker:'aki',text:'The rail carries your dash faster. How will you approach it?',choices:[{id:'bold',label:'Find a line along the rim.',reply:'A bold route. Dash near the outer rail and it will carry your momentum.'},{id:'careful',label:'Watch your route first.',reply:'Smart. When you see my rush begin, prepare your guard. Then answer.'}]},line('aki','No stronger blades here. Just a different stadium and a new way to read it. Ready?')],
  after:[line('aki','There it is. Your own line through the noise. The Rail seal belongs to you.'),line('narrator','One by one, the bridge lanterns glow. You and Ren cross beneath a sky full of unfamiliar stars.'),line('ren','When we get to the top, let’s remember this part too. Not just who wins.')]
 },
 {place:'Mirror Lake',title:'Still water, steady heart',subtitle:'The mountain asks you to slow down.',seal:'Mist',rival:11,character:'yuki',arena:'glacier',difficulty:'challenger',color:'#9cbcc8',x:64,y:44,
  objective:'Face Yuki on the ice. Steer toward the center and guard incoming rushes.',
  recap:'At Mirror Lake, you learned to trust your partner when the ground shifted.',
  before:[line('narrator','Mist hangs over a frozen lake. Beneath the ice, the reflection of the Spire seems impossibly close.'),line('yuki','You’ve been watching the summit. Have you noticed how far you’ve already come?'),{speaker:'yuki',text:'What do you trust when the ground moves beneath you?',choices:[{id:'partner',label:'My partner’s rhythm.',reply:'Then listen to it. The ice carries your movement farther than you expect.'},{id:'friends',label:'The people beside me.',reply:'A wise answer. Let their encouragement steady you, then choose your own moment.'}]},line('yuki','The Mist seal waits in this ring. Stay near the center, and let each movement mean something.')],
  after:[line('yuki','A steady heart doesn’t mean never being afraid. It means choosing your next step anyway.'),line('trainer','We did it, {blade}. Even on the ice.'),line('yuki','Take the Mist seal. Kaede tends the last fire before the summit. Tell her the lake is clear tonight.')]
 },
 {place:'Ember Pass',title:'The fire we carry',subtitle:'Warmth is something you can share.',seal:'Ember',rival:28,character:'kaede',arena:'volcano',difficulty:'expert',color:'#cb927c',x:79,y:61,
  objective:'Earn Kaede’s Ember seal. Keep clear when the outer ring glows hot.',
  recap:'Kaede gave you the Ember seal, and you helped Ren find the courage to continue.',
  before:[line('narrator','Ash drifts like soft snow. At the mountain shelter, Ren sits beside a lantern with a scratched launcher.'),line('ren','I lost to Kaede. Twice. Maybe I’m just the person who follows the real trainer.'),{speaker:'trainer',replySpeaker:'ren',text:'You sit beside Ren.',choices:[{id:'together',label:'We said we’d reach the top together.',reply:'You remembered. All right. I can try again.'},{id:'practice',label:'Let’s practice one launch at a time.',reply:'One launch. I can do that. Thanks, {name}.'}]},line('kaede','That is a kind of strength no medal measures. Now show me your timing. When the rim glows, keep to the center.')],
  after:[line('kaede','The Ember seal. Carry its warmth, not its weight.'),line('ren','I did it too! On the third try. The guard finally clicked.'),line('narrator','Together, you climb the final stair. Five seals hum softly. The last one waits where the road meets the sky.')]
 },
 {place:'The Sky Spire',title:'A promise at dawn',subtitle:'At the end of the road, a new beginning.',seal:'Sky',rival:31,character:'ren',arena:'cyber',difficulty:'expert',color:'#cbb88f',x:87,y:18,
  objective:'Face Ren at the summit. Hold the glowing center to charge your special.',
  recap:'Six seals, one shared sunrise. You and your partner became Wind Road champions.',
  before:[line('narrator','The Spire’s doors open to the morning. There is no throne. Just a stadium and a view of every place you’ve been.'),line('ren','Sora told me the final seal belongs to two trainers willing to give each other their best.'),line('trainer','{memory}'),{speaker:'ren',text:'So, {name}. One more duel?',choices:[{id:'promise',label:'Let’s make it a battle to remember.',reply:'All the way, then. No holding back, and no regrets.'},{id:'friend',label:'Rivals today. Friends all the way.',reply:'Friends all the way. Now let’s see how far we’ve come!'}]},line('ren','The center charges your special faster. You know my rush. I know your guard. Let’s make a new pattern.')],
  after:[line('narrator','The final clash rings out across the valley. Six seals catch the sunrise, and the wind road shines below.'),line('ren','You and {blade} earned that. Wind Road champion. Has a nice ring to it, doesn’t it?'),line('sora','A message from home: “The workshop light is always on. Tell me everything when you return.”'),line('trainer','{ending}'),line('narrator','Your first journey is complete. The places you changed, and the friends who changed you, will be here whenever you return.')]
 }
];
export function freshJourney(){return {version:1,name:'',starter:null,completed:0,choices:{},scene:null};}
export function readJourney(value){
 const s=freshJourney();
 if(!value||value.version!==1||!COMPANIONS.some(c=>c.id===value.starter))return s;
 s.name=typeof value.name==='string'?value.name.replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,20)||'Trainer':'Trainer';
 s.starter=value.starter;s.completed=Number.isInteger(value.completed)?Math.max(0,Math.min(CHAPTERS.length,value.completed)):0;
 for(let i=0;i<CHAPTERS.length;i++){
  const choice=CHAPTERS[i].before.find(l=>l.choices)?.choices.find(c=>c.id===value.choices?.[i]);
  if(choice)s.choices[i]=choice.id;
 }
 const v=value.scene;
 if(v&&Number.isInteger(v.chapter)&&v.chapter>=0&&v.chapter<CHAPTERS.length&&v.chapter<=s.completed&&['before','after'].includes(v.part)&&(v.part!=='after'||v.chapter<s.completed)){
  const lines=CHAPTERS[v.chapter][v.part];
  s.scene={chapter:v.chapter,part:v.part,line:Number.isInteger(v.line)?Math.max(0,Math.min(lines.length-1,v.line)):0};
  // Invalid/corrupt saves cannot skip the conversation's unanswered choice.
  const choiceAt=lines.findIndex(l=>l.choices);
  if(choiceAt>=0&&!s.choices[v.chapter])s.scene.line=Math.min(s.scene.line,choiceAt);
 }
 return s;
}
export function beginJourney(name,starter){return readJourney({...freshJourney(),name,starter,scene:{chapter:0,part:'before',line:0}});}
export function visitChapter(value,index){
 const s=readJourney(value);
 if(s.starter===null||!Number.isInteger(index)||index<0||index>=CHAPTERS.length||index>s.completed)return s;
 s.scene={chapter:index,part:'before',line:0};return s;
}
export function chooseDialogue(value,id){
 const s=readJourney(value),scene=s.scene,line=scene&&CHAPTERS[scene.chapter][scene.part][scene.line];
 if(line?.choices?.some(c=>c.id===id))s.choices[scene.chapter]=id;
 return s;
}
export function advanceDialogue(value){
 const s=readJourney(value);if(!s.scene)return {state:s,action:'map'};
 const {chapter,part,line}=s.scene,lines=CHAPTERS[chapter][part];
 if(lines[line].choices&&!s.choices[chapter])return {state:s,action:'choice'};
 if(line<lines.length-1){s.scene.line++;return {state:s,action:'dialogue'};}
 if(part==='before')return {state:s,action:'battle',chapter};
 s.scene=null;return {state:s,action:'map'};
}
export function finishJourneyDuel(value,index,won){
 const s=readJourney(value);
 if(!won||s.starter===null||!Number.isInteger(index)||index<0||index>=CHAPTERS.length||index>s.completed)return s;
 s.completed=Math.max(s.completed,index+1);s.scene={chapter:index,part:'after',line:0};return s;
}
export function storyText(text,state,blade){
 const motive=state.choices[0]==='courage'?'You said you wanted courage. I think crossing this bridge counts.':'This is the world you wanted to see. Pretty good so far, right?';
 const memory=state.choices[4]==='practice'?'One launch at a time. Just like we practiced.':'We promised we’d reach the top together. Here we are.';
 const ending=state.choices[0]==='courage'?'I came looking for courage. I found it in every friend who helped me try again.':'I wanted to see the world. Now every place on the map feels like someone I know.';
 return text.replace(/\{(name|blade|motive|memory|ending)\}/g,(_,key)=>({name:state.name,blade,motive,memory,ending})[key]);
}
