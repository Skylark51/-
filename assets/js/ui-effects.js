import { STAGE_CONFIG } from "../../data/game-config.js";
import { GameStorage } from "./storage.js";

const PAGE = document.documentElement.dataset.page;
const SELECTION_KEY = "kongjuiya-training-selection";
const CATEGORIES = ["전체","원자 구조","주기적 성질","화학 결합","화학량론","산염기","산화환원","화학 반응"];
const PRESENTATION = {
  atomic_number:{category:"원자 구조",recommended:"쉬움",targetScore:3000},
  atomic_mass:{category:"주기적 성질",recommended:"보통",targetScore:3000},
  formula_mass:{category:"화학 결합",recommended:"보통",targetScore:3000},
  mole_mass:{category:"화학량론",recommended:"보통",targetScore:3000},
  oxidation_number:{category:"산화환원",recommended:"어려움",targetScore:3000},
  redox:{category:"화학 반응",recommended:"어려움",targetScore:3000}
};
const DIFFICULTY_NAMES={easy:"쉬움",normal:"보통",hard:"어려움"};
const storage=new GameStorage();
const $=id=>document.getElementById(id);
const number=value=>Number(value||0).toLocaleString("ko-KR");
const date=value=>value?new Date(value).toLocaleDateString("ko-KR"):"—";

function stageAt(index=0){return STAGE_CONFIG[Math.max(0,Math.min(STAGE_CONFIG.length-1,Number(index)||0))]}
function recordFor(stage){
  const direct=storage.data.statistics?.byTraining?.[stage.id]||{};
  const runs=(storage.data.recentRuns||[]).filter(run=>run.stageId===stage.id);
  const tagStats=Object.entries(storage.data.statistics?.byTag||{})
    .filter(([tag])=>stage.name.includes(tag)||stage.description.includes(tag))
    .map(([,value])=>value);
  const correct=direct.correct??tagStats.reduce((sum,item)=>sum+(item.correct||0),0);
  const wrong=direct.wrong??tagStats.reduce((sum,item)=>sum+(item.wrong||0),0);
  const attempts=correct+wrong;
  return {
    played:Boolean(runs.length||direct.plays),
    bestScore:direct.bestScore??Math.max(0,...runs.map(run=>run.score||0)),
    bestCombo:direct.bestCombo??0,
    feverCount:direct.bestFeverCount??direct.feverCount??0,
    accuracy:attempts?Math.round(correct/attempts*100):null,
    averageTime:direct.averageSolveTime??null,
    recentAt:direct.recentAt??runs[0]?.endedAt??null
  };
}

function saveSelection(stage,difficulty,resume=false){
  const selection={stageId:stage.id,stageIndex:STAGE_CONFIG.findIndex(item=>item.id===stage.id),difficulty,resume};
  sessionStorage.setItem(SELECTION_KEY,JSON.stringify(selection));
  location.href="콩쥐야_줘때써.html";
}

function initLobby(){
  let activeCategory="전체";
  let selectedStage=STAGE_CONFIG[0];

  function renderFilters(){
    $("categoryFilter").replaceChildren(...CATEGORIES.map(category=>{
      const button=document.createElement("button");button.type="button";button.textContent=category;
      button.classList.toggle("is-active",category===activeCategory);
      button.setAttribute("aria-pressed",String(category===activeCategory));
      button.addEventListener("click",()=>{activeCategory=category;renderFilters();renderTrainings()});
      return button;
    }));
    $("categorySelect").innerHTML=CATEGORIES.map(category=>`<option>${category}</option>`).join("");
    $("categorySelect").value=activeCategory;
  }

  function renderTrainings(){
    const list=STAGE_CONFIG.filter(stage=>activeCategory==="전체"||PRESENTATION[stage.id]?.category===activeCategory);
    $("trainingGrid").replaceChildren(...list.map(stage=>{
      const meta=PRESENTATION[stage.id];const record=recordFor(stage);
      const article=document.createElement("article");article.className="training-card";
      article.innerHTML=`<span class="card-category">${meta.category}</span><h3>${stage.name}</h3><p>${stage.description}</p><span class="recommended">권장 난도 · ${meta.recommended}</span><div class="training-metrics"><div><span>최고 점수</span><strong>${record.played?number(record.bestScore):"—"}</strong></div><div><span>최근 정답률</span><strong>${record.accuracy==null?"—":record.accuracy+"%"}</strong></div></div><button class="primary-button" type="button">훈련 시작</button>`;
      article.querySelector("button").addEventListener("click",()=>{selectedStage=stage;$("difficultyTitle").textContent=stage.name+" 난도 선택";$("difficultyDescription").textContent=stage.description;$("difficultyDialog").showModal()});
      return article;
    }));
    if(!list.length)$("trainingGrid").innerHTML='<p class="record-empty">현재 준비된 훈련이 없습니다.</p>';
  }

  function renderRecords(){
    $("recordGrid").replaceChildren(...STAGE_CONFIG.map(stage=>{
      const record=recordFor(stage);const article=document.createElement("article");article.className="record-card";
      article.innerHTML=record.played
        ?`<h3>${stage.name}</h3><dl><dt>최고 점수</dt><dd>${number(record.bestScore)}</dd><dt>최고 콤보</dt><dd>${record.bestCombo||"—"}</dd><dt>최고 피버 횟수</dt><dd>${record.feverCount||"—"}</dd><dt>정답률</dt><dd>${record.accuracy==null?"—":record.accuracy+"%"}</dd><dt>평균 풀이 시간</dt><dd>${record.averageTime==null?"—":record.averageTime.toFixed(1)+"초"}</dd><dt>최근 플레이</dt><dd>${date(record.recentAt)}</dd></dl>`
        :`<h3>${stage.name}</h3><p class="record-empty">아직 플레이 기록이 없습니다.</p>`;
      return article;
    }));
  }

  const run=storage.data.currentRun;
  if(run){
    const stage=stageAt(run.stageIndex);$("resumePanel").hidden=false;
    $("resumeSummary").textContent=`지난 훈련: ${stage.name} · 난도: ${DIFFICULTY_NAMES[run.difficulty]||"보통"} · 마지막 점수: ${number(run.score)}`;
    $("resumeButton").addEventListener("click",()=>saveSelection(stage,run.difficulty||"normal",true));
    $("freshButton").addEventListener("click",()=>{storage.clearCurrentRun();$("resumePanel").hidden=true});
  }

  $("categorySelect").addEventListener("change",event=>{activeCategory=event.target.value;renderFilters();renderTrainings()});
  document.querySelectorAll("[data-difficulty]").forEach(button=>button.addEventListener("click",()=>saveSelection(selectedStage,button.dataset.difficulty)));
  $("settingsButton").addEventListener("click",()=>{$("volumeSetting").value=storage.data.settings.volume;$("motionSetting").checked=storage.data.settings.animations!==false;$("settingsDialog").showModal()});
  $("settingsDialog").addEventListener("close",()=>{if($("settingsDialog").returnValue==="save"){storage.updateSettings({volume:Number($("volumeSetting").value),animations:$("motionSetting").checked});applyMotionSetting()}});
  renderFilters();renderTrainings();renderRecords();applyMotionSetting();
}

function applyMotionSetting(){document.documentElement.classList.toggle("reduce-motion",storage.data.settings.animations===false)}

async function initGame(){
  await import("./main.js");
  const api=globalThis.KongJuiYaGame;if(!api)throw new Error("게임 엔진을 불러오지 못했습니다.");
  let selection;
  try{selection=JSON.parse(sessionStorage.getItem(SELECTION_KEY)||"null")}catch{selection=null}
  const selectedStage=STAGE_CONFIG.find(stage=>stage.id===selection?.stageId)||STAGE_CONFIG[0];
  const selectedIndex=STAGE_CONFIG.findIndex(stage=>stage.id===selectedStage.id);
  const difficulty=selection?.difficulty||storage.data.settings.difficulty||"normal";
  const app=$("ui-gameApp");
  let questionCount=1,correctCount=0,wrongCount=0,bubbleTimer=0,stateTimer=0,feverTimerId=0;

  $("ui-trainingName").textContent=selectedStage.name;
  $("ui-trainingCategory").textContent=PRESENTATION[selectedStage.id]?.category||"화학 훈련";
  $("ui-difficultyLabel").textContent=DIFFICULTY_NAMES[difficulty]||"보통";
  $("ui-progressTraining").textContent=selectedStage.name+" 훈련";
  $("ui-targetScore").textContent=number(PRESENTATION[selectedStage.id]?.targetScore||3000);
  $("categoryLabel").textContent=selectedStage.name+" 훈련";

  function setClasses(add=[],remove=[]){app.classList.remove(...remove);app.classList.add(...add)}
  function transient(...classes){clearTimeout(stateTimer);setClasses(classes,["is-correct","is-wrong","is-pouring"]);stateTimer=setTimeout(()=>setClasses([],classes),900)}
  function status(text){$("ui-accessibleStatus").textContent=text}
  function syncCounts(){$("ui-questionCount").textContent=questionCount;$("ui-correctCount").textContent=correctCount;$("ui-wrongCount").textContent=wrongCount}
  function particles(count=9){
    const box=$("dropParticles");box.replaceChildren();
    if(document.documentElement.classList.contains("reduce-motion"))return;
    for(let i=0;i<count;i+=1){const drop=document.createElement("i");drop.style.left=`${52+Math.random()*22}%`;drop.style.top=`${38+Math.random()*22}%`;drop.style.setProperty("--dx",`${(Math.random()-.5)*150}px`);drop.style.setProperty("--dy",`${-30-Math.random()*130}px`);box.append(drop)}
    setTimeout(()=>box.replaceChildren(),900);
  }
  function showBubble(detail={}){
    if(!detail.text)return;
    const bubble=$("toadBubble");clearTimeout(bubbleTimer);bubble.hidden=false;bubble.dataset.style=detail.style||"normalCorrect";$("toadBubbleText").textContent=detail.text;
    bubbleTimer=setTimeout(()=>{bubble.hidden=true},Math.max(1800,Math.min(2500,detail.duration||2200)));
  }
  function setFeverCharge(detail={}){
    const value=Math.max(0,Math.min(100,detail.percent??(detail.max?detail.charge/detail.max*100:detail.charge??detail.value??0)));
    $("feverFill").style.width=value+"%";$("feverGauge").setAttribute("aria-valuenow",String(Math.round(value)));
  }
  function enterFever(detail={}){
    setClasses(["is-fever"],["is-fever-ending"]);$("feverLabel").textContent=`FEVER ${detail.level||detail.tier||""}`.trim();$("feverMultiplier").textContent=`×${detail.multiplier||2}`;status("피버가 시작되었습니다.");
    if(detail.remaining||detail.duration)startFeverTimer(detail.remaining||detail.duration);
  }
  function startFeverTimer(seconds){
    clearInterval(feverTimerId);let remaining=Number(seconds)||0;$("feverTimer").textContent=`피버 ${remaining.toFixed(1)}초 남음`;
    feverTimerId=setInterval(()=>{remaining=Math.max(0,remaining-.1);$("feverTimer").textContent=`피버 ${remaining.toFixed(1)}초 남음`;if(!remaining)clearInterval(feverTimerId)},100);
  }
  function endFever(){clearInterval(feverTimerId);setClasses(["is-fever-ending"],["is-fever"]);$("feverLabel").textContent="FEVER 준비";$("feverMultiplier").textContent="×1";$("feverTimer").textContent="빠르게 정답을 맞히면 피버가 충전됩니다.";setTimeout(()=>app.classList.remove("is-fever-ending"),700)}
  function pause(){api.game.togglePause()}
  function requestHome(){if(api.game.state.status==="running")api.game.pause();$("exitDialog").showModal()}
  function home(){location.href="index.html"}

  $("ui-answerForm").addEventListener("submit",event=>event.preventDefault());
  for(const id of ["ui-pauseButton","ui-mobilePauseButton"])$(id).addEventListener("click",pause);
  for(const id of ["ui-homeButton","ui-mobileHomeButton"])$(id).addEventListener("click",requestHome);
  $("continueButton").addEventListener("click",()=>{if(api.game.state.status==="paused")api.game.resume()});
  $("confirmHomeButton").addEventListener("click",home);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();requestHome()}});

  addEventListener("toad:speak",event=>showBubble(event.detail));
  addEventListener("answer:correct",event=>{correctCount+=1;questionCount+=1;syncCounts();transient("is-correct","is-pouring");$("splash").textContent=`물 +${Math.round(event.detail.waterGain)} · +${event.detail.scoreGain}점`;particles(app.classList.contains("is-fever")?20:10)});
  addEventListener("answer:wrong",()=>{wrongCount+=1;questionCount+=1;syncCounts();transient("is-wrong")});
  addEventListener("answer:timeout",()=>{wrongCount+=1;questionCount+=1;syncCounts();transient("is-wrong")});
  addEventListener("water:warning",()=>{setClasses(["is-water-warning"],[]);status("물의 양이 부족합니다.")});
  addEventListener("water:critical",()=>{setClasses(["is-water-critical"],["is-water-warning"]);status("물의 양이 매우 부족합니다.")});
  addEventListener("game:pause",()=>{setClasses(["is-paused"],[]);for(const id of ["ui-pauseButton","ui-mobilePauseButton"])$(id).textContent="계속하기"});
  addEventListener("game:resume",()=>{setClasses([],["is-paused"]);for(const id of ["ui-pauseButton","ui-mobilePauseButton"])$(id).textContent="일시정지"});
  addEventListener("game:over",()=>{setClasses(["is-game-over"],["is-paused"]);status("게임 오버")});
  addEventListener("game:clear",()=>{setClasses(["is-game-clear"],["is-paused"]);status("게임 클리어")});
  addEventListener("stage:clear",event=>{if(event.detail.stage?.id!==selectedStage.id)return;setTimeout(()=>{api.game.pause();const panel=$("resultPanel");panel.classList.remove("hidden");panel.innerHTML=`<h2>${selectedStage.name} 훈련 완료</h2><p>점수 ${number(api.game.state.score)} · 정답 ${correctCount} · 오답 ${wrongCount}</p><button id="ui-resultHome" type="button">훈련 선택으로</button>`;$("ui-resultHome").addEventListener("click",home)},0)});
  addEventListener("fever:charge",event=>setFeverCharge(event.detail));
  addEventListener("fever:start",event=>enterFever(event.detail));
  addEventListener("fever:extend",event=>{enterFever(event.detail);status("피버 시간이 연장되었습니다.")});
  addEventListener("fever:end",endFever);

  applyMotionSetting();syncCounts();
  const resumeState=selection?.resume?storage.data.currentRun:{stageIndex:selectedIndex};
  api.start({difficulty,resumeState:resumeState||{stageIndex:selectedIndex}});
}

if(PAGE==="lobby")initLobby();
if(PAGE==="game")initGame().catch(error=>{console.error(error);document.body.innerHTML=`<main class="fatal-error"><h1>게임을 시작하지 못했습니다.</h1><p>${error.message}</p><a href="index.html">메인으로</a></main>`});
