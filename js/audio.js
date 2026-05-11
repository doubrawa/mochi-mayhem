/* Web-Audio sound effects.  Everything is synthesized — no external
   sample files — but the textures are layered enough to read as "game
   SFX" rather than calculator beeps.  Each public sfx fires multiple
   short sources (oscillator + filtered noise + envelopes) wired through
   a shared master gain.

   The AudioContext is created lazily on first play because most browsers
   require a user gesture before audio can start; the very first user
   click anywhere in the app warms it up. */

let ctx = null;
let masterGain = null;
let muted = false;

function ensureCtx(){
  if(ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

function attachUnlock(){
  const unlock = () => {
    const c = ensureCtx();
    if(c && c.state === 'suspended') c.resume().then(tryStartBgm).catch(()=>{});
    else tryStartBgm();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
if(typeof window !== 'undefined') attachUnlock();

export function setMuted(m){ muted = !!m; }
export function isMuted(){ return muted; }

/* ============ low-level helpers ============ */

/* Reusable noise buffer — a single second of white noise, looped/sliced
   as needed.  Cheaper than allocating a buffer per sound. */
let noiseBuf = null;
function getNoiseBuf(c){
  if(noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 2);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/* Oscillator with attack/decay envelope and optional frequency sweep. */
function tone({ freq=440, type='sine', dur=0.1, attack=0.005, decay=0.08,
                gain=0.4, freqEnd=null, detune=0, delay=0 } = {}){
  if(muted) return;
  const c = ensureCtx(); if(!c || c.state === 'suspended') return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.detune.value = detune;
  if(freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  osc.connect(env); env.connect(masterGain);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

/* Filtered noise burst.  `filterType` selects lowpass/bandpass/highpass. */
function noise({ dur=0.4, gain=0.4, filterType='lowpass',
                 freqStart=1200, freqEnd=200, q=1, delay=0 } = {}){
  if(muted) return;
  const c = ensureCtx(); if(!c || c.state === 'suspended') return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuf(c);
  const filt = c.createBiquadFilter();
  filt.type = filterType;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(freqStart, t);
  filt.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filt); filt.connect(env); env.connect(masterGain);
  src.start(t); src.stop(t + dur + 0.05);
}

/* Detuned-pair oscillator: two oscillators a few cents apart for warmth. */
function fatTone(opts){
  tone({ ...opts, detune: -8 });
  tone({ ...opts, detune: +8, gain: (opts.gain ?? 0.4) * 0.85 });
}

/* ============ public sound API ============ */

/* Bomb place — soft wooden thunk: muffled mid-low pitch + tiny click. */
export function sfxBombPlace(){
  tone({ freq: 180, type: 'sine', dur: 0.12, attack: 0.001, decay: 0.11,
         gain: 0.45, freqEnd: 80 });
  noise({ dur: 0.04, gain: 0.20, filterType: 'highpass',
          freqStart: 4000, freqEnd: 2000 });
}

/* Fuse tick — short clicky blip, low volume so it doesn't drown gameplay. */
export function sfxFuseTick(){
  tone({ freq: 1200, type: 'triangle', dur: 0.04, attack: 0.001, decay: 0.035, gain: 0.14 });
  noise({ dur: 0.02, gain: 0.06, filterType: 'highpass', freqStart: 5000, freqEnd: 3000 });
}

/* Explosion — heavy, dirty, with a deep sub thump, a chaotic mid-band
   body, a sharp high-frequency transient on impact, and a long low
   rumble tail.  Aim is "blown TNT", not "cartoon poof". */
export function sfxExplosion(){
  /* 1. Sharp white-noise transient: the instant CRACK on impact. */
  noise({ dur: 0.06, gain: 0.6, filterType: 'highpass',
          freqStart: 6000, freqEnd: 3000 });
  /* 2. Deep sub thump that drops fast — gives the boom its punch. */
  tone({ freq: 95, type: 'sine', dur: 0.7, attack: 0.001, decay: 0.65,
         gain: 0.9, freqEnd: 22 });
  /* 3. Wide mid-band body, lowpassed and bandpass-resonant for grit. */
  noise({ dur: 0.55, gain: 0.75, filterType: 'lowpass',
          freqStart: 2400, freqEnd: 90, q: 1.6 });
  /* 4. Long low rumble tail — the room shaking after. */
  noise({ dur: 1.5, gain: 0.38, filterType: 'lowpass',
          freqStart: 300, freqEnd: 55, q: 0.8, delay: 0.08 });
}

/* Pickup — three rising fat tones forming a triumph triplet. */
export function sfxPickup(){
  fatTone({ freq: 660, type: 'triangle', dur: 0.10, attack: 0.002, decay: 0.08, gain: 0.32 });
  fatTone({ freq: 880, type: 'triangle', dur: 0.11, attack: 0.002, decay: 0.09, gain: 0.32, delay: 0.07 });
  fatTone({ freq: 1318, type: 'triangle', dur: 0.16, attack: 0.002, decay: 0.13, gain: 0.34, delay: 0.15 });
  /* A bright bell-like harmonic on the final note. */
  tone({ freq: 2637, type: 'sine', dur: 0.20, attack: 0.001, decay: 0.18, gain: 0.10, delay: 0.15 });
}

/* Death — descending wail with vibrato-ish dual oscillators. */
export function sfxDeath(){
  tone({ freq: 520, type: 'sawtooth', dur: 0.5, attack: 0.005, decay: 0.45,
         gain: 0.32, freqEnd: 80 });
  tone({ freq: 525, type: 'sawtooth', dur: 0.5, attack: 0.005, decay: 0.45,
         gain: 0.28, freqEnd: 78, detune: 12 });
  noise({ dur: 0.15, gain: 0.18, filterType: 'lowpass',
          freqStart: 800, freqEnd: 200, delay: 0.35 });
}

/* Round end — three-note major triumph with a sustained low under it. */
export function sfxRoundEnd(){
  fatTone({ freq: 523, type: 'triangle', dur: 0.18, attack: 0.005, decay: 0.16, gain: 0.4 });
  fatTone({ freq: 659, type: 'triangle', dur: 0.18, attack: 0.005, decay: 0.16, gain: 0.4, delay: 0.14 });
  fatTone({ freq: 784, type: 'triangle', dur: 0.34, attack: 0.005, decay: 0.32, gain: 0.45, delay: 0.28 });
  tone({ freq: 261, type: 'sine', dur: 0.6, attack: 0.02, decay: 0.55, gain: 0.18 });
}

/* Shield — bright metallic ting, two harmonics. */
export function sfxShield(){
  tone({ freq: 1200, type: 'sine', dur: 0.18, attack: 0.001, decay: 0.16,
         gain: 0.30, freqEnd: 1800 });
  tone({ freq: 2880, type: 'sine', dur: 0.20, attack: 0.001, decay: 0.18,
         gain: 0.12, freqEnd: 4320 });
}

/* ============ background music ============

   A short looping chip-tune: square-wave bass plodding through a
   I–IV–V–I progression in C major, a triangle-wave melody arpeggiating
   over the top, and a soft hi-hat click on each eighth note.  The
   scheduler precomputes note start times relative to bgmStartTime so
   tempo never drifts.  The BGM has its own gain node fed into the
   master gain so it can sit comfortably under the SFX. */

const BGM_BPM = 112;
const BGM_EIGHTH = (60 / BGM_BPM) / 2;     // seconds per eighth note
const BGM_STEPS = 16;                       // 16 eighths = 8 beats = ~4.3 s loop
/* Bass: roots of C, F, G, C, two beats each. */
const BGM_BASS = [
  130.81, 0, 0, 0,   //  C3 . . .
  174.61, 0, 0, 0,   //  F3 . . .
  196.00, 0, 0, 0,   //  G3 . . .
  130.81, 0, 0, 0,   //  C3 . . .
];
/* Melody arpeggios drawn from each underlying chord (C, F, G, C). */
const BGM_MEL = [
  523.25, 659.25, 783.99, 659.25,   //  C5 E5 G5 E5
  698.46, 880.00, 1046.50, 880.00,  //  F5 A5 C6 A5
  783.99, 987.77, 1174.66, 987.77,  //  G5 B5 D6 B5
  1046.50, 783.99, 659.25, 523.25,  //  C6 G5 E5 C5
];

let bgmGain      = null;
let bgmRequested = false;             // user asked for music
let bgmStartTime = 0;                 // ctx time of step 0
let bgmNextStep  = 0;                 // global step index
let bgmTimer     = null;              // setInterval handle for scheduler

/* Public API. */
export function startBgm(){
  bgmRequested = true;
  tryStartBgm();
}
export function stopBgm(){
  bgmRequested = false;
  if(bgmTimer){ clearInterval(bgmTimer); bgmTimer = null; }
}

function tryStartBgm(){
  if(!bgmRequested || bgmTimer) return;
  const c = ensureCtx();
  if(!c || c.state === 'suspended') return;   // wait for user-gesture unlock
  if(!bgmGain){
    bgmGain = c.createGain();
    bgmGain.gain.value = 0.18;                // sit ~15 dB below the SFX peaks
    bgmGain.connect(masterGain);
  }
  bgmStartTime = c.currentTime + 0.1;
  bgmNextStep = 0;
  bgmTimer = setInterval(scheduleBgm, 100);
  scheduleBgm();
}

/* Audio Worklet-style lookahead: every 100 ms, queue any notes whose
   start times fall within the next 300 ms.  Web Audio handles precise
   playback timing once a note is scheduled, so jitter from setInterval
   doesn't affect the audible groove. */
function scheduleBgm(){
  if(muted) return;
  const c = ensureCtx();
  if(!c || c.state === 'suspended') return;
  const horizon = c.currentTime + 0.3;
  while(true){
    const t = bgmStartTime + bgmNextStep * BGM_EIGHTH;
    if(t > horizon) break;
    const step = bgmNextStep % BGM_STEPS;
    const bassF = BGM_BASS[step];
    const melF  = BGM_MEL[step];
    if(bassF) bgmNote(t, bassF, 'square',   BGM_EIGHTH * 3.6, 0.42);
    if(melF)  bgmNote(t, melF,  'triangle', BGM_EIGHTH * 1.6, 0.28);
    /* Subtle hi-hat click on every step for groove. */
    bgmHat(t, BGM_EIGHTH * 0.3, 0.10);
    bgmNextStep++;
  }
}

function bgmNote(startT, freq, type, dur, gain){
  const c = ensureCtx();
  if(!c || !bgmGain) return;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, startT);
  env.gain.linearRampToValueAtTime(gain, startT + 0.008);
  env.gain.exponentialRampToValueAtTime(0.001, startT + dur);
  osc.connect(env); env.connect(bgmGain);
  osc.start(startT);
  osc.stop(startT + dur + 0.05);
}

function bgmHat(startT, dur, gain){
  const c = ensureCtx();
  if(!c || !bgmGain) return;
  const src = c.createBufferSource(); src.buffer = getNoiseBuf(c);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500;
  const env = c.createGain();
  env.gain.setValueAtTime(gain, startT);
  env.gain.exponentialRampToValueAtTime(0.001, startT + dur);
  src.connect(hp); hp.connect(env); env.connect(bgmGain);
  src.start(startT); src.stop(startT + dur + 0.05);
}

/* Earthquake — a long, deep rumble across the duration of the effect. */
export function sfxEarthquake(){
  /* Sub-rumble: heavily lowpassed noise. */
  noise({ dur: 2.6, gain: 0.55, filterType: 'lowpass',
          freqStart: 220, freqEnd: 80, q: 0.7 });
  /* Body: bandpass noise oscillating in the low-mids. */
  noise({ dur: 2.6, gain: 0.30, filterType: 'bandpass',
          freqStart: 320, freqEnd: 140, q: 1.5 });
  /* A pitched groan layer underneath. */
  tone({ freq: 70, type: 'sawtooth', dur: 2.5, attack: 0.05, decay: 2.45,
         gain: 0.22, freqEnd: 55 });
  tone({ freq: 71, type: 'sawtooth', dur: 2.5, attack: 0.05, decay: 2.45,
         gain: 0.20, freqEnd: 56, detune: -10 });
}
