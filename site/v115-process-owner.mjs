/* MOVX v115 — adaptive Process owner
   Replaces the v111 runtime in the canonical build. It keeps one desktop reading
   lane, restores the semantic DOM when the viewport/reduced-motion state changes,
   and lets CSS own the final WebGL opacity without a MutationObserver fight. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const desktopMq=matchMedia('(min-width:981px)');
const reduceMq=matchMedia('(prefers-reduced-motion: reduce)');
const staticMode=new URLSearchParams(location.search).has('static')||root.dataset.movxReducedMotion==='true';

if(body?.dataset.page==='social'){
  const process=q('#process.process-section');
  const journey=q('.v55-process-journey',process||document);
  const grid=q('.container.process-grid',journey||document);
  const sourceTitle=q('.process-title',grid||document);
  const sourceH2=q('h2',sourceTitle||document);
  const sourceList=q('.process-list',grid||document);
  const sourceRows=sourceList?qa(':scope > li',sourceList).slice(0,5):[];

  if(process&&journey&&grid&&sourceTitle&&sourceH2&&sourceList&&sourceRows.length){
    let overlay=null;
    let ui=null;
    let active=-1;
    let raf=0;

    const enhanced=()=>desktopMq.matches&&!reduceMq.matches&&!staticMode;

    const structuredTitleText=titleNode=>{
      if(!titleNode)return'';
      const read=node=>{
        if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';
        if(node.nodeType===Node.ELEMENT_NODE&&node.tagName==='BR')return'\n';
        return[...node.childNodes].map(read).join('');
      };
      return read(titleNode).replace(/[\t ]*\n[\t ]*/g,'\n').replace(/[\t ]{2,}/g,' ').trim();
    };

    const makeOverlay=()=>{
      if(overlay?.isConnected)return overlay;
      overlay=document.createElement('div');
      overlay.className='v111-process-copy v115-process-copy';
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
      ui={
        kicker:q('.v111-process-copy__kicker',overlay),
        title:q('.v111-process-copy__title',overlay),
        step:q('.v111-process-copy__step',overlay),
        index:q('.v111-process-copy__index',overlay),
        stepTitle:q('.v111-process-copy__step-title',overlay),
        stepText:q('.v111-process-copy__step-text',overlay)
      };
      active=-1;
      return overlay;
    };

    const destroyOverlay=()=>{
      overlay?.remove();
      overlay=null;
      ui=null;
      active=-1;
    };

    const readSource=()=>{
      if(!ui)return;
      ui.kicker.textContent=(q('.kicker',sourceTitle)?.textContent||'').trim();
      ui.title.textContent=structuredTitleText(sourceH2);
    };

    const setSemanticPaint=hidden=>{
      for(const el of [sourceTitle,sourceList]){
        if(hidden){
          el.style.setProperty('opacity','0','important');
          el.style.setProperty('pointer-events','none','important');
        }else{
          el.style.removeProperty('opacity');
          el.style.removeProperty('pointer-events');
        }
      }
    };

    const clear=(el,props)=>props.forEach(prop=>el?.style.removeProperty(prop));
    const clearLegacyGeometry=()=>{
      clear(grid,['position','top','height','min-height','max-height','overflow','transform','translate']);
      clear(sourceTitle,['position','top','visibility','transform','translate','filter','clip-path']);
      clear(sourceH2,['display','opacity','visibility','color','-webkit-text-fill-color','transform','translate','filter','clip-path']);
      clear(sourceList,['position','left','right','top','bottom','width','max-width','height','min-height','margin','padding','transform','translate']);
      sourceRows.forEach(row=>{
        clear(row,['position','inset','top','right','bottom','left','width','height','min-height','transform','translate','filter','clip-path']);
        const number=q(':scope > span',row);
        const strong=q('strong',row);
        const paragraph=q('p',row);
        const inner=q(':scope > div',row);
        [number,strong,paragraph,inner].forEach(el=>clear(el,['visibility','filter','transform','translate','clip-path','color','-webkit-text-fill-color']));
      });
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
        canvas.style.setProperty('-webkit-mask-image','linear-gradient(90deg,transparent 0 53%,rgba(0,0,0,.12) 60%,rgba(0,0,0,.72) 73%,#000 84%)','important');
        canvas.style.setProperty('mask-image','linear-gradient(90deg,transparent 0 53%,rgba(0,0,0,.12) 60%,rgba(0,0,0,.72) 73%,#000 84%)','important');
        canvas.style.setProperty('transform','translate3d(17%,0,0) scale(.72)','important');
        canvas.style.setProperty('transform-origin','92% 50%','important');
        canvas.style.setProperty('filter','saturate(.72) contrast(.92) brightness(1.02)','important');
        canvas.style.setProperty('mix-blend-mode','normal','important');
      }
      if(atmosphere){
        atmosphere.style.setProperty('background','linear-gradient(90deg,var(--v111-bg) 0 51%,color-mix(in srgb,var(--v111-bg) 98%,transparent) 58%,color-mix(in srgb,var(--v111-bg) 78%,transparent) 68%,color-mix(in srgb,var(--v111-bg) 22%,transparent) 82%,transparent 94%),radial-gradient(circle at calc(82% + var(--v108-pointer-x,0) * 2%) calc(51% + var(--v108-pointer-y,0) * 2%),color-mix(in srgb,var(--v111-accent) 7%,transparent),transparent 23%)','important');
      }
    };

    const clearFieldPolish=()=>{
      const canvas=q('.v108-process-canvas',journey);
      const atmosphere=q('.v108-process-atmosphere',journey);
      clear(journey,['background','isolation']);
      clear(canvas,['background','clip-path','-webkit-clip-path','-webkit-mask-image','mask-image','transform','transform-origin','filter','mix-blend-mode']);
      clear(atmosphere,['background']);
    };

    const progress=()=>{
      const r=journey.getBoundingClientRect();
      const travel=Math.max(1,journey.offsetHeight-innerHeight);
      return clamp(-r.top/travel,0,1);
    };

    const setStep=(idx,animate=true)=>{
      if(!ui)return;
      idx=clamp(idx,0,sourceRows.length-1)|0;
      const row=sourceRows[idx];
      const sourceIndex=q(':scope > span',row)?.textContent?.trim()||String(idx+1).padStart(2,'0');
      const sourceStrong=q('strong',row)?.textContent?.trim()||'';
      const sourceP=q('p',row)?.textContent?.trim()||'';
      if(idx!==active){
        active=idx;
        ui.index.textContent=sourceIndex;
        ui.stepTitle.textContent=sourceStrong;
        ui.stepText.textContent=sourceP;
        if(animate){
          ui.step.classList.remove('is-changing');
          void ui.step.offsetWidth;
          ui.step.classList.add('is-changing');
        }
      }else{
        if(ui.index.textContent!==sourceIndex)ui.index.textContent=sourceIndex;
        if(ui.stepTitle.textContent!==sourceStrong)ui.stepTitle.textContent=sourceStrong;
        if(ui.stepText.textContent!==sourceP)ui.stepText.textContent=sourceP;
      }
      root.dataset.movxV111Step=String(idx+1);
    };

    const sync=()=>{
      raf=0;
      if(!enhanced()){
        setSemanticPaint(false);
        clearLegacyGeometry();
        clearFieldPolish();
        destroyOverlay();
        root.dataset.movxV111=reduceMq.matches||staticMode?'reduced-flow':'mobile-flow';
        root.dataset.movxV114='fallback-flow';
        root.dataset.movxV115='flow-fallback';
        return;
      }

      makeOverlay();
      setSemanticPaint(true);
      polishField();
      readSource();
      const p=progress();
      overlay.style.setProperty('--v111-progress',p.toFixed(4));
      setStep(Math.round(p*(sourceRows.length-1)),true);
      root.dataset.movxV111='cleanroom-ready';
      root.dataset.movxV114='field-owned';
      root.dataset.movxV115='adaptive-owner';
    };

    const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync);};
    const sourceMo=new MutationObserver(schedule);
    sourceMo.observe(sourceTitle,{subtree:true,childList:true,characterData:true});
    sourceRows.forEach(row=>sourceMo.observe(row,{subtree:true,childList:true,characterData:true}));

    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    desktopMq.addEventListener?.('change',schedule);
    reduceMq.addEventListener?.('change',schedule);
    window.MOVX_MOTION_BRIDGE?.subscribe?.(schedule);

    addEventListener('pagehide',()=>{
      sourceMo.disconnect();
      cancelAnimationFrame(raf);
      removeEventListener('scroll',schedule);
      removeEventListener('resize',schedule);
      desktopMq.removeEventListener?.('change',schedule);
      reduceMq.removeEventListener?.('change',schedule);
    },{once:true});

    sync();
  }else{
    root.dataset.movxV115='missing-source';
  }
}
