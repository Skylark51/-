import { GameStorage } from "./storage.js";

const storage = new GameStorage();
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
let volume = clamp(storage.data.settings?.volume ?? 0.5);
let context = null;
let output = null;
let noiseBuffer = null;
let starting = null;
const activeSources = new Set();

function makeNoiseBuffer(audioContext, seconds = 0.5) {
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
    try { source.stop(); } catch { /* already stopped */ }
  }
  activeSources.clear();
}

async function ensureAudio() {
  if (volume <= 0) return false;
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
    compressor.threshold.value = -14;
    compressor.knee.value = 16;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.15;
    output.gain.value = 0.36;
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

function playWaterFill() {
  const now = context.currentTime;
  const wash = track(context.createBufferSource());
  const washFilter = context.createBiquadFilter();
  const washGain = context.createGain();
  wash.buffer = noiseBuffer;
  washFilter.type = "bandpass";
  washFilter.frequency.setValueAtTime(1450, now);
  washFilter.frequency.exponentialRampToValueAtTime(2600, now + 0.28);
  washFilter.Q.value = 0.7;
  washGain.gain.setValueAtTime(0.0001, now);
  washGain.gain.exponentialRampToValueAtTime(0.18 * volume ** 0.85, now + 0.025);
  washGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
  wash.connect(washFilter);
  washFilter.connect(washGain);
  washGain.connect(output);
  wash.start(now, 0, 0.36);
  wash.stop(now + 0.36);

  [[880, 0.045, 0.11], [1320, 0.12, 0.085], [1760, 0.19, 0.055]].forEach(([frequency, delay, peak]) => {
    const osc = track(context.createOscillator());
    const gain = context.createGain();
    osc.type = frequency > 1400 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(frequency, now + delay);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.76, now + delay + 0.13);
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(peak * volume ** 0.85, now + delay + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.16);
    osc.connect(gain);
    gain.connect(output);
    osc.start(now + delay);
    osc.stop(now + delay + 0.17);
  });
}

function playToadHit() {
  const now = context.currentTime;
  const body = track(context.createOscillator());
  const bodyGain = context.createGain();
  body.type = "sine";
  body.frequency.setValueAtTime(145, now);
  body.frequency.exponentialRampToValueAtTime(54, now + 0.14);
  bodyGain.gain.setValueAtTime(0.24 * volume ** 0.85, now);
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
  thudGain.gain.setValueAtTime(0.17 * volume ** 0.85, now);
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
  if (kind === "correct") playWaterFill();
  else if (kind === "wrong") playToadHit();
}

window.addEventListener("answer:correct", () => { void play("correct"); });
window.addEventListener("answer:wrong", () => { void play("wrong"); });

const volumeInput = document.getElementById("volumeSetting");
if (volumeInput) {
  const syncVolume = event => { volume = clamp(event.currentTarget.value); };
  volumeInput.addEventListener("input", syncVolume);
  volumeInput.addEventListener("change", syncVolume);
}

document.addEventListener("visibilitychange", () => {
  if (!context) return;
  if (document.hidden) context.suspend().catch(() => {});
  else if (volume > 0) context.resume().catch(() => {});
});

document.documentElement.dataset.sfx = "idle";
