/* MOVX v111 — isolated visible Process copy
   Reads the real i18n/semantic source but paints a clean, independent desktop lane
   that no legacy motion selector knows about. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches||root.dataset.movxReducedMotion==='true';
const desktop=matchMedia('(min-width:981px)').matches;

if(body?.dataset.page==='social'&&desktop&&!reduced){
  const process=q('#process.process-section');
  const journey=q('.v55-process-journey',process||document);
  const grid=q('.container.process-grid',journey||document);
  const sourceTitle=q('.process-title',grid||document);
  const sourceRows=qa('.process-list > li',grid||document).slice(0,5);

  if(process&&journey&&grid&&sourceTitle&&sourceRows.length){
    const overlay=document.createElement('div');
    overlay.className='v111-process-copy';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
      <div class="v111-process-copy__head">
        <div class="v111-process-copy__kicker"></div>
        <h2 class="v111-process-copy__title"></h2>
      </div>
      <div class="v111-process-copy__step">
        <span class="v111-process-copy__index"></span>
        <strong class="v111-process-copy__step-title"></strong>
        <p class="v111-process-copy__step-text"></p>
        <i class="v111-process-copy__progress"></i>
      </div>`;
    grid.appendChild(overlay);

    const kicker=q('.v111-process-copy__kicker',overlay);
    const title=q('.v111-process-copy__title',overlay);
    const step=q('.v111-process-copy__step',overlay);
    const indexEl=q('.v111-process-copy__index',overlay);
    const stepTitle=q('.v111-process-copy__step-title',overlay);
    const stepText=q('.v111-process-copy__step-text',overlay);

    const readSource=()=>{
      kicker.textContent=(q('.kicker',sourceTitle)?.textContent||'').trim();
      const rawTitle=(q('h2',sourceTitle)?.textContent||'').trim();
      title.textContent=rawTitle;
    };

    let active=-1;
    const setStep=(idx,animate=true)=>{
      idx=clamp(idx,0,sourceRows.length-1)|0;
      const row=sourceRows[idx];
      const sourceIndex=q(':scope > span',row)?.textContent?.trim()||String(idx+1).padStart(2,'0');
      const sourceStrong=q('strong',row)?.textContent?.trim()||'';
      const sourceP=q('p',row)?.textContent?.trim()||'';
      if(idx!==active){
        active=idx;
        indexEl.textContent=sourceIndex;
        stepTitle.textContent=sourceStrong;
        stepText.textContent=sourceP;
        if(animate){
          step.classList.remove('is-changing');
          void step.offsetWidth;
          step.classList.add('is-changing');
        }
      }else{
        // Keep language changes in sync even if the active step did not change.
        if(indexEl.textContent!==sourceIndex)indexEl.textContent=sourceIndex;
        if(stepTitle.textContent!==sourceStrong)stepTitle.textContent=sourceStrong;
        if(stepText.textContent!==sourceP)stepText.textContent=sourceP;
      }
      root.dataset.movxV111Step=String(idx+1);
    };

    const progress=()=>{
      const r=journey.getBoundingClientRect();
      const travel=Math.max(1,journey.offsetHeight-innerHeight);
      return clamp(-r.top/travel,0,1);
    };

    let raf=0;
    const sync=()=>{
      raf=0;
      const p=progress();
      overlay.style.setProperty('--v111-progress',p.toFixed(4));
      setStep(Math.round(p*(sourceRows.length-1)),true);
      readSource();
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync);};

    // i18n mutates textContent after boot/language switches. Observe only the source.
    const mo=new MutationObserver(()=>requestAnimationFrame(()=>{readSource();setStep(active<0?0:active,false);}));
    mo.observe(sourceTitle,{subtree:true,childList:true,characterData:true});
    sourceRows.forEach(row=>mo.observe(row,{subtree:true,childList:true,characterData:true}));

    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    window.MOVX_MOTION_BRIDGE?.subscribe?.(schedule);
    addEventListener('pagehide',()=>{mo.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);},{once:true});

    readSource();
    setStep(0,false);
    sync();
    root.dataset.movxV111='cleanroom-ready';
  }else{
    root.dataset.movxV111='missing-source';
  }
}else if(body?.dataset.page==='social'){
  root.dataset.movxV111=reduced?'reduced-flow':'mobile-flow';
}
