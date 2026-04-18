// ═══════════════════════════════════════════════════════════
// SPECIAL MOVES
// ═══════════════════════════════════════════════════════════
function nearestAlive(blade) {
  let best = null, bestD = Infinity;
  G.blades.forEach(b => {
    if (b === blade || !b.alive) return;
    const d = Math.hypot(b.x - blade.x, b.y - blade.y);
    if (d < bestD) { bestD = d; best = b; }
  });
  return best;
}

function spawnSpecialParticles(x, y, color, count, speed, life) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * 60 + Math.random() * speed * 80;
    G.parts.push(new Particle(x, y, color, Math.cos(a)*s, Math.sin(a)*s, 2.5 + Math.random()*2, life));
  }
}

function meteorSlam(blade) {
  // Phase 2 of Meteor Fall — teleport onto the target and explode.
  const tgt = (blade.specialData.meteorTargetId >= 0) ? G.blades[blade.specialData.meteorTargetId] : null;
  const living = tgt && tgt.alive ? tgt : nearestAlive(blade);
  if (living) {
    blade.x = living.x;
    blade.y = living.y;
  }
  const gx = blade.x, gy = blade.y;

  // Impact AOE: massive stamina damage + knockback to all in range
  G.blades.forEach(foe => {
    if (foe === blade || !foe.alive) return;
    const dx = foe.x - gx, dy = foe.y - gy, d = Math.hypot(dx, dy) || 1;
    if (d < 160) {
      foe.stamina = Math.max(0, foe.stamina - 50);
      foe.wobble  = Math.min(1, foe.wobble + 0.55);
      foe.vx += (dx / d) * 14;
      foe.vy += (dy / d) * 14;
    }
  });

  // Radial shockwave particles
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
    const r = 28 + Math.random() * 20;
    G.parts.push(new Particle(
      gx + Math.cos(a) * r, gy + Math.sin(a) * r,
      Math.random() < 0.4 ? '#ffffff' : '#ffaa33',
      Math.cos(a) * (180 + Math.random() * 120),
      Math.sin(a) * (180 + Math.random() * 120),
      3 + Math.random() * 2, 0.9 + Math.random() * 0.4
    ));
  }
  spawnSpecialParticles(gx, gy, '#ff7722', 26, 5, 1.2);

  G.shakeX = (Math.random() - 0.5) * 30;
  G.shakeY = (Math.random() - 0.5) * 30;
  G.shakeT = 0.55;

  G.popups = G.popups || [];
  G.popups.push({ x: gx, y: gy - 36, text: 'METEOR IMPACT!',
    color: '#ffcc66', timer: 1.4, maxTimer: 1.4 });

  playLaunch();
}

function endSpecial(b) {
  // Restore any mutated base stats
  if (b.specialData.savedAtkMult !== undefined) b.attackMult = b.specialData.savedAtkMult;
  if (b.specialData.savedDef     !== undefined) b.defense    = b.specialData.savedDef;
  if (b.specialData.finisherAtk  !== undefined) b.attackMult = b.specialData.finisherAtk;
  b.specialActive  = false;
  b.specialTimer   = 0;
  b.specialData    = {};
  b.burstFinisher  = false;
}

// Burst-Finisher threshold: firing a special below this stamina ratio
// triggers a cinematic slow-mo burst with amplified payoff.
const FINISHER_THRESHOLD = 0.30;

function triggerBurstFinisher(blade) {
  G.finisher = { t: 1.2, max: 1.2, blade, flash: 0.25 };

  // Radial burst wave: visual shockwave + AOE stamina damage
  const gx = blade.x, gy = blade.y;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
    const r = 18 + Math.random() * 18;
    G.parts.push(new Particle(
      gx + Math.cos(a) * r, gy + Math.sin(a) * r,
      Math.random() < 0.5 ? '#ffffff' : blade.glow,
      Math.cos(a) * (160 + Math.random() * 80),
      Math.sin(a) * (160 + Math.random() * 80),
      2.5 + Math.random() * 2.5, 0.9 + Math.random() * 0.4
    ));
  }
  G.blades.forEach(foe => {
    if (foe === blade || !foe.alive) return;
    const d = Math.hypot(foe.x - gx, foe.y - gy);
    if (d < 170) {
      foe.stamina = Math.max(0, foe.stamina - 14);
      foe.wobble  = Math.min(1, foe.wobble + 0.25);
      const nx = (foe.x - gx) / (d || 1), ny = (foe.y - gy) / (d || 1);
      foe.vx += nx * 4.5; foe.vy += ny * 4.5;
    }
  });

  // Extra attack boost for the duration of the special
  blade.specialData = blade.specialData || {};
  blade.specialData.finisherAtk = blade.attackMult;
  blade.attackMult *= 1.5;

  G.shakeX = (Math.random() - 0.5) * 24;
  G.shakeY = (Math.random() - 0.5) * 24;
  G.shakeT = 0.5;

  G.popups = G.popups || [];
  G.popups.push({
    x: canvas.width / 2, y: canvas.height * 0.35,
    text: 'BURST FINISHER!', color: '#ffdd44',
    timer: 1.6, maxTimer: 1.6
  });

  playLaunch();
}

function activateSpecial(blade) {
  if (!blade.alive || blade.specialCooldown > 0) return;
  const isFinisher = (blade.stamina / blade.maxStamina) < FINISHER_THRESHOLD;
  blade.specialActive   = true;
  blade.specialCooldown = SPECIAL_COOLDOWN;
  blade.specialTimer    = 0;
  blade.specialData     = {};
  blade.burstFinisher   = isFinisher;
  if (isFinisher) triggerBurstFinisher(blade);

  const effect = blade.special.effect;
  const gx = blade.x, gy = blade.y;

  switch (effect) {

    case 'drakeImpact': {
      blade.specialTimer = 3;
      blade.specialData.savedAtkMult = blade.attackMult;
      blade.attackMult *= 1.5;
      G.blades.forEach(b => {
        if (b === blade || !b.alive) return;
        const dx = b.x - gx, dy = b.y - gy, d = Math.hypot(dx, dy);
        if (d < 80 && d > 0) { b.vx += (dx/d)*5; b.vy += (dy/d)*5; }
      });
      spawnSpecialParticles(gx, gy, blade.glow, 18, 4, 0.9);
      break;
    }

    case 'dranRush': {
      blade.specialTimer = 2;
      blade.specialData.frictionOverride = true;
      const spd = Math.hypot(blade.vx, blade.vy) || 1;
      blade.vx = (blade.vx/spd) * MAX_SPEED * 2;
      blade.vy = (blade.vy/spd) * MAX_SPEED * 2;
      spawnSpecialParticles(gx, gy, '#ff6600', 14, 5, 0.8);
      break;
    }

    case 'dragoonVortex': {
      blade.specialTimer = 2.5;
      blade.specialData.vortex = true;
      spawnSpecialParticles(gx, gy, '#2288ff', 20, 3, 1.0);
      break;
    }

    case 'galeRedirect': {
      blade.vx *= -1; blade.vy *= -1;
      spawnSpecialParticles(gx, gy, blade.glow, 10, 3, 0.6);
      blade.specialActive = false;
      break;
    }

    case 'flashBlade': {
      blade.specialTimer = 2.5;
      blade.specialData.phaseHits = 2;
      spawnSpecialParticles(gx, gy, '#3366cc', 12, 3, 0.8);
      break;
    }

    case 'chainBind': {
      blade.specialTimer = 3;
      G.blades.forEach(b => {
        if (b === blade || !b.alive) return;
        b.specialData = b.specialData || {};
        b.specialData.chainBound = 3;
      });
      spawnSpecialParticles(gx, gy, '#6600cc', 16, 3, 0.9);
      break;
    }

    case 'royalGuard': {
      blade.specialTimer = 2.5;
      blade.specialData.immune = true;
      spawnSpecialParticles(gx, gy, '#4488ff', 14, 2, 1.0);
      break;
    }

    case 'huntingSpeed': {
      const tgt = nearestAlive(blade);
      if (tgt) {
        const dx = tgt.x - gx, dy = tgt.y - gy, d = Math.hypot(dx, dy) || 1;
        blade.vx = (dx/d) * MAX_SPEED;
        blade.vy = (dy/d) * MAX_SPEED;
      }
      spawnSpecialParticles(gx, gy, '#00ffcc', 10, 5, 0.7);
      blade.specialActive = false;
      break;
    }

    case 'prideRoar': {
      G.blades.forEach(b => {
        if (b === blade || !b.alive) return;
        const dx = b.x - gx, dy = b.y - gy, d = Math.hypot(dx, dy);
        if (d < 110 && d > 0) { b.vx += (dx/d)*6; b.vy += (dy/d)*6; }
      });
      spawnSpecialParticles(gx, gy, '#ffdd00', 22, 5, 0.9);
      G.shakeX = (Math.random()-0.5)*10; G.shakeY = (Math.random()-0.5)*10; G.shakeT = 0.2;
      blade.specialActive = false;
      break;
    }

    case 'windRecovery': {
      blade.stamina = Math.min(blade.maxStamina, blade.stamina + 25);
      spawnSpecialParticles(gx, gy, '#00ff66', 12, 2, 0.8);
      blade.specialActive = false;
      break;
    }

    case 'phantomDrive': {
      blade.x = G.arenaX; blade.y = G.arenaY;
      blade.vx *= 0.3; blade.vy *= 0.3;
      blade.stamina = Math.min(blade.maxStamina, blade.stamina + 20);
      spawnSpecialParticles(G.arenaX, G.arenaY, '#aabbff', 16, 3, 0.9);
      blade.specialActive = false;
      break;
    }

    case 'mirrorSpin': {
      blade.specialTimer = 3;
      blade.specialData.mirror = true;
      spawnSpecialParticles(gx, gy, '#ff44cc', 10, 2, 0.8);
      break;
    }

    case 'groundStomp': {
      G.blades.forEach(b => { if (b !== blade && b.alive) b.wobble = Math.min(1, b.wobble + 0.25); });
      G.shakeX = (Math.random()-0.5)*20; G.shakeY = (Math.random()-0.5)*20; G.shakeT = 0.3;
      spawnSpecialParticles(gx, gy, '#ff4400', 20, 4, 0.9);
      blade.specialActive = false;
      break;
    }

    case 'venomMark': {
      const vt = nearestAlive(blade);
      if (vt) {
        vt.specialData = vt.specialData || {};
        vt.specialData.venomMark = 4;
      }
      spawnSpecialParticles(gx, gy, '#44ff44', 10, 2, 0.8);
      blade.specialActive = false;
      break;
    }

    case 'tectonicStance': {
      blade.specialTimer = 3;
      blade.specialData.frozen  = true;
      blade.specialData.reflect = true;
      blade.vx = 0; blade.vy = 0;
      spawnSpecialParticles(gx, gy, '#bb7733', 14, 2, 1.0);
      break;
    }

    case 'shellDefense': {
      blade.stamina = Math.min(blade.maxStamina, blade.stamina + 30);
      blade.specialTimer = 3;
      blade.specialData.halfBurst = true;
      spawnSpecialParticles(gx, gy, '#00ddbb', 12, 2, 0.9);
      break;
    }

    case 'stormRide': {
      const la = blade.lastAttacker;
      if (la && la.alive) {
        const dx = la.x - gx, dy = la.y - gy, d = Math.hypot(dx, dy) || 1;
        blade.vx = (dx/d) * MAX_SPEED;
        blade.vy = (dy/d) * MAX_SPEED;
      } else {
        // No attacker tracked: lunge at nearest
        const near = nearestAlive(blade);
        if (near) {
          const dx = near.x - gx, dy = near.y - gy, d = Math.hypot(dx, dy) || 1;
          blade.vx = (dx/d) * MAX_SPEED;
          blade.vy = (dy/d) * MAX_SPEED;
        }
      }
      spawnSpecialParticles(gx, gy, '#88aaff', 12, 4, 0.8);
      blade.specialActive = false;
      break;
    }

    case 'phoenixEmber': {
      if (blade.stamina < blade.maxStamina * 0.5) {
        blade.stamina = Math.min(blade.maxStamina, blade.stamina + 25);
        blade.specialTimer = 2;
        blade.specialData.savedAtkMult = blade.attackMult;
        blade.attackMult *= 1.3;
      } else {
        blade.specialActive = false;   // only fires when low stamina
      }
      spawnSpecialParticles(gx, gy, '#ffcc00', 16, 3, 1.0);
      break;
    }

    case 'frozenField': {
      blade.specialTimer = 3;
      blade.specialData.frozenField = true;
      spawnSpecialParticles(gx, gy, '#88ddff', 14, 2, 0.9);
      break;
    }

    case 'darkPull': {
      const dx = G.arenaX - gx, dy = G.arenaY - gy, d = Math.hypot(dx, dy) || 1;
      blade.vx = (dx/d) * MAX_SPEED;
      blade.vy = (dy/d) * MAX_SPEED;
      spawnSpecialParticles(gx, gy, '#ff6600', 10, 4, 0.7);
      blade.specialActive = false;
      break;
    }

    case 'zeroGVoid': {
      G.blades.forEach(b => {
        if (b !== blade && b.alive) b.stamina = Math.max(0, b.stamina - 8);
      });
      blade.stamina = Math.min(blade.maxStamina, blade.stamina + 5);
      spawnSpecialParticles(gx, gy, '#9900cc', 20, 3, 1.0);
      blade.specialActive = false;
      break;
    }

    case 'phantomOrbit': {
      blade.stamina = Math.min(blade.maxStamina, blade.stamina + 50);
      blade.specialTimer = 5;
      blade.specialData.immuneDrain = true;
      // Spawn a wide orbital ring of particles
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        const r = 55 + Math.random() * 25;
        G.parts.push(new Particle(gx + Math.cos(a) * r, gy + Math.sin(a) * r,
          Math.random() < 0.5 ? '#aaddff' : '#ffffff',
          Math.cos(a + Math.PI * 0.5) * (20 + Math.random() * 30),
          Math.sin(a + Math.PI * 0.5) * (20 + Math.random() * 30),
          1.5 + Math.random() * 2, 0.7 + Math.random() * 0.5));
      }
      spawnSpecialParticles(gx, gy, '#66aaff', 18, 3, 1.1);
      break;
    }

    case 'finalDrive': {
      // Slam all living opponents: deal massive stamina damage + knockback
      const foes = G.blades.filter(b => b !== blade && b.alive);
      foes.forEach(foe => {
        const dx = foe.x - gx, dy = foe.y - gy, d = Math.hypot(dx, dy) || 1;
        foe.stamina = Math.max(0, foe.stamina - 40);
        foe.wobble  = Math.min(1, foe.wobble + 0.50);
        foe.vx += (dx / d) * 14;
        foe.vy += (dy / d) * 14;
        spawnSpecialParticles(foe.x, foe.y, '#ffffff', 10, 3, 0.8);
      });
      // Boost toward nearest foe at hyper speed
      const nearest = nearestAlive(blade);
      if (nearest) {
        const dx = nearest.x - gx, dy = nearest.y - gy, d = Math.hypot(dx, dy) || 1;
        blade.vx = (dx / d) * MAX_SPEED * 1.6;
        blade.vy = (dy / d) * MAX_SPEED * 1.6;
      }
      // Double attack multiplier for 4 seconds
      blade.specialTimer = 4;
      blade.specialData.savedAtkMult = blade.attackMult;
      blade.attackMult *= 2.0;
      // Big Bang burst: radial shockwave of blue-white particles
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
        const r = 30 + Math.random() * 30;
        G.parts.push(new Particle(
          gx + Math.cos(a) * r, gy + Math.sin(a) * r,
          Math.random() < 0.5 ? '#ffffff' : '#66aaff',
          Math.cos(a) * (50 + Math.random() * 40),
          Math.sin(a) * (50 + Math.random() * 40),
          2 + Math.random() * 2.5, 0.85 + Math.random() * 0.4
        ));
      }
      spawnSpecialParticles(gx, gy, '#aaddff', 24, 5, 1.2);
      G.shakeX = (Math.random() - 0.5) * 22; G.shakeY = (Math.random() - 0.5) * 22; G.shakeT = 0.45;
      break;
    }

    case 'meteorFall': {
      // Phase 1: freeze + invuln for 1s, picking a target; phase 2 (in update) slams.
      const tgt = nearestAlive(blade);
      blade.specialTimer = 1.0;
      blade.specialData.immune = true;
      blade.specialData.frozen = true;
      blade.specialData.meteorPending = true;
      blade.specialData.meteorTargetId = tgt ? G.blades.indexOf(tgt) : -1;
      blade.vx = 0; blade.vy = 0;
      spawnSpecialParticles(gx, gy, '#ffcc66', 18, 3, 0.9);
      // Rising glow column
      for (let i = 0; i < 14; i++) {
        G.parts.push(new Particle(gx + (Math.random() - 0.5) * 24, gy + Math.random() * 14,
          '#ffaa33', 0, -60 - Math.random() * 80, 2.5 + Math.random() * 2, 0.8 + Math.random() * 0.4));
      }
      break;
    }

    case 'coilDrain': {
      blade.specialTimer = 3.0;
      blade.specialData.coilDrain = true;
      spawnSpecialParticles(gx, gy, '#88ff99', 16, 3, 0.9);
      break;
    }

    case 'foresight': {
      blade.specialTimer = 6.0;               // window to consume dodges
      blade.specialData.foresight = 2;        // two hits dodged
      spawnSpecialParticles(gx, gy, '#ddbbff', 14, 2, 1.0);
      break;
    }

    case 'thornArmor': {
      blade.specialTimer = 5.0;
      blade.specialData.thornArmor = true;
      spawnSpecialParticles(gx, gy, '#8844ff', 20, 3, 1.1);
      // Radiating thorn ring
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
        const r = 30 + Math.random() * 12;
        G.parts.push(new Particle(gx + Math.cos(a) * r, gy + Math.sin(a) * r,
          '#8844ff', Math.cos(a) * 60, Math.sin(a) * 60, 2 + Math.random() * 1.5, 0.7));
      }
      break;
    }

    case 'soulHarvest': {
      // Find foe with lowest current stamina ratio
      let victim = null, worst = Infinity;
      G.blades.forEach(b => {
        if (b === blade || !b.alive) return;
        const r = b.stamina / b.maxStamina;
        if (r < worst) { worst = r; victim = b; }
      });
      if (victim) {
        const ratio = victim.stamina / victim.maxStamina;
        if (ratio < 0.20) {
          // Execute
          victim.stamina = 0;
          victim.wobble  = 1;
          spawnSpecialParticles(victim.x, victim.y, '#66ffaa', 26, 5, 1.2);
          G.popups = G.popups || [];
          G.popups.push({ x: victim.x, y: victim.y - 30,
            text: 'HARVESTED', color: '#66ffaa', timer: 1.4, maxTimer: 1.4 });
        } else {
          victim.stamina = Math.max(0, victim.stamina - 30);
          victim.wobble  = Math.min(1, victim.wobble + 0.35);
          spawnSpecialParticles(victim.x, victim.y, '#66ffaa', 16, 4, 1.0);
        }
        blade.stamina = Math.min(blade.maxStamina, blade.stamina + 15);
      }
      spawnSpecialParticles(gx, gy, '#66ffaa', 16, 3, 1.0);
      blade.specialActive = false;
      break;
    }

    case 'eruption': {
      blade.specialTimer = 5.0;
      blade.specialData.eruption = true;
      blade.specialData.lavaTick = 0;
      G.lavaPools = G.lavaPools || [];
      spawnSpecialParticles(gx, gy, '#ff6600', 20, 4, 1.0);
      G.shakeX = (Math.random() - 0.5) * 12;
      G.shakeY = (Math.random() - 0.5) * 12;
      G.shakeT = 0.25;
      break;
    }

    case 'depthCharge': {
      G.blades.forEach(b => {
        if (b === blade || !b.alive) return;
        b.specialData = b.specialData || {};
        b.specialData.depthSlow = 4.0;
        b.specialCooldown = Math.min(SPECIAL_COOLDOWN, b.specialCooldown + 3.0);
      });
      spawnSpecialParticles(gx, gy, '#00ddff', 22, 3, 1.1);
      // Expanding pressure ring
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
        G.parts.push(new Particle(gx, gy, '#00ddff',
          Math.cos(a) * 220, Math.sin(a) * 220, 2.5 + Math.random() * 1.5, 1.0));
      }
      blade.specialActive = false;
      break;
    }

    case 'dragonEmperor': {
      // Left-spin absorption: drain stamina from every foe, feed self,
      // then enter a 4s rampage (+80% attack, boosted max speed toward nearest foe).
      const foes = G.blades.filter(b => b !== blade && b.alive);
      foes.forEach(foe => {
        foe.stamina = Math.max(0, foe.stamina - 18);
        foe.wobble  = Math.min(1, foe.wobble + 0.30);
        const dx = foe.x - gx, dy = foe.y - gy, d = Math.hypot(dx, dy) || 1;
        // Tether particles: draw streams from foes toward the dragon
        for (let k = 0; k < 8; k++) {
          const t = k / 8;
          G.parts.push(new Particle(
            foe.x - dx * t, foe.y - dy * t,
            k % 2 ? '#ffcc44' : '#ff3344',
            -dx * 0.6, -dy * 0.6, 1.8 + Math.random() * 1.4, 0.5 + Math.random() * 0.3
          ));
        }
      });
      blade.stamina = Math.min(blade.maxStamina, blade.stamina + Math.min(40, foes.length * 14));

      blade.specialTimer = 4;
      blade.specialData.savedAtkMult = blade.attackMult;
      blade.attackMult *= 1.8;

      // Hyper-lunge at nearest foe
      const tgt = nearestAlive(blade);
      if (tgt) {
        const dx = tgt.x - gx, dy = tgt.y - gy, d = Math.hypot(dx, dy) || 1;
        blade.vx = (dx / d) * MAX_SPEED * 1.5;
        blade.vy = (dy / d) * MAX_SPEED * 1.5;
      }

      // Golden-crimson burst
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        const r = 26 + Math.random() * 22;
        G.parts.push(new Particle(
          gx + Math.cos(a) * r, gy + Math.sin(a) * r,
          Math.random() < 0.5 ? '#ffcc44' : '#ff3344',
          Math.cos(a) * (60 + Math.random() * 50),
          Math.sin(a) * (60 + Math.random() * 50),
          2.4 + Math.random() * 2, 0.8 + Math.random() * 0.4
        ));
      }
      spawnSpecialParticles(gx, gy, '#ff4455', 24, 5, 1.1);
      G.shakeX = (Math.random() - 0.5) * 20;
      G.shakeY = (Math.random() - 0.5) * 20;
      G.shakeT = 0.4;

      G.popups = G.popups || [];
      G.popups.push({ x: gx, y: gy - 36, text: 'DRAGON EMPEROR',
        color: '#ffcc44', timer: 1.4, maxTimer: 1.4 });
      break;
    }

    case 'fatesHand': {
      const roll = Math.random();
      if (roll < 0.25) {
        // Chaos Strike: rush at nearest foe + deal massive stamina damage + attack boost
        const target = nearestAlive(blade);
        if (target) {
          const dx = target.x - gx, dy = target.y - gy, d = Math.hypot(dx, dy) || 1;
          blade.vx = (dx/d) * MAX_SPEED * 2.6;
          blade.vy = (dy/d) * MAX_SPEED * 2.6;
          target.stamina = Math.max(0, target.stamina - 45);
          target.wobble  = Math.min(1, target.wobble + 0.80);
          spawnSpecialParticles(target.x, target.y, '#cc66ff', 18, 5, 1.1);
        }
        blade.specialData.savedAtkMult = blade.attackMult;
        blade.attackMult *= 2.3;
        blade.specialTimer = 3.0;
        spawnSpecialParticles(gx, gy, '#cc66ff', 14, 5, 1.0);
      } else if (roll < 0.5) {
        // Void Restore: recover 55 stamina + temporary defense boost
        blade.stamina = Math.min(blade.maxStamina, blade.stamina + 55);
        blade.specialData.savedDef = blade.defense;
        blade.defense = Math.max(0.10, blade.defense - 0.28);
        blade.specialTimer = 4.0;
        spawnSpecialParticles(gx, gy, '#aa44ff', 24, 4, 1.0);
      } else if (roll < 0.75) {
        // Chaotic Repel: fling all foes in random directions
        G.blades.forEach(b => {
          if (b === blade || !b.alive) return;
          const ang = Math.random() * Math.PI * 2;
          b.vx += Math.cos(ang) * 17;
          b.vy += Math.sin(ang) * 17;
          b.wobble  = Math.min(1, b.wobble + 0.70);
          b.stamina = Math.max(0, b.stamina - 22);
          spawnSpecialParticles(b.x, b.y, '#ff44ff', 10, 4, 0.9);
        });
        G.shakeX = (Math.random()-0.5)*22; G.shakeY = (Math.random()-0.5)*22; G.shakeT = 0.45;
        spawnSpecialParticles(gx, gy, '#cc66ff', 30, 5, 1.3);
      } else {
        // Fate Drain: drain stamina from all foes, recover self
        G.blades.forEach(b => {
          if (b !== blade && b.alive) {
            b.stamina = Math.max(0, b.stamina - 28);
            b.wobble  = Math.min(1, b.wobble + 0.35);
            spawnSpecialParticles(b.x, b.y, '#9900cc', 10, 3, 0.8);
          }
        });
        blade.stamina = Math.min(blade.maxStamina, blade.stamina + 40);
        spawnSpecialParticles(gx, gy, '#cc66ff', 18, 4, 1.0);
      }
      break;
    }
  }
}

