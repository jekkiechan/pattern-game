// ═══════════════════════════════════════════════════════════
// SPAWN
// ═══════════════════════════════════════════════════════════
function startRound() {
  const r = G.arenaR;
  const ax = G.arenaX, ay = G.arenaY;

  G.parts         = [];
  G.blades        = [];
  G.popups        = [];
  G.clashTimer    = 0;
  G.activeTime    = 0;
  G.arenaRCurrent = r;
  G.aiming        = false;
  G.aimX = G.aimY = 0;
  G.shakeX = G.shakeY = G.shakeT = 0;

  // Place all 4 blades evenly around rim (launch positions)
  const startR  = r * 0.74;
  const rimAngles = [
    Math.PI * 0.5,             // bottom  → player
    Math.PI * 1.5,             // top
    Math.PI * (1.5 + 2/3),    // bottom-left
    Math.PI * (1.5 - 2/3),    // bottom-right
  ];

  const playerCfg = { ...CONFIGS[G.selectedChar], isPlayer: true };
  const player    = new Beyblade(playerCfg,
    ax + Math.cos(rimAngles[0]) * startR,
    ay + Math.sin(rimAngles[0]) * startR);
  player.launched = false;
  G.blades.push(player);

  G.selectedOpponents.forEach((cfgIdx, i) => {
    const cfg = { ...CONFIGS[cfgIdx], isPlayer: false };
    const b   = new Beyblade(cfg,
      ax + Math.cos(rimAngles[i + 1]) * startR,
      ay + Math.sin(rimAngles[i + 1]) * startR);
    b.launched = false;   // held until GO
    G.blades.push(b);
  });

  // Apply arena type modifiers to blade stats
  const arenaMods = ARENAS[G.selectedArena].typeModifiers;
  if (arenaMods) {
    G.blades.forEach(b => {
      const mod = arenaMods[b.type];
      if (!mod) return;
      if (mod.attackMult)  b.attackMult  *= mod.attackMult;
      if (mod.maxStamina)  { b.maxStamina *= mod.maxStamina; b.stamina = b.maxStamina; }
      if (mod.defense)     b.defense     *= mod.defense;
      if (mod.burstResist) b.burstResist  = Math.min(0.99, b.burstResist * mod.burstResist);
    });
  }

  // Tournament stamina carryover for the player blade
  if (G.mode === 'tournament' && G.tournament && G.tournament.round > 1) {
    const pct = Math.max(0.3, Math.min(1, G.tournament.carryPct));
    player.stamina = player.maxStamina * pct;
  }

  G.boostCooldown = 0;
  G.finisher      = null;

  buildHUD();
  document.getElementById('hud').style.display = 'flex';

  const hint = document.getElementById('launch-hint');
  hint.textContent = 'DRAG YOUR BLADE BACK · RELEASE TO LAUNCH ALL';
  hint.style.display = 'block';
  G.state = 'ready';
}

function launchAll() {
  const ax = G.arenaX, ay = G.arenaY;
  G.blades.forEach(b => {
    if (b.isPlayer) {
      const dx = G.playerLaunchDx, dy = G.playerLaunchDy, d = G.playerLaunchDist;
      const pw = Math.min(d / 10, MAX_POWER);
      b.vx = (dx / d) * pw;
      b.vy = (dy / d) * pw;
      b.spinRate = 18 + pw * 0.8;
    } else {
      const tx  = ax + (Math.random() - 0.5) * 70;
      const ty  = ay + (Math.random() - 0.5) * 70;
      const dx  = tx - b.x, dy = ty - b.y;
      const d   = Math.hypot(dx, dy) || 1;
      const spd = 8 + Math.random() * 4;
      b.vx = (dx / d) * spd;
      b.vy = (dy / d) * spd;
      b.spinRate = 16 + Math.random() * 8;
    }
    b.launched = true;
  });
  // Launch particles for player blade
  const p = G.blades[0];
  if (p) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 180;
      G.parts.push(new Particle(p.x, p.y, p.color,
        Math.cos(a)*s, Math.sin(a)*s, 2.5, 0.28 + Math.random()*0.32));
    }
  }
  playLaunch(); playWhoosh();
}

// ═══════════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════════
function buildHUD() {
  const hud = document.getElementById('hud');
  hud.innerHTML = '';
  G.blades.forEach(b => {
    const id = b.name.replace(/\s/g, '-');
    hud.insertAdjacentHTML('beforeend', `
      <div class="stamina-bar">
        <div class="stamina-label" style="color:${b.color}">${b.name}</div>
        <div class="stamina-track">
          <div class="stamina-fill" id="sf-${id}"
               style="width:100%;background:${b.color};box-shadow:0 0 6px ${b.color}88"></div>
        </div>
      </div>`);
  });
}

function refreshHUD() {
  G.blades.forEach(b => {
    const fill = document.getElementById(`sf-${b.name.replace(/\s/g,'-')}`);
    if (!fill) return;
    const pct = Math.max(0, (b.stamina / b.maxStamina) * 100);
    fill.style.width   = `${pct}%`;
    fill.style.opacity = b.alive ? '1' : '0.2';
    if (pct < 30) fill.style.background = '#ff3333';
  });
}

// ═══════════════════════════════════════════════════════════
// PARTICLES HELPERS
// ═══════════════════════════════════════════════════════════
function spawnHitParticles(x, y, cA, cB, intensity) {
  const n = Math.floor(8 + intensity * 14);
  for (let i = 0; i < n; i++) {
    const a   = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 220 * intensity;
    G.parts.push(new Particle(x, y, Math.random() < .5 ? cA : cB,
      Math.cos(a) * spd, Math.sin(a) * spd, 2 + Math.random() * 2.5, 0.28 + Math.random() * 0.38));
  }
  // white sparks
  for (let i = 0; i < 7; i++) {
    const a   = Math.random() * Math.PI * 2;
    const spd = 160 + Math.random() * 220;
    G.parts.push(new Particle(x, y, '#ffffff',
      Math.cos(a) * spd, Math.sin(a) * spd, 1, 0.1 + Math.random() * 0.18));
  }
}

