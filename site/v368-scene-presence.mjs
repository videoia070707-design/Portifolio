/* MOVX v368 — full Scene-01 presence bus.
   The CRT remains the only production 3D asset. v368 expands spatial awareness
   from "hover the television" to "enter the scene": one scene-level pointer
   source feeds camera/light/type choreography while v366 keeps object-specific
   raycast presence and direct manipulation. No renderer, scene, model or RAF. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a=-1,b=1)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

export function attachCRTScenePresence(instance){
  if(instance.scenePresence||!instance.presence||instance.procedural||instance.previewProcedural)return instance.scenePresence;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const scene=boot?.querySelector('.scene-inner');
  if(!root||!boot||!scene)return null;

  const state={
    reduced,coarse,inside:false,
    tx:0,ty:0,x:0,y:0,mix:0,
    vx:0,vy:0,lastX:0,lastY:0,lastMove:performance.now(),lastTime:performance.now(),
    frames:0,resets:0
  };

  const setTarget=event=>{
    if(coarse||event.pointerType==='touch')return;
    const r=scene.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const now=performance.now();
    const nx=clamp(((event.clientX-r.left)/r.width-.5)*2);
    const ny=clamp(((event.clientY-r.top)/r.height-.5)*2);
    const dt=Math.max(16,Math.min(120,now-state.lastMove))/1000;
    state.vx=clamp((nx-state.lastX)/dt,-4,4);
    state.vy=clamp((ny-state.lastY)/dt,-4,4);
    state.lastX=nx;state.lastY=ny;state.lastMove=now;
    state.tx=nx;state.ty=ny;state.inside=true;
    boot.dataset.v368ScenePointer='inside';
  };
  const enter=event=>setTarget(event);
  const move=event=>setTarget(event);
  const reset=()=>{
    if(state.inside||state.tx||state.ty){state.resets++;}
    state.inside=false;state.tx=0;state.ty=0;state.vx=0;state.vy=0;
    boot.dataset.v368ScenePointer='idle';
  };
  const visibility=()=>{if(document.hidden)reset();};

  if(!coarse){
    scene.addEventListener('pointerenter',enter,{passive:true});
    scene.addEventListener('pointermove',move,{passive:true});
    scene.addEventListener('pointerleave',reset,{passive:true});
    window.addEventListener('blur',reset,{passive:true});
    document.addEventListener('visibilitychange',visibility,{passive:true});
  }

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const active=!reduced&&!coarse&&state.inside;
    const k=follow(dt,active?9.8:6.2);
    state.x+=(state.tx-state.x)*k;
    state.y+=(state.ty-state.y)*k;
    state.mix+=((active?1:0)-state.mix)*follow(dt,active?8.8:5.8);
    state.vx*=Math.pow(.055,dt);
    state.vy*=Math.pow(.055,dt);

    boot.style.setProperty('--v368-scene-x',state.x.toFixed(4));
    boot.style.setProperty('--v368-scene-y',state.y.toFixed(4));
    boot.style.setProperty('--v368-scene-presence',state.mix.toFixed(4));
    boot.style.setProperty('--v368-scene-vx',state.vx.toFixed(4));
    boot.style.setProperty('--v368-scene-vy',state.vy.toFixed(4));
    state.frames++;
    boot.dataset.v368Frame=String(state.frames);
  }

  instance.scenePresence={state,update,reset};
  root.dataset.crtScenePresence='v368-ready';
  root.dataset.crtScenePresenceLoop='shared-v322-frame';
  boot.dataset.v368ScenePointer='idle';
  return instance.scenePresence;
}
