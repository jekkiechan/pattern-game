// ═══════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════
function loop(ts) {
  const dt = Math.min((ts - G.lastTime) / 1000, 0.05);
  G.lastTime = ts;
  if (G.state === 'ready' || G.state === 'active') update(dt);
  render();
  requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════
function pos(e) {
  const rc = canvas.getBoundingClientRect();
  const t  = e.touches ? e.touches[0] : e;
  return { x: t.clientX - rc.left, y: t.clientY - rc.top };
}

function doBoost(player, p) {
  const dx = p.x - player.x, dy = p.y - player.y;
  const d  = Math.hypot(dx, dy) || 1;
  player.vx += (dx / d) * BOOST_POWER;
  player.vy += (dy / d) * BOOST_POWER;
  const sp = Math.hypot(player.vx, player.vy);
  if (sp > MAX_SPEED) { player.vx *= MAX_SPEED / sp; player.vy *= MAX_SPEED / sp; }
  G.boostCooldown = BOOST_COOLDOWN;
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 70 + Math.random() * 110;
    G.parts.push(new Particle(player.x, player.y, player.color,
      Math.cos(a)*s, Math.sin(a)*s, 1.8, 0.18 + Math.random()*0.22));
  }
}

function onDown(e) {
  if (G.state === 'ready') {
    const player = G.blades[0];
    if (!player) return;
    const p = pos(e);
    if (Math.hypot(p.x - player.x, p.y - player.y) < player.radius * 4) {
      G.aiming = true;
      G.aimX   = p.x; G.aimY = p.y;
    }
  } else if (G.state === 'active') {
    const player = G.blades.find(b => b.isPlayer && b.alive);
    if (!player) return;
    // Begin tracking for charge (used in update loop)
    G.pressIsCharging = true;
    G.boostTapPos = pos(e);   // store tap position for boost on quick release
  }
}
function onMove(e) {
  if (G.state === 'active') {
    G.boostTapPos = pos(e);   // update target direction while held
  }
  if (!G.aiming) return;
  const p = pos(e);
  G.aimX = p.x; G.aimY = p.y;
}
function onUp(e) {
  if (G.state === 'active') {
    const player = G.blades.find(b => b.isPlayer && b.alive);
    G.pressIsCharging = false;
    if (player) {
      if (player.chargeProgress >= 1.0 && player.specialCooldown <= 0) {
        // Long hold — fire special
        activateSpecial(player);
      } else if (G.boostCooldown <= 0) {
        // Short tap — boost in tapped direction
        const tapPos = G.boostTapPos || pos(e);
        doBoost(player, tapPos);
      }
      player.chargeProgress = 0;
    }
    return;
  }
  if (!G.aiming) return;
  G.aiming = false;
  const player = G.blades[0];
  if (!player) return;

  const dx   = player.x - G.aimX;
  const dy   = player.y - G.aimY;
  const dist = Math.hypot(dx, dy);
  if (dist < 12) return;

  // Store aim for launchAll to use
  G.playerLaunchDx = dx; G.playerLaunchDy = dy; G.playerLaunchDist = dist;
  launchAll();
  G.state = 'active';
  document.getElementById('launch-hint').style.display = 'none';
}

canvas.addEventListener('mousedown',  onDown);
canvas.addEventListener('mousemove',  onMove);
canvas.addEventListener('mouseup',    onUp);
canvas.addEventListener('touchstart', e => { e.preventDefault(); onDown(e); }, { passive: false });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e); }, { passive: false });
canvas.addEventListener('touchend',   e => { e.preventDefault(); onUp(e);   }, { passive: false });

// ═══════════════════════════════════════════════════════════
// SCREEN BUTTONS
// ═══════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (id) document.getElementById(id).classList.add('active');
}

// ── BLADE PREVIEW RENDERER ──
function drawBladeToCanvas(cfg, previewCanvas) {
  const gameCtx = ctx;
  ctx = previewCanvas.getContext('2d');
  const W = previewCanvas.width, H = previewCanvas.height;
  const R = W * 0.30;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, W, H);

  // Subtle glow bg
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
  bg.addColorStop(0, hexAlpha(cfg.glow, 0.18));
  bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 8);

  for (let i = 0; i < cfg.blades; i++) {
    ctx.save();
    ctx.rotate((i / cfg.blades) * Math.PI * 2);
    ctx.shadowBlur  = 10;
    ctx.shadowColor = cfg.glow;
    if      (cfg.shape === 'drake')   drawDrakeBlade(R);
    else if (cfg.shape === 'dran')    drawDranBlade(R);
    else if (cfg.shape === 'dragoon') drawDragoonBlade(R);
    else if (cfg.shape === 'garuda')  drawGarudaBlade(R);
    else if (cfg.shape === 'saber')   drawSaberBlade(R);
    else if (cfg.shape === 'hells')   drawHellsBlade(R);
    else if (cfg.shape === 'knight')  drawKnightBlade(R);
    else if (cfg.shape === 'kerbecs') drawKerbecsBlade(R);
    else if (cfg.shape === 'nemesis') drawNemesisBlade(R);
    else if (cfg.shape === 'orion')   drawOrionBlade(R);
    else if (cfg.shape === 'pegasis') drawPegasisBlade(R);
    else drawBladeShape(cfg.shape, R, cfg.color);
    ctx.restore();
  }

  if      (cfg.shape === 'drake')   drawDrakeHub(R);
  else if (cfg.shape === 'dran')    drawDranHub(R);
  else if (cfg.shape === 'dragoon') drawDragoonHub(R);
  else if (cfg.shape === 'garuda')  drawGarudaHub(R);
  else if (cfg.shape === 'saber')   drawSaberHub(R);
  else if (cfg.shape === 'hells')   drawHellsHub(R);
  else if (cfg.shape === 'knight')  drawKnightHub(R);
  else if (cfg.shape === 'kerbecs') drawKerbecsHub(R);
  else if (cfg.shape === 'nemesis') drawNemesisHub(R);
  else if (cfg.shape === 'orion')   drawOrionHub(R);
  else if (cfg.shape === 'pegasis') drawPegasisHub(R);
  else {
    const hub = ctx.createRadialGradient(-R*0.18, -R*0.18, 0, 0, 0, R*0.58);
    hub.addColorStop(0,    '#ffffff');
    hub.addColorStop(0.28, cfg.color);
    hub.addColorStop(1,    '#000000');
    ctx.shadowBlur  = 8;
    ctx.shadowColor = cfg.glow;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = hub; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, R * 0.15, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
  ctx = gameCtx;
}

// ── CHARACTER SELECT SCREEN ──
const TYPE_COLORS = { ATTACK:'#ff4422', DEFENSE:'#4488ff', STAMINA:'#00ff88', BALANCE:'#ffcc00', '???':'#aa66ff' };
const TIER_COLORS = {
  NOVICE:        '#778899',
  APPRENTICE:    '#33cc66',
  ADVANCED:      '#3399ff',
  ELITE:         '#9944ff',
  CHAMPION:      '#ffbb00',
  LEGENDARY:     '#ff3311',
  MYTHICAL:      '#ff88ff',
  TRANSCENDENT:  '#ffffff',
  UNKNOWN:       '#cc44ff',
};
const STAT_KEYS   = ['atkR','defR','staR','spdR','bstR'];
const STAT_LABELS = ['ATK','DEF','STA','SPD','BST'];

function buildSelectScreen() {
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';
  const previewCanvases = [];

  CONFIGS.forEach((cfg, i) => {
    const tc   = TYPE_COLORS[cfg.type] || '#fff';
    const card = document.createElement('div');
    card.className = 'char-card' + (i === G.selectedChar ? ' selected' : '');
    card.style.setProperty('--c', cfg.color);
    if (i === G.selectedChar) {
      card.style.borderColor = cfg.color;
      card.style.boxShadow   = `0 0 14px ${cfg.color}55`;
    }

    const statBars = STAT_KEYS.map((k, si) => {
      const val = cfg[k];
      if (val === '???') {
        return `
      <div class="stat-row">
        <div class="stat-label">${STAT_LABELS[si]}</div>
        <div class="stat-track">
          <div class="stat-fill stat-fill-unknown" style="width:100%"></div>
        </div>
      </div>`;
      }
      const overMax = val > 10;
      const w = overMax ? 100 : val * 10;
      const fillClass = overMax ? ' stat-fill-overflow' : '';
      const fillStyle = overMax ? '' : `background:${cfg.color};box-shadow:0 0 4px ${cfg.color}88`;
      const valLabel  = overMax ? `<span style="font-size:9px;color:#aaddff;margin-left:2px">${val}</span>` : '';
      return `
      <div class="stat-row">
        <div class="stat-label">${STAT_LABELS[si]}${valLabel}</div>
        <div class="stat-track">
          <div class="stat-fill${fillClass}" style="width:${w}%;${fillStyle}"></div>
        </div>
      </div>`;
    }).join('');

    const tierColor = TIER_COLORS[cfg.tier] || '#aaa';
    const tierClass = cfg.tier === 'MYTHICAL' ? ' tier-mythical' : cfg.tier === 'TRANSCENDENT' ? ' tier-transcendent' : cfg.tier === 'UNKNOWN' ? ' tier-unknown' : '';
    card.innerHTML = `
      <canvas class="blade-preview" width="72" height="72" style="display:block;margin:0 auto 4px;border-radius:50%;border:1px solid ${cfg.color}33"></canvas>
      <div class="char-card-name" style="color:${cfg.color}">${cfg.name}</div>
      <div style="display:flex;gap:4px;justify-content:center;margin-bottom:7px;flex-wrap:wrap">
        <div class="char-type-badge" style="background:${tc}22;color:${tc};margin-bottom:0">${cfg.type}</div>
        <div class="char-tier-badge${tierClass}" style="background:${tierColor}22;color:${tierColor}">${cfg.tier}</div>
      </div>
      ${statBars}`;

    card.addEventListener('click', () => selectChar(i));
    grid.appendChild(card);
    previewCanvases.push({ canvas: card.querySelector('.blade-preview'), cfg });
  });

  // Render blade previews after DOM is ready
  requestAnimationFrame(() => {
    previewCanvases.forEach(({ canvas: pc, cfg }) => drawBladeToCanvas(cfg, pc));
  });

  selectChar(G.selectedChar, false);
}

function selectChar(i, rebuild = true) {
  G.selectedChar = i;
  if (rebuild) buildSelectScreen();

  const cfg = CONFIGS[i];
  const tc  = TYPE_COLORS[cfg.type] || '#fff';

  const tierColor = TIER_COLORS[cfg.tier] || '#aaa';
  document.getElementById('detail-name').textContent  = cfg.name;
  document.getElementById('detail-name').style.color  = cfg.color;
  document.getElementById('detail-type').textContent  = cfg.type;
  document.getElementById('detail-type').style.color  = tc;
  const tierEl = document.getElementById('detail-tier');
  tierEl.textContent = cfg.tier;
  tierEl.style.color = tierColor;
  tierEl.className   = cfg.tier === 'MYTHICAL' ? 'tier-mythical' : cfg.tier === 'TRANSCENDENT' ? 'tier-transcendent' : cfg.tier === 'UNKNOWN' ? 'tier-unknown' : '';
  document.getElementById('detail-desc').textContent  = cfg.desc;
  document.getElementById('detail-special').innerHTML =
    `<span class="special-name">◆ ${cfg.special.name}</span>  ${cfg.special.desc}`;

  document.getElementById('detail-stats').innerHTML = STAT_KEYS.map((k, si) => {
    const val = cfg[k];
    const valHtml = val === '???'
      ? `<span class="tier-unknown" style="font-size:inherit">???</span>`
      : val;
    const valStyle = val === '???' ? '' : `color:${cfg.color};text-shadow:0 0 12px ${cfg.color}`;
    return `
    <div class="big-stat">
      <div class="big-stat-val" style="${valStyle}">${valHtml}</div>
      <div class="big-stat-lbl">${STAT_LABELS[si]}</div>
    </div>`;
  }).join('');
}

document.getElementById('btn-start').addEventListener('click', () => {
  audio();
  buildSelectScreen();
  showScreen('screen-select');
});

// ── ARENA SELECT ──
function buildArenaScreen() {
  const grid = document.getElementById('arena-grid');
  grid.innerHTML = '';

  ARENAS.forEach((ar, i) => {
    const card = document.createElement('div');
    card.className = 'arena-card' + (i === G.selectedArena ? ' selected' : '');
    if (i === G.selectedArena) {
      card.style.borderColor = ar.rim;
      card.style.boxShadow   = `0 0 14px ${ar.glow}55`;
    }
    const pc = document.createElement('canvas');
    pc.width = 120; pc.height = 80;
    card.appendChild(pc);
    card.insertAdjacentHTML('beforeend', `
      <div class="arena-card-body">
        <div class="arena-card-name" style="color:${ar.rim}">${ar.name}</div>
        <div class="arena-card-sub">${ar.sub}</div>
      </div>`);
    card.addEventListener('click', () => selectArena(i));
    grid.appendChild(card);

    requestAnimationFrame(() => drawArenaToCanvas(ar, pc));
  });

  selectArena(G.selectedArena, false);
}

function selectArena(i, rebuild = true) {
  G.selectedArena = i;
  if (rebuild) buildArenaScreen();
  const ar = ARENAS[i];
  document.getElementById('arena-detail-name').textContent = ar.name;
  document.getElementById('arena-detail-name').style.color = ar.rim;
  document.getElementById('arena-detail-desc').textContent = ar.desc;
  const aff = document.getElementById('arena-affinity-row');
  if (aff) {
    const parts = [];
    if (ar.favors)    parts.push(`<span class="affinity-pos">▲ FAVORS ${ar.favors}</span>`);
    if (ar.penalizes) parts.push(`<span class="affinity-neg">▼ PENALIZES ${ar.penalizes}</span>`);
    aff.innerHTML = parts.join('<span style="color:#223"> · </span>');
  }
}

// ── OPPONENT SELECT ──
function buildOpponentsScreen() {
  // Remove player from opponents if they changed their own blade to one that's in opponents
  G.selectedOpponents = G.selectedOpponents.filter(i => i !== G.selectedChar);

  const grid = document.getElementById('opp-grid');
  grid.innerHTML = '';
  const previewCanvases = [];

  CONFIGS.forEach((cfg, i) => {
    if (i === G.selectedChar) return; // can't pick yourself

    const tc   = TYPE_COLORS[cfg.type] || '#fff';
    const sel  = G.selectedOpponents.includes(i);
    const card = document.createElement('div');
    card.className = 'char-card opp-card' + (sel ? ' selected-opp' : '');
    card.style.setProperty('--c', sel ? cfg.color : '#333');
    if (sel) {
      card.style.borderColor = cfg.color;
      card.style.boxShadow   = `0 0 14px ${cfg.color}55`;
    } else {
      card.style.borderColor = '#1a1f2e';
    }

    const statBars = STAT_KEYS.map((k, si) => {
      const val = cfg[k];
      if (val === '???') {
        return `
      <div class="stat-row">
        <div class="stat-label">${STAT_LABELS[si]}</div>
        <div class="stat-track">
          <div class="stat-fill stat-fill-unknown" style="width:100%"></div>
        </div>
      </div>`;
      }
      const overMax = val > 10;
      const w = overMax ? 100 : val * 10;
      const fillClass = overMax ? ' stat-fill-overflow' : '';
      const fillStyle = overMax ? '' : `background:${cfg.color};box-shadow:0 0 4px ${cfg.color}88`;
      const valLabel  = overMax ? `<span style="font-size:9px;color:#aaddff;margin-left:2px">${val}</span>` : '';
      return `
      <div class="stat-row">
        <div class="stat-label">${STAT_LABELS[si]}${valLabel}</div>
        <div class="stat-track">
          <div class="stat-fill${fillClass}" style="width:${w}%;${fillStyle}"></div>
        </div>
      </div>`;
    }).join('');

    const tierColor = TIER_COLORS[cfg.tier] || '#aaa';
    const tierClass = cfg.tier === 'MYTHICAL' ? ' tier-mythical' : cfg.tier === 'TRANSCENDENT' ? ' tier-transcendent' : cfg.tier === 'UNKNOWN' ? ' tier-unknown' : '';
    card.innerHTML = `
      <canvas class="blade-preview" width="72" height="72" style="display:block;margin:0 auto 4px;border-radius:50%;border:1px solid ${cfg.color}33"></canvas>
      <div class="char-card-name" style="color:${sel ? cfg.color : '#445'}">${cfg.name}</div>
      <div style="display:flex;gap:4px;justify-content:center;margin-bottom:7px;flex-wrap:wrap">
        <div class="char-type-badge" style="background:${tc}22;color:${tc};margin-bottom:0">${cfg.type}</div>
        <div class="char-tier-badge${tierClass}" style="background:${tierColor}22;color:${tierColor}">${cfg.tier}</div>
      </div>
      ${statBars}`;

    // Arena affinity indicator dot
    const arMods = ARENAS[G.selectedArena].typeModifiers;
    const mod = arMods && arMods[cfg.type];
    if (mod && Object.keys(mod).length > 0) {
      let score = 0;
      if (mod.attackMult)  score += mod.attackMult  > 1 ? 1 : -1;
      if (mod.maxStamina)  score += mod.maxStamina  > 1 ? 1 : -1;
      if (mod.defense)     score += mod.defense     < 1 ? 1 : -1; // lower defense = better
      if (mod.burstResist) score += mod.burstResist > 1 ? 1 : -1;
      if (score !== 0) {
        const dot = document.createElement('div');
        dot.className = 'card-affinity';
        dot.title = score > 0 ? 'BUFFED in this arena' : 'PENALIZED in this arena';
        const c = score > 0 ? '#00ff88' : '#ff4422';
        dot.style.background = c;
        dot.style.boxShadow  = `0 0 6px ${c}`;
        card.appendChild(dot);
      }
    }

    card.addEventListener('click', () => {
      if (G.selectedOpponents.includes(i)) {
        G.selectedOpponents = G.selectedOpponents.filter(x => x !== i);
      } else if (G.selectedOpponents.length < 3) {
        G.selectedOpponents.push(i);
      }
      buildOpponentsScreen();
    });

    grid.appendChild(card);
    previewCanvases.push({ canvas: card.querySelector('.blade-preview'), cfg });
  });

  requestAnimationFrame(() => {
    previewCanvases.forEach(({ canvas: pc, cfg }) => drawBladeToCanvas(cfg, pc));
  });

  const count = G.selectedOpponents.length;
  const label = document.getElementById('opp-count-label');
  label.textContent = count === 3 ? '3 / 3 SELECTED — READY!' : `${count} / 3 SELECTED`;
  label.style.color = count === 3 ? '#00ff88' : '#445';

  const btn = document.getElementById('btn-opponents');
  btn.disabled = count !== 3;
  btn.style.opacity = count === 3 ? '1' : '0.35';
  btn.style.pointerEvents = count === 3 ? '' : 'none';
}

// ── randomize opponents ──
function randomizeOpponents() {
  const pool = CONFIGS.map((_, i) => i).filter(i => i !== G.selectedChar);
  G.selectedOpponents = [];
  while (G.selectedOpponents.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    G.selectedOpponents.push(pool.splice(idx, 1)[0]);
  }
  buildOpponentsScreen();
}

document.getElementById('btn-select-back').addEventListener('click', () => {
  showScreen('screen-start');
});

document.getElementById('btn-fight').addEventListener('click', () => {
  buildArenaScreen();
  showScreen('screen-arena');
});

document.getElementById('btn-arena-back').addEventListener('click', () => {
  buildSelectScreen();
  showScreen('screen-select');
});

document.getElementById('btn-arena-next').addEventListener('click', () => {
  buildOpponentsScreen();
  showScreen('screen-opponents');
});

document.getElementById('btn-opp-back').addEventListener('click', () => {
  buildArenaScreen();
  showScreen('screen-arena');
});

document.getElementById('btn-randomize').addEventListener('click', randomizeOpponents);

document.getElementById('btn-opponents').addEventListener('click', () => {
  if (G.selectedOpponents.length !== 3) return;
  showScreen(null);
  startRound();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  buildSelectScreen();
  showScreen('screen-select');
});

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('resize', resize);
resize();
G.lastTime = performance.now();
requestAnimationFrame(loop);
