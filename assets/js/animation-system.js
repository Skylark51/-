const FRAME_COUNT = 60;
const SPRITE_FRAME_COUNT = 8;
const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pct = frame => `${(clamp(frame, 0, SPRITE_FRAME_COUNT - 1) / (SPRITE_FRAME_COUNT - 1) * 100).toFixed(6)}%`;
const repeatSequence = (sequence, total = FRAME_COUNT) => Object.freeze(
  Array.from({ length: total }, (_, index) => sequence[Math.floor(index / total * sequence.length)] ?? sequence.at(-1) ?? 0)
);

/* 60-step timelines drive eight authored sprite poses. Kongjwi and the toad use independent acting. */
export const IDLE_FRAMES = repeatSequence([0, 0, 1, 1, 0, 1]);
export const POUR_FRAMES = repeatSequence([2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 1]);
export const HIT_FRAMES = repeatSequence([7, 7, 4, 3, 6, 1]);
export const CLEAR_FRAMES = repeatSequence([1, 3, 1, 3, 6, 1]);
export const OVER_FRAMES = repeatSequence([7, 7, 7, 4, 7, 7]);

export const TOAD_IDLE_FRAMES = repeatSequence([0, 0, 1, 1, 0, 1]);
export const TOAD_POUR_FRAMES = repeatSequence([0, 1, 2, 3, 4, 4, 3, 2, 1, 0]);
export const TOAD_HIT_FRAMES = repeatSequence([2, 3, 4, 7, 5, 1]);
export const TOAD_CLEAR_FRAMES = repeatSequence([0, 6, 6, 1, 6, 0]);
export const TOAD_OVER_FRAMES = repeatSequence([7, 7, 7, 5, 7, 7]);

const STATE_CONFIG = Object.freeze({
  idle: Object.freeze({ kong: IDLE_FRAMES, toad: TOAD_IDLE_FRAMES, duration: 1000, loop: true }),
  pour: Object.freeze({ kong: POUR_FRAMES, toad: TOAD_POUR_FRAMES, duration: 980, loop: false }),
  hit: Object.freeze({ kong: HIT_FRAMES, toad: TOAD_HIT_FRAMES, duration: 720, loop: false }),
  clear: Object.freeze({ kong: CLEAR_FRAMES, toad: TOAD_CLEAR_FRAMES, duration: 1180, loop: false }),
  over: Object.freeze({ kong: OVER_FRAMES, toad: TOAD_OVER_FRAMES, duration: 1300, loop: false })
});

const set = (root, name, value) => root.style.setProperty(name, value);

function frameAt(frames, config, elapsed) {
  const duration = Math.max(1, config.duration);
  const progress = config.loop ? (elapsed % duration) / duration : clamp(elapsed / duration);
  const index = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
  return frames[index];
}

function applyWaterMotion(root, state, elapsed) {
  const phase = elapsed / 1000 * TAU;
  const idleWave = Math.sin(phase * 1.15);
  let opacity = 0;
  let length = .2;
  let thickness = .72;
  let angle = 20;
  let jarReact = 0;

  if (state === "pour") {
    const t = clamp(elapsed / STATE_CONFIG.pour.duration);
    const envelope = Math.sin(t * Math.PI);
    opacity = clamp(Math.min(t / .12, (1 - t) / .13));
    length = .28 + envelope * .98;
    thickness = .72 + envelope * .38;
    angle = 17 + Math.sin(t * Math.PI) * 5;
    jarReact = Math.sin(t * Math.PI * 4) * 1.3;
  } else if (state === "hit") {
    const t = clamp(elapsed / STATE_CONFIG.hit.duration);
    jarReact = Math.sin(t * Math.PI * 6) * (1 - t) * 4.6;
  } else if (state === "clear") {
    jarReact = Math.sin(elapsed / 90) * 1.2;
  } else if (state === "over") {
    jarReact = Math.sin(elapsed / 120) * .55;
  }

  set(root, "--water-wave-y", `${(idleWave * 2.2).toFixed(2)}px`);
  set(root, "--water-wave-x", (1 + Math.cos(phase * .92) * .025).toFixed(4));
  set(root, "--pour-opacity", opacity.toFixed(3));
  set(root, "--pour-length", length.toFixed(3));
  set(root, "--pour-thickness", thickness.toFixed(3));
  set(root, "--pour-angle", `${angle.toFixed(2)}deg`);
  set(root, "--jar-react", `${jarReact.toFixed(2)}deg`);
}

function applySealMotion(root, state, elapsed) {
  const phase = elapsed / 1000 * TAU;
  let x = Math.sin(phase) * .7;
  let y = Math.sin(phase + .8) * .65;
  let squashX = 1 + Math.sin(phase) * .012;
  let squashY = 1 - Math.sin(phase) * .01;
  let tilt = Math.sin(phase * .7) * .35;
  let seal = .76 + Math.sin(phase + .4) * .035;
  let holePulse = 1 + Math.sin(phase * 1.1) * .012;
  let wetness = .66 + Math.sin(phase * .85) * .08;
  let leak = .23 + Math.sin(phase * 1.35) * .035;
  let leakStretch = .86 + Math.sin(phase * 1.1) * .035;
  let leakShift = 0;
  let flash = 0;

  if (state === "pour") {
    const t = clamp(elapsed / STATE_CONFIG.pour.duration);
    const pressure = Math.sin(t * Math.PI);
    const settle = Math.sin(clamp(t * 1.35) * Math.PI);
    x = -5.6 * pressure;
    y = 2.4 * pressure;
    squashX = 1 + pressure * .095;
    squashY = 1 - pressure * .12;
    tilt = -2.8 * pressure;
    seal = .82 + pressure * .18;
    holePulse = 1 - pressure * .055;
    wetness = .78 + settle * .17;
    leak = .22 - pressure * .17;
    leakStretch = .8 - pressure * .22;
    leakShift = -pressure * 3;
  } else if (state === "hit") {
    const t = clamp(elapsed / STATE_CONFIG.hit.duration);
    const recoil = Math.sin(t * Math.PI) * (1 - t * .25);
    const shake = Math.sin(t * Math.PI * 7) * (1 - t);
    x = 13.5 * recoil + shake * 2.2;
    y = -4.5 * recoil + Math.abs(shake) * 1.2;
    squashX = 1 - recoil * .055;
    squashY = 1 + recoil * .09;
    tilt = 7.5 * recoil + shake * 1.5;
    seal = clamp(.72 - recoil * .66);
    holePulse = 1 + recoil * .12;
    wetness = .84 + recoil * .16;
    leak = .28 + recoil * .72;
    leakStretch = .9 + recoil * .46;
    leakShift = recoil * 8;
    flash = Math.sin(clamp(t / .42) * Math.PI);
  } else if (state === "clear") {
    const t = clamp(elapsed / STATE_CONFIG.clear.duration);
    const bounce = Math.abs(Math.sin(t * Math.PI * 3)) * (1 - t);
    x = -3.8;
    y = -bounce * 8;
    squashX = 1 + bounce * .055;
    squashY = 1 - bounce * .045;
    tilt = Math.sin(t * Math.PI * 4) * 3 * (1 - t);
    seal = .98;
    holePulse = .95;
    wetness = .58;
    leak = .025;
    leakStretch = .45;
    flash = bounce * .42;
  } else if (state === "over") {
    const t = clamp(elapsed / STATE_CONFIG.over.duration);
    const slump = Math.sin(Math.min(1, t * 1.35) * Math.PI / 2);
    x = 11 * slump;
    y = 9 * slump;
    squashX = 1 + slump * .11;
    squashY = 1 - slump * .24;
    tilt = 8 * slump;
    seal = .08 * (1 - slump);
    holePulse = 1 + slump * .08;
    wetness = 1;
    leak = .34 + slump * .66;
    leakStretch = .95 + slump * .5;
    leakShift = slump * 9;
  }

  set(root, "--toad-contact-x", `${x.toFixed(2)}px`);
  set(root, "--toad-contact-y", `${y.toFixed(2)}px`);
  set(root, "--toad-squash-x", squashX.toFixed(4));
  set(root, "--toad-squash-y", squashY.toFixed(4));
  set(root, "--toad-tilt", `${tilt.toFixed(2)}deg`);
  set(root, "--seal-pressure", clamp(seal).toFixed(3));
  set(root, "--hole-pulse", Math.max(.84, holePulse).toFixed(4));
  set(root, "--hole-wetness", clamp(wetness).toFixed(3));
  set(root, "--leak-strength", clamp(leak).toFixed(3));
  set(root, "--leak-stretch", Math.max(.35, leakStretch).toFixed(3));
  set(root, "--leak-shift-x", `${leakShift.toFixed(2)}px`);
  set(root, "--impact-flash", clamp(flash).toFixed(3));
}

export function mountSixtyFrameAnimation(root, { motionEnabled = true, preview = false } = {}) {
  if (!root) return null;
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let enabled = Boolean(motionEnabled && !reducedMotion);
  let state = "idle";
  let stateStartedAt = performance.now();
  let paused = false;
  let raf = 0;
  let lastKongFrame = -1;
  let lastToadFrame = -1;

  root.classList.add("real-sprite-art");
  root.classList.toggle("motion-60", enabled);

  const setState = (next, restart = true) => {
    if (!STATE_CONFIG[next]) next = "idle";
    if (state !== next || restart) {
      state = next;
      stateStartedAt = performance.now();
      root.dataset.animationState = state;
      lastKongFrame = -1;
      lastToadFrame = -1;
    }
  };

  const applyFrame = time => {
    let config = STATE_CONFIG[state] || STATE_CONFIG.idle;
    let elapsed = Math.max(0, time - stateStartedAt);

    if (!config.loop && elapsed >= config.duration) {
      state = "idle";
      stateStartedAt = time;
      root.dataset.animationState = state;
      config = STATE_CONFIG.idle;
      elapsed = 0;
    }

    const kongFrame = enabled ? frameAt(config.kong, config, elapsed) : 0;
    const toadFrame = enabled ? frameAt(config.toad, config, elapsed) : 0;

    if (kongFrame !== lastKongFrame) {
      set(root, "--kong-frame-x", pct(kongFrame));
      set(root, "--tool-frame-x", pct(kongFrame));
      lastKongFrame = kongFrame;
    }
    if (toadFrame !== lastToadFrame) {
      set(root, "--toad-frame-x", pct(toadFrame));
      lastToadFrame = toadFrame;
    }

    if (enabled) {
      applyWaterMotion(root, state, elapsed);
      applySealMotion(root, state, elapsed);
    }
    root.dataset.animationFrame = String(Math.floor(elapsed / Math.max(1, config.duration) * FRAME_COUNT) % FRAME_COUNT).padStart(2, "0");
  };

  const loop = time => {
    if (!paused) applyFrame(time);
    raf = requestAnimationFrame(loop);
  };

  const onCorrect = () => setState("pour");
  const onWrong = () => setState("hit");
  const onClear = () => setState("clear");
  const onOver = () => setState("over");
  const onPause = () => { paused = true; };
  const onResume = () => { paused = false; stateStartedAt = performance.now(); };

  if (!preview) {
    addEventListener("answer:correct", onCorrect);
    addEventListener("answer:wrong", onWrong);
    addEventListener("answer:timeout", onWrong);
    addEventListener("action:spoon-hit", onWrong);
    addEventListener("action:bucket-smash", onWrong);
    addEventListener("game:clear", onClear);
    addEventListener("game:over", onOver);
    addEventListener("game:pause", onPause);
    addEventListener("game:resume", onResume);
  }

  root.dataset.animationState = state;
  raf = requestAnimationFrame(loop);

  return {
    setEnabled(value) {
      enabled = Boolean(value && !reducedMotion);
      root.classList.toggle("motion-60", enabled);
      if (!enabled) {
        set(root, "--kong-frame-x", "0%");
        set(root, "--tool-frame-x", "0%");
        set(root, "--toad-frame-x", "0%");
        applySealMotion(root, "idle", 0);
      }
    },
    setState,
    triggerPour() { setState("pour"); },
    triggerHit() { setState("hit"); },
    destroy() {
      cancelAnimationFrame(raf);
      if (!preview) {
        removeEventListener("answer:correct", onCorrect);
        removeEventListener("answer:wrong", onWrong);
        removeEventListener("answer:timeout", onWrong);
        removeEventListener("action:spoon-hit", onWrong);
        removeEventListener("action:bucket-smash", onWrong);
        removeEventListener("game:clear", onClear);
        removeEventListener("game:over", onOver);
        removeEventListener("game:pause", onPause);
        removeEventListener("game:resume", onResume);
      }
      root.classList.remove("motion-60");
      delete root.dataset.animationFrame;
      delete root.dataset.animationState;
    }
  };
}

export { FRAME_COUNT, SPRITE_FRAME_COUNT };
