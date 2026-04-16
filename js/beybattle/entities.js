// ═══════════════════════════════════════════════════════════
// PARTICLE
// ═══════════════════════════════════════════════════════════
class Particle {
  constructor(x, y, color, vx, vy, size, life) {
    Object.assign(this, { x, y, color, vx, vy, size, life, maxLife: life });
  }
  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.life -= dt;
  }
  draw() {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha    = a;
    ctx.fillStyle      = this.color;
    ctx.shadowBlur     = 8;
    ctx.shadowColor    = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (0.4 + a * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
// BEYBLADE
// ═══════════════════════════════════════════════════════════
class Beyblade {
  constructor(cfg, x, y) {
    Object.assign(this, cfg);
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.angle       = Math.random() * Math.PI * 2;
    this.spinRate     = 13 + Math.random() * 7;
    this.stamina      = this.maxStamina;
    this.burstHealth  = 100;           // burst meter, separate from stamina
    this.radius       = BLADE_R;
    this.alive        = true;
    this.bursting     = false;         // mid-burst-death animation
    this.launched     = !this.isPlayer;
    this.wobble       = 0;
    this.wobbleP      = 0;
    this.dying        = 0;
    this.flash        = 0;
    this.aiTimer      = Math.random() * AI_INTERVAL;
    this.trail        = [];            // motion trail positions
    // Special move state
    this.chargeProgress  = 0;          // 0-1 charge amount
    this.isCharging      = false;      // player is holding to charge
    this.specialCooldown = 0;          // seconds remaining on cooldown
    this.specialActive   = false;      // special is currently executing
    this.specialTimer    = 0;          // remaining duration of active special
    this.specialData     = {};         // per-special runtime state
  }
}

