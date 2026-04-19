// ═══════════════════════════════════════════════════════════
// PHYSICS
// ═══════════════════════════════════════════════════════════
function wallCheck(b, arena) {
  const eDrain = arena ? arena.edgeDrain : EDGE_DRAIN;
  const wDamp  = arena ? arena.wallDamp  : WALL_DAMP;
  const dx     = b.x - G.arenaX;
  const dy     = b.y - G.arenaY;
  const dist   = Math.hypot(dx, dy);
  const max    = G.arenaRCurrent - b.radius;

  if (dist > max && dist > 0.01) {
    const nx = dx / dist, ny = dy / dist;
    b.x = G.arenaX + nx * max;
    b.y = G.arenaY + ny * max;
    const dot = b.vx * nx + b.vy * ny;
    b.vx = (b.vx - 2 * dot * nx) * wDamp;
    b.vy = (b.vy - 2 * dot * ny) * wDamp;
    const impact = Math.abs(dot);
    if (impact > 1.8) {
      spawnHitParticles(b.x + nx * b.radius, b.y + ny * b.radius,
        b.color, arena ? arena.rim : '#ffffff', impact / 16);
    }
  }

  const frac = dist / G.arenaRCurrent;
  if (frac > EDGE_START && !(b.specialData && b.specialData.immuneDrain)) {
    b.stamina -= eDrain * ((frac - EDGE_START) / (1 - EDGE_START)) * 2.2;
  }
}

function bladeCollide(a, b) {
  const dx   = b.x - a.x;
  const dy   = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minD = a.radius + b.radius;
  if (dist >= minD || dist < 0.01) return;

  const nx = dx / dist, ny = dy / dist;

  // Mass-weighted separation
  const totalMass = a.mass + b.mass;
  const ov = (minD - dist);
  a.x -= nx * ov * (b.mass / totalMass);
  a.y -= ny * ov * (b.mass / totalMass);
  b.x += nx * ov * (a.mass / totalMass);
  b.y += ny * ov * (a.mass / totalMass);

  // Mass-weighted impulse
  const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rvn < 0) {
    const J = -(1 + RESTITUTION) * rvn / totalMass;
    a.vx -= J * b.mass * nx; a.vy -= J * b.mass * ny;
    b.vx += J * a.mass * nx; b.vy += J * a.mass * ny;
  }

  for (const blade of [a, b]) {
    const sp = Math.hypot(blade.vx, blade.vy);
    if (sp > MAX_SPEED) { blade.vx *= MAX_SPEED / sp; blade.vy *= MAX_SPEED / sp; }
  }

  const spA = Math.hypot(a.vx, a.vy), spB = Math.hypot(b.vx, b.vy);
  const impactForce = Math.abs(rvn) * 2;

  // Track last attacker for Storm Ride (persists outside specialData)
  a.lastAttacker = b;
  b.lastAttacker = a;
  a.specialData = a.specialData || {};
  b.specialData = b.specialData || {};

  // Stamina damage (attacker's attackMult vs defender's defense)
  const baseDmg = Math.min(HIT_DRAIN_BASE + impactForce * 0.7, 30);
  let staDmgA = baseDmg * b.attackMult * a.defense;
  let staDmgB = baseDmg * a.attackMult * b.defense;

  // Burst meter damage — scales with stamina loss so you can't be one-shot burst at full health
  const wornA = 0.15 + 0.85 * (1 - Math.max(0, Math.min(1, a.stamina / a.maxStamina)));
  const wornB = 0.15 + 0.85 * (1 - Math.max(0, Math.min(1, b.stamina / b.maxStamina)));
  let burstDmgA = impactForce * b.attackMult * (1 - a.burstResist) * wornA * 14;
  let burstDmgB = impactForce * a.attackMult * (1 - b.burstResist) * wornB * 14;

  // ── Special move modifiers on damage ──
  // Royal Guard: immune to all incoming damage
  if (a.specialData.immune) { staDmgA = 0; burstDmgA = 0; }
  if (b.specialData.immune) { staDmgB = 0; burstDmgB = 0; }
  // Flash Blade: dealer takes no damage, consumes one phase hit
  if (a.specialData.phaseHits > 0) { staDmgA = 0; burstDmgA = 0; a.specialData.phaseHits--; if (a.specialData.phaseHits <= 0) endSpecial(a); }
  if (b.specialData.phaseHits > 0) { staDmgB = 0; burstDmgB = 0; b.specialData.phaseHits--; if (b.specialData.phaseHits <= 0) endSpecial(b); }
  // Mirror Spin: zero stamina loss for that blade
  if (a.specialData.mirror) { staDmgA = 0; }
  if (b.specialData.mirror) { staDmgB = 0; }
  // Venom Mark: marked blade takes double burst damage
  if (a.specialData.venomMark > 0) { burstDmgA *= 2; }
  if (b.specialData.venomMark > 0) { burstDmgB *= 2; }
  // Shell Defense: half burst damage
  if (a.specialData.halfBurst) { burstDmgA *= 0.5; }
  if (b.specialData.halfBurst) { burstDmgB *= 0.5; }
  // Tectonic Stance: reflect stamina damage back, nullify own burst damage
  if (a.specialData.reflect) { b.stamina -= staDmgA; staDmgA = 0; burstDmgA = 0; }
  if (b.specialData.reflect) { a.stamina -= staDmgB; staDmgB = 0; burstDmgB = 0; }
  // Foresight (ORACLE EYE): defender dodges entirely, consumes one charge, short teleport blip
  if (a.specialData.foresight > 0 && (staDmgA > 0 || burstDmgA > 0)) {
    staDmgA = 0; burstDmgA = 0;
    a.specialData.foresight--;
    const ang = Math.random() * Math.PI * 2, kick = 36;
    a.x += Math.cos(ang) * kick; a.y += Math.sin(ang) * kick;
    spawnHitParticles(a.x, a.y, '#ddbbff', '#aa66ff', 0.4);
    if (a.specialData.foresight <= 0) endSpecial(a);
  }
  if (b.specialData.foresight > 0 && (staDmgB > 0 || burstDmgB > 0)) {
    staDmgB = 0; burstDmgB = 0;
    b.specialData.foresight--;
    const ang = Math.random() * Math.PI * 2, kick = 36;
    b.x += Math.cos(ang) * kick; b.y += Math.sin(ang) * kick;
    spawnHitParticles(b.x, b.y, '#ddbbff', '#aa66ff', 0.4);
    if (b.specialData.foresight <= 0) endSpecial(b);
  }
  // Pattern Recognition (THE PATTERN): dodge next N hits, then reflect % of remaining damage taken
  if (a.specialData.patternDodge > 0 && (staDmgA > 0 || burstDmgA > 0)) {
    staDmgA = 0; burstDmgA = 0;
    a.specialData.patternDodge--;
    const ang = Math.random() * Math.PI * 2, kick = 28;
    a.x += Math.cos(ang) * kick; a.y += Math.sin(ang) * kick;
    spawnHitParticles(a.x, a.y, '#ffee88', '#ddbbff', 0.5);
  }
  if (b.specialData.patternDodge > 0 && (staDmgB > 0 || burstDmgB > 0)) {
    staDmgB = 0; burstDmgB = 0;
    b.specialData.patternDodge--;
    const ang = Math.random() * Math.PI * 2, kick = 28;
    b.x += Math.cos(ang) * kick; b.y += Math.sin(ang) * kick;
    spawnHitParticles(b.x, b.y, '#ffee88', '#ddbbff', 0.5);
  }
  if (a.specialData.patternReflect > 0) b.stamina -= staDmgA * a.specialData.patternReflect;
  if (b.specialData.patternReflect > 0) a.stamina -= staDmgB * b.specialData.patternReflect;
  // Thorn Armor (OBSIDIAN FANG): attacker takes 30% of the dmg they dealt
  if (a.specialData.thornArmor) b.stamina -= staDmgB * 0.30;
  if (b.specialData.thornArmor) a.stamina -= staDmgA * 0.30;
  // Coil Drain (SERPENT COIL): attacker heals 50% of stamina dealt
  if (a.specialData.coilDrain && staDmgB > 0) {
    a.stamina = Math.min(a.maxStamina, a.stamina + staDmgB * 0.5);
  }
  if (b.specialData.coilDrain && staDmgA > 0) {
    b.stamina = Math.min(b.maxStamina, b.stamina + staDmgA * 0.5);
  }

  a.stamina -= staDmgA;
  b.stamina -= staDmgB;
  a.burstHealth -= burstDmgA;
  b.burstHealth -= burstDmgB;

  a.flash = b.flash = 0.18;
  a.idleTime = b.idleTime = 0;   // reset stalemate timer on hit

  const intensity = Math.min(impactForce / 18, 1);
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
  spawnHitParticles(cx, cy, a.color, b.color, intensity);
  G.shakeX = (Math.random() - .5) * 16 * intensity;
  G.shakeY = (Math.random() - .5) * 16 * intensity;
  G.shakeT = 0.18;
  playHit(intensity);

  // ── POWER CLASH: head-on at high speed → slow-mo ──
  if (impactForce > 12 && G.clashTimer <= 0) {
    G.clashTimer = 0.7;
    G.clashX = cx; G.clashY = cy;
    G.clashAlpha = 1;
    spawnHitParticles(cx, cy, '#ffffff', '#ffff00', 1);
    playHit(1);
  }

  // ── BURST FINISH ──
  for (const blade of [a, b]) {
    if (blade.burstHealth <= 0 && !blade.bursting) triggerBurst(blade);
  }
}

function triggerBurst(blade) {
  blade.bursting = true;
  blade.alive    = false;
  blade.stamina  = 0;
  playSpinOut(); playHit(1);

  for (let i = 0; i < 45; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 110 + Math.random() * 260;
    G.parts.push(new Particle(blade.x, blade.y, i % 3 === 0 ? '#ffffff' : blade.color,
      Math.cos(a) * s, Math.sin(a) * s, 3 + Math.random() * 4, 0.7 + Math.random() * 0.8));
  }

  G.popups = G.popups || [];
  G.popups.push({ text: 'BURST FINISH!', x: blade.x, y: blade.y - 30,
    color: blade.color, timer: 1.4, maxTimer: 1.4 });

  G.shakeX = (Math.random() - .5) * 36;
  G.shakeY = (Math.random() - .5) * 36;
  G.shakeT = 0.5;
}

