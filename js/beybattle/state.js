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
  selectedOpponents: [1, 2, 3],
  selectedArena:     0,
  activeTime:     0,
  boostCooldown:  0,
  pressIsCharging: false,   // player is holding for special charge
};

const stars = Array.from({ length: 90 }, () => ({
  fx: Math.random(), fy: Math.random(),
  r:  Math.random() * 1.2 + 0.2,
  a:  Math.random() * 0.45 + 0.05,
}));

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  G.arenaX = canvas.width  / 2;
  G.arenaY = canvas.height / 2;
  G.arenaR = Math.min(canvas.width, canvas.height) * 0.38;
  if (!G.arenaRCurrent) G.arenaRCurrent = G.arenaR;
}

