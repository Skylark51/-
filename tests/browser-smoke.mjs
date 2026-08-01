import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = resolve(root, "artifacts", "qa");
const browsers = [
  process.env.BROWSER_BIN,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);
const browserPath = browsers.find(existsSync);
assert.ok(browserPath, "Chrome 또는 Edge 실행 파일을 찾지 못했습니다.");

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"]
]);

function startServer() {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = normalize(resolve(root, relative));
    if (!target.startsWith(`${root}${sep}`) || !existsSync(target)) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": mime.get(extname(target)) || "application/octet-stream",
      "cache-control": "no-store"
    });
    createReadStream(target).pipe(response);
  });
  return new Promise(resolvePromise => server.listen(0, "127.0.0.1", () => resolvePromise(server)));
}

function delay(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
}

async function waitForFile(path, timeout = 12_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (existsSync(path)) return readFileSync(path, "utf8");
    await delay(50);
  }
  throw new Error(`브라우저 디버그 포트 파일 대기 시간 초과: ${path}`);
}

class CdpClient {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolvePromise, reject) => {
      this.socket.addEventListener("open", resolvePromise, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", event => this.receive(JSON.parse(event.data)));
  }

  receive(message) {
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result);
      return;
    }
    for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    const waiter = this.waiters.get(message.method)?.shift();
    if (waiter) waiter.resolve(message.params);
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  wait(method, timeout = 10_000) {
    return new Promise((resolvePromise, reject) => {
      const queue = this.waiters.get(method) || [];
      const record = { resolve: value => { clearTimeout(record.timer); resolvePromise(value); } };
      record.timer = setTimeout(() => {
        this.waiters.set(method, (this.waiters.get(method) || []).filter(item => item !== record));
        reject(new Error(`${method} 이벤트 대기 시간 초과`));
      }, timeout);
      queue.push(record);
      this.waiters.set(method, queue);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(client, url) {
  const loaded = client.wait("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await loaded;
}

async function setViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile: true
  });
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
}

async function waitForGame(client) {
  return evaluate(client, `new Promise((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      if (globalThis.KongJuiYaGame?.game?.question && globalThis.KongJuiYaGame.game.state.status === "running") return resolve(true);
      if (performance.now() - started > 8000) return reject(new Error("게임 초기화 시간 초과"));
      setTimeout(check, 25);
    };
    check();
  })`);
}

async function gameLayout(client) {
  return evaluate(client, `(() => {
    const box = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { x:rect.x, y:rect.y, width:rect.width, height:rect.height, right:rect.right, bottom:rect.bottom, display:style.display, visibility:style.visibility };
    };
    const keyHeights = [...document.querySelectorAll("#ui-mobileKeypad button")].map(node => node.getBoundingClientRect().height);
    return {
      title: document.title,
      device: document.documentElement.dataset.deviceLayout,
      viewport: { width:innerWidth, height:innerHeight },
      scroll: { width:document.documentElement.scrollWidth, height:document.documentElement.scrollHeight },
      stage: box("#visualStage"),
      jar: box(".jar"),
      toad: box(".toad"),
      prompt: box("#questionText"),
      dock: box("#ui-mobileInputDock"),
      keypad: box("#ui-mobileKeypad"),
      toolbar: box(".game-bottom-toolbar"),
      fallback: box("#ui-answerForm"),
      keyCount: keyHeights.length,
      minKeyHeight: keyHeights.length ? Math.min(...keyHeights) : 0,
      status: globalThis.KongJuiYaGame?.game?.state?.status,
      questionId: globalThis.KongJuiYaGame?.game?.question?.id,
      inputMode: globalThis.KongJuiYaGame?.game?.snapshot?.().questionInput?.inputMode
    };
  })()`);
}

function assertVisible(box, viewport, label) {
  assert.ok(box, `${label} DOM 없음`);
  assert.notEqual(box.display, "none", `${label} display:none`);
  assert.notEqual(box.visibility, "hidden", `${label} visibility:hidden`);
  assert.ok(box.width > 0 && box.height > 0, `${label} 크기 없음`);
  assert.ok(box.x >= -2 && box.right <= viewport.width + 2, `${label} 가로 잘림`);
  assert.ok(box.y >= -2 && box.bottom <= viewport.height + 2, `${label} 세로 잘림`);
}

const server = await startServer();
const address = server.address();
const base = `http://127.0.0.1:${address.port}`;
const profile = mkdtempSync(join(tmpdir(), "kongjuiya-browser-"));
const processHandle = spawn(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "about:blank"
], { stdio: "ignore", windowsHide: true });

let client;
try {
  const portText = await waitForFile(join(profile, "DevToolsActivePort"));
  const port = Number(portText.split(/\r?\n/, 1)[0]);
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
  const target = targets.find(item => item.type === "page");
  assert.ok(target?.webSocketDebuggerUrl, "브라우저 페이지 target을 찾지 못했습니다.");
  client = new CdpClient(target.webSocketDebuggerUrl);
  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("Log.enable")
  ]);

  const errors = [];
  client.on("Runtime.exceptionThrown", params => errors.push(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || "runtime exception"));
  client.on("Log.entryAdded", params => {
    if (["error", "warning"].includes(params.entry?.level)) errors.push(`${params.entry.level}: ${params.entry.text}`);
  });
  client.on("Runtime.consoleAPICalled", params => {
    if (params.type === "error") errors.push(params.args?.map(item => item.value || item.description).join(" ") || "console.error");
  });

  mkdirSync(artifacts, { recursive: true });
  await setViewport(client, 390, 844);
  await navigate(client, `${base}/index.html`);
  await evaluate(client, `localStorage.setItem("kongjuiya-device-mode", "mobile")`);
  await navigate(client, `${base}/index.html`);
  const lobby = await evaluate(client, `({title:document.title, hasModes:document.querySelectorAll("#trainingGrid .training-card").length, fakeChart:document.body.textContent.includes("1회") && !document.body.textContent.includes("아직 플레이 기록이 없습니다")})`);
  assert.equal(lobby.title, "콩쥐야 줘때써 - 화학편");
  assert.ok(lobby.hasModes >= 9, "로비 장독대 카드 부족");
  assert.equal(lobby.fakeChart, false, "빈 대시보드가 가짜 데이터를 표시함");
  const lobbyShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(artifacts, "lobby-390x844.png"), Buffer.from(lobbyShot.data, "base64"));

  const requiredModes = [
    "atomic_number", "atomic_mass", "period_group", "valence_electron", "electronegativity",
    "mole_mass", "gas_molar_volume", "redox", "acid_base"
  ];
  for (const mode of requiredModes) {
    await navigate(client, `${base}/콩쥐야_줘때써.html?training=${mode}`);
    await waitForGame(client);
    const ready = await evaluate(client, `({training:globalThis.KongJuiYaGame.game.state.trainingId, question:globalThis.KongJuiYaGame.game.question?.id, keypad:document.querySelectorAll("#ui-mobileKeypad").length, dock:document.querySelector("#ui-mobileKeypad")?.parentElement?.id})`);
    assert.equal(ready.training, mode, `${mode}: 잘못된 장독대 시작`);
    assert.ok(ready.question, `${mode}: 문제 없음`);
    assert.equal(ready.keypad, 1, `${mode}: 키패드 중복/누락`);
    assert.equal(ready.dock, "ui-mobileInputDock", `${mode}: 키패드 dock 배치 실패`);
  }

  const viewports = [[320,568],[360,640],[375,667],[390,844],[412,915],[844,390]];
  for (const [width, height] of viewports) {
    await setViewport(client, width, height);
    await navigate(client, `${base}/콩쥐야_줘때써.html?training=atomic_number`);
    await waitForGame(client);
    const layout = await gameLayout(client);
    assert.equal(layout.title, "콩쥐야 줘때써 - 화학편");
    assert.equal(layout.device, "mobile", `${width}x${height}: 모바일 레이아웃 아님`);
    assert.ok(layout.scroll.width <= width + 2, `${width}x${height}: 가로 스크롤`);
    assert.ok(layout.scroll.height <= height + 2, `${width}x${height}: 세로 스크롤`);
    for (const [label, box] of [["장면",layout.stage],["장독대",layout.jar],["두꺼비",layout.toad],["문제",layout.prompt],["키패드",layout.keypad],["툴바",layout.toolbar]]) assertVisible(box, layout.viewport, `${width}x${height} ${label}`);
    assert.ok(layout.jar.height >= layout.stage.height * 0.55, `${width}x${height}: 장독대가 지나치게 작음`);
    assert.ok(layout.keyCount >= 12, `${width}x${height}: 숫자 키 부족`);
    assert.ok(layout.minKeyHeight >= 47, `${width}x${height}: 최소 터치 높이 ${layout.minKeyHeight}`);
  }

  await setViewport(client, 390, 844);
  await navigate(client, `${base}/콩쥐야_줘때써.html?training=atomic_number`);
  await waitForGame(client);
  const keypadResult = await evaluate(client, `new Promise((resolve, reject) => {
    const api = globalThis.KongJuiYaGame;
    const before = api.game.question.id;
    const answer = String(api.game.question.answers[0]);
    const buttons = [...document.querySelectorAll("#ui-mobileKeypad button")];
    for (const digit of answer) {
      const button = buttons.find(node => node.textContent.trim() === digit);
      if (!button) return reject(new Error("숫자 키 없음: " + digit));
      button.click();
    }
    const submit = buttons.find(node => node.textContent.includes("제출"));
    if (!submit) return reject(new Error("제출 키 없음"));
    submit.click();
    const started = performance.now();
    const check = () => {
      if (api.game.question?.id !== before) return resolve({before, after:api.game.question.id, score:api.game.state.score});
      if (performance.now() - started > 1500) return reject(new Error("키패드 제출 후 문제 전환 실패"));
      setTimeout(check, 20);
    };
    check();
  })`);
  assert.notEqual(keypadResult.before, keypadResult.after);
  assert.ok(keypadResult.score > 0, "키패드 정답 점수 반영 실패");
  const gameShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(artifacts, "game-390x844.png"), Buffer.from(gameShot.data, "base64"));

  assert.deepEqual(errors, [], `브라우저 오류:\n${errors.join("\n")}`);
  console.log(`browser smoke: PASS (${requiredModes.length} modes, ${viewports.length} viewports)`);
  console.log(`screenshots: ${artifacts}`);
} finally {
  client?.close();
  processHandle.kill();
  await new Promise(resolvePromise => server.close(resolvePromise));
  rmSync(profile, { recursive: true, force: true });
}
