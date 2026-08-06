#!/usr/bin/env node
import { chromium } from "playwright";

const baseUrl = process.env.SCENE_BASE_URL || "http://127.0.0.1:4173";
const path = "/%EC%BD%A9%EC%A5%90%EC%95%BC_%EC%A4%98%EB%95%8C%EC%8D%A8.html?training=atomic_number";
const cases = [
  ["mobile-portrait", { width: 390, height: 844 }],
  ["mobile-landscape", { width: 844, height: 390 }],
  ["desktop-1366", { width: 1366, height: 768 }],
  ["desktop-1920", { width: 1920, height: 1080 }]
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exerciseScene(browser, name, viewport, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedResponses = [];
  const staleRequestInitiators = [];
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  cdp.on("Network.requestWillBeSent", event => {
    if (/scene-photo|toad-expression-sprite\.webp/.test(event.request.url)) {
      staleRequestInitiators.push({ url: event.request.url, initiator: event.initiator });
    }
  });

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#layeredScene", { state: "attached" });
  await page.waitForFunction(() => {
    const app = document.getElementById("ui-gameApp");
    return app?.dataset.sceneRenderer === "layered-png";
  }, null, { timeout: 15000 });

  const geometry = await page.evaluate(() => {
    const stage = document.getElementById("visualStage").getBoundingClientRect();
    const stack = document.getElementById("layeredScene").getBoundingClientRect();
    const visible = [...document.querySelectorAll(
      "#layeredScene > .scene-kongjwi, #layeredScene > .scene-tool, #layeredScene > .scene-jar-back, #layeredScene > .scene-toad-expression"
    )].filter(element => !element.hidden).map(element => {
      const box = element.getBoundingClientRect();
      return { className: element.className, left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    });
    return {
      stage: { left: stage.left, top: stage.top, right: stage.right, bottom: stage.bottom, width: stage.width, height: stage.height },
      stack: { left: stack.left, top: stack.top, right: stack.right, bottom: stack.bottom, width: stack.width, height: stack.height },
      visible
    };
  });

  const tolerance = 2;
  assert(geometry.stage.width > 0 && geometry.stage.height > 0, `${name}: visual stage has no layout box`);
  assert(geometry.stack.width > 0 && geometry.stack.height > 0, `${name}: layered scene has no layout box`);
  assert(geometry.stack.left >= geometry.stage.left - tolerance, `${name}: stack left crop`);
  assert(geometry.stack.right <= geometry.stage.right + tolerance, `${name}: stack right crop`);
  assert(geometry.stack.top >= geometry.stage.top - tolerance, `${name}: stack top crop`);
  assert(geometry.stack.bottom <= geometry.stage.bottom + tolerance, `${name}: stack bottom crop`);
  for (const actor of geometry.visible) {
    assert(actor.left >= geometry.stack.left - tolerance, `${name}: ${actor.className} left crop`);
    assert(actor.right <= geometry.stack.right + tolerance, `${name}: ${actor.className} right crop`);
    assert(actor.top >= geometry.stack.top - tolerance, `${name}: ${actor.className} top crop`);
    assert(actor.bottom <= geometry.stack.bottom + tolerance, `${name}: ${actor.className} bottom crop`);
  }

  const stateEvents = [
    ["answer:correct", { combo: 1, water: 82 }, "correct"],
    ["answer:wrong", {}, "wrong"],
    ["answer:wrong", {}, "wrong"],
    ["answer:wrong", {}, "wrong"],
    ["answer:timeout", {}, "timeout"],
    ["fever:start", { tier: 1 }, "fever"],
    ["game:clear", { water: 100 }, "clear"],
    ["game:over", { reason: "timeout" }, "over"],
    ["game:pause", {}, "pause"],
    ["game:resume", {}, "resume"]
  ];

  for (const [eventName, detail, expected] of stateEvents) {
    await page.evaluate(({ eventName, detail }) => {
      globalThis.dispatchEvent(new CustomEvent(eventName, { detail }));
    }, { eventName, detail });
    await page.waitForFunction(
      expectedState => document.getElementById("layeredScene")?.dataset.sceneState === expectedState,
      expected
    );
  }

  if (reducedMotion === "reduce") {
    const animation = await page.locator("#layeredScene .scene-kongjwi").evaluate(element =>
      getComputedStyle(element).animationName
    );
    assert(animation === "none", `${name}: reduced motion animation is ${animation}`);
  }

  if (staleRequestInitiators.length) {
    console.error(`STALE_REQUEST_INITIATORS ${name}\n${JSON.stringify(staleRequestInitiators, null, 2)}`);
  }
  assert(failedResponses.length === 0, `${name}: HTTP failures\n${failedResponses.join("\n")}`);
  assert(consoleErrors.length === 0, `${name}: console errors\n${consoleErrors.join("\n")}`);
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of cases) await exerciseScene(browser, name, viewport);
  await exerciseScene(browser, "reduced-motion", { width: 1366, height: 768 }, "reduce");
  console.log("Layered scene browser smoke test passed.");
} finally {
  await browser.close();
}
