import {SPECIALS} from './roster.js';

const TAU = Math.PI * 2;
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const SYMBOLS = {rush:'➤', wave:'◎', guard:'⬡', mend:'✦', drain:'↝', counter:'◇'};
const tint = hex => '#' + hex.slice(1).match(/../g).map(channel => {
 const n = parseInt(channel, 16);
 return Math.round(n + (255-n)*.3).toString(16).padStart(2, '0');
}).join('');

// One bounded, projected effects layer serves both WebGL and Canvas battles.
// Its clock advances with the battle frame, so pause freezes the entire move.
export class SpecialEffects {
 constructor(parent, display, options) {
  this.display = display;
  this.options = options;
  this.canvas = document.createElement('canvas');
  this.canvas.id = 'special-effects';
  this.canvas.setAttribute('aria-hidden', 'true');
  this.ctx = this.canvas.getContext('2d');
  parent.append(this.canvas);
  this.callouts = [0, 1].map(i => {
   const el = document.createElement('div');
   el.className = `special-callout ${i ? 'rival' : 'player'}`;
   el.setAttribute('role', 'status');
   el.setAttribute('aria-atomic', 'true');
   el.innerHTML = '<span class="special-crest" aria-hidden="true"></span><div><small></small><strong></strong><span class="special-kind"></span></div><i aria-hidden="true"></i>';
   parent.append(el);
   return el;
  });
  this.clear();
 }

 clear() {
  this.active = [null, null];
  this.impacts = [];
  this.callouts.forEach(el => { el.hidden = true; });
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
 }

 battle(match) { this.clear(); this.match = match; }

 event(e) {
  if (e.type === 'finish') {
   this.active = [null, null];
   this.callouts.forEach(el => { el.hidden = true; });
   return; // Let a finishing hit's burst fade out behind the victory message.
  }
  if (e.type === 'special') {
   const blade = this.match.blades[e.i];
   this.active[e.i] = {
    kind:e.kind, age:0, duration:Math.max(1.35, SPECIALS[e.kind].duration),
    x:blade.x, z:blade.z, color:tint(blade.cfg.accent), trail:[], sample:0
   };
   const el = this.callouts[e.i];
   el.dataset.kind = e.kind;
   el.style.setProperty('--special-color', this.active[e.i].color);
   el.querySelector('.special-crest').textContent = SYMBOLS[e.kind];
   el.querySelector('small').textContent = e.i ? 'RIVAL · SPECIAL MOVE' : 'YOU · SPECIAL MOVE';
   el.querySelector('strong').textContent = e.name;
   el.querySelector('.special-kind').textContent = SPECIALS[e.kind].label;
   el.hidden = false;
  }
  if (e.type === 'special-impact' && this.options.motion) {
   this.impacts.push({...e, age:0, color:tint(this.match.blades[e.i].cfg.accent)});
   if (this.impacts.length > 12) this.impacts.shift();
  }
 }

 // Project at the same height as the arena objects, including elevated arcs.
 point(x, z, height = .15) { return this.display.project(x, z, height); }

 path(points, color, width = 2, opacity = 1, close = false, fill = false) {
  const c = this.ctx;
  c.beginPath();
  points.forEach((p, i) => { const v = this.point(...p); i ? c.lineTo(v.x, v.y) : c.moveTo(v.x, v.y); });
  if (close) c.closePath();
  c.globalAlpha = clamp(opacity);
  c.strokeStyle = c.fillStyle = color;
  c.lineWidth = width;
  fill ? c.fill() : c.stroke();
 }

 ring(x, z, radius, color, opacity, height = .12, start = 0, sweep = TAU, width = 2) {
  const count = this.options.low ? 24 : 40;
  const points = [];
  for (let j = 0; j <= count; j++) {
   const a = start + sweep * j / count;
   points.push([x + Math.cos(a) * radius, z + Math.sin(a) * radius, height]);
  }
  this.path(points, color, width, opacity);
 }

 mote(x, z, height, size, color, opacity = 1) {
  const c = this.ctx, p = this.point(x, z, height);
  c.globalAlpha = clamp(opacity); c.fillStyle = color;
  c.beginPath(); c.arc(p.x, p.y, size, 0, TAU); c.fill();
 }

 glow(b, radius, color, opacity) {
  const c = this.ctx, p = this.point(b.x, b.z, .4);
  const edge = this.point(b.x + radius, b.z, .4);
  const r = Math.max(1, Math.abs(edge.x - p.x));
  const g = c.createRadialGradient(p.x, p.y, r * .15, p.x, p.y, r);
  g.addColorStop(0, color); g.addColorStop(1, color + '00');
  c.globalAlpha = opacity; c.fillStyle = g;
  c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
 }

 render(dt) {
  const c = this.ctx, {width, height} = this.display;
  const ratio = Math.min(devicePixelRatio, this.options.low ? 1 : 1.7);
  if (this.width !== width || this.height !== height || this.ratio !== ratio) {
   this.width = width; this.height = height; this.ratio = ratio;
   this.canvas.width = Math.max(1, Math.round(width * ratio));
   this.canvas.height = Math.max(1, Math.round(height * ratio));
   c.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  c.clearRect(0, 0, width, height);
  c.lineCap = c.lineJoin = 'round';
  const motion = this.options.motion;
  if (!motion) this.impacts.length = 0;
  this.active.forEach((s, i) => {
   if (!s) return;
   s.age += dt;
   const el = this.callouts[i], b = this.match.blades[i], foe = this.match.blades[1-i];
   const bannerLife = clamp((1.35 - s.age) / .22);
   el.hidden = s.age >= 1.35;
   el.style.opacity = motion ? bannerLife : 1;
   el.style.transform = motion ? `translateX(${(i ? 1 : -1) * 18 * (1-clamp(s.age/.16))}px)` : 'none';
   el.querySelector('i').style.transform = `scaleX(${clamp(1-s.age/1.35)})`;
   if (s.age >= s.duration) { this.active[i] = null; return; }
   const fade = clamp((s.duration - s.age) / .25);
   if (!motion) {
    // Keep readable move identity without pulses, travel, flashes or trails.
    s.trail.length = 0;
    this.ring(b.x, b.z, 1.12, s.color, .8);
    const p = this.point(b.x, b.z, 1.45);
    c.globalAlpha = 1; c.fillStyle = s.color; c.font = 'bold 18px sans-serif';
    c.textAlign = 'center'; c.fillText(SYMBOLS[s.kind], p.x, p.y);
    return;
   }
   this.glow(b, 1.9, s.color, .16 * fade);
   // The initial crown contracts into the blade as the move powers up.
   if (s.age < .32) {
    const t = s.age / .32;
    this.ring(b.x, b.z, 1.9 - t, s.color, (1-t)*.8, .18, 0, TAU, 3);
    const rays = this.options.low ? 6 : 10;
    for (let j = 0; j < rays; j++) {
     const a = j * TAU/rays + t*.4, r = 2.2-t;
     this.path([[b.x+Math.cos(a)*r,b.z+Math.sin(a)*r,.3],[b.x+Math.cos(a)*(r+.4),b.z+Math.sin(a)*(r+.4),.6]],s.color,2,(1-t)*.65);
    }
   }
   this[s.kind](s, b, foe, fade, dt);
  });
  this.impacts = this.impacts.filter(hit => {
   hit.age += dt;
   if (hit.age >= .5) return false;
   const t = hit.age/.5, strength = hit.blocked ? .55 : 1;
   this.ring(hit.x, hit.z, .3+t*2.6*strength, hit.color, (1-t)*.9, .25, 0, TAU, 4*(1-t)+1);
   const count = this.options.low ? 8 : 14;
   for (let j = 0; j < count; j++) {
    const a = j*TAU/count, r = .3+t*2.1*strength;
    this.path([[hit.x+Math.cos(a)*r,hit.z+Math.sin(a)*r,.5+Math.sin(t*Math.PI)*.5],
     [hit.x+Math.cos(a)*(r+.3),hit.z+Math.sin(a)*(r+.3),.55+Math.sin(t*Math.PI)*.7]],j%3?'#fff3cf':hit.color,2.5,(1-t)*strength);
   }
   return true;
  });
  c.globalAlpha = 1;
 }

 rush(s, b, foe, fade, dt) {
  s.sample += dt;
  if (s.sample >= 1/60) {
   s.trail.unshift([b.x, b.z, .38]);
   s.trail.length = Math.min(s.trail.length, this.options.low ? 10 : 20);
   s.sample %= 1/60;
  }
  for (let j = 1; j < s.trail.length; j++) {
   const tail = (1-j/s.trail.length)*fade;
   this.path([s.trail[j-1],s.trail[j]],s.color,14*tail,tail*.65);
   this.path([s.trail[j-1],s.trail[j]],'#fff6dc',3*tail,tail);
  }
  const a = Math.atan2(b.vz,b.vx);
  for (let j = -1; j <= 1; j++) {
   const angle = a+j*.4, r = 1.25;
   this.path([[b.x+Math.cos(angle)*r,b.z+Math.sin(angle)*r,.4],[b.x-Math.cos(a)*.3+Math.cos(angle)*.6,b.z-Math.sin(a)*.3+Math.sin(angle)*.6,.65]],s.color,3,fade*.85);
  }
  this.ring(b.x,b.z,1.05,s.color,fade,.3,s.age*10,Math.PI*1.3,3);
 }

 wave(s, b, foe, fade) {
  for (let j = 0; j < 3; j++) {
   const t = clamp((s.age-j*.1)/.75);
   if (t <= 0 || t >= 1) continue;
   this.ring(s.x,s.z,.9+t*6,s.color,(1-t)*.8,.1,0,TAU,5*(1-t)+1);
   this.ring(s.x,s.z,.7+t*6,'#e9faff',(1-t)*.45,.16,0,TAU,1.5);
  }
 }

 guard(s, b, foe, fade) {
  const c = this.ctx, p = this.point(b.x,b.z,.65);
  const edge = this.point(b.x+1.25,b.z,.65), r = Math.max(1,Math.abs(edge.x-p.x));
  const g = c.createRadialGradient(p.x-r*.3,p.y-r*.3,0,p.x,p.y,r);
  g.addColorStop(0,'#e0faff00'); g.addColorStop(.72,s.color+'12'); g.addColorStop(1,s.color+'70');
  c.globalAlpha = fade; c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x,p.y,r,r*.86,0,0,TAU); c.fill();
  c.strokeStyle = s.color; c.lineWidth = 2; c.globalAlpha = .75*fade; c.stroke();
  for (let j = 0; j < 3; j++) this.ring(b.x,b.z,1.15,s.color,fade*.55,.15+j*.4,s.age*.5+j,Math.PI*1.5,1.5);
  // Hexagonal seal makes the shield distinct from a normal guard ring.
  const seal = [];
  for (let j = 0; j < 6; j++) seal.push([b.x+Math.cos(j*TAU/6)*1.35,b.z+Math.sin(j*TAU/6)*1.35,.15]);
  this.path(seal,s.color,2,fade*.85,true);
 }

 mend(s, b, foe, fade) {
  for (let arm = 0; arm < 2; arm++) {
   const points = [];
   for (let j = 0; j < 26; j++) {
    const t = j/25, a = t*TAU+s.age*5+arm*Math.PI;
    points.push([b.x+Math.cos(a)*(1.2-t*.5),b.z+Math.sin(a)*(1.2-t*.5),.15+t*2]);
   }
   this.path(points,arm?s.color:'#a4ffcd',2,fade*.65);
  }
  const count = this.options.low ? 5 : 9;
  for (let j = 0; j < count; j++) {
   const t = (s.age*.8+j/count)%1, a = j*2.4;
   const p = this.point(b.x+Math.cos(a)*1.05,b.z+Math.sin(a)*1.05,.3+t*2);
   const c = this.ctx, size = 3+Math.sin(t*Math.PI)*2;
   c.globalAlpha = Math.sin(t*Math.PI)*fade; c.strokeStyle = '#baffd4'; c.lineWidth = 2;
   c.beginPath(); c.moveTo(p.x-size,p.y); c.lineTo(p.x+size,p.y); c.moveTo(p.x,p.y-size); c.lineTo(p.x,p.y+size); c.stroke();
  }
  this.ring(b.x,b.z,1.3,'#a4ffcd',fade*.6);
 }

 drain(s, b, foe, fade) {
  const length = Math.hypot(foe.x-b.x,foe.z-b.z)||1;
  const nx = -(foe.z-b.z)/length, nz = (foe.x-b.x)/length;
  for (let strand = -1; strand <= 1; strand += 2) {
   const points = [];
   for (let j = 0; j <= 28; j++) {
    const t = j/28, arc = Math.sin(t*Math.PI)*strand*.65;
    points.push([foe.x+(b.x-foe.x)*t+nx*arc,foe.z+(b.z-foe.z)*t+nz*arc,.4+Math.sin(t*Math.PI)*.8]);
   }
   this.path(points,s.color,this.options.low?2:3,fade*.65);
   for (let j = 0; j < (this.options.low?3:6); j++) {
    const t = (s.age*1.6+j/6)%1, arc = Math.sin(t*Math.PI)*strand*.65;
    this.mote(foe.x+(b.x-foe.x)*t+nx*arc,foe.z+(b.z-foe.z)*t+nz*arc,.4+Math.sin(t*Math.PI)*.8,3,'#ebffed',fade);
   }
  }
  this.ring(foe.x,foe.z,1.1,s.color,fade*.6,.2,-s.age*5,Math.PI*1.5);
  this.ring(b.x,b.z,1.25,s.color,fade*.9,.2,s.age*5,Math.PI*1.5,3);
 }

 counter(s, b, foe, fade) {
  for (let j = 0; j < 4; j++) {
   const a = s.age*2.5+j*TAU/4, r = 1.35, x = b.x+Math.cos(a)*r, z = b.z+Math.sin(a)*r;
   const dx = Math.cos(a), dz = Math.sin(a);
   const shape = [[x+dx*.4,z+dz*.4,.35],[x-dz*.18,z+dx*.18,.7],[x-dx*.3,z-dz*.3,.35],[x+dz*.18,z-dx*.18,.2]];
   this.path(shape,s.color,2,fade*.28,true,true);
   this.path(shape,'#fff0ba',2,fade*.9,true);
   this.ring(b.x,b.z,r,s.color,fade*.65,.28,a-.5,.38,2);
  }
 }
}
