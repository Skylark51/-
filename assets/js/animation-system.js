const FRAME_COUNT = 60;
const SPRITE_FRAME_COUNT = 8;
const repeat = sequence => Object.freeze(Array.from(
  { length: FRAME_COUNT },
  (_, index) => sequence[Math.floor(index / FRAME_COUNT * sequence.length)] ?? sequence.at(-1) ?? 0
));

export const IDLE_FRAMES = repeat([0, 0, 1, 1, 0, 1]);
export const POUR_FRAMES = repeat([2, 2, 3, 3, 4, 4, 5, 5, 6, 1]);
export const HIT_FRAMES = repeat([7, 7, 4, 3, 6, 1]);
export const CLEAR_FRAMES = repeat([1, 3, 1, 3, 6, 1]);
export const OVER_FRAMES = repeat([7, 7, 7, 4, 7, 7]);

const STATES = Object.freeze({
  idle: { frames: IDLE_FRAMES, duration: 1000, loop: true },
  pour: { frames: POUR_FRAMES, duration: 980, loop: false },
  hit: { frames: HIT_FRAMES, duration: 720, loop: false },
  clear: { frames: CLEAR_FRAMES, duration: 1180, loop: false },
  over: { frames: OVER_FRAMES, duration: 1300, loop: false }
});

export function mountSixtyFrameAnimation(root, { motionEnabled = true, preview = false } = {}) {
  if (!root) return null;
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let enabled = Boolean(motionEnabled && !reduced);
  let state = "idle";
  let startedAt = performance.now();
  let raf = 0;
  let paused = false;
  const listeners = [];
  const setState = next => {
    state = STATES[next] ? next : "idle";
    startedAt = performance.now();
    root.dataset.animationState = state;
  };
  const bind = (type, next) => {
    if (preview) return;
    const handler = () => setState(next);
    addEventListener(type, handler);
    listeners.push(() => removeEventListener(type, handler));
  };
  bind("answer:correct", "pour");
  bind("answer:wrong", "hit");
  bind("answer:timeout", "hit");
  bind("game:clear", "clear");
  bind("game:over", "over");
  const tick = now => {
    if (!paused) {
      const config = STATES[state];
      const elapsed = Math.max(0, now - startedAt);
      const progress = config.loop ? elapsed % config.duration / config.duration : Math.min(1, elapsed / config.duration);
      const index = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
      const frame = config.frames[index];
      root.style.setProperty("--kong-frame-x", `${frame / (SPRITE_FRAME_COUNT - 1) * 100}%`);
      root.dataset.animationFrame = String(index).padStart(2, "0");
      if (!config.loop && elapsed >= config.duration) setState("idle");
      if (enabled) root.classList.add("motion-60");
    }
    raf = requestAnimationFrame(tick);
  };
  root.dataset.animationState = state;
  raf = requestAnimationFrame(tick);
  return {
    setEnabled(value) { enabled = Boolean(value && !reduced); },
    setState,
    triggerPour() { setState("pour"); },
    triggerHit() { setState("hit"); },
    destroy() { cancelAnimationFrame(raf); listeners.splice(0).forEach(remove => remove()); }
  };
}

export { FRAME_COUNT, SPRITE_FRAME_COUNT };
