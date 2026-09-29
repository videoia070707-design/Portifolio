/* MOVX v362 — tactile CRT surface.
   This augments the approved v361 live channels without adding another model,
   WebGL context, visible canvas, or render loop. Pointer/touch feedback is local
   to the real screen glass and selector so the TV reads as an interactive object. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const expFollow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

export function attachCRTTactility(instance){
  if(instance.tactility||!instance.channels||instance.procedural||instance.previewProcedural)return instance.tactility;
  const {screen,canvas,texture,state:channelState}=instance.channels;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  if(!screen?.isMesh||!canvas||!wrap)return null;

  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)return null;
  const base=document.createElement('canvas');base.width=canvas.width;base.height=canvas.height;
  const baseCtx=base.getContext('2d',{alpha:false});
  const scan=document.createElement('canvas');scan.width=canvas.width;scan.height=canvas.height;
  const scanCtx=scan.getContext('2d');
  scanCtx.clearRect(0,0,scan.width,scan.height);
  scanCtx.fillStyle='rgba(13,10,8,.16)';
  for(let y=1;y<scan.height;y+=4)scanCtx.fillRect(0,y,scan.width,1);

  const material=screen.material;
  const baseEmissive=Number.isFinite(material?.emissiveIntensity)?material.emissiveIntensity:null;
  const baseRoughness=Number.isFinite(material?.roughness)?material.roughness:null;
  const knob=instance.model.getObjectByName('tripo_part_8');
  const knobBaseScale=knob?.scale?.clone?.()||null;
  const knobBaseX=knob?.rotation?.x||0;

  const tactile={
    reduced,coarse,
    hover:0,targetHover:0,knobHover:0,targetKnobHover:0,
    x:.5,y:.5,targetX:.5,targetY:.5,
    pulse:0,knobKick:0,
    lastTime:performance.now(),lastComposite:0,lastChannelFrame:-1,
    lastChannel:channelState.channel||'direction',
    visualUpdates:0,pointerSamples:0,shiftX:0,shiftY:0,
    baseEmissive,baseRoughness,lastHit:'none'
  };

  const ray=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const hitAt=event=>{
    const r=instance.canvas.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,instance.camera);
    return ray.intersectObject(instance.model,true)[0]||null;
  };
  const setHit=(kind,hit,event)=>{
    tactile.lastHit=kind;
    boot.dataset.crtHit=kind;
    tactile.targetHover=kind==='screen'?1:0;
    tactile.targetKnobHover=kind==='knob'?1:0;
    if(kind==='screen'){
      const r=instance.canvas.getBoundingClientRect();
      const u=hit?.uv?.x??((event.clientX-r.left)/r.width);
      const v=hit?.uv?.y??(1-(event.clientY-r.top)/r.height);
      tactile.targetX=clamp(u,0,1);tactile.targetY=clamp(v,0,1);tactile.pointerSamples++;
    }
  };

  wrap.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    const hit=hitAt(event),obj=hit?.object;
    if(obj===screen)setHit('screen',hit,event);
    else if(obj===knob)setHit('knob',hit,event);
    else setHit('body',hit,event);
  },{passive:true});
  wrap.addEventListener('pointerleave',()=>{
    tactile.lastHit='none';delete boot.dataset.crtHit;
    tactile.targetHover=0;tactile.targetKnobHover=0;
    tactile.targetX=.5;tactile.targetY=.5;
  },{passive:true});
  wrap.addEventListener('pointerup',event=>{
    const hit=hitAt(event),obj=hit?.object;
    if(obj===screen){tactile.pulse=1;setHit('screen',hit,event)}
    if(obj===knob){tactile.knobKick=1;setHit('knob',hit,event)}
  },{passive:true});

  for(const control of boot.querySelectorAll('[data-crt-mode-control]')){
    control.addEventListener('click',()=>{tactile.pulse=Math.max(tactile.pulse,.62);tactile.knobKick=1});
  }
  for(const control of boot.querySelectorAll('.crt-program-controls button')){
    control.addEventListener('click',()=>{tactile.pulse=Math.max(tactile.pulse,.72)});
  }

  const captureBase=()=>{
    baseCtx.clearRect(0,0,base.width,base.height);
    baseCtx.drawImage(canvas,0,0);
    tactile.lastChannelFrame=channelState.frames;
  };
  captureBase();

  function composite(){
    const w=canvas.width,h=canvas.height;
    const hover=tactile.hover;
    const shiftX=reduced?0:(tactile.x-.5)*9*hover;
    const shiftY=reduced?0:-(tactile.y-.5)*6*hover;
    tactile.shiftX=shiftX;tactile.shiftY=shiftY;

    ctx.save();
    ctx.clearRect(0,0,w,h);
    if(reduced){
      ctx.drawImage(base,0,0);
    }else{
      const pad=3.5;
      ctx.translate(shiftX,shiftY);
      ctx.drawImage(base,-pad,-pad,w+pad*2,h+pad*2);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha=.055+hover*.055;
    ctx.drawImage(scan,0,0);
    ctx.restore();

    if(hover>.015&&!reduced){
      const px=tactile.x*w,py=(1-tactile.y)*h;
      const glow=ctx.createRadialGradient(px,py,4,px,py,150);
      glow.addColorStop(0,`rgba(255,238,214,${.085*hover})`);
      glow.addColorStop(.42,`rgba(255,111,42,${.026*hover})`);
      glow.addColorStop(1,'rgba(255,90,24,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
      if(channelState.channel==='digital'){
        ctx.fillStyle=`rgba(245,80,28,${.72*hover})`;
        ctx.beginPath();ctx.arc(px,py,3.2,0,Math.PI*2);ctx.fill();
      }
    }

    if(tactile.pulse>.01&&!reduced){
      const a=tactile.pulse;
      ctx.fillStyle=`rgba(255,236,210,${.035*a})`;ctx.fillRect(0,0,w,h);
      const y=h*(.28+.44*(1-a));
      const beam=ctx.createLinearGradient(0,y-14,0,y+14);
      beam.addColorStop(0,'rgba(255,98,28,0)');
      beam.addColorStop(.5,`rgba(255,118,44,${.10*a})`);
      beam.addColorStop(1,'rgba(255,98,28,0)');
      ctx.fillStyle=beam;ctx.fillRect(0,y-14,w,28);
    }

    texture.needsUpdate=true;
    tactile.visualUpdates++;
    boot.dataset.crtTactileFrame=String(tactile.visualUpdates);
  }

  function update(time){
    const dt=Math.min(Math.max((time-tactile.lastTime)/1000,0),.1);tactile.lastTime=time;
    const follow=reduced?1:expFollow(dt,coarse?18:12);
    tactile.hover+=(tactile.targetHover-tactile.hover)*follow;
    tactile.knobHover+=(tactile.targetKnobHover-tactile.knobHover)*follow;
    tactile.x+=(tactile.targetX-tactile.x)*follow;
    tactile.y+=(tactile.targetY-tactile.y)*follow;
    if(reduced){tactile.pulse=0;tactile.knobKick=0}else{
      tactile.pulse*=Math.exp(-dt*12.5);
      tactile.knobKick*=Math.exp(-dt*13.5);
    }

    if(channelState.channel!==tactile.lastChannel){
      tactile.lastChannel=channelState.channel;
      tactile.pulse=Math.max(tactile.pulse,.78);
      tactile.knobKick=1;
    }

    const freshFrame=channelState.frames!==tactile.lastChannelFrame;
    if(freshFrame)captureBase();

    if(material){
      if(baseEmissive!==null)material.emissiveIntensity=baseEmissive+tactile.hover*.14+tactile.pulse*.09;
      if(baseRoughness!==null)material.roughness=clamp(baseRoughness-tactile.hover*.035,.12,1);
    }
    if(knob&&knobBaseScale){
      knob.rotation.x=knobBaseX-tactile.knobKick*.075-tactile.knobHover*.016;
      knob.scale.copy(knobBaseScale).multiplyScalar(1+tactile.knobHover*.016-tactile.knobKick*.018);
    }

    const active=freshFrame||tactile.hover>.004||tactile.targetHover>.004||tactile.pulse>.004||tactile.knobHover>.004||tactile.knobKick>.004;
    if(!active)return;
    if(time-tactile.lastComposite<1000/30&&!freshFrame)return;
    tactile.lastComposite=time;
    composite();
  }

  instance.tactility={state:tactile,update,base,scan};
  document.documentElement.dataset.crtTactility='v362-ready';
  boot.dataset.crtTactility='ready';
  return instance.tactility;
}
