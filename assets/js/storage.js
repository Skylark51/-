export const STORAGE_KEY = "kongjuiya-chem-save";
export const STORAGE_VERSION = 2;
const emptyMode=()=>({plays:0,bestScore:0,bestCombo:0,bestFeverCount:0,correct:0,wrong:0,timeout:0,averageResponseMs:0,responseCount:0,lastPlayedAt:null,weakQuestions:{},byDifficulty:{}});
const defaults=()=>({version:2,settings:{volume:.8,animations:true,difficulty:"normal"},statistics:{},recentRuns:[],currentRun:null});
const safeMode=v=>({...emptyMode(),...(v&&typeof v==="object"?v:{}),weakQuestions:{...(v?.weakQuestions||{})},byDifficulty:{...(v?.byDifficulty||{})}});
export function migrateSave(v){const b=defaults();if(!v||typeof v!=="object")return b;if(v.version===1){const s=v.statistics||{};b.statistics.legacy=safeMode({plays:s.plays||0,correct:s.correct||0,wrong:s.wrong||0,timeout:s.timeout||0,bestScore:v.profile?.bestScore||0});b.settings={...b.settings,...(v.settings||{})};return b}if(v.version!==2)return b;for(const [id,s] of Object.entries(v.statistics||{}))b.statistics[id]=safeMode(s);return {...b,...v,version:2,settings:{...b.settings,...(v.settings||{})},statistics:b.statistics,recentRuns:Array.isArray(v.recentRuns)?v.recentRuns.slice(0,20):[]}}
export class GameStorage{
 constructor(storage=globalThis.localStorage){this.storage=storage;this.data=this.load()}
 load(){try{const d=migrateSave(JSON.parse(this.storage?.getItem(STORAGE_KEY)||"null"));this.persist(d);return d}catch{const d=defaults();this.persist(d);return d}}
 persist(data=this.data){this.data=migrateSave(data);try{this.storage?.setItem(STORAGE_KEY,JSON.stringify(this.data))}catch{}return this.data}
 mode(id){if(!this.data.statistics[id])this.data.statistics[id]=emptyMode();return this.data.statistics[id]}
 updateSettings(v){this.data.settings={...this.data.settings,...v};return this.persist()}
 startRun(id,difficulty="normal"){const s=this.mode(id);s.plays++;s.byDifficulty[difficulty]={plays:0,bestScore:0,correct:0,wrong:0,...(s.byDifficulty[difficulty]||{})};s.byDifficulty[difficulty].plays++;return this.persist()}
 recordAnswer(q,correct,timeout=false,responseMs=null,difficulty="normal"){const s=this.mode(q.trainingId);if(timeout)s.timeout++;else if(correct)s.correct++;else s.wrong++;const d=difficulty;s.byDifficulty[d]={plays:0,bestScore:0,correct:0,wrong:0,...(s.byDifficulty[d]||{})};if(correct)s.byDifficulty[d].correct++;else s.byDifficulty[d].wrong++;if(Number.isFinite(responseMs)&&responseMs>=0){s.averageResponseMs=(s.averageResponseMs*s.responseCount+responseMs)/(s.responseCount+1);s.responseCount++}if(!correct)s.weakQuestions[q.id]=(s.weakQuestions[q.id]||0)+1;return this.persist()}
 saveCurrentRun(state){this.data.currentRun=state?{...state,savedAt:new Date().toISOString()}:null;return this.persist()}
 finishRun(state){const s=this.mode(state.trainingId),d=state.difficulty||"normal";s.bestScore=Math.max(s.bestScore,Math.round(state.score||0));s.bestCombo=Math.max(s.bestCombo,state.bestCombo||state.combo||0);s.bestFeverCount=Math.max(s.bestFeverCount,state.feverCount||0);s.lastPlayedAt=new Date().toISOString();s.byDifficulty[d]={plays:0,bestScore:0,correct:0,wrong:0,...(s.byDifficulty[d]||{})};s.byDifficulty[d].bestScore=Math.max(s.byDifficulty[d].bestScore,Math.round(state.score||0));this.data.recentRuns.unshift({endedAt:s.lastPlayedAt,trainingId:state.trainingId,difficulty:d,score:Math.round(state.score||0),status:state.status});this.data.recentRuns=this.data.recentRuns.slice(0,20);this.data.currentRun=null;return this.persist()}
 getTrainingStats(id){return {...this.mode(id)}}
 clearCurrentRun(){this.data.currentRun=null;return this.persist()}
 reset(){this.data=defaults();return this.persist()}
}
