// ═══════════════════════════════════════════════════════════
// AI — personality-driven
// ═══════════════════════════════════════════════════════════
function tickAI(b, dt) {
  if (!b.alive || !b.launched || b.isPlayer) return;

  b.idleTime  = (b.idleTime  || 0) + dt;
  b.aiTimer  -= dt;

  const nearEdge    = Math.hypot(b.x - G.arenaX, b.y - G.arenaY) > G.arenaRCurrent * 0.68;
  const stalemate   = b.idleTime > 7;          // been untouched too long
  const arenaPhase  = G.activeTime / 60;       // 0→1 over 60 seconds (arena shrinks, pressure rises)
  const player      = G.blades.find(x => x.isPlayer && x.alive);
  const otherAlive  = G.blades.filter(x => x !== b && x.alive && x.launched);

  // Nearest target (prefer player, else nearest blade)
  const target = (player && player.launched && Math.random() < 0.6) ? player
    : otherAlive.sort((a, z) => Math.hypot(a.x-b.x,a.y-b.y) - Math.hypot(z.x-b.x,z.y-b.y))[0];

  let tx, ty, accel, speedCap;

  if (nearEdge) {
    // Everyone rushes center when near edge
    tx = G.arenaX + (Math.random()-0.5)*40;
    ty = G.arenaY + (Math.random()-0.5)*40;
    accel    = 2.5;
    speedCap = MAX_SPEED * 0.85;
    b.aiTimer = 0;

  } else if (stalemate && target) {
    // Stalemate breaker: lunge at nearest blade
    tx = target.x; ty = target.y;
    accel    = 3.0 + Math.random();
    speedCap = MAX_SPEED;
    b.aiTimer = AI_INTERVAL * 0.3;
    b.idleTime = 0;

  } else if (b.personality === 'aggressive') {
    if (b.aiTimer > 0) return;
    b.aiTimer = AI_INTERVAL * (0.35 + Math.random() * 0.25);
    accel     = 2.0 + arenaPhase * 1.5 + Math.random();
    speedCap  = MAX_SPEED * (0.85 + arenaPhase * 0.15);
    // Hunt the nearest living target
    if (target) {
      tx = target.x + (Math.random()-0.5)*30;
      ty = target.y + (Math.random()-0.5)*30;
    } else {
      const a = Math.random() * Math.PI * 2;
      tx = G.arenaX + Math.cos(a) * G.arenaRCurrent * 0.25;
      ty = G.arenaY + Math.sin(a) * G.arenaRCurrent * 0.25;
    }

  } else if (b.personality === 'defensive') {
    if (b.aiTimer > 0) return;
    b.aiTimer = AI_INTERVAL * (0.6 + Math.random() * 0.4);
    // Orbit center at medium radius — but tighten orbit as arena shrinks
    const orbitR = Math.min(G.arenaRCurrent * 0.38, 100);
    const angle  = Math.atan2(b.y - G.arenaY, b.x - G.arenaX) + (0.5 + arenaPhase * 0.5);
    tx       = G.arenaX + Math.cos(angle) * orbitR;
    ty       = G.arenaY + Math.sin(angle) * orbitR;
    accel    = 1.2 + arenaPhase * 1.0 + Math.random() * 0.5;
    speedCap = MAX_SPEED * (0.50 + arenaPhase * 0.3);

  } else if (b.personality === 'chaotic') {
    // Randomly switches between aggressive, defensive, and wild lunge each interval
    if (b.aiTimer > 0) return;
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) {
      b.aiTimer = AI_INTERVAL * (0.25 + Math.random() * 0.25);
      accel     = 2.5 + arenaPhase * 1.5;
      speedCap  = MAX_SPEED * (0.9 + arenaPhase * 0.1);
      if (target) { tx = target.x + (Math.random()-0.5)*20; ty = target.y + (Math.random()-0.5)*20; }
      else { tx = G.arenaX; ty = G.arenaY; }
    } else if (mode === 1) {
      b.aiTimer = AI_INTERVAL * (0.5 + Math.random() * 0.4);
      const orbitR = Math.min(G.arenaRCurrent * 0.35, 90);
      const angle  = Math.atan2(b.y - G.arenaY, b.x - G.arenaX) + (0.6 + arenaPhase * 0.5);
      tx = G.arenaX + Math.cos(angle) * orbitR;
      ty = G.arenaY + Math.sin(angle) * orbitR;
      accel    = 1.5 + arenaPhase;
      speedCap = MAX_SPEED * (0.55 + arenaPhase * 0.25);
    } else {
      b.aiTimer = AI_INTERVAL * (0.3 + Math.random() * 0.3);
      const a = Math.random() * Math.PI * 2;
      tx = G.arenaX + Math.cos(a) * G.arenaRCurrent * 0.45;
      ty = G.arenaY + Math.sin(a) * G.arenaRCurrent * 0.45;
      accel    = 2.8 + Math.random();
      speedCap = MAX_SPEED;
    }

  } else {
    // 'passive' — still orbits, just tighter and slower, but NOT stationary
    if (b.aiTimer > 0) return;
    b.aiTimer = AI_INTERVAL * (0.7 + Math.random() * 0.5);
    const orbitR = Math.min(G.arenaRCurrent * 0.28, 70);
    const angle  = Math.atan2(b.y - G.arenaY, b.x - G.arenaX) + (0.35 + arenaPhase * 0.6);
    tx       = G.arenaX + Math.cos(angle) * orbitR;
    ty       = G.arenaY + Math.sin(angle) * orbitR;
    accel    = 0.85 + arenaPhase * 1.2 + Math.random() * 0.4;
    speedCap = MAX_SPEED * (0.38 + arenaPhase * 0.4);
  }

  const tdx = tx - b.x, tdy = ty - b.y;
  const tl  = Math.hypot(tdx, tdy);
  if (tl < 1) return;
  b.vx += (tdx / tl) * accel;
  b.vy += (tdy / tl) * accel;
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > speedCap) { b.vx *= speedCap / sp; b.vy *= speedCap / sp; }

  // AI special: ~15% chance per 10 seconds (~0.0025% per frame at 60fps)
  if (b.specialCooldown <= 0 && !b.specialActive && b.special) {
    if (Math.random() < 0.0025 * dt * 60) {
      activateSpecial(b);
    }
  }
}

