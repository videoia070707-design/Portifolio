/* MOVX v74/v78 — keyboard-complete project access
   Makes every authored project opener operable by keyboard and makes case-dialog
   focus deterministic across animated openings/closings without changing layout or copy. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const viewer=document.getElementById('caseViewer');
  root.classList.add('movx-v74','movx-v78');
  root.dataset.movxRelease='v74-accessible-editorial';
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
