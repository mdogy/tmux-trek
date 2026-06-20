// Web Audio API — all tones procedural, no asset files required.
let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function tone(frequency, type, duration, gain) {
  const c = ctx();
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.connect(env);
  env.connect(c.destination);
  osc.type = type;
  osc.frequency.value = frequency;
  env.gain.setValueAtTime(gain, c.currentTime);
  env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function playKeystroke() {
  tone(1100, "sine", 0.04, 0.055);
}

export function playSuccess() {
  [[523, 0], [659, 0.13], [784, 0.26]].forEach(([freq, delay]) => {
    setTimeout(() => tone(freq, "sine", 0.28, 0.11), delay * 1000);
  });
}

export function playError() {
  tone(380, "sawtooth", 0.15, 0.08);
  setTimeout(() => tone(260, "sawtooth", 0.2, 0.06), 110);
}

let _ambientOsc = null;
let _ambientLfo = null;
let _ambientGain = null;

export function startAmbient(zoneId = "bridge") {
  stopAmbient();
  const c = ctx();
  _ambientOsc = c.createOscillator();
  _ambientLfo = c.createOscillator();
  _ambientGain = c.createGain();
  const lfoGain = c.createGain();

  _ambientOsc.type = "sine";
  _ambientOsc.frequency.value = zoneId === "bridge" ? 55 : 110;
  _ambientGain.gain.value = 0.032;
  _ambientLfo.frequency.value = 0.18;
  lfoGain.gain.value = 6;

  _ambientLfo.connect(lfoGain);
  lfoGain.connect(_ambientOsc.frequency);
  _ambientOsc.connect(_ambientGain);
  _ambientGain.connect(c.destination);

  _ambientLfo.start();
  _ambientOsc.start();
}

export function stopAmbient() {
  try { _ambientOsc?.stop(); } catch { /* already stopped */ }
  try { _ambientLfo?.stop(); } catch { /* already stopped */ }
  try { _ambientGain?.disconnect(); } catch { /* already disconnected */ }
  _ambientOsc = null;
  _ambientLfo = null;
  _ambientGain = null;
}
