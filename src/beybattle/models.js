import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2;
const textures=new Map();
export function emblem(cfg,size=512){
 const key=cfg.id+':'+size;if(textures.has(key))return textures.get(key);
 const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),s=size/2;
 x.translate(s,s);x.scale(s,s);
 const bg=x.createRadialGradient(-.3,-.35,0,0,0,1);bg.addColorStop(0,'#314761');bg.addColorStop(.6,'#111d32');bg.addColorStop(1,'#060b12');
 x.fillStyle=bg;x.beginPath();x.arc(0,0,.98,0,TAU);x.fill();
 x.strokeStyle=cfg.accent;x.lineWidth=.025;x.beginPath();x.arc(0,0,.93,0,TAU);x.stroke();
 x.strokeStyle='#aebccc';x.lineWidth=.01;x.beginPath();x.arc(0,0,.82,0,TAU);x.stroke();
 for(let i=0;i<48;i++){const a=i*TAU/48;x.strokeStyle=i%4===0?cfg.accent:'#65748b';x.lineWidth=i%4===0?.018:.008;x.beginPath();x.moveTo(Math.cos(a)*.85,Math.sin(a)*.85);x.lineTo(Math.cos(a)*.90,Math.sin(a)*.90);x.stroke();}
 x.save();x.scale(.72,.72);x.lineWidth=.055;x.lineJoin='round';x.strokeStyle=cfg.accent;x.fillStyle=cfg.accent;
 const path=(points,fill=true)=>{x.beginPath();points.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();fill?x.fill():x.stroke();};
 switch(cfg.motif){
 case 'dragon':case 'dino':case 'titan':
  path([[-.6,.65],[-.21,.25],[-.39,-.06],[-.31,-.37],[-.57,-.66],[-.15,-.48],[.05,-.73],[.15,-.4],[.4,-.32],[.53,-.13],[.79,-.07],[.6,.12],[.22,.06],[.1,.2],[.35,.42],[.14,.65],[-.1,.48],[-.26,.73]]);
  x.fillStyle='#152339';path([[.12,-.24],[.37,-.17],[.13,-.10]]);x.strokeStyle='#152339';x.lineWidth=.025;for(let j=0;j<3;j++){x.beginPath();x.moveTo(-.21+j*.08,.25+j*.08);x.lineTo(-.08+j*.08,.12+j*.08);x.stroke();}break;
 case 'pegasus':case 'phoenix':case 'unicorn':
  path([[0,.72],[-.17,.23],[-.73,-.42],[-.36,-.23],[-.52,-.63],[-.12,-.33],[.02,-.66],[.21,-.3],[.62,-.61],[.46,-.2],[.78,-.39],[.2,.27]]);
  x.strokeStyle='#152339';x.lineWidth=.04;x.beginPath();x.moveTo(-.4,-.3);x.lineTo(0,.35);x.lineTo(.43,-.3);x.stroke();break;
 case 'sword':case 'arrow':
  path([[0,-.78],[.23,-.42],[.12,.22],[.48,.37],[.38,.5],[.1,.38],[.07,.72],[-.07,.72],[-.1,.38],[-.38,.5],[-.48,.37],[-.12,.22],[-.23,-.42]]);
  x.strokeStyle='#fff';x.lineWidth=.018;x.beginPath();x.moveTo(0,-.65);x.lineTo(0,.2);x.stroke();break;
 case 'shield':case 'shell':case 'chain':
  path([[0,-.7],[.63,-.4],[.5,.38],[0,.75],[-.5,.38],[-.63,-.4]],false);
  path([[0,-.46],[.37,-.25],[.28,.21],[0,.46],[-.28,.21],[-.37,-.25]],false);
  x.beginPath();x.moveTo(0,-.46);x.lineTo(0,.46);x.moveTo(-.37,-.25);x.lineTo(.28,.21);x.moveTo(.37,-.25);x.lineTo(-.28,.21);x.stroke();break;
 case 'wolf':case 'lion':case 'bison':case 'cerberus':
  path([[-.62,-.65],[-.2,-.4],[0,-.54],[.2,-.4],[.62,-.65],[.48,.15],[.25,.43],[0,.73],[-.25,.43],[-.48,.15]]);
  x.fillStyle='#142033';path([[-.3,-.13],[-.05,.01],[-.17,.1]]);path([[.3,-.13],[.05,.01],[.17,.1]]);path([[-.13,.35],[.13,.35],[0,.5]]);break;
 case 'serpent':case 'kraken':
  x.lineWidth=.14;x.beginPath();x.moveTo(.5,-.5);x.bezierCurveTo(-.8,-.9,-.8,.1,0,.03);x.bezierCurveTo(.8,-.1,.75,.8,-.5,.55);x.stroke();
  path([[.22,-.64],[.72,-.55],[.5,-.25]]);break;
 case 'eye':
  x.beginPath();x.moveTo(-.75,0);x.quadraticCurveTo(0,-.8,.75,0);x.quadraticCurveTo(0,.8,-.75,0);x.stroke();x.beginPath();x.arc(0,0,.24,0,TAU);x.stroke();path([[0,-.18],[.08,0],[0,.18],[-.08,0]]);break;
 case 'shark':case 'scythe':
  path([[-.75,.45],[-.25,.05],[.12,-.75],[.5,-.27],[.3,.18],[.74,.48],[.1,.35],[-.2,.6]]);break;
 case 'meteor':
  path([[-.65,.3],[.1,-.6],[0,-.13],[.6,-.7],[.45,.2],[.05,.6],[-.35,.65]]);x.fillStyle='#111d32';x.beginPath();x.arc(-.18,.32,.16,0,TAU);x.fill();break;
 case 'pattern':
  for(let j=0;j<3;j++){x.save();x.rotate(j*TAU/6);const pts=Array.from({length:6},(_,i)=>[Math.cos(i*TAU/6)*(.7-j*.18),Math.sin(i*TAU/6)*(.7-j*.18)]);path(pts,false);x.restore();}break;
 case 'orion':
  [[-.5,-.6],[.4,-.45],[.55,.5],[-.35,.65],[-.15,-.06],[0,.04],[.15,.1]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,.07,0,TAU);x.fill();});path([[-.5,-.6],[.4,-.45],[.15,.1],[.55,.5],[-.35,.65],[-.15,-.06]],false);break;
 default:
  for(let i=0;i<3;i++){x.save();x.rotate(i*TAU/3);path([[0,-.77],[.28,-.18],[-.22,-.22]],false);x.restore();}x.beginPath();x.arc(0,0,.14,0,TAU);x.fill();
 }
 x.restore();
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.set(key,texture);return texture;
}
function batch(geos,material,group){const g=mergeGeometries(geos);for(const geo of geos)geo.dispose();const m=new T.Mesh(g,material);group.add(m);return m;}
export function makeBlade(cfg){
 const group=new T.Group();group.userData.cfg=cfg;
 const steel=new T.MeshStandardMaterial({color:'#9caabc',metalness:.9,roughness:.23});
 const dark=new T.MeshStandardMaterial({color:'#1c2633',metalness:.78,roughness:.32});
 const enamel=new T.MeshStandardMaterial({color:cfg.color,metalness:.18,roughness:.24});
 const accent=new T.MeshStandardMaterial({color:cfg.accent,metalness:.65,roughness:.23});
 const gold=new T.MeshStandardMaterial({color:['lion','cerberus','pattern','dragon'].includes(cfg.motif)?'#d8b766':'#c5d3e3',metalness:.85,roughness:.25});
 function cyl(rt,rb,h,y,mat,n=64){const mesh=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),mat);mesh.position.y=y;group.add(mesh);return mesh;}
 function ring(r,t,y,mat){const m=new T.Mesh(new T.TorusGeometry(r,t,8,80),mat);m.rotation.x=Math.PI/2;m.position.y=y;group.add(m);}
 cyl(.12,.06,.3,-.3,dark,16);cyl(.31,.18,.18,-.13,enamel,24);
 cyl(.71,.56,.15,.01,dark,48);ring(.62,.055,.08,steel);
 const teeth=[];for(let i=0;i<32;i++){const a=i*TAU/32;const g=new T.BoxGeometry(.075,.075,.15);g.rotateY(-a);g.translate(Math.sin(a)*.71,.10,Math.cos(a)*.71);teeth.push(g);}batch(teeth,steel,group);
 const n=cfg.wings;
 const sharp=['sword','shark','meteor','scythe','wolf','titan'].includes(cfg.motif),round=['shield','shell','bison','orion','chain'].includes(cfg.motif);
 const points=round?[[.27,-.19],[.6,-.49],[.95,-.36],[1.04,-.08],[.92,.33],[.61,.4],[.31,.18]]:
  sharp?[[.22,-.12],[.55,-.4],[1.16,-.28],[.93,-.06],[1.03,.12],[.66,.36],[.29,.23]]:
  [[.22,-.12],[.52,-.49],[1.05,-.43],[1.15,-.13],[.87,.11],[.93,.32],[.52,.36],[.28,.16]];
 const blades=[],panels=[],accents=[];
 for(let i=0;i<n;i++){
  const angle=i*TAU/n;
  const shape=new T.Shape();
  if(round){
   shape.moveTo(.28,-.15);shape.quadraticCurveTo(.53,-.54,.82,-.47);
   shape.bezierCurveTo(1.10,-.42,1.17,-.02,1.00,.25);shape.quadraticCurveTo(.74,.48,.41,.23);shape.closePath();
  }else if(sharp){
   shape.moveTo(.25,-.15);shape.lineTo(.55,-.43);shape.lineTo(1.18,-.31);shape.lineTo(.99,-.09);shape.lineTo(1.10,.06);shape.lineTo(.91,.09);shape.lineTo(.94,.24);shape.lineTo(.58,.34);shape.lineTo(.28,.14);shape.closePath();
  }else{
   shape.moveTo(.25,-.13);shape.bezierCurveTo(.48,-.47,.82,-.65,1.09,-.36);
   shape.bezierCurveTo(1.28,-.12,1.08,.19,.78,.26);shape.lineTo(.89,.35);shape.quadraticCurveTo(.48,.42,.25,.12);shape.closePath();
  }
  // Recessed cutouts expose the dark inner structure through the metal wing.
  const hole=new T.Path();hole.moveTo(.47,-.07);hole.quadraticCurveTo(.65,-.29,.88,-.19);hole.quadraticCurveTo(.9,-.03,.71,.07);hole.lineTo(.47,.05);hole.closePath();shape.holes.push(hole);
  const geo=new T.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.022,curveSegments:12});
  geo.rotateX(-Math.PI/2);geo.rotateY(angle);geo.translate(0,.13,0);blades.push(geo);
  // The resin armor is a distinct leading-edge insert, not a scaled copy of the metal.
  const insert=new T.Shape();insert.moveTo(.47,-.34);insert.quadraticCurveTo(.78,-.55,1.01,-.31);insert.lineTo(.91,-.17);insert.quadraticCurveTo(.72,-.33,.53,-.17);insert.closePath();
  const panel=new T.ExtrudeGeometry(insert,{depth:.07,bevelEnabled:true,bevelSegments:2,bevelSize:.018,bevelThickness:.018,curveSegments:10});panel.rotateX(-Math.PI/2);panel.rotateY(angle);panel.translate(0,.29,0);panels.push(panel);
  const tail=new T.Shape();tail.moveTo(.37,.13);tail.lineTo(.65,.10);tail.lineTo(.82,.24);tail.quadraticCurveTo(.56,.35,.37,.13);tail.closePath();
  const tailG=new T.ExtrudeGeometry(tail,{depth:.055,bevelEnabled:true,bevelSegments:2,bevelSize:.015,bevelThickness:.012});tailG.rotateX(-Math.PI/2);tailG.rotateY(angle);tailG.translate(0,.27,0);panels.push(tailG);
  const line=new T.BoxGeometry(.13,.025,.025);line.rotateY(angle+.3);line.translate(Math.cos(angle)*.72,.37,-Math.sin(angle)*.72);accents.push(line);
 }
 batch(blades,steel,group);batch(panels,enamel,group);batch(accents,gold,group);
 const vents=[],studs=[],feathers=[];
 for(let i=0;i<n;i++)for(let j=0;j<3;j++){
  const a=i*TAU/n,xx=.56+j*.065,zz=.12+j*.025;
  const vent=new T.BoxGeometry(.035,.014,.06);vent.rotateY(a-.25);vent.translate(Math.cos(a)*xx+Math.sin(a)*zz,.275,-Math.sin(a)*xx+Math.cos(a)*zz);vents.push(vent);
  const stud=new T.SphereGeometry(.018,6,4);stud.scale(1,.4,1);stud.translate(Math.cos(a)*(.78+j*.05),.27,-Math.sin(a)*(.78+j*.05));studs.push(stud);
 }
 batch(vents,dark,group);batch(studs,gold,group);
 if(['pegasus','phoenix','dragon','serpent','kraken','pattern','orion'].includes(cfg.motif)){
  for(let i=0;i<n;i++){
   const a=i*TAU/n;
   if(cfg.motif==='pattern'){
    const gem=new T.CylinderGeometry(.11,.15,.055,6);gem.translate(.76,.29,.08);gem.rotateY(a);feathers.push(gem);
   }else if(cfg.motif==='orion'){
    const gem=new T.OctahedronGeometry(.09,0);gem.scale(1,.4,1);gem.translate(.83,.29,.09);gem.rotateY(a);feathers.push(gem);
   }else{
    const count=cfg.motif==='phoenix'?3:2;
    for(let j=0;j<count;j++){
     const f=new T.Shape();const offset=j*.08;
     f.moveTo(.55+offset,.10);f.quadraticCurveTo(.8+offset,.08,1.02+offset,.20);f.lineTo(.82+offset,.28);f.lineTo(.55+offset,.10);
     const geo=new T.ExtrudeGeometry(f,{depth:.025,bevelEnabled:true,bevelSegments:1,bevelSize:.008,bevelThickness:.008,curveSegments:6});geo.rotateX(-Math.PI/2);geo.rotateY(a);geo.translate(0,.30+j*.025,0);feathers.push(geo);
    }
   }
  }
  batch(feathers,accent,group);
 }


 // A separate upper energy ring, locking gear and engraved center medallion.
 cyl(.48,.56,.10,.30,dark);ring(.49,.035,.36,gold);ring(.56,.025,.25,accent);
 cyl(.405,.45,.055,.36,accent);cyl(.365,.385,.045,.395,dark);
 const face=new T.Mesh(new T.CircleGeometry(.35,64),new T.MeshStandardMaterial({map:emblem(cfg),metalness:.4,roughness:.35}));face.rotation.x=-Math.PI/2;face.position.y=.421;group.add(face);
 const bolts=[];const slots=[];
 for(let i=0;i<n;i++){
  const a=i*TAU/n+.1;const bx=Math.cos(a)*.63,bz=-Math.sin(a)*.63;
  const bolt=new T.CylinderGeometry(.043,.043,.025,12);bolt.translate(bx,.36,bz);bolts.push(bolt);
  const slot=new T.BoxGeometry(.045,.004,.009);slot.rotateY(a);slot.translate(bx,.375,bz);slots.push(slot);
 }
 batch(bolts,gold,group);batch(slots,dark,group);
 // Radial machined grooves catch the light without transparent bloom.
 const grooves=[];for(let i=0;i<40;i++){const a=i*TAU/40;const g=new T.BoxGeometry(.003,.005,.06);g.rotateY(-a);g.translate(Math.sin(a)*.465,.365,Math.cos(a)*.465);grooves.push(g);}batch(grooves,dark,group);
 return group;
}
export function floorTexture(arena){
 const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');x.translate(512,512);
 const grad=x.createRadialGradient(-150,-180,0,0,0,512);grad.addColorStop(0,'#314158');grad.addColorStop(.75,'#243347');grad.addColorStop(1,'#152439');x.fillStyle=grad;x.fillRect(-512,-512,1024,1024);
 x.strokeStyle='#9db2ca29';x.lineWidth=2;
 for(let r=100;r<=500;r+=100){x.beginPath();x.arc(0,0,r,0,TAU);x.stroke();}
 for(let i=0;i<12;i++){const a=i*TAU/12;x.beginPath();x.moveTo(Math.cos(a)*110,Math.sin(a)*110);x.lineTo(Math.cos(a)*488,Math.sin(a)*488);x.stroke();}
 x.strokeStyle=arena.color;x.globalAlpha=.45;x.lineWidth=3;x.beginPath();x.arc(0,0,480,0,TAU);x.stroke();
 if(arena.id==='cyber'){for(let i=-4;i<=4;i++){x.beginPath();x.moveTo(i*90,-510);x.lineTo(i*90,510);x.moveTo(-510,i*90);x.lineTo(510,i*90);x.stroke();}}
 if(arena.id==='volcano'){for(let i=0;i<8;i++){x.save();x.rotate(i*TAU/8);x.beginPath();x.moveTo(340,0);x.lineTo(380,-25);x.lineTo(410,15);x.lineTo(512,-30);x.stroke();x.restore();}}
 if(arena.id==='glacier'){for(let i=0;i<6;i++){x.save();x.rotate(i*TAU/6);x.beginPath();x.moveTo(130,0);x.lineTo(400,0);x.moveTo(290,0);x.lineTo(240,-45);x.moveTo(290,0);x.lineTo(240,45);x.stroke();x.restore();}}
 if(arena.id==='void'){for(let i=0;i<3;i++){x.beginPath();x.ellipse(0,0,370,140,i*TAU/3,0,TAU);x.stroke();}}
 for(let i=0;i<24;i++){x.save();x.rotate(i*TAU/24);x.fillStyle=arena.color;x.fillRect(442,-2,22,4);if(arena.id==='rail'){x.beginPath();x.moveTo(412,-7);x.lineTo(424,0);x.lineTo(412,7);x.stroke();}x.restore();}
 x.globalAlpha=.15;x.fillStyle='#d8e5f6';x.font='900 italic 60px Arial';x.textAlign='center';x.fillText('BEYBATTLE',0,12);x.font='600 15px Arial';x.fillText('P A T T E R N   S P I N   L E A G U E',0,42);
 x.globalAlpha=.55;x.font='600 18px Arial';x.fillStyle='#74c8fa';x.fillText('01',-370,4);x.fillStyle='#ffaa82';x.fillText('02',370,4);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

export function releaseModelTexture(id){
 const key=id+':512';const texture=textures.get(key);if(texture){texture.dispose();textures.delete(key);}
}
