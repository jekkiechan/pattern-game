import {ROSTER, ROLES, SPECIALS, abilityPower} from './roster.js';
export const STEP=1/120;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rng(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export class Match {
 constructor(left,right,{seed=123,arena='stadium',difficulty='challenger',bots=false,practice=false}={}) {
  this.time=0;this.state='ready';this.arena=arena;this.radius=arena==='void'?5.1:5.7;this.baseRadius=this.radius;
  this.difficulty=difficulty;this.bots=bots;this.practice=practice;this.events=[];this.winner=null;this.reason='';this.contact=0;
  this.blades=[left,right].map((id,i)=>{
   const cfg=ROSTER[id],role=ROLES[cfg.role];
   return {id,cfg,role,x:(i?1:-1)*3.7,z:i?-.8:.8,px:(i?1:-1)*3.7,pz:i?-.8:.8,vx:0,vz:0,angle:0,prevAngle:0,
    spin:100,energy:0,burst:0,dashCD:0,guardCD:0,guard:0,rush:0,specialTime:0,specialType:'',specialHit:false,specialPower:abilityPower(cfg),
    warning:0,reaction:0,decision:1+i*.1,random:rng(seed+i*7919),orbit:i?1:-1,hitFlash:0,railCD:0,
    counterReady:0,counterRush:0,counterHit:false,perfectUsed:false,
    stats:{hits:0,guards:0,dashes:0,specials:0,damage:0,perfects:0,counters:0,rushHits:0,rails:0,cleanLaunches:0},steer:null};
  });
 }
 emit(type,data={}){this.events.push({type,t:this.time,...data});if(this.events.length>80)this.events.shift();}
 launch(quality=.5) {
  if(this.state!=='ready')return;this.state='playing';
  quality=clamp(Number.isFinite(quality)?quality:.5,0,1);
  this.blades.forEach((b,i)=>{const foe=this.blades[1-i],q=i===0?quality:.5;const d=Math.hypot(foe.x-b.x,foe.z-b.z);const speed=5.8+q*.6;b.vx=(foe.x-b.x)/d*speed;b.vz=(foe.z-b.z)/d*speed;b.energy=q>=.8?14:q>=.4?6:0;if(q>=.8)b.stats.cleanLaunches++;});
  this.emit('launch',{quality});
 }
 dash(i,target=null) {
  const b=this.blades[i],foe=this.blades[1-i];if(this.state!=='playing'||b.dashCD>0)return false;
  const dx=(target?.x??foe.x)-b.x,dz=(target?.z??foe.z)-b.z,d=Math.hypot(dx,dz)||1;
  const counter=b.counterReady>0;
  let speed=counter?11.2:10.2;if(this.arena==='rail'&&Math.hypot(b.x,b.z)>this.radius*.7&&b.railCD<=0){speed=12;b.railCD=5;b.stats.rails++;this.emit('rail',{i});}
  if(counter){b.counterRush=1;b.counterReady=0;b.counterHit=false;b.guard=0;}
  b.vx=dx/d*speed;b.vz=dz/d*speed;b.rush=counter?1:.48;b.dashCD=3.2;b.stats.dashes++;this.emit('dash',{i});return true;
 }
 guard(i) {
  const b=this.blades[i];if(this.state!=='playing'||b.guardCD>0)return false;
  b.guard=1.05;b.guardCD=3.6;b.perfectUsed=false;this.emit('guard',{i});return true;
 }
 special(i) {
  const b=this.blades[i],foe=this.blades[1-i];if(this.state!=='playing'||b.energy<100)return false;
  b.energy=0;b.stats.specials++;
  const type=b.cfg.special==='chaos'?['rush','wave','guard','mend'][Math.floor(b.random()*4)]:b.cfg.special;
  b.specialType=type;b.specialTime=SPECIALS[type].duration;b.specialHit=false;
  this.emit('special',{i,name:b.cfg.specialName,kind:type});
  if(type==='rush'){b.rush=1.5;const d=Math.hypot(foe.x-b.x,foe.z-b.z)||1;b.vx=(foe.x-b.x)/d*11;b.vz=(foe.z-b.z)/d*11;}
  if(type==='wave'){this.damage(1-i,14*b.specialPower,i,'special');const d=Math.hypot(foe.x-b.x,foe.z-b.z)||1;foe.vx+=(foe.x-b.x)/d*4;foe.vz+=(foe.z-b.z)/d*4;}
  if(type==='guard')b.spin=Math.min(100,b.spin+7*b.specialPower);
  if(type==='counter')b.spin=Math.min(100,b.spin+4*b.specialPower);
  if(type==='mend')b.spin=Math.min(100,b.spin+15*b.specialPower);
  if(type==='drain'){const taken=this.damage(1-i,8*b.specialPower,i,'special');b.spin=Math.min(100,b.spin+taken);}
  return true;
 }
 damage(i,amount,source,kind='hit') {
  const b=this.blades[i],attacker=this.blades[source];
  let value=amount*b.role.resistance;
  if(b.guard>0){
   value*=.25;b.stats.guards++;this.emit('block',{i});
   // A freshly timed shield turns an incoming rush into a counter opportunity.
   if(b.guard>=.70&&!b.perfectUsed&&(attacker.rush>0||kind==='special')){
    value*=.4;b.perfectUsed=true;b.counterReady=1.8;b.dashCD=0;
    b.energy=clamp(b.energy+12,0,100);b.stats.perfects++;this.emit('perfect',{i});
   }
  }
  if(b.specialTime>0&&b.specialType==='guard')value*=1-.65*b.specialPower;
  if(b.specialTime>0&&b.specialType==='counter'){value*=1-.35*b.specialPower;const reflected=Math.min(attacker.spin,value*.2*b.specialPower);attacker.spin=Math.max(0,attacker.spin-value*.2*b.specialPower);if(reflected>0)this.emit('special-impact',{i,target:source,kind:'counter',x:attacker.x,z:attacker.z,amount:reflected,blocked:false});}
  value=Math.min(b.spin,value);b.spin=Math.max(0,b.spin-value);b.hitFlash=.16;
  if(b.spin<=0&&(kind==='special'||attacker.rush>0))b.finishBurst=true;
  attacker.stats.damage+=value;attacker.energy=clamp(attacker.energy+value*.6,0,100);b.energy=clamp(b.energy+value*.35,0,100);
  b.burst=clamp(b.burst+value*(kind==='special'?1.2:.9),0,100);
  if(kind==='special'&&value>0)this.emit('special-impact',{i:source,target:i,kind:attacker.specialType,x:b.x,z:b.z,amount:value,blocked:b.guard>0||b.specialTime>0&&['guard','counter'].includes(b.specialType)});
  return value;
 }
 ai(i,dt) {
  const b=this.blades[i],foe=this.blades[1-i];
  const expertReflex=!this.bots&&['expert','master'].includes(this.difficulty);
  if(expertReflex&&foe.rush>.1&&Math.hypot(foe.x-b.x,foe.z-b.z)<4&&b.guardCD<=0){b.reaction+=dt;if(b.reaction>=.12)this.guard(i);}else b.reaction=0;
  if(b.warning>0){b.warning-=dt;if(b.warning<=0)this.dash(i);}
  b.decision-=dt;if(b.decision>0)return;
  const rookie=!this.bots&&this.difficulty==='rookie',expert=!this.bots&&['expert','master'].includes(this.difficulty),master=!this.bots&&this.difficulty==='master';
  b.decision=(rookie?.65:expert?.25:.4)+b.random()*.25;
  const distance=Math.hypot(foe.x-b.x,foe.z-b.z);
  if(foe.rush>.1&&distance<3.7&&b.random()<(rookie?.3:expert?.9:.65))this.guard(i);
  if(b.energy>=100&&b.spin<82&&(!master||foe.guard<=0||['mend','guard','counter'].includes(b.cfg.special)))this.special(i);
  if(master&&b.counterReady>0&&b.dashCD<=0&&foe.guard<=0){this.dash(i);return;}
  if(b.dashCD<=0&&b.warning<=0&&b.random()<(rookie?.55:.8)){
   if(master&&foe.guard>0)return;
   b.warning=rookie?.8:expert?.42:.65;this.emit('warning',{i,duration:b.warning});
  }
 }
 step(dt=STEP) {
  if(this.state!=='playing')return;
  this.time+=dt;this.contact=Math.max(0,this.contact-dt);
  if(this.time>=32&&this.time-dt<32)this.emit('finalspin');
  if(this.time>32)this.radius=Math.max(3.4,this.baseRadius-(this.time-32)*.12);
  this.blades.forEach((b,i)=>{
   const foe=this.blades[1-i];b.px=b.x;b.pz=b.z;b.prevAngle=b.angle;
   for(const k of ['dashCD','guardCD','guard','rush','specialTime','hitFlash','railCD','counterReady','counterRush'])b[k]=Math.max(0,b[k]-dt);
   b.angle+=dt*(8+Math.max(0,b.spin)*.075)*b.cfg.spin;
   b.energy=clamp(b.energy+dt*(4.4+(this.arena==='cyber'&&Math.hypot(b.x,b.z)<1.4?1.8:0)),0,100);
   b.burst=Math.max(0,b.burst-dt*2.5);
   b.spin=Math.max(0,b.spin-b.role.decay*dt*(this.time>35?1.9:1));
   if(this.bots||i===1)this.ai(i,dt);
   // Every blade shares the same autopilot. Player actions supply the advantage.
   let tx,tz;
   if(b.steer){tx=b.steer.x;tz=b.steer.z;}
   else if(b.specialTime>0&&b.specialType==='rush'&&!b.specialHit||b.counterRush>0&&!b.counterHit){tx=foe.x;tz=foe.z;}
   else {
    const dist=Math.hypot(foe.x-b.x,foe.z-b.z)||1;
    const orbit=b.guard>0?1.7:.7;
    tx=foe.x-(foe.z-b.z)/dist*orbit*b.orbit;
    tz=foe.z+(foe.x-b.x)/dist*orbit*b.orbit;
    if(Math.hypot(b.x,b.z)>this.radius*.8){tx*=.35;tz*=.35;}
   }
   const dx=tx-b.x,dz=tz-b.z,d=Math.hypot(dx,dz)||1;
   const force=b.rush>0?4:8.5;b.vx+=dx/d*force*dt;b.vz+=dz/d*force*dt;
   const friction=Math.exp(-dt*(this.arena==='glacier'?.75:1.05));b.vx*=friction;b.vz*=friction;
   const speed=Math.hypot(b.vx,b.vz),cap=b.rush>0?12:b.guard>0?b.role.speed*.75:b.role.speed;
   if(speed>cap){b.vx*=cap/speed;b.vz*=cap/speed;}
   b.x+=b.vx*dt;b.z+=b.vz*dt;
   const radius=Math.hypot(b.x,b.z),limit=this.radius-.65;
   if(radius>limit){const nx=b.x/radius,nz=b.z/radius;b.x=nx*limit;b.z=nz*limit;
    const dot=b.vx*nx+b.vz*nz;if(dot>0){b.vx-=1.65*dot*nx;b.vz-=1.65*dot*nz;if(dot>5){b.spin=Math.max(0,b.spin-.7);this.emit('wall',{i});}}
   }
   if(this.arena==='volcano'&&this.time%10>8&&radius>this.radius*.7){b.spin=Math.max(0,b.spin-dt*2.5);}
  });
  const [a,b]=this.blades,dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz),min=1.32;
  if(dist<min){const nx=dist>1e-6?dx/dist:1,nz=dist>1e-6?dz/dist:0,over=(min-dist)/2;a.x-=nx*over;a.z-=nz*over;b.x+=nx*over;b.z+=nz*over;
   const rel=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
   if(rel<0){const impulse=-rel*.94;a.vx-=nx*impulse;a.vz-=nz*impulse;b.vx+=nx*impulse;b.vz+=nz*impulse;
    if(this.contact<=0){this.contact=.23;
     const damage=1.6+Math.min(18,-rel)*.18;
     const values=[a,b].map(x=>damage*x.role.power*(x.rush>0?1.5:1));
     this.damage(0,values[1],1);this.damage(1,values[0],0);
     [a,b].forEach((x,i)=>{x.stats.hits++;if(x.rush>0)x.stats.rushHits++;
      if(x.counterRush>0&&!x.counterHit){x.counterHit=true;x.stats.counters++;this.damage(1-i,3,i);this.emit('counter',{i});}
      if(x.specialTime>0&&x.specialType==='rush'&&!x.specialHit){this.damage(1-i,14*x.specialPower,i,'special');x.specialHit=true;}x.orbit*=-1;});
     this.emit('clash',{x:(a.x+b.x)/2,z:(a.z+b.z)/2,power:-rel});
    }
   }
  }
  if(this.practice){for(const b of this.blades)b.spin=Math.max(25,b.spin);return;}
  const out=this.blades.map(b=>b.spin<=0);
  if(out.some(Boolean)||this.time>=50){
   this.state='over';this.winner=out[0]&&out[1]?null:out[0]?1:out[1]?0:Math.abs(a.spin-b.spin)<.5?null:a.spin>b.spin?0:1;
   this.reason=this.blades.some(b=>b.finishBurst)?'Burst finish':this.time>=50?'Spin remaining':'Spin finish';this.emit('finish',{winner:this.winner});
  }
 }
}
