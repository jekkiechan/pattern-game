// Rendering caches and accessible controls. No network or runtime dependencies.
let arenaTexture = null;
let arenaTextureKey = '';
function drawCachedArena() {
  const key = `${G.selectedArena}:${G.arenaR}:${G.dpr}`;
  if (key !== arenaTextureKey) {
    const previous = ctx;
    const ax = G.arenaX, ay = G.arenaY, radius = G.arenaRCurrent;
    const size = Math.ceil(G.arenaR * 2.7 + 40);
    arenaTexture = document.createElement('canvas');
    arenaTexture.width = arenaTexture.height = Math.ceil(size * G.dpr);
    ctx = arenaTexture.getContext('2d');
    ctx.scale(G.dpr, G.dpr);
    G.arenaX = G.arenaY = size / 2; G.arenaRCurrent = G.arenaR;
    drawArena();
    G.arenaX = ax; G.arenaY = ay; G.arenaRCurrent = radius;
    ctx = previous; arenaTextureKey = key;
  }
  const ratio = G.arenaRCurrent / G.arenaR;
  const size = arenaTexture.width / G.dpr * ratio;
  ctx.drawImage(arenaTexture, G.arenaX-size/2, G.arenaY-size/2, size, size);
}
function cancelInput() {
  G.aiming = false; G.pressIsCharging = false; G.pointerId = null;
  if (G.blades[0]) G.blades[0].chargeProgress = 0;
}
function setPaused(paused) {
  if (!['ready','active'].includes(G.state)) return;
  G.paused = paused; cancelInput(); physAcc = 0;
  G.lastTime = performance.now(); G.sceneDirty = true;
  document.getElementById('pause-panel').hidden = !paused;
  document.getElementById('btn-pause').textContent = paused ? 'Resume' : 'Pause';
  if (paused) document.getElementById('btn-resume').focus();
}
function launchButton() {
  if (G.state !== 'ready' || G.paused) return;
  audio();
  const b = G.blades[0];
  G.playerLaunchDx = G.arenaX-b.x; G.playerLaunchDy = G.arenaY-b.y;
  G.playerLaunchDist = Math.hypot(G.playerLaunchDx,G.playerLaunchDy);
  launchAll(); G.state = 'active';
  document.getElementById('launch-hint').style.display = 'none'; refreshControls();
}
function refreshControls() {
  const b = G.blades[0]; if (!b) return;
  const launch = document.getElementById('btn-launch');
  launch.hidden = G.state !== 'ready';
  const dash = document.getElementById('btn-dash');
  const special = document.getElementById('btn-special');
  dash.hidden = special.hidden = G.state !== 'active';
  dash.disabled = !b.alive || G.boostCooldown > 0;
  dash.textContent = G.boostCooldown > 0 ? `Dash · ${G.boostCooldown.toFixed(1)}s` : 'Dash [D]';
  special.disabled = !b.alive || b.specialCooldown > 0;
  special.textContent = b.specialCooldown > 0 ? `Special · ${Math.ceil(b.specialCooldown)}s` :
    b.chargeProgress >= 1 ? 'Release! ✦' : b.chargeProgress > 0 ? `Charging ${Math.round(b.chargeProgress*100)}%` : 'Hold special [Space]';
  special.style.setProperty('--charge', `${b.chargeProgress * 100}%`);
  const message = G.state === 'ready' ? 'Drag your blade back, or press Launch.' :
    !b.alive ? 'Your blade spun out. Watch who wins!' : G.activeTime > 15 ? 'Arena closing! Dash away from the edge.' :
    ARENAS[G.selectedArena].rail ? 'Dash near the rim for a Rail Rush.' : 'Tap the arena to dash. Hold, then release for your special.';
  document.getElementById('battle-tip').textContent = message;
}
function dashButton() {
  const b = G.blades[0];
  if (G.state !== 'active' || G.paused || !b?.alive || G.boostCooldown > 0) return;
  const foe = nearestAlive(b);
  doBoost(b, G.target || (foe ? {x:foe.x,y:foe.y} : {x:G.arenaX,y:G.arenaY}));
  refreshControls();
}
function chargeSpecial() {
  const b = G.blades[0];
  if (G.state === 'active' && !G.paused && b?.alive && b.specialCooldown <= 0) G.pressIsCharging = true;
}
function releaseSpecial() {
  const b = G.blades[0];
  if (G.state === 'active' && !G.paused && b?.alive && G.pressIsCharging && b.chargeProgress >= 1 && b.specialCooldown <= 0) activateSpecial(b);
  G.pressIsCharging = false;
  if (b) b.chargeProgress = 0;
  refreshControls();
}
function paintHero() {
  const el = document.getElementById('hero-art');
  const pc = el.getContext('2d');
  const W=el.width,H=el.height;pc.clearRect(0,0,W,H);
  pc.save();pc.translate(W/2,H/2);
  for(let i=0;i<4;i++) {
    pc.beginPath();pc.ellipse(0,45,245-i*40,155-i*25,-.25,0,Math.PI*2);
    pc.strokeStyle=i===0?'#4a7189':'#263f58';pc.lineWidth=i===0?12:2;pc.stroke();
  }
  pc.restore();
  const blades = [{i:2,x:438,y:140,s:210,a:.4},{i:0,x:245,y:260,s:360,a:-.25},{i:31,x:465,y:365,s:205,a:.2}];
  blades.forEach(({i,x,y,s,a})=>{pc.save();pc.translate(x,y);pc.rotate(a);pc.shadowBlur=28;pc.shadowColor=CONFIGS[i].glow;pc.drawImage(bladeSprite(CONFIGS[i]),-s/2,-s/2,s,s);pc.restore();});
}
function initExperience() {
  G.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { const settings=JSON.parse(localStorage.getItem('patternSettings')||'{}');
    soundEnabled = settings.sound !== false;
    if (typeof settings.motion === 'boolean') G.reducedMotion=settings.motion;
  } catch {}
  const save = () => {try{localStorage.setItem('patternSettings',JSON.stringify({sound:soundEnabled,motion:G.reducedMotion}));}catch{}};
  const sound = document.getElementById('btn-sound');
  const motion = document.getElementById('btn-motion');
  const labels=()=>{sound.textContent=soundEnabled?'Sound on':'Sound off';sound.setAttribute('aria-pressed',soundEnabled);motion.textContent=G.reducedMotion?'Motion low':'Motion full';motion.setAttribute('aria-pressed',G.reducedMotion);document.body.classList.toggle('reduce-motion',G.reducedMotion);};
  sound.onclick=()=>{soundEnabled=!soundEnabled;audio();masterGain.gain.value=soundEnabled?.45:0;labels();save();};
  motion.onclick=()=>{G.reducedMotion=!G.reducedMotion;labels();save();};labels();
  document.getElementById('btn-pause').onclick=()=>setPaused(!G.paused);
  document.getElementById('btn-resume').onclick=()=>setPaused(false);
  document.getElementById('btn-exit').onclick=()=>{tExit();showScreen('screen-start');};
  document.getElementById('btn-launch').onclick=launchButton;
  document.getElementById('btn-dash').onclick=dashButton;
  const special=document.getElementById('btn-special');
  special.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();special.setPointerCapture(e.pointerId);chargeSpecial();});
  special.addEventListener('pointerup',releaseSpecial);
  special.addEventListener('pointercancel',cancelInput);
  special.addEventListener('lostpointercapture',cancelInput);
  document.addEventListener('keydown',e=>{
    if (!['ready','active'].includes(G.state) || e.repeat) return;
    if (e.code==='Escape' || e.code==='KeyP') {e.preventDefault();setPaused(!G.paused);}
    if (G.paused) return;
    if (e.code==='Space') {e.preventDefault();G.state==='ready'?launchButton():chargeSpecial();}
    if (e.code==='KeyD') {e.preventDefault();dashButton();}
  });
  document.addEventListener('keyup',e=>{if(e.code==='Space')releaseSpecial();});
  window.addEventListener('blur',()=>setPaused(true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true);G.lastTime=performance.now();physAcc=0;});
  document.getElementById('btn-instant').onclick=()=>{
    audio();G.mode='single';G.tournament=null;G.selectedChar=0;G.selectedArena=0;
    G.selectedOpponents=[3,5,9];showScreen(null);startRound();
  };
  document.getElementById('roster-count').textContent=CONFIGS.length;
  paintHero();
}
