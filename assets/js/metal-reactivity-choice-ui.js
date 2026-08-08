const LABELS = Object.freeze({ "1": "좌", "2": "우" });
const STYLE_ID = "metal-reactivity-compact-choice-style";

function activeMetalReactivityRoot() {
  const root = document.getElementById("ui-gameApp");
  return root?.dataset.trainingId === "metal_reactivity" ? root : null;
}

function ensureMetalReactivityStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #ui-gameApp[data-training-id="metal_reactivity"] #ui-choiceOptions {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    #ui-gameApp[data-training-id="metal_reactivity"] #ui-choiceOptions button,
    #ui-gameApp[data-training-id="metal_reactivity"] .keypad-choice {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
    }

    /* Preserve authored proportions. No independent X/Y character stretch. */
    #ui-gameApp .scene-kongjwi > .scene-layer-image,
    #ui-gameApp .scene-toad-skin > .scene-layer-image,
    #ui-gameApp .scene-toad-expression > .scene-layer-image {
      object-fit: contain !important;
    }

    #ui-gameApp .scene-kongjwi > .scene-layer-image {
      object-position: center bottom !important;
    }

    #ui-gameApp .scene-toad-skin > .scene-layer-image,
    #ui-gameApp .scene-toad-expression > .scene-layer-image {
      object-position: center center !important;
    }

    /* Horizontal sprite sheets must keep one full frame mapped to the actor box.
   * The base scene runtime owns background-size: N*100% 100%. Setting the
   * height to auto makes the sheet taller than the actor box and clips the
   * top of each frame (the character head on mobile). */

    /* Toad reactions may scale uniformly, but never squash width or height. */
    @keyframes existing-toad-correct {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      42% { transform: translate3d(0, -3.6%, 0) scale(1.025); }
      72% { transform: translate3d(0, .8%, 0) scale(1.01); }
    }
    @keyframes existing-toad-droop {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(4.2%) scale(.97); }
    }

    @media (max-width: 900px), (pointer: coarse) {
      #ui-gameApp[data-training-id="metal_reactivity"] .question-panel {
        align-self: end !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }

      #ui-gameApp[data-training-id="metal_reactivity"] .question-answer-card {
        display: grid !important;
        grid-template-rows: auto auto !important;
        height: auto !important;
        min-height: 0 !important;
        padding: 6px !important;
        overflow: visible !important;
      }

      #ui-gameApp[data-training-id="metal_reactivity"] .mobile-input-dock:not([hidden]) {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }

      #ui-gameApp[data-training-id="metal_reactivity"] .mobile-keypad {
        display: grid !important;
        grid-template-rows: auto !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      #ui-gameApp[data-training-id="metal_reactivity"] .keypad-keys.is-choice {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        grid-template-rows: clamp(58px, 8dvh, 76px) !important;
        grid-auto-rows: clamp(58px, 8dvh, 76px) !important;
        width: 100% !important;
        height: clamp(58px, 8dvh, 76px) !important;
        min-height: 0 !important;
        gap: 7px !important;
        overflow: visible !important;
      }

      #ui-gameApp[data-training-id="metal_reactivity"] .keypad-choice {
        min-width: 0 !important;
        min-height: 0 !important;
        height: 100% !important;
        padding: 6px 8px !important;
        border-radius: 12px !important;
        font-size: clamp(15px, 4.2vw, 19px) !important;
        line-height: 1 !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
      }
    }
  `;
  document.head.append(style);
}

function relabel(button, key) {
  const label = LABELS[String(key)];
  if (!button || !label) return;
  if (button.textContent !== label) button.textContent = label;
  button.setAttribute("aria-label", `${label} 선택`);
}

export function syncMetalReactivityChoiceLabels() {
  const root = activeMetalReactivityRoot();
  if (!root) return;
  ensureMetalReactivityStyle();

  root.querySelectorAll("#ui-choiceOptions button[data-choice-key]").forEach(button => {
    relabel(button, button.dataset.choiceKey);
  });

  root.querySelectorAll("#ui-mobileKeypad .keypad-keys.is-choice .keypad-choice").forEach((button, index) => {
    relabel(button, String(index + 1));
  });
}

export function installMetalReactivityChoiceLabels() {
  const root = document.getElementById("ui-gameApp");
  if (!root) return null;

  ensureMetalReactivityStyle();
  const observer = new MutationObserver(syncMetalReactivityChoiceLabels);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-training-id"]
  });
  syncMetalReactivityChoiceLabels();
  return observer;
}
