const EVENT_TARGET = globalThis;
const TRANSIENT_FEEDBACK_STATES = new Set(["correct", "wrong", "timeout"]);

const EVENT_TO_STATE = Object.freeze({
  "game:start": "idle",
  "question:changed": "question",
  "answer:correct": "correct",
  "answer:wrong": "wrong",
  "answer:timeout": "timeout",
  "water:warning": "warning",
  "water:critical": "critical",
  "fever:start": "fever",
  "game:clear": "clear",
  "game:over": "over",
  "game:pause": "pause",
  "game:resume": "resume"
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function reducedMotionRequested() {
  return Boolean(
    document.documentElement.classList.contains("reduce-motion") ||
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
}

export class LayeredSceneStateController {
  constructor(renderer, manifest) {
    this.renderer = renderer;
    this.manifest = manifest;
    this.state = "idle";
    this.wrongStreak = 0;
    this.disposed = false;
    this.animationToken = 0;
    this.timers = new Set();
    this.removers = [];
    this.bindEvents();
    this.apply("idle");
  }

  bindEvents() {
    for (const [eventName, state] of Object.entries(EVENT_TO_STATE)) {
      const handler = event => {
        const detail = event?.detail || {};
        if (eventName === "question:changed" && TRANSIENT_FEEDBACK_STATES.has(this.state)) {
          this.syncWater(detail);
          return;
        }
        this.apply(state, detail);
      };
      EVENT_TARGET.addEventListener(eventName, handler);
      this.removers.push(() => EVENT_TARGET.removeEventListener(eventName, handler));
    }

    for (const eventName of ["water:changed", "water:change", "game:tick"]) {
      const handler = event => this.syncWater(event?.detail || {});
      EVENT_TARGET.addEventListener(eventName, handler);
      this.removers.push(() => EVENT_TARGET.removeEventListener(eventName, handler));
    }
  }

  syncWater(detail = {}) {
    const value =
      detail.water ??
      detail.waterLevel ??
      detail.state?.water ??
      detail.gameState?.water;
    if (Number.isFinite(Number(value))) this.renderer.setWaterLevel(clamp(value, 0, 100));
  }

  clearTimers() {
    for (const timer of this.timers) globalThis.clearTimeout(timer);
    this.timers.clear();
    this.animationToken += 1;
  }

  schedule(callback, delay) {
    const timer = globalThis.setTimeout(() => {
      this.timers.delete(timer);
      if (!this.disposed) callback();
    }, Math.max(0, delay));
    this.timers.add(timer);
    return timer;
  }

  playSequence(layerName, frames, duration, { loop = false, hold = false } = {}) {
    if (!Array.isArray(frames) || !frames.length) return;
    const reduced = reducedMotionRequested();
    if (reduced || frames.length === 1) {
      this.renderer.setFrame(layerName, frames.at(-1));
      return;
    }

    const token = this.animationToken;
    const interval = Math.max(32, duration / frames.length);
    frames.forEach((frame, index) => {
      this.schedule(() => {
        if (token !== this.animationToken) return;
        this.renderer.setFrame(layerName, frame);
      }, index * interval);
    });

    if (loop) {
      this.schedule(() => {
        if (token !== this.animationToken) return;
        this.playSequence(layerName, frames, duration, { loop, hold });
      }, duration);
    } else if (!hold) {
      this.schedule(() => {
        if (token !== this.animationToken) return;
        this.renderer.setFrame(layerName, 0);
      }, duration + 16);
    }
  }

  apply(nextState, detail = {}) {
    if (this.disposed) return;
    this.clearTimers();
    this.state = nextState;
    this.renderer.setState(nextState);
    this.syncWater(detail);

    const sequences = this.manifest.frames?.sequences || {};
    switch (nextState) {
      case "idle":
      case "resume":
        this.wrongStreak = 0;
        this.renderer.setExpression("default");
        this.playSequence("kongjwi", sequences.idle?.kongjwi || [0, 1, 0], 1800, { loop: true });
        this.playSequence("tool", [0, 1, 0], 1800, { loop: true });
        break;

      case "question":
        this.renderer.setExpression("idle-blink");
        this.playSequence("kongjwi", [0, 1, 0], 620);
        this.playSequence("tool", [0, 1, 0], 620);
        this.schedule(() => this.renderer.setExpression("default"), 680);
        break;

      case "correct": {
        this.wrongStreak = 0;
        const combo = Number(detail.combo || detail.streak || 0);
        this.renderer.setExpression(combo >= 3 ? "combo" : "correct");
        const plan = sequences.answerCorrect || {};
        this.playSequence("kongjwi", plan.kongjwi || [2, 3, 4, 5, 6], 1180);
        this.playSequence("tool", plan.tool || [2, 3, 4, 5, 6], 1180);
        this.playSequence("waterStream", plan.waterStream || [1, 2, 3, 4, 5, 6, 7], 1040);
        this.playSequence("waterSplash", plan.waterSplash || [1, 2, 3, 4, 5], 900);
        this.schedule(() => this.apply("question"), 1240);
        break;
      }

      case "wrong":
        this.wrongStreak += 1;
        this.renderer.setExpression(
          this.wrongStreak >= 3 ? "rage" : this.wrongStreak === 2 ? "angry" : "wrong"
        );
        this.playSequence("kongjwi", sequences.answerWrong?.kongjwi || [7], 560, { hold: true });
        this.playSequence("tool", [7], 560, { hold: true });
        this.schedule(() => this.apply("question"), 680);
        break;

      case "timeout":
        this.wrongStreak += 1;
        this.renderer.setExpression("timeout");
        this.playSequence("kongjwi", [7], 700, { hold: true });
        this.playSequence("tool", [7], 700, { hold: true });
        this.schedule(() => this.apply("question"), 820);
        break;

      case "warning":
        this.renderer.setExpression("confused");
        break;

      case "critical":
        this.renderer.setExpression(this.wrongStreak >= 2 ? "rage" : "angry");
        break;

      case "fever":
        this.wrongStreak = 0;
        this.renderer.setExpression("combo");
        break;

      case "clear": {
        this.wrongStreak = 0;
        this.renderer.setWaterLevel(100);
        this.renderer.setExpression(Number(detail.combo || 0) >= 3 ? "combo" : "correct");
        const plan = sequences.answerCorrect || {};
        this.playSequence("kongjwi", plan.kongjwi || [2, 3, 4, 5, 6], 1180, { hold: true });
        this.playSequence("tool", plan.tool || [2, 3, 4, 5, 6], 1180, { hold: true });
        this.playSequence("waterStream", plan.waterStream || [1, 2, 3, 4, 5, 6, 7], 1040);
        this.playSequence("waterSplash", plan.waterSplash || [1, 2, 3, 4, 5], 900);
        break;
      }

      case "over":
        this.renderer.setExpression(detail.reason === "timeout" ? "timeout" : "wrong");
        this.playSequence("kongjwi", [7], 700, { hold: true });
        this.playSequence("tool", [7], 700, { hold: true });
        break;

      case "pause":
        this.renderer.setExpression("idle-blink");
        this.renderer.setFrame("kongjwi", 1);
        this.renderer.setFrame("tool", 1);
        break;

      default:
        this.renderer.setExpression("default");
        break;
    }
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTimers();
    this.removers.splice(0).forEach(remove => remove());
  }
}

export function createSceneStateController(renderer, manifest) {
  return new LayeredSceneStateController(renderer, manifest);
}
