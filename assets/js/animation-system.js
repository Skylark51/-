const FRAME_COUNT = 60;
const SPRITE_FRAME_COUNT = 8;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pct = frame => `${(clamp(frame, 0, SPRITE_FRAME_COUNT - 1) / (SPRITE_FRAME_COUNT - 1) * 100).toFixed(6)}%`;
const repeatSequence = (sequence, total = FRAME_COUNT) => Object.freeze(Array.from({ length: total }, (_, index) => sequence[Math.floor(index / total * sequence.length)] ?? sequence.at(-1) ?? 0));
export const IDLE_FRAMES = repeatSequence([0,0,1,1,0,1]);
export const POUR_FRAMES = repeatSequence([2,2,3,3,4,4,5,5,5,6,6,1]);
export const HIT_FRAMES = repeatSequence([7,7,4,3,6,1]);
export const CLEAR_FRAMES = repeatSequence([1,3,1,3,6,1]);
export const OVER_FRAMES = repeatSequence([7,7,7,4,7,7]);
const STATE_CONFIG = Object.freeze({
  idle:{frames:IDLE_FRAMES,duration:1000,loop:true},
  pour:{frames:POUR_FRAMES,duration:920,loop:false},
  hit:{frames:HIT_FRAMES,duration:660,loop:false},
  clear:{frames:CLEAR_FRAMES,duration:1100,loop:false},
  over:{frames:OVER_FRAMES,duration:1200,loop:false}
});
function frameAt(config, elapsed){
  const duration=Math.max(1,config.duration);
  const progress=config.loop?(elapsed%duration)/duration:clamp(elapsed/duration);
  const index=Math.min(FRAME_COUNT-1,Math.floor(progress*FRAME_COUNT));
  return config.frames[index];
}
function set(root,name,value){root.style.setProperty(name,value)}
function applyWaterMotion(root,state,elapsed,frame){
  const phase=elapsed/1000*Math.PI*2;
  const idleWave=Math.sin(phase*1.15);
  let opacity=0,length=.2,thickness=.72,angle=20,jarReact=0;
  if(state==="pour"){
    const t=clamp(elapsed/STATE_CONFIG.pour.duration);
    const envelope=Math.sin(t*Math.PI);
    opacity=clamp(Math.min(t/.12,(1-t)/.13));
    length=.28+envelope*.98;
    thickness=.72+envelope*.38;
    angle=17+Math.sin(t*Math.PI)*5;
    jarReact=Math.sin(t*Math.PI*4)*1.3;
  }else if(state==="hit"){
    const t=clamp(elapsed/STATE_CONFIG.hit.duration);
    jarReact=Math.sin(t*Math.PI*6)*(1-t)*4.6;
  }else if(state==="clear"){
    jarReact=Math.sin(elapsed/90)*1.2;
  }
  set(root,"--water-wave-y",`${(idleWave*2.2).toFixed(2)}px`);
  set(root,"--water-wave-x",(1+Math.cos(phase*.92)*.025).toFixed(4));
  set(root,"--pour-opacity",opacity.toFixed(3));
  set(root,"--pour-length",length.toFixed(3));
  set(root,"--pour-thickness",thickness.toFixed(3));
  set(root,"--pour-angle",`${angle.toFixed(2)}deg`);
  set(root,"--jar-react",`${jarReact.toFixed(2)}deg`);
  root.dataset.animationFrame=String(frame).padStart(2,"0");
}
export function mountSixtyFrameAnimation(root,{motionEnabled=true,preview=false}={}){
  if(!root)return null;
  const reducedMotion=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let enabled=Boolean(motionEnabled&&!reducedMotion),state="idle",stateStartedAt=performance.now(),paused=false,raf=0,lastRenderedFrame=-1;
  root.classList.add("real-sprite-art");
  root.classList.toggle("motion-60",enabled);
  const setState=(next,restart=true)=>{
    if(!STATE_CONFIG[next])next="idle";
    if(state!==next||restart){state=next;stateStartedAt=performance.now();root.dataset.animationState=state;lastRenderedFrame=-1}
  };
  const applyFrame=time=>{
    const config=STATE_CONFIG[state]||STATE_CONFIG.idle;
    const elapsed=Math.max(0,time-stateStartedAt);
    if(!config.loop&&elapsed>=config.duration){state="idle";stateStartedAt=time;root.dataset.animationState=state}
    const active=STATE_CONFIG[state]||STATE_CONFIG.idle;
    const activeElapsed=Math.max(0,time-stateStartedAt);
    const kongFrame=enabled?frameAt(active,activeElapsed):0;
    const toadFrame=enabled?(state==="pour"?([0,1,2,3,4,5,1,0][kongFrame]??kongFrame):kongFrame):0;
    if(kongFrame!==lastRenderedFrame||state!=="idle"){
      set(root,"--kong-frame-x",pct(kongFrame));
      set(root,"--tool-frame-x",pct(kongFrame));
      set(root,"--toad-frame-x",pct(toadFrame));
      lastRenderedFrame=kongFrame;
    }
    applyWaterMotion(root,state,activeElapsed,kongFrame);
  };
  const loop=time=>{if(!paused)applyFrame(time);raf=requestAnimationFrame(loop)};
  const onCorrect=()=>setState("pour"),onWrong=()=>setState("hit"),onClear=()=>setState("clear"),onOver=()=>setState("over"),onPause=()=>{paused=true},onResume=()=>{paused=false;stateStartedAt=performance.now()};
  if(!preview){
    addEventListener("answer:correct",onCorrect);
    addEventListener("answer:wrong",onWrong);
    addEventListener("answer:timeout",onWrong);
    addEventListener("action:spoon-hit",onWrong);
    addEventListener("action:bucket-smash",onWrong);
    addEventListener("game:clear",onClear);
    addEventListener("game:over",onOver);
    addEventListener("game:pause",onPause);
    addEventListener("game:resume",onResume);
  }
  root.dataset.animationState=state;
  raf=requestAnimationFrame(loop);
  return{
    setEnabled(value){enabled=Boolean(value&&!reducedMotion);root.classList.toggle("motion-60",enabled);if(!enabled){set(root,"--kong-frame-x","0%");set(root,"--tool-frame-x","0%");set(root,"--toad-frame-x","0%")}},
    setState,
    triggerPour(){setState("pour")},
    triggerHit(){setState("hit")},
    destroy(){
      cancelAnimationFrame(raf);
      if(!preview){
        removeEventListener("answer:correct",onCorrect);removeEventListener("answer:wrong",onWrong);removeEventListener("answer:timeout",onWrong);removeEventListener("action:spoon-hit",onWrong);removeEventListener("action:bucket-smash",onWrong);removeEventListener("game:clear",onClear);removeEventListener("game:over",onOver);removeEventListener("game:pause",onPause);removeEventListener("game:resume",onResume)
      }
      root.classList.remove("motion-60");delete root.dataset.animationFrame;delete root.dataset.animationState;
    }
  };
}
export{FRAME_COUNT,SPRITE_FRAME_COUNT};