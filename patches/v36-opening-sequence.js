/* MOVX v36 — cinematic opening runtime
   Connects the sticky header, hero, contents rail and first archive chapter.
   Additive/fail-open: no content depends on this enhancement. */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const hero = document.getElementById('heroTop');
  const stage = hero?.querySelector('.social-cover-art__stage');
  const heroIndex = hero?.querySelector('.hero-index');
  const archive = document.getElementById('livingArchive');
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  root.classList.add('movx-v36');
  root.dataset.movxOpening = 'v36-cinematic-handoff';

  if (!body || !hero || !stage || !heroIndex || !archive) return;

  try {
    let raf = 0;
    let lastHeroMode = null;

    const update = () => {
      raf = 0;
      const heroRect = hero.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const archiveRect = archive.getBoundingClientRect();
      const header = document.querySelector('.site-header');
      const headerHeight = header?.getBoundingClientRect().height || 72;

      const heroProgress = clamp((-stageRect.top) / Math.max(1, stageRect.height * .84));
      const handoff = clamp((innerHeight * .86 - archiveRect.top) / Math.max(1, innerHeight * .7));
      root.style.setProperty('--v36-hero-progress', heroProgress.toFixed(4));
      root.style.setProperty('--v36-handoff', handoff.toFixed(4));

      const heroMode = heroRect.bottom > headerHeight + 18;
      if (heroMode !== lastHeroMode) {
        root.classList.toggle('v36-hero-mode', heroMode);
        lastHeroMode = heroMode;
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    addEventListener('scroll', schedule, { passive:true });
    addEventListener('resize', schedule, { passive:true });
    update();

    /* The first archive chapter arrives as one composition; no child text movement. */
    if ('IntersectionObserver' in window && !reduced) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          archive.classList.add('v36-archive-arrived');
          observer.disconnect();
        });
      }, { threshold:.06, rootMargin:'0px 0px -8% 0px' });
      observer.observe(archive);
    } else {
      archive.classList.add('v36-archive-arrived');
    }

    /* Keep the opening rail keyboard-friendly on narrow screens. */
    heroIndex.addEventListener('focusin', event => {
      const link = event.target.closest?.('.hero-index__item');
      if (!link || innerWidth > 900) return;
      link.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block:'nearest', inline:'center' });
    });

  } catch (error) {
    console.warn('MOVX v36 opening enhancement failed open:', error);
  }
})();

/* MOVX v65 — global discipline navigation
   Keeps Social Media, Video Editor and AI Creator connected without adding a dashboard/dropdown UI. */
(() => {
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const header=document.querySelector('.site-header');
  const row=header?.querySelector('.header-row');
  const wordmark=row?.querySelector('.wordmark');
  const mobile=header?.querySelector('.mobile-menu');
  if(!body||!row||!wordmark)return;

  root.classList.add('movx-v65');
  root.dataset.movxDisciplines='v65-global-navigation';

  const page=body.dataset.page||'social';
  const disciplines=[
    {id:'social',no:'01',label:'Social Media',short:'SM',href:'social-media.html'},
    {id:'video',no:'02',label:'Video Editor',short:'VE',href:'video-editor.html'},
    {id:'ai',no:'03',label:'AI Creator',short:'AI',href:'ai-creator.html'}
  ];

  const linkMarkup=(item,compact=false)=>{
    const current=item.id===page?' aria-current="page"':'';
    if(compact)return `<a data-transition href="${item.href}"${current}><span>${item.no}</span>${item.label}</a>`;
    return `<a data-transition href="${item.href}"${current} title="${item.label}"><span class="v65-full">${item.label}</span><span class="v65-short">${item.short}</span></a>`;
  };

  if(!row.querySelector('.v65-brand-cluster')){
    const cluster=document.createElement('div');
    cluster.className='v65-brand-cluster';
    wordmark.parentNode.insertBefore(cluster,wordmark);
    cluster.appendChild(wordmark);
    const switcher=document.createElement('nav');
    switcher.className='v65-discipline-switcher';
    switcher.setAttribute('aria-label','Áreas do portfólio');
    switcher.innerHTML=disciplines.map(item=>linkMarkup(item)).join('');
    cluster.appendChild(switcher);
  }

  if(mobile&&!mobile.querySelector('.v65-mobile-disciplines')){
    const disciplinesNav=document.createElement('nav');
    disciplinesNav.className='v65-mobile-disciplines';
    disciplinesNav.setAttribute('aria-label','Áreas do portfólio');
    disciplinesNav.innerHTML=disciplines.map(item=>linkMarkup(item,true)).join('');
    mobile.insertBefore(disciplinesNav,mobile.firstChild);
  }

  const footer=document.querySelector('.site-footer .container');
  if(footer&&!footer.querySelector('.v65-footer-disciplines')){
    const footerNav=document.createElement('nav');
    footerNav.className='v65-footer-disciplines';
    footerNav.setAttribute('aria-label','Outras áreas do portfólio');
    footerNav.innerHTML=disciplines.map(item=>linkMarkup(item,true)).join('');
    footer.appendChild(footerNav);
  }

  if(!document.getElementById('movx-v65-discipline-style')){
    const style=document.createElement('style');
    style.id='movx-v65-discipline-style';
    style.textContent=`
      html.movx-v65 .v65-brand-cluster{
        justify-self:start;display:flex;align-items:center;gap:clamp(16px,1.8vw,28px);min-width:0
      }
      html.movx-v65 .v65-brand-cluster .wordmark{justify-self:auto;flex:none}
      html.movx-v65 .v65-discipline-switcher{
        display:flex;align-items:center;gap:clamp(10px,1vw,16px);padding-left:clamp(14px,1.4vw,22px);
        border-left:1px solid color-mix(in srgb,currentColor 18%,transparent);white-space:nowrap
      }
      html.movx-v65 .v65-discipline-switcher a{
        position:relative;padding:5px 0;color:inherit;opacity:.42;
        font:700 8px/1 var(--mono,ui-monospace,monospace);letter-spacing:.13em;text-transform:uppercase;
        transition:opacity .45s ease
      }
      html.movx-v65 .v65-discipline-switcher a::after{
        content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--editorial-red);
        transform:scaleX(0);transform-origin:left;transition:transform .7s cubic-bezier(.16,1,.3,1)
      }
      html.movx-v65 .v65-discipline-switcher a:hover,
      html.movx-v65 .v65-discipline-switcher a:focus-visible,
      html.movx-v65 .v65-discipline-switcher a[aria-current="page"]{opacity:1}
      html.movx-v65 .v65-discipline-switcher a:hover::after,
      html.movx-v65 .v65-discipline-switcher a:focus-visible::after,
      html.movx-v65 .v65-discipline-switcher a[aria-current="page"]::after{transform:scaleX(1)}
      html.movx-v65 .v65-short{display:none}

      html.movx-v65 .v65-mobile-disciplines{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:0 0 18px;margin:0 0 10px;border-bottom:1px solid var(--line)}
      html.movx-v65 .mobile-menu .v65-mobile-disciplines a{
        display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:baseline;
        min-width:0;padding:8px 0;border:0!important;font:700 10px/1.15 var(--mono,ui-monospace,monospace)!important;
        letter-spacing:.05em!important;color:var(--fg);opacity:.48
      }
      html.movx-v65 .mobile-menu .v65-mobile-disciplines a span{font-size:7px;letter-spacing:.13em;color:var(--muted)}
      html.movx-v65 .mobile-menu .v65-mobile-disciplines a[aria-current="page"]{opacity:1;color:var(--editorial-red)}

      html.movx-v65 .v65-footer-disciplines{
        display:flex;align-items:center;gap:clamp(20px,2.6vw,38px);margin-top:clamp(34px,4vw,56px);
        padding-top:18px;border-top:1px solid color-mix(in srgb,currentColor 18%,transparent)
      }
      html.movx-v65 .v65-footer-disciplines a{
        display:flex;align-items:center;gap:8px;color:inherit;opacity:.48;
        font:700 9px/1 var(--mono,ui-monospace,monospace);letter-spacing:.08em;text-transform:uppercase;
        transition:opacity .45s ease
      }
      html.movx-v65 .v65-footer-disciplines a span{font-size:7px;opacity:.58}
      html.movx-v65 .v65-footer-disciplines a:hover,
      html.movx-v65 .v65-footer-disciplines a:focus-visible,
      html.movx-v65 .v65-footer-disciplines a[aria-current="page"]{opacity:1}
      html.movx-v65 .v65-footer-disciplines a[aria-current="page"]{color:var(--editorial-red)}

      @media(max-width:1240px) and (min-width:981px){
        html.movx-v65 .v65-brand-cluster{gap:18px}
        html.movx-v65 .v65-discipline-switcher{gap:11px;padding-left:15px}
        html.movx-v65 .v65-full{display:none}
        html.movx-v65 .v65-short{display:inline}
      }
      @media(max-width:980px){
        html.movx-v65 .v65-discipline-switcher{display:none}
        html.movx-v65 .v65-brand-cluster{display:block;min-width:0}
      }
      @media(min-width:981px){html.movx-v65 .v65-mobile-disciplines{display:none!important}}
      @media(max-width:620px){
        html.movx-v65 .v65-mobile-disciplines{grid-template-columns:1fr;gap:0}
        html.movx-v65 .v65-footer-disciplines{align-items:flex-start;flex-direction:column;gap:14px}
      }
    `;
    document.head.appendChild(style);
  }
})();

/* MOVX v66 — intentional reserved chapters for Video Editor + AI Creator
   No fictional work is introduced. Existing status copy becomes the visual system. */
(() => {
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const page=body?.dataset.page;
  if(page!=='video'&&page!=='ai')return;

  const hero=document.querySelector('.page-hero');
  const grid=hero?.querySelector('.page-hero__grid');
  const meta=hero?.querySelector('.page-hero__meta');
  const empty=document.querySelector('.empty-archive');
  const emptyInner=empty?.querySelector('.empty-archive__inner');
  if(!hero||!grid||!empty||!emptyInner)return;

  const chapter=page==='video'?'02':'03';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('movx-v66');
  root.dataset.movxReservedChapter=`v66-${page}`;
  hero.dataset.v66Chapter=chapter;
  empty.dataset.v66Chapter=chapter;

  if(meta&&!document.querySelector('.v66-status-rail')){
    const rail=document.createElement('div');
    rail.className='v66-status-rail';
    const inner=document.createElement('div');
    inner.className='container v66-status-rail__inner';
    const number=document.createElement('span');
    number.className='v66-status-rail__number';
    number.setAttribute('aria-hidden','true');
    number.textContent=chapter;
    inner.appendChild(number);
    inner.appendChild(meta);
    rail.appendChild(inner);
    hero.insertAdjacentElement('afterend',rail);
  }

  if(!emptyInner.querySelector('.v66-empty-rule')){
    const rule=document.createElement('div');
    rule.className='v66-empty-rule';
    rule.setAttribute('aria-hidden','true');
    emptyInner.prepend(rule);
  }

  if(!document.getElementById('movx-v66-reserved-style')){
    const style=document.createElement('style');
    style.id='movx-v66-reserved-style';
    style.textContent=`
      html.movx-v66 body[data-page="video"],html.movx-v66 body[data-page="ai"]{
        --v66-ease:cubic-bezier(.16,1,.3,1);--v66-chapter-y:0px
      }
      html.movx-v66 body[data-page="video"] .page-hero,
      html.movx-v66 body[data-page="ai"] .page-hero{
        min-height:clamp(650px,82vh,900px)!important;padding:clamp(118px,12vw,182px) 0 clamp(72px,7vw,112px)!important;
        display:flex!important;align-items:flex-end!important;overflow:hidden!important;isolation:isolate!important;
        background:var(--bg)!important;color:var(--fg)!important;border-bottom:0!important
      }
      html.movx-v66 body[data-page="video"] .page-hero::before,
      html.movx-v66 body[data-page="ai"] .page-hero::before{
        content:attr(data-v66-chapter)!important;position:absolute!important;left:clamp(-14px,-.8vw,0px)!important;
        right:auto!important;top:50%!important;inset:auto auto auto clamp(-14px,-.8vw,0px)!important;
        transform:translate3d(0,calc(-50% + var(--v66-chapter-y)),0)!important;
        background:none!important;width:auto!important;height:auto!important;
        font:400 clamp(330px,44vw,720px)/.7 var(--serif,Georgia,'Times New Roman',serif)!important;
        letter-spacing:-.105em!important;color:color-mix(in srgb,var(--fg) 4.4%,transparent)!important;
        -webkit-text-stroke:1px color-mix(in srgb,var(--fg) 6.8%,transparent)!important;
        pointer-events:none!important;z-index:0!important;white-space:nowrap!important
      }
      html.movx-v66 body[data-page="video"] .page-hero::after,
      html.movx-v66 body[data-page="ai"] .page-hero::after{
        content:"";position:absolute;left:32px;right:32px;bottom:0;height:1px;
        background:linear-gradient(90deg,var(--editorial-red) 0 9%,color-mix(in srgb,var(--fg) 18%,transparent) 9% 100%);
        transform-origin:left center;transform:scaleX(.16);opacity:.9;
        transition:transform 1.25s var(--v66-ease) .12s;z-index:2
      }
      html.movx-v66.v66-ready body[data-page="video"] .page-hero::after,
      html.movx-v66.v66-ready body[data-page="ai"] .page-hero::after{transform:scaleX(1)}
      html.movx-v66 body[data-page="video"] .page-hero__grid,
      html.movx-v66 body[data-page="ai"] .page-hero__grid{
        position:relative!important;z-index:2!important;width:100%!important;
        grid-template-columns:minmax(0,1.32fr) minmax(300px,.68fr)!important;
        gap:clamp(42px,7vw,110px)!important;align-items:end!important
      }
      html.movx-v66 body[data-page="video"] .page-index,
      html.movx-v66 body[data-page="ai"] .page-index{
        color:var(--editorial-red)!important;margin-bottom:clamp(18px,2.5vw,36px)!important;
        font-weight:700!important;letter-spacing:.16em!important
      }
      html.movx-v66 body[data-page="video"] .page-hero h1,
      html.movx-v66 body[data-page="ai"] .page-hero h1{
        max-width:8.8ch!important;margin:0!important;color:var(--fg)!important;
        font-family:var(--serif,Georgia,'Times New Roman',serif)!important;font-weight:400!important;
        font-size:clamp(78px,10.2vw,166px)!important;line-height:.79!important;letter-spacing:-.075em!important
      }
      html.movx-v66 body[data-page="video"] .page-hero p,
      html.movx-v66 body[data-page="ai"] .page-hero p{
        max-width:44ch!important;margin:0 0 4px!important;color:var(--muted)!important;
        font-size:clamp(15px,1.08vw,18px)!important;line-height:1.72!important
      }

      html.movx-v66 .v66-status-rail{position:relative;background:var(--bg);color:var(--fg);border-bottom:1px solid var(--line)}
      html.movx-v66 .v66-status-rail__inner{
        min-height:92px;display:grid;grid-template-columns:minmax(72px,.18fr) 1fr;gap:clamp(24px,4vw,62px);align-items:center
      }
      html.movx-v66 .v66-status-rail__number{
        font:700 10px/1 var(--mono,ui-monospace,monospace);letter-spacing:.14em;color:var(--editorial-red)
      }
      html.movx-v66 .v66-status-rail .page-hero__meta{
        margin:0!important;padding:0!important;border:0!important;display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important;color:var(--muted)!important
      }
      html.movx-v66 .v66-status-rail .page-hero__meta span{
        position:relative;padding:25px clamp(18px,2.2vw,34px) 24px 0;
        font:700 9px/1.3 var(--mono,ui-monospace,monospace);letter-spacing:.12em;text-transform:uppercase
      }
      html.movx-v66 .v66-status-rail .page-hero__meta span+span{padding-left:clamp(18px,2.2vw,34px);border-left:1px solid var(--line)}

      html.movx-v66 body[data-page="video"] .empty-archive,
      html.movx-v66 body[data-page="ai"] .empty-archive{
        position:relative;min-height:clamp(680px,86vh,940px)!important;padding:clamp(100px,10vw,156px) 0!important;
        display:grid!important;place-items:center!important;overflow:hidden!important;isolation:isolate!important;
        background:#090807!important;color:#f3eee9!important
      }
      html.movx-v66 body[data-page="video"] .empty-archive::before,
      html.movx-v66 body[data-page="ai"] .empty-archive::before{
        content:attr(data-v66-chapter);position:absolute;right:-.03em;bottom:-.15em;z-index:0;
        font:400 clamp(300px,43vw,690px)/.72 var(--serif,Georgia,'Times New Roman',serif);
        letter-spacing:-.11em;color:rgba(243,238,233,.027);pointer-events:none
      }
      html.movx-v66 .empty-archive__inner{
        position:relative;z-index:1;width:100%!important;grid-template-columns:minmax(0,1.22fr) minmax(280px,.78fr)!important;
        gap:clamp(54px,8vw,128px)!important;align-items:end!important;border:0!important;padding-top:0!important
      }
      html.movx-v66 .v66-empty-rule{
        grid-column:1/-1;height:1px;background:linear-gradient(90deg,#b84434 0 8%,rgba(243,238,233,.2) 8% 100%);
        transform-origin:left center;transform:scaleX(.12);opacity:.9;transition:transform 1.3s var(--v66-ease)
      }
      html.movx-v66 .empty-archive.v66-in .v66-empty-rule{transform:scaleX(1)}
      html.movx-v66 body[data-page="video"] .empty-archive h2,
      html.movx-v66 body[data-page="ai"] .empty-archive h2{
        margin:0!important;max-width:8.4ch!important;color:#f3eee9!important;
        font-family:var(--serif,Georgia,'Times New Roman',serif)!important;font-weight:400!important;
        font-size:clamp(76px,10.6vw,172px)!important;line-height:.78!important;letter-spacing:-.072em!important
      }
      html.movx-v66 body[data-page="video"] .empty-archive p,
      html.movx-v66 body[data-page="ai"] .empty-archive p{
        max-width:45ch!important;margin:0!important;color:rgba(243,238,233,.62)!important;
        font-size:clamp(15px,1.06vw,18px)!important;line-height:1.74!important
      }
      html.movx-v66 .empty-marker{
        position:relative;margin-top:clamp(30px,4vw,54px)!important;padding:17px 0 0 24px!important;
        border:0!important;border-top:1px solid rgba(243,238,233,.2)!important;background:transparent!important;
        color:rgba(243,238,233,.7)!important;font-size:9px!important
      }
      html.movx-v66 .empty-marker::before{
        content:"";position:absolute;left:0;top:16px;width:7px;height:7px;border-radius:50%;background:#b84434
      }
      html.movx-v66 body[data-page="video"] .site-footer,
      html.movx-v66 body[data-page="ai"] .site-footer{
        background:var(--bg)!important;color:var(--fg)!important;border-top:1px solid var(--line)!important
      }
      html.movx-v66 body[data-page="video"] .footer-big,
      html.movx-v66 body[data-page="ai"] .footer-big{
        max-width:10.5ch;font-family:var(--serif,Georgia,'Times New Roman',serif)!important;font-weight:400!important;
        font-size:clamp(82px,14vw,220px)!important;line-height:.73!important;letter-spacing:-.075em!important
      }

      @media(max-width:980px){
        html.movx-v66 body[data-page="video"] .page-hero,
        html.movx-v66 body[data-page="ai"] .page-hero{min-height:auto!important;padding:112px 0 70px!important}
        html.movx-v66 body[data-page="video"] .page-hero__grid,
        html.movx-v66 body[data-page="ai"] .page-hero__grid{grid-template-columns:1fr!important;gap:44px!important}
        html.movx-v66 body[data-page="video"] .page-hero::before,
        html.movx-v66 body[data-page="ai"] .page-hero::before{font-size:clamp(270px,64vw,520px)!important;left:-.08em!important}
        html.movx-v66 .v66-status-rail__inner{grid-template-columns:54px 1fr}
        html.movx-v66 .v66-status-rail .page-hero__meta{grid-template-columns:1fr!important}
        html.movx-v66 .v66-status-rail .page-hero__meta span{padding:18px 0!important;border-left:0!important;border-top:1px solid var(--line)}
        html.movx-v66 .v66-status-rail .page-hero__meta span:first-child{border-top:0!important}
        html.movx-v66 .empty-archive__inner{grid-template-columns:1fr!important;gap:42px!important}
      }
      @media(max-width:620px){
        html.movx-v66 body[data-page="video"] .page-hero h1,
        html.movx-v66 body[data-page="ai"] .page-hero h1{font-size:clamp(62px,19vw,94px)!important;max-width:7.8ch!important}
        html.movx-v66 body[data-page="video"] .page-hero::after,
        html.movx-v66 body[data-page="ai"] .page-hero::after{left:20px;right:20px}
        html.movx-v66 .v66-status-rail__inner{grid-template-columns:1fr;gap:0;padding-top:20px;padding-bottom:12px}
        html.movx-v66 .v66-status-rail__number{padding-bottom:10px}
        html.movx-v66 body[data-page="video"] .empty-archive,
        html.movx-v66 body[data-page="ai"] .empty-archive{min-height:auto!important;padding:92px 0 104px!important}
        html.movx-v66 body[data-page="video"] .empty-archive h2,
        html.movx-v66 body[data-page="ai"] .empty-archive h2{font-size:clamp(64px,20vw,100px)!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v66 body[data-page="video"] .page-hero::after,
        html.movx-v66 body[data-page="ai"] .page-hero::after,
        html.movx-v66 .v66-empty-rule{transform:scaleX(1)!important;transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('v66-ready')));

  if(reduced||!('IntersectionObserver'in window))empty.classList.add('v66-in');
  else{
    const io=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      empty.classList.add('v66-in');
      io.disconnect();
    },{threshold:.08,rootMargin:'0px 0px -8% 0px'});
    io.observe(empty);
  }

  if(reduced)return;
  let target=0,value=0,raf=0;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  function measure(){
    const rect=hero.getBoundingClientRect();
    target=clamp((-rect.top)/Math.max(1,rect.height*.8));
    if(!raf)raf=requestAnimationFrame(paint);
  }
  function paint(){
    raf=0;const d=target-value;value+=d*.07;
    root.style.setProperty('--v66-chapter-y',`${(-value*34).toFixed(2)}px`);
    if(Math.abs(d)>.0007)raf=requestAnimationFrame(paint);
  }
  measure();value=target;root.style.setProperty('--v66-chapter-y',`${(-value*34).toFixed(2)}px`);
  addEventListener('scroll',measure,{passive:true});
  addEventListener('resize',measure,{passive:true});
})();