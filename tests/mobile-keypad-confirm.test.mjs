import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const keypad = await readFile(resolve(root, "assets/js/mobile-keypad.js"), "utf8");

assert.match(keypad, /keypad-actions/);
assert.match(keypad, /createButton\("확인"/);
assert.match(keypad, /repeat\(4, minmax/);
assert.doesNotMatch(keypad, /createButton\("제출"/);

console.log("mobile-keypad-confirm: fixed confirmation row is present");
