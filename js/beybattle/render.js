// ═══════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════
function drawBackground() {
  ctx.fillStyle = '#00020a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.fx * canvas.width, s.fy * canvas.height, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${s.a})`;
    ctx.fill();
  });
}

function drawArena() {
  const ax = G.arenaX, ay = G.arenaY, ar = G.arenaRCurrent || G.arenaR;
  const a  = ARENAS[G.selectedArena] || ARENAS[0];

  // Outer atmosphere
  const atm = ctx.createRadialGradient(ax, ay, ar * 0.7, ax, ay, ar * 1.3);
  atm.addColorStop(0, a.atm); atm.addColorStop(1, 'transparent');
  ctx.fillStyle = atm;
  ctx.beginPath(); ctx.arc(ax, ay, ar * 1.3, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.clip();

  // Dish gradient
  const dish = ctx.createRadialGradient(ax - ar * 0.18, ay - ar * 0.22, 0, ax, ay, ar);
  dish.addColorStop(0,    a.bg[0]);
  dish.addColorStop(0.45, a.bg[1]);
  dish.addColorStop(0.78, a.bg[2]);
  dish.addColorStop(1,    '#010203');
  ctx.fillStyle = dish;
  ctx.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);

  // Grid rings
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath(); ctx.arc(ax, ay, ar * i / 5, 0, Math.PI * 2);
    ctx.strokeStyle = i === 5 ? a.grid.replace('0.04', '0.08').replace('0.03','0.07') : a.grid;
    ctx.lineWidth   = i === 5 ? 1.2 : 0.5;
    ctx.stroke();
  }
  // Spokes
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.cos(ang) * ar, ay + Math.sin(ang) * ar);
    ctx.strokeStyle = a.grid; ctx.lineWidth = 0.5; ctx.stroke();
  }
  // Floor highlight
  const chl = ctx.createRadialGradient(ax - ar*0.1, ay - ar*0.18, 0, ax, ay, ar*0.55);
  chl.addColorStop(0, 'rgba(255,255,255,0.032)'); chl.addColorStop(1, 'transparent');
  ctx.fillStyle = chl; ctx.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
  ctx.restore();

  // Rim
  ctx.save();
  ctx.shadowBlur  = 22; ctx.shadowColor = a.glow;
  ctx.strokeStyle = a.rim + 'aa';
  ctx.lineWidth   = 2.5;
  ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(ax, ay, ar, -Math.PI * 0.85, -Math.PI * 0.08); ctx.stroke();
  ctx.restore();
}

function drawArenaToCanvas(arena, pc) {
  const gameCtx = ctx; ctx = pc.getContext('2d');
  const W = pc.width, H = pc.height, ax = W/2, ay = H/2, ar = W * 0.44;
  ctx.fillStyle = '#04060c'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.beginPath(); ctx.arc(ax,ay,ar,0,Math.PI*2); ctx.clip();
  const dish = ctx.createRadialGradient(ax-ar*0.15,ay-ar*0.2,0,ax,ay,ar);
  dish.addColorStop(0,arena.bg[0]); dish.addColorStop(0.5,arena.bg[1]); dish.addColorStop(1,arena.bg[2]);
  ctx.fillStyle=dish; ctx.fillRect(0,0,W,H);
  for (let i=1;i<=4;i++){ctx.beginPath();ctx.arc(ax,ay,ar*i/4,0,Math.PI*2);ctx.strokeStyle=arena.grid;ctx.lineWidth=0.5;ctx.stroke();}
  ctx.restore();
  ctx.save(); ctx.shadowBlur=14; ctx.shadowColor=arena.glow;
  ctx.strokeStyle=arena.rim+'bb'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(ax,ay,ar,0,Math.PI*2); ctx.stroke(); ctx.restore();
  ctx = gameCtx;
}

function drawBlade(b) {
  if (!b.alive) return;

  const wobX = b.wobble > 0 ? Math.sin(b.wobbleP) * b.wobble * b.radius * 0.32 : 0;
  const wobY = b.wobble > 0 ? Math.cos(b.wobbleP * 0.65) * b.wobble * b.radius * 0.22 : 0;
  const dx   = b.x + wobX, dy = b.y + wobY;
  const R    = b.radius;

  ctx.save();
  ctx.translate(dx, dy);

  // Outer aura
  const flashExtra = b.flash > 0 ? 0.55 : 0;
  const auraR  = R * (2.8 + flashExtra * 1.2);
  const aura   = ctx.createRadialGradient(0, 0, 0, 0, 0, auraR);
  const alphaN = (0.28 + flashExtra).toFixed(2);
  aura.addColorStop(0,   hexAlpha(b.glow, 0.28 + flashExtra));
  aura.addColorStop(0.5, hexAlpha(b.glow, 0.10 + flashExtra * 0.3));
  aura.addColorStop(1,   'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(0, 0, auraR, 0, Math.PI * 2); ctx.fill();

  // ── Motion trail ──
  ctx.save();
  b.trail.forEach(t => {
    const a = 1 - t.age / 0.22;
    ctx.globalAlpha    = a * 0.35;
    ctx.fillStyle      = b.color;
    ctx.shadowBlur     = 6;
    ctx.shadowColor    = b.glow;
    ctx.beginPath();
    ctx.arc(t.x - dx + 0, t.y - dy + 0, R * 0.55 * a, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Spinning blades
  ctx.rotate(b.angle);
  ctx.shadowBlur  = 12;
  ctx.shadowColor = b.glow;

  for (let i = 0; i < b.blades; i++) {
    ctx.save();
    ctx.rotate((i / b.blades) * Math.PI * 2);
    if      (b.shape === 'drake')   drawDrakeBlade(R);
    else if (b.shape === 'dran')    drawDranBlade(R);
    else if (b.shape === 'dragoon') drawDragoonBlade(R);
    else if (b.shape === 'garuda')  drawGarudaBlade(R);
    else if (b.shape === 'saber')   drawSaberBlade(R);
    else if (b.shape === 'hells')   drawHellsBlade(R);
    else if (b.shape === 'knight')  drawKnightBlade(R);
    else if (b.shape === 'kerbecs') drawKerbecsBlade(R);
    else if (b.shape === 'nemesis') drawNemesisBlade(R);
    else if (b.shape === 'orion')   drawOrionBlade(R);
    else if (b.shape === 'pegasis') drawPegasisBlade(R);
    else if (b.shape === 'unknown') drawUnknownBlade(R);
    else if (b.shape === 'titan')   drawTitanBlade(R);
    else if (b.shape === 'abyss')   drawAbyssBlade(R);
    else drawBladeShape(b.shape, R, b.color);
    ctx.restore();
  }

  // Hub
  if      (b.shape === 'drake')   { drawDrakeHub(R); }
  else if (b.shape === 'dran')    { drawDranHub(R); }
  else if (b.shape === 'dragoon') { drawDragoonHub(R); }
  else if (b.shape === 'garuda')  { drawGarudaHub(R); }
  else if (b.shape === 'saber')   { drawSaberHub(R); }
  else if (b.shape === 'hells')   { drawHellsHub(R); }
  else if (b.shape === 'knight')  { drawKnightHub(R); }
  else if (b.shape === 'kerbecs') { drawKerbecsHub(R); }
  else if (b.shape === 'nemesis') { drawNemesisHub(R); }
  else if (b.shape === 'orion')   { drawOrionHub(R); }
  else if (b.shape === 'pegasis') { drawPegasisHub(R); }
  else if (b.shape === 'unknown') { drawUnknownHub(R); }
  else if (b.shape === 'titan')   { drawTitanHub(R); }
  else if (b.shape === 'abyss')   { drawAbyssHub(R); }
  else {
    const hub = ctx.createRadialGradient(-R * 0.18, -R * 0.18, 0, 0, 0, R * 0.58);
    hub.addColorStop(0,    '#ffffff');
    hub.addColorStop(0.28, b.color);
    hub.addColorStop(1,    '#000000');
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = hub; ctx.fill();

    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();

  // Player indicator triangle
  if (b.isPlayer && b.stamina > 0) {
    ctx.save();
    ctx.font        = `bold 10px 'Orbitron', monospace`;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = b.color;
    ctx.globalAlpha = 0.7;
    ctx.shadowBlur  = 5;
    ctx.shadowColor = b.glow;
    ctx.fillText('YOU', dx, dy + R + 16);
    ctx.restore();
  }

  // ── Charge ring (fills clockwise as player holds) ──
  if (b.chargeProgress > 0) {
    ctx.save();
    // Dim track ring
    ctx.beginPath();
    ctx.arc(dx, dy, R + 11, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Glowing charge arc
    ctx.beginPath();
    ctx.arc(dx, dy, R + 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * b.chargeProgress);
    ctx.strokeStyle = b.glow;
    ctx.lineWidth   = 4;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = b.glow;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    // Flash when fully charged
    if (b.chargeProgress >= 1.0) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.015);
      ctx.globalAlpha = 0.5 + 0.4 * pulse;
      ctx.beginPath();
      ctx.arc(dx, dy, R + 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Active special pulse ring ──
  if (b.specialActive) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.012);
    ctx.save();
    ctx.beginPath();
    ctx.arc(dx, dy, R + 15, 0, Math.PI * 2);
    ctx.strokeStyle = b.glow;
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = 22;
    ctx.shadowColor = b.glow;
    ctx.globalAlpha = 0.35 + 0.45 * pulse;
    ctx.stroke();
    ctx.restore();
  }
}

function drawDrakeBlade(R) {
  // ── Silver chrome claw body ──
  ctx.beginPath();
  ctx.moveTo(R * 0.12, -R * 0.20);
  ctx.bezierCurveTo(R * 0.30, -R * 0.66, R * 0.82, -R * 0.90, R * 1.22, -R * 0.62);
  ctx.bezierCurveTo(R * 1.50, -R * 0.38, R * 1.54, R * 0.04,  R * 1.34, R * 0.22);
  ctx.bezierCurveTo(R * 1.10, R * 0.40,  R * 0.68, R * 0.40,  R * 0.36, R * 0.26);
  ctx.bezierCurveTo(R * 0.18, R * 0.16,  R * 0.06, R * 0.06,  R * 0.12, -R * 0.20);

  const sg = ctx.createLinearGradient(-R * 0.1, -R * 0.4, R * 1.4, R * 0.25);
  sg.addColorStop(0,    '#70708a');
  sg.addColorStop(0.25, '#b8b8cc');
  sg.addColorStop(0.5,  '#e2e2ee');
  sg.addColorStop(0.75, '#c8c8da');
  sg.addColorStop(1,    '#707082');
  ctx.fillStyle   = sg;
  ctx.shadowBlur  = 6;
  ctx.shadowColor = '#9090b0';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  // ── Inner cutout shadow (skeletal look) ──
  ctx.beginPath();
  ctx.moveTo(R * 0.40, -R * 0.30);
  ctx.bezierCurveTo(R * 0.52, -R * 0.58, R * 0.86, -R * 0.64, R * 1.05, -R * 0.45);
  ctx.bezierCurveTo(R * 1.18, -R * 0.30, R * 1.12, -R * 0.10, R * 0.92, R * 0.00);
  ctx.bezierCurveTo(R * 0.72, R * 0.10,  R * 0.44, R * 0.08,  R * 0.32, -R * 0.05);
  ctx.bezierCurveTo(R * 0.22, -R * 0.15, R * 0.30, -R * 0.20, R * 0.40, -R * 0.30);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 0;
  ctx.fill();

  // ── Red rubber bumper (leading contact edge) ──
  ctx.beginPath();
  ctx.moveTo(R * 0.60, -R * 0.80);
  ctx.bezierCurveTo(R * 0.82, -R * 0.98, R * 1.14, -R * 0.84, R * 1.26, -R * 0.58);
  ctx.bezierCurveTo(R * 1.18, -R * 0.38, R * 0.90, -R * 0.40, R * 0.72, -R * 0.56);
  ctx.closePath();
  const rg = ctx.createLinearGradient(R * 0.65, -R * 0.85, R * 1.2, -R * 0.45);
  rg.addColorStop(0,   '#ff4433');
  rg.addColorStop(0.5, '#cc1a08');
  rg.addColorStop(1,   '#991100');
  ctx.fillStyle   = rg;
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#ff3322';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,120,90,0.45)';
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  // ── Blue accent chip at outer tip ──
  ctx.beginPath();
  ctx.ellipse(R * 1.40, R * 0.10, R * 0.11, R * 0.07, -0.4, 0, Math.PI * 2);
  ctx.fillStyle   = '#3355cc';
  ctx.shadowBlur  = 8;
  ctx.shadowColor = '#5577ff';
  ctx.fill();
}

function drawDrakeHub(R) {
  // Dark navy disc
  const hg = ctx.createRadialGradient(-R * 0.14, -R * 0.14, 0, 0, 0, R * 0.60);
  hg.addColorStop(0,   '#28366a');
  hg.addColorStop(0.5, '#111828');
  hg.addColorStop(1,   '#050a18');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2);
  ctx.fillStyle   = hg;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#0a1840';
  ctx.fill();

  // Teal dragon head (simplified serpent profile)
  ctx.save();
  ctx.shadowBlur  = 5;
  ctx.shadowColor = '#00ccee';
  ctx.fillStyle   = '#00aabb';
  ctx.beginPath();
  ctx.moveTo(-R * 0.32, -R * 0.06);
  ctx.bezierCurveTo(-R * 0.22, -R * 0.32, R * 0.20, -R * 0.36, R * 0.38, -R * 0.14);
  ctx.bezierCurveTo(R * 0.50,  R * 0.02,  R * 0.44,  R * 0.22,  R * 0.26,  R * 0.28);
  ctx.bezierCurveTo(R * 0.06,  R * 0.32, -R * 0.22,  R * 0.18, -R * 0.30,  R * 0.06);
  ctx.closePath();
  ctx.fill();

  // Dragon jaw lower snout
  ctx.fillStyle = '#008899';
  ctx.beginPath();
  ctx.moveTo(R * 0.26, R * 0.08);
  ctx.bezierCurveTo(R * 0.40, R * 0.14, R * 0.48, R * 0.26, R * 0.36, R * 0.32);
  ctx.bezierCurveTo(R * 0.22, R * 0.36, R * 0.08, R * 0.28, R * 0.10, R * 0.18);
  ctx.closePath();
  ctx.fill();

  // Red eye
  ctx.fillStyle   = '#ff3322';
  ctx.shadowBlur  = 4;
  ctx.shadowColor = '#ff5544';
  ctx.beginPath();
  ctx.arc(R * 0.14, -R * 0.14, R * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // White teeth fleck
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(R * 0.30, R * 0.14);
  ctx.lineTo(R * 0.38, R * 0.22);
  ctx.lineTo(R * 0.44, R * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Center pin
  ctx.fillStyle   = '#ffffff';
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#aaccff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.10, 0, Math.PI * 2); ctx.fill();
}

// ── DRAN SWORD: long sword blades, red-orange, glass cannon ──
function drawDranBlade(R) {
  // Orange body blade — tapered long sword shape
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.14);
  ctx.bezierCurveTo(R * 0.18, -R * 0.52, R * 0.65, -R * 0.62, R * 1.52, -R * 0.06);
  ctx.bezierCurveTo(R * 0.65,  R * 0.62, R * 0.18,  R * 0.52, 0,  R * 0.14);
  ctx.closePath();
  const og = ctx.createLinearGradient(0, -R * 0.4, R * 1.4, 0);
  og.addColorStop(0,   '#cc3300');
  og.addColorStop(0.3, '#ff6600');
  og.addColorStop(0.7, '#ff9933');
  og.addColorStop(1,   '#cc4400');
  ctx.fillStyle   = og;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#ff4400';
  ctx.fill();

  // Silver sword blade inset
  ctx.beginPath();
  ctx.moveTo(R * 0.22, -R * 0.08);
  ctx.bezierCurveTo(R * 0.35, -R * 0.32, R * 0.75, -R * 0.34, R * 1.50, -R * 0.03);
  ctx.bezierCurveTo(R * 0.75,  R * 0.34, R * 0.35,  R * 0.32, R * 0.22,  R * 0.08);
  ctx.closePath();
  const sg = ctx.createLinearGradient(R * 0.2, -R * 0.2, R * 1.4, 0);
  sg.addColorStop(0,   '#aaaaaa');
  sg.addColorStop(0.4, '#eeeeee');
  sg.addColorStop(1,   '#888888');
  ctx.fillStyle   = sg;
  ctx.shadowBlur  = 4;
  ctx.shadowColor = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth   = 0.6;
  ctx.stroke();
}

function drawDranHub(R) {
  // Red body
  const hg = ctx.createRadialGradient(-R*0.12, -R*0.12, 0, 0, 0, R * 0.58);
  hg.addColorStop(0,   '#ff6633');
  hg.addColorStop(0.5, '#cc2200');
  hg.addColorStop(1,   '#550000');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.shadowBlur = 8; ctx.shadowColor = '#ff4400'; ctx.fill();

  // Flame streak
  ctx.save();
  ctx.fillStyle = '#ffaa00'; ctx.shadowBlur = 6; ctx.shadowColor = '#ffcc00';
  ctx.beginPath();
  ctx.moveTo(-R*0.28, R*0.08);
  ctx.bezierCurveTo(-R*0.1, -R*0.28, R*0.18, -R*0.32, R*0.30, -R*0.12);
  ctx.bezierCurveTo(R*0.18, R*0.02, -R*0.05, R*0.10, -R*0.28, R*0.08);
  ctx.fill(); ctx.restore();

  ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffcc88';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.10, 0, Math.PI * 2); ctx.fill();
}

// ── COBALT DRAGOON: cobalt blue attack blade, left-spin ──
function drawDragoonBlade(R) {
  ctx.beginPath();
  ctx.moveTo(R * 0.12, -R * 0.20);
  ctx.bezierCurveTo(R * 0.30, -R * 0.66, R * 0.82, -R * 0.90, R * 1.22, -R * 0.62);
  ctx.bezierCurveTo(R * 1.50, -R * 0.38, R * 1.54, R * 0.04,  R * 1.34, R * 0.22);
  ctx.bezierCurveTo(R * 1.10, R * 0.40,  R * 0.68, R * 0.40,  R * 0.36, R * 0.26);
  ctx.bezierCurveTo(R * 0.18, R * 0.16,  R * 0.06, R * 0.06,  R * 0.12, -R * 0.20);
  const sg = ctx.createLinearGradient(-R * 0.1, -R * 0.4, R * 1.4, R * 0.25);
  sg.addColorStop(0,    '#0d2a6e'); sg.addColorStop(0.25, '#1a4daa');
  sg.addColorStop(0.5,  '#2266cc'); sg.addColorStop(0.75, '#153d99'); sg.addColorStop(1, '#071840');
  ctx.fillStyle = sg; ctx.shadowBlur = 8; ctx.shadowColor = '#1144cc'; ctx.fill();
  ctx.strokeStyle = 'rgba(80,160,255,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(R * 0.40, -R * 0.30);
  ctx.bezierCurveTo(R * 0.52, -R * 0.58, R * 0.86, -R * 0.64, R * 1.05, -R * 0.45);
  ctx.bezierCurveTo(R * 1.18, -R * 0.30, R * 1.12, -R * 0.10, R * 0.92, R * 0.00);
  ctx.bezierCurveTo(R * 0.72, R * 0.10,  R * 0.44, R * 0.08,  R * 0.32, -R * 0.05);
  ctx.bezierCurveTo(R * 0.22, -R * 0.15, R * 0.30, -R * 0.20, R * 0.40, -R * 0.30);
  ctx.fillStyle = 'rgba(0,0,20,0.25)'; ctx.shadowBlur = 0; ctx.fill();

  // Cyan contact edge
  ctx.beginPath();
  ctx.moveTo(R * 0.60, -R * 0.80);
  ctx.bezierCurveTo(R * 0.82, -R * 0.98, R * 1.14, -R * 0.84, R * 1.26, -R * 0.58);
  ctx.bezierCurveTo(R * 1.18, -R * 0.38, R * 0.90, -R * 0.40, R * 0.72, -R * 0.56);
  ctx.closePath();
  const cg = ctx.createLinearGradient(R * 0.65, -R * 0.85, R * 1.2, -R * 0.45);
  cg.addColorStop(0, '#33bbff'); cg.addColorStop(0.5, '#0088cc'); cg.addColorStop(1, '#004477');
  ctx.fillStyle = cg; ctx.shadowBlur = 12; ctx.shadowColor = '#00aaff'; ctx.fill();
  ctx.strokeStyle = 'rgba(80,200,255,0.45)'; ctx.lineWidth = 0.7; ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(R * 1.40, R * 0.10, R * 0.11, R * 0.07, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#88ccff'; ctx.shadowBlur = 8; ctx.shadowColor = '#44aaff'; ctx.fill();
}
function drawDragoonHub(R) {
  const hg = ctx.createRadialGradient(-R*0.14, -R*0.14, 0, 0, 0, R*0.60);
  hg.addColorStop(0, '#1a3a88'); hg.addColorStop(0.5, '#0a1840'); hg.addColorStop(1, '#030a20');
  ctx.beginPath(); ctx.arc(0, 0, R*0.60, 0, Math.PI*2);
  ctx.fillStyle = hg; ctx.shadowBlur = 10; ctx.shadowColor = '#0a2266'; ctx.fill();
  ctx.save();
  ctx.shadowBlur = 5; ctx.shadowColor = '#44aaff'; ctx.fillStyle = '#3388ee';
  ctx.beginPath();
  ctx.moveTo(-R*0.32, -R*0.06);
  ctx.bezierCurveTo(-R*0.22, -R*0.30, R*0.00, -R*0.36, R*0.20, -R*0.26);
  ctx.bezierCurveTo(R*0.40, -R*0.16, R*0.42, -R*0.02, R*0.34, R*0.06);
  ctx.bezierCurveTo(R*0.20, R*0.14, -R*0.08, R*0.18, -R*0.32, R*0.06);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#88ccff'; ctx.shadowBlur = 6; ctx.shadowColor = '#44aaff';
  ctx.beginPath(); ctx.arc(0, 0, R*0.10, 0, Math.PI*2); ctx.fill();
}

// ── CRIMSON GARUDA: wide feather blades, balance type ──
function drawGarudaBlade(R) {
  ctx.beginPath();
  ctx.moveTo(R*0.08, -R*0.18);
  ctx.bezierCurveTo(R*0.22, -R*0.56, R*0.72, -R*0.80, R*1.32, -R*0.56);
  ctx.bezierCurveTo(R*1.62, -R*0.36, R*1.62, R*0.36, R*1.32, R*0.56);
  ctx.bezierCurveTo(R*0.72, R*0.80, R*0.22, R*0.56, R*0.08, R*0.18);
  ctx.closePath();
  const rg = ctx.createLinearGradient(-R*0.1, -R*0.5, R*1.4, R*0.5);
  rg.addColorStop(0, '#6a0000'); rg.addColorStop(0.3, '#bb0f00');
  rg.addColorStop(0.65, '#dd2200'); rg.addColorStop(1, '#6a0000');
  ctx.fillStyle = rg; ctx.shadowBlur = 12; ctx.shadowColor = '#cc2200'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,70,30,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();

  // Feather vein lines
  ctx.shadowBlur = 0;
  for (let f = 0; f < 3; f++) {
    const fy = (f - 1) * R * 0.24;
    ctx.beginPath();
    ctx.moveTo(R*0.26, fy);
    ctx.bezierCurveTo(R*0.70, fy - R*0.04, R*1.10, fy - R*0.02, R*1.50, fy);
    ctx.strokeStyle = `rgba(255,180,60,${0.38 - Math.abs(f-1)*0.10})`;
    ctx.lineWidth = 0.9; ctx.stroke();
  }
  // Gold leading edge
  ctx.beginPath();
  ctx.moveTo(R*1.32, -R*0.56);
  ctx.bezierCurveTo(R*1.62, -R*0.36, R*1.62, R*0.36, R*1.32, R*0.56);
  ctx.strokeStyle = 'rgba(255,195,40,0.80)'; ctx.lineWidth = 2;
  ctx.shadowBlur = 8; ctx.shadowColor = '#ffcc33'; ctx.stroke();
}
function drawGarudaHub(R) {
  const hg = ctx.createRadialGradient(-R*0.14, -R*0.14, 0, 0, 0, R*0.58);
  hg.addColorStop(0, '#cc2200'); hg.addColorStop(0.5, '#770000'); hg.addColorStop(1, '#280000');
  ctx.beginPath(); ctx.arc(0, 0, R*0.58, 0, Math.PI*2);
  ctx.fillStyle = hg; ctx.shadowBlur = 10; ctx.shadowColor = '#aa1100'; ctx.fill();
  ctx.save();
  ctx.fillStyle = '#ffcc44'; ctx.shadowBlur = 6; ctx.shadowColor = '#ffaa00';
  ctx.beginPath();
  ctx.moveTo(0, -R*0.30);
  ctx.bezierCurveTo(R*0.22, -R*0.20, R*0.30, -R*0.04, R*0.26, R*0.10);
  ctx.bezierCurveTo(R*0.14, R*0.18, 0, R*0.22, 0, R*0.22);
  ctx.bezierCurveTo(0, R*0.22, -R*0.14, R*0.18, -R*0.26, R*0.10);
  ctx.bezierCurveTo(-R*0.30, -R*0.04, -R*0.22, -R*0.20, 0, -R*0.30);
  ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ffeeaa'; ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.arc(0, 0, R*0.09, 0, Math.PI*2); ctx.fill();
}

// ── SAMURAI SABER: dark navy dual-blade, attack type ──
function drawSaberBlade(R) {
  ctx.beginPath();
  ctx.moveTo(R*0.10, -R*0.24);
  ctx.bezierCurveTo(R*0.24, -R*0.52, R*0.68, -R*0.64, R*1.55, -R*0.22);
  ctx.bezierCurveTo(R*1.55, R*0.22, R*0.68, R*0.64, R*0.24, R*0.52);
  ctx.bezierCurveTo(R*0.10, R*0.24, R*0.04, R*0.04, R*0.10, -R*0.24);
  ctx.closePath();
  const dg = ctx.createLinearGradient(0, -R*0.4, R*1.5, 0);
  dg.addColorStop(0, '#0f1530'); dg.addColorStop(0.25, '#182050');
  dg.addColorStop(0.5, '#1e2a6a'); dg.addColorStop(0.75, '#182050'); dg.addColorStop(1, '#080e24');
  ctx.fillStyle = dg; ctx.shadowBlur = 8; ctx.shadowColor = '#2233aa'; ctx.fill();

  // Metallic katana edge
  ctx.beginPath();
  ctx.moveTo(R*0.20, -R*0.14);
  ctx.bezierCurveTo(R*0.38, -R*0.38, R*0.80, -R*0.46, R*1.52, -R*0.10);
  ctx.bezierCurveTo(R*1.52, R*0.10, R*0.80, R*0.46, R*0.38, R*0.38);
  ctx.bezierCurveTo(R*0.20, R*0.14, R*0.14, R*0.04, R*0.20, -R*0.14);
  ctx.closePath();
  const sg = ctx.createLinearGradient(R*0.2, -R*0.2, R*1.4, 0);
  sg.addColorStop(0, '#7788bb'); sg.addColorStop(0.4, '#c8d4f0'); sg.addColorStop(1, '#445588');
  ctx.fillStyle = sg; ctx.shadowBlur = 6; ctx.shadowColor = '#9aaae0'; ctx.fill();
  ctx.strokeStyle = 'rgba(190,210,255,0.55)'; ctx.lineWidth = 0.6; ctx.stroke();

  // Purple translucent spine
  ctx.beginPath();
  ctx.moveTo(R*0.22, -R*0.04);
  ctx.bezierCurveTo(R*0.55, -R*0.14, R*1.05, -R*0.07, R*1.50, -R*0.01);
  ctx.bezierCurveTo(R*1.05, R*0.07, R*0.55, R*0.14, R*0.22, R*0.04);
  ctx.closePath();
  ctx.fillStyle = 'rgba(130,90,255,0.28)'; ctx.shadowBlur = 0; ctx.fill();
}
function drawSaberHub(R) {
  const hg = ctx.createRadialGradient(-R*0.14, -R*0.14, 0, 0, 0, R*0.58);
  hg.addColorStop(0, '#1c1c50'); hg.addColorStop(0.5, '#0c0c28'); hg.addColorStop(1, '#040410');
  ctx.beginPath(); ctx.arc(0, 0, R*0.58, 0, Math.PI*2);
  ctx.fillStyle = hg; ctx.shadowBlur = 10; ctx.shadowColor = '#2030aa'; ctx.fill();
  ctx.save();
  ctx.fillStyle = '#7788cc'; ctx.shadowBlur = 4; ctx.shadowColor = '#99aaff';
  ctx.beginPath();
  ctx.moveTo(0, -R*0.30);
  ctx.bezierCurveTo(R*0.26, -R*0.22, R*0.28, R*0.06, R*0.16, R*0.18);
  ctx.bezierCurveTo(0, R*0.24, -R*0.16, R*0.18, -R*0.28, R*0.06);
  ctx.bezierCurveTo(-R*0.28, -R*0.22, 0, -R*0.30, 0, -R*0.30);
  ctx.fill();
  ctx.fillStyle = 'rgba(130,150,255,0.75)';
  ctx.beginPath(); ctx.ellipse(-R*0.11, -R*0.01, R*0.07, R*0.025, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R*0.11, -R*0.01, R*0.07, R*0.025, 0.2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#aabbee'; ctx.shadowBlur = 5; ctx.shadowColor = '#8899cc';
  ctx.beginPath(); ctx.arc(0, 0, R*0.09, 0, Math.PI*2); ctx.fill();
}

// ── HELLS CHAIN: heavy dark blade, defense tank ──
// ── HELL KERBECS: heavy dark gunmetal armour, 3-headed wolf, purple glow ──
function drawKerbecsBlade(R) {
  // Outer heavy armour plate body
  ctx.beginPath();
  ctx.moveTo(R * 0.08, -R * 0.26);
  ctx.bezierCurveTo(R * 0.18, -R * 0.64, R * 0.58, -R * 0.90, R * 1.00, -R * 0.80);
  ctx.bezierCurveTo(R * 1.32, -R * 0.72, R * 1.62, -R * 0.40, R * 1.64, -R * 0.02);
  ctx.bezierCurveTo(R * 1.64,  R * 0.36, R * 1.46,  R * 0.66, R * 1.14,  R * 0.76);
  ctx.bezierCurveTo(R * 0.72,  R * 0.86, R * 0.22,  R * 0.60, R * 0.08,  R * 0.26);
  ctx.closePath();
  const kg = ctx.createLinearGradient(-R * 0.1, -R * 0.7, R * 1.6, R * 0.6);
  kg.addColorStop(0,    '#222230');
  kg.addColorStop(0.18, '#484858');
  kg.addColorStop(0.45, '#72727f');
  kg.addColorStop(0.72, '#484858');
  kg.addColorStop(1,    '#18181f');
  ctx.fillStyle   = kg;
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#770099';
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,80,255,0.38)';
  ctx.lineWidth   = 1.0;
  ctx.stroke();

  // Horizontal armour-plate ridges
  ctx.save();
  ctx.shadowBlur = 0;
  for (let r = 0; r < 3; r++) {
    const yo = -R * 0.26 + r * R * 0.26;
    ctx.beginPath();
    ctx.moveTo(R * 0.14, yo);
    ctx.bezierCurveTo(R * 0.55, yo - R * 0.05, R * 1.10, yo - R * 0.03, R * 1.52, yo + R * 0.05);
    ctx.strokeStyle = r === 1 ? 'rgba(150,80,255,0.40)' : 'rgba(255,255,255,0.11)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  ctx.restore();

  // Wolf-claw accent at outer tip (dark purple claw)
  ctx.save();
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#8800bb';
  ctx.fillStyle   = '#4a0077';
  ctx.beginPath();
  ctx.moveTo(R * 0.88, -R * 0.80);
  ctx.bezierCurveTo(R * 1.08, -R * 0.96, R * 1.36, -R * 0.80, R * 1.40, -R * 0.56);
  ctx.bezierCurveTo(R * 1.28, -R * 0.50, R * 1.06, -R * 0.60, R * 0.88, -R * 0.80);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Silver highlight ridge across top face
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth   = 1.4;
  ctx.beginPath();
  ctx.moveTo(R * 0.12, -R * 0.22);
  ctx.bezierCurveTo(R * 0.50, -R * 0.40, R * 1.00, -R * 0.38, R * 1.50, -R * 0.14);
  ctx.stroke();
  ctx.restore();

  // Purple outer edge glow
  ctx.beginPath();
  ctx.moveTo(R * 1.00, -R * 0.80);
  ctx.bezierCurveTo(R * 1.32, -R * 0.72, R * 1.62, -R * 0.40, R * 1.64, -R * 0.02);
  ctx.bezierCurveTo(R * 1.64,  R * 0.36, R * 1.46,  R * 0.66, R * 1.14,  R * 0.76);
  ctx.strokeStyle = 'rgba(170,50,255,0.78)';
  ctx.lineWidth   = 2.2;
  ctx.shadowBlur  = 16;
  ctx.shadowColor = '#8800ff';
  ctx.stroke();
}

function drawKerbecsHub(R) {
  // Deep dark disc
  const hg = ctx.createRadialGradient(-R * 0.10, -R * 0.10, 0, 0, 0, R * 0.60);
  hg.addColorStop(0,   '#200035');
  hg.addColorStop(0.5, '#0d0016');
  hg.addColorStop(1,   '#050008');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.shadowBlur = 16; ctx.shadowColor = '#6600aa'; ctx.fill();

  // Purple hub ring
  ctx.strokeStyle = '#5500aa';
  ctx.lineWidth   = 1.8;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#9900ff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.57, 0, Math.PI * 2); ctx.stroke();

  // Cerberus — three wolf heads
  ctx.save();
  ctx.shadowBlur  = 6;
  ctx.shadowColor = '#bb44ff';

  // Left wolf head
  ctx.fillStyle = '#8a8a9a';
  ctx.beginPath();
  ctx.ellipse(-R * 0.28, R * 0.06, R * 0.15, R * 0.13, -0.30, 0, Math.PI * 2);
  ctx.fill();
  // Left snout
  ctx.fillStyle = '#707080';
  ctx.beginPath();
  ctx.ellipse(-R * 0.34, R * 0.14, R * 0.08, R * 0.06, -0.20, 0, Math.PI * 2);
  ctx.fill();
  // Left eye
  ctx.fillStyle = '#cc00ff';
  ctx.shadowBlur = 5; ctx.shadowColor = '#ff44ff';
  ctx.beginPath(); ctx.arc(-R * 0.22, R * 0.00, R * 0.036, 0, Math.PI * 2); ctx.fill();

  // Center (main) wolf head — larger
  ctx.shadowBlur = 7; ctx.shadowColor = '#cc44ff';
  ctx.fillStyle = '#aaaabc';
  ctx.beginPath();
  ctx.ellipse(0, -R * 0.06, R * 0.22, R * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  // Center snout
  ctx.fillStyle = '#888898';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.10, R * 0.12, R * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  // Center eyes
  ctx.fillStyle = '#cc00ff';
  ctx.shadowBlur = 6; ctx.shadowColor = '#ff44ff';
  ctx.beginPath(); ctx.arc(-R * 0.09, -R * 0.09, R * 0.048, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( R * 0.09, -R * 0.09, R * 0.048, 0, Math.PI * 2); ctx.fill();
  // Center fangs
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-R * 0.07, R * 0.16); ctx.lineTo(-R * 0.04, R * 0.24); ctx.lineTo(-R * 0.01, R * 0.16);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo( R * 0.01, R * 0.16); ctx.lineTo( R * 0.04, R * 0.24); ctx.lineTo( R * 0.07, R * 0.16);
  ctx.closePath(); ctx.fill();

  // Right wolf head
  ctx.fillStyle = '#8a8a9a';
  ctx.shadowBlur = 6; ctx.shadowColor = '#bb44ff';
  ctx.beginPath();
  ctx.ellipse(R * 0.28, R * 0.06, R * 0.15, R * 0.13, 0.30, 0, Math.PI * 2);
  ctx.fill();
  // Right snout
  ctx.fillStyle = '#707080';
  ctx.beginPath();
  ctx.ellipse(R * 0.34, R * 0.14, R * 0.08, R * 0.06, 0.20, 0, Math.PI * 2);
  ctx.fill();
  // Right eye
  ctx.fillStyle = '#cc00ff';
  ctx.shadowBlur = 5; ctx.shadowColor = '#ff44ff';
  ctx.beginPath(); ctx.arc(R * 0.22, R * 0.00, R * 0.036, 0, Math.PI * 2); ctx.fill();

  ctx.restore();

  // Center pin — purple glow
  ctx.fillStyle = '#8800cc';
  ctx.shadowBlur = 10; ctx.shadowColor = '#cc44ff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.08, 0, Math.PI * 2); ctx.fill();
}

// ── DIABLO NEMESIS: wide golden winged disc, flame accents, dark beast hub ──
function drawNemesisBlade(R) {
  // Wide sweeping golden wing
  ctx.beginPath();
  ctx.moveTo(R * 0.10, -R * 0.18);
  ctx.bezierCurveTo(R * 0.24, -R * 0.50, R * 0.66, -R * 0.76, R * 1.12, -R * 0.66);
  ctx.bezierCurveTo(R * 1.50, -R * 0.56, R * 1.76, -R * 0.24, R * 1.76, R * 0.04);
  ctx.bezierCurveTo(R * 1.76,  R * 0.30, R * 1.52,  R * 0.52, R * 1.22,  R * 0.52);
  ctx.bezierCurveTo(R * 0.88,  R * 0.52, R * 0.56,  R * 0.38, R * 0.28,  R * 0.18);
  ctx.bezierCurveTo(R * 0.14,  R * 0.08, R * 0.08, -R * 0.02, R * 0.10, -R * 0.18);
  ctx.closePath();
  const gg = ctx.createLinearGradient(-R * 0.1, -R * 0.65, R * 1.7, R * 0.45);
  gg.addColorStop(0,    '#a86000');
  gg.addColorStop(0.20, '#e09a18');
  gg.addColorStop(0.45, '#ffc830');
  gg.addColorStop(0.70, '#d08010');
  gg.addColorStop(1,    '#804000');
  ctx.fillStyle   = gg;
  ctx.shadowBlur  = 18;
  ctx.shadowColor = '#ff7700';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,60,0.65)';
  ctx.lineWidth   = 1.0;
  ctx.stroke();

  // Orange-red flame teardrops
  ctx.save();
  ctx.shadowBlur  = 12;
  ctx.shadowColor = '#ff3300';
  const fg = ctx.createLinearGradient(R * 0.6, -R * 0.65, R * 1.5, R * 0.0);
  fg.addColorStop(0,   '#ff5500');
  fg.addColorStop(0.5, '#ff2200');
  fg.addColorStop(1,   '#cc1800');
  ctx.fillStyle = fg;

  // Flame 1
  ctx.beginPath();
  ctx.moveTo(R * 0.68, -R * 0.56);
  ctx.bezierCurveTo(R * 0.78, -R * 0.72, R * 0.98, -R * 0.70, R * 1.02, -R * 0.54);
  ctx.bezierCurveTo(R * 1.02, -R * 0.40, R * 0.86, -R * 0.36, R * 0.76, -R * 0.42);
  ctx.bezierCurveTo(R * 0.66, -R * 0.46, R * 0.64, -R * 0.52, R * 0.68, -R * 0.56);
  ctx.closePath(); ctx.fill();

  // Flame 2
  ctx.beginPath();
  ctx.moveTo(R * 1.12, -R * 0.42);
  ctx.bezierCurveTo(R * 1.22, -R * 0.56, R * 1.44, -R * 0.48, R * 1.46, -R * 0.28);
  ctx.bezierCurveTo(R * 1.44, -R * 0.14, R * 1.26, -R * 0.12, R * 1.18, -R * 0.18);
  ctx.bezierCurveTo(R * 1.08, -R * 0.26, R * 1.06, -R * 0.36, R * 1.12, -R * 0.42);
  ctx.closePath(); ctx.fill();

  // Flame 3 (lower)
  ctx.beginPath();
  ctx.moveTo(R * 0.90, R * 0.24);
  ctx.bezierCurveTo(R * 1.04, R * 0.14, R * 1.26, R * 0.20, R * 1.28, R * 0.38);
  ctx.bezierCurveTo(R * 1.26, R * 0.50, R * 1.06, R * 0.52, R * 0.98, R * 0.44);
  ctx.bezierCurveTo(R * 0.88, R * 0.36, R * 0.86, R * 0.28, R * 0.90, R * 0.24);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // Black ornamental filigree lines
  ctx.save();
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = 'rgba(0,0,0,0.50)';
  ctx.lineWidth   = 1.0;
  ctx.beginPath();
  ctx.moveTo(R * 0.20, -R * 0.08);
  ctx.bezierCurveTo(R * 0.52, -R * 0.22, R * 1.05, -R * 0.18, R * 1.48, R * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(R * 0.26, R * 0.18);
  ctx.bezierCurveTo(R * 0.58, R * 0.30, R * 1.04, R * 0.28, R * 1.38, R * 0.22);
  ctx.stroke();
  ctx.restore();

  // Bright gold outer edge highlight
  ctx.beginPath();
  ctx.moveTo(R * 1.12, -R * 0.66);
  ctx.bezierCurveTo(R * 1.50, -R * 0.56, R * 1.76, -R * 0.24, R * 1.76, R * 0.04);
  ctx.bezierCurveTo(R * 1.76,  R * 0.30, R * 1.52,  R * 0.52, R * 1.22,  R * 0.52);
  ctx.strokeStyle = 'rgba(255,235,90,0.82)';
  ctx.lineWidth   = 2.2;
  ctx.shadowBlur  = 18;
  ctx.shadowColor = '#ffa000';
  ctx.stroke();
}

function drawNemesisHub(R) {
  // Outer gold ring
  ctx.beginPath(); ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2);
  const or = ctx.createLinearGradient(-R * 0.5, -R * 0.5, R * 0.5, R * 0.5);
  or.addColorStop(0,   '#ffc030');
  or.addColorStop(0.3, '#c06800');
  or.addColorStop(0.7, '#e08a18');
  or.addColorStop(1,   '#885000');
  ctx.fillStyle = or;
  ctx.shadowBlur = 16; ctx.shadowColor = '#ff8800';
  ctx.fill();

  // Thin gold ring border
  ctx.strokeStyle = 'rgba(255,240,100,0.70)';
  ctx.lineWidth   = 1.2;
  ctx.shadowBlur  = 8; ctx.shadowColor = '#ffcc00';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.58, 0, Math.PI * 2); ctx.stroke();

  // Dark beast inner disc
  const ig = ctx.createRadialGradient(-R * 0.10, -R * 0.10, 0, 0, 0, R * 0.44);
  ig.addColorStop(0,   '#2a1000');
  ig.addColorStop(0.6, '#110500');
  ig.addColorStop(1,   '#060200');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.44, 0, Math.PI * 2);
  ctx.fillStyle = ig; ctx.shadowBlur = 0; ctx.fill();

  // Beast silhouette — horned dark head
  ctx.save();
  ctx.fillStyle = '#1a0a00';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.06, R * 0.26, R * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Left horn
  ctx.beginPath();
  ctx.moveTo(-R * 0.10, -R * 0.06);
  ctx.lineTo(-R * 0.24, -R * 0.32);
  ctx.lineTo(-R * 0.06, -R * 0.10);
  ctx.closePath(); ctx.fill();
  // Right horn
  ctx.beginPath();
  ctx.moveTo( R * 0.10, -R * 0.06);
  ctx.lineTo( R * 0.24, -R * 0.32);
  ctx.lineTo( R * 0.06, -R * 0.10);
  ctx.closePath(); ctx.fill();

  // Glowing red-orange eyes
  ctx.fillStyle   = '#ff2200';
  ctx.shadowBlur  = 10; ctx.shadowColor = '#ff5500';
  ctx.beginPath(); ctx.ellipse(-R * 0.10, R * 0.02, R * 0.055, R * 0.038, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( R * 0.10, R * 0.02, R * 0.055, R * 0.038,  0.25, 0, Math.PI * 2); ctx.fill();

  // Fire glow beneath eyes
  ctx.fillStyle   = '#ff4400';
  ctx.shadowBlur  = 6; ctx.shadowColor = '#ff8800';
  ctx.beginPath();
  ctx.moveTo(-R * 0.16, R * 0.14);
  ctx.lineTo(-R * 0.00, R * 0.22);
  ctx.lineTo( R * 0.16, R * 0.14);
  ctx.bezierCurveTo(R * 0.10, R * 0.10, -R * 0.10, R * 0.10, -R * 0.16, R * 0.14);
  ctx.fill();
  ctx.restore();

  // Gold center pip
  ctx.fillStyle   = '#ffc830';
  ctx.shadowBlur  = 12; ctx.shadowColor = '#ffaa00';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.09, 0, Math.PI * 2); ctx.fill();
}

// ── PHANTOM ORION B:D: wide orbital disc, cosmic silver-blue, Ball Driver hub ──
function drawOrionBlade(R) {
  // Wide sweeping orbital wing — smooth, massive, effortless
  ctx.beginPath();
  ctx.moveTo(R * 0.06, -R * 0.20);
  ctx.bezierCurveTo(R * 0.18, -R * 0.58, R * 0.68, -R * 0.90, R * 1.22, -R * 0.56);
  ctx.bezierCurveTo(R * 1.52, -R * 0.30, R * 1.50,  R * 0.08, R * 1.16,  R * 0.32);
  ctx.bezierCurveTo(R * 0.78,  R * 0.58, R * 0.20,  R * 0.42, R * 0.06,  R * 0.20);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, -R * 0.8, R * 1.2, R * 0.4);
  bg.addColorStop(0,   '#eef5ff');
  bg.addColorStop(0.25,'#a8c8ee');
  bg.addColorStop(0.6, '#4a80cc');
  bg.addColorStop(1,   '#1a2e58');
  ctx.fillStyle = bg;
  ctx.shadowBlur = 24; ctx.shadowColor = '#66aaff';
  ctx.fill();
  // Silver edge
  ctx.strokeStyle = 'rgba(200,228,255,0.85)';
  ctx.lineWidth   = 1.4;
  ctx.shadowBlur  = 8; ctx.shadowColor = '#aaddff';
  ctx.stroke();
  // Inner orbital groove line
  ctx.beginPath();
  ctx.moveTo(R * 0.14, -R * 0.24);
  ctx.bezierCurveTo(R * 0.32, -R * 0.54, R * 0.72, -R * 0.74, R * 1.02, -R * 0.44);
  ctx.bezierCurveTo(R * 1.24, -R * 0.20, R * 1.12,  R * 0.10, R * 0.90,  R * 0.20);
  ctx.strokeStyle = 'rgba(160,200,255,0.50)';
  ctx.lineWidth   = 0.9; ctx.shadowBlur = 4; ctx.shadowColor = '#88bbff';
  ctx.stroke();
  // Star accent pip on blade
  ctx.fillStyle   = 'rgba(255,255,255,0.72)';
  ctx.shadowBlur  = 10; ctx.shadowColor = '#aaddff';
  ctx.beginPath(); ctx.arc(R * 0.72, -R * 0.44, R * 0.045, 0, Math.PI * 2); ctx.fill();
}

function drawOrionHub(R) {
  // Outer cosmic silver ring
  ctx.beginPath(); ctx.arc(0, 0, R * 0.64, 0, Math.PI * 2);
  const or = ctx.createRadialGradient(-R * 0.16, -R * 0.16, 0, 0, 0, R * 0.64);
  or.addColorStop(0,   '#f2f8ff');
  or.addColorStop(0.3, '#b8d4f0');
  or.addColorStop(0.7, '#5888c0');
  or.addColorStop(1,   '#1a2e50');
  ctx.fillStyle = or;
  ctx.shadowBlur = 28; ctx.shadowColor = '#88bbff';
  ctx.fill();
  // Bright chrome border ring
  ctx.strokeStyle = 'rgba(220,240,255,0.90)';
  ctx.lineWidth   = 1.8;
  ctx.shadowBlur  = 14; ctx.shadowColor = '#aaccff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.stroke();
  // Ball Driver (B:D) — the spherical tip that lets it spin forever
  const ballGrad = ctx.createRadialGradient(-R * 0.13, -R * 0.16, 0, R * 0.04, R * 0.04, R * 0.38);
  ballGrad.addColorStop(0,    '#ffffff');
  ballGrad.addColorStop(0.12, '#e0eeff');
  ballGrad.addColorStop(0.45, '#8ab0e0');
  ballGrad.addColorStop(0.80, '#2a4880');
  ballGrad.addColorStop(1,    '#080e20');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = ballGrad;
  ctx.shadowBlur = 20; ctx.shadowColor = '#aaddff';
  ctx.fill();
  // Ball Driver specular highlight arc
  ctx.strokeStyle = 'rgba(220,240,255,0.65)';
  ctx.lineWidth   = 1.2; ctx.shadowBlur = 5; ctx.shadowColor = '#ccddff';
  ctx.beginPath();
  ctx.arc(-R * 0.06, -R * 0.09, R * 0.24, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();
  // Orion constellation — 5 orbital star pips
  const starAngles = [0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6];
  ctx.shadowBlur  = 10; ctx.shadowColor = '#88aaff';
  starAngles.forEach((a, idx) => {
    ctx.fillStyle = idx === 0 ? '#ffffff' : '#aaccff';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * R * 0.24, Math.sin(a) * R * 0.24, R * (idx === 0 ? 0.042 : 0.030), 0, Math.PI * 2);
    ctx.fill();
  });
  // Brilliant center pip
  ctx.fillStyle   = '#ffffff';
  ctx.shadowBlur  = 20; ctx.shadowColor = '#aaddff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.072, 0, Math.PI * 2); ctx.fill();
}

function drawPegasisBlade(R) {
  // Big Bang Pegasis F:D — swept forward-attack wing with sharp leading edge
  ctx.beginPath();
  ctx.moveTo(R * 0.04, -R * 0.16);
  ctx.bezierCurveTo(R * 0.12, -R * 0.52, R * 0.56, -R * 0.88, R * 1.10, -R * 0.76);
  ctx.bezierCurveTo(R * 1.48, -R * 0.64, R * 1.62, -R * 0.28, R * 1.54,  R * 0.04);
  ctx.bezierCurveTo(R * 1.44,  R * 0.32, R * 1.10,  R * 0.46, R * 0.78,  R * 0.44);
  ctx.bezierCurveTo(R * 0.44,  R * 0.40, R * 0.14,  R * 0.24, R * 0.04,  R * 0.16);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, -R * 0.85, R * 1.55, R * 0.45);
  bg.addColorStop(0,    '#ddeeff');
  bg.addColorStop(0.18, '#88bbee');
  bg.addColorStop(0.50, '#2255cc');
  bg.addColorStop(0.78, '#112299');
  bg.addColorStop(1,    '#060e40');
  ctx.fillStyle   = bg;
  ctx.shadowBlur  = 26; ctx.shadowColor = '#66aaff';
  ctx.fill();
  // Bright leading-edge highlight
  ctx.beginPath();
  ctx.moveTo(R * 0.10, -R * 0.22);
  ctx.bezierCurveTo(R * 0.22, -R * 0.56, R * 0.60, -R * 0.84, R * 1.10, -R * 0.76);
  ctx.strokeStyle = 'rgba(200,230,255,0.90)';
  ctx.lineWidth   = 2.2;
  ctx.shadowBlur  = 12; ctx.shadowColor = '#aaddff';
  ctx.stroke();
  // Red accent stripe — speed motif
  ctx.beginPath();
  ctx.moveTo(R * 0.30, -R * 0.30);
  ctx.bezierCurveTo(R * 0.60, -R * 0.46, R * 0.96, -R * 0.44, R * 1.22, -R * 0.28);
  ctx.strokeStyle = 'rgba(255,60,60,0.75)';
  ctx.lineWidth   = 1.6; ctx.shadowBlur = 8; ctx.shadowColor = '#ff4444';
  ctx.stroke();
  // Silver trailing edge
  ctx.beginPath();
  ctx.moveTo(R * 0.78, R * 0.44);
  ctx.bezierCurveTo(R * 1.10, R * 0.46, R * 1.44, R * 0.32, R * 1.54, R * 0.04);
  ctx.strokeStyle = 'rgba(160,200,255,0.55)';
  ctx.lineWidth   = 1.0; ctx.shadowBlur = 4; ctx.shadowColor = '#88aaff';
  ctx.stroke();
  // Bright speed pip
  ctx.fillStyle  = 'rgba(255,255,255,0.88)';
  ctx.shadowBlur = 12; ctx.shadowColor = '#aaddff';
  ctx.beginPath(); ctx.arc(R * 0.82, -R * 0.38, R * 0.042, 0, Math.PI * 2); ctx.fill();
}

function drawPegasisHub(R) {
  // Outer silver-blue ring
  ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2);
  const or = ctx.createRadialGradient(-R * 0.18, -R * 0.18, 0, 0, 0, R * 0.62);
  or.addColorStop(0,   '#eef6ff');
  or.addColorStop(0.3, '#99cce8');
  or.addColorStop(0.7, '#2255aa');
  or.addColorStop(1,   '#060e36');
  ctx.fillStyle = or;
  ctx.shadowBlur = 30; ctx.shadowColor = '#66aaff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,220,255,0.92)';
  ctx.lineWidth   = 2.0;
  ctx.shadowBlur  = 14; ctx.shadowColor = '#aaccff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2); ctx.stroke();
  // F:D Final Drive tip — spherical with a chrome ring
  const fd = ctx.createRadialGradient(-R * 0.12, -R * 0.14, 0, R * 0.02, R * 0.02, R * 0.36);
  fd.addColorStop(0,    '#ffffff');
  fd.addColorStop(0.15, '#cce4ff');
  fd.addColorStop(0.50, '#4477cc');
  fd.addColorStop(0.82, '#1a3080');
  fd.addColorStop(1,    '#060d28');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = fd;
  ctx.shadowBlur = 18; ctx.shadowColor = '#88bbff';
  ctx.fill();
  // Chrome ring around F:D tip
  ctx.strokeStyle = 'rgba(200,228,255,0.80)';
  ctx.lineWidth   = 1.6; ctx.shadowBlur = 8; ctx.shadowColor = '#ccddff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.36, 0, Math.PI * 2); ctx.stroke();
  // Pegasus wing emblem — two curved wing arcs
  ctx.save();
  ctx.shadowBlur  = 8; ctx.shadowColor = '#aaddff';
  ctx.strokeStyle = 'rgba(220,240,255,0.85)';
  ctx.lineWidth   = 1.4;
  // Left wing
  ctx.beginPath();
  ctx.moveTo(-R * 0.02, -R * 0.06);
  ctx.bezierCurveTo(-R * 0.16, -R * 0.20, -R * 0.26, -R * 0.10, -R * 0.22, R * 0.04);
  ctx.stroke();
  // Right wing
  ctx.beginPath();
  ctx.moveTo( R * 0.02, -R * 0.06);
  ctx.bezierCurveTo( R * 0.16, -R * 0.20,  R * 0.26, -R * 0.10,  R * 0.22, R * 0.04);
  ctx.stroke();
  ctx.restore();
  // Centre brilliant pip
  ctx.fillStyle  = '#ffffff';
  ctx.shadowBlur = 22; ctx.shadowColor = '#aaddff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.068, 0, Math.PI * 2); ctx.fill();
  // F:D lettering dots (two tiny accent pips)
  ctx.fillStyle  = 'rgba(255,255,255,0.65)';
  ctx.shadowBlur = 6; ctx.shadowColor = '#88aaff';
  ctx.beginPath(); ctx.arc(-R * 0.20, R * 0.18, R * 0.028, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( R * 0.20, R * 0.18, R * 0.028, 0, Math.PI * 2); ctx.fill();
}

function drawHellsBlade(R) {
  // Dark purple-black rounded heavy blade
  ctx.beginPath();
  ctx.moveTo(R * 0.08, -R * 0.28);
  ctx.bezierCurveTo(R * 0.22, -R * 0.60, R * 0.80, -R * 0.72, R * 1.20, -R * 0.48);
  ctx.bezierCurveTo(R * 1.52, -R * 0.20, R * 1.52,  R * 0.20, R * 1.20,  R * 0.48);
  ctx.bezierCurveTo(R * 0.80,  R * 0.72, R * 0.22,  R * 0.60, R * 0.08,  R * 0.28);
  ctx.closePath();
  const hg = ctx.createRadialGradient(R * 0.5, 0, 0, R * 0.6, 0, R * 1.3);
  hg.addColorStop(0,   '#6622bb');
  hg.addColorStop(0.5, '#330066');
  hg.addColorStop(1,   '#110022');
  ctx.fillStyle   = hg;
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#8800ff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,80,255,0.5)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // Chain-link holes
  for (let i = 0; i < 3; i++) {
    const cx = R * (0.45 + i * 0.32), cy = 0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 0.09, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,60,255,0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Purple edge glow rim
  ctx.beginPath();
  ctx.moveTo(R * 1.20, -R * 0.48);
  ctx.bezierCurveTo(R * 1.52, -R * 0.20, R * 1.52, R * 0.20, R * 1.20, R * 0.48);
  ctx.strokeStyle = 'rgba(200,100,255,0.8)';
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#cc66ff';
  ctx.stroke();
}

function drawHellsHub(R) {
  const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.60);
  hg.addColorStop(0,   '#4400aa');
  hg.addColorStop(0.6, '#110022');
  hg.addColorStop(1,   '#050008');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.shadowBlur = 12; ctx.shadowColor = '#7700cc'; ctx.fill();

  // Purple eye
  ctx.save();
  ctx.fillStyle = '#cc44ff'; ctx.shadowBlur = 8; ctx.shadowColor = '#dd66ff';
  ctx.beginPath(); ctx.ellipse(0, 0, R*0.22, R*0.14, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.arc(-R*0.06, -R*0.04, R*0.06, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000000'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(0, 0, R*0.08, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#cc44ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#cc44ff';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.06, 0, Math.PI * 2); ctx.fill();
}

// ── KNIGHT SHIELD: wide flat blades, ultimate defense ──
function drawKnightBlade(R) {
  // Wide kite-shield blade shape
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.08);
  ctx.lineTo(R * 0.15, -R * 0.58);
  ctx.bezierCurveTo(R * 0.55, -R * 0.72, R * 1.08, -R * 0.58, R * 1.42, -R * 0.22);
  ctx.bezierCurveTo(R * 1.58,  R * 0.00, R * 1.58,  R * 0.18, R * 1.42,  R * 0.30);
  ctx.bezierCurveTo(R * 1.10,  R * 0.56, R * 0.55,  R * 0.58, R * 0.15,  R * 0.38);
  ctx.closePath();
  const kg = ctx.createLinearGradient(0, -R * 0.5, R * 1.4, R * 0.3);
  kg.addColorStop(0,   '#2255bb');
  kg.addColorStop(0.3, '#4488ee');
  kg.addColorStop(0.6, '#6699ff');
  kg.addColorStop(1,   '#1133aa');
  ctx.fillStyle   = kg;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#4488ff';
  ctx.fill();

  // Gold shield trim
  ctx.beginPath();
  ctx.moveTo(R * 0.15, -R * 0.58);
  ctx.bezierCurveTo(R * 0.55, -R * 0.72, R * 1.08, -R * 0.58, R * 1.42, -R * 0.22);
  ctx.strokeStyle = '#ffdd44';
  ctx.lineWidth   = 1.2;
  ctx.shadowBlur  = 6;
  ctx.shadowColor = '#ffcc00';
  ctx.stroke();

  // Cross emblem on blade
  ctx.save();
  ctx.strokeStyle = 'rgba(255,220,60,0.5)';
  ctx.lineWidth   = 1;
  ctx.shadowBlur  = 0;
  const mx = R * 0.65, my = 0;
  ctx.beginPath(); ctx.moveTo(mx - R*0.14, my); ctx.lineTo(mx + R*0.14, my); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx, my - R*0.14); ctx.lineTo(mx, my + R*0.14); ctx.stroke();
  ctx.restore();

  // Silver edge highlight
  ctx.beginPath();
  ctx.moveTo(R * 1.42, -R * 0.22);
  ctx.bezierCurveTo(R * 1.58, R * 0.00, R * 1.58, R * 0.18, R * 1.42, R * 0.30);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 1.2;
  ctx.shadowBlur  = 0;
  ctx.stroke();
}

function drawKnightHub(R) {
  const hg = ctx.createRadialGradient(-R*0.10, -R*0.10, 0, 0, 0, R*0.60);
  hg.addColorStop(0,   '#5588ff');
  hg.addColorStop(0.5, '#1133bb');
  hg.addColorStop(1,   '#050a2a');
  ctx.beginPath(); ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.shadowBlur = 10; ctx.shadowColor = '#3366ff'; ctx.fill();

  // Gold cross
  ctx.save();
  ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = 2;
  ctx.shadowBlur = 6; ctx.shadowColor = '#ffcc00';
  ctx.beginPath(); ctx.moveTo(-R*0.28, 0); ctx.lineTo(R*0.28, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -R*0.28); ctx.lineTo(0, R*0.28); ctx.stroke();
  ctx.restore();

  // Diamond center
  ctx.save();
  ctx.fillStyle = '#aaddff'; ctx.shadowBlur = 8; ctx.shadowColor = '#88bbff';
  ctx.beginPath();
  ctx.moveTo(0, -R*0.14); ctx.lineTo(R*0.10, 0); ctx.lineTo(0, R*0.14); ctx.lineTo(-R*0.10, 0);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ── THE UNKNOWN: fractured void crystal shard ──
function drawUnknownBlade(R) {
  // Jagged crystalline shard — sharp asymmetric polygon
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(R * 0.42, -R * 0.58);
  ctx.lineTo(R * 0.82, -R * 0.32);
  ctx.lineTo(R * 1.28,  R * 0.08);
  ctx.lineTo(R * 0.92,  R * 0.44);
  ctx.lineTo(R * 0.28,  R * 0.22);
  ctx.closePath();

  const gr = ctx.createLinearGradient(0, 0, R * 1.3, 0);
  gr.addColorStop(0,    '#330044bb');
  gr.addColorStop(0.38, '#8844ccee');
  gr.addColorStop(0.65, '#cc66ffdd');
  gr.addColorStop(1,    '#22003344');
  ctx.fillStyle   = gr;
  ctx.strokeStyle = 'rgba(200, 100, 255, 0.55)';
  ctx.lineWidth   = 0.9;
  ctx.fill();
  ctx.stroke();

  // Inner void accent shard
  ctx.beginPath();
  ctx.moveTo(R * 0.18, -R * 0.10);
  ctx.lineTo(R * 0.54, -R * 0.30);
  ctx.lineTo(R * 0.90,  R * 0.06);
  ctx.lineTo(R * 0.60,  R * 0.24);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 20, 0.42)';
  ctx.fill();
}

function drawUnknownHub(R) {
  // Deep void core with purple radial gradient
  const hub = ctx.createRadialGradient(-R * 0.14, -R * 0.14, 0, 0, 0, R * 0.56);
  hub.addColorStop(0,    'rgba(255,255,255,0.75)');
  hub.addColorStop(0.22, '#cc66ff');
  hub.addColorStop(0.60, '#330044');
  hub.addColorStop(1,    '#000000');
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.56, 0, Math.PI * 2);
  ctx.fillStyle = hub;
  ctx.shadowBlur  = 16;
  ctx.shadowColor = '#cc66ff';
  ctx.fill();

  // "?" glyph in the hub center
  ctx.save();
  ctx.font         = `bold ${Math.round(R * 0.40)}px 'Orbitron', monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(210, 130, 255, 0.90)';
  ctx.shadowBlur   = 8;
  ctx.shadowColor  = '#cc66ff';
  ctx.fillText('?', 0, R * 0.04);
  ctx.restore();
}

function drawTitanBlade(R) {
  // Jagged volcanic plate: chunky asymmetric wedge with notched trailing edge
  ctx.beginPath();
  ctx.moveTo(R * 0.10, -R * 0.22);
  ctx.lineTo(R * 0.56, -R * 0.72);
  ctx.lineTo(R * 1.10, -R * 0.40);
  ctx.lineTo(R * 1.38, -R * 0.06);
  ctx.lineTo(R * 1.22,  R * 0.28);
  ctx.lineTo(R * 0.88,  R * 0.16);  // notch in
  ctx.lineTo(R * 0.70,  R * 0.42);
  ctx.lineTo(R * 0.34,  R * 0.18);
  ctx.closePath();

  // Obsidian body with molten crack glow underneath
  const body = ctx.createLinearGradient(0, -R * 0.6, R * 1.4, R * 0.4);
  body.addColorStop(0,    '#120300');
  body.addColorStop(0.55, '#2a0a00');
  body.addColorStop(1,    '#3a1002');
  ctx.fillStyle   = body;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#ff5500';
  ctx.fill();
  ctx.strokeStyle = '#552200';
  ctx.lineWidth   = 1.1;
  ctx.stroke();

  // Magma veins — three bright cracks
  ctx.save();
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#ff9900';
  ctx.strokeStyle = '#ff7722';
  ctx.lineWidth   = 1.8;
  ctx.beginPath(); ctx.moveTo(R * 0.32, -R * 0.18); ctx.lineTo(R * 0.72, -R * 0.50); ctx.lineTo(R * 0.96, -R * 0.22); ctx.stroke();
  ctx.strokeStyle = '#ffaa33';
  ctx.lineWidth   = 1.2;
  ctx.beginPath(); ctx.moveTo(R * 0.48,  R * 0.02); ctx.lineTo(R * 0.88, -R * 0.08); ctx.lineTo(R * 1.18,  R * 0.10); ctx.stroke();
  ctx.strokeStyle = '#ffcc66';
  ctx.lineWidth   = 0.9;
  ctx.beginPath(); ctx.moveTo(R * 0.50,  R * 0.18); ctx.lineTo(R * 0.82,  R * 0.30); ctx.stroke();
  ctx.restore();

  // Inner ember glow pool
  ctx.beginPath();
  ctx.arc(R * 0.82, -R * 0.18, R * 0.12, 0, Math.PI * 2);
  const em = ctx.createRadialGradient(R * 0.82, -R * 0.18, 0, R * 0.82, -R * 0.18, R * 0.12);
  em.addColorStop(0, 'rgba(255,220,120,0.95)');
  em.addColorStop(1, 'rgba(255,100,0,0.0)');
  ctx.fillStyle = em;
  ctx.fill();
}

function drawTitanHub(R) {
  // Black crater rim
  const rim = ctx.createRadialGradient(-R * 0.14, -R * 0.14, 0, 0, 0, R * 0.64);
  rim.addColorStop(0,    '#4a1800');
  rim.addColorStop(0.45, '#1a0500');
  rim.addColorStop(1,    '#000000');
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2);
  ctx.fillStyle   = rim;
  ctx.shadowBlur  = 18;
  ctx.shadowColor = '#ff6600';
  ctx.fill();

  // Molten core
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.40);
  core.addColorStop(0,    '#ffffcc');
  core.addColorStop(0.25, '#ffbb33');
  core.addColorStop(0.70, '#ff4400');
  core.addColorStop(1,    '#440800');
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.40, 0, Math.PI * 2);
  ctx.fillStyle   = core;
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#ffaa00';
  ctx.fill();

  // Counter-rotating molten ring detail (static — spin is on the blade layer)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,180,60,0.55)';
  ctx.lineWidth   = 1.0;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.52, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawAbyssBlade(R) {
  // Serpentine tentacle: sinuous double-S curve tapering outward
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(R * 0.30, -R * 0.42, R * 0.62, -R * 0.32, R * 0.78, -R * 0.02);
  ctx.bezierCurveTo(R * 0.92,  R * 0.24, R * 1.18,  R * 0.22, R * 1.32,  R * 0.00);
  ctx.bezierCurveTo(R * 1.22, -R * 0.16, R * 1.10, -R * 0.10, R * 1.00,  R * 0.06);
  ctx.bezierCurveTo(R * 0.86,  R * 0.26, R * 0.60,  R * 0.36, R * 0.30,  R * 0.16);
  ctx.bezierCurveTo(R * 0.12,  R * 0.08, R * 0.04,  R * 0.04, 0, 0);
  ctx.closePath();

  // Deep indigo body with cyan bioluminescent edge
  const body = ctx.createLinearGradient(0, -R * 0.3, R * 1.3, R * 0.3);
  body.addColorStop(0,    '#0a0220');
  body.addColorStop(0.5,  '#1a0840');
  body.addColorStop(1,    '#2a1060');
  ctx.fillStyle   = body;
  ctx.shadowBlur  = 12;
  ctx.shadowColor = '#00ddff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,221,255,0.75)';
  ctx.lineWidth   = 1.0;
  ctx.stroke();

  // Bioluminescent suction-cup dots trailing along the tentacle
  ctx.save();
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#00ddff';
  const dots = [
    [0.32, -0.12, 0.08], [0.58, -0.04, 0.09], [0.82,  0.06, 0.08],
    [1.04, -0.02, 0.07], [1.20, -0.04, 0.06],
  ];
  for (const [dx, dy, r] of dots) {
    ctx.beginPath();
    ctx.arc(R * dx, R * dy, R * r, 0, Math.PI * 2);
    const d = ctx.createRadialGradient(R * dx, R * dy, 0, R * dx, R * dy, R * r);
    d.addColorStop(0,   '#ccffff');
    d.addColorStop(0.5, '#00ddff');
    d.addColorStop(1,   'rgba(0,80,140,0)');
    ctx.fillStyle = d;
    ctx.fill();
  }
  ctx.restore();
}

function drawAbyssHub(R) {
  // Dark indigo outer ring
  const ring = ctx.createRadialGradient(-R * 0.1, -R * 0.1, 0, 0, 0, R * 0.60);
  ring.addColorStop(0,    '#3a1870');
  ring.addColorStop(0.5,  '#150540');
  ring.addColorStop(1,    '#000000');
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.60, 0, Math.PI * 2);
  ctx.fillStyle   = ring;
  ctx.shadowBlur  = 18;
  ctx.shadowColor = '#00ddff';
  ctx.fill();

  // Counter-rotating iris so the eye tracks independently of the spin
  ctx.save();
  ctx.rotate(-Date.now() * 0.0012);

  // Vertical eye-slit — sclera
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.42, R * 0.22, Math.PI / 2, 0, Math.PI * 2);
  const sc = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
  sc.addColorStop(0,   '#e8f8ff');
  sc.addColorStop(0.7, '#88cce0');
  sc.addColorStop(1,   '#224455');
  ctx.fillStyle = sc;
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#00ddff';
  ctx.fill();

  // Vertical slit pupil
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.10, R * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#020008';
  ctx.shadowBlur = 0;
  ctx.fill();

  // Cyan highlight glint
  ctx.beginPath();
  ctx.arc(R * 0.04, -R * 0.14, R * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,255,255,0.95)';
  ctx.fill();
  ctx.restore();
}

function drawLavaPools() {
  if (!G.lavaPools || !G.lavaPools.length) return;
  ctx.save();
  G.lavaPools.forEach(p => {
    const frac = Math.max(0, p.life / p.maxLife);
    const a    = 0.25 + 0.55 * frac;
    // Glow halo
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.8);
    halo.addColorStop(0,    `rgba(255,150,30,${a * 0.55})`);
    halo.addColorStop(0.55, `rgba(255,80,0,${a * 0.25})`);
    halo.addColorStop(1,    'rgba(255,40,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.8, 0, Math.PI * 2); ctx.fill();

    // Magma pool
    const pool = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    pool.addColorStop(0,    `rgba(255,230,140,${a})`);
    pool.addColorStop(0.35, `rgba(255,120,30,${a})`);
    pool.addColorStop(0.85, `rgba(200,50,0,${a * 0.9})`);
    pool.addColorStop(1,    'rgba(60,10,0,0)');
    ctx.fillStyle = pool;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();

    // Cracked obsidian edge
    ctx.strokeStyle = `rgba(40,10,0,${Math.min(1, a * 1.6)})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.92, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();
}

function drawBladeShape(shape, R, color) {
  ctx.beginPath();
  if (shape === 'wing') {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.35, -R * 0.32, R * 1.05, -R * 0.16, R * 1.22, R * 0.08);
    ctx.bezierCurveTo(R * 0.98,  R * 0.38, R * 0.28,  R * 0.22, 0, 0);
  } else if (shape === 'horn') {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.28, -R * 0.42, R * 0.88, -R * 0.52, R * 1.32, 0);
    ctx.bezierCurveTo(R * 0.88,  R * 0.12, R * 0.22,  R * 0.16, 0, 0);
  } else if (shape === 'claw') {
    ctx.moveTo(0, 0);
    ctx.lineTo(R * 0.55, -R * 0.52);
    ctx.lineTo(R * 1.12, -R * 0.18);
    ctx.lineTo(R * 0.88,  R * 0.22);
    ctx.lineTo(R * 0.28,  R * 0.10);
    ctx.closePath();
  } else { // fang
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.48, -R * 0.6, R * 1.38, -R * 0.28, R * 1.22, R * 0.22);
    ctx.bezierCurveTo(R * 0.92,  R * 0.42, R * 0.2,   R * 0.2,  0, 0);
  }

  const gr = ctx.createLinearGradient(0, 0, R * 1.2, 0);
  gr.addColorStop(0,   color + 'dd');
  gr.addColorStop(0.5, color + 'ff');
  gr.addColorStop(1,   color + '33');
  ctx.fillStyle   = gr;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth   = 0.8;
  ctx.fill();
  ctx.stroke();
}

function hexAlpha(hex, alpha) {
  // Convert hex color + alpha to rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

function drawAimGuide() {
  if (!G.aiming) return;
  const player = G.blades[0];
  if (!player || player.launched) return;

  const dx   = player.x - G.aimX;
  const dy   = player.y - G.aimY;
  const dist = Math.hypot(dx, dy);
  const pFrac = Math.min(dist, MAX_POWER * 10) / (MAX_POWER * 10);

  // Slingshot band
  ctx.save();
  ctx.strokeStyle = 'rgba(0,212,255,0.5)';
  ctx.lineWidth   = 2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(G.aimX, G.aimY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Launch arrow
  const launchA  = Math.atan2(dy, dx);
  const arrowLen = 44 + pFrac * 72;
  const ex = player.x + Math.cos(launchA) * arrowLen;
  const ey = player.y + Math.sin(launchA) * arrowLen;

  const col = pFrac < 0.45 ? '#00ff88' : pFrac < 0.8 ? '#ffcc00' : '#ff4444';
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth   = 2.8;
  ctx.shadowBlur  = 12;
  ctx.shadowColor = col;
  ctx.lineCap = 'round';

  ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(ex, ey); ctx.stroke();

  const hl = 13;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - hl * Math.cos(launchA - 0.42), ey - hl * Math.sin(launchA - 0.42));
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - hl * Math.cos(launchA + 0.42), ey - hl * Math.sin(launchA + 0.42));
  ctx.stroke();

  // Power label
  ctx.font      = `bold 11px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = col;
  ctx.shadowBlur = 6;
  ctx.fillText(`PWR ${Math.round(pFrac * 100)}%`, G.aimX, G.aimY - 18);
  ctx.restore();
}

function drawLaunchPad(player) {
  if (!player || G.state !== 'ready') return;
  ctx.save();
  ctx.strokeStyle = hexAlpha(player.color, 0.5);
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 7]);
  ctx.shadowBlur  = 10;
  ctx.shadowColor = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCountdown() {
  if (G.state !== 'countdown') return;
  const t   = G.countdown;
  const num = Math.ceil(t);
  // Pulse scale: 1 → 0.7 over each second
  const phase = t % 1;
  const scale = 0.72 + phase * 0.28;
  const sz    = Math.floor(110 * scale);

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  if (t > 0.05) {
    ctx.font        = `900 ${sz}px 'Orbitron', monospace`;
    ctx.fillStyle   = num === 1 ? '#ff4422' : num === 2 ? '#ffcc00' : '#ffffff';
    ctx.shadowBlur  = 50;
    ctx.shadowColor = ctx.fillStyle;
    ctx.globalAlpha = 0.9;
    ctx.fillText(String(num), canvas.width / 2, canvas.height / 2);
  } else {
    // GO!
    const goAlpha = Math.min(1, (0.5 - t) * 6);
    ctx.font        = `900 ${Math.floor(120 + goAlpha * 20)}px 'Orbitron', monospace`;
    ctx.fillStyle   = '#00ff88';
    ctx.shadowBlur  = 60;
    ctx.shadowColor = '#00ff88';
    ctx.globalAlpha = Math.max(0, 1 - goAlpha * 2);
    ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
  }

  // Hint below
  ctx.font        = `bold 11px 'Share Tech Mono', monospace`;
  ctx.fillStyle   = '#556';
  ctx.shadowBlur  = 0;
  ctx.globalAlpha = 0.8;
  ctx.fillText('DRAG TO AIM YOUR BLADE', canvas.width / 2, canvas.height / 2 + 80);
  ctx.restore();
}

// Shrinking arena warning ring
function drawShrinkWarning() {
  if (G.activeTime < 15 || G.arenaRCurrent <= G.arenaR * 0.61) return;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
  const ratio = 1 - (G.arenaRCurrent - G.arenaR * 0.60) / (G.arenaR * 0.40);
  ctx.save();
  ctx.strokeStyle = `rgba(255,80,0,${0.4 + pulse * 0.5})`;
  ctx.lineWidth   = 3 + ratio * 4;
  ctx.shadowBlur  = 20 + ratio * 20;
  ctx.shadowColor = '#ff4400';
  ctx.beginPath();
  ctx.arc(G.arenaX, G.arenaY, G.arenaRCurrent, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBoostIndicator() {
  if (G.state !== 'active') return;
  const player = G.blades.find(b => b.isPlayer && b.alive);
  if (!player) return;
  const R     = player.radius + 9;
  const ready = G.boostCooldown <= 0;
  const pct   = ready ? 1 : 1 - (G.boostCooldown / BOOST_COOLDOWN);
  ctx.save();
  // Dim track ring
  ctx.beginPath();
  ctx.arc(player.x, player.y, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Charging arc
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, R, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = ready ? player.color : '#4488aa';
    ctx.lineWidth   = 2.5;
    ctx.shadowBlur  = ready ? 10 : 0;
    ctx.shadowColor = player.color;
    ctx.stroke();
  }
  // "BOOST" label when ready
  if (ready) {
    ctx.font        = `bold 7px 'Share Tech Mono', monospace`;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = player.color;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = player.color;
    ctx.globalAlpha = 0.85;
    ctx.fillText('BOOST', player.x, player.y + R + 10);
  }
  ctx.restore();
}

function drawSpecialIndicator() {
  if (G.state !== 'active') return;
  const player = G.blades.find(b => b.isPlayer && b.alive);
  if (!player || !player.special) return;

  const R       = player.radius + 22;    // outer ring, outside the boost ring
  const ready   = player.specialCooldown <= 0 && player.chargeProgress === 0;
  const charging = player.chargeProgress > 0;
  const onCooldown = player.specialCooldown > 0;

  ctx.save();

  // Dim track ring
  ctx.beginPath();
  ctx.arc(player.x, player.y, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (onCooldown && !charging) {
    // Cooldown refill arc (dim color filling up)
    const pct = 1 - player.specialCooldown / SPECIAL_COOLDOWN;
    ctx.beginPath();
    ctx.arc(player.x, player.y, R, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,180,220,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (ready) {
    // "SPECIAL" label
    ctx.font        = `bold 7px 'Share Tech Mono', monospace`;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = player.glow;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = player.glow;
    ctx.globalAlpha = 0.9;
    ctx.fillText('HOLD', player.x, player.y + R + 10);
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  ctx.save();
  ctx.translate(G.shakeX, G.shakeY);

  drawArena();
  drawShrinkWarning();
  drawLavaPools();
  G.parts.forEach(p => p.draw());
  G.blades.forEach(b => drawBlade(b));
  drawLaunchPad(G.blades[0]);
  drawAimGuide();
  drawBoostIndicator();
  drawSpecialIndicator();
  drawCountdown();

  // ── POWER CLASH overlay ──
  if (G.clashTimer > 0 && G.clashAlpha > 0) {
    const a = G.clashAlpha;
    // Flash ring at impact point
    ctx.save();
    ctx.globalAlpha = a * 0.7;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#ffff88';
    ctx.beginPath();
    ctx.arc(G.clashX, G.clashY, 28 + (1 - a) * 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // POWER CLASH text
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * 2);
    ctx.font        = `900 ${Math.floor(22 + a * 10)}px 'Orbitron', monospace`;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#ffff44';
    ctx.shadowBlur  = 25;
    ctx.shadowColor = '#ffaa00';
    ctx.fillText('POWER CLASH!', G.clashX, G.clashY - 44 - (1 - a) * 20);
    ctx.restore();
  }

  // ── BURST FINISHER cinematic overlay ──
  if (G.finisher) {
    const b = G.finisher.blade;
    if (b && b.alive) {
      // Expanding shockwave ring
      const phase = 1 - Math.max(0, G.finisher.t) / G.finisher.max;
      const ringR = 30 + phase * 260;
      const ringA = Math.max(0, 1 - phase) * 0.9;
      ctx.save();
      ctx.globalAlpha = ringA;
      ctx.strokeStyle = b.glow;
      ctx.lineWidth   = 5;
      ctx.shadowBlur  = 40;
      ctx.shadowColor = b.glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();

  // ── FINISHER full-screen flash (above shake transform) ──
  if (G.finisher && G.finisher.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.finisher.flash / 0.25) * 0.55;
    ctx.fillStyle   = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // ── BURST events rendered in screen space ──
  G.popups = (G.popups || []).filter(p => p.timer > 0);
  G.popups.forEach(p => {
    p.timer -= 0.016;
    const a = Math.min(1, p.timer * 3);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font        = `900 ${Math.floor(18 + (1 - a) * 8)}px 'Orbitron', monospace`;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = p.color;
    ctx.shadowBlur  = 20;
    ctx.shadowColor = p.color;
    ctx.fillText(p.text, p.x, p.y - (1 - p.timer / p.maxTimer) * 50);
    ctx.restore();
  });
}

