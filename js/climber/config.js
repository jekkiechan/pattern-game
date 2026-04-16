const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = 400, H = 600;
let scale = 1;
function resize() {
  scale = Math.min(window.innerWidth / W, window.innerHeight / H, 2);
  canvas.width = Math.floor(W * scale);
  canvas.height = Math.floor(H * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// ══════════ PIXEL TEXT ══════════
const GL = {
  '0':[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],'1':[[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  '2':[[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],'3':[[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4':[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],'5':[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6':[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],'7':[[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
  '8':[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],'9':[[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  'A':[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],'B':[[1,1,0],[1,0,1],[1,1,1],[1,0,1],[1,1,0]],
  'C':[[1,1,1],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],'D':[[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
  'E':[[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],'F':[[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
  'G':[[1,1,1],[1,0,0],[1,0,1],[1,0,1],[1,1,1]],'H':[[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'I':[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],'J':[[0,0,1],[0,0,1],[0,0,1],[1,0,1],[1,1,1]],
  'K':[[1,0,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],'L':[[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
  'M':[[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],'N':[[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
  'O':[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],'P':[[1,1,1],[1,0,1],[1,1,1],[1,0,0],[1,0,0]],
  'R':[[1,1,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],'S':[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  'T':[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],'U':[[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  'V':[[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],'W':[[1,0,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1]],
  'X':[[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],'Y':[[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
  'Z':[[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],' ':[[0,0],[0,0],[0,0],[0,0],[0,0]],
  ':':[[0],[0,1],[0],[0,1],[0]],'!':[[0,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
  '/':[[0,0,1],[0,0,1],[0,1,0],[1,0,0],[1,0,0]],'-':[[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
  '>':[[1,0,0],[0,1,0],[0,0,1],[0,1,0],[1,0,0]],'<':[[0,0,1],[0,1,0],[1,0,0],[0,1,0],[0,0,1]],
};
function pixText(text, x, y, ps, color, shadow) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = GL[ch] || GL[' '];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < (g[r]?g[r].length:0); c++)
        if (g[r][c]) {
          if (shadow) { ctx.fillStyle = shadow; ctx.fillRect(cx+c*ps+1,y+r*ps+1,ps,ps); }
          ctx.fillStyle = color; ctx.fillRect(cx+c*ps,y+r*ps,ps,ps);
        }
    cx += ((g[0]?g[0].length:1)+1)*ps;
  }
}
function textW(t,ps) { let w=0; for(const ch of t.toUpperCase()){const g=GL[ch]||GL[' '];w+=((g[0]?g[0].length:1)+1)*ps;} return w; }

// ══════════ STAGE CONFIG ══════════
// Each stage: { stars, platCount, fragileChance, movingChance, boostChance, movingSpeed, spacing }
const STAGES = [
  { stars: 3,  platCount: 7,  fragile: 0,    moving: 0,    boost: 0.1,  moveSpd: 1.5, spacing: 80,  name: 'LAUNCH' },
  { stars: 4,  platCount: 8,  fragile: 0,    moving: 0.1,  boost: 0.1,  moveSpd: 1.5, spacing: 82,  name: 'DRIFT' },
  { stars: 5,  platCount: 9,  fragile: 0.05, moving: 0.1,  boost: 0.1,  moveSpd: 1.8, spacing: 84,  name: 'STORM' },
  { stars: 5,  platCount: 9,  fragile: 0.1,  moving: 0.15, boost: 0.1,  moveSpd: 2.0, spacing: 86,  name: 'RUSH' },
  { stars: 6,  platCount: 10, fragile: 0.1,  moving: 0.15, boost: 0.12, moveSpd: 2.0, spacing: 86,  name: 'QUAKE' },
  { stars: 6,  platCount: 10, fragile: 0.15, moving: 0.2,  boost: 0.1,  moveSpd: 2.2, spacing: 88,  name: 'BLAZE' },
  { stars: 7,  platCount: 11, fragile: 0.15, moving: 0.2,  boost: 0.12, moveSpd: 2.3, spacing: 88,  name: 'VORTEX' },
  { stars: 7,  platCount: 11, fragile: 0.2,  moving: 0.25, boost: 0.1,  moveSpd: 2.5, spacing: 90,  name: 'THUNDER' },
  { stars: 8,  platCount: 12, fragile: 0.2,  moving: 0.25, boost: 0.12, moveSpd: 2.8, spacing: 90,  name: 'INFERNO' },
  { stars: 10, platCount: 13, fragile: 0.25, moving: 0.3,  boost: 0.15, moveSpd: 3.0, spacing: 92,  name: 'DRAGOON' },
];
const PLAT_W = 70, PLAT_H = 12;

