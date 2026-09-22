/* MOVX v96 — whole-page chapter continuity + normalized interaction motion
   Extends the existing v88 single owner through the full social page. Scroll values
   are damped before reaching CSS, while interaction microstates share one authored
   easing language. Text remains planar and reduced-motion stays static. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width:981px)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const lerp = (a,b,t) => a + (b-a)*t;

  /* Compatibility correction for the current multilingual build map. Mutating the
     source dictionary means future language switches also render the corrected copy. */
  const esUI = window.MOVX_I18N?.ui?.es;
  if (esUI && esUI['ai.meta3'] === 'tecnología como proceso, no como efeito') {
    esUI['ai.meta3'] = 'tecnología como proceso, no como efecto';
  }
  document.querySelectorAll('[data-i18n="ai.meta3"]').forEach(node => {
    if (node.textContent?.includes('no como efeito')) node.textContent = 'tecnología como proceso, no como efecto';
  });

  const chapters = [
    { key:'hero', node:document.getElementById('heroTop') },
    { key:'archive', node:document.getElementById('livingArchive') },
    { key:'territories', node:document.getElementById('nicheIndex') },
    { key:'directory', node:document.getElementById('archiveControls') },
    { key:'projects', node:document.querySelector('.projects-list') },
    { key:'about', node:document.getElementById('about') },
    { key:'services', node:document.getElementById('services') },
    { key:'process', node:document.getElementById('process') },
    { key:'contact', node:document.getElementById('contact') }
  ].filter(item => item.node);
  if (!chapters.length) return;

  root.classList.add('movx-v88');
  /* Keep the v88 signature stable because downstream QAs use it as the owner contract.
     v96 is exposed separately as the active behavior layer. */
  root.dataset.movxChapterSignature = 'v88-fold-continuity-single-owner';
  root.dataset.movxMotion = 'v96-normalized-damped-continuity';

  if (!document.getElementById('movx-v96-motion-style')) {
    const style = document.createElement('style');
    style.id = 'movx-v96-motion-style';
    style.textContent = `
      html.movx-v88 body[data-page="social"]{
        --v96-ease:cubic-bezier(.16,1,.3,1);
        --v96-ui:cubic-bezier(.4,0,.2,1);
      }
      @media (min-width:981px){
        html.movx-v88 body[data-page="social"] #about .about-grid::after{
          opacity:calc(.18 + var(--v88-focus,0) * .54)!important;
          transform:scaleY(calc(.54 + var(--v88-focus,0) * .46));
          transform-origin:50% 0;
        }
        html.movx-v88 body[data-page="social"] #services .service-row::before{
          transition:height .95s var(--v88-ease),opacity .68s var(--v88-ui)!important;
        }
        html.movx-v88 body[data-page="social"] #process .process-list li{
          transition:opacity .72s var(--v88-ui),filter .82s var(--v88-ui)!important;
        }
        html.movx-v88 body[data-page="social"] #contact::before{
          opacity:calc(.30 + var(--v88-focus,0) * .50)!important;
          transform:scaleX(calc(.46 + var(--v88-focus,0) * .54));
          transform-origin:0 50%;
        }

        /* v96: normalize formerly abrupt microstates without adding new geometry. */
        html.movx-v88 body[data-page="social"] .archive-filter-row .archive-filter{
          transition:
            background-color .52s var(--v96-ui),
            color .48s var(--v96-ui),
            border-color .52s var(--v96-ui),
            transform .72s var(--v96-ease),
            box-shadow .72s var(--v96-ease)!important;
        }
        html.movx-v88 body[data-page="social"] .archive-filter-status{
          transition:opacity .46s var(--v96-ui),color .52s var(--v96-ui)!important;
        }
        html.movx-v88 body[data-page="social"] #projectsList .project-cover img{
          transition:transform 1.38s var(--v96-ease),filter .78s var(--v96-ui)!important;
        }
        html.movx-v88 body[data-page="social"] #projectsList .project-cover::after{
          transition:opacity .58s var(--v96-ui),transform .82s var(--v96-ease)!important;
        }
        html.movx-v88 body[data-page="social"] #services .service-row{
          transition:padding .72s var(--v96-ease),background-color .56s var(--v96-ui)!important;
        }
        html.movx-v88 body[data-page="social"] #services .service-row h3,
        html.movx-v88 body[data-page="social"] #services .service-row p,
        html.movx-v88 body[data-page="social"] #services .service-row>span{
          transition:color .54s var(--v96-ui),opacity .54s var(--v96-ui)!important;
        }
        html.movx-v88 .case-nav-button,
        html.movx-v88 .case-close{
          transition:
            background-color .48s var(--v96-ui),
            color .46s var(--v96-ui),
            border-color .48s var(--v96-ui),
            transform .68s var(--v96-ease)!important;
        }
        html.movx-v88 .hero-index__item{
          transition:background-color .58s var(--v96-ui),color .58s var(--v96-ui),border-color .58s var(--v96-ui)!important;
        }
        html.movx-v88 .hero-index__item strong{
          transition:opacity .52s var(--v96-ui),color .52s var(--v96-ui)!important;
        }
      }
      @media (max-width:980px){
        html.movx-v88 body[data-page="social"] .archive-filter-row .archive-filter,
        html.movx-v88 .case-nav-button,
        html.movx-v88 .case-close{
          transition-duration:.32s!important;
        }
      }
      @media (max-width:980px), (prefers-reduced-motion:reduce){
        html.movx-v88 body[data-page="social"] #about .about-grid::after,
        html.movx-v88 body[data-page="social"] #contact::before{
          transform:none!important;
        }
      }
      @media (prefers-reduced-motion:reduce){
        html.movx-v88 body[data-page="social"] .archive-filter-row .archive-filter,
        html.movx-v88 body[data-page="social"] .archive-filter-status,
        html.movx-v88 body[data-page="social"] #projectsList .project-cover img,
        html.movx-v88 body[data-page="social"] #projectsList .project-cover::after,
        html.movx-v88 body[data-page="social"] #services .service-row,
        html.movx-v88 body[data-page="social"] #services .service-row h3,
        html.movx-v88 body[data-page="social"] #services .service-row p,
        html.movx-v88 body[data-page="social"] #services .service-row>span,
        html.movx-v88 .case-nav-button,
        html.movx-v88 .case-close,
        html.movx-v88 .hero-index__item,
        html.movx-v88 .hero-index__item strong{
          transition:none!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const markHTML = '<i class="v88-fold-mark__rail"></i><i class="v88-fold-mark__plane"></i>';
  const markHosts = chapters.filter(item => ['archive','territories'].includes(item.key));
  markHosts.forEach(({node,key}) => {
    if (node.querySelector(':scope > .v88-fold-mark')) return;
    const mark = document.createElement('span');
    mark.className = 'v88-fold-mark';
    mark.dataset.v88Chapter = key;
    mark.setAttribute('aria-hidden','true');
    mark.innerHTML = markHTML;
    node.appendChild(mark);
  });

  const states = new Map(chapters.map(item => [item, {
    progress:0, focus:0, angle:20, lift:7, enter:0,
    targetProgress:0, targetFocus:0, targetAngle:20, targetLift:7, targetEnter:0
  }]));

  let raf = 0;
  let current = null;
  let lastTime = 0;
  let needsMeasure = true;

  function updateTargets(item, rect) {
    const state = states.get(item);
    const travel = Math.max(1,rect.height + innerHeight);
    const progress = clamp((innerHeight - rect.top) / travel);
    const center = rect.top + rect.height * .5;
    const focusDistance = Math.abs(center - innerHeight * .5);
    const focus = clamp(1 - focusDistance / Math.max(innerHeight * .92, rect.height * .58));
    const enter = clamp((innerHeight * .9 - rect.top) / Math.max(1,innerHeight * .72));

    state.targetProgress = progress;
    state.targetFocus = focus;
    state.targetAngle = reduced ? 0 : lerp(20,-14,progress);
    state.targetLift = reduced ? 0 : lerp(7,0,focus);
    state.targetEnter = enter;
    return {center};
  }

  function renderChapter(item, state) {
    const node = item.node;
    node.style.setProperty('--v88-progress',state.progress.toFixed(4));
    node.style.setProperty('--v88-focus',state.focus.toFixed(4));
    node.style.setProperty('--v88-fold-angle',`${state.angle.toFixed(2)}deg`);
    node.style.setProperty('--v88-fold-lift',`${state.lift.toFixed(2)}px`);

    const mark = node.querySelector(':scope > .v88-fold-mark');
    if (mark) {
      mark.style.setProperty('--v88-fold-angle',`${state.angle.toFixed(2)}deg`);
      mark.style.setProperty('--v88-fold-lift',`${state.lift.toFixed(2)}px`);
      mark.style.setProperty('--v88-fold-opacity',(0.20 + state.focus*.42).toFixed(3));
    }

    if (item.key === 'archive') {
      const rows = [...node.querySelectorAll('.loop-row')];
      const offsets = [-26,18,-14];
      rows.forEach((row,index) => {
        const shift = (offsets[index] ?? ((index%2?-1:1)*12)) * (1-state.enter);
        row.style.setProperty('--v88-row-x',`${shift.toFixed(2)}px`);
      });
    }
  }

  function measureTargets() {
    needsMeasure = false;
    let best = Infinity;
    let nextCurrent = null;

    chapters.forEach(item => {
      const rect = item.node.getBoundingClientRect();
      const {center} = updateTargets(item,rect);
      if (rect.bottom <= 0 || rect.top >= innerHeight) return;
      const distance = Math.abs(center - innerHeight*.5);
      if (distance < best) { best = distance; nextCurrent = item; }
    });

    const scrollRange = Math.max(1,document.documentElement.scrollHeight - innerHeight);
    root.style.setProperty('--v94-page-progress',clamp(scrollY/scrollRange).toFixed(4));

    if (nextCurrent !== current) {
      current = nextCurrent;
      chapters.forEach(item => item.node.classList.toggle('v88-chapter-current',item === current));
      if (current) {
        root.dataset.movxCurrentChapter = current.key;
        root.dataset.movxChapterIndex = String(chapters.indexOf(current) + 1);
      }
    }
  }

  function frame(now) {
    raf = 0;
    if (needsMeasure) measureTargets();

    const dt = Math.min(48,Math.max(8,now-(lastTime || now-16)));
    lastTime = now;
    const alpha = reduced ? 1 : 1 - Math.exp(-dt / 118);
    let moving = false;

    states.forEach((state,item) => {
      for (const key of ['progress','focus','angle','lift','enter']) {
        const targetKey = `target${key[0].toUpperCase()}${key.slice(1)}`;
        const before = state[key];
        const target = state[targetKey];
        state[key] = reduced ? target : before + (target-before) * alpha;
        if (Math.abs(target-state[key]) > (key === 'angle' ? .04 : .0015)) moving = true;
      }
      renderChapter(item,state);
    });

    if ((moving || needsMeasure) && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function scheduleMeasure() {
    needsMeasure = true;
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  }

  /* The Living Archive is intentionally a moving wall. Its hover-only overlay is
     not an interactive/readable layer on touch layouts, so keep it out of the
     accessibility tree and integrity audit instead of treating an offscreen card
     edge as clipped visible copy. Desktop hover/focus behavior is unchanged. */
  const mobileArchive = matchMedia('(max-width:980px)');
  function syncMobileArchiveOverlays() {
    const mobile = mobileArchive.matches;
    document.querySelectorAll('#loopWall .loop-card__overlay').forEach(overlay => {
      if (mobile) {
        overlay.setAttribute('aria-hidden','true');
        overlay.dataset.v95MobileOverlay = 'inactive';
      } else if (overlay.dataset.v95MobileOverlay === 'inactive') {
        overlay.removeAttribute('aria-hidden');
        delete overlay.dataset.v95MobileOverlay;
      }
    });
    root.dataset.movxMobileArchiveAudit = mobile ? 'hover-overlays-inactive' : 'desktop-overlays-active';
  }

  /* Local depth is restricted to territory photography. Project covers keep the
     established v86/v87 motion owner so selected cases never have competing input. */
  const bound = new WeakSet();
  function bindMedia() {
    if (!desktop || !fine || reduced) return;

    document.querySelectorAll('#nicheGrid .niche-card').forEach(card => {
      if (bound.has(card)) return;
      bound.add(card);
      const media = card.querySelector('.niche-card__media');
      if (!media) return;
      card.addEventListener('pointermove',event => {
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX-rect.left)/Math.max(1,rect.width),0,1)-.5;
        const y = clamp((event.clientY-rect.top)/Math.max(1,rect.height),0,1)-.5;
        media.style.setProperty('--v88-media-x',`${(x*6).toFixed(2)}px`);
        media.style.setProperty('--v88-media-y',`${(y*4).toFixed(2)}px`);
      },{passive:true});
      card.addEventListener('pointerleave',() => {
        media.style.setProperty('--v88-media-x','0px');
        media.style.setProperty('--v88-media-y','0px');
      },{passive:true});
    });
  }

  if (reduced) {
    measureTargets();
    states.forEach((state,item) => {
      state.targetAngle = 0;
      state.targetLift = 0;
      for (const key of ['progress','focus','angle','lift','enter']) {
        const targetKey = `target${key[0].toUpperCase()}${key.slice(1)}`;
        state[key] = state[targetKey];
      }
      renderChapter(item,state);
    });
  } else {
    scheduleMeasure();
    addEventListener('scroll',scheduleMeasure,{passive:true});
    addEventListener('resize',scheduleMeasure,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleMeasure();});
  }

  bindMedia();
  syncMobileArchiveOverlays();
  mobileArchive.addEventListener?.('change',syncMobileArchiveOverlays);

  const dynamicHost = document.getElementById('nicheGrid');
  if (dynamicHost && 'MutationObserver' in window) {
    new MutationObserver(() => { bindMedia(); scheduleMeasure(); }).observe(dynamicHost,{childList:true,subtree:true});
  }
  const loopHost = document.getElementById('loopWall');
  if (loopHost && 'MutationObserver' in window) {
    new MutationObserver(syncMobileArchiveOverlays).observe(loopHost,{childList:true,subtree:true});
  }
})();
