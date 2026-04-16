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

function endSpecial(b) {
  // Restore any mutated base stats
  if (b.specialData.savedAtkMult !== undefined) b.attackMult = b.specialData.savedAtkMult;
  if (b.specialData.savedDef     !== undefined) b.defense    = b.specialData.savedDef;
  b.specialActive  = false;
  b.specialTimer   = 0;
  b.specialData    = {};
}

function activateSpecial(blade) {
  if (!blade.alive || blade.specialCooldown > 0) return;
  blade.specialActive   = true;
  blade.specialCooldown = SPECIAL_COOLDOWN;
  blade.specialTimer    = 0;
  blade.specialData     = {};

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

