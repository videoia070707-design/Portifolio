/* MOVX v74/v78 — keyboard-complete project access
   Makes every authored project opener operable by keyboard and makes case-dialog
   focus deterministic across animated openings/closings without changing layout or copy. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const viewer=document.getElementById('caseViewer');
  root.classList.add('movx-v74','movx-v78');
  root.dataset.movxRelease='v102-layout-integrity';
  root.dataset.movxDialogFocus='v78-deterministic';

  const naturalInteractive=el=>el.matches('a[href],button,input,select,textarea,summary,[contenteditable="true"]');
  const decorate=scope=>{
    const nodes=[];
    if(scope?.matches?.('[data-open-project]'))nodes.push(scope);
    scope?.querySelectorAll?.('[data-open-project]').forEach(el=>nodes.push(el));
    nodes.forEach(el=>{
      if(el.dataset.v74Keyboard==='true')return;
      el.dataset.v74Keyboard='true';
      el.setAttribute('aria-controls','caseViewer');
      el.setAttribute('aria-haspopup','dialog');
      if(!naturalInteractive(el)&&!el.hasAttribute('tabindex')){
        el.setAttribute('role','button');
        el.tabIndex=0;
      }
    });
  };

  decorate(document);
  if('MutationObserver'in window){
    const mo=new MutationObserver(mutations=>{
      mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1)decorate(node);}));
    });
    ['#archiveGrid','#projectsList','#loopWall','#caseSlides'].map(s=>document.querySelector(s)).filter(Boolean).forEach(host=>mo.observe(host,{childList:true,subtree:true}));
  }

  let lastOpener=null;
  const rememberOpener=target=>{
    const opener=target?.closest?.('[data-open-project]');
    if(opener&&!viewer?.contains(opener))lastOpener=opener;
  };
  document.addEventListener('pointerdown',event=>rememberOpener(event.target),{capture:true,passive:true});
  document.addEventListener('focusin',event=>rememberOpener(event.target),true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const opener=event.target?.closest?.('[data-open-project][data-v74-keyboard="true"]');
    if(!opener||naturalInteractive(opener)||viewer?.contains(opener))return;
    event.preventDefault();
    lastOpener=opener;
    opener.click();
  });

  if(viewer){
    viewer.setAttribute('role','dialog');
    viewer.setAttribute('aria-describedby','caseTopLabel');
    let wasOpen=viewer.classList.contains('open');
    let focusToken=0;

    const focusDialog=token=>{
      if(token!==focusToken||!viewer.classList.contains('open'))return;
      const close=viewer.querySelector('#caseClose,.case-close');
      if(!close)return;
      try{close.focus({preventScroll:true});}catch(_){close.focus();}
    };

    const syncState=()=>{
      const open=viewer.classList.contains('open');
      viewer.setAttribute('aria-hidden',open?'false':'true');
      viewer.setAttribute('aria-modal',open?'true':'false');

      if(open&&!wasOpen){
        const token=++focusToken;
        /* Two frames let the viewer/hero transition mount first; the timeout is a
           second deterministic guard for slower CI/GPU runs. */
        requestAnimationFrame(()=>requestAnimationFrame(()=>focusDialog(token)));
        setTimeout(()=>focusDialog(token),180);
      }else if(!open&&wasOpen){
        ++focusToken;
        const restore=lastOpener;
        if(restore?.isConnected){
          setTimeout(()=>{
            if(viewer.classList.contains('open')||!restore.isConnected)return;
            try{restore.focus({preventScroll:true});}catch(_){restore.focus();}
          },40);
        }
      }
      wasOpen=open;
    };

    viewer.setAttribute('aria-hidden',wasOpen?'false':'true');
    viewer.setAttribute('aria-modal',wasOpen?'true':'false');
    if(wasOpen){const token=++focusToken;requestAnimationFrame(()=>requestAnimationFrame(()=>focusDialog(token)));}
    if('MutationObserver'in window)new MutationObserver(syncState).observe(viewer,{attributes:true,attributeFilter:['class']});
  }
})();

/* MOVX v83 — resilient editorial motion owner
   v52/v54/v55 can still maintain semantic/state logic, but visible motion for the
   repaired chapters is owned here and never depends on WebGL successfully painting. */
(()=>{
  'use strict';
  const root=document.documentElement;
  root.classList.add('movx-v83');
  root.dataset.movxStability='v83-editorial-black';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen=new WeakSet();
  let observer=null;

  const reveal=node=>{
    if(!node)return;
    node.classList.add('v83-in');
  };

  if(!reduced&&'IntersectionObserver'in window){
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:'0px 0px -7% 0px'});
  }

  const decorateNode=(node,index=0)=>{
    if(!node||seen.has(node))return;
    seen.add(node);
    node.classList.add('v83-motion-item');
    node.style.setProperty('--v83-index',String(index));
    if(reduced||!observer){reveal(node);return;}
    const rect=node.getBoundingClientRect();
    if(rect.top<innerHeight*.9&&rect.bottom>0)reveal(node);
    else observer.observe(node);
    /* Safety guarantee: never leave authored content invisible if observers are throttled. */
    setTimeout(()=>reveal(node),2600+index*80);
  };

  const scan=()=>{
    const architecture=document.querySelector('.v52-architecture-section');
    if(architecture){
      decorateNode(architecture.querySelector('.v52-architecture-copy'),0);
      [...architecture.querySelectorAll('.v52-mobile-artworks img')].forEach((node,index)=>decorateNode(node,index+1));
    }
    const process=document.querySelector('#process.process-section');
    if(process){
      decorateNode(process.querySelector('.process-title'),0);
      [...process.querySelectorAll('.process-list li')].forEach((node,index)=>decorateNode(node,index+1));
    }
  };

  scan();
  requestAnimationFrame(scan);
  setTimeout(scan,180);
  setTimeout(scan,700);
  if('MutationObserver'in window){
    const mo=new MutationObserver(scan);
    mo.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),6000);
  }
})();

/* MOVX v84 — stability, hierarchy and single reveal ownership
   Repairs responsive navigation collisions, removes legacy decorative stages that
   created empty bands, and gives authored content one deterministic reveal owner. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  if(!body)return;
  root.classList.add('movx-v84');
  root.dataset.movxStability='v84-single-motion-owner';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease='cubic-bezier(.16,1,.3,1)';

  if(!document.getElementById('movx-v84-stability-style')){
    const style=document.createElement('style');
    style.id='movx-v84-stability-style';
    style.textContent=`
      html.movx-v84 body{--v84-ease:${ease};--v84-ui:cubic-bezier(.4,0,.2,1)}

      /* Header layout is owned by layout-integrity.css. */

      /* Opening map: consistent numbering and quieter, clearer click targets. */
      html.movx-v84 body[data-page="social"] .hero-index{background:#050505!important;color:#f1ece7!important;border-color:rgba(255,255,255,.11)!important}
      html.movx-v84 body[data-page="social"] .hero-index__inner{max-width:none!important;grid-template-columns:repeat(4,minmax(0,1fr))!important}
      html.movx-v84 body[data-page="social"] .hero-index__item{
        min-height:86px!important;padding:17px clamp(18px,2vw,30px)!important;display:grid!important;
        grid-template-columns:28px minmax(0,1fr)!important;gap:12px!important;align-content:center!important;
        border-color:rgba(255,255,255,.1)!important;color:#f1ece7!important;background:transparent!important
      }
      html.movx-v84 body[data-page="social"] .hero-index__item span{font-size:8px!important;color:rgba(241,236,231,.42)!important;align-self:start!important;padding-top:3px!important}
      html.movx-v84 body[data-page="social"] .hero-index__item strong{
        font-family:var(--serif,Georgia,'Times New Roman',serif)!important;font-size:clamp(15px,1.25vw,19px)!important;
        font-weight:400!important;line-height:1.12!important;letter-spacing:-.025em!important
      }
      html.movx-v84 body[data-page="social"] .hero-index__item::after{bottom:12px!important;opacity:.38!important}
      html.movx-v84 body[data-page="social"] .hero-index__item:hover,
      html.movx-v84 body[data-page="social"] .hero-index__item:focus-visible{background:#0c0c0c!important;color:#fff!important}
      @media(max-width:900px){
        html.movx-v84 body[data-page="social"] .hero-index__inner{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding-inline:0!important}
        html.movx-v84 body[data-page="social"] .hero-index__item{min-height:74px!important;border-bottom:1px solid rgba(255,255,255,.1)!important}
      }
      @media(max-width:520px){
        html.movx-v84 body[data-page="social"] .hero-index__item{padding:15px 16px!important;grid-template-columns:24px minmax(0,1fr)!important}
        html.movx-v84 body[data-page="social"] .hero-index__item strong{font-size:15px!important}
      }

      /* Remove legacy spatial stages that were visually competing with authored content. */
      html.movx-v84 body[data-page="social"] :is(.v45-about-stage,.v45-services-stage,.v49-journey-stage){display:none!important}
      html.movx-v84 body[data-page="social"] :is(#about.about-section,#services.services-section){
        min-height:auto!important;content-visibility:visible!important;contain-intrinsic-size:auto!important;
        padding:clamp(100px,9vw,142px) 0!important;overflow:clip!important
      }
      html.movx-v84 body[data-page="social"] #services .services-list{margin-top:clamp(46px,5vw,72px)!important}
      html.movx-v84 body[data-page="social"] #services .service-row{
        opacity:1!important;transform:none!important;padding:clamp(27px,2.5vw,38px) 0!important;
        transition:border-color .45s var(--v84-ui),padding .75s var(--v84-ease)!important
      }
      html.movx-v84 body[data-page="social"] #services .service-row:hover{padding-left:10px!important;padding-right:10px!important;background:transparent!important}

      /* One reveal language: small travel, long ease, whole layout boxes only. */
      html.movx-v84 body[data-page="social"] .v84-staged{
        opacity:0!important;transform:translate3d(0,14px,0)!important;
        transition:opacity .72s var(--v84-ui),transform 1.02s var(--v84-ease)!important;
        transition-delay:calc(var(--v84-index,0) * 55ms)!important;will-change:opacity,transform
      }
      html.movx-v84 body[data-page="social"] .v84-staged.v84-in,
      html.movx-v84 body[data-page="social"] .v84-rescue{
        opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important
      }
      html.movx-v84 body[data-page="social"] .mask-reveal.v84-staged>*{transform:none!important;transition:none!important}
      html.movx-v84 body[data-page="social"] .media-reveal.v84-staged{
        clip-path:inset(3% 0 0 0)!important;-webkit-clip-path:inset(3% 0 0 0)!important;transform:translate3d(0,8px,0)!important
      }
      html.movx-v84 body[data-page="social"] .media-reveal.v84-staged.v84-in,
      html.movx-v84 body[data-page="social"] .media-reveal.v84-rescue{
        clip-path:inset(0)!important;-webkit-clip-path:inset(0)!important;transform:none!important
      }
      html.movx-v84 body[data-page="social"] .v84-in{will-change:auto}

      /* Critical blank-state guard: old pending classes may never own visibility. */
      html.movx-v84 body[data-page="social"] .v84-rescue.v30-pending,
      html.movx-v84 body[data-page="social"] .v84-rescue.v33-editorial-pending,
      html.movx-v84 body[data-page="social"] .v84-rescue.reveal,
      html.movx-v84 body[data-page="social"] .v84-rescue.mask-reveal,
      html.movx-v84 body[data-page="social"] .v84-rescue.media-reveal{opacity:1!important;visibility:visible!important;transform:none!important;clip-path:none!important;-webkit-clip-path:none!important}
      html.movx-v84 body[data-page="social"] .v84-rescue.mask-reveal>*{transform:none!important}

      /* Section rhythm: remove artificial empty scroll fields. */
      html.movx-v84 body[data-page="social"] :is(#livingArchive,#nicheIndex,#archiveControls,.projects-list,#about,#services,#process,#contact){content-visibility:visible!important;contain-intrinsic-size:auto!important}
      html.movx-v84 body[data-page="social"] :is(#about,#services,#process,#contact){scroll-margin-top:82px!important}
      html.movx-v84 body[data-page="social"] .velocity-strip{min-height:0!important}

      @media(max-width:980px){
        html.movx-v84 body[data-page="social"] :is(#about.about-section,#services.services-section){padding:clamp(76px,12vw,112px) 0!important}
        html.movx-v84 body[data-page="social"] .v84-staged{transform:translate3d(0,9px,0)!important;transition-duration:.58s,.8s!important}
        html.movx-v84 body[data-page="social"] .v84-staged.v84-in{transform:none!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v84 body[data-page="social"] .v84-staged{opacity:1!important;transform:none!important;clip-path:none!important;-webkit-clip-path:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  /* The last item was using the project count as a chapter index (13 beside 01/02/03). */
  const mapItems=[...document.querySelectorAll('#heroTop .hero-index__item')];
  mapItems.forEach((item,index)=>{
    const no=item.querySelector(':scope > span');
    if(no)no.textContent=String(index+1).padStart(2,'0');
  });

  /* Hide only legacy decoration. The readable DOM remains untouched. */
  document.querySelectorAll('.v45-about-stage,.v45-services-stage').forEach(stage=>stage.setAttribute('hidden',''));

  const staged=new WeakSet();
  let observer=null;
  const reveal=node=>{
    if(!node)return;
    node.classList.add('v84-in','in','v30-in');
    node.classList.remove('v30-pending','v33-editorial-pending');
  };

  if(!reduced&&'IntersectionObserver'in window){
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },{threshold:.07,rootMargin:'0px 0px -6% 0px'});
  }

  const selectors=[
    '#livingArchive .archive-head > *',
    '#nicheIndex .archive-head > *',
    '#archiveControls .archive-head > *',
    '#about .about-heading','#about .about-copy',
    '#services .section-intro > *','#services .service-row',
    '.v52-architecture-copy','.v52-mobile-artworks img',
    '#process .process-title','#process .process-list li',
    '#contact .contact-copy','#contact .contact-form'
  ];

  const decorate=(node,index)=>{
    if(!node||staged.has(node))return;
    staged.add(node);
    node.classList.add('v84-staged');
    node.style.setProperty('--v84-index',String(index%6));
    const rect=node.getBoundingClientRect();
    if(reduced||!observer||rect.top<innerHeight*.91&&rect.bottom>0)reveal(node);
    else observer.observe(node);
    setTimeout(()=>{
      if(!node.classList.contains('v84-in'))reveal(node);
    },2200+(index%6)*70);
  };

  const scan=()=>{
    let i=0;
    selectors.forEach(selector=>document.querySelectorAll(selector).forEach(node=>decorate(node,i++)));
  };
  scan();
  requestAnimationFrame(scan);
  setTimeout(scan,250);
  setTimeout(scan,900);

  /* Visible-content watchdog. If any older reveal owner leaves real content hidden,
     rescue it only once it is actually inside the viewport. */
  let rescueRaf=0;
  const rescueVisible=()=>{
    rescueRaf=0;
    const candidates=document.querySelectorAll('body[data-page="social"] .reveal,body[data-page="social"] .mask-reveal,body[data-page="social"] .media-reveal,body[data-page="social"] .v30-pending,body[data-page="social"] .v33-editorial-pending');
    candidates.forEach(node=>{
      const rect=node.getBoundingClientRect();
      if(rect.bottom<0||rect.top>innerHeight)return;
      const cs=getComputedStyle(node);
      const hidden=cs.visibility==='hidden'||Number.parseFloat(cs.opacity||'1')<.08;
      const masked=node.matches('.mask-reveal')&&[...node.children].some(child=>{
        const t=getComputedStyle(child).transform;
        return t&&t!=='none'&&!child.closest('.case-viewer');
      });
      if(hidden||masked){
        node.classList.add('v84-rescue','in','v30-in');
        node.classList.remove('v30-pending','v33-editorial-pending');
      }
    });
  };
  const scheduleRescue=()=>{
    if(rescueRaf)return;
    rescueRaf=requestAnimationFrame(rescueVisible);
  };
  addEventListener('scroll',scheduleRescue,{passive:true});
  addEventListener('resize',scheduleRescue,{passive:true});
  setTimeout(rescueVisible,450);
  setTimeout(rescueVisible,1400);
  setTimeout(rescueVisible,3000);

  if('MutationObserver'in window){
    const mo=new MutationObserver(()=>{scan();scheduleRescue();});
    mo.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),9000);
  }
})();
