export class Sound {
 constructor(enabled=true){this.enabled=enabled;this.context=null;this.lastHit=0;}
 start(){try{if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.25;this.master.connect(this.context.destination);}if(this.context.state==='suspended')this.context.resume().catch(()=>{});return true;}catch{return false;}}
 play(kind){if(!this.enabled||!this.start())return;const c=this.context,t=c.currentTime;if(kind==='clash'&&t-this.lastHit<.07)return;if(kind==='clash')this.lastHit=t;
 const spec={clash:[230,65,.13,'triangle'],dash:[170,600,.12,'sine'],guard:[740,370,.16,'sine'],block:[900,450,.12,'triangle'],perfect:[660,1320,.24,'sine'],counter:[440,1100,.2,'triangle'],special:[320,1200,.35,'sine'],launch:[160,650,.3,'sawtooth'],win:[520,1040,.5,'sine'],lose:[260,130,.45,'sine']}[kind];if(!spec)return;
 const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(this.master);
 o.type=spec[3];o.frequency.setValueAtTime(spec[0],t);o.frequency.exponentialRampToValueAtTime(spec[1],t+spec[2]);g.gain.setValueAtTime(kind==='launch'?.12:.23,t);g.gain.exponentialRampToValueAtTime(.001,t+spec[2]);o.start(t);o.stop(t+spec[2]);o.onended=()=>{o.disconnect();g.disconnect();};
 }
}
