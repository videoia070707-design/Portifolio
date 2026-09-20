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
