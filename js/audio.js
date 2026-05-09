/* Tiny synthesized sound effects via Web Audio.  We avoid bundling audio
   assets — every effect is a couple of oscillators with envelopes.

   The AudioContext is created lazily on first play because most browsers
   require a user gesture before audio can start; the very first user click
   anywhere in the app warms it up. */

let ctx = null;
let masterGain = null;
let muted = false;

function ensureCtx(){
  if(ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;     // overall volume
    masterGain.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

/* Resume context on the first user gesture — Chrome and Safari require this. */
function attachUnlock(){
  const unlock = () => {
    const c = ensureCtx();
    if(c && c.state === 'suspended') c.resume().catch(()=>{});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
if(typeof window !== 'undefined') attachUnlock();

export function setMuted(m){ muted = !!m; }
export function isMuted(){ return muted; }

/* Build a one-shot tone with attack/decay envelope. */
function tone({ freq = 440, type = 'sine', dur = 0.1, attack = 0.005, decay = 0.08, gain = 0.4, freqEnd = null } = {}){
  if(muted) return;
  const c = ensureCtx(); if(!c || c.state === 'suspended') return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if(freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  osc.connect(env); env.connect(masterGain);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

/* A rough "noise" burst — used for the boom. */
function noise({ dur = 0.4, gain = 0.4, lpStart = 1200, lpEnd = 200 } = {}){
  if(muted) return;
  const c = ensureCtx(); if(!c || c.state === 'suspended') return;
  const t = c.currentTime;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(lpStart, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(80, lpEnd), t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(lp); lp.connect(env); env.connect(masterGain);
  src.start(t); src.stop(t + dur + 0.05);
}

/* ============ public sound API ============ */

/* Soft click when a bomb is placed. */
export function sfxBombPlace(){
  tone({ freq: 320, type: 'square', dur: 0.08, attack: 0.002, decay: 0.07, gain: 0.25, freqEnd: 220 });
}

/* Single fuse blip (called once per second of fuse). */
export function sfxFuseTick(){
  tone({ freq: 720, type: 'triangle', dur: 0.05, attack: 0.002, decay: 0.04, gain: 0.18 });
}

/* Big boom: low noise burst plus a deep thump. */
export function sfxExplosion(){
  noise({ dur: 0.45, gain: 0.4, lpStart: 1400, lpEnd: 120 });
  tone({ freq: 90, type: 'sine', dur: 0.3, attack: 0.005, decay: 0.28, gain: 0.5, freqEnd: 40 });
}

/* Pleasant pickup chime — quick rising arpeggio. */
export function sfxPickup(){
  tone({ freq: 660, type: 'triangle', dur: 0.08, attack: 0.002, decay: 0.06, gain: 0.3 });
  setTimeout(() => tone({ freq: 880, type: 'triangle', dur: 0.1, attack: 0.002, decay: 0.08, gain: 0.3 }), 70);
  setTimeout(() => tone({ freq: 1320, type: 'triangle', dur: 0.12, attack: 0.002, decay: 0.1, gain: 0.3 }), 150);
}

/* Sad descending tone when a player dies. */
export function sfxDeath(){
  tone({ freq: 440, type: 'sawtooth', dur: 0.4, attack: 0.005, decay: 0.38, gain: 0.35, freqEnd: 110 });
}

/* Round-end fanfare — three-note triumph. */
export function sfxRoundEnd(){
  tone({ freq: 523, type: 'triangle', dur: 0.16, attack: 0.005, decay: 0.14, gain: 0.4 });
  setTimeout(() => tone({ freq: 659, type: 'triangle', dur: 0.16, attack: 0.005, decay: 0.14, gain: 0.4 }), 140);
  setTimeout(() => tone({ freq: 784, type: 'triangle', dur: 0.32, attack: 0.005, decay: 0.3, gain: 0.45 }), 280);
}

/* Soft "ouch" when shield absorbs an explosion. */
export function sfxShield(){
  tone({ freq: 880, type: 'sine', dur: 0.12, attack: 0.005, decay: 0.1, gain: 0.3, freqEnd: 1320 });
}
