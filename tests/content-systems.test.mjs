import test from"node:test";import assert from"node:assert/strict";
import{atomicNumberQuestions}from"../data/questions/atomic-number.js";
import{atomicMassQuestions}from"../data/questions/atomic-mass.js";
import{redoxQuestions}from"../data/questions/redox.js";
import{QUESTIONS,validateQuestions}from"../data/questions/index.js";
import{evaluateAnswer,getInputDescriptor,QuestionEngine}from"../assets/js/question-engine.js";
import{migrateSave,GameStorage,STORAGE_VERSION}from"../assets/js/storage.js";
import{UpgradeSystem}from"../assets/js/upgrade-system.js";
import{ActionSystem}from"../assets/js/action-system.js";
import{FeverSystem}from"../assets/js/fever-system.js";
import{FEVER_CONFIG}from"../data/game-config.js";

class MemoryStorage{constructor(value=null){this.value=value}getItem(){return this.value}setItem(_key,value){this.value=value}}
class Events{constructor(){this.types=[]}dispatchEvent(event){this.types.push({type:event.type,detail:event.detail});return true}}

test("전 문항은 공통 필드와 고유 id를 가진다",()=>{assert.deepEqual(validateQuestions(QUESTIONS),[]);assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,QUESTIONS.length)});
test("원자 번호는 1~20 기호→숫자 문제만 존재한다",()=>{assert.equal(atomicNumberQuestions.length,20);for(const q of atomicNumberQuestions){assert.match(q.prompt,/원소 기호 [A-Z][a-z]?의 원자 번호/);assert.equal(q.type,"numeric");assert.ok(Number(q.answers[0])>=1&&Number(q.answers[0])<=20)}});
test("원자량은 1~20 고정값을 정확히 채점한다",()=>{assert.equal(atomicMassQuestions.length,20);const chlorine=atomicMassQuestions.find(q=>q.prompt.includes("Cl"));assert.equal(evaluateAnswer(chlorine,"35.5").correct,true);assert.equal(evaluateAnswer(chlorine,"35.45").correct,false);assert.equal(evaluateAnswer(chlorine,"35.6").correct,false)});
test("산화-환원 판단은 1·2·3 선택과 자동 제출 메타데이터를 제공한다",()=>{assert.equal(redoxQuestions.length,30);for(const q of redoxQuestions){const input=getInputDescriptor(q);assert.equal(q.type,"multiple_choice");assert.deepEqual(input.keyboardShortcuts,["1","2","3"]);assert.deepEqual(input.allowedKeys,["1","2","3"]);assert.equal(input.autoSubmit,true);assert.equal(evaluateAnswer(q,String(q.correctChoice+1)).correct,true)}});
test("문항 엔진은 연속 중복을 피하고 훈련을 섞지 않는다",()=>{const engine=new QuestionEngine(atomicNumberQuestions,{random:()=>.5,retryProbability:0});const a=engine.next({trainingId:"atomic_number"}),b=engine.next({trainingId:"atomic_number"});assert.notEqual(a.id,b.id);assert.equal(b.trainingId,"atomic_number")});
test("v1·v2 저장 데이터는 기록을 보존하며 v3으로 이동한다",()=>{const v1=migrateSave({version:1,profile:{bestScore:99},statistics:{plays:2},settings:{volume:.2}});assert.equal(v1.version,STORAGE_VERSION);assert.equal(v1.statistics.legacy.bestScore,99);const v2=migrateSave({version:2,statistics:{atomic_number:{bestScore:321}},currentRun:{trainingId:"atomic_number"}});assert.equal(v2.statistics.atomic_number.bestScore,321);assert.equal(v2.economy.beans,0);assert.equal(v2.settings.deviceMode,"auto")});
test("업그레이드 구매는 콩 부족·최대 레벨·저장을 검증한다",()=>{const storage=new GameStorage(new MemoryStorage()),upgrades=new UpgradeSystem(storage);assert.equal(upgrades.purchase("bucket_level").reason,"insufficient_beans");storage.data.economy.beans=100;assert.equal(upgrades.purchase("bucket_level").ok,true);assert.equal(upgrades.level("bucket_level"),1);storage.data.upgrades.bucket_level=5;assert.equal(upgrades.purchase("bucket_level").reason,"max_level")});
test("액션은 숟가락·물대포·크리티컬·피니셔 이벤트와 보상을 낸다",()=>{const storage=new GameStorage(new MemoryStorage());storage.data.upgrades.spoon_level=5;storage.data.upgrades.water_power_level=5;const upgrades=new UpgradeSystem(storage),events=new Events(),actions=new ActionSystem({storage,upgrades,eventTarget:events,random:()=>0});const result=actions.correct({combo:10,fever:true,trainingId:"redox",baseWaterGain:10});for(const type of["action:critical-hit","action:spoon-hit","action:bucket-smash","action:water-cannon","action:combo-finisher","currency:earned"])assert.ok(events.types.some(event=>event.type===type));assert.equal(result.waterMultiplier,1.5);assert.ok(storage.data.economy.beans>0)});
test("피버 업그레이드는 상한 안에서 지속·배율·변신을 계산한다",()=>{const storage=new GameStorage(new MemoryStorage());storage.data.upgrades.fever_level=5;const upgrades=new UpgradeSystem(storage),fever=new FeverSystem(FEVER_CONFIG,upgrades),values=fever.values(10);assert.equal(values.duration,12);assert.ok(values.scoreMultiplier<=3);assert.equal(values.tier,2);assert.equal(fever.form(5,20),"overdrive")});
