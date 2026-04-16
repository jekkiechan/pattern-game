// ═══════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════
let _audioCtx = null;
function audio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function makeDistCurve(amount) {
  const n = 256, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function playHit(intensity = 0.5) {
  const ac = audio(), now = ac.currentTime;
  const osc  = ac.createOscillator();
  const osc2 = ac.createOscillator();
  const dist = ac.createWaveShaper();
  const gain = ac.createGain();

  dist.curve = makeDistCurve(150);
  osc.connect(dist); osc2.connect(dist);
  dist.connect(gain); gain.connect(ac.destination);

  const f = 280 + intensity * 550;
  osc.type  = 'sawtooth';
  osc2.type = 'square';
  osc.frequency.setValueAtTime(f, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.13);
  osc2.frequency.setValueAtTime(f * 1.6, now);
  osc2.frequency.exponentialRampToValueAtTime(55, now + 0.11);

  gain.gain.setValueAtTime(Math.min(0.5, 0.35 * intensity + 0.1), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

  osc.start(now); osc2.start(now);
  osc.stop(now + 0.2); osc2.stop(now + 0.2);
}

function playLaunch() {
  const ac = audio(), now = ac.currentTime;
  const osc  = ac.createOscillator();
  const filt = ac.createBiquadFilter();
  const gain = ac.createGain();

  filt.type = 'highpass';
  filt.frequency.value = 600;
  osc.connect(filt); filt.connect(gain); gain.connect(ac.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  osc.start(now); osc.stop(now + 0.28);
}

function playSpinOut() {
  const ac = audio(), now = ac.currentTime;
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain); gain.connect(ac.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.9);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  osc.start(now); osc.stop(now + 0.9);
}

function playWhoosh() {
  const ac = audio(), now = ac.currentTime;
  const sr = ac.sampleRate;
  const len = Math.floor(sr * 0.32);
  const buf = ac.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src  = ac.createBufferSource();
  const filt = ac.createBiquadFilter();
  const gain = ac.createGain();

  src.buffer = buf;
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(2200, now);
  filt.frequency.exponentialRampToValueAtTime(400, now + 0.32);
  filt.Q.value = 4;

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  src.connect(filt); filt.connect(gain); gain.connect(ac.destination);
  src.start(now);
}

