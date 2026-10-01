/* MOVX v363/v386.5 — direct manipulation for the approved CRT.
   The existing screen and selector become the controls: drag the real screen to
   manipulate the active programme and drag the real selector to tune channels.
   The tiny selector keeps exact ray hits as the primary signal, plus a bounded
   projected pickup footprint. v386.5 gives that footprint local intent priority:
   if a live parallax frame makes the screen/body win the first ray by a few pixels,
   the pointer can still grab the real selector at its visible projected position.
   No extra WebGL context, visible canvas, model, listener family or RAF is added. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mod=(n,m)=>((n%m)+m)%m;
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);
const TAU=Math.PI*2;
const CHANNELS=['direction','motion','ai','digital'];

export function attachCRTDirectManipulation(instance){
  if(instance.directManipulation||!instance.channels||!instance.tactility||instance.procedural||instance.previewProcedural)return instance.directManipulation;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const screen=instance.channels.screen;
  const channelState=instance.channels.state;
  const knob=instance.model.getObjectByName('tripo_part_8');
  if(!boot||!wrap||!screen?.isMesh||!knob)return null;

  const buttons=[...boot.querySelectorAll('[data-crt-mode-control]')];
  const range=boot.querySelector('.crt-program-range input');
  const action=boot.querySelector('.crt-program-controls button');
  const help=boot.querySelector('.crt-program-help');
  const ray=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const center=new THREE.Vector3();

  const hints={
    direction:'Arraste a própria tela para percorrer as artes · clique para avançar',
    motion:'Arraste a tela para scrub do tempo · solte para retomar a reprodução',
    ai:'Arraste verticalmente na tela para deformar · clique para gerar outra variação',
    digital:'Arraste a tela para alternar o formato · clique para trocar desktop/mobile'
  };

  const direct={
    reduced,coarse,active:false,kind:'none',moved:false,
    pointerId:null,startX:0,startY:0,lastX:0,lastY:0,
    screenDrags:0,dialDrags:0,lastAction:'none',
    dragResidual:0,currentZ:knob.rotation.z||0,lastTime:performance.now(),
    startChannel:channelState.channel||'direction',startIndex:0,startArt:0,startMobile:false,
    startAmount:.5,startPhase:0,startPaused:false,startAngle:0,knobCenterX:0,knobCenterY:0,
    lastDialIndex:-1,lastDirection:1,releaseEnergy:0,selectorAssistHits:0
  };

  const hitAt=event=>{
    const r=instance.canvas.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,instance.camera);
    return ray.intersectObject(instance.model,true)[0]||null;
  };
  const projectCenter=obj=>{
    obj.geometry?.computeBoundingBox?.();
    const box=obj.geometry?.boundingBox;
    if(!box)return null;
    box.getCenter(center);obj.localToWorld(center);center.project(instance.camera);
    const r=instance.canvas.getBoundingClientRect();
    return {x:r.x+(center.x+1)*r.width/2,y:r.y+(1-center.y)*r.height/2};
  };
  const nearKnob=event=>{
    const p=projectCenter(knob),r=instance.canvas.getBoundingClientRect();
    if(!p||!r.width||!r.height)return false;
    /* Deliberately local: enough to survive a live camera/object frame between
       reprojection and pointerdown, but far too small to turn the cabinet into an
       invisible dial. */
    const radius=Math.max(24,Math.min(36,r.width*.042));
    return Math.hypot(event.clientX-p.x,event.clientY-p.y)<=radius;
  };
  const refreshAction=()=>{
    if(!action)return;
    action.textContent=channelState.channel==='direction'?'Próxima arte ↗':channelState.channel==='motion'?(channelState.paused?'Reproduzir animação':'Pausar animação'):channelState.channel==='ai'?'Gerar outra variação ↗':(channelState.mobile?'Ver desktop ↗':'Ver mobile ↗');
  };
  const refreshHint=()=>{
    if(!help)return;
    const text=hints[channelState.channel];
    if(text&&help.textContent!==text)help.textContent=text;
  };
  const markFrame=()=>{channelState.last=0;channelState.changes++;instance.tactility.state.pulse=Math.max(instance.tactility.state.pulse,.34)};
  const tune=index=>{
    const next=mod(index,CHANNELS.length);
    if(next===CHANNELS.indexOf(channelState.channel))return;
    direct.lastDirection=next>CHANNELS.indexOf(channelState.channel)?1:-1;
    buttons[next]?.click();
    direct.lastDialIndex=next;
  };

  const begin=event=>{
    if(event.button!==undefined&&event.button!==0)return;
    if(coarse&&event.pointerType==='touch')return;
    const hit=hitAt(event),obj=hit?.object;
    const selectorIntent=nearKnob(event);
    /* Physical affordance priority: within the real selector's tiny projected
       footprint, the dial owns the pointer even if the curved screen/cabinet is
       the first ray-hit on this particular live-parallax frame. Outside that
       footprint, exact screen raycasting remains unchanged. */
    const assisted=selectorIntent&&obj!==knob;
    const kind=(obj===knob||selectorIntent)?'knob':obj===screen?'screen':'none';
    if(kind==='none')return;
    if(assisted){direct.selectorAssistHits++;boot.dataset.crtSelectorAssist='pickup'}else delete boot.dataset.crtSelectorAssist;
    direct.active=true;direct.kind=kind;direct.moved=false;direct.pointerId=event.pointerId;
    direct.startX=direct.lastX=event.clientX;direct.startY=direct.lastY=event.clientY;
    direct.startChannel=channelState.channel;direct.startIndex=Math.max(0,CHANNELS.indexOf(channelState.channel));
    direct.startArt=channelState.art;direct.startMobile=channelState.mobile;direct.startAmount=channelState.amount;
    direct.startPhase=channelState.phase;direct.startPaused=channelState.paused;direct.lastDialIndex=direct.startIndex;
    if(kind==='knob'){
      const p=projectCenter(knob);if(p){direct.knobCenterX=p.x;direct.knobCenterY=p.y;direct.startAngle=Math.atan2(event.clientY-p.y,event.clientX-p.x)}
    }
    boot.dataset.crtGesture=kind;
    try{wrap.setPointerCapture(event.pointerId)}catch{}
    if(event.pointerType!=='touch')event.preventDefault();
  };

  const move=event=>{
    if(!direct.active||event.pointerId!==direct.pointerId)return;
    const dx=event.clientX-direct.startX,dy=event.clientY-direct.startY;
    direct.lastX=event.clientX;direct.lastY=event.clientY;
    if(Math.hypot(dx,dy)>6)direct.moved=true;
    if(!direct.moved)return;
    if(event.pointerType!=='touch')event.preventDefault();

    if(direct.kind==='knob'){
      const angle=Math.atan2(event.clientY-direct.knobCenterY,event.clientX-direct.knobCenterX);
      let delta=angle-direct.startAngle;
      while(delta>Math.PI)delta-=TAU;while(delta<-Math.PI)delta+=TAU;
      const step=Math.round(delta/.62);
      const next=mod(direct.startIndex+step,CHANNELS.length);
      direct.dragResidual=clamp((delta-step*.62)*.42,-.20,.20);
      if(next!==direct.lastDialIndex){tune(next);direct.dialDrags++;direct.lastAction='dial-tune'}
      return;
    }

    direct.screenDrags++;
    if(direct.startChannel==='direction'){
      const step=Math.round(dx/72);
      const next=mod(direct.startArt+step,3);
      if(next!==channelState.art){channelState.art=next;channelState.transition=performance.now();markFrame();direct.lastAction='direction-scrub'}
    }else if(direct.startChannel==='motion'){
      channelState.paused=true;
      channelState.phase=direct.startPhase+(dx/170)*TAU;
      channelState.last=0;
      direct.lastAction='motion-scrub';refreshAction();
    }else if(direct.startChannel==='ai'){
      const amount=clamp(direct.startAmount-dy/230,0,1);
      if(range){range.value=String(Math.round(amount*100));range.dispatchEvent(new Event('input',{bubbles:true}))}
      else{channelState.amount=amount;markFrame()}
      direct.lastAction='ai-shape';
    }else if(direct.startChannel==='digital'){
      if(Math.abs(dx)>54&&channelState.mobile===direct.startMobile){channelState.mobile=!direct.startMobile;channelState.transition=performance.now();markFrame();refreshAction();direct.lastAction='digital-format'}
    }
  };

  const end=event=>{
    if(!direct.active||event.pointerId!==direct.pointerId)return;
    if(direct.kind==='screen'&&direct.startChannel==='motion'&&direct.moved){channelState.paused=direct.startPaused;channelState.last=0;refreshAction()}
    if(direct.moved){direct.releaseEnergy=1;instance.tactility.state.pulse=Math.max(instance.tactility.state.pulse,.54)}
    direct.active=false;direct.kind='none';direct.pointerId=null;direct.dragResidual=0;
    boot.dataset.crtGesture=direct.moved?'settling':'none';
    delete boot.dataset.crtSelectorAssist;
    try{wrap.releasePointerCapture(event.pointerId)}catch{}
  };

  wrap.addEventListener('pointerdown',begin,{passive:false});
  wrap.addEventListener('pointermove',move,{passive:false});
  wrap.addEventListener('pointerup',end,{passive:true});
  wrap.addEventListener('pointercancel',end,{passive:true});

  function update(time){
    const dt=Math.min(Math.max((time-direct.lastTime)/1000,0),.1);direct.lastTime=time;
    const idx=Math.max(0,CHANNELS.indexOf(channelState.channel));
    const target=idx*.45+(direct.active&&direct.kind==='knob'?direct.dragResidual:0);
    const k=reduced?1:follow(dt,direct.active?20:12);
    direct.currentZ+=(target-direct.currentZ)*k;
    if(!reduced&&direct.releaseEnergy>.001)direct.releaseEnergy*=Math.exp(-dt*13);else if(reduced)direct.releaseEnergy=0;
    const kick=(instance.tactility?.state?.knobKick||0)*.028*direct.lastDirection;
    knob.rotation.z=direct.currentZ+kick;
    if(!direct.active&&direct.releaseEnergy<.03&&boot.dataset.crtGesture==='settling')delete boot.dataset.crtGesture;
    refreshHint();
  }

  instance.directManipulation={state:direct,update};
  document.documentElement.dataset.crtDirect='v363-ready';
  document.documentElement.dataset.crtSelectorPickup='v386.5-intent-priority';
  boot.dataset.crtDirect='ready';
  refreshHint();
  return instance.directManipulation;
}
