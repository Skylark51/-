const BGM_POSITION_KEY = "kongjuiya-historical-bgm-position";
const BPM = 64;
const BEAT = 60 / BPM;
const LOOP_DURATION = 32 * BEAT;
const SAMPLE_RATE = 44100;
const MAX_BACKGROUND_GAIN = 0.24;

let sharedController = null;
let renderedBufferPromise = null;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function midiFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function seededRandom(seed = 20260804) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function connectPanned(context, source, destination, pan = 0, gainValue = 1) {
  const gain = context.createGain();
  gain.gain.value = gainValue;
  source.connect(gain);

  if (typeof context.createStereoPanner === "function") {
    const panner = context.createStereoPanner();
    panner.pan.value = clamp(pan, -1, 1);
    gain.connect(panner);
    panner.connect(destination);
  } else {
    gain.connect(destination);
  }

  return gain;
}

function createNoiseBuffer(context, seconds, random) {
  const length = Math.ceil(seconds * context.sampleRate);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    channel[index] = random() * 2 - 1;
  }
  return buffer;
}

function createReverbImpulse(context, seconds, random) {
  const length = Math.ceil(seconds * context.sampleRate);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channelIndex = 0; channelIndex < 2; channelIndex += 1) {
    const channel = impulse.getChannelData(channelIndex);
    for (let index = 0; index < length; index += 1) {
      const time = index / context.sampleRate;
      const decay = Math.exp(-time * 2.45);
      channel[index] = (random() * 2 - 1) * decay * (0.58 + channelIndex * 0.06);
    }
  }
  return impulse;
}

function schedulePad(context, destination, start, duration, note, pan, level = 1) {
  const frequency = midiFrequency(note);
  const voice = context.createGain();
  const attack = 1.15;
  const release = 1.25;
  voice.gain.setValueAtTime(0.0001, start);
  voice.gain.exponentialRampToValueAtTime(0.045 * level, start + attack);
  voice.gain.setValueAtTime(0.045 * level, start + Math.max(attack, duration - release));
  voice.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1450;
  filter.Q.value = 0.7;
  voice.connect(filter);
  connectPanned(context, filter, destination, pan, 1);

  [
    ["sine", 1, 0.72],
    ["triangle", 2, 0.19],
    ["sine", 3, 0.09]
  ].forEach(([type, multiple, amount], index) => {
    const oscillator = context.createOscillator();
    const partial = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency * multiple;
    oscillator.detune.value = index === 0 ? -3 : index === 1 ? 4 : 1;
    partial.gain.value = amount;
    oscillator.connect(partial);
    partial.connect(voice);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  });
}

function scheduleGayageum(context, destination, noiseBuffer, start, note, pan, level = 1) {
  const frequency = midiFrequency(note);
  const duration = 1.25;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.105 * level, start + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.018 * level, start + 0.38);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(5600, frequency * 15), start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(900, frequency * 4.5), start + 0.48);
  filter.Q.value = 1.6;
  envelope.connect(filter);
  connectPanned(context, filter, destination, pan, 1);

  [
    ["triangle", 1, 0.8],
    ["sine", 2, 0.36],
    ["sine", 3, 0.14]
  ].forEach(([type, multiple, amount]) => {
    const oscillator = context.createOscillator();
    const partial = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency * multiple * 0.992, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * multiple, start + 0.055);
    partial.gain.value = amount;
    oscillator.connect(partial);
    partial.connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  });

  const pick = context.createBufferSource();
  const pickFilter = context.createBiquadFilter();
  const pickGain = context.createGain();
  pick.buffer = noiseBuffer;
  pickFilter.type = "bandpass";
  pickFilter.frequency.value = Math.min(6200, frequency * 12);
  pickFilter.Q.value = 1.1;
  pickGain.gain.setValueAtTime(0.055 * level, start);
  pickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
  pick.connect(pickFilter);
  pickFilter.connect(pickGain);
  pickGain.connect(envelope);
  pick.start(start, 0, 0.08);
}

function scheduleDaegeum(context, destination, noiseBuffer, start, duration, note, pan, level = 1) {
  const frequency = midiFrequency(note);
  const release = 0.32;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.085 * level, start + 0.18);
  envelope.gain.setValueAtTime(0.085 * level, start + Math.max(0.2, duration - release));
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4100;
  filter.Q.value = 0.65;
  envelope.connect(filter);
  connectPanned(context, filter, destination, pan, 1);

  const vibrato = context.createOscillator();
  const vibratoGain = context.createGain();
  vibrato.frequency.value = 5.15;
  vibratoGain.gain.setValueAtTime(0, start);
  vibratoGain.gain.linearRampToValueAtTime(7.5, start + 0.45);
  vibrato.connect(vibratoGain);

  [
    ["sine", 1, 0.88],
    ["sine", 2, 0.19],
    ["triangle", 3, 0.055]
  ].forEach(([type, multiple, amount], index) => {
    const oscillator = context.createOscillator();
    const partial = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency * multiple * (index ? 1 : 0.986), start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * multiple, start + 0.12);
    partial.gain.value = amount;
    vibratoGain.connect(oscillator.detune);
    oscillator.connect(partial);
    partial.connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + duration + release + 0.05);
  });

  vibrato.start(start);
  vibrato.stop(start + duration + release + 0.05);

  const breath = context.createBufferSource();
  const breathFilter = context.createBiquadFilter();
  const breathGain = context.createGain();
  breath.buffer = noiseBuffer;
  breath.loop = true;
  breathFilter.type = "bandpass";
  breathFilter.frequency.value = 2200;
  breathFilter.Q.value = 0.6;
  breathGain.gain.setValueAtTime(0.0001, start);
  breathGain.gain.exponentialRampToValueAtTime(0.012 * level, start + 0.16);
  breathGain.gain.setValueAtTime(0.012 * level, start + duration);
  breathGain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);
  breath.connect(breathFilter);
  breathFilter.connect(breathGain);
  breathGain.connect(filter);
  breath.start(start);
  breath.stop(start + duration + release + 0.05);
}

function scheduleDrum(context, destination, noiseBuffer, start, strong = false) {
  const duration = 0.72;
  const envelope = context.createGain();
  const peak = strong ? 0.13 : 0.085;
  envelope.gain.setValueAtTime(peak, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  connectPanned(context, envelope, destination, 0, 1);

  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(strong ? 122 : 105, start);
  oscillator.frequency.exponentialRampToValueAtTime(strong ? 52 : 60, start + 0.09);
  oscillator.connect(envelope);
  oscillator.start(start);
  oscillator.stop(start + duration);

  const impact = context.createBufferSource();
  const impactFilter = context.createBiquadFilter();
  const impactGain = context.createGain();
  impact.buffer = noiseBuffer;
  impactFilter.type = "lowpass";
  impactFilter.frequency.value = 850;
  impactGain.gain.setValueAtTime(strong ? 0.055 : 0.035, start);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
  impact.connect(impactFilter);
  impactFilter.connect(impactGain);
  impactGain.connect(envelope);
  impact.start(start, 0, 0.12);
}

function scheduleWoodHit(context, destination, noiseBuffer, start, pan = 0.35) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.value = 1450;
  filter.Q.value = 2.8;
  envelope.gain.setValueAtTime(0.038, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.075);
  source.connect(filter);
  filter.connect(envelope);
  connectPanned(context, envelope, destination, pan, 1);
  source.start(start, 0, 0.12);
}

function crossfadeLoop(buffer, seconds = 0.82) {
  const fadeLength = Math.min(
    Math.floor(seconds * buffer.sampleRate),
    Math.floor(buffer.length / 5)
  );

  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const channel = buffer.getChannelData(channelIndex);
    const start = channel.slice(0, fadeLength);
    const endOffset = channel.length - fadeLength;
    for (let index = 0; index < fadeLength; index += 1) {
      const mix = index / Math.max(1, fadeLength - 1);
      channel[endOffset + index] = channel[endOffset + index] * (1 - mix) + start[index] * mix;
    }
  }
  return buffer;
}

async function renderHistoricalLoop() {
  const frameCount = Math.ceil(LOOP_DURATION * SAMPLE_RATE);
  const context = new OfflineAudioContext(2, frameCount, SAMPLE_RATE);
  const random = seededRandom();
  const noiseBuffer = createNoiseBuffer(context, 2.2, random);

  const dry = context.createGain();
  const wet = context.createGain();
  const convolver = context.createConvolver();
  const compressor = context.createDynamicsCompressor();

  dry.gain.value = 0.92;
  wet.gain.value = 0.24;
  convolver.buffer = createReverbImpulse(context, 2.85, random);
  compressor.threshold.value = -18;
  compressor.knee.value = 16;
  compressor.ratio.value = 2.4;
  compressor.attack.value = 0.018;
  compressor.release.value = 0.32;

  const musicBus = context.createGain();
  musicBus.gain.value = 0.9;
  musicBus.connect(dry);
  musicBus.connect(convolver);
  convolver.connect(wet);
  dry.connect(compressor);
  wet.connect(compressor);
  compressor.connect(context.destination);

  const chords = [
    [45, 52, 57], [43, 50, 55], [41, 48, 53], [40, 47, 52],
    [45, 52, 57], [43, 50, 55], [41, 48, 53], [45, 52, 57]
  ];
  chords.forEach((chord, bar) => {
    chord.forEach((note, index) => {
      schedulePad(context, musicBus, bar * 4 * BEAT, 4 * BEAT, note, -0.42 + index * 0.42, index ? 0.8 : 1);
    });
  });

  const patterns = [
    [57, 64, 69, 72, 69, 64, 60, 64],
    [55, 62, 67, 69, 67, 62, 59, 62],
    [53, 60, 65, 69, 65, 60, 57, 60],
    [52, 59, 64, 67, 64, 59, 55, 59],
    [57, 64, 69, 72, 69, 64, 60, 64],
    [55, 62, 67, 69, 71, 67, 62, 59],
    [53, 60, 65, 69, 72, 69, 65, 60],
    [57, 64, 69, 72, 69, 64, 60, 57]
  ];
  patterns.forEach((pattern, bar) => {
    pattern.forEach((note, index) => {
      scheduleGayageum(
        context,
        musicBus,
        noiseBuffer,
        (bar * 4 + index * 0.5) * BEAT,
        note,
        -0.3 + ((index % 3) - 1) * 0.06,
        index === 0 || index === 4 ? 1 : 0.78
      );
    });
  });

  const melody = [
    [0, 69, 1.8], [1.75, 67, 0.25], [2, 64, 1.75],
    [4, 62, 1.45], [5.45, 64, 0.45], [6, 67, 0.9], [7, 69, 0.85],
    [8, 72, 1.9], [10, 69, 0.85], [11, 67, 0.85],
    [12, 64, 1.8], [14, 62, 0.85], [15, 60, 0.8],
    [16, 69, 1.35], [17.35, 67, 0.5], [18, 64, 1.8],
    [20, 62, 0.85], [21, 64, 0.8], [22, 67, 1.8],
    [24, 69, 0.8], [25, 72, 0.8], [26, 69, 0.8], [27, 67, 0.8],
    [28, 64, 1.3], [29.35, 62, 0.45], [30, 60, 0.8], [31, 57, 0.85]
  ];
  melody.forEach(([startBeat, note, durationBeats], index) => {
    scheduleDaegeum(
      context,
      musicBus,
      noiseBuffer,
      startBeat * BEAT,
      durationBeats * BEAT,
      note,
      0.18 + Math.sin(index) * 0.045,
      note >= 69 ? 1 : 0.9
    );
  });

  for (let bar = 0; bar < 8; bar += 1) {
    const start = bar * 4 * BEAT;
    scheduleDrum(context, musicBus, noiseBuffer, start, bar === 0 || bar === 4);
    if (bar % 2 === 1) scheduleWoodHit(context, musicBus, noiseBuffer, start + 2 * BEAT);
  }

  return crossfadeLoop(await context.startRendering());
}

function savedPosition() {
  try {
    const value = JSON.parse(sessionStorage.getItem(BGM_POSITION_KEY) || "null");
    if (!value || Date.now() - Number(value.savedAt || 0) > 30 * 60 * 1000) return 0;
    return clamp(Number(value.position || 0), 0, LOOP_DURATION - 0.05);
  } catch {
    return 0;
  }
}

function createController(initialVolume = 0.5) {
  let context = null;
  let gainNode = null;
  let source = null;
  let sourceStartedAt = 0;
  let sourceOffset = savedPosition();
  let volume = clamp(initialVolume);
  let startPromise = null;
  let destroyed = false;
  const removers = [];

  const targetGain = () => MAX_BACKGROUND_GAIN * volume ** 1.65;

  const savePosition = () => {
    if (!context || !source) return;
    const position = (sourceOffset + Math.max(0, context.currentTime - sourceStartedAt)) % LOOP_DURATION;
    try {
      sessionStorage.setItem(BGM_POSITION_KEY, JSON.stringify({ position, savedAt: Date.now() }));
    } catch {
      // Audio continuity is optional when storage is blocked.
    }
  };

  const removeUnlockListeners = () => {
    while (removers.length) removers.pop()();
  };

  const ensureStarted = () => {
    if (destroyed || volume <= 0) return Promise.resolve(false);
    if (source && context) {
      return context.resume().then(() => true).catch(() => false);
    }
    if (startPromise) return startPromise;

    startPromise = (async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;

      context = new AudioContextClass({ latencyHint: "playback" });
      gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.connect(context.destination);
      await context.resume();

      const rendered = await (renderedBufferPromise ||= renderHistoricalLoop());
      const playbackBuffer = context.createBuffer(
        rendered.numberOfChannels,
        rendered.length,
        rendered.sampleRate
      );
      for (let channelIndex = 0; channelIndex < rendered.numberOfChannels; channelIndex += 1) {
        playbackBuffer.copyToChannel(rendered.getChannelData(channelIndex), channelIndex);
      }

      source = context.createBufferSource();
      source.buffer = playbackBuffer;
      source.loop = true;
      source.connect(gainNode);
      sourceStartedAt = context.currentTime;
      source.start(0, sourceOffset % playbackBuffer.duration);
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, targetGain()),
        context.currentTime + 1.35
      );
      removeUnlockListeners();
      document.documentElement.dataset.bgm = "playing";
      return true;
    })().catch(error => {
      console.warn("Historical BGM could not start.", error);
      startPromise = null;
      return false;
    });

    return startPromise;
  };

  const setVolume = value => {
    volume = clamp(value);
    if (gainNode && context) {
      gainNode.gain.setTargetAtTime(
        Math.max(0.0001, targetGain()),
        context.currentTime,
        0.12
      );
    }
    if (volume > 0 && !source) ensureStarted();
  };

  const unlock = () => { ensureStarted(); };
  ["pointerdown", "touchend", "keydown"].forEach(type => {
    const handler = unlock;
    document.addEventListener(type, handler, { capture: true, passive: true });
    removers.push(() => document.removeEventListener(type, handler, { capture: true }));
  });

  const volumeInput = document.getElementById("volumeSetting");
  const syncSlider = event => setVolume(event.currentTarget.value);
  if (volumeInput) {
    volumeInput.addEventListener("input", syncSlider);
    volumeInput.addEventListener("change", syncSlider);
    removers.push(() => volumeInput.removeEventListener("input", syncSlider));
    removers.push(() => volumeInput.removeEventListener("change", syncSlider));
  }

  const handleVisibility = () => {
    if (!context) return;
    if (document.hidden) {
      savePosition();
      context.suspend().catch(() => {});
    } else if (source && volume > 0) {
      context.resume().catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  removers.push(() => document.removeEventListener("visibilitychange", handleVisibility));

  const handlePageHide = () => savePosition();
  window.addEventListener("pagehide", handlePageHide);
  removers.push(() => window.removeEventListener("pagehide", handlePageHide));

  renderedBufferPromise ||= renderHistoricalLoop();

  return {
    ensureStarted,
    setVolume,
    get volume() { return volume; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      savePosition();
      removeUnlockListeners();
      source?.stop();
      context?.close().catch(() => {});
      source = null;
      context = null;
      document.documentElement.dataset.bgm = "stopped";
      if (sharedController === this) sharedController = null;
    }
  };
}

export function mountHistoricalBgm({ initialVolume = 0.5 } = {}) {
  if (sharedController) {
    sharedController.setVolume(initialVolume);
    return sharedController;
  }
  sharedController = createController(initialVolume);
  return sharedController;
}
