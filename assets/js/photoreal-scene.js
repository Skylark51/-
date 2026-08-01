const root=document.getElementById("ui-gameApp");
const frameNode=root?.querySelector(".photoreal-scene-frame");
const FRAME_COUNT=60;
const COLS=10;
const ROWS=6;
const STATES=Object.freeze({
  idle:{start:0,end:14,duration:980,loop:true,hold:false},
  pour:{start:15,end:34,duration:1050,loop:false,hold:false},
  hit:{start:35,end:49,duration:900,loop:false,hold:false},
  clear:{start:50,end:59,duration:1050,loop:false,hold:true},
  over:{start:35,end:44,duration:1250,loop:false,hold:true}
});
const reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
let state="idle";
let started=performance.now();
let paused=false;
let raf=0;
let last=-1;
function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
function draw(index){
  index=clamp(Math.round(index),0,FRAME_COUNT-1);
  if(index===last)return;
  last=index;
  const col=index%COLS,row=Math.floor(index/COLS);
  root.style.setProperty("--photo-frame-x",`${col/(COLS-1)*100}%`);
  root.style.setProperty("--photo-frame-y",`${row/(ROWS-1)*100}%`);
  root.dataset.photoFrame=String(index).padStart(2,"0");
}
function setState(next,restart=true){
  if(!STATES[next])next="idle";
  if(state!==next||restart){state=next;started=performance.now();last=-1;root.dataset.photoState=state}
}
function tick(now){
  if(!paused){
    const cfg=STATES[state];
    const elapsed=Math.max(0,now-started);
    const span=cfg.end-cfg.start+1;
    let progress=elapsed/cfg.duration;
    if(cfg.loop)progress=progress%1;
    else progress=clamp(progress,0,1);
    const offset=Math.min(span-1,Math.floor(progress*span));
    draw(cfg.start+offset);
    if(!cfg.loop&&elapsed>=cfg.duration&&!cfg.hold)setState("idle");
  }
  raf=requestAnimationFrame(tick);
}
function bind(type,handler){addEventListener(type,handler);return()=>removeEventListener(type,handler)}
if(root&&frameNode){
  root.dataset.visualMode="photoreal";
  root.dataset.photoState="idle";
  const preload=new Image();preload.src="assets/art/photoreal/kongjwi-scene-60.png";
  const unbind=[
    bind("answer:correct",()=>setState("pour")),
    bind("answer:wrong",()=>setState("hit")),
    bind("answer:timeout",()=>setState("hit")),
    bind("action:spoon-hit",()=>setState("hit")),
    bind("action:bucket-smash",()=>setState("hit")),
    bind("game:clear",()=>setState("clear")),
    bind("game:over",()=>setState("over")),
    bind("game:pause",()=>{paused=true}),
    bind("game:resume",()=>{paused=false;started=performance.now()})
  ];
  draw(reduced?0:0);
  if(!reduced)raf=requestAnimationFrame(tick);
  addEventListener("beforeunload",()=>{cancelAnimationFrame(raf);unbind.forEach(fn=>fn())},{once:true});
}
export{FRAME_COUNT,COLS,ROWS,STATES};
