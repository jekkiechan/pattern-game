import {readLeague} from './progression.js';
import {readJourney} from './journey.js';

export const SLOTS=['beybattleLeague','patternTrainerJourney'];
export function validateProgress(slot,value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid progress');
 if(slot==='patternTrainerJourney')return readJourney(value);
 if(slot!=='beybattleLeague')throw new Error('Unknown save');
 const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,100000000):0;
 return {
  wins:count(value.wins),trophies:count(value.trophies),league:readLeague(value.league),trained:!!value.trained,
  player:Number.isInteger(value.player)&&value.player>=0&&value.player<33?value.player:0,
  arena:['stadium','rail','glacier','volcano','cyber','void'].includes(value.arena)?value.arena:'stadium',
  difficulty:['rookie','challenger','expert'].includes(value.difficulty)?value.difficulty:'rookie',
  sound:value.sound!==false,motion:value.motion!==false,low:!!value.low
 };
}
