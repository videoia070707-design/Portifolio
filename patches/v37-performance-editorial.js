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
  root.__MOVX_V68_SET_CHAPTER__=setChapter;
  root.__MOVX_V68_CHAPTER_FROM_HREF__=fromHref;

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

/* MOVX v69 — unified navigation + theme polish
   Fixes dynamically inserted discipline links so they actually use the editorial handoff,
   upgrades the mobile menu into a full editorial navigation plane, and makes theme changes
   reveal from the control that triggered them. */
(() => {
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const menuButton=document.querySelector('.menu-button');
  const mobileMenu=document.querySelector('.mobile-menu');
  const themeButton=document.querySelector('[data-theme-toggle]');
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!body)return;

  root.classList.add('movx-v69');
  root.dataset.movxGlobalNavigation='v69-unified';

  const closeMenu=()=>{
    if(!mobileMenu||!menuButton)return;
    mobileMenu.classList.remove('open');
    menuButton.setAttribute('aria-expanded','false');
    body.classList.remove('v69-menu-open');
  };
  const syncMenu=()=>{
    if(!mobileMenu||!menuButton)return;
    const open=mobileMenu.classList.contains('open');
    body.classList.toggle('v69-menu-open',open);
    menuButton.classList.toggle('v69-menu-active',open);
  };

  if(menuButton&&mobileMenu){
    menuButton.addEventListener('click',()=>requestAnimationFrame(syncMenu));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileMenu.classList.contains('open'))closeMenu()});
    mobileMenu.querySelectorAll('a').forEach(link=>{
      const href=link.getAttribute('href')||'';
      if(/\.html(?:#|$)/i.test(href))link.setAttribute('data-transition','');
      link.addEventListener('click',()=>{
        if(href.startsWith('#'))requestAnimationFrame(closeMenu);
      });
    });
  }

  /* Dynamic discipline links are created after the base runtime bound its static links.
     This delegated owner gives only those late links the same 560ms curtain handoff. */
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('.v65-discipline-switcher a[data-transition],.v65-mobile-disciplines a[data-transition],.v65-footer-disciplines a[data-transition],.mobile-menu>a[data-transition]');
    if(!link)return;
    const href=link.getAttribute('href');
    if(!href||href.startsWith('http')||link.target==='_blank')return;
    event.preventDefault();
    if(link.getAttribute('aria-current')==='page'){
      closeMenu();
      return;
    }
    const chapter=root.__MOVX_V68_CHAPTER_FROM_HREF__?.(href);
    if(chapter)root.__MOVX_V68_SET_CHAPTER__?.(chapter);
    closeMenu();
    if(reduced){location.href=href;return;}
    body.classList.remove('page-ready');
    body.classList.add('page-leaving');
    setTimeout(()=>{location.href=href},560);
  });

  /* Capture the physical origin before the base theme handler starts ViewTransition. */
  const rememberThemeOrigin=event=>{
    if(!themeButton)return;
    const rect=themeButton.getBoundingClientRect();
    const x=Number.isFinite(event?.clientX)&&event.clientX>0?event.clientX:rect.left+rect.width/2;
    const y=Number.isFinite(event?.clientY)&&event.clientY>0?event.clientY:rect.top+rect.height/2;
    root.style.setProperty('--v69-theme-x',`${x}px`);
    root.style.setProperty('--v69-theme-y',`${y}px`);
  };
  themeButton?.addEventListener('pointerdown',rememberThemeOrigin,{capture:true,passive:true});
  themeButton?.addEventListener('click',rememberThemeOrigin,{capture:true});

  if(!document.getElementById('movx-v69-global-style')){
    const style=document.createElement('style');
    style.id='movx-v69-global-style';
    style.textContent=`
      html.movx-v69 body{--v69-ease:cubic-bezier(.16,1,.3,1);--v69-theme-x:50vw;--v69-theme-y:38px}
      html.movx-v69 body.v69-menu-open{overflow:hidden!important}
      html.movx-v69 .menu-button{position:relative;transition:opacity .35s ease,color .35s ease}
      html.movx-v69 .menu-button::after{
        content:"";position:absolute;left:8px;right:8px;bottom:3px;height:1px;background:currentColor;
        transform:scaleX(0);transform-origin:left;transition:transform .55s var(--v69-ease)
      }
      html.movx-v69 .menu-button.v69-menu-active::after{transform:scaleX(1)}

      @media(max-width:780px){
        html.movx-v69 .mobile-menu,
        html.movx-v69 .mobile-menu.open{
          display:grid!important;position:fixed!important;left:0!important;right:0!important;top:66px!important;bottom:0!important;
          z-index:190!important;align-content:start!important;gap:0!important;overflow:auto!important;
          padding:clamp(20px,6vw,32px) var(--pad,20px) clamp(48px,10vw,80px)!important;
          background:color-mix(in srgb,var(--bg) 97%,transparent)!important;
          border-bottom:0!important;border-top:1px solid var(--line)!important;
          opacity:0!important;visibility:hidden!important;pointer-events:none!important;
          transform:translate3d(0,-10px,0)!important;
          transition:opacity .38s ease,transform .65s var(--v69-ease),visibility 0s linear .65s,background .45s ease,color .45s ease!important
        }
        html.movx-v69 .mobile-menu.open{
          opacity:1!important;visibility:visible!important;pointer-events:auto!important;
          transform:translate3d(0,0,0)!important;transition-delay:0s!important
        }
        html.movx-v69 .mobile-menu>.v65-mobile-disciplines{order:0;margin-bottom:clamp(30px,8vw,54px)!important}
        html.movx-v69 .mobile-menu>a{
          order:1!important;display:flex!important;align-items:baseline!important;justify-content:space-between!important;
          min-height:0!important;padding:clamp(14px,4vw,22px) 0!important;border-bottom:1px solid var(--line)!important;
          color:var(--fg)!important;font-family:var(--serif,Georgia,'Times New Roman',serif)!important;
          font-size:clamp(42px,12.6vw,70px)!important;font-weight:400!important;line-height:.86!important;letter-spacing:-.06em!important;
          opacity:1!important;transform:translate3d(0,14px,0);transition:transform .7s var(--v69-ease),opacity .45s ease!important
        }
        html.movx-v69 .mobile-menu.open>a{transform:translate3d(0,0,0)}
        html.movx-v69 .mobile-menu.open>a:nth-of-type(1){transition-delay:.04s!important}
        html.movx-v69 .mobile-menu.open>a:nth-of-type(2){transition-delay:.08s!important}
        html.movx-v69 .mobile-menu.open>a:nth-of-type(3){transition-delay:.12s!important}
        html.movx-v69 .mobile-menu.open>a:nth-of-type(4){transition-delay:.16s!important}
      }

      @supports(view-transition-name:root){
        html.movx-v69{view-transition-name:root}
        ::view-transition-old(root){animation:none!important;z-index:1}
        ::view-transition-new(root){
          z-index:2;animation:v69-theme-reveal .66s var(--v69-ease) both!important;
          mix-blend-mode:normal
        }
        @keyframes v69-theme-reveal{
          from{clip-path:circle(0 at var(--v69-theme-x,50vw) var(--v69-theme-y,38px))}
          to{clip-path:circle(150vmax at var(--v69-theme-x,50vw) var(--v69-theme-y,38px))}
        }
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v69 .mobile-menu,html.movx-v69 .mobile-menu.open{transform:none!important;transition:none!important}
        html.movx-v69 .mobile-menu>a{transform:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }
})();