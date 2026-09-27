/* MOVX v353 — cinematic motion runtime.
   Keeps the real CRT GLB untouched and animates wrappers/copy only. */
(()=>{
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease='cubic-bezier(.16,.84,.2,1)';
  root.classList.add('v353-motion');
  root.dataset.motion='v353-cinematic';
  root.dataset.motionReduced=String(reduced);

  const scenes=$$('.scene');
  const boot=$('#boot');
  const crtWrap=$('.crt-wrap');
  const bootCopy=$('.boot-copy');
  const header=$('.global');
  let introDone=false;

  function play(el,keyframes,options={}){
    if(!el||reduced)return null;
    return el.animate(keyframes,{duration:options.duration||800,delay:options.delay||0,easing:options.easing||ease,fill:'both'});
  }

  function bootIntro(){
    if(reduced){
      introDone=true;
      root.dataset.motionIntro='ready';
      return;
    }
    play(header,[{opacity:0,transform:'translate3d(0,-18px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:700,delay:80});
    play($('.boot-scene .scene-bar'),[{opacity:0,transform:'translate3d(0,-18px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:760,delay:120});
    play(crtWrap,[
      {opacity:0,filter:'blur(10px)',transform:'translate3d(-44px,28px,0) scale(.94)'},
      {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0) scale(1)'}
    ],{duration:1250,delay:130});
    const eyebrow=$('.boot-copy .eyebrow');
    play(eyebrow,[{opacity:0,transform:'translate3d(0,16px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:620,delay:350});
    $$('.boot-title span').forEach((line,i)=>play(line,[
      {opacity:0,filter:'blur(7px)',transform:'translate3d(0,72px,0) skewY(3deg)'},
      {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0) skewY(0deg)'}
    ],{duration:900,delay:430+i*105}));
    play($('.boot-copy .copy'),[{opacity:0,transform:'translate3d(0,24px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:760,delay:770});
    $$('.boot-tags .tag').forEach((tag,i)=>play(tag,[
      {opacity:0,transform:'translate3d(0,18px,0) scale(.96)'},
      {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
    ],{duration:560,delay:900+i*70}));
    setTimeout(()=>{
      introDone=true;
      root.dataset.motionIntro='ready';
      // Clear the intro animation's transform so scroll/pointer motion owns it.
      crtWrap?.getAnimations().forEach(a=>{try{a.cancel()}catch{}});
      if(crtWrap){crtWrap.style.opacity='1';crtWrap.style.filter='none'}
    },1450);
  }

  function revealScene(scene){
    if(scene.dataset.motionVisible==='true')return;
    scene.dataset.motionVisible='true';
    if(reduced)return;
    const bar=$('.scene-bar',scene);
    if(scene!==boot)play(bar,[{opacity:.2,transform:'translate3d(0,-14px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:650});
    const candidates=[...new Set([
      ...$$('[data-reveal]',scene),
      ...$$('.tunnel-copy,.tunnel-side,.work-overlay',scene)
    ])];
    candidates.forEach((el,i)=>{
      if(scene===boot)return;
      play(el,[
        {opacity:0,filter:'blur(5px)',transform:'translate3d(0,42px,0)'},
        {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0)'}
      ],{duration:900,delay:Math.min(i*90,360)});
    });
    const units=$$('.console-unit',scene);
    units.forEach((el,i)=>play(el,[
      {opacity:0,transform:'translate3d(0,32px,0) scale(.97)'},
      {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
    ],{duration:760,delay:220+i*85}));
    const stats=$$('.stats>div',scene);
    stats.forEach((el,i)=>play(el,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,delay:240+i*90}));
  }

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting)revealScene(entry.target)});
  },{threshold:.15,rootMargin:'0px 0px -8% 0px'});
  scenes.forEach(scene=>observer.observe(scene));
  if(boot)revealScene(boot);
  bootIntro();

  let tx=0,ty=0,mx=0,my=0,lastY=scrollY,velocity=0;
  addEventListener('pointermove',e=>{
    if(coarse)return;
    tx=(e.clientX/Math.max(innerWidth,1)-.5)*2;
    ty=(e.clientY/Math.max(innerHeight,1)-.5)*2;
  },{passive:true});
  addEventListener('pointerleave',()=>{tx=0;ty=0},{passive:true});

  const parallaxCopies=[
    ['#hero','.hero-copy'],['#machine','.machine-copy'],['#playground','.play-copy'],
    ['#studio','.studio-copy'],['#people','.people-copy'],['#contact','.contact-copy']
  ].map(([sceneSel,copySel])=>({scene:$(sceneSel),copy:$(copySel)})).filter(x=>x.scene&&x.copy);

  function sceneProgress(scene){
    const r=scene.getBoundingClientRect();
    return clamp((innerHeight-r.top)/(innerHeight+r.height));
  }

  function tick(){
    const y=scrollY;
    velocity=lerp(velocity,y-lastY,.12);
    lastY=y;
    mx=lerp(mx,tx,.07);my=lerp(my,ty,.07);
    root.style.setProperty('--v353-pointer-x',mx.toFixed(4));
    root.style.setProperty('--v353-pointer-y',my.toFixed(4));
    root.style.setProperty('--v353-velocity',clamp(velocity/42,-1,1).toFixed(4));

    scenes.forEach(scene=>{
      const p=sceneProgress(scene);
      scene.style.setProperty('--v353-p',p.toFixed(4));
      const r=scene.getBoundingClientRect();
      const visible=r.bottom>0&&r.top<innerHeight;
      scene.classList.toggle('v353-active',visible&&p>.18&&p<.86);
    });

    if(!reduced&&introDone&&crtWrap&&boot){
      const p=sceneProgress(boot);
      const x=mx*7;
      const yy=my*4-(p-.34)*18;
      const s=1+Math.max(0,p-.35)*.014;
      crtWrap.style.transform=`translate3d(${x.toFixed(2)}px,${yy.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
      if(bootCopy)bootCopy.style.transform=`translate3d(0,${(-Math.max(0,p-.35)*13).toFixed(2)}px,0)`;
    }

    if(!reduced){
      parallaxCopies.forEach(({scene,copy})=>{
        const r=scene.getBoundingClientRect();
        if(r.bottom<0||r.top>innerHeight)return;
        const p=sceneProgress(scene);
        const shift=(.5-p)*18;
        copy.style.transform=`translate3d(0,${shift.toFixed(2)}px,0)`;
      });
      const activeBar=$('.scene.v353-active .scene-bar');
      if(activeBar)activeBar.style.transform=`translate3d(${clamp(velocity,-12,12)*.18}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  root.dataset.motionReady='true';
})();
