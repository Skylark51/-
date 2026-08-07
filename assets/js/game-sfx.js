const AUDIO_SETTINGS_KEY = "kongjuiya-audio-settings";
const DEFAULT_SETTINGS = Object.freeze({
  bgmVolume: 0.62,
  sfxVolume: 0.78,
  mute: false
});

const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const normalize = raw => ({
  bgmVolume: clamp(raw?.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume),
  sfxVolume: clamp(raw?.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
  mute: Boolean(raw?.mute)
});
const readSettings = () => {
  try {
    return normalize(JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || "null"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

let settings = readSettings();
let context = null;
let output = null;
let noiseBuffer = null;
let starting = null;
const activeSources = new Set();

function makeNoiseBuffer(audioContext, seconds = 0.7) {
  const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * seconds), audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 20260807;
  for (let index = 0; index < data.length; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[index] = seed / 2147483648 - 1;
  }
  return buffer;
}

function track(source) {
  activeSources.add(source);
  source.addEventListener?.("ended", () => activeSources.delete(source), { once: true });
  return source;
}

function stopActive() {
  for (const source of activeSources) {
    try { source.stop(); } catch {}
  }
  activeSources.clear();
}

async function ensureAudio() {
  if (settings.mute || settings.sfxVolume <= 0) return false;
  if (context && context.state !== "closed") {
    await context.resume().catch(() => {});
    return context.state === "running";
  }
  if (starting) return starting;

  starting = (async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      context = new AudioContextClass({ latencyHint: "interactive" });
    } catch {
      context = new AudioContextClass();
    }

    output = context.createGain();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 16;
    compressor.ratio.value = 2.4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    output.gain.value = 0.42;
    output.connect(compressor);
    compressor.connect(context.destination);

    noiseBuffer = makeNoiseBuffer(context);
    await context.resume().catch(() => {});
    document.documentElement.dataset.sfx = context.state === "running" ? "ready" : "blocked";
    return context.state === "running";
  })().finally(() => {
    starting = null;
  });

  return starting;
}

function sfxLevel(scale = 1) {
  return clamp(settings.sfxVolume) ** 0.82 * scale;
}

function playSpringWater() {
  const now = context.currentTime;

  const wash = track(context.createBufferSource());
  const washFilter = context.createBiquadFilter();
  const washGain = context.createGain();
  wash.buffer = noiseBuffer;
  washFilter.type = "bandpass";
  washFilter.frequency.setValueAtTime(1100, now);
  washFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.22);
  washFilter.Q.value = 0.55;
  washGain.gain.setValueAtTime(0.0001, now);
  washGain.gain.exponentialRampToValueAtTime(0.18 * sfxLevel(), now + 0.018);
  washGain.gain.exponentialRampToValueAtTime(0.028 * sfxLevel(), now + 0.18);
  washGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  wash.connect(washFilter);
  washFilter.connect(washGain);
  washGain.connect(output);
  wash.start(now, 0, 0.42);
  wash.stop(now + 0.42);

  const droplets = [
    [1240, 0.045, 0.09],
    [1510, 0.085, 0.082],
    [1770, 0.135, 0.074],
    [1420, 0.205, 0.068],
    [1970, 0.255, 0.055]
  ];
  droplets.forEach(([frequency, delay, peak], index) => {
    const osc = track(context.createOscillator());
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    osc.type = index % 2 === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(frequency, now + delay);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + delay + 0.12);
    filter.type = "highpass";
    filter.frequency.value = 580;
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(peak * sfxLevel(), now + delay + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.16);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(now + delay);
    osc.stop(now + delay + 0.18);
  });

  const body = track(context.createOscillator());
  const bodyGain = context.createGain();
  const bodyFilter = context.createBiquadFilter();
  body.type = "triangle";
  body.frequency.setValueAtTime(380, now);
  body.frequency.exponentialRampToValueAtTime(260, now + 0.24);
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.value = 700;
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.045 * sfxLevel(), now + 0.02);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  body.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(output);
  body.start(now);
  body.stop(now + 0.28);
}

function playToadHit() {
  const now = context.currentTime;
  const body = track(context.createOscillator());
  const bodyGain = context.createGain();
  body.type = "sine";
  body.frequency.setValueAtTime(145, now);
  body.frequency.exponentialRampToValueAtTime(54, now + 0.14);
  bodyGain.gain.setValueAtTime(0.22 * sfxLevel(), now);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  body.connect(bodyGain);
  bodyGain.connect(output);
  body.start(now);
  body.stop(now + 0.23);

  const thud = track(context.createBufferSource());
  const filter = context.createBiquadFilter();
  const thudGain = context.createGain();
  thud.buffer = noiseBuffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(720, now);
  filter.frequency.exponentialRampToValueAtTime(220, now + 0.12);
  thudGain.gain.setValueAtTime(0.16 * sfxLevel(), now);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  thud.connect(filter);
  filter.connect(thudGain);
  thudGain.connect(output);
  thud.start(now, 0, 0.18);
  thud.stop(now + 0.18);
}

async function play(kind) {
  if (!(await ensureAudio())) return;
  stopActive();
  if (kind === "correct") playSpringWater();
  else if (kind === "wrong") playToadHit();
}

window.addEventListener("answer:correct", () => { void play("correct"); });
window.addEventListener("answer:wrong", () => { void play("wrong"); });
window.addEventListener("kongjui:audio-settings", event => {
  settings = normalize(event.detail || readSettings());
  if (context && settings.mute) context.suspend().catch(() => {});
  else if (context && settings.sfxVolume > 0) context.resume().catch(() => {});
});
window.addEventListener("storage", event => {
  if (event.key === AUDIO_SETTINGS_KEY) settings = readSettings();
});

document.addEventListener("visibilitychange", () => {
  if (!context) return;
  if (document.hidden || settings.mute) context.suspend().catch(() => {});
  else if (settings.sfxVolume > 0) context.resume().catch(() => {});
});

document.documentElement.dataset.sfx = "idle";
