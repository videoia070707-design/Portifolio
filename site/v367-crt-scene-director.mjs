/* MOVX v367 — Scene 01 director.
   The approved CRT remains the only production 3D asset. This module does not add
   another renderer, scene, RAF, model or input listener. Instead it consumes the
   states already produced by scroll choreography, CRT presence, channel physics
   and direct manipulation, then composes camera + object + light + DOM into one
   authored shot inside the existing v322 render frame. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);
const smooth=(a,b,v)=>{const t=clamp((v-a)/Math.max(.0001,b-a));return t*t*(3-2*t)};

/* These are scene signatures, not four unrelated effects. The same variables
   drive the CRT pose, the camera, the light field and the editorial DOM. */
const CHANNELS={
  direction:{camX:-.030,camY:.008,camZ:.000,fov:.00,lookX:-.018,lookY:.004,groupX:-.010,groupY:.000,groupZ:.000,yaw:-.010,pitch:.002,roll:-.002,energy:.26,warm:.36,typeA:-2,typeB:-5,typeC:-1},
  motion:{camX:.038,camY:-.012,camZ:-.085,fov:-.55,lookX:.018,lookY:-.008,groupX:.014,groupY:.004,groupZ:.018,yaw:.016,pitch:-.006,roll:.006,energy:.88,warm:.92,typeA:5,typeB:-4,typeC:8},
  ai:{camX:-.018,camY:.026,camZ:-.060,fov:.30,lookX:-.012,lookY:.015,groupX:-.006,groupY:.009,groupZ:.026,yaw:-.010,pitch:.010,roll:-.004,energy:.67,warm:.64,typeA:-3,typeB:6,typeC:-5},
  digital:{camX:.020,camY:.000,camZ:-.028,fov:-.30,lookX:.008,lookY:.000,groupX:.006,groupY:-.002,groupZ:.006,yaw:.004,pitch:.001,roll:-.001,energy:.42,warm:.22,typeA:1,typeB:2,typeC:1},
};

export function attachCRTSceneDirector(instance){
  if(instance.sceneDirector||!instance.presence||!instance.channelPhysics||!instance.channels||instance.procedural||instance.previewProcedural)return instance.sceneDirector;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const inner=boot?.querySelector('.scene-inner');
  const copy=boot?.querySelector('.boot-copy');
  const titleLines=[...(boot?.querySelectorAll('.boot-title span')||[])];
  const eyebrow=boot?.querySelector('.boot-copy .eyebrow');
  const paragraph=boot?.querySelector('.boot-copy .copy');
  const panel=boot?.querySelector('#crt-channel-panel');
  const sceneBar=boot?.querySelector('.scene-bar');
  if(!root||!boot||!inner||!copy||titleLines.length!==3||!instance.camera||!instance.group)return null;

  const base={cameraZ:instance.camera.position.z,fov:instance.camera.fov,scale:instance.group.scale.clone()};
  const look=new THREE.Vector3();
  const state={
    reduced,coarse,lastTime:performance.now(),lastProgress:0,progress:0,velocity:0,
    pointerX:0,pointerY:0,presence:0,channel:'direction',channelMix:1,
    camX:0,camY:.03,camZ:base.cameraZ,fov:base.fov,
    energy:CHANNELS.direction.energy,warm:CHANNELS.direction.warm,
    domOwned:false,frames:0,beat:'boot',manual:false
  };

  const ownDom=()=>{
    if(state.domOwned||root.dataset.motionIntro!=='ready')return;
    /* v353's entrance animations use fill:'both'. Once their reveal has ended,
       release only Scene-01 children so the director can give them continuous
       depth without fighting the intro timeline. */
    [...titleLines,eyebrow,paragraph,panel,sceneBar].filter(Boolean).forEach(el=>{
      el.getAnimations?.().forEach(animation=>{try{animation.cancel()}catch{}});
    });
    state.domOwned=true;
    boot.dataset.v367Dom='owned';
  };

  function setSceneVars(presence,px,py,progress,engage,exit,handoff,profile){
    boot.style.setProperty('--v367-p',progress.toFixed(4));
    boot.style.setProperty('--v367-px',px.toFixed(4));
    boot.style.setProperty('--v367-py',py.toFixed(4));
    boot.style.setProperty('--v367-presence',presence.toFixed(4));
    boot.style.setProperty('--v367-engage',engage.toFixed(4));
    boot.style.setProperty('--v367-exit',exit.toFixed(4));
    boot.style.setProperty('--v367-handoff',handoff.toFixed(4));
    boot.style.setProperty('--v367-energy',state.energy.toFixed(4));
    boot.style.setProperty('--v367-warm',state.warm.toFixed(4));
    boot.style.setProperty('--v367-velocity',clamp(state.velocity*5,-1,1).toFixed(4));
    boot.style.setProperty('--v367-light-x',`${(31+px*8*presence+profile.camX*52+engage*3).toFixed(2)}%`);
    boot.style.setProperty('--v367-light-y',`${(47+py*6*presence-profile.camY*60-exit*3).toFixed(2)}%`);
  }

  function updateDom(profile,px,py,presence,engage,exit,handoff){
    if(!state.domOwned||reduced)return;
    const pointerGain=presence*(1-exit*.75);
    const depth=[.42,.72,1];
    const channelOffsets=[profile.typeA,profile.typeB,profile.typeC];
    titleLines.forEach((line,i)=>{
      const x=channelOffsets[i]*state.channelMix-px*(3.2+depth[i]*3.6)*pointerGain+handoff*(i-1)*4;
      const y=-py*(1.2+depth[i]*2.4)*pointerGain-exit*(i*1.6);
      const rotate=(i===1?-px*.16:px*.10)*pointerGain + (i===2?profile.roll*14:0);
      line.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotate.toFixed(3)}deg)`;
    });
    if(eyebrow)eyebrow.style.transform=`translate3d(${(-px*2.1*pointerGain).toFixed(2)}px,${(-py*.8*pointerGain).toFixed(2)}px,0)`;
    if(paragraph)paragraph.style.transform=`translate3d(${(-px*3.4*pointerGain-profile.typeB*.16).toFixed(2)}px,${(-py*1.7*pointerGain).toFixed(2)}px,0)`;
    if(panel)panel.style.transform=`translate3d(${(-px*2.2*pointerGain).toFixed(2)}px,${(-py*.8*pointerGain).toFixed(2)}px,0)`;
    if(sceneBar)sceneBar.style.transform=`translate3d(${(px*1.8*pointerGain).toFixed(2)}px,0,0)`;
  }

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    ownDom();

    const raw=Number(window.MOVXCRT?.progress ?? getComputedStyle(root).getPropertyValue('--crt-progress') ?? 0);
    const targetProgress=Number.isFinite(raw)?clamp(raw):0;
    state.velocity+=(targetProgress-state.lastProgress-state.velocity)*follow(dt,9);
    state.lastProgress=targetProgress;
    state.progress+=(targetProgress-state.progress)*(reduced?1:follow(dt,11));

    const p=state.progress;
    const arrive=smooth(0,.16,p);
    const engage=smooth(.08,.48,p);
    const exit=smooth(.50,.82,p);
    const handoff=smooth(.78,1,p);
    const channel=CHANNELS[instance.channels?.state?.channel]?instance.channels.state.channel:'direction';
    if(channel!==state.channel){state.channel=channel;state.channelMix=0;boot.dataset.v367Channel=channel;}
    state.channelMix+=(1-state.channelMix)*(reduced?1:follow(dt,9.5));
    const profile=CHANNELS[channel];

    const presenceState=instance.presence.state;
    const manual=!!instance.objectInteraction?.state?.active||!!instance.directManipulation?.state?.active;
    state.manual=manual;
    const targetPresence=reduced||coarse||manual?0:Number(presenceState.hoverMix||0);
    state.presence+=(targetPresence-state.presence)*(reduced?1:follow(dt,9));
    state.pointerX+=(Number(presenceState.x||0)-state.pointerX)*(reduced?1:follow(dt,10));
    state.pointerY+=(Number(presenceState.y||0)-state.pointerY)*(reduced?1:follow(dt,10));
    const px=state.pointerX,py=state.pointerY,presence=state.presence;

    state.energy+=(profile.energy-state.energy)*(reduced?1:follow(dt,7.5));
    state.warm+=(profile.warm-state.warm)*(reduced?1:follow(dt,6.5));

    /* CAMERA PATH — pointer no longer merely tilts the product: it shifts the
       viewer's position while scroll establishes approach -> hold -> handoff. */
    const pointerCam=manual?0:presence*(1-exit*.68);
    const desiredX=profile.camX*state.channelMix + px*.145*pointerCam + engage*.026 - handoff*.075;
    const desiredY=.03 + profile.camY*state.channelMix - py*.080*pointerCam - engage*.018 + handoff*.026;
    const desiredZ=base.cameraZ + profile.camZ*state.channelMix - engage*.135 + exit*.060 + handoff*.235;
    const desiredFov=base.fov + profile.fov*state.channelMix + handoff*1.05;
    const ck=reduced?1:follow(dt,8.5);
    state.camX=lerp(state.camX,desiredX,ck);state.camY=lerp(state.camY,desiredY,ck);state.camZ=lerp(state.camZ,desiredZ,ck);state.fov=lerp(state.fov,desiredFov,ck);
    instance.camera.position.set(state.camX,state.camY,state.camZ);
    if(Math.abs(instance.camera.fov-state.fov)>.001){instance.camera.fov=state.fov;instance.camera.updateProjectionMatrix();}
    look.set(profile.lookX*state.channelMix+px*.020*pointerCam-handoff*.022,profile.lookY*state.channelMix-py*.012*pointerCam-exit*.010,0);
    instance.camera.lookAt(look);

    /* OBJECT STAGING — additive and bounded. v364 still owns direct cabinet
       orbit; v365 owns channel micro-physics. v367 adds the shot composition. */
    const stageGain=manual?.28:1;
    instance.group.position.x+=profile.groupX*state.channelMix*stageGain + engage*.018 - handoff*.032;
    instance.group.position.y+=profile.groupY*state.channelMix*stageGain - engage*.006 + handoff*.016;
    instance.group.position.z+=profile.groupZ*state.channelMix*stageGain + arrive*.010 - handoff*.036;
    instance.group.rotation.y+=profile.yaw*state.channelMix*stageGain - handoff*.018;
    instance.group.rotation.x+=profile.pitch*state.channelMix*stageGain + exit*.004;
    instance.group.rotation.z+=profile.roll*state.channelMix*stageGain;
    const scaleFactor=1+engage*.010-handoff*.008;
    instance.group.scale.set(base.scale.x*scaleFactor,base.scale.y*scaleFactor,base.scale.z*scaleFactor);

    /* One environmental lighting grammar: a filmed warm key / cool rim balance.
       Channel choice changes emphasis, not the entire visual language. */
    if(instance.lights?.key){
      instance.lights.key.position.x=3.15-px*.95*pointerCam-profile.camX*3.6;
      instance.lights.key.position.y=4.0-py*.52*pointerCam+engage*.20;
      instance.lights.key.intensity+=state.energy*.08+engage*.035;
    }
    if(instance.lights?.fill){
      instance.lights.fill.position.x=-3.05+px*.78*pointerCam+profile.camX*2.1;
      instance.lights.fill.position.y=1.9+profile.camY*2.8;
      instance.lights.fill.intensity+=state.energy*.045;
    }
    if(instance.lights?.rim){
      instance.lights.rim.position.x=px*.68*pointerCam-profile.camX*2.2;
      instance.lights.rim.position.y=3.0-py*.28*pointerCam;
      instance.lights.rim.intensity+=state.energy*.055+handoff*.025;
    }

    const beat=p<.12?'boot':p<.50?'presence':p<.78?'channel':'handoff';
    if(beat!==state.beat){state.beat=beat;boot.dataset.v367Beat=beat;}
    setSceneVars(presence,px,py,p,engage,exit,handoff,profile);
    updateDom(profile,px,py,presence,engage,exit,handoff);

    state.frames++;
    boot.dataset.v367Frame=String(state.frames);
  }

  instance.sceneDirector={state,update,channels:CHANNELS,base};
  root.dataset.crtDirector='v367-ready';
  root.dataset.crtDirectorLoop='shared-v322-frame';
  boot.dataset.v367Channel=state.channel;
  boot.dataset.v367Beat=state.beat;
  return instance.sceneDirector;
}
