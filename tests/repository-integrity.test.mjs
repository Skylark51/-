import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = ["index.html", "콩쥐야_줘때써.html"];
const emergencyFiles = [
  "assets/css/ui-v3.css",
  "assets/css/mobile-dashboard-v4.css",
  "assets/css/mobile-input-v5.css",
  "assets/js/mobile-input-rescue.js",
  "assets/js/frontend-effects.js",
  "assets/js/dashboard-v4.js",
  "main"
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function source(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function localTarget(owner, reference) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || /^(?:[a-z]+:|#|\/\/)/i.test(clean)) return null;
  return resolve(dirname(owner), decodeURIComponent(clean));
}

function balancedCss(text) {
  let depth = 0;
  let quote = null;
  let comment = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (comment) {
      if (char === "*" && next === "/") { comment = false; index += 1; }
      continue;
    }
    if (!quote && char === "/" && next === "*") { comment = true; index += 1; continue; }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0 && !quote && !comment;
}

test("HTML IDs are unique and every local asset exists", () => {
  for (const file of htmlFiles) {
    const path = resolve(root, file);
    const text = readFileSync(path, "utf8");
    const ids = [...text.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate DOM id`);
    for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
      const target = localTarget(path, match[1]);
      if (target) assert.ok(existsSync(target), `${file}: missing ${relative(root, target)}`);
    }
  }
});

test("all relative JavaScript module imports resolve", () => {
  const files = walk(root).filter(path => [".js", ".mjs"].includes(extname(path)) && !path.includes(`${join(root, "node_modules")}`));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const references = [
      ...text.matchAll(/\b(?:import|export)\s+(?:[^"']*?\s+from\s*)?["']([^"']+)["']/g),
      ...text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)
    ];
    for (const match of references) {
      const target = localTarget(file, match[1]);
      if (target) assert.ok(existsSync(target), `${relative(root, file)}: missing ${relative(root, target)}`);
    }
  }
});

test("JavaScript syntax and CSS braces are valid", () => {
  for (const file of walk(root)) {
    if ([".js", ".mjs"].includes(extname(file))) {
      const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
      assert.equal(result.status, 0, `${relative(root, file)}\n${result.stderr}`);
    }
    if (extname(file) === ".css") {
      assert.ok(balancedCss(readFileSync(file, "utf8")), `${relative(root, file)}: unbalanced CSS`);
    }
  }
});

test("official title and public wording contract are exact", () => {
  const title = "콩쥐야 줘때써 - 화학편";
  const banned = /교육과정상|교육과정에 따르면|교육과정 기준|교과 과정상/;
  for (const file of htmlFiles) {
    const text = source(file);
    assert.match(text, new RegExp(`<title>${title}</title>`));
    assert.match(text, new RegExp(`<meta property="og:title" content="${title}">`));
    assert.match(text, new RegExp(`<meta name="twitter:title" content="${title}">`));
  }
  const publicSources = [
    ...htmlFiles.map(file => source(file)),
    ...walk(resolve(root, "assets/js")).map(path => readFileSync(path, "utf8")),
    ...walk(resolve(root, "data")).filter(path => extname(path) === ".js").map(path => readFileSync(path, "utf8"))
  ].join("\n");
  assert.doesNotMatch(publicSources, banned);
});

test("emergency patch layers and obsolete prototype are removed", () => {
  for (const file of emergencyFiles) assert.equal(existsSync(resolve(root, file)), false, file);
  const entrySources = htmlFiles.map(file => source(file)).join("\n");
  assert.doesNotMatch(entrySources, /(?:ui-v3|mobile-dashboard-v4|mobile-input-v5|mobile-input-rescue|dashboard-v4)/);
});
