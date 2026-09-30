/* MOVX v371 — optical depth for the existing CRT screen mesh.
   No new model, renderer, canvas, scene, listener or RAF. This layer wraps the
   v361 screen material shader and consumes states already updated by the shared
   v322 frame so the authored screen reads as curved emissive glass. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const TINT={
  direction:new THREE.Color(0xff9567),
  motion:new THREE.Color(0xff5b2e),
  ai:new THREE.Color(0xff8b5d),
  digital:new THREE.Color(0xc7d8ff),
};

export function attachCRTGlassDepth(instance){
  if(instance.crtGlassDepth||!instance.channels?.screen||instance.procedural||instance.previewProcedural)return instance.crtGlassDepth;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const screen=instance.channels.screen;
  const material=screen.material;
  if(!root||!boot||!material)return null;

  const baseCompile=typeof material.onBeforeCompile==='function'?material.onBeforeCompile.bind(material):null;
  const baseKey=typeof material.customProgramCacheKey==='function'?material.customProgramCacheKey.bind(material):()=>'';
  const uniforms={
    pointer:{value:new THREE.Vector2(0,0)},
    presence:{value:0},
    energy:{value:.26},
    press:{value:0},
    tint:{value:TINT.direction.clone()},
  };
  const state={
    reduced,compiled:false,compileCount:0,frames:0,channel:'direction',
    pointerX:0,pointerY:0,presence:0,energy:.26,press:0,
    tint:'#ff9567',roughnessBefore:Number.isFinite(material.roughness)?material.roughness:null,
  };

  /* Keep the existing live-channel shader intact, then add only the optical
     response. `normal` and `vViewPosition` are native Three standard-material
     varyings, while feedUV/feedMask are the already validated v361 screen map. */
  material.onBeforeCompile=(shader,renderer)=>{
    baseCompile?.(shader,renderer);
    shader.uniforms.v371GlassPointer=uniforms.pointer;
    shader.uniforms.v371GlassPresence=uniforms.presence;
    shader.uniforms.v371GlassEnergy=uniforms.energy;
    shader.uniforms.v371GlassPress=uniforms.press;
    shader.uniforms.v371GlassTint=uniforms.tint;
    shader.fragmentShader=`uniform vec2 v371GlassPointer;\nuniform float v371GlassPresence;\nuniform float v371GlassEnergy;\nuniform float v371GlassPress;\nuniform vec3 v371GlassTint;\n${shader.fragmentShader}`;
    const glassChunk=`#include <emissivemap_fragment>
      vec2 v371Uv=feedUV*2.0-1.0;
      float v371Radius=length(v371Uv*vec2(.88,1.04));
      float v371Edge=smoothstep(.54,1.06,v371Radius);
      vec2 v371ShineCenter=vec2(.30+v371GlassPointer.x*.11,.22-v371GlassPointer.y*.085);
      vec2 v371Delta=(feedUV-v371ShineCenter)*vec2(1.0,1.34);
      float v371Shine=exp(-dot(v371Delta,v371Delta)*17.0);
      float v371Facing=clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0);
      float v371Fresnel=pow(1.0-v371Facing,2.35);
      float v371Sweep=1.0-smoothstep(.0,.16,abs((feedUV.x+feedUV.y*.24)-(.31+v371GlassPointer.x*.055)));
      float v371Gain=feedMask*(.58+v371GlassPresence*.42);
      diffuseColor.rgb*=1.0-feedMask*v371Edge*(.032+v371GlassPresence*.026);
      diffuseColor.rgb+=v371GlassTint*(v371Shine*.020+v371Fresnel*.032+v371Sweep*.008)*v371Gain;
      totalEmissiveRadiance+=v371GlassTint*(v371Shine*.028+v371Fresnel*.046+v371Sweep*.010)*(0.62+v371GlassEnergy*.38+v371GlassPress*.08)*v371Gain;`;
    if(!shader.fragmentShader.includes('#include <emissivemap_fragment>')){
      throw new Error('MOVX v371 could not find emissivemap shader hook');
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',glassChunk);
    state.compiled=true;state.compileCount++;
    boot.dataset.crtGlassShader='compiled';
  };
  material.customProgramCacheKey=()=>`${baseKey()}|movx-crt-glass-v371`;

  /* A slightly lower roughness lets the existing Scene-01 key/fill/rim lights
     register on the actual curved mesh instead of relying only on a DOM halo. */
  if(Number.isFinite(material.roughness))material.roughness=Math.min(material.roughness,.38);
  if(Number.isFinite(material.metalness))material.metalness=Math.min(material.metalness,.02);
  material.needsUpdate=true;

  function update(){
    const director=instance.sceneDirector?.state;
    const presence=instance.scenePresence?.state||instance.presence?.state;
    const channel=TINT[instance.channels?.state?.channel]?instance.channels.state.channel:'direction';
    const px=Number(director?.pointerX??presence?.x??0);
    const py=Number(director?.pointerY??presence?.y??0);
    const p=reduced?0:Number(director?.presence??presence?.mix??presence?.hoverMix??0);
    const energy=Number(director?.energy??.26);
    const press=instance.directManipulation?.state?.active||instance.objectInteraction?.state?.active?1:0;

    state.pointerX=clamp(px,-1,1);state.pointerY=clamp(py,-1,1);
    state.presence=clamp(p);state.energy=clamp(energy);state.press=press;
    state.channel=channel;state.tint=`#${TINT[channel].getHexString()}`;state.frames++;
    uniforms.pointer.value.set(state.pointerX,state.pointerY);
    uniforms.presence.value=state.presence;
    uniforms.energy.value=state.energy;
    uniforms.press.value=state.press;
    uniforms.tint.value.copy(TINT[channel]);
    boot.dataset.crtGlassChannel=channel;
    boot.dataset.crtGlassDepth=state.presence>.08?'engaged':'idle';
    boot.dataset.crtGlassFrame=String(state.frames);
  }

  instance.crtGlassDepth={state,uniforms,update,screen,material};
  root.dataset.crtGlass='v371-ready';
  boot.dataset.crtGlassShader='pending';
  return instance.crtGlassDepth;
}
