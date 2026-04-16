// ══════════ GAME STATE ══════════
let state = 'title'; // title | playing | dead | victory
let currentStage = 0;
let player, platforms, collectStars, particles, trailParticles;
let camera = 0, frameCount = 0;
let starsCollected = 0, starsTotal = 0;
let clearFlash = 0;  // counts down while showing "STAGE CLEAR" overlay mid-game
let bestStage = 0; // furthest stage reached

// background stars
const bgStars = Array.from({length:80}, () => ({
  x: Math.random()*W, y: Math.random()*2000, r: Math.random()*1.5+0.5, b: Math.random()
}));

// ══════════ INPUT ══════════
const keys = {};
let touchX = null;
let touchStartY = null;
let dropping = false; // hold down to fall through platforms
let actionPress = false;

document.addEventListener('keydown', e => {
  if (e.repeat) return;
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); actionPress = true; }
});
document.addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  actionPress = true;
  touchX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  dropping = false;
}, {passive:false});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  touchX = e.touches[0].clientX;
  const dy = e.touches[0].clientY - (touchStartY || e.touches[0].clientY);
  dropping = dy > 25; // swipe down 25px = drop
}, {passive:false});
canvas.addEventListener('touchend', () => { touchX = null; dropping = false; touchStartY = null; }, {passive:false});
canvas.addEventListener('click', () => { actionPress = true; });

