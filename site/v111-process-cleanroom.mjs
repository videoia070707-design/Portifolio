/* MOVX v114 — isolated Process copy + final 3D field ownership
   Reads the real i18n/semantic source, paints one clean editorial lane, and takes
   runtime ownership of the WebGL surface so retired CSS cannot reintroduce a black
   half-screen or oversized visual weight. */

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
  const sourceList=q('.process-list',grid||document);
  const sourceRows=qa('.process-list > li',grid||document).slice(0,5);

  if(process&&journey&&grid&&sourceTitle&&sourceList&&sourceRows.length){
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

    const structuredTitleText=titleNode=>{
      if(!titleNode)return'';
      const read=node=>{
        if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';
        if(node.nodeType===Node.ELEMENT_NODE&&node.tagName==='BR')return'\n';
        return[...node.childNodes].map(read).join('');
      };
      return read(titleNode)
        .replace(/[\t ]*\n[\t ]*/g,'\n')
        .replace(/[\t ]{2,}/g,' ')
        .trim();
    };

    const readSource=()=>{
      kicker.textContent=(q('.kicker',sourceTitle)?.textContent||'').trim();
      title.textContent=structuredTitleText(q('h2',sourceTitle));
    };

    const suppressLegacyPaint=()=>{
      sourceTitle.style.setProperty('opacity','0','important');
      sourceTitle.style.setProperty('pointer-events','none','important');
      sourceList.style.setProperty('opacity','0','important');
      sourceList.style.setProperty('pointer-events','none','important');
    };

    const polishField=()=>{
      const canvas=q('.v108-process-canvas',journey);
      const atmosphere=q('.v108-process-atmosphere',journey);
      journey.style.setProperty('background','var(--v111-bg)','important');
      journey.style.setProperty('isolation','isolate','important');
      if(canvas){
        canvas.style.setProperty('background','transparent','important');
        canvas.style.setProperty('clip-path','inset(0 0 0 50%)','important');
        canvas.style.setProperty('-webkit-clip-path','inset(0 0 0 50%)','important');
        canvas.style.setProperty('-webkit-mask-image','linear-gradient(90deg,transparent 0 56%,rgba(0,0,0,.06) 62%,rgba(0,0,0,.58) 74%,#000 86%)','important');
        canvas.style.setProperty('mask-image','linear-gradient(90deg,transparent 0 56%,rgba(0,0,0,.06) 62%,rgba(0,0,0,.58) 74%,#000 86%)','important');
        canvas.style.setProperty('transform','translate3d(18%,0,0) scale(.70)','important');
        canvas.style.setProperty('transform-origin','93% 50%','important');
        canvas.style.setProperty('opacity','0.58','important');
        canvas.style.setProperty('filter','saturate(.64) contrast(.86) brightness(.98)','important');
        canvas.style.setProperty('mix-blend-mode','screen','important');
      }
      if(atmosphere){
        atmosphere.style.setProperty('background','linear-gradient(90deg,var(--v111-bg) 0 54%,color-mix(in srgb,var(--v111-bg) 98%,transparent) 61%,color-mix(in srgb,var(--v111-bg) 82%,transparent) 69%,color-mix(in srgb,var(--v111-bg) 34%,transparent) 82%,transparent 94%),radial-gradient(circle at calc(82% + var(--v108-pointer-x,0) * 2%) calc(51% + var(--v108-pointer-y,0) * 2%),color-mix(in srgb,var(--v111-accent) 6%,transparent),transparent 22%)','important');
      }
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
      suppressLegacyPaint();
      polishField();
      const p=progress();
      overlay.style.setProperty('--v111-progress',p.toFixed(4));
      setStep(Math.round(p*(sourceRows.length-1)),true);
      readSource();
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync);};

    const mo=new MutationObserver(()=>requestAnimationFrame(()=>{
      suppressLegacyPaint();
      polishField();
      readSource();
      setStep(active<0?0:active,false);
    }));
    mo.observe(sourceTitle,{subtree:true,childList:true,characterData:true});
    sourceRows.forEach(row=>mo.observe(row,{subtree:true,childList:true,characterData:true}));

    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    window.MOVX_MOTION_BRIDGE?.subscribe?.(schedule);
    addEventListener('pagehide',()=>{mo.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);},{once:true});

    suppressLegacyPaint();
    polishField();
    readSource();
    setStep(0,false);
    sync();
    root.dataset.movxV111='cleanroom-ready';
    root.dataset.movxV114='field-owned';
  }else{
    root.dataset.movxV111='missing-source';
  }
}else if(body?.dataset.page==='social'){
  root.dataset.movxV111=reduced?'reduced-flow':'mobile-flow';
}
