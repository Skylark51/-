const FRAME_COUNT = 60;
const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeInOut = value => value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
const easeOutBack = value => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
};

const IDLE_FRAMES = Object.freeze(Array.from({ length: FRAME_COUNT }, (_, frame) => {
  const phase = frame / FRAME_COUNT * TAU;
  return Object.freeze({
    kongY: Math.sin(phase) * 1.4,
    kongRotate: Math.sin(phase + .8) * .35,
    toadX: 1 + Math.sin(phase + 1.3) * .012,
    toadY: 1 - Math.sin(phase + 1.3) * .018,
    toadYPos: Math.sin(phase + 2.2) * .7,
    waterY: Math.sin(phase * 1.15) * 2.4,
    waterX: 1 + Math.cos(phase * .95) * .025
  });
}));

const POUR_FRAMES = Object.freeze(Array.from({ length: FRAME_COUNT }, (_, frame) => {
  const t = frame / (FRAME_COUNT - 1);
  const lift = t < .28 ? easeOutBack(t / .28) : 1;
  const hold = t < .78 ? 1 : 1 - easeInOut((t - .78) / .22);
  const visible = clamp(Math.min(t / .14, (1 - t) / .12));
  return Object.freeze({
    kongY: -2.5 * lift * hold,
    kongRotate: 6.5 * lift * hold,
    toadX: 1 + visible * .045,
    toadY: 1 - visible * .08,
    toadYPos: visible * 3,
    streamOpacity: visible,
    streamLength: .18 + visible * .9,
    streamThickness: .68 + Math.sin(t * Math.PI) * .34,
    streamAngle: 18 + Math.sin(t * Math.PI) * 3.5
  });
}));

const HIT_FRAMES = Object.freeze(Array.from({ length: FRAME_COUNT }, (_, frame) => {
  const t = frame / (FRAME_COUNT - 1);
  const pulse = Math.sin(t * Math.PI);
  return Object.freeze({
    toadX: 1 + pulse * .11,
    toadY: 1 - pulse * .17,
    toadYPos: pulse * 7
  });
}));

const set = (root, name, value) => root.style.setProperty(name, value);

export function mountSixtyFrameAnimation(root, { motionEnabled = true } = {}) {
  if (!root) return null;
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let enabled = Boolean(motionEnabled && !reduced);
  let raf = 0;
  let lastFrame = -1;
  let startAt = performance.now();
  let pourStartedAt = -Infinity;
  let hitStartedAt = -Infinity;
  let paused = false;

  root.classList.toggle("motion-60", enabled);

  const frameIndex = (time, start, duration = 1000) => {
    const progress = clamp((time - start) / duration);
    return Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
  };

  const applyFrame = (time) => {
    const idleIndex = Math.floor(((time - startAt) / 1000 * FRAME_COUNT) % FRAME_COUNT);
    if (idleIndex === lastFrame && time - pourStartedAt > 1000 && time - hitStartedAt > 720) return;
    lastFrame = idleIndex;
    const idle = IDLE_FRAMES[idleIndex];
    let kongY = idle.kongY;
    let kongRotate = idle.kongRotate;
    let toadX = idle.toadX;
    let toadY = idle.toadY;
    let toadYPos = idle.toadYPos;
    let streamOpacity = 0;
    let streamLength = .2;
    let streamThickness = .7;
    let streamAngle = 20;

    if (time - pourStartedAt <= 1000) {
      const pour = POUR_FRAMES[frameIndex(time, pourStartedAt, 1000)];
      kongY += pour.kongY;
      kongRotate += pour.kongRotate;
      toadX *= pour.toadX;
      toadY *= pour.toadY;
      toadYPos += pour.toadYPos;
      streamOpacity = pour.streamOpacity;
      streamLength = pour.streamLength;
      streamThickness = pour.streamThickness;
      streamAngle = pour.streamAngle;
    }

    if (time - hitStartedAt <= 720) {
      const hit = HIT_FRAMES[frameIndex(time, hitStartedAt, 720)];
      toadX *= hit.toadX;
      toadY *= hit.toadY;
      toadYPos += hit.toadYPos;
    }

    set(root, "--kong-idle-y", `${kongY.toFixed(2)}px`);
    set(root, "--kong-idle-rotate", `${kongRotate.toFixed(2)}deg`);
    set(root, "--toad-breathe-x", toadX.toFixed(4));
    set(root, "--toad-breathe-y", toadY.toFixed(4));
    set(root, "--toad-react-y", `${toadYPos.toFixed(2)}px`);
    set(root, "--water-wave-y", `${idle.waterY.toFixed(2)}px`);
    set(root, "--water-wave-x", idle.waterX.toFixed(4));
    set(root, "--pour-opacity", streamOpacity.toFixed(3));
    set(root, "--pour-length", streamLength.toFixed(3));
    set(root, "--pour-thickness", streamThickness.toFixed(3));
    set(root, "--pour-angle", `${streamAngle.toFixed(2)}deg`);
    root.dataset.animationFrame = String(idleIndex).padStart(2, "0");
  };

  const loop = time => {
    if (enabled && !paused) applyFrame(time);
    raf = requestAnimationFrame(loop);
  };

  const onCorrect = () => { pourStartedAt = performance.now(); };
  const onWrong = () => { hitStartedAt = performance.now(); };
  const onActionHit = () => { hitStartedAt = performance.now(); };
  const onPause = () => { paused = true; };
  const onResume = () => { paused = false; startAt = performance.now() - (lastFrame / FRAME_COUNT * 1000); };

  addEventListener("answer:correct", onCorrect);
  addEventListener("answer:wrong", onWrong);
  addEventListener("answer:timeout", onWrong);
  addEventListener("action:spoon-hit", onActionHit);
  addEventListener("action:bucket-smash", onActionHit);
  addEventListener("game:pause", onPause);
  addEventListener("game:resume", onResume);

  raf = requestAnimationFrame(loop);

  return {
    setEnabled(value) {
      enabled = Boolean(value && !reduced);
      root.classList.toggle("motion-60", enabled);
    },
    triggerPour() { pourStartedAt = performance.now(); },
    triggerHit() { hitStartedAt = performance.now(); },
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener("answer:correct", onCorrect);
      removeEventListener("answer:wrong", onWrong);
      removeEventListener("answer:timeout", onWrong);
      removeEventListener("action:spoon-hit", onActionHit);
      removeEventListener("action:bucket-smash", onActionHit);
      removeEventListener("game:pause", onPause);
      removeEventListener("game:resume", onResume);
      root.classList.remove("motion-60");
      delete root.dataset.animationFrame;
    }
  };
}

export { FRAME_COUNT, IDLE_FRAMES, POUR_FRAMES, HIT_FRAMES };
