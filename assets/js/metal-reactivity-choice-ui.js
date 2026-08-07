const LABELS = Object.freeze({ "1": "좌", "2": "우" });

function activeMetalReactivityRoot() {
  const root = document.getElementById("ui-gameApp");
  return root?.dataset.trainingId === "metal_reactivity" ? root : null;
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
