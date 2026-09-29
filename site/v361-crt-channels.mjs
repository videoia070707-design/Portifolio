/* The original screen mesh becomes a live programme. No extra scene or model. */
import * as THREE from './vendor/three.module.js';
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function attachCRTChannels(instance){
 if(instance.channels||instance.procedural||instance.previewProcedural)return;
 const screen=instance.model.getObjectByName('tripo_part_1');if(!screen?.isMesh)return;
 const boot=document.querySelector('#boot'),panel=document.querySelector('#crt-channel-panel');if(!panel)return;
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=544;
 const ctx=canvas.getContext('2d',{alpha:false});
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;
 screen.geometry.computeBoundingBox();const box=screen.geometry.boundingBox;
 const material=screen.material.clone();screen.material=material;
 material.onBeforeCompile=shader=>{
  shader.uniforms.channelFeed={value:texture};shader.uniforms.channelMin={value:box.min};shader.uniforms.channelMax={value:box.max};
  shader.vertexShader='varying vec3 channelPosition; varying vec3 channelNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nchannelPosition=position;channelNormal=normal;');
  shader.fragmentShader='uniform sampler2D channelFeed;uniform vec3 channelMin;uniform vec3 channelMax;varying vec3 channelPosition;varying vec3 channelNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 feedUV=(channelPosition.xy-channelMin.xy)/(channelMax.xy-channelMin.xy);
   float feedMask=smoothstep(0.15,0.6,channelNormal.z);
   vec3 feedColor=texture2D(channelFeed,feedUV).rgb;
   diffuseColor.rgb=mix(diffuseColor.rgb,feedColor*.10,feedMask);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=feedColor*feedMask*.88;');
 };
 material.customProgramCacheKey=()=> 'movx-live-screen-v361';material.needsUpdate=true;
 const state={channel:'',art:0,variation:0,mobile:false,paused:reduced,phase:0,amount:.5,frames:0,changes:0,last:0,transition:0,screenHover:false};
 const controls=document.createElement('div');controls.className='crt-program-controls';
 const action=document.createElement('button');action.type='button';
 const rangeLabel=document.createElement('label');rangeLabel.className='crt-program-range';
 const labelText=document.createElement('span');const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.value='50';rangeLabel.append(labelText,range);
 const pause=document.createElement('button');pause.type='button';pause.className='crt-program-pause';
 const help=document.createElement('p');help.className='crt-program-help';
 controls.append(action,rangeLabel,pause);panel.append(controls,help);
 const works=[['assets/projects/voltara-03.webp','VOLTARA'],['assets/projects/hardwork-modo/hardwork-modo-01.webp','HARDWORK'],['assets/projects/belive-01.webp','BELIVE']];
 const images=works.map(([src])=>{const img=new Image();img.src=src;img.onload=()=>{state.last=0};return img});
 const descriptions={direction:'Direção de arte em projetos reais. Troque a arte na própria TV.',motion:'Experimente o ritmo: controle a animação e encontre o seu tempo.',ai:'Um estudo generativo ao vivo. Mude a semente e descubra outra composição.',digital:'A mesma interface, dois formatos. Explore como o layout se adapta.'};
 const title={direction:'DIREÇÃO',motion:'MOTION',ai:'GENERATIVO',digital:'DIGITAL'};
 const hint={direction:'Toque na tela da TV para trocar a arte',motion:'Ajuste o ritmo ou pause para observar cada quadro',ai:'Mude a variação e ajuste a forma — um estudo, não um case',digital:'Alterne entre desktop e mobile na tela da TV'};
 function sync(){
  action.textContent=state.channel==='direction'?'Próxima arte ↗':state.channel==='motion'?(state.paused?'Reproduzir animação':'Pausar animação'):state.channel==='ai'?'Gerar outra variação ↗':(state.mobile?'Ver desktop ↗':'Ver mobile ↗');
  rangeLabel.hidden=!['motion','ai'].includes(state.channel);labelText.textContent=state.channel==='motion'?'Ritmo':'Forma';range.setAttribute('aria-label',state.channel==='motion'?'Ritmo da animação':'Forma generativa');
  pause.hidden=state.channel!=='ai';pause.textContent=state.paused?'Ativar movimento':'Pausar movimento';pause.setAttribute('aria-pressed',String(state.paused));
  help.textContent=hint[state.channel];panel.querySelector('p').textContent=descriptions[state.channel];
 }
 function change(channel,time){const knob=instance.model.getObjectByName('tripo_part_8');if(knob)knob.rotation.z=['direction','motion','ai','digital'].indexOf(channel)*.45;state.channel=channel;state.transition=time;state.changes++;state.last=0;boot.dataset.crtProgram=channel;sync();}
 function interact(){
  if(state.channel==='direction')state.art=(state.art+1)%works.length;
  if(state.channel==='motion')state.paused=!state.paused;
  if(state.channel==='ai')state.variation++;
  if(state.channel==='digital')state.mobile=!state.mobile;
  state.transition=performance.now();state.last=0;state.changes++;sync();
 }
 action.addEventListener('click',interact);pause.addEventListener('click',()=>{state.paused=!state.paused;state.last=0;sync()});
 range.addEventListener('input',()=>{state.amount=Number(range.value)/100;if(state.channel==='motion'&&state.paused)state.phase=state.amount*Math.PI*2;state.last=0;state.changes++});
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function hit(event){
  const r=instance.canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,instance.camera);
  const hits=ray.intersectObject(instance.model,true);return hits[0]?.object;
 }
 const wrap=boot.querySelector('.crt-wrap');let down=null;
 wrap.addEventListener('pointermove',e=>{const target=hit(e);state.screenHover=target===screen||target?.name==='tripo_part_8';wrap.style.cursor=state.screenHover?'pointer':'default'});
 wrap.addEventListener('pointerleave',()=>{state.screenHover=false;wrap.style.cursor='default'});
 wrap.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
 wrap.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){const target=hit(e);if(target===screen)interact();else if(target?.name==='tripo_part_8'){const modes=['direction','motion','ai','digital'];boot.querySelector('[data-crt-mode-control="'+modes[(modes.indexOf(state.channel)+1)%4]+'"]').click()}}down=null});
 function text(str,x,y,size=24,color='#f5f0e6',weight=700){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.fillText(str,x,y)}
 function coverImage(img,x,y,w,h){if(!img.complete||!img.naturalWidth)return;const k=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*k)/2,y+(h-img.height*k)/2,img.width*k,img.height*k)}
 function direction(){
  const i=state.art;ctx.fillStyle='#11110f';ctx.fillRect(0,0,768,544);
  coverImage(images[i],135,76,498,410);text(works[i][1],38,510,20);text(`0${i+1} / 03`,622,510,18,'#bdb8af');
 }
 function motion(t){
  const phase=state.phase*(.6+state.amount*1.7);ctx.fillStyle='#f14a1b';ctx.fillRect(0,0,768,544);
  const words=['MAKE','IT','MOVE'];words.forEach((word,i)=>{
   const x=66+Math.sin(phase*1.8-i*.7)*(i===1?105:36);ctx.save();ctx.translate(x,190+i*122);ctx.scale(1+Math.sin(phase-i*.5)*.06,1);text(word,0,0,112,i===1?'#f6eddb':'#191511',900);ctx.restore();
  });
 }
 function generative(){
  ctx.fillStyle='#121015';ctx.fillRect(0,0,768,544);
  const phase=state.phase*.35,seed=state.variation*.83;ctx.save();ctx.translate(384,282);
  for(let k=0;k<=2;k++){const scale=1-k*.22;ctx.beginPath();for(let i=0;i<=180;i++){
   const a=i/180*Math.PI*2,r=(144+Math.sin(a*(3+state.variation%4)+phase+seed)*(20+state.amount*48)+Math.cos(a*2-phase)*22)*scale;
   const x=Math.cos(a)*r*1.22,y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }ctx.closePath();ctx.fillStyle=['#f25424','#ecad85','#f4e3cd'][k];ctx.fill();}ctx.restore();
  text(`VARIAÇÃO ${String(state.variation+1).padStart(2,'0')}`,38,510,18,'#ddd0c8');
 }
 function digital(){
  ctx.fillStyle='#e8e1d5';ctx.fillRect(0,0,768,544);
  const w=state.mobile?258:636,x=(768-w)/2,y=87,h=395;ctx.fillStyle='#11110f';ctx.fillRect(x,y,w,h);
  text('MOVX',x+22,y+40,state.mobile?21:26);text('↗',x+w-45,y+40,24,'#f26032');
  const size=state.mobile?35:56; text('IDEIAS',x+22,y+112,size);text('EM MOVIMENTO',x+22,y+112+size,state.mobile?22:47);
  ctx.fillStyle='#fa5223';const pulse=state.paused?0:Math.sin(state.phase)*.035;ctx.fillRect(x+22,y+212,w-44,112);
  text('DESIGN + EXPERIÊNCIA',x+36,y+247,state.mobile?13:22,'#171411');text(state.mobile?'FEITO PARA TOCAR':'FEITO PARA EXPLORAR',x+36,y+285,state.mobile?12:19,'#171411');
  ctx.fillStyle='#f5efe3';ctx.fillRect(x+22,y+350,(w-44)*(.55+pulse),3);text(state.mobile?'MOBILE':'DESKTOP',38,510,18,'#171411');
 }
 function update(time){
  const selected=boot.dataset.crtMode;const channel=title[selected]?selected:'direction';
  if(channel!==state.channel)change(channel,time);
  const dt=state.last?Math.min((time-state.last)/1000,.1):0;
  const animating=!state.paused&&['motion','ai'].includes(channel);
  if(state.last&&time-state.last<1000/24)return;
  if(state.last&&!animating&&(reduced||time-state.transition>500))return;
  if(animating)state.phase+=dt;state.last=time;
  if(channel==='direction')direction();else if(channel==='motion')motion(time);else if(channel==='ai')generative();else digital();
  // A single low-luminance tuning wipe; no random flicker or strobe.
  const elapsed=time-state.transition;
  if(!reduced&&elapsed<420){ctx.fillStyle='#151311';ctx.fillRect(0,0,768,544*(1-Math.min(1,elapsed/420)));}
  text(title[channel],38,49,22,channel==='digital'||channel==='motion'?'#191511':'#eee5d7');
  const vignette=ctx.createRadialGradient(384,272,120,384,272,460);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(0,0,0,.34)');ctx.fillStyle=vignette;ctx.fillRect(0,0,768,544);
  texture.needsUpdate=true;state.frames++;boot.dataset.crtScreenFrame=String(state.frames);
 }
 instance.channels={state,update,canvas,screen,texture};boot.dataset.crtScreen='live';
 return instance.channels;
}
