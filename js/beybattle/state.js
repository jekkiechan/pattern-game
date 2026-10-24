// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
const G = {
  state:          'idle',
  blades:         [],
  parts:          [],
  popups:         [],
  arenaX:         0,
  arenaY:         0,
  arenaR:         0,
  arenaRCurrent:  0,   // shrinks during battle
  aiming:         false,
  aimX:           0,
  aimY:           0,
  shakeX:         0,
  shakeY:         0,
  shakeT:         0,
  lastTime:       0,
  clashTimer:     0,
  clashX:         0,
  clashY:         0,
  clashAlpha:     0,
  selectedChar:      0,
  selectedOpponents: [],
  selectedArena:     0,
  activeTime:     0,
  boostCooldown:  0,
  pressIsCharging: false,   // player is holding for special charge
  mode:           'single',  // 'single' | 'tournament'
  tournament:     null,      // set when running tournament flow
  finisher:       null,      // { t, max, blade } when burst-finisher cinematic is playing
};

const stars = Array.from({ length: 90 }, () => ({
  fx: Math.random(), fy: Math.random(),
  r:  Math.random() * 1.2 + 0.2,
  a:  Math.random() * 0.45 + 0.05,
}));

function resize() {
  const oldX = G.arenaX, oldY = G.arenaY, oldR = G.arenaR;
  const ratio = oldR ? G.arenaRCurrent / oldR : 1;
  G.viewW = window.innerWidth; G.viewH = window.innerHeight;
  G.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(G.viewW * G.dpr);
  canvas.height = Math.round(G.viewH * G.dpr);
  canvas.style.width = G.viewW + 'px'; canvas.style.height = G.viewH + 'px';
  ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  G.arenaX = G.viewW / 2;
  G.arenaY = G.viewH / 2 + (G.viewH < 500 ? 20 : 8);
  G.arenaR = Math.max(55, Math.min(G.viewW * .40, (G.viewH - 210) * .43));
  G.arenaRCurrent = G.arenaR * ratio;
  if (oldR) G.blades.forEach(b => {
    b.x = G.arenaX + (b.x - oldX) * G.arenaR / oldR;
    b.y = G.arenaY + (b.y - oldY) * G.arenaR / oldR;
    b.prevX = b.x; b.prevY = b.y; b.trail.length = 0;
  });
  G.sceneDirty = true;
}
