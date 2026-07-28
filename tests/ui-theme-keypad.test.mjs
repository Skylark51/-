import test from"node:test";import assert from"node:assert/strict";import{readFile}from"node:fs/promises";
import{GAME_TITLE,JAR_THEMES,displayJarName,themeFor}from"../assets/js/theme-system.js";

test("고정 게임 제목이 두 HTML의 title·meta·화면에 존재한다",async()=>{for(const file of["index.html","콩쥐야_줘때써.html"]){const html=await readFile(new URL(`../${file}`,import.meta.url),"utf8");assert.match(html,new RegExp(`<title>${GAME_TITLE}</title>`));assert.match(html,new RegExp(`content=\"${GAME_TITLE}`));assert.doesNotMatch(html,/콩쥐야, 좋됐어|교육과정상|교육과정에 따르면|교육과정 기준|교과 과정상/)}});
test("25개 모드의 장독대 색상과 두꺼비 테마가 고유하다",()=>{const themes=Object.values(JAR_THEMES);assert.equal(themes.length,25);assert.equal(new Set(themes.map(theme=>theme.jarColor)).size,25);assert.equal(new Set(themes.map(theme=>theme.toad)).size,25)});
test("화면용 모드 이름은 장독대 채우기 형식이다",()=>{assert.equal(displayJarName({title:"원자 번호 훈련"}),"원자 번호 장독대 채우기");assert.equal(displayJarName({title:"산화환원 판단"}),"산화환원 판단 장독대 채우기")});
test("대표 장독대 테마가 지정값과 일치한다",()=>{assert.equal(themeFor("atomic_number").jar,"bronze");assert.equal(themeFor("redox").toad,"split");assert.equal(themeFor("acid_base").pattern,"yin-yang")});
test("모바일 키패드는 문항 메타데이터만 참조한다",async()=>{const code=await readFile(new URL("../assets/js/mobile-keypad.js",import.meta.url),"utf8");assert.match(code,/questionInput/);assert.match(code,/allowedKeys/);assert.match(code,/autoSubmit|inputMode/);assert.doesNotMatch(code,/prompt|questionText|includes\\(\"산화\"\\)/)});
