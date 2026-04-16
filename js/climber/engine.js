// ══════════ STAGE GENERATION ══════════
function buildStage(stageIdx) {
  const cfg = STAGES[stageIdx];
  platforms = [];
  collectStars = [];
  particles = [];
  trailParticles = [];
  camera = 0;
  starsCollected = 0;
  starsTotal = cfg.stars;

  // ground platform
  platforms.push({ x: W/2 - PLAT_W, y: H - 40, w: PLAT_W*2, type:'normal', broken:false, moveDir:0, moveSpeed:0 });

  // generate platforms going upward
  let prevX = W/2;
  for (let i = 1; i <= cfg.platCount; i++) {
    const worldY = (H - 40) - i * cfg.spacing;
    const drift = 150;
    const minX = Math.max(0, prevX - PLAT_W/2 - drift);
    const maxX = Math.min(W - PLAT_W, prevX - PLAT_W/2 + drift);
    const x = minX + Math.random() * (maxX - minX);

    let type = 'normal';
    const roll = Math.random();
    if (roll < cfg.fragile) type = 'fragile';
    else if (roll < cfg.fragile + cfg.moving) type = 'moving';
    else if (roll < cfg.fragile + cfg.moving + cfg.boost) type = 'boost';

    const moveDir = type === 'moving' ? (Math.random() < 0.5 ? 1 : -1) : 0;
    platforms.push({ x, y: worldY, w: PLAT_W, type, broken:false, moveDir, moveSpeed: cfg.moveSpd });
    prevX = x + PLAT_W/2;
  }

  // place stars on random non-fragile platforms (not ground)
  const eligible = platforms.filter((p, i) => i > 0 && p.type !== 'fragile');
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, cfg.stars);
  for (const p of chosen) {
    collectStars.push({
      x: p.x + p.w/2, y: p.y - 18,
      collected: false, sparkle: 0
    });
  }

  // finish line at the top
  const topY = (H - 40) - cfg.platCount * cfg.spacing - 60;
  platforms.push({ x: W/2 - PLAT_W, y: topY, w: PLAT_W*2, type:'finish', broken:false, moveDir:0, moveSpeed:0 });

  player = { x: W/2, y: H-80, vx:0, vy:-5, angle:0, spinSpeed:0.15, radius:18 };
}

// ══════════ BEYBLADE DRAWING ══════════
function drawBeyblade(sx, sy, radius, angle, alive) {
  const r = radius;
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
    ctx.fillStyle = alive ? '#cc2244' : '#664444'; ctx.fill();
    // shine
    ctx.beginPath();
    ctx.moveTo(r*0.5,0); ctx.lineTo(r*0.9,-r*0.12); ctx.lineTo(r*0.88,-r*0.05); ctx.lineTo(r*0.5,r*0.05); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.restore();
  }

  // purple ring
  const pg = ctx.createRadialGradient(0,0,r*0.28,0,0,r*0.55);
  pg.addColorStop(0,alive?'#5522aa':'#553333'); pg.addColorStop(0.5,alive?'#6633bb':'#664444');
  pg.addColorStop(1,alive?'#331166':'#442222');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(0,0,r*0.55,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = alive?'#7744cc':'#774444'; ctx.lineWidth = 1.5;
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

// ══════════ PLATFORM DRAWING ══════════
function drawPlatform(px, py, pw, type, broken) {
  if (broken) return;
  const colors = {
    normal: {base:'#667799',edge:'#8899bb',glow:'rgba(100,150,200,0.3)'},
    boost:  {base:'#aa8822',edge:'#ffcc44',glow:'rgba(255,200,50,0.5)'},
    fragile:{base:'#774444',edge:'#995555',glow:'rgba(200,80,80,0.3)'},
    moving: {base:'#336688',edge:'#44aadd',glow:'rgba(50,150,255,0.4)'},
    finish: {base:'#44aa44',edge:'#66ff66',glow:'rgba(50,255,100,0.5)'},
  };
  const c = colors[type] || colors.normal;
  ctx.save();
  ctx.shadowColor = c.glow; ctx.shadowBlur = 12;
  ctx.fillStyle = c.base;
  ctx.beginPath(); ctx.roundRect(px,py,pw,PLAT_H,4); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.edge;
  ctx.beginPath(); ctx.roundRect(px,py,pw,4,[4,4,0,0]); ctx.fill();
  const sh = ctx.createLinearGradient(px,py,px,py+PLAT_H);
  sh.addColorStop(0,'rgba(255,255,255,0.2)'); sh.addColorStop(0.5,'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.beginPath(); ctx.roundRect(px,py,pw,PLAT_H,4); ctx.fill();

  if (type === 'fragile') {
    ctx.strokeStyle = '#331111'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px+pw*0.3,py+2); ctx.lineTo(px+pw*0.4,py+PLAT_H-2);
    ctx.moveTo(px+pw*0.6,py+3); ctx.lineTo(px+pw*0.7,py+PLAT_H-1);
    ctx.stroke();
  }
  if (type === 'moving') {
    ctx.fillStyle = 'rgba(100,200,255,0.5)';
    const cx2 = px+pw/2, cy2 = py+PLAT_H/2;
    ctx.beginPath(); ctx.moveTo(cx2-8,cy2); ctx.lineTo(cx2-3,cy2-3); ctx.lineTo(cx2-3,cy2+3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx2+8,cy2); ctx.lineTo(cx2+3,cy2-3); ctx.lineTo(cx2+3,cy2+3); ctx.fill();
  }
  if (type === 'finish') {
    // checkered flag pattern
    const sz = 6;
    for (let fx = px+2; fx < px+pw-2; fx += sz*2) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(fx, py+2, sz, sz > PLAT_H-4 ? PLAT_H-4 : sz);
    }
    // "GOAL" text if wide enough
    if (pw > 100) {
      pixText('GOAL', px+pw/2-textW('GOAL',2)/2, py+2, 2, '#ffffff', '#005500');
    }
  }
  if (type === 'boost' && frameCount%20 < 10) {
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.arc(px+pw*0.2+Math.sin(frameCount*0.1)*pw*0.3,py+2,2,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ══════════ STAR DRAWING ══════════
function drawStar(sx, sy, size, collected) {
  if (collected) return;
  ctx.save();
  ctx.translate(sx, sy);
  const bob = Math.sin(frameCount * 0.06 + sx) * 3;
  ctx.translate(0, bob);
  ctx.rotate(frameCount * 0.03);

  // glow
  const g = ctx.createRadialGradient(0,0,0,0,0,size*2);
  g.addColorStop(0,'rgba(255,220,50,0.4)'); g.addColorStop(1,'rgba(255,220,50,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0,0,size*2,0,Math.PI*2); ctx.fill();

  // star shape
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI*2/5)*i - Math.PI/2;
    const ai = a + Math.PI/5;
    ctx.lineTo(Math.cos(a)*size, Math.sin(a)*size);
    ctx.lineTo(Math.cos(ai)*size*0.4, Math.sin(ai)*size*0.4);
  }
  ctx.closePath();
  const sg2 = ctx.createRadialGradient(0,0,0,0,0,size);
  sg2.addColorStop(0,'#ffffaa'); sg2.addColorStop(0.5,'#ffcc00'); sg2.addColorStop(1,'#cc8800');
  ctx.fillStyle = sg2; ctx.fill();
  ctx.strokeStyle = '#ffee66'; ctx.lineWidth = 1; ctx.stroke();

  ctx.restore();
}

// ══════════ PARTICLES ══════════
function spawnBounce(bx, by, color) {
  for (let i = 0; i < 8; i++)
    particles.push({x:bx+(Math.random()-0.5)*30,y:by,vx:(Math.random()-0.5)*4,vy:-Math.random()*3-1,life:25+Math.random()*15,maxLife:40,color,size:2+Math.random()*3});
}
function spawnShatter(px2,py2,pw2) {
  for (let i = 0; i < 15; i++)
    particles.push({x:px2+Math.random()*pw2,y:py2+Math.random()*PLAT_H,vx:(Math.random()-0.5)*6,vy:Math.random()*3+1,life:30+Math.random()*20,maxLife:50,color:'#994444',size:3+Math.random()*5});
}
function spawnStarCollect(sx2,sy2) {
  for (let i = 0; i < 16; i++) {
    const a = Math.random()*Math.PI*2;
    particles.push({x:sx2,y:sy2,vx:Math.cos(a)*3+Math.random(),vy:Math.sin(a)*3+Math.random(),life:30+Math.random()*15,maxLife:45,color:Math.random()>0.5?'#ffcc00':'#ffffaa',size:2+Math.random()*4});
  }
}

// ══════════ GAME LOGIC ══════════
function startStage(idx) {
  currentStage = idx;
  buildStage(idx);
  state = 'playing';
  clearFlash = 0;
}

function update() {
  frameCount++;

  if (state === 'title') {
    if (actionPress) { startStage(0); actionPress = false; }
    return;
  }
  if (state === 'dead') {
    if (actionPress) { startStage(currentStage); actionPress = false; }
    return;
  }
  if (state === 'victory') {
    if (actionPress) { state = 'title'; actionPress = false; }
    return;
  }
  actionPress = false;

  // ── playing ──
  const moveForce = 0.6;
  if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= moveForce;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx += moveForce;
  if (keys['ArrowDown'] || keys['KeyS']) dropping = true;
  else if (!touchX) dropping = false;
  if (touchX !== null && !dropping) {
    const mid = canvas.getBoundingClientRect().left + canvas.width/2;
    player.vx += touchX < mid ? -moveForce : moveForce;
  }

  player.vx *= 0.88;
  // drop: boost gravity so player falls fast through platforms
  player.vy += dropping ? 0.7 : 0.3;
  player.x += player.vx;
  player.y += player.vy;
  player.angle += player.spinSpeed;

  // wrap
  if (player.x < -player.radius) player.x = W + player.radius;
  if (player.x > W + player.radius) player.x = -player.radius;

  // trail
  if (frameCount % 2 === 0)
    trailParticles.push({x:player.x,y:player.y,life:15,maxLife:15,size:player.radius*0.6});

  // platform collision (falling only, skip when dropping through)
  if (player.vy > 0 && !dropping) {
    for (const p of platforms) {
      if (p.broken) continue;
      if (player.x+player.radius > p.x && player.x-player.radius < p.x+p.w &&
          player.y+player.radius >= p.y && player.y+player.radius <= p.y+PLAT_H+player.vy+2) {
        player.y = p.y - player.radius;
        if (p.type === 'boost') { player.vy = -12; spawnBounce(player.x,p.y,'#ffcc44'); player.spinSpeed = Math.min(0.4,player.spinSpeed+0.03); }
        else if (p.type === 'fragile') { player.vy = -7.5; p.broken = true; spawnShatter(p.x,p.y,p.w); }
        else if (p.type === 'finish') {
          player.vy = -7.5;
          if (starsCollected >= starsTotal && clearFlash === 0) {
            if (currentStage + 1 > bestStage) bestStage = currentStage + 1;
            if (currentStage >= 9) { state = 'victory'; }
            else {
              clearFlash = 100; // show banner for ~1.7s while player falls
              const next = currentStage + 1;
              // delay stage rebuild until player falls back (handled in clearFlash countdown)
              setTimeout(() => { if (state === 'playing') startStage(next); }, 1000);
            }
          } else {
            spawnBounce(player.x, p.y, '#44ff44');
          }
        }
        else { player.vy = -7.5; spawnBounce(player.x,p.y,'#66aaff'); }
        break;
      }
    }
  }

  // moving platforms
  for (const p of platforms) {
    if (p.type === 'moving' && !p.broken) {
      p.x += p.moveDir * p.moveSpeed;
      if (p.x < 0 || p.x+p.w > W) p.moveDir *= -1;
    }
  }

  // star collection
  for (const s of collectStars) {
    if (s.collected) continue;
    const dx = player.x - s.x, dy = player.y - s.y;
    if (dx*dx + dy*dy < (player.radius+10)*(player.radius+10)) {
      s.collected = true;
      starsCollected++;
      spawnStarCollect(s.x, s.y);
    }
  }

  // camera follow up
  const targetCam = player.y - H*0.4;
  // follow up fast; follow down at medium speed (faster when actively dropping)
  if (targetCam < camera) camera += (targetCam - camera) * 0.1;
  else camera += (targetCam - camera) * (dropping ? 0.12 : 0.05);

  // clear flash countdown
  if (clearFlash > 0) clearFlash--;

  // death (only if not in clear flash)
  if (clearFlash === 0 && player.y - camera > H + 50) { state = 'dead'; }

  // particles
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life--;
    if (p.life<=0) particles.splice(i,1);
  }
  for (let i = trailParticles.length-1; i >= 0; i--) {
    trailParticles[i].life--;
    if (trailParticles[i].life<=0) trailParticles.splice(i,1);
  }
}

