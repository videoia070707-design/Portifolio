/* MOVX v37 — performance-led editorial archive runtime
   No permanent scroll RAF loops. Motion pauses offscreen and generated archive updates settle as one composition. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wall = document.getElementById('livingArchive');
  const ticker = document.querySelector('.velocity-strip--social');
  const archiveGrid = document.getElementById('archiveGrid');
  const nicheGrid = document.getElementById('nicheGrid');

  root.classList.add('movx-v37');
  root.dataset.movxRuntimeAudit = 'v37-single-motion-owner';

  try {
    /* Pause compositor marquees whenever they cannot contribute to the frame. */
    const motionRegions = [wall, ticker].filter(Boolean);
    const visible = new Map(motionRegions.map(node => [node, true]));

    const applyMotionState = () => {
      motionRegions.forEach(node => {
        const shouldPause = reduced || document.hidden || visible.get(node) === false;
        node.classList.toggle('v37-motion-paused', shouldPause);
      });
    };

    if ('IntersectionObserver' in window && !reduced) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => visible.set(entry.target, entry.isIntersecting));
        applyMotionState();
      }, { threshold:0, rootMargin:'220px 0px' });
      motionRegions.forEach(node => observer.observe(node));
    }
    document.addEventListener('visibilitychange', applyMotionState, { passive:true });
    applyMotionState();

    /* Filtering rerenders the grid synchronously. Fade the composition as a whole
       instead of starting independent item animations. */
    if (archiveGrid && 'MutationObserver' in window) {
      let settleRaf = 0;
      const settle = () => {
        archiveGrid.classList.add('v37-grid-updating');
        cancelAnimationFrame(settleRaf);
        settleRaf = requestAnimationFrame(() => requestAnimationFrame(() => {
          archiveGrid.classList.remove('v37-grid-updating');
        }));
      };
      new MutationObserver(settle).observe(archiveGrid, { childList:true });
    }

    /* Generated images are already lazy/async. Reinforce low-priority decoding for
       below-the-fold directory artwork without touching the hero/case-study media. */
    const tuneImages = context => {
      context?.querySelectorAll?.('img').forEach((img,index) => {
        if (!img.hasAttribute('decoding')) img.decoding = 'async';
        if (!img.hasAttribute('loading')) img.loading = 'lazy';
        if (context === archiveGrid && index > 1) img.setAttribute('fetchpriority','low');
      });
    };
    tuneImages(nicheGrid);
    tuneImages(archiveGrid);

    if ('MutationObserver' in window) {
      [nicheGrid,archiveGrid].filter(Boolean).forEach(host => {
        let raf = 0;
        new MutationObserver(() => {
          if (raf) return;
          raf = requestAnimationFrame(() => { raf = 0; tuneImages(host); });
        }).observe(host,{ childList:true });
      });
    }

  } catch (error) {
    console.warn('MOVX v37 editorial archive enhancement failed open:', error);
  }
})();

/* MOVX v68 — discipline handoff transition
   Reuses the existing page curtain but replaces the generic loading-screen look with
   a short editorial chapter handoff. Navigation timing remains owned by the base runtime. */
(() => {
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const curtain=document.querySelector('.page-curtain');
  if(!body||!curtain)return;

  root.classList.add('movx-v68');
  root.dataset.movxPageHandoff='v68-editorial';

  const chapters={
    social:{index:'01',label:'Social Media'},
    video:{index:'02',label:'Video Editor'},
    ai:{index:'03',label:'AI Creator'},
    home:{index:'00',label:'MOVX'}
  };
  const fromHref=href=>{
    const value=(href||'').toLowerCase();
    if(value.includes('video-editor'))return chapters.video;
    if(value.includes('ai-creator'))return chapters.ai;
    if(value.includes('social-media')||value.includes('index')||value.includes('latest')||value.includes('v57'))return chapters.social;
    return null;
  };
  const current=chapters[body.dataset.page]||chapters.social;

  if(!curtain.querySelector('.v68-curtain-inner')){
    curtain.innerHTML='';
    const inner=document.createElement('div');
    inner.className='v68-curtain-inner';
    inner.innerHTML='<span class="v68-curtain-brand">MOVX</span><span class="v68-curtain-rule" aria-hidden="true"></span><span class="v68-curtain-index"></span><span class="v68-curtain-label"></span>';
    curtain.appendChild(inner);
  }

  const indexNode=curtain.querySelector('.v68-curtain-index');
  const labelNode=curtain.querySelector('.v68-curtain-label');
  const setChapter=chapter=>{
    if(!chapter)return;
    if(indexNode)indexNode.textContent=chapter.index;
    if(labelNode)labelNode.textContent=chapter.label;
  };
  setChapter(current);

  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[data-transition]');
    if(!link)return;
    const href=link.getAttribute('href');
    const chapter=fromHref(href);
    if(chapter)setChapter(chapter);
  },{capture:true});

  if(!document.getElementById('movx-v68-handoff-style')){
    const style=document.createElement('style');
    style.id='movx-v68-handoff-style';
    style.textContent=`
      html.movx-v68 .page-curtain{
        background:#090807!important;color:#f3eee9!important;
        transition:transform .56s cubic-bezier(.76,0,.24,1)!important;
        overflow:hidden!important;isolation:isolate!important
      }
      html.movx-v68 .page-curtain::after{content:none!important}
      html.movx-v68 .v68-curtain-inner{
        position:absolute;inset:0;padding:clamp(22px,3vw,46px) var(--pad,32px) clamp(28px,5vw,72px);
        display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto 1fr auto;gap:0;
        align-items:end;pointer-events:none
      }
      html.movx-v68 .v68-curtain-brand{
        align-self:start;font:900 clamp(20px,2vw,30px)/1 Arial,sans-serif;letter-spacing:-.065em;color:#f3eee9
      }
      html.movx-v68 .v68-curtain-rule{
        grid-column:1/-1;align-self:center;width:100%;height:1px;
        background:linear-gradient(90deg,#b84434 0 8%,rgba(243,238,233,.2) 8% 100%);
        transform-origin:left center;transform:scaleX(.08);
        transition:transform .72s cubic-bezier(.16,1,.3,1)
      }
      html.movx-v68 body.page-leaving .v68-curtain-rule{transform:scaleX(1)}
      html.movx-v68 .v68-curtain-index{
        grid-column:1;align-self:end;padding-right:clamp(20px,3vw,46px);
        font:700 10px/1 var(--mono,ui-monospace,monospace);letter-spacing:.16em;color:#b84434
      }
      html.movx-v68 .v68-curtain-label{
        grid-column:2;align-self:end;font:400 clamp(62px,10vw,164px)/.78 var(--serif,Georgia,'Times New Roman',serif);
        letter-spacing:-.075em;color:#f3eee9;white-space:nowrap
      }
      html.movx-v68 body:not(.page-ready):not(.page-leaving) .v68-curtain-label,
      html.movx-v68 body.page-leaving .v68-curtain-label{opacity:1}
      @media(max-width:620px){
        html.movx-v68 .v68-curtain-inner{grid-template-columns:1fr;grid-template-rows:auto 1fr auto auto}
        html.movx-v68 .v68-curtain-index{grid-column:1;padding:0 0 12px}
        html.movx-v68 .v68-curtain-label{grid-column:1;font-size:clamp(54px,17vw,82px);white-space:normal;max-width:7.5ch}
      }
      @media(prefers-reduced-motion:reduce){html.movx-v68 .page-curtain{display:none!important}}
    `;
    document.head.appendChild(style);
  }
})();