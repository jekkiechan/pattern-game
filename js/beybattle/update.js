// ═══════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════
function update(dt) {
  // ── READY: blades rev up but don't move ──
  if (G.state === 'ready') {
    G.blades.forEach(b => {
      if (!b.alive) return;
      b.spinRate = Math.min(b.spinRate + dt * 3, 22); // rev up
      b.angle   += b.spinRate * dt;
    });
    return;
  }

  // ── ACTIVE: track time, apply arena physics, shrink arena ──
  const arena = ARENAS[G.selectedArena];
  G.activeTime += dt;
  if (G.activeTime > 18) {
    const shrinkTarget = G.arenaR * 0.60;
    const shrinkSpeed  = G.arenaR * 0.012 * dt;
    G.arenaRCurrent = Math.max(shrinkTarget, G.arenaRCurrent - shrinkSpeed);
  }

  if (G.boostCooldown > 0) G.boostCooldown = Math.max(0, G.boostCooldown - dt);

  // Charge progress for player special
  if (G.pressIsCharging) {
    const player = G.blades.find(b => b.isPlayer && b.alive);
    if (player && player.specialCooldown <= 0) {
      player.chargeProgress = Math.min(1, player.chargeProgress + dt / SPECIAL_CHARGE_TIME);
    }
  }

  // Power clash slow-mo
  if (G.clashTimer > 0) {
    G.clashTimer -= dt;
    G.clashAlpha = Math.max(0, G.clashTimer / 0.7);
    dt *= 0.18;
  }

  // Burst Finisher slow-mo (stacks with clash — take the smaller scale)
  if (G.finisher && G.finisher.t > 0) {
    G.finisher.t      -= dt;
    G.finisher.flash   = Math.max(0, G.finisher.flash - dt);
    // Heavy slow-mo early, easing back to normal
    const phase = 1 - Math.max(0, G.finisher.t) / G.finisher.max;
    const scale = 0.25 + phase * 0.55; // 0.25 → 0.80
    dt *= scale;
    if (G.finisher.t <= 0) G.finisher = null;
  }

  // Shake decay
  if (G.shakeT > 0) {
    G.shakeT -= dt;
    G.shakeX *= 0.80; G.shakeY *= 0.80;
    if (G.shakeT <= 0) { G.shakeX = G.shakeY = 0; }
  }

  G.blades.forEach(b => {
    if (!b.alive || !b.launched) return;
    tickAI(b, dt);

    b.x += b.vx; b.y += b.vy;
    b.vx *= arena.friction; b.vy *= arena.friction;

    b.spinRate = Math.max(0, b.spinRate - dt * (0.25 + b.wobble * 3.5));
    b.angle   += b.spinRate * dt;
    if (b.flash > 0) b.flash -= dt;

    // ── Special cooldown tick ──
    if (b.specialCooldown > 0) b.specialCooldown = Math.max(0, b.specialCooldown - dt);
    // ── Venom mark decay ──
    if (b.specialData.venomMark > 0) b.specialData.venomMark -= dt;
    // ── Chain bound (applied by HELLS CHAIN) ──
    if (b.specialData.chainBound > 0) {
      b.specialData.chainBound -= dt;
      const cbSpd = Math.hypot(b.vx, b.vy);
      const cbCap = MAX_SPEED * 0.4;
      if (cbSpd > cbCap) { b.vx *= cbCap/cbSpd; b.vy *= cbCap/cbSpd; }
    }
    // ── Active special per-frame effects ──
    if (b.specialActive && b.specialTimer > 0) {
      b.specialTimer -= dt;
      // Dragoon Vortex: pull nearby foes
      if (b.specialData.vortex) {
        G.blades.forEach(other => {
          if (other === b || !other.alive) return;
          const dvx = b.x - other.x, dvy = b.y - other.y;
          const dd = Math.hypot(dvx, dvy);
          if (dd < 130 && dd > 0) { other.vx += (dvx/dd)*1.8*dt*60; other.vy += (dvy/dd)*1.8*dt*60; }
        });
      }
      // Frozen Field: slow nearby foes each frame
      if (b.specialData.frozenField) {
        G.blades.forEach(other => {
          if (other === b || !other.alive) return;
          if (Math.hypot(other.x - b.x, other.y - b.y) < 95) { other.vx *= 0.97; other.vy *= 0.97; }
        });
      }
      // Tectonic Stance: keep frozen in place
      if (b.specialData.frozen) { b.vx = 0; b.vy = 0; }
      // Dran Rush: skip max-speed cap this frame (already boosted above MAX_SPEED)
      if (b.specialData.frictionOverride) {
        const rushSpd = Math.hypot(b.vx, b.vy);
        if (rushSpd > 0 && rushSpd < MAX_SPEED * 1.8) { /* maintain momentum, don't clamp */ }
      }
      // Phantom Orbit: slowly recover stamina while immune to drain
      if (b.specialData.immuneDrain) {
        b.stamina = Math.min(b.maxStamina, b.stamina + dt * 3.5);
      }
      if (b.specialTimer <= 0) endSpecial(b);
    } else if (b.specialActive) {
      endSpecial(b);
    }

    // Motion trail
    const spd = Math.hypot(b.vx, b.vy);
    if (spd > 2.5) b.trail.push({ x: b.x, y: b.y, age: 0 });
    b.trail.forEach(t => t.age += dt);
    b.trail = b.trail.filter(t => t.age < 0.22);

    wallCheck(b, arena);

    if (b.spinRate < 2.5) b.stamina -= dt * 4;

    if (b.stamina <= 0) {
      b.stamina   = 0;
      b.wobble    = Math.min(1, b.wobble + dt * 2.2);
      b.wobbleP  += dt * (14 + b.wobble * 10);
      b.spinRate  = Math.max(0, b.spinRate - dt * 6);
      b.dying    += dt;

      if (b.dying > 1.6) {
        b.alive = false;
        playSpinOut();
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 60 + Math.random() * 120;
          G.parts.push(new Particle(b.x, b.y, b.color,
            Math.cos(a) * s, Math.sin(a) * s, 3, 0.5 + Math.random() * 0.6));
        }
      }
    }
  });

  // Blade-blade collisions
  for (let i = 0; i < G.blades.length; i++) {
    for (let j = i + 1; j < G.blades.length; j++) {
      const a = G.blades[i], b = G.blades[j];
      if (a.alive && b.alive && a.launched && b.launched) bladeCollide(a, b);
    }
  }

  // Particles
  G.parts = G.parts.filter(p => p.life > 0);
  G.parts.forEach(p => p.update(dt));

  refreshHUD();
  checkWin();
}

function checkWin() {
  if (G.state !== 'active') return;
  const alive = G.blades.filter(b => b.alive && b.launched);
  if (alive.length > 1) return;

  G.state = 'over';
  document.getElementById('hud').style.display          = 'none';
  document.getElementById('launch-hint').style.display  = 'none';

  const rT  = document.getElementById('result-title');
  const rS  = document.getElementById('result-sub');
  const w   = alive[0];

  // Tournament routing: player won → next round or champion; otherwise eliminated
  if (G.mode === 'tournament' && G.tournament) {
    const playerAlive = w && w.isPlayer;
    setTimeout(() => tOnRoundEnd(playerAlive, playerAlive ? w : null), 1400);
    return;
  }

  if (!w) {
    rT.textContent = 'DRAW'; rT.className = 'result-title draw';
    rS.textContent = 'ALL BLADES HAVE FALLEN';
  } else if (w.isPlayer) {
    rT.textContent = 'VICTORY!'; rT.className = 'result-title win';
    rS.textContent = `${w.name} IS THE CHAMPION`;
  } else {
    rT.textContent = 'DEFEATED'; rT.className = 'result-title lose';
    rS.textContent = `${w.name} WINS THE ROUND`;
  }

  setTimeout(() => document.getElementById('screen-end').classList.add('active'), 1400);
}

