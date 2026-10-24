// ══════════ BEYBLADE DRAWING ══════════
function drawBeybladeArt(sx, sy, radius, angle, alive) {
  const r = radius;
  const palette = {comet:['#366cb4','#98d8ff','#163f7a'],nimbus:['#2e796a','#a5f0d5','#164b42'],volt:['#9b7329','#ffe096','#654b1b']}[progress.blade];
  ctx.save();
  ctx.translate(sx, sy);

  // energy aura
  ctx.save();
  ctx.rotate(angle * 2);
  const ac = alive ? [140,80,220] : [200,50,50];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI*2/5)*i;
    const gx = Math.cos(a)*r*1.15, gy = Math.sin(a)*r*1.15;
    const g = ctx.createRadialGradient(gx,gy,0,gx,gy,r*0.55);
    g.addColorStop(0,`rgba(${ac},0.3)`); g.addColorStop(1,`rgba(${ac},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx,gy,r*0.55,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
  ctx.rotate(angle);

  // outer silver blades
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate((Math.PI*2/3)*i);
    ctx.beginPath();
    ctx.moveTo(r*0.4,-r*0.08);
    ctx.lineTo(r*0.6,-r*0.42); ctx.lineTo(r*0.78,-r*0.45);
    ctx.quadraticCurveTo(r*1.05,-r*0.3,r*1.1,-r*0.05);
    ctx.lineTo(r*1.08,r*0.1);
    ctx.quadraticCurveTo(r*0.95,r*0.32,r*0.65,r*0.35);
    ctx.lineTo(r*0.45,r*0.2); ctx.lineTo(r*0.4,r*0.08); ctx.closePath();
    const sg = ctx.createLinearGradient(r*0.4,-r*0.4,r*1.0,r*0.2);
    sg.addColorStop(0,'#f0f0f8'); sg.addColorStop(0.25,'#d8dce8');
    sg.addColorStop(0.5,'#b0b8c8'); sg.addColorStop(0.75,'#c8ccd8'); sg.addColorStop(1,'#888ca0');
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = '#9098a8'; ctx.lineWidth = 0.8; ctx.stroke();
    // red edge
    ctx.beginPath();
    ctx.moveTo(r*0.6,-r*0.42); ctx.lineTo(r*0.78,-r*0.45);
    ctx.quadraticCurveTo(r*1.05,-r*0.3,r*1.1,-r*0.05);
    ctx.lineTo(r*1.03,-r*0.02);
    ctx.quadraticCurveTo(r*0.95,-r*0.25,r*0.75,-r*0.38);
    ctx.lineTo(r*0.62,-r*0.35); ctx.closePath();
    ctx.fillStyle = alive ? palette[1] : '#664444'; ctx.fill();
    // shine
    ctx.beginPath();
    ctx.moveTo(r*0.5,0); ctx.lineTo(r*0.9,-r*0.12); ctx.lineTo(r*0.88,-r*0.05); ctx.lineTo(r*0.5,r*0.05); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.restore();
  }

  // purple ring
  const pg = ctx.createRadialGradient(0,0,r*0.28,0,0,r*0.55);
  pg.addColorStop(0,alive?palette[0]:'#553333'); pg.addColorStop(0.5,alive?palette[1]:'#664444');
  pg.addColorStop(1,alive?palette[2]:'#442222');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(0,0,r*0.55,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = alive?palette[1]:'#774444'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0,0,r*0.55,0,Math.PI*2); ctx.stroke();

  // forge disc
  const dg = ctx.createRadialGradient(0,0,r*0.2,0,0,r*0.38);
  dg.addColorStop(0,'#c0c4d0'); dg.addColorStop(0.5,'#9098a8'); dg.addColorStop(1,'#686878');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(0,0,r*0.38,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7a7a8a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0,0,r*0.38,0,Math.PI*2); ctx.stroke();

  // bit chip
  const cr = r*0.26;
  const cg2 = ctx.createRadialGradient(-1,-1,0,0,0,cr);
  cg2.addColorStop(0,alive?'#ff6633':'#884444'); cg2.addColorStop(0.5,alive?'#cc2200':'#663333'); cg2.addColorStop(1,alive?'#881100':'#442222');
  ctx.fillStyle = cg2;
  ctx.beginPath(); ctx.arc(0,0,cr,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = alive?'#ffcc44':'#887755'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0,0,cr,0,Math.PI*2); ctx.stroke();

  // dragon
  const ds = cr/8;
  ctx.fillStyle = alive?'#1144cc':'#554444';
  ctx.beginPath();
  ctx.moveTo(-ds,-ds*5); ctx.lineTo(ds*1,-ds*3.5); ctx.lineTo(ds*2,-ds*2);
  ctx.lineTo(ds*1.5,-ds*0.5); ctx.lineTo(ds*0.5,ds*0.5);
  ctx.lineTo(ds*4,-ds*2); ctx.lineTo(ds*5,-ds*0.5); ctx.lineTo(ds*3.5,ds*1); ctx.lineTo(ds*2,ds*1.5);
  ctx.lineTo(ds*1,ds*3); ctx.lineTo(ds*2.5,ds*5); ctx.lineTo(ds*0.5,ds*4); ctx.lineTo(-ds*0.5,ds*3);
  ctx.lineTo(-ds*3.5,ds*1.5); ctx.lineTo(-ds*5,0); ctx.lineTo(-ds*4,-ds*1.5); ctx.lineTo(-ds*2,-ds*1);
  ctx.lineTo(-ds*2,-ds*3); ctx.closePath(); ctx.fill();
  // eye
  ctx.fillStyle = alive?'#ffcc00':'#886644';
  ctx.beginPath(); ctx.arc(ds*0.3,-ds*2.5,ds*0.6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(ds*0.3,-ds*2.5,ds*0.25,0,Math.PI*2); ctx.fill();

  ctx.restore();
}

// One texture per state replaces gradients and paths on every frame.
const climberSprites = new Map();
function drawBeyblade(x,y,radius,angle,alive) {
  const key = progress.blade + String(alive);
  if (!climberSprites.has(key)) {
    const img=document.createElement('canvas');img.width=img.height=192;
    const previous=ctx;ctx=img.getContext('2d');
    drawBeybladeArt(96,96,48,0,alive);ctx=previous;climberSprites.set(key,img);
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.drawImage(climberSprites.get(key),-radius*2,-radius*2,radius*4,radius*4);ctx.restore();
}

