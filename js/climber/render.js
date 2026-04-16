// ══════════ DRAWING ══════════
function drawBg() {
  const grad = ctx.createLinearGradient(0,0,0,H);
  // different bg color per stage
  const hues = ['#0a0a2e','#0a1a2e','#0a0a3e','#1a0a2e','#0a1a1e','#2a0a0e','#0a0a4e','#1a1a0e','#2a0a1e','#0a0a0a'];
  grad.addColorStop(0, hues[currentStage] || '#0a0a2e');
  grad.addColorStop(1, '#1a1a3e');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

  // arena circles
  ctx.save(); ctx.globalAlpha = 0.06; ctx.strokeStyle = '#4488cc'; ctx.lineWidth = 1;
  for (let r2 = 50; r2 < 400; r2 += 60) { ctx.beginPath(); ctx.arc(W/2,H/2-camera*0.05,r2,0,Math.PI*2); ctx.stroke(); }
  ctx.restore();

  // stars parallax
  for (const s of bgStars) {
    const sy = ((s.y-camera*0.3)%(H+100)+H+100)%(H+100);
    ctx.globalAlpha = (0.4+0.6*Math.abs(Math.sin(frameCount*0.02+s.b*10)))*0.7;
    ctx.fillStyle = '#aaccff';
    ctx.beginPath(); ctx.arc(s.x,sy,s.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWorld() {
  ctx.save();
  ctx.translate(0,-camera);

  // trails
  for (const t of trailParticles) {
    ctx.globalAlpha = t.life/t.maxLife*0.2;
    ctx.fillStyle = '#00aaff';
    ctx.beginPath(); ctx.arc(t.x,t.y,t.size*(t.life/t.maxLife),0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // platforms
  for (const p of platforms) drawPlatform(p.x,p.y,p.w,p.type,p.broken);

  // stars
  for (const s of collectStars) drawStar(s.x,s.y,10,s.collected);

  // particles
  for (const p of particles) {
    ctx.globalAlpha = p.life/p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }
  ctx.globalAlpha = 1;

  // player
  if (state === 'playing' || state === 'dead')
    drawBeyblade(player.x,player.y,player.radius,player.angle,state==='playing');

  ctx.restore();
}

function drawHUD() {
  // stage indicator
  const stg = 'STAGE ' + (currentStage+1);
  pixText(stg, 8, 8, 2, '#8899aa', '#222233');

  // stage name
  const nm = STAGES[currentStage].name;
  pixText(nm, 8, 22, 3, '#00ccff', '#003355');

  // star counter
  const starText = starsCollected + '/' + starsTotal;
  // draw mini star icon
  ctx.save();
  ctx.translate(W-70, 16);
  ctx.rotate(frameCount*0.05);
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI*2/5)*i - Math.PI/2, ai = a+Math.PI/5;
    ctx.lineTo(Math.cos(a)*7,Math.sin(a)*7);
    ctx.lineTo(Math.cos(ai)*3,Math.sin(ai)*3);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();

  pixText(starText, W-50, 10, 3, starsCollected >= starsTotal ? '#66ff66' : '#ffcc44', '#333300');

  // drop hint (show briefly at start of each stage, or while actively dropping)
  if (dropping) {
    const hint = 'DROPPING!';
    pixText(hint, W/2-textW(hint,2)/2, H-28, 2, '#aaddff', '#112233');
  } else if (frameCount < 180) {
    const hint = 'HOLD DOWN TO DROP';
    const alpha = Math.max(0, 1 - frameCount/180);
    ctx.globalAlpha = alpha;
    pixText(hint, W/2-textW(hint,2)/2, H-28, 2, '#aaddff', '#112233');
    ctx.globalAlpha = 1;
  }

  // progress bar
  const barW = W - 20;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.roundRect(10, H-14, barW, 8, 4); ctx.fill();
  const prog = Math.min(1, starsCollected / starsTotal);
  const progGrad = ctx.createLinearGradient(10,0,10+barW*prog,0);
  progGrad.addColorStop(0,'#ffcc00'); progGrad.addColorStop(1, starsCollected>=starsTotal?'#66ff66':'#ff8800');
  ctx.fillStyle = progGrad;
  ctx.beginPath(); ctx.roundRect(10, H-14, barW*prog, 8, 4); ctx.fill();
}

function drawTitleScreen() {
  drawBg();
  ctx.fillStyle = 'rgba(5,5,25,0.6)'; ctx.fillRect(0,0,W,H);

  const t1 = 'BEYBLADE';
  const t2 = 'CLIMBER';
  pixText(t1, W/2-textW(t1,5)/2, 100, 5, '#00ccff', '#003366');
  pixText(t2, W/2-textW(t2,5)/2, 135, 5, '#ffcc44', '#553300');

  drawBeyblade(W/2, 220, 30, frameCount*0.08, true);

  // stage dots
  const dotY = 310;
  pixText('STAGES', W/2-textW('STAGES',2)/2, dotY-16, 2, '#8899aa', '#222233');
  for (let i = 0; i < 10; i++) {
    const dx = W/2 - 90 + i*20;
    if (i <= bestStage) {
      ctx.fillStyle = i < bestStage ? '#66ff66' : '#ffcc44';
    } else {
      ctx.fillStyle = '#333344';
    }
    ctx.beginPath(); ctx.arc(dx, dotY, 6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#556677'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(dx, dotY, 6, 0, Math.PI*2); ctx.stroke();
    // number
    pixText(''+(i+1), dx-3, dotY+12, 1, '#667788', null);
  }

  if (Math.floor(frameCount/30)%2===0) {
    const msg = 'PRESS SPACE TO START';
    pixText(msg, W/2-textW(msg,2)/2, 370, 2, '#ffffff', '#333333');
  }
  const c1 = 'LEFT RIGHT TO MOVE';
  const c2 = 'COLLECT ALL STARS!';
  pixText(c1, W/2-textW(c1,2)/2, 420, 2, '#6699aa', '#112233');
  pixText(c2, W/2-textW(c2,2)/2, 440, 2, '#6699aa', '#112233');
}

function drawStageIntro() {
  drawBg();
  ctx.fillStyle = 'rgba(5,5,25,0.7)'; ctx.fillRect(0,0,W,H);

  const s1 = 'STAGE ' + (currentStage+1);
  pixText(s1, W/2-textW(s1,5)/2, 200, 5, '#00ccff', '#003366');

  const nm = STAGES[currentStage].name;
  pixText(nm, W/2-textW(nm,4)/2, 245, 4, '#ffcc44', '#553300');

  const starInfo = 'COLLECT ' + starsTotal + ' STARS';
  pixText(starInfo, W/2-textW(starInfo,3)/2, 300, 3, '#ffcc00', '#553300');

  // draw star icons
  const startX = W/2 - starsTotal*12/2;
  for (let i = 0; i < starsTotal; i++) {
    ctx.save();
    ctx.translate(startX + i*14 + 6, 340);
    ctx.rotate(frameCount*0.05 + i*0.5);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const a = (Math.PI*2/5)*j-Math.PI/2, ai=a+Math.PI/5;
      ctx.lineTo(Math.cos(a)*6,Math.sin(a)*6);
      ctx.lineTo(Math.cos(ai)*2.5,Math.sin(ai)*2.5);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  if (introTimer < 80 && Math.floor(frameCount/20)%2===0) {
    const go = 'READY!';
    pixText(go, W/2-textW(go,3)/2, 380, 3, '#66ff66', '#003300');
  }
}

function drawStageClear() {
  drawBg(); drawWorld();
  ctx.fillStyle = 'rgba(0,20,0,0.6)'; ctx.fillRect(0,0,W,H);

  const px2 = W/2-120, py2 = 150, pw2 = 240, ph2 = 180;
  ctx.fillStyle = 'rgba(10,30,10,0.9)';
  ctx.strokeStyle = '#44cc44'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(px2,py2,pw2,ph2,8); ctx.fill(); ctx.stroke();
  ctx.shadowColor = '#44ff44'; ctx.shadowBlur = 15;
  ctx.strokeStyle = '#66ff66'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(px2+4,py2+4,pw2-8,ph2-8,6); ctx.stroke();
  ctx.shadowBlur = 0;

  const cl = 'STAGE CLEAR!';
  pixText(cl, W/2-textW(cl,3)/2, py2+20, 3, '#66ff66', '#003300');

  // show collected stars
  const stX = W/2 - starsTotal*14/2;
  for (let i = 0; i < starsTotal; i++) {
    ctx.save();
    ctx.translate(stX + i*14 + 6, py2+65);
    ctx.rotate(frameCount*0.05+i);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const a=(Math.PI*2/5)*j-Math.PI/2,ai=a+Math.PI/5;
      ctx.lineTo(Math.cos(a)*8,Math.sin(a)*8);
      ctx.lineTo(Math.cos(ai)*3,Math.sin(ai)*3);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  const nxt = currentStage < 9 ? 'NEXT STAGE >' : 'FINAL CLEAR!';
  if (Math.floor(frameCount/30)%2===0)
    pixText(nxt, W/2-textW(nxt,2)/2, py2+140, 2, '#ccffcc', '#003300');
}

function drawDeadScreen() {
  drawBg(); drawWorld();
  ctx.fillStyle = 'rgba(30,0,0,0.6)'; ctx.fillRect(0,0,W,H);

  const px2=W/2-110,py2=180,pw2=220,ph2=130;
  ctx.fillStyle='rgba(30,10,10,0.9)';
  ctx.strokeStyle='#cc3333';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(px2,py2,pw2,ph2,8);ctx.fill();ctx.stroke();

  const d1='SPIN OUT!';
  pixText(d1,W/2-textW(d1,4)/2,py2+20,4,'#ff4444','#440000');

  const sc='STARS: '+starsCollected+'/'+starsTotal;
  pixText(sc,W/2-textW(sc,3)/2,py2+60,3,'#ffffff','#333333');

  if (Math.floor(frameCount/30)%2===0) {
    const rt='PRESS SPACE TO RETRY';
    pixText(rt,W/2-textW(rt,2)/2,py2+100,2,'#ffaaaa','#330000');
  }
}

function drawVictory() {
  drawBg();
  ctx.fillStyle = 'rgba(5,5,25,0.5)'; ctx.fillRect(0,0,W,H);

  // firework particles
  for (let i = 0; i < 3; i++) {
    const fx = W*0.2 + i*W*0.3, fy = 100+Math.sin(frameCount*0.03+i*2)*30;
    const g = ctx.createRadialGradient(fx,fy,0,fx,fy,40);
    const hue = (frameCount*3+i*120)%360;
    g.addColorStop(0,`hsla(${hue},100%,70%,0.5)`);
    g.addColorStop(1,`hsla(${hue},100%,50%,0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(fx,fy,40,0,Math.PI*2); ctx.fill();
  }

  const v1 = 'VICTORY!';
  pixText(v1,W/2-textW(v1,6)/2,160,6,'#ffcc44','#553300');

  const v2 = 'ALL 10 STAGES CLEAR';
  pixText(v2,W/2-textW(v2,3)/2,220,3,'#66ff66','#003300');

  drawBeyblade(W/2, 300, 35, frameCount*0.12, true);

  if (Math.floor(frameCount/30)%2===0) {
    const msg = 'PRESS SPACE';
    pixText(msg,W/2-textW(msg,2)/2,400,2,'#ffffff','#333333');
  }
}

// ══════════ MAIN LOOP ══════════
function loop() {
  update();

  if (state === 'title') drawTitleScreen();
  else if (state === 'dead') drawDeadScreen();
  else if (state === 'victory') drawVictory();
  else if (state === 'playing') {
    drawBg();
    drawWorld();
    drawHUD();
    // stage clear flash overlay while player falls back down
    if (clearFlash > 0) {
      ctx.fillStyle = `rgba(0,40,0,${Math.min(1, clearFlash/30)*0.5})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, clearFlash/30);
      const cl = 'STAGE ' + (currentStage+1) + ' CLEAR!';
      pixText(cl, W/2 - textW(cl,3)/2, H/2 - 20, 3, '#66ff66', '#003300');
      if (currentStage + 1 < STAGES.length) {
        const nx = 'NEXT: STAGE ' + (currentStage+2) + ' - ' + STAGES[currentStage+1].name;
        pixText(nx, W/2 - textW(nx,2)/2, H/2 + 16, 2, '#ffcc44', '#553300');
      }
      ctx.globalAlpha = 1;
    }
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
