import { GAME_CONFIG } from "../../data/game-config.js";
import { TRAINING_MODES, getTrainingMode } from "../../data/training-modes.js";
import { QUESTIONS, validateQuestions } from "../../data/questions.js";
import { QuestionEngine } from "./question-engine.js";
import { GameCore } from "./game-core.js";
import { GameStorage } from "./storage.js";
import { UIAdapter } from "./ui-adapter.js";
const errors=validateQuestions();if(errors.length)throw new Error(`문항 데이터 오류: ${errors.join(", ")}`);
const storage=new GameStorage(),questionEngine=new QuestionEngine(QUESTIONS),game=new GameCore({questionEngine,config:GAME_CONFIG}),ui=new UIAdapter();
const requestedId=new URLSearchParams(location.search).get("training");let selectedTrainingId=getTrainingMode(requestedId)?.id||null;let selectedDifficulty=storage.data.settings.difficulty||"normal",questionStartedAt=performance.now(),lastFrame=performance.now();
function saveRun(){if(["running","paused"].includes(game.state.status))storage.saveCurrentRun(game.snapshot())}
function selectTraining(id){selectedTrainingId=getTrainingMode(id)?.id||null;const url=new URL(location.href);selectedTrainingId?url.searchParams.set("training",selectedTrainingId):url.searchParams.delete("training");history.replaceState({},"",url)}
function start(options={}){if(!selectedTrainingId){ui.feedback("먼저 훈련을 선택해 주세요.","wrong");return}storage.startRun(selectedTrainingId,selectedDifficulty);game.start({trainingId:selectedTrainingId,difficulty:selectedDifficulty,...options});questionStartedAt=performance.now();saveRun();ui.clearAnswer()}
function submit(value){const result=game.submit(value??ui.answer());if(result.accepted){storage.recordAnswer(result.question,result.correct,false,performance.now()-questionStartedAt,game.state.difficulty);questionStartedAt=performance.now();saveRun();ui.clearAnswer();ui.render()}else if(result.reason==="empty")ui.feedback("정답을 입력해 주세요.","wrong")}
ui.bind(game,{start,submit,restart:start});ui.installTrainingSelector(TRAINING_MODES.map(m=>({...m,bestScore:storage.getTrainingStats(m.id).bestScore})),selectedTrainingId,selectTraining);ui.installDifficulty(selectedDifficulty,value=>{selectedDifficulty=value;storage.updateSettings({difficulty:value})});
game.on("answer:timeout",detail=>{storage.recordAnswer(detail.question,false,true,performance.now()-questionStartedAt,game.state.difficulty);questionStartedAt=performance.now();saveRun()});for(const type of ["answer:correct","answer:wrong","game:pause"])game.on(type,saveRun);for(const type of ["game:over","game:clear"])game.on(type,detail=>storage.finishRun(detail.state));
function frame(now){game.tick((now-lastFrame)/1000);lastFrame=now;if(["running","paused"].includes(game.state.status))ui.render();requestAnimationFrame(frame)}requestAnimationFrame(frame);
document.addEventListener("visibilitychange",()=>{lastFrame=performance.now();if(document.hidden&&game.state.status==="running")game.pause()});document.addEventListener("keydown",event=>{if(event.code==="Space"&&!["INPUT","TEXTAREA","SELECT"].includes(event.target?.tagName)){event.preventDefault();game.togglePause();ui.render()}});window.addEventListener("beforeunload",saveRun);
globalThis.KongJuiYaGame=Object.freeze({game,questionEngine,storage,TRAINING_MODES,start,submit,selectTraining});
