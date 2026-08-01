const root=document.getElementById("ui-gameApp");
const frameNode=root?.querySelector(".photoreal-scene-frame");
const FRAME_COUNT=60,ATLAS_COLUMNS=10,ATLAS_ROWS=6,CELL_WIDTH=160,CELL_HEIGHT=90;
const KEYPOSE_URL="assets/art/photoreal/kongjwi-keyposes.png";
const STATES=Object.freeze({idle:{start:0,end:14,duration:980,loop:true,hold:false},pour:{start:15,end:34,duration:1050,loop:false,hold:false},hit:{start:35,end:49,duration:900,loop:false,hold:false},clear:{start:50,end:59,duration:1050,loop:false,hold:true},over:{start:35,end:44,duration:1250,loop:false,hold:true}});
const POSES=Object.freeze([[0,0],[1,0],[0,1],[1,1]]);
const reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
let state="idle",started=performance.now(),paused=false,raf=0,last=-1,atlasUrl="";
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const smooth=t=>t*t*(3-2*t);
function posePlan(index){
  if(index<15){const p=index/15*Math.PI*2;return{a:0,b:0,t:0,z:1.012+.008*Math.sin(p),x:2*Math.sin(p),y:1.5*Math.cos(p)}}
  if(index<20){const t=(index-15)/4;return{a:0,b:1,t:smooth(t),z:1.015+.005*t,x:-2*t,y:1*t}}
  if(index<35){const p=(index-20)/14*Math.PI;return{a:1,b:1,t:0,z:1.018+.012*Math.sin(p),x:-2+4*Math.sin(p),y:2*Math.sin(p*1.2)}}
  if(index<45){const p=(index-35)/9*Math.PI;return{a:2,b:2,t:0,z:1.02+.012*Math.sin(p),x:8*Math.sin(p)*((index%2)?-1:1),y:-4*Math.sin(p)}}
  if(index<50){const t=(index-45)/4;return{a:2,b:0,t:smooth(t),z:1.015,x:0,y:0}}
  const p=(index-50)/9;return{a:3,b:3,t:0,z:1.015+.025*Math.sin(p*Math.PI),x:0,y:-3*Math.sin(p*Math.PI)};
}
function drawPose(ctx,img,pose,alpha,dx,dy,zoom,cellX,cellY){
  const [px,py]=POSES[pose];
  ctx.save();ctx.beginPath();ctx.rect(cellX,cellY,CELL_WIDTH,CELL_HEIGHT);ctx.clip();ctx.globalAlpha=alpha;
  ctx.translate(cellX+CELL_WIDTH/2+dx,cellY+CELL_HEIGHT/2+dy);ctx.scale(zoom,zoom);
  ctx.drawImage(img,px*256,py*144,256,144,-CELL_WIDTH/2,-CELL_HEIGHT/2,CELL_WIDTH,CELL_HEIGHT);ctx.restore();
}
async function buildPngAtlas(){
  const img=new Image();img.decoding="async";img.src=KEYPOSE_URL;await img.decode();
  const canvas=document.createElement("canvas");canvas.width=CELL_WIDTH*ATLAS_COLUMNS;canvas.height=CELL_HEIGHT*ATLAS_ROWS;
  const ctx=canvas.getContext("2d",{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  for(let index=0;index<FRAME_COUNT;index++){
    const p=posePlan(index),x=(index%ATLAS_COLUMNS)*CELL_WIDTH,y=Math.floor(index/ATLAS_COLUMNS)*CELL_HEIGHT;
    ctx.fillStyle="#211914";ctx.fillRect(x,y,CELL_WIDTH,CELL_HEIGHT);
    drawPose(ctx,img,p.a,1-p.t,p.x,p.y,p.z,x,y);if(p.b!==p.a||p.t)drawPose(ctx,img,p.b,p.t,p.x,p.y,p.z,x,y);
  }
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  if(!blob)throw new Error("PNG atlas creation failed");
  atlasUrl=URL.createObjectURL(blob);frameNode.style.backgroundImage=`url("${atlasUrl}")`;frameNode.classList.add("is-atlas-ready");
  root.dataset.photoAtlas="60-frame-png";
}
function draw(index){index=clamp(Math.round(index),0,FRAME_COUNT-1);if(index===last)return;last=index;const col=index%ATLAS_COLUMNS,row=Math.floor(index/ATLAS_COLUMNS);root.style.setProperty("--photo-frame-x",`${col/(ATLAS_COLUMNS-1)*100}%`);root.style.setProperty("--photo-frame-y",`${row/(ATLAS_ROWS-1)*100}%`);root.dataset.photoFrame=String(index).padStart(2,"0")}
function setState(next,restart=true){if(!STATES[next])next="idle";if(state!==next||restart){state=next;started=performance.now();last=-1;root.dataset.photoState=state}}
function tick(now){if(!paused){const cfg=STATES[state],elapsed=Math.max(0,now-started),span=cfg.end-cfg.start+1;let progress=elapsed/cfg.duration;progress=cfg.loop?progress%1:clamp(progress,0,1);draw(cfg.start+Math.min(span-1,Math.floor(progress*span)));if(!cfg.loop&&elapsed>=cfg.duration&&!cfg.hold)setState("idle")}raf=requestAnimationFrame(tick)}
function bind(type,handler){addEventListener(type,handler);return()=>removeEventListener(type,handler)}
if(root&&frameNode){
  root.dataset.visualMode="photoreal";root.dataset.photoState="idle";
  const unbind=[bind("answer:correct",()=>setState("pour")),bind("answer:wrong",()=>setState("hit")),bind("answer:timeout",()=>setState("hit")),bind("action:spoon-hit",()=>setState("hit")),bind("action:bucket-smash",()=>setState("hit")),bind("game:clear",()=>setState("clear")),bind("game:over",()=>setState("over")),bind("game:pause",()=>{paused=true}),bind("game:resume",()=>{paused=false;started=performance.now()})];
  buildPngAtlas().then(()=>{draw(0);if(!reduced)raf=requestAnimationFrame(tick)}).catch(error=>{console.error("Photoreal PNG atlas failed",error);frameNode.style.backgroundImage=`url("${KEYPOSE_URL}")`});
  addEventListener("beforeunload",()=>{cancelAnimationFrame(raf);unbind.forEach(fn=>fn());if(atlasUrl)URL.revokeObjectURL(atlasUrl)},{once:true});
}
export{FRAME_COUNT,ATLAS_COLUMNS,ATLAS_ROWS,STATES,posePlan};
