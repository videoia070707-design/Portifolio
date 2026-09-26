document.documentElement.classList.add('v313');
(()=>{
 const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)],clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
 const boot=q('#boot'),hero=q('#hero'),portal=q('#portal'),work=q('#work'),machine=q('#machine'),play=q('#playground'),studio=q('#studio'),people=q('#people'),contact=q('#contact');
 const projectPanels=qa('.project-panel'),consoleUnits=qa('.console-unit'),screens=qa('.console-unit .screen');
 let vh=innerHeight,vw=innerWidth,y=scrollY,vy=0,last=scrollY,px=0,py=0,sx=0,sy=0;
 const resize=()=>{vh=innerHeight;vw=innerWidth};addEventListener('resize',resize,{passive:true});
 addEventListener('pointermove',e=>{px=e.clientX/vw-.5;py=e.clientY/vh-.5},{passive:true});addEventListener('pointerleave',()=>{px=0;py=0});
 const prog=s=>{if(!s)return 0;const r=s.getBoundingClientRect();return clamp((vh-r.top)/(vh+r.height))};
 // enrich zero-gravity scene without depending on final GLBs
 const zone=q('.float-zone');
 if(zone && !q('.float.minidisc',zone)){
   const defs=[['minidisc','REF'],['mouse','MOVE'],['phone','AI'],['spring',''],['card3d','FRAME']];
   defs.forEach(([c,t],i)=>{const e=document.createElement('div');e.className=`float ${c}`;e.textContent=t;e.dataset.generated='v313';e.style.left=`${8+i*13}%`;e.style.top=`${62-(i%2)*12}%`;zone.appendChild(e)});
 }
 // screen scan and active module feedback
 screens.forEach((s,i)=>{const scan=document.createElement('i');scan.className='screen-scan';scan.style.animationDelay=`${i*.45}s`;s.appendChild(scan)});
 const injected=document.createElement('style');injected.textContent=`
 .v313 .float.minidisc{width:112px;height:94px;background:linear-gradient(145deg,#f5f2eb,#c9c4bb);border:1px solid #aaa;border-radius:5px;font:800 9px/1 'Courier New',monospace;display:grid;place-items:center;color:#333}.v313 .float.minidisc:before{content:'';position:absolute;width:42px;height:42px;border-radius:50%;background:conic-gradient(#bbb,#fff,#9ea7ac,#eee,#bbb);box-shadow:0 0 0 5px #d5d0c7}.v313 .float.mouse{width:72px;height:110px;border-radius:45% 45% 40% 40%;background:linear-gradient(145deg,#faf8f1,#cbc6bd);font:700 7px 'Courier New',monospace;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px}.v313 .float.mouse:before{content:'';position:absolute;left:50%;top:13px;width:1px;height:48px;background:#777}.v313 .float.phone{width:74px;height:138px;border-radius:13px;background:#232323;color:#ff5a18;border:7px solid #d7d2c9;display:grid;place-items:center;font:800 11px 'Courier New',monospace}.v313 .float.spring{width:130px;height:55px;background:repeating-radial-gradient(ellipse at center,transparent 0 7px,#ff5a18 8px 11px,transparent 12px 18px);box-shadow:none}.v313 .float.card3d{width:118px;height:78px;border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.9),rgba(215,210,200,.55));border:1px solid rgba(0,0,0,.14);font:800 8px 'Courier New',monospace;display:grid;place-items:center}.v313 .screen-scan{position:absolute;left:0;right:0;top:-20%;height:24%;background:linear-gradient(transparent,rgba(255,91,27,.16),transparent);animation:v313scan 3.4s linear infinite;pointer-events:none}@keyframes v313scan{to{transform:translateY(520%)}}
 .v313 .scene.is-active .scene-name{color:#fff}.v313 .scene.is-active .scene-no{color:#ff5a18}.v313 .project-panel.focused{z-index:9!important}.v313 .project-panel:not(.focused){transition:filter .7s ease,opacity .7s ease}.v313 .console-unit.active .screen{filter:saturate(1.08) brightness(1.05)}
 `;document.head.appendChild(injected);
 let extras=qa('.float[data-generated="v313"]');
 function frame(t){
   const ny=scrollY;const dy=ny-last;last=ny;vy=lerp(vy,dy,.07);y=lerp(y,ny,.11);sx=lerp(sx,px,.055);sy=lerp(sy,py,.055);
   document.documentElement.style.setProperty('--v313mx',sx.toFixed(3));document.documentElement.style.setProperty('--v313my',sy.toFixed(3));
   // portal: camera push is subtle and continuous
   if(portal){const p=prog(portal);const x=q('.portal-x',portal);if(x)x.style.filter=`drop-shadow(0 0 ${22+p*42}px rgba(255,90,24,${.18+p*.22}))`;qa('.tunnel-frame',portal).forEach((f,i)=>{const d=(i+1)*(8+p*18);f.style.opacity=String(.58+p*.34);f.style.marginLeft=`${sx*(i+1)*2}px`;f.style.marginTop=`${sy*(i+1)*1.4}px`})}
   // archive: one panel owns attention, neighbors recede
   if(work&&projectPanels.length){const p=clamp((prog(work)-.12)/.76);const idx=Math.round(p*(projectPanels.length-1));projectPanels.forEach((el,i)=>{const f=Math.abs(i-idx);el.classList.toggle('focused',i===idx);if(!el.matches(':hover')){el.style.opacity=String(i===idx?1:Math.max(.4,.82-f*.11));el.style.filter=`saturate(${i===idx?1:.64}) brightness(${i===idx?1:.76}) blur(${Math.min(1.2,f*.18)}px)`}})}
   // physical machine: active module follows scroll
   if(machine&&consoleUnits.length){const p=clamp((prog(machine)-.12)/.76);const idx=Math.min(consoleUnits.length-1,Math.floor(p*consoleUnits.length));consoleUnits.forEach((u,i)=>u.classList.toggle('active',i===idx))}
   // generated playground props float independently but gently
   extras.forEach((e,i)=>{if(e.classList.contains('dragging'))return;const a=t*.00045+i*1.37;e.style.translate=`${Math.sin(a*.83)*5+sx*(i%2?6:-6)}px ${Math.cos(a)*8+sy*(i%3?4:-4)}px`;e.style.rotate=`${Math.sin(a*.58)*2.4}deg`});
   // spatial studio: slower camera push and screens parallax
   if(studio){const p=prog(studio);qa('.studio-screen',studio).forEach((s,i)=>s.style.transform=`translate3d(${sx*(i-1)*4}px,${(p-.5)*(i+1)*-6+sy*3}px,0)`);const copy=q('.studio-copy',studio);if(copy)copy.style.transform=`translate3d(0,${(p-.5)*-9}px,0)`}
   if(contact){const p=prog(contact);const win=q('.contact-window',contact);if(win)win.style.transform=`perspective(1300px) rotateY(${sx*-1.15}deg) rotateX(${sy*.65}deg) translateY(${(p-.5)*-8}px)`}
   requestAnimationFrame(frame)
 }
 requestAnimationFrame(frame);
 // power button: tactile boot flash, then handoff to hero
 const power=q('[data-power]');if(power){power.addEventListener('click',()=>{document.documentElement.classList.add('boot-confirmed');const screen=q('.crt-screen');if(screen){screen.animate([{filter:'brightness(1)'},{filter:'brightness(2.4)'},{filter:'brightness(1)'}],{duration:520,easing:'cubic-bezier(.16,.84,.2,1)'})}setTimeout(()=>hero?.scrollIntoView({behavior:'smooth'}),280)})}
 // draggable generated props share the same direct-manipulation behavior
 extras.forEach(el=>{let drag=false,ox=0,oy=0;el.addEventListener('pointerdown',e=>{drag=true;el.classList.add('dragging');const r=el.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top;el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointermove',e=>{if(!drag)return;const z=el.parentElement.getBoundingClientRect();el.style.left=`${clamp(e.clientX-z.left-ox,0,z.width-el.offsetWidth)}px`;el.style.top=`${clamp(e.clientY-z.top-oy,0,z.height-el.offsetHeight)}px`});const stop=e=>{drag=false;el.classList.remove('dragging');try{el.releasePointerCapture?.(e.pointerId)}catch{}};el.addEventListener('pointerup',stop);el.addEventListener('pointercancel',stop)});
})();
