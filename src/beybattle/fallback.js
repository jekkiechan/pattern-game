// Canvas compatibility renderer uses the same simulation and controls when WebGL is unavailable.
import {ROSTER,ARENAS} from './roster.js';
import {emblem} from './models.js';
const TAU=Math.PI*2;
export class CanvasDisplay {
 constructor(canvas,{low=false,motion=true}={}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.low=low;this.motion=motion;this.mode='studio';this.hero={rotation:{y:0},userData:{cfg:ROSTER[0]}};this.width=1;this.height=1;this.sprites=new Map();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);this.resize();}
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();if(!r.width||!r.height)return;this.width=r.width;this.height=r.height;const d=Math.min(devicePixelRatio,this.low?1:1.5);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.unit=Math.min(this.width/13.4,this.height/11);}
 quality(low){this.low=low;this.resize();}
 select(id){this.mode='studio';this.hero.userData.cfg=ROSTER[id];this.resize();}
 battle(match){this.mode='battle';this.match=match;this.resize();}
 thumbnail(id){return emblem(ROSTER[id],128).image.toDataURL('image/webp',.8);}
 sprite(id){if(this.sprites.has(id))return this.sprites.get(id);const cfg=ROSTER[id],c=document.createElement('canvas');c.width=c.height=384;const x=c.getContext('2d');x.translate(192,192);const R=138;
 const ring=x.createLinearGradient(-R,-R,R,R);ring.addColorStop(0,'#ecf3ff');ring.addColorStop(.25,'#71839b');ring.addColorStop(.5,'#ccdbeb');ring.addColorStop(1,'#35475f');
 x.fillStyle='#172337';x.beginPath();x.arc(0,0,R*.74,0,TAU);x.fill();
 for(let i=0;i<40;i++){x.save();x.rotate(i*TAU/40);x.fillStyle=ring;x.fillRect(R*.69,-4,R*.11,8);x.restore();}
 for(let i=0;i<cfg.wings;i++){x.save();x.rotate(i*TAU/cfg.wings);x.beginPath();x.moveTo(R*.24,-R*.12);x.bezierCurveTo(R*.5,-R*.5,R*.9,-R*.62,R*1.08,-R*.32);x.bezierCurveTo(R*1.2,0,R*.9,R*.2,R*.65,R*.25);x.lineTo(R*.83,R*.35);x.lineTo(R*.27,R*.12);x.closePath();x.fillStyle=ring;x.fill();x.strokeStyle='#d7e5f2';x.lineWidth=2;x.stroke();
 x.beginPath();x.moveTo(R*.48,-R*.33);x.quadraticCurveTo(R*.81,-R*.51,R*.99,-R*.28);x.lineTo(R*.86,-R*.16);x.quadraticCurveTo(R*.69,-R*.32,R*.52,-R*.18);x.closePath();x.fillStyle=cfg.color;x.fill();x.strokeStyle=cfg.accent;x.stroke();
 x.fillStyle='#0b1423';x.beginPath();x.ellipse(R*.68,0,R*.15,R*.07,-.1,0,TAU);x.fill();x.fillStyle='#d6c083';x.beginPath();x.arc(R*.58,R*.14,4,0,TAU);x.fill();x.restore();}
 x.fillStyle=ring;x.beginPath();x.arc(0,0,R*.5,0,TAU);x.fill();x.strokeStyle=cfg.accent;x.lineWidth=7;x.beginPath();x.arc(0,0,R*.45,0,TAU);x.stroke();x.drawImage(emblem(cfg,256).image,-R*.39,-R*.39,R*.78,R*.78);
 this.sprites.set(id,c);return c;}
 snapshot(id){return this.sprite(id).toDataURL('image/webp',.85);}
 point(cx,cy){const r=this.canvas.getBoundingClientRect();return {x:(cx-r.left-this.width/2)/this.unit,z:(cy-r.top-this.height/2)/(this.unit*.8)};}
 project(x,z){return {x:this.width/2+x*this.unit,y:this.height/2+z*this.unit*.8};}
 event(){}
 render(dt,alpha=1){const x=this.ctx,w=this.width,h=this.height;x.clearRect(0,0,w,h);
 if(this.mode==='studio'){if(this.motion)this.hero.rotation.y+=dt*.16;const size=Math.min(w*.93,h*.93);x.save();x.translate(w/2,h/2);x.scale(1,.78);x.rotate(this.hero.rotation.y);x.shadowColor='#0008';x.shadowBlur=25;x.shadowOffsetY=20;x.drawImage(this.sprite(this.hero.userData.cfg.id),-size/2,-size/2,size,size);x.restore();return;}
 const ar=ARENAS.find(a=>a.id===this.match.arena);x.save();x.translate(w/2,h/2);x.scale(this.unit,this.unit*.8);
 const grad=x.createRadialGradient(-2,-3,0,0,0,6);grad.addColorStop(0,'#364b65');grad.addColorStop(1,'#15253a');x.fillStyle=grad;x.beginPath();x.arc(0,0,6.1,0,TAU);x.fill();x.lineWidth=.2;x.strokeStyle='#7f95b0';x.stroke();x.lineWidth=.035;x.strokeStyle=ar.color;x.beginPath();x.arc(0,0,5.85,0,TAU);x.stroke();
 x.strokeStyle='#a9c4df22';x.lineWidth=.015;for(let r=1;r<6;r++){x.beginPath();x.arc(0,0,r,0,TAU);x.stroke();}x.fillStyle='#bacbdf44';x.textAlign='center';x.font='italic 900 .5px Arial';x.fillText('BEYBATTLE',0,.1);x.restore();
 this.match.blades.forEach((b,i)=>{const p=this.project(b.px+(b.x-b.px)*alpha,b.pz+(b.z-b.pz)*alpha);x.save();x.translate(p.x,p.y);x.strokeStyle=b.guard>0?'#e0f5ff':i?'#ff9b75':'#82c9ff';x.lineWidth=2;x.beginPath();x.ellipse(0,0,this.unit*.85,this.unit*.7,0,0,TAU);x.stroke();x.scale(1,.8);x.rotate(b.prevAngle+(b.angle-b.prevAngle)*alpha);x.drawImage(this.sprite(b.id),-this.unit,-this.unit,this.unit*2,this.unit*2);x.restore();});}
 stats(){return {backend:'canvas2d',textures:this.sprites.size};}
}
