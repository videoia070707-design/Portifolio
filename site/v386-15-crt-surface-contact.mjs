/* MOVX v386.15 — surface-aware contact feedback for the approved Scene-01 CRT.
   The model is already pickable/manipulable. This layer makes that interactivity
   legible before drag by reusing the existing v366 raycast presence state and the
   current shared frame. No new model, renderer, scene, RAF or listener family. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

export function attachCRTSurfaceContact(instance){
  if(instance.surfaceContact||!instance.presence||!instance.physicalPickup||!instance.channels||!instance.group||instance.procedural||instance.previewProcedural)return instance.surfaceContact;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const hint=wrap?.querySelector('.crt-object-hint span');
  const screen=instance.channels.screen;
  const knob=instance.model?.getObjectByName('tripo_part_8');
  if(!root||!boot||!wrap||!screen||!knob)return null;

  const state={
    reduced,coarse,lastTime:performance.now(),surface:'none',mix:0,press:0,
    x:0,y:0,depth:0,yaw:0,pitch:0,roll:0,lightX:0,lightY:0,frames:0
  };

  const classify=name=>{
    if(!name||name==='none')return 'none';
    if(name===screen.name)return 'screen';
    if(name===knob.name)return 'dial';
    return 'body';
  };
  const hintFor=surface=>surface==='screen'?'ARRASTE A TELA · CONTEÚDO':surface==='dial'?'GIRE O DIAL · CANAIS':surface==='body'?'SEGURE E ARRASTE A TV':'ARRASTE PARA ORBITAR A TV';

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const presence=instance.presence.state;
    const orbit=instance.objectInteraction?.state;
    const direct=instance.directManipulation?.state;
    const manual=!!orbit?.active||!!direct?.active;
    const surface=classify(presence.lastSurface);
    state.surface=surface;

    const hoverTarget=(!reduced&&!coarse&&!manual&&surface!=='none')?Number(presence.hoverMix||0):0;
    const pressTarget=(!reduced&&!coarse&&!manual)?Number(presence.pressMix||0):0;
    state.mix+=(hoverTarget-state.mix)*follow(dt,hoverTarget?13:8);
    state.press+=(pressTarget-state.press)*follow(dt,pressTarget?18:10);
    state.x+=(Number(presence.x||0)-state.x)*follow(dt,11);
    state.y+=(Number(presence.y||0)-state.y)*follow(dt,11);

    const body=surface==='body'?1:0,screenMix=surface==='screen'?1:0,dial=surface==='dial'?1:0;
    const contact=state.mix;
    const targetDepth=contact*(body*.012+screenMix*.008+dial*.006)+state.press*.012;
    const targetYaw=state.x*contact*(body*.024+screenMix*.010+dial*.008);
    const targetPitch=-state.y*contact*(body*.014+screenMix*.008+dial*.005);
    const targetRoll=state.x*state.y*contact*(dial*.010+body*.004);
    const k=reduced?1:follow(dt,12);
    state.depth+=(targetDepth-state.depth)*k;
    state.yaw+=(targetYaw-state.yaw)*k;
    state.pitch+=(targetPitch-state.pitch)*k;
    state.roll+=(targetRoll-state.roll)*k;

    /* Resolve after pickup/retune so the visual acknowledgement is local and
       bounded, while any real drag immediately suppresses this automatic layer. */
    instance.group.position.z+=state.depth;
    instance.group.rotation.y+=state.yaw;
    instance.group.rotation.x+=state.pitch;
    instance.group.rotation.z+=state.roll;

    const targetLightX=state.x*contact*.42;
    const targetLightY=-state.y*contact*.24;
    state.lightX+=(targetLightX-state.lightX)*k;
    state.lightY+=(targetLightY-state.lightY)*k;
    if(instance.lights?.key){
      instance.lights.key.position.x-=state.lightX;
      instance.lights.key.position.y+=state.lightY;
      instance.lights.key.intensity+=contact*(body*.035+screenMix*.055+dial*.025)+state.press*.025;
    }
    if(instance.lights?.rim){
      instance.lights.rim.position.x+=state.lightX*.32;
      instance.lights.rim.intensity+=contact*(body*.028+screenMix*.040+dial*.020);
    }

    if(hint&&!manual){
      const next=hintFor(surface);
      if(hint.textContent!==next)hint.textContent=next;
    }

    const px=clamp(50+state.x*22,18,82),py=clamp(52+state.y*16,24,78);
    boot.style.setProperty('--v386-contact-x',`${px.toFixed(2)}%`);
    boot.style.setProperty('--v386-contact-y',`${py.toFixed(2)}%`);
    boot.style.setProperty('--v386-contact-mix',state.mix.toFixed(4));
    boot.style.setProperty('--v386-contact-press',state.press.toFixed(4));
    boot.style.setProperty('--v386-contact-shadow-x',`${(-state.x*10*state.mix).toFixed(2)}px`);
    boot.dataset.v386Contact=surface;
    state.frames++;boot.dataset.v386ContactFrame=String(state.frames);
  }

  instance.surfaceContact={state,update};
  root.dataset.crtSurfaceContact='v386.15-ready';
  root.dataset.crtSurfaceContactLoop='shared-v322-frame';
  boot.dataset.v386Contact='none';
  return instance.surfaceContact;
}
