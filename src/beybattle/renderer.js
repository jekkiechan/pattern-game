import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {makeBlade,floorTexture,emblem,releaseModelTexture} from './models.js';
import {ROSTER,ARENAS} from './roster.js';
const TAU=Math.PI*2;
export class Display {
 constructor(canvas,{low=false,motion=true}={}){
  this.canvas=canvas;this.low=low;this.motion=motion;this.mode='studio';this.models=new Map();this.spin=0;this.events=[];
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.7));this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.93;
  this.scene=new T.Scene();const pmrem=new T.PMREMGenerator(this.renderer);const env=new RoomEnvironment();this.env=pmrem.fromScene(env,.04).texture;this.scene.environment=this.env;this.scene.environmentIntensity=.7;env.dispose();pmrem.dispose();
  this.scene.add(new T.HemisphereLight('#dcecff','#233044',.9));
  const light=new T.DirectionalLight('#ffffff',2.2);light.position.set(-3,7,5);this.scene.add(light);
  const rim=new T.DirectionalLight('#80b9ff',1.1);rim.position.set(4,2,-4);this.scene.add(rim);
  this.camera=new T.OrthographicCamera(-4,4,3,-3,.1,100);
  this.studio=new T.Group();this.world=new T.Group();this.scene.add(this.studio,this.world);this.world.visible=false;
  const pedestal=new T.Mesh(new T.CylinderGeometry(1.65,1.8,.2,96),new T.MeshStandardMaterial({color:'#15253b',metalness:.6,roughness:.4}));pedestal.position.y=-.6;this.studio.add(pedestal);
  const trim=new T.Mesh(new T.TorusGeometry(1.66,.014,6,96),new T.MeshBasicMaterial({color:'#6a8eae'}));trim.rotation.x=Math.PI/2;trim.position.y=-.5;this.studio.add(trim);
  this.shadowTexture=this.makeShadow();this.shadow=new T.Mesh(new T.PlaneGeometry(3,3),new T.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.position.y=-.48;this.studio.add(this.shadow);
  this.particles=Array.from({length:128},()=>({life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0}));
  const pos=new Float32Array(128*3);const colors=new Float32Array(128*3);this.particleGeo=new T.BufferGeometry();this.particleGeo.setAttribute('position',new T.BufferAttribute(pos,3));this.particleGeo.setAttribute('color',new T.BufferAttribute(colors,3));
  this.points=new T.Points(this.particleGeo,new T.PointsMaterial({size:.09,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));this.points.frustumCulled=false;this.world.add(this.points);
  this.effects=[];for(let i=0;i<10;i++){const m=new T.Mesh(new T.RingGeometry(.9,1,64),new T.MeshBasicMaterial({color:'#8bcaff',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;this.world.add(m);this.effects.push({mesh:m,life:0,max:1});}
  this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.mouse=new T.Vector2();this.vec=new T.Vector3();
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
  this.select(0);this.resize();
 }
 makeShadow(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,5,64,64,62);g.addColorStop(0,'#000b');g.addColorStop(.5,'#0005');g.addColorStop(1,'#0000');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
 model(id){if(!this.models.has(id))this.models.set(id,makeBlade(ROSTER[id]));return this.models.get(id);}
 select(id){this.mode='studio';this.studio.visible=true;this.world.visible=false;if(this.hero)this.studio.remove(this.hero);this.hero=this.model(id);this.hero.position.set(0,.08,0);this.hero.scale.setScalar(1.35);this.hero.rotation.set(.1,0,.05);this.studio.add(this.hero);this.resize();this.trimModels();}
 resize(){const rect=this.canvas.parentElement.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
  this.width=rect.width;this.height=rect.height;this.renderer.setSize(rect.width,rect.height,false);
  const aspect=rect.width/rect.height;let span;
  if(this.mode==='studio'){span=Math.max(4.4,4.0/aspect);this.camera.position.set(3.5,5.8,6.8);this.camera.lookAt(0,0,0);}
  else {span=Math.max(12.9,12.9/aspect);this.camera.position.set(0,14.5,9.8);this.camera.lookAt(0,0,0);}
  this.camera.left=-span*aspect/2;this.camera.right=span*aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();
 }
 quality(low){this.low=low;this.renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.7));this.resize();}
 arena(arena){
  if(this.stadium){this.world.remove(this.stadium);this.stadium.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.map)o.material.map.dispose();o.material.dispose();}});}
  const stadium=new T.Group();this.stadium=stadium;this.world.add(stadium);
  const metal=new T.MeshStandardMaterial({color:'#7a8a9e',metalness:.82,roughness:.34}),base=new T.MeshStandardMaterial({color:'#132239',metalness:.6,roughness:.4});
  const disk=new T.Mesh(new T.CylinderGeometry(6.1,6.4,.5,96),base);disk.position.y=-.35;stadium.add(disk);
  const floor=new T.Mesh(new T.CircleGeometry(5.7,96),new T.MeshStandardMaterial({map:floorTexture(arena),metalness:.25,roughness:.55}));floor.rotation.x=-Math.PI/2;floor.position.y=-.075;stadium.add(floor);
  for(const [r,t,y]of [[5.9,.15,.05],[6.22,.035,-.18],[5.72,.025,.035]]){const ring=new T.Mesh(new T.TorusGeometry(r,t,10,128),metal);ring.rotation.x=Math.PI/2;ring.position.y=y;stadium.add(ring);}
  const led=new T.MeshBasicMaterial({color:arena.color});const seg=new T.InstancedMesh(new T.BoxGeometry(.035,.045,.36),led,64),dummy=new T.Object3D();
  for(let i=0;i<64;i++){const a=i*TAU/64;dummy.position.set(Math.cos(a)*5.93,.20,Math.sin(a)*5.93);dummy.rotation.set(0,-a,0);dummy.updateMatrix();seg.setMatrixAt(i,dummy.matrix);}stadium.add(seg);
  // Outer stadium ribs make the bowl feel constructed rather than a floating ring.
  const ribs=new T.InstancedMesh(new T.BoxGeometry(.22,.35,.05),metal,48);
  for(let i=0;i<48;i++){const a=i*TAU/48;dummy.position.set(Math.cos(a)*6.25,-.37,Math.sin(a)*6.25);dummy.rotation.set(0,-a,0);dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);}stadium.add(ribs);
  this.boundary=new T.Mesh(new T.TorusGeometry(1,.008,4,96),new T.MeshBasicMaterial({color:'#fa9872',transparent:true,opacity:0}));this.boundary.rotation.x=Math.PI/2;this.boundary.position.y=.02;stadium.add(this.boundary);
  this.heat=new T.Mesh(new T.RingGeometry(4,5.68,96),new T.MeshBasicMaterial({color:'#fc7d40',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));this.heat.rotation.x=-Math.PI/2;this.heat.position.y=-.06;stadium.add(this.heat);
 }
 battle(match){
  this.mode='battle';this.studio.visible=false;this.world.visible=true;
  if(this.fighters)this.fighters.forEach(f=>{this.world.remove(f.root);f.ring.geometry.dispose();f.ring.material.dispose();f.shadow.geometry.dispose();f.shadow.material.dispose();this.world.remove(f.trail);f.trail.geometry.dispose();f.trail.material.dispose();});
  this.arena(ARENAS.find(a=>a.id===match.arena));this.match=match;
  this.fighters=match.blades.map((b,i)=>{
   const root=new T.Group(),model=this.model(b.id);model.position.set(0,.36,0);model.scale.setScalar(.64);model.rotation.set(0,0,0);root.add(model);
   const ring=new T.Mesh(new T.RingGeometry(.86,.88,64),new T.MeshBasicMaterial({color:i?'#ff9b75':'#82caff',transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=-.01;root.add(ring);
   const shadow=new T.Mesh(new T.PlaneGeometry(2.1,2.1),new T.MeshBasicMaterial({map:this.shadowTexture,transparent:true,opacity:.8,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.035;root.add(shadow);this.world.add(root);
   const trailGeo=new T.BufferGeometry(),trailPositions=new Float32Array(24*3),trailColors=new Float32Array(24*3),tint=new T.Color(i?'#ffb17e':'#98d9ff');
   for(let j=0;j<24;j++){trailPositions[j*3]=b.x;trailPositions[j*3+1]=.2;trailPositions[j*3+2]=b.z;const fade=(1-j/24)*.8;trailColors[j*3]=tint.r*fade;trailColors[j*3+1]=tint.g*fade;trailColors[j*3+2]=tint.b*fade;}
   trailGeo.setAttribute('position',new T.BufferAttribute(trailPositions,3));trailGeo.setAttribute('color',new T.BufferAttribute(trailColors,3));
   const trail=new T.Line(trailGeo,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));trail.frustumCulled=false;this.world.add(trail);
   return {root,model,ring,shadow,trail,trailPositions,trailLife:0};
  });
  this.finishClock=0;this.impact=0;this.particles.forEach(p=>p.life=0);this.effects.forEach(e=>e.life=0);this.resize();this.trimModels();
 }
 point(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.mouse.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.mouse,this.camera);this.ray.ray.intersectPlane(this.plane,this.vec);return {x:this.vec.x,z:this.vec.z};}
 project(x,z){this.vec.set(x,.9,z).project(this.camera);return {x:(this.vec.x*.5+.5)*this.width,y:(-.5*this.vec.y+.5)*this.height};}
 event(e){
  if(e.type==='launch'&&this.motion){for(const b of this.match.blades)this.ringFX(b.x,b.z,'#d5edff',.65,2.3);}
  if(e.type==='dash'&&this.motion){const b=this.match.blades[e.i];this.ringFX(b.x,b.z,e.i?'#ffa77c':'#9ddaff',.3,1.4);}
  if(e.type==='finish')this.finishClock=0;
  if(e.type==='clash'&&this.motion){this.impact=Math.min(.065,e.power*.003);
   let n=this.low?10:24;const tint=new T.Color('#ffd899');for(const p of this.particles){if(p.life>0)continue;const a=Math.random()*TAU;p.life=.25+Math.random()*.35;p.x=e.x;p.y=.45;p.z=e.z;const s=1+Math.random()*4;p.vx=Math.cos(a)*s;p.vz=Math.sin(a)*s;p.vy=2+Math.random()*2;p.color=tint;if(--n<=0)break;}
   this.ringFX(e.x,e.z,'#ffd7a0',.4,1.4);
  }
  if(['special','block','rail'].includes(e.type)){const b=this.match.blades[e.i];this.ringFX(b.x,b.z,e.type==='block'?'#91d7ff':b.cfg.accent,.8,3);}
 }
 ringFX(x,z,color,life,size){if(!this.motion)return;const fx=this.effects.find(e=>e.life<=0)||this.effects[0];fx.life=fx.max=life;fx.size=size;fx.mesh.position.set(x,.06,z);fx.mesh.material.color.set(color);}
 render(dt,alpha=1){
  if(this.mode==='studio'){if(this.hero&&this.motion)this.hero.rotation.y+=dt*.16;}
  else if(this.match){
   this.finishClock+=this.match.state==='over'?dt:0;
   this.impact=Math.max(0,this.impact-dt*.3);this.camera.position.x=this.motion?Math.sin(this.match.time*65)*this.impact:0;
   this.fighters.forEach((f,i)=>{const b=this.match.blades[i];f.root.position.set(T.MathUtils.lerp(b.px,b.x,alpha),0,T.MathUtils.lerp(b.pz,b.z,alpha));f.model.rotation.y=T.MathUtils.lerp(b.prevAngle,b.angle,alpha);
    const wobble=Math.max(0,(30-b.spin)/30);f.model.rotation.z=Math.sin(b.angle*.6)*wobble*.12;
    f.ring.material.opacity=b.guard>0?.95:b.warning>0?.9:.45;f.ring.material.color.set(b.guard>0?'#e1f5ff':b.warning>0?'#ff7748':i?'#ff9b75':'#82caff');f.ring.scale.setScalar(b.guard>0?1.15:b.specialTime>0&&this.motion?1.2+Math.sin(b.specialTime*12)*.12:1);
    f.model.position.y=.36+(b.specialTime>0&&this.motion?Math.sin(b.specialTime*5)*.04:0);
    if(this.match.state==='over'&&this.motion){if(this.match.winner===i){f.model.position.y+=Math.sin(Math.min(1,this.finishClock)*Math.PI)*.45;f.model.rotation.y+=this.finishClock*4;}else{f.model.rotation.z=Math.min(.38,this.finishClock*.5);}}
    f.trailPositions.copyWithin(3,0,69);f.trailPositions[0]=f.root.position.x;f.trailPositions[1]=.2;f.trailPositions[2]=f.root.position.z;
    f.trail.geometry.attributes.position.needsUpdate=true;f.trailLife=b.rush>0?.35:Math.max(0,f.trailLife-dt);f.trail.visible=this.motion&&f.trailLife>0;f.trail.material.opacity=f.trailLife/.35*(this.low?.5:.9);
   });
   this.boundary.scale.setScalar(this.match.radius);this.boundary.material.opacity=this.match.time>32?.5:0;
   this.heat.material.opacity=this.match.arena==='volcano'&&this.match.time%10>7?(this.match.time%10>8?.3:.12):0;
   const a=this.particleGeo.attributes.position,c=this.particleGeo.attributes.color;
   this.particles.forEach((p,i)=>{p.life-=dt;if(p.life>0){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=9*dt;a.setXYZ(i,p.x,p.y,p.z);c.setXYZ(i,p.life*2,p.life*1.6,p.life*.9);}else a.setXYZ(i,0,-5,0);});a.needsUpdate=c.needsUpdate=true;
   this.effects.forEach(e=>{e.life-=dt;e.mesh.visible=e.life>0;if(e.life>0){const t=1-e.life/e.max;e.mesh.scale.setScalar(.5+t*e.size);e.mesh.material.opacity=(1-t)*.65;}});
  }
  this.renderer.render(this.scene,this.camera);
 }
 thumbnail(id){return emblem(ROSTER[id],128).image.toDataURL('image/webp',.8);}
 snapshot(id){
  if(this.mode!=='studio')return this.thumbnail(id);
  const current=this.hero.userData.cfg.id,rotation=this.hero.rotation.y;
  this.select(id);this.renderer.setSize(192,160,false);
  this.camera.left=-2.2;this.camera.right=2.2;this.camera.top=1.83;this.camera.bottom=-1.83;this.camera.updateProjectionMatrix();
  this.renderer.render(this.scene,this.camera);const url=this.canvas.toDataURL('image/webp',.85);
  this.select(current);this.hero.rotation.y=rotation;this.resize();this.renderer.render(this.scene,this.camera);this.trimModels();return url;
 }
 trimModels(){
  const keep=new Set([this.hero?.userData.cfg.id,...(this.match?.blades.map(b=>b.id)||[])]);
  for(const [id,model] of this.models){if(this.models.size<=8)break;if(keep.has(id))continue;
   model.removeFromParent();model.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});releaseModelTexture(id);this.models.delete(id);
  }
 }
 stats(){return {calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,textures:this.renderer.info.memory.textures,models:this.models.size};}
}
