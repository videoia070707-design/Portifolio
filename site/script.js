/* MOVX v38 build optimization — scroll work throttled and case progress compositor-scheduled. */
/* MOVX v37 build optimization — CSS-owned marquee motion + redundant legacy interaction hooks removed. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('static');
  const finePointer = window.matchMedia('(pointer:fine)').matches;

  const CURATED_ORDER = [
    'voltara-operacoes',
    'hardwork-thermo-plus',
    'marina-gengival',
    'voltara-viabilidade',
    'hardwork-modo',
    'belive-cashflow',
    'voltara-vantagem',
    'marina-familia',
    'voltara-confianca-escala',
    'voltara-engenharia-aplicada',
    'voltara-infraestrutura',
    'hardwork-neon-direction',
    'motionhub'
  ];

  const bySlug = slug => projects.find(project => project.slug === slug);
  const socialBase = projects.filter(project => project.category === 'social');
  const socialProjects = [
    ...CURATED_ORDER.map(bySlug).filter(Boolean),
    ...socialBase.filter(project => !CURATED_ORDER.includes(project.slug))
  ];

  const I18N = window.MOVX_I18N || {default:'pt',ui:{},projects:{},cases:{}};
  const supportedLangs = ['en','es','pt'];
  const storageGet = key => { try { return window.localStorage?.getItem(key) || null; } catch { return null; } };
  const storageSet = (key,value) => { try { window.localStorage?.setItem(key,value); } catch {} };
  const savedLang = storageGet('movx-lang');
  let currentLang = supportedLangs.includes(savedLang) ? savedLang : (I18N.default || 'pt');

  /* Social niche taxonomy — intentionally separate from format filters */
  const industryMap = {
    'marina-gengival':'healthcare',
    'marina-familia':'healthcare',
    'voltara-operacoes':'energy',
    'voltara-vantagem':'energy',
    'voltara-viabilidade':'energy',
    'voltara-confianca-escala':'energy',
    'voltara-engenharia-aplicada':'energy',
    'voltara-infraestrutura':'energy',
    'belive-cashflow':'finance',
    'hardwork-thermo-plus':'supplements',
    'hardwork-modo':'supplements',
    'hardwork-neon-direction':'supplements',
    'motionhub':'saas'
  };
  const industryDefs = [
    { key:'all', cover:null, label:{pt:'Todos os nichos',en:'All niches',es:'Todos los nichos'}, desc:{pt:'Visão completa do arquivo',en:'Complete archive view',es:'Vista completa del archivo'} },
    { key:'energy', cover:'voltara-operacoes', label:{pt:'Energia',en:'Energy',es:'Energía'}, desc:{pt:'B2B, operação e infraestrutura',en:'B2B, operations and infrastructure',es:'B2B, operaciones e infraestructura'} },
    { key:'healthcare', cover:'marina-gengival', label:{pt:'Saúde',en:'Healthcare',es:'Salud'}, desc:{pt:'Estética, cuidado e confiança',en:'Aesthetics, care and trust',es:'Estética, cuidado y confianza'} },
    { key:'supplements', cover:'hardwork-thermo-plus', label:{pt:'Suplementos',en:'Supplements',es:'Suplementos'}, desc:{pt:'Produto, impacto e performance',en:'Product, impact and performance',es:'Producto, impacto y rendimiento'} },
    { key:'finance', cover:'belive-cashflow', label:{pt:'Finanças',en:'Finance',es:'Finanzas'}, desc:{pt:'Negócio, dados e posicionamento',en:'Business, data and positioning',es:'Negocio, datos y posicionamiento'} },
    { key:'saas', cover:'motionhub', label:{pt:'Produto digital',en:'Digital product',es:'Producto digital'}, desc:{pt:'Software criativo e storytelling de produto',en:'Creative software and product storytelling',es:'Software creativo y storytelling de producto'} }
  ];
  const getIndustry = project => project?.industry || industryMap[project?.slug] || 'all';
  socialProjects.forEach(project => { project.industry = getIndustry(project); });
  const localizeIndustry = key => industryDefs.find(item=>item.key===key)?.label?.[currentLang] || key;
  const localizeIndustryDesc = key => industryDefs.find(item=>item.key===key)?.desc?.[currentLang] || '';

  function t(key){
    return I18N.ui?.[currentLang]?.[key] ?? I18N.ui?.pt?.[key] ?? key;
  }

  function projectCopy(project){
    return {...project, ...(I18N.projects?.[project.slug]?.[currentLang] || I18N.projects?.[project.slug]?.pt || {})};
  }

  function getCaseStudy(project){
    const localized = I18N.cases?.[project.slug]?.[currentLang] || I18N.cases?.[project.slug]?.pt;
    if(localized) return localized;
    const meta = projectCopy(project);
    return {
      context: meta.description,
      challenge: currentLang === 'en' ? 'Clarify the message without losing visual identity.' : currentLang === 'es' ? 'Aclarar el mensaje sin perder identidad visual.' : 'Clarificar a mensagem sem perder identidade visual.',
      direction: meta.subtitle,
      storyArc: currentLang === 'en' ? 'Opening → development → synthesis → close.' : currentLang === 'es' ? 'Apertura → desarrollo → síntesis → cierre.' : 'Abertura → desenvolvimento → síntese → fecho.',
      paletteColors: [project.accent || '#101113','#101113','#f2efe8'],
      paletteWhy: currentLang === 'en' ? 'Accent colour creates recognition while neutral tones preserve contrast and flexibility.' : currentLang === 'es' ? 'El color de acento crea reconocimiento y los neutros preservan contraste y flexibilidad.' : 'A cor de destaque cria reconhecimento e os neutros preservam contraste e flexibilidade.',
      typography: currentLang === 'en' ? 'Fast-reading typography with a clear hierarchy between headlines and support copy.' : currentLang === 'es' ? 'Tipografía de lectura rápida con una jerarquía clara entre titulares y texto de apoyo.' : 'Tipografia de leitura rápida, com hierarquia clara entre títulos e texto de apoio.',
      composition: currentLang === 'en' ? 'Composition is driven by hierarchy, negative space and rhythm variation.' : currentLang === 'es' ? 'La composición se guía por jerarquía, espacio negativo y variación de ritmo.' : 'A composição é guiada por hierarquia, espaço negativo e variação de ritmo.',
      elements: project.tags || [],
      copyNotes: currentLang === 'en' ? 'Short copy focused on one main idea per frame.' : currentLang === 'es' ? 'Copy breve centrada en una idea principal por cuadro.' : 'Copy curta, centrada numa ideia principal por quadro.',
      rationale: currentLang === 'en' ? 'The system balances clarity, impact and consistency.' : currentLang === 'es' ? 'El sistema equilibra claridad, impacto y consistencia.' : 'O sistema equilibra clareza, impacto e consistência.'
    };
  }

  function formatLabel(format){ return t(`format.${format || 'project'}`); }

  const TAG_LABELS = {
    pt:{'Social Design':'Design Social','Carousel':'Carrossel','Healthcare':'Saúde','Family Care':'Família','B2B':'B2B','Energy':'Energia','Brand System':'Sistema de Marca','Industrial':'Industrial','Corporate':'Corporativo','3D':'3D','Finance':'Finanças','Product':'Produto','Character':'Personagem','Campaign':'Campanha','Art Direction':'Direção de Arte','SaaS':'SaaS'},
    en:{'Social Design':'Social Design','Carousel':'Carousel','Healthcare':'Healthcare','Family Care':'Family Care','B2B':'B2B','Energy':'Energy','Brand System':'Brand System','Industrial':'Industrial','Corporate':'Corporate','3D':'3D','Finance':'Finance','Product':'Product','Character':'Character','Campaign':'Campaign','Art Direction':'Art Direction','SaaS':'SaaS'},
    es:{'Social Design':'Diseño Social','Carousel':'Carrusel','Healthcare':'Salud','Family Care':'Familia','B2B':'B2B','Energy':'Energía','Brand System':'Sistema de Marca','Industrial':'Industrial','Corporate':'Corporativo','3D':'3D','Finance':'Finanzas','Product':'Producto','Character':'Personaje','Campaign':'Campaña','Art Direction':'Dirección de Arte','SaaS':'SaaS'}
  };
  function tagLabel(tag){ return TAG_LABELS[currentLang]?.[tag] || tag; }

  function applyStaticTranslations({revealTranslated=false}={}){
    root.lang = currentLang === 'pt' ? 'pt-PT' : currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { const next=t(el.dataset.i18nHtml); if(el.innerHTML !== next) el.innerHTML = next; });
    document.querySelectorAll('[data-lang]').forEach(btn => {
      const active = btn.dataset.lang === currentLang;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed', String(active));
    });
    if(revealTranslated){
      document.querySelectorAll('[data-i18n-html] .mask-reveal').forEach(el => el.classList.add('in'));
    }
  }

  /* Theme */
  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeLabel = document.querySelector('.theme-label');
  function syncThemeLabel(){ if(themeLabel) themeLabel.textContent = root.dataset.theme === 'dark' ? t('theme.light') : t('theme.dark'); }
  function applyTheme(next){ root.dataset.theme = next; storageSet('movx-theme', next); syncThemeLabel(); }
  syncThemeLabel();
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if(document.startViewTransition && !reduceMotion) document.startViewTransition(() => applyTheme(next));
    else applyTheme(next);
  });

  applyStaticTranslations();
  syncThemeLabel();

  /* Page intro/outro */
  requestAnimationFrame(() => body.classList.add('page-ready'));
  document.querySelectorAll('a[data-transition]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if(!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank' || reduceMotion) return;
      event.preventDefault();
      body.classList.remove('page-ready');
      body.classList.add('page-leaving');
      setTimeout(() => location.href = href, 560);
    });
  });

  /* Header + progress + velocity */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress span');
  function onScroll(){
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 10);
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if(progress) progress.style.transform = `scaleX(${Math.min(1,y/total)})`;
  }
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* v37: ticker motion is compositor/CSS-owned; no permanent RAF loop. */

  /* Reveal utilities */
  function registerRevealEls(scope=document){
    const els = scope.querySelectorAll('.reveal,.mask-reveal,.media-reveal');
    if('IntersectionObserver' in window && !reduceMotion){
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if(entry.isIntersecting){ entry.target.classList.add('in'); observer.unobserve(entry.target); }
      }), {threshold:.08, rootMargin:'0px 0px -4% 0px'});
      els.forEach(el => observer.observe(el));
    } else els.forEach(el => el.classList.add('in'));
  }
  registerRevealEls();

  /* Scroll parallax */
  const parallax = [...document.querySelectorAll('.parallax-media')];
  if(parallax.length && !reduceMotion){
    let raf = false;
    const update = () => {
      parallax.forEach(el => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height/2 - innerHeight/2;
        const amount = Math.max(-24, Math.min(24, -center * .035));
        el.style.setProperty('--parallax-y', `${amount}px`);
      });
      raf = false;
    };
    addEventListener('scroll', () => { if(!raf){ raf=true; requestAnimationFrame(update); } }, {passive:true});
    update();
  }

  /* Hero pointer drift */
  const collage = document.querySelector('.hero-collage');
  if(collage && finePointer && !reduceMotion){
    const cards = [...collage.querySelectorAll('.hero-card')];
    collage.addEventListener('pointermove', event => {
      const rect = collage.getBoundingClientRect();
      const nx = (event.clientX-rect.left)/rect.width-.5;
      const ny = (event.clientY-rect.top)/rect.height-.5;
      cards.forEach((card,index) => {
        const d = (index+1)*5;
        const base = index===0?'rotate(-1.8deg)':index===1?'rotate(1.1deg)':'rotate(-.7deg)';
        card.style.transform = `${base} translate3d(${nx*d}px,${ny*d}px,0)`;
      });
    });
    collage.addEventListener('pointerleave', () => cards.forEach(card => card.style.removeProperty('transform')));
  }

  /* Magnetic and micro tilt */
  if(finePointer && !reduceMotion){
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', event => {
        const rect=el.getBoundingClientRect();
        const x=(event.clientX-rect.left-rect.width/2)*.12;
        const y=(event.clientY-rect.top-rect.height/2)*.12;
        el.style.transform=`translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave',()=>el.style.transform='');
    });
  }

  function attachTilt(scope=document){
    if(!finePointer || reduceMotion) return;
    scope.querySelectorAll('.archive-card,.loop-card').forEach(card => {
      if(card.dataset.tiltReady) return;
      card.dataset.tiltReady = '1';
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--rx', `${(-y * 2.2).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 2.6).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx','0deg');
        card.style.setProperty('--ry','0deg');
      });
    });
  }

  function attachProjectSpotlight(scope=document){
    if(!finePointer || reduceMotion) return;
    scope.querySelectorAll('.project-cover').forEach(card => {
      if(card.dataset.spotReady) return;
      card.dataset.spotReady='1';
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
    });
  }

  /* Mobile menu */
  const menuButton = document.querySelector('.menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  menuButton?.addEventListener('click',()=>{
    const open = mobileMenu?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
  });

  /* Premium case viewer */
  const viewer = document.getElementById('caseViewer');
  const caseHero = document.getElementById('caseHero');
  const caseInfo = document.getElementById('caseInfo');
  const caseSlides = document.getElementById('caseSlides');
  const closeCase = document.getElementById('caseClose');
  const casePrev = document.getElementById('casePrev');
  const caseNext = document.getElementById('caseNext');
  const caseTopLabel = document.getElementById('caseTopLabel');
  const caseProgress = document.getElementById('caseProgress');
  let currentCaseSlug = null;
  let lastOpenPoint = {x:'50%', y:'50%'};

  function adjacentProject(slug, delta){
    const index = socialProjects.findIndex(project => project.slug === slug);
    if(index < 0) return socialProjects[0];
    return socialProjects[(index + delta + socialProjects.length) % socialProjects.length];
  }

  function buildCaseInfo(project){
    const study = getCaseStudy(project);
    const meta = projectCopy(project);
    return `
      <div class="case-kicker">${t('case.studyKicker')} / ${project.client}</div>
      <h2>${meta.title}</h2>
      <p class="case-lead">${meta.subtitle}</p>
      <p class="case-description">${meta.description}</p>
      <div class="project-tags">${project.tags.map(tag=>`<span>${tagLabel(tag)}</span>`).join('')}</div>
      <div class="case-facts">
        <div><span>${t('case.client')}</span><strong>${project.client}</strong></div>
        <div><span>${t('case.format')}</span><strong>${formatLabel(project.format)}</strong></div>
        <div><span>${t('case.industry')}</span><strong>${localizeIndustry(getIndustry(project))}</strong></div>
        <div><span>${t('case.piecesLabel')}</span><strong>${project.slides.length}</strong></div>
      </div>

      <div class="case-chapter-label">${t('case.chapter1')}</div>
      <section class="case-study-block"><strong>${t('case.context')}</strong><p>${study.context}</p></section>
      <section class="case-study-block"><strong>${t('case.challenge')}</strong><p>${study.challenge}</p></section>

      <div class="case-chapter-label">${t('case.chapter2')}</div>
      <section class="case-study-block"><strong>${t('case.direction')}</strong><p>${study.direction}</p></section>
      <section class="case-study-block"><strong>${t('case.storyArc')}</strong><p>${study.storyArc}</p></section>

      <div class="case-chapter-label">${t('case.chapter3')}</div>
      <section class="case-study-block"><strong>${t('case.palette')}</strong><div class="case-swatches case-swatches--labeled">${study.paletteColors.map((color,index) => `<span class="case-swatch"><i style="background:${color}"></i><em>${study.paletteLabels?.[index] || color}</em></span>`).join('')}</div><p>${study.paletteWhy}</p></section>
      <section class="case-study-block"><strong>${t('case.typography')}</strong><p>${study.typography}</p></section>
      <section class="case-study-block"><strong>${t('case.composition')}</strong><p>${study.composition}</p></section>
      ${study.imageTreatment ? `<section class="case-study-block"><strong>${t('case.imageTreatment')}</strong><p>${study.imageTreatment}</p></section>` : ''}
      <section class="case-study-block"><strong>${t('case.elements')}</strong><ul>${study.elements.map(item => `<li>${item}</li>`).join('')}</ul></section>
      ${study.systemRule ? `<section class="case-study-block case-study-block--rule"><strong>${t('case.systemRule')}</strong><p>${study.systemRule}</p></section>` : ''}

      <div class="case-chapter-label">${t('case.chapter4')}</div>
      <section class="case-study-block"><strong>${t('case.copy')}</strong><p>${study.copyNotes}</p></section>
      <div class="case-study-note"><strong class="case-kicker">${t('case.rationale')}</strong><p>${study.rationale}</p></div>`;
  }

  function renderCase(project){
    if(!viewer || !caseHero || !caseInfo || !caseSlides) return;
    const currentIndex = socialProjects.findIndex(item => item.slug === project.slug);
    const next = adjacentProject(project.slug, 1);
    const meta = projectCopy(project);
    const nextMeta = projectCopy(next);
    caseTopLabel && (caseTopLabel.textContent = `${String(currentIndex+1).padStart(2,'0')} / ${String(socialProjects.length).padStart(2,'0')} — ${project.client}`);
    casePrev && (casePrev.textContent = t('case.prev'));
    caseNext && (caseNext.textContent = t('case.next'));
    closeCase && (closeCase.textContent = t('case.close'));
    caseHero.innerHTML = `
      <div class="case-hero__media"><img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="eager" fetchpriority="high" decoding="async"></div>
      <div class="case-hero__veil"></div>
      <div class="container case-hero__content">
        <div class="case-hero__eyebrow">${t('nav.social').toUpperCase()} / ${String(currentIndex+1).padStart(2,'0')} / ${String(socialProjects.length).padStart(2,'0')}</div>
        <h1 class="case-hero__title">${meta.title}</h1>
        <div class="case-hero__deck"><p>${meta.subtitle}</p><span>${project.slides.length} ${t('case.pieces')} / ${formatLabel(project.format)}</span></div>
      </div>`;
    caseInfo.innerHTML = buildCaseInfo(project);
    caseSlides.innerHTML = project.slides.map((src,index)=>`
      <figure class="reveal in">
        <div class="case-index"><span>${String(index+1).padStart(2,'0')} / ${String(project.slides.length).padStart(2,'0')}</span><span>${project.client}</span></div>
        <div class="case-slide-frame"><img src="${src}" alt="${project.client} — ${meta.title}, slide ${index+1}" loading="${index < 2 ? 'eager' : 'lazy'}" fetchpriority="${index === 0 ? 'high' : 'auto'}" decoding="async"></div>
      </figure>`).join('') + `
      <div class="case-end">
        <strong>${t('case.nextCase')}<br>${nextMeta.title}</strong>
        <button type="button" data-open-project="${next.slug}">${t('case.openNext')}</button>
      </div>`;
  }

  function openProject(slug, point){
    const project = bySlug(slug);
    if(!project || !viewer) return;
    const wasOpen = viewer.classList.contains('open');
    currentCaseSlug = project.slug;
    if(point){
      lastOpenPoint = {x:`${point.x}px`, y:`${point.y}px`};
      viewer.style.setProperty('--open-x', lastOpenPoint.x);
      viewer.style.setProperty('--open-y', lastOpenPoint.y);
    }
    renderCase(project);
    viewer.classList.remove('closing');
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
    body.classList.add('case-open');
    viewer.scrollTop = 0;
    if(wasOpen && !reduceMotion){
      viewer.animate([{opacity:.82},{opacity:1}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    requestAnimationFrame(updateCaseProgress);
  }

  function finishClose(){
    if(!viewer) return;
    viewer.classList.remove('open','closing');
    viewer.setAttribute('aria-hidden','true');
    body.classList.remove('case-open');
    currentCaseSlug = null;
  }

  function closeProject(){
    if(!viewer || !viewer.classList.contains('open')) return;
    if(reduceMotion){ finishClose(); return; }
    viewer.classList.add('closing');
    setTimeout(finishClose, 470);
  }

  function updateCaseProgress(){
    if(!viewer || !caseProgress) return;
    const total = Math.max(1, viewer.scrollHeight - viewer.clientHeight);
    caseProgress.style.transform = `scaleX(${Math.min(1,viewer.scrollTop/total)})`;
  }
  let v38CaseProgressRaf = 0;
  const scheduleCaseProgress = () => {
    if(v38CaseProgressRaf) return;
    v38CaseProgressRaf = requestAnimationFrame(() => {
      v38CaseProgressRaf = 0;
      updateCaseProgress();
    });
  };
  viewer?.addEventListener('scroll', scheduleCaseProgress, {passive:true});

  document.addEventListener('click', event => {
    const open = event.target.closest('[data-open-project]');
    if(open){
      event.preventDefault();
      openProject(open.dataset.openProject, {x:event.clientX || innerWidth/2, y:event.clientY || innerHeight/2});
    }
  });
  closeCase?.addEventListener('click', closeProject);
  casePrev?.addEventListener('click', () => currentCaseSlug && openProject(adjacentProject(currentCaseSlug,-1).slug));
  caseNext?.addEventListener('click', () => currentCaseSlug && openProject(adjacentProject(currentCaseSlug,1).slug));
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape') closeProject();
    if(viewer?.classList.contains('open') && event.key === 'ArrowRight' && currentCaseSlug) openProject(adjacentProject(currentCaseSlug,1).slug);
    if(viewer?.classList.contains('open') && event.key === 'ArrowLeft' && currentCaseSlug) openProject(adjacentProject(currentCaseSlug,-1).slug);
  });

  /* Home selected editorial index */
  const selectedMount = document.getElementById('selectedProjects');
  const selectedSlugs = ['voltara-operacoes','hardwork-thermo-plus','marina-gengival','belive-cashflow','hardwork-modo'];
  function renderSelectedProjects(){
    if(!selectedMount) return;
    const selected = selectedSlugs.map(bySlug).filter(Boolean);
    selectedMount.innerHTML = selected.map((project,index)=>{
      const meta = projectCopy(project);
      return `
      <article class="selected-index-row reveal" data-open-project="${project.slug}">
        <span class="selected-index-row__num">${String(index+1).padStart(2,'0')}</span>
        <span class="selected-index-row__client">${project.client}</span>
        <strong class="selected-index-row__title">${meta.title}</strong>
        <span class="selected-index-row__meta">${formatLabel(project.format)}</span>
        <div class="selected-index-row__preview"><img src="${project.cover}" alt="" loading="lazy" decoding="async"></div>
      </article>`;
    }).join('');
    registerRevealEls(selectedMount);
  }

  /* Social archive */
  const archiveMount = document.getElementById('archiveGrid');
  const listMount = document.getElementById('projectsList');
  const filtersMount = document.getElementById('archiveFilters');
  const nicheFiltersMount = document.getElementById('archiveNicheFilters');
  const nicheGridMount = document.getElementById('nicheGrid');
  const heroCategoryRail = document.getElementById('heroCategoryRail');
  const archiveFilterStatus = document.getElementById('archiveFilterStatus');
  const loopWall = document.getElementById('loopWall');
  const archiveState = { format:'all', niche:'all' };
  let loopRaf = null;
  let loopRowsState = [];

  function stopConveyorLoop(){
    if(loopRaf){ cancelAnimationFrame(loopRaf); loopRaf = null; }
  }

  function initConveyorLoop(){ stopConveyorLoop(); }

  const filterDefs = [
    { key:'all', labelKey:'filter.all' },
    { key:'carousel', labelKey:'filter.carousel' },
    { key:'campaign', labelKey:'filter.campaign' },
    { key:'product', labelKey:'filter.product' },
    { key:'system', labelKey:'filter.system' }
  ];

  function getActiveFormat(){ return archiveState.format; }
  function getActiveNiche(){ return archiveState.niche; }
  function getFilteredProjects(format=archiveState.format, niche=archiveState.niche){
    return socialProjects.filter(project => (format === 'all' || project.format === format) && (niche === 'all' || getIndustry(project) === niche));
  }
  function buildFilters(activeFilter=archiveState.format, activeNiche=archiveState.niche){
    if(filtersMount){
      const countFor = key => key === 'all' ? socialProjects.length : socialProjects.filter(project => project.format === key).length;
      filtersMount.innerHTML = filterDefs.map(item=>`<button class="archive-filter ${item.key===activeFilter?'active':''}" type="button" data-project-filter="${item.key}">${t(item.labelKey)} <span>${countFor(item.key)}</span></button>`).join('');
    }
    if(nicheFiltersMount){
      const countForNiche = key => key === 'all' ? socialProjects.length : socialProjects.filter(project => getIndustry(project) === key).length;
      nicheFiltersMount.innerHTML = industryDefs.map(item=>`<button class="archive-filter ${item.key===activeNiche?'active':''}" type="button" data-project-niche="${item.key}">${localizeIndustry(item.key)} <span>${countForNiche(item.key)}</span></button>`).join('');
    }
  }

  function renderHeroCategoryRail(){
    if(!heroCategoryRail) return;
    const entries = industryDefs.filter(item=>item.key!=='all').map(item=>{
      const count = socialProjects.filter(project => getIndustry(project) === item.key).length;
      return `<button class="social-cover-art__cat" type="button" data-project-niche="${item.key}" data-scroll-target="#archiveControls"><strong>${localizeIndustry(item.key)}</strong><em>${String(count).padStart(2,'0')}</em></button>`;
    });
    heroCategoryRail.innerHTML = entries.join('');
  }

  function renderNicheGrid(activeNiche='all'){
    if(!nicheGridMount) return;
    const entries = industryDefs.filter(item => item.key !== 'all').map((item,index) => {
      const count = socialProjects.filter(project => getIndustry(project) === item.key).length;
      const representative = bySlug(item.cover);
      return `<article class="niche-card ${activeNiche===item.key?'active':''}" data-project-niche="${item.key}" tabindex="0">
        <div class="niche-card__media">${representative ? `<img src="${representative.cover}" alt="" loading="lazy" decoding="async">` : ''}</div>
        <div class="niche-card__content">
          <span class="niche-card__num">${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}</span>
          <h3 class="niche-card__title">${localizeIndustry(item.key)}</h3>
          <p class="niche-card__desc">${localizeIndustryDesc(item.key)}</p>
          <div class="niche-card__meta"><span>${count} ${t('case.project')}</span><span>↘</span></div>
        </div>
      </article>`;
    });
    nicheGridMount.innerHTML = entries.join('');
  }

  function renderLoopWall(items){
    if(!loopWall) return;
    const rowIndexes = [
      [0,3,6,9,12,2],
      [1,4,7,10,0,5],
      [2,5,8,11,6,1]
    ];
    stopConveyorLoop();
    loopWall.innerHTML = rowIndexes.map((indexes,rowIndex)=>{
      const row = indexes.map(index => items[index % items.length]).filter(Boolean);
      const doubled = [...row,...row];
      return `<div class="loop-row ${rowIndex%2?'reverse':''}"><div class="loop-track">${doubled.map((project,itemIndex)=>{
        const meta = projectCopy(project);
        return `
        <article class="loop-card" data-open-project="${project.slug}" aria-label="${t('case.openAria')} ${project.client} — ${meta.title}">
          <img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="${itemIndex < 2 ? 'eager' : 'lazy'}" fetchpriority="${itemIndex === 0 ? 'high' : 'auto'}" decoding="async">
          <div class="loop-card__overlay">
            <span class="loop-card__eyebrow">${project.client}</span>
            <strong class="loop-card__title">${meta.title}</strong>
            <span class="loop-card__meta">${String((itemIndex%row.length)+1).padStart(2,'0')} / ${formatLabel(project.format)}</span>
            <button class="loop-card__button" type="button" data-open-project="${project.slug}">${t('case.full')}</button>
          </div>
        </article>`;
      }).join('')}</div></div>`;
    }).join('');
    initConveyorLoop();
  }

  function renderArchive(items){
    if(!archiveMount) return;
    const layouts = ['wide','tall','square','landscape','tall','wide','square','landscape','wide','tall','square','wide','landscape'];
    archiveMount.innerHTML = items.map((project,index)=>{
      const meta = projectCopy(project);
      return `
      <article class="archive-card ${layouts[index%layouts.length]} media-reveal" data-open-project="${project.slug}" data-industry="${getIndustry(project)}">
        <div class="archive-card__media"><img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="lazy" decoding="async"></div>
        <div class="archive-card__caption">
          <span>${String(index+1).padStart(2,'0')}</span>
          <div><strong>${project.client}</strong><small>${meta.title}</small></div>
          <em>${formatLabel(project.format)}</em>
        </div>
      </article>`;
    }).join('');
    registerRevealEls(archiveMount);
  }

  function renderProjectList(items){
    if(!listMount) return;
    listMount.innerHTML = items.map((project,index)=>{
      const meta = projectCopy(project);
      return `
      <article class="project-entry" id="${project.slug}" data-format="${project.format||'project'}" data-industry="${getIndustry(project)}">
        <div class="project-copy reveal">
          <div class="project-no">${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</div>
          <div class="project-client">${project.client}</div>
          <h2>${meta.title}</h2>
          <p class="project-subtitle">${meta.subtitle}</p>
          <p class="project-desc">${meta.description}</p>
          <div class="project-tags">${project.tags.map(tag=>`<span>${tagLabel(tag)}</span>`).join('')}</div>
          <button class="case-button" type="button" data-open-project="${project.slug}">${t('case.full')}</button>
        </div>
        <div class="project-cover media-reveal parallax-media" data-open-project="${project.slug}"><img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="lazy" decoding="async"></div>
      </article>`;
    }).join('');
    registerRevealEls(listMount);
  }

  function syncArchiveControls(){
    filtersMount?.querySelectorAll('[data-project-filter]').forEach(item => item.classList.toggle('active', item.dataset.projectFilter === archiveState.format));
    nicheFiltersMount?.querySelectorAll('[data-project-niche]').forEach(item => item.classList.toggle('active', item.dataset.projectNiche === archiveState.niche));
    nicheGridMount?.querySelectorAll('[data-project-niche]').forEach(item => item.classList.toggle('active', item.dataset.projectNiche === archiveState.niche));
  }

  function applyArchiveState(){
    const filtered = getFilteredProjects();
    renderArchive(filtered);
    listMount?.querySelectorAll('.project-entry').forEach(el => {
      const formatOk = archiveState.format === 'all' || el.dataset.format === archiveState.format;
      const nicheOk = archiveState.niche === 'all' || el.dataset.industry === archiveState.niche;
      el.classList.toggle('is-filtered-out', !(formatOk && nicheOk));
    });
    renderNicheGrid(archiveState.niche);
    syncArchiveControls();
    if(archiveFilterStatus){
      const label = filtered.length === 1 ? t('filter.resultSingular') : t('filter.resultPlural');
      archiveFilterStatus.textContent = `${String(filtered.length).padStart(2,'0')} ${label}`;
    }
  }

  function refreshLocalizedUI({revealTranslated=true}={}){
    applyStaticTranslations({revealTranslated});
    syncThemeLabel();
    renderSelectedProjects();
    buildFilters(archiveState.format, archiveState.niche);
    renderNicheGrid(archiveState.niche);
    renderLoopWall(socialProjects);
    renderProjectList(socialProjects);
    applyArchiveState();
    if(currentCaseSlug){
      const openCase = bySlug(currentCaseSlug);
      if(openCase) renderCase(openCase);
    }
  }

  function setLanguage(lang){
    if(!supportedLangs.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    storageSet('movx-lang', lang);
    refreshLocalizedUI({revealTranslated:true});
  }

  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));

  function setActiveNiche(niche){
    archiveState.niche = industryDefs.some(item => item.key === niche) ? niche : 'all';
    applyArchiveState();
  }
  function setActiveFormat(format){
    archiveState.format = filterDefs.some(item => item.key === format) ? format : 'all';
    applyArchiveState();
  }

  if(archiveMount || listMount || filtersMount || loopWall || selectedMount){
    refreshLocalizedUI({revealTranslated:false});
    filtersMount?.addEventListener('click', event => {
      const button = event.target.closest('[data-project-filter]');
      if(!button) return;
      setActiveFormat(button.dataset.projectFilter);
    });
    nicheFiltersMount?.addEventListener('click', event => {
      const button = event.target.closest('[data-project-niche]');
      if(!button) return;
      setActiveNiche(button.dataset.projectNiche);
    });
    nicheGridMount?.addEventListener('click', event => {
      const card = event.target.closest('[data-project-niche]');
      if(!card) return;
      setActiveNiche(card.dataset.projectNiche);
      document.getElementById('archiveControls')?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
    });
    nicheGridMount?.addEventListener('keydown', event => {
      const card = event.target.closest('[data-project-niche]');
      if(card && (event.key === 'Enter' || event.key === ' ')){
        event.preventDefault();
        setActiveNiche(card.dataset.projectNiche);
        document.getElementById('archiveControls')?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
      }
    });
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-scroll-target]');
      if(!trigger) return;
      const niche = trigger.dataset.projectNiche;
      if(niche) setActiveNiche(niche);
      const target = document.querySelector(trigger.dataset.scrollTarget);
      target?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
    });
  } else {
    applyStaticTranslations({revealTranslated:false});
    syncThemeLabel();
  }

  /* Contact brief builder */
  const contactForm = document.getElementById('contactForm');
  const contactCopy = document.getElementById('contactCopy');
  const contactMail = document.getElementById('contactMail');
  function buildContactBrief(){
    if(!contactForm) return '';
    const fd = new FormData(contactForm);
    const rows = [
      ['Name', fd.get('name') || '—'],
      ['Email', fd.get('email') || '—'],
      ['Project', fd.get('project') || '—'],
      ['Message', fd.get('message') || '—']
    ];
    return rows.map(([k,v]) => `${k}: ${v}`).join('\n');
  }
  contactCopy?.addEventListener('click', async () => {
    const text = buildContactBrief();
    try{ await navigator.clipboard.writeText(text); }catch{ const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove(); }
    const original=contactCopy.textContent; contactCopy.textContent=t('contact.copied');
    setTimeout(()=>contactCopy.textContent=original,1800);
  });
  contactMail?.addEventListener('click', () => {
    const subject=encodeURIComponent('MOVX — New project');
    const bodyText=encodeURIComponent(buildContactBrief());
    contactMail.href=`mailto:?subject=${subject}&body=${bodyText}`;
  });


  /* Unified single-page navigation */
  const unifiedNavLinks = [...document.querySelectorAll('.nav--editorial a[href^="#"], .mobile-menu a[href^="#"]')];
  unifiedNavLinks.forEach(link => link.addEventListener('click', () => {
    mobileMenu?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded','false');
  }));
  const navSections = ['livingArchive','about','services','contact'].map(id=>document.getElementById(id)).filter(Boolean);
  if(navSections.length && 'IntersectionObserver' in window){
    const spy = new IntersectionObserver(entries => {
      const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible) return;
      const id = visible.target.id;
      document.querySelectorAll('.nav--editorial a[href^="#"]').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('is-active', href === `#${id}` || (id === 'livingArchive' && href === '#livingArchive'));
      });
    }, {rootMargin:'-22% 0px -62% 0px',threshold:[0,.25,.5,.75]});
    navSections.forEach(section=>spy.observe(section));
  }

})();


/* MOVX v30 — premium editorial motion
   Native-only, additive, readable by construction. Text does not animate independently of its layout box. */
(() => {
  'use strict';

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduced = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const damping = (dt, speed) => 1 - Math.exp(-dt * speed);

  root.classList.add('movx-v28', 'movx-v30');
  root.dataset.movxMotion = 'v30-premium-editorial';

  if (reduced) {
    root.classList.add('movx-reduced-motion');
    return;
  }

  try {
    const heroStage = q('.social-cover-art__stage');
    const heroImage = heroStage && q('.social-cover-art__image', heroStage);
    let heroOverlay = q('.v28-hero-overlay', heroStage || document);

    // The supplied master is one image. Duplicating crops creates ghost text;
    // genuine separated layers can be added later through MOVX_MOTION_BRIDGE.

    const about = document.getElementById('about');
    const services = document.getElementById('services');
    const serviceRows = services
      ? qa('.service-row', services).map(row => ({ row, current: .78, target: .78, line: 0, lineTarget: 0 }))
      : [];
    const process = document.getElementById('process');
    const processList = process && q('.process-list', process);
    const processRows = processList
      ? qa('li', processList).map(row => ({ row, current: .76, target: .76, rule: .24, ruleTarget: .24 }))
      : [];
    const contact = document.getElementById('contact');

    const chapters = [
      document.getElementById('livingArchive'),
      document.getElementById('nicheIndex'),
      document.getElementById('archiveControls'),
      q('.projects-list'),
      about,
      services,
      process,
      contact
    ].filter(Boolean).map(section => ({ section, current: 0, target: 0 }));

    chapters.forEach(({ section }) => section.classList.add('v28-chapter'));

    /* Staged reveals: whole layout boxes move together, so copy cannot collide. */
    const revealTargets = [
      ...qa('.service-row'),
      ...qa('.process-list li'),
      ...qa('.about-heading, .about-copy, .about-signature'),
      ...qa('.contact-copy, .contact-form')
    ];

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('v30-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });

      revealTargets.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const stagger = Math.min(index % 5, 4) * 55;
        element.style.setProperty('--v30-delay', `${stagger}ms`);
        if (rect.top < innerHeight * .9) {
          element.classList.add('v30-in');
        } else {
          element.classList.add('v30-pending');
          observer.observe(element);
        }
      });
    }

    const target = {
      heroY: 0,
      heroScale: 1.012,
      typeY: 0,
      crtY: 0,
      lowerY: 0,
      pointerX: 0,
      pointerY: 0,
      aboutX: -26,
      aboutY: 34,
      signature: 0,
      contactX: 28,
      contactY: -18,
      contactScale: .975,
      process: 0
    };
    const current = { ...target };

    let raf = 0;
    let dirty = true;
    let lastTime = performance.now();

    const requestFrame = () => {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const setTargets = () => {
      if (heroStage && heroOverlay) {
        const rect = heroStage.getBoundingClientRect();
        const progress = clamp((-rect.top) / Math.max(1, rect.height));
        target.heroY = -progress * 16;
        target.heroScale = 1.012 + progress * .032;
        target.typeY = -progress * 8;
        target.crtY = -progress * 19;
        target.lowerY = -progress * 12;
      }

      if (about) {
        const rect = about.getBoundingClientRect();
        const progress = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
        target.aboutX = lerp(-28, 32, progress);
        target.aboutY = lerp(38, -32, progress);
        target.signature = clamp((progress - .16) / .58) * 100;
      }

      serviceRows.forEach(state => {
        const rect = state.row.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const focus = 1 - clamp(Math.abs(center - innerHeight * .56) / (innerHeight * .58));
        state.target = .76 + focus * .24;
        state.lineTarget = 18 + focus * 82;
      });

      if (processList && processRows.length) {
        const listRect = processList.getBoundingClientRect();
        target.process = clamp((innerHeight * .62 - listRect.top) / Math.max(1, listRect.height)) * 100;

        let bestIndex = 0;
        let bestFocus = -1;
        processRows.forEach((state, index) => {
          const rect = state.row.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const focus = 1 - clamp(Math.abs(center - innerHeight * .53) / (innerHeight * .56));
          state.target = .72 + focus * .28;
          state.ruleTarget = .24 + focus * .76;
          if (focus > bestFocus) {
            bestFocus = focus;
            bestIndex = index;
          }
        });

        processRows.forEach((state, index) => {
          state.row.classList.toggle('v30-current', index === bestIndex && bestFocus > .16);
        });
      }

      if (contact) {
        const rect = contact.getBoundingClientRect();
        const progress = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
        target.contactX = lerp(26, -22, progress);
        target.contactY = lerp(-18, 26, progress);
        target.contactScale = lerp(.975, 1.025, progress);
      }

      chapters.forEach(state => {
        const rect = state.section.getBoundingClientRect();
        state.target = clamp((innerHeight * .94 - rect.top) / Math.max(160, innerHeight * .52));
      });

      requestFrame();
    };

    const approach = (key, amount, tolerance = .025) => {
      const before = current[key];
      current[key] = lerp(before, target[key], amount);
      return Math.abs(current[key] - target[key]) > tolerance;
    };

    function frame(now) {
      const dt = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
      lastTime = now;
      raf = 0;

      const medium = damping(dt, 4.15);
      const slow = damping(dt, 2.9);
      let unsettled = dirty;
      dirty = false;

      ['heroY','heroScale','typeY','crtY','lowerY','pointerX','pointerY'].forEach(key => {
        if (approach(key, medium)) unsettled = true;
      });
      ['aboutX','aboutY','signature','contactX','contactY','contactScale','process'].forEach(key => {
        if (approach(key, slow)) unsettled = true;
      });

      if (heroStage && heroOverlay) {
        heroStage.style.setProperty('--v28-hero-x', `${(current.pointerX * .46).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-hero-y', `${(current.heroY + current.pointerY * .22).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-hero-scale', current.heroScale.toFixed(4));
        heroStage.style.setProperty('--v28-type-x', `${(-current.pointerX * .24).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-x', `${(current.pointerX * .48).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-x', `${(current.pointerX * .30).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-type-y', `${(current.typeY - current.pointerY * .12).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-y', `${(current.crtY + current.pointerY * .27).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-y', `${(current.lowerY + current.pointerY * .17).toFixed(2)}px`);
      }

      if (about) {
        about.style.setProperty('--v28-about-x', `${current.aboutX.toFixed(2)}px`);
        about.style.setProperty('--v28-about-y', `${current.aboutY.toFixed(2)}px`);
        about.style.setProperty('--v28-signature', `${current.signature.toFixed(1)}%`);
      }

      serviceRows.forEach(state => {
        state.current = lerp(state.current, state.target, slow);
        state.line = lerp(state.line, state.lineTarget, slow);
        state.row.style.setProperty('--v30-service-opacity', state.current.toFixed(3));
        state.row.style.setProperty('--v28-service-line', `${state.line.toFixed(1)}%`);
        if (Math.abs(state.current - state.target) > .006 || Math.abs(state.line - state.lineTarget) > .12) unsettled = true;
      });

      if (processList) {
        processList.style.setProperty('--v28-process', `${current.process.toFixed(2)}%`);
        processRows.forEach(state => {
          state.current = lerp(state.current, state.target, slow);
          state.rule = lerp(state.rule, state.ruleTarget, slow);
          state.row.style.setProperty('--v30-process-opacity', state.current.toFixed(3));
          state.row.style.setProperty('--v30-process-rule', state.rule.toFixed(3));
          if (Math.abs(state.current - state.target) > .006 || Math.abs(state.rule - state.ruleTarget) > .006) unsettled = true;
        });
      }

      if (contact) {
        contact.style.setProperty('--v28-contact-x', `${current.contactX.toFixed(1)}px`);
        contact.style.setProperty('--v28-contact-y', `${current.contactY.toFixed(1)}px`);
        contact.style.setProperty('--v28-contact-scale', current.contactScale.toFixed(4));
      }

      chapters.forEach(state => {
        state.current = lerp(state.current, state.target, slow);
        state.section.style.setProperty('--v28-rule', state.current.toFixed(4));
        if (Math.abs(state.current - state.target) > .006) unsettled = true;
      });

      if (unsettled && !raf) raf = requestAnimationFrame(frame);
    }

    if (heroStage && finePointer) {
      heroStage.addEventListener('pointermove', event => {
        const rect = heroStage.getBoundingClientRect();
        target.pointerX = (clamp((event.clientX - rect.left) / Math.max(1, rect.width)) - .5) * 9;
        target.pointerY = (clamp((event.clientY - rect.top) / Math.max(1, rect.height)) - .5) * 7;
        requestFrame();
      }, { passive: true });

      heroStage.addEventListener('pointerleave', () => {
        target.pointerX = 0;
        target.pointerY = 0;
        requestFrame();
      }, { passive: true });
    }

    let v38TargetsRaf = 0;
    const scheduleTargets = () => {
      if (v38TargetsRaf) return;
      v38TargetsRaf = requestAnimationFrame(() => {
        v38TargetsRaf = 0;
        setTargets();
      });
    };
    addEventListener('scroll', scheduleTargets, { passive: true });
    addEventListener('resize', scheduleTargets, { passive: true });
    addEventListener('load', scheduleTargets, { once: true });
    setTargets();

    const themeToggle = q('[data-theme-toggle]');
    themeToggle?.addEventListener('click', () => {
      themeToggle.classList.remove('v28-theme-pop');
      void themeToggle.offsetWidth;
      themeToggle.classList.add('v28-theme-pop');
      setTimeout(() => themeToggle.classList.remove('v28-theme-pop'), 720);
    });
  } catch (error) {
    console.warn('MOVX v30 motion failed open:', error);
  }
})();


/* MOVX v31 — exhibition-grade interaction runtime
   Adds navigation state, restrained image response and editorial case entrances.
   Additive + fail-open: no content depends on this script to remain visible. */
(() => {
  'use strict';

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduced = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  root.classList.add('movx-v31');
  root.dataset.movxExhibition = 'v31';

  try {
    /* -------------------------------------------------------
       1) Navigation follows the chapter currently being read.
       ------------------------------------------------------- */
    const navLinks = qa('header a[href^="#"], .site-header a[href^="#"]')
      .filter(link => {
        const href = link.getAttribute('href');
        return href && href.length > 1 && document.querySelector(href);
      });

    const navTargets = navLinks.map(link => ({
      link,
      target: document.querySelector(link.getAttribute('href'))
    }));

    const setCurrentNav = currentTarget => {
      navTargets.forEach(({ link, target }) => {
        const active = target === currentTarget;
        link.classList.toggle('v31-nav-current', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    if (navTargets.length && 'IntersectionObserver' in window) {
      let visible = new Map();
      const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
          else visible.delete(entry.target);
        });

        if (!visible.size) return;
        let best = null;
        let bestScore = -1;
        visible.forEach((ratio, target) => {
          const rect = target.getBoundingClientRect();
          const centerDistance = Math.abs((rect.top + rect.height / 2) - innerHeight * .48);
          const score = ratio * 2 - centerDistance / Math.max(innerHeight, 1);
          if (score > bestScore) {
            bestScore = score;
            best = target;
          }
        });
        if (best) setCurrentNav(best);
      }, { threshold: [0.08,0.2,0.35,0.55], rootMargin: '-12% 0px -42% 0px' });

      [...new Set(navTargets.map(item => item.target))].forEach(target => navObserver.observe(target));
    }

    /* -------------------------------------------------------
       2) Artwork reacts on the image plane only.
       Card boxes never tilt, jump or collide with surrounding copy.
       ------------------------------------------------------- */
    if (!reduced && finePointer) {
      const mediaCards = qa('.loop-card, .archive-card, .niche-card, .project-cover');
      mediaCards.forEach(card => {
        const image = q('img', card);
        if (!image) return;
        card.classList.add('v31-media-interactive');

        let raf = 0;
        let targetX = 0;
        let targetY = 0;

        const paint = () => {
          raf = 0;
          card.style.setProperty('--v31-media-x', `${targetX.toFixed(2)}px`);
          card.style.setProperty('--v31-media-y', `${targetY.toFixed(2)}px`);
        };

        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = clamp((event.clientX - rect.left) / rect.width);
          const y = clamp((event.clientY - rect.top) / rect.height);
          targetX = (x - .5) * 5.5;
          targetY = (y - .5) * 4.2;
          if (!raf) raf = requestAnimationFrame(paint);
        }, { passive:true });

        card.addEventListener('pointerleave', () => {
          targetX = 0;
          targetY = 0;
          card.style.setProperty('--v31-media-x', '0px');
          card.style.setProperty('--v31-media-y', '0px');
        }, { passive:true });
      });
    }

    /* -------------------------------------------------------
       3) Selected-project preview cross-fades when content swaps.
       ------------------------------------------------------- */
    const preview = q('.selected-index-row__preview');
    if (preview && !reduced && 'MutationObserver' in window) {
      let previewTimer = 0;
      const softenPreviewSwap = () => {
        preview.style.setProperty('--v31-preview-opacity', '.38');
        preview.style.setProperty('--v31-preview-y', '5px');
        preview.style.setProperty('--v31-preview-scale', '.994');
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
          requestAnimationFrame(() => {
            preview.style.setProperty('--v31-preview-opacity', '1');
            preview.style.setProperty('--v31-preview-y', '0px');
            preview.style.setProperty('--v31-preview-scale', '1');
          });
        }, 54);
      };
      new MutationObserver(softenPreviewSwap).observe(preview, {
        subtree:true,
        childList:true,
        attributes:true,
        attributeFilter:['src','class']
      });
    }

    /* -------------------------------------------------------
       4) Case studies open like editorial features.
       ------------------------------------------------------- */
    const viewer = q('.case-viewer');
    let slideObserver = null;

    const clearSlideObserver = () => {
      if (slideObserver) slideObserver.disconnect();
      slideObserver = null;
    };

    const setupSlides = () => {
      clearSlideObserver();
      const frames = qa('.case-slide-frame', viewer || document);
      if (!frames.length || reduced || !('IntersectionObserver' in window)) {
        frames.forEach(frame => frame.classList.add('v31-slide-in'));
        return;
      }

      slideObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('v31-slide-pending');
          entry.target.classList.add('v31-slide-in');
          slideObserver.unobserve(entry.target);
        });
      }, { threshold:.08, rootMargin:'0px 0px -4% 0px' });

      frames.forEach((frame, index) => {
        frame.classList.remove('v31-slide-in','v31-slide-pending');
        const rect = frame.getBoundingClientRect();
        if (rect.top < innerHeight * .96 && index < 2) {
          frame.classList.add('v31-slide-in');
        } else {
          frame.classList.add('v31-slide-pending');
          slideObserver.observe(frame);
        }
      });
    };

    const animateViewerOpen = () => {
      if (!viewer || reduced) return;
      viewer.classList.remove('v31-case-visible');
      viewer.classList.add('v31-case-animating');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        viewer.classList.add('v31-case-visible');
        setupSlides();
      }));
    };

    const resetViewer = () => {
      if (!viewer) return;
      clearSlideObserver();
      viewer.classList.remove('v31-case-visible','v31-case-animating');
      qa('.case-slide-frame', viewer).forEach(frame => frame.classList.remove('v31-slide-in','v31-slide-pending'));
    };

    if (viewer && 'MutationObserver' in window) {
      let wasOpen = viewer.classList.contains('open');
      if (wasOpen) animateViewerOpen();

      new MutationObserver(() => {
        const isOpen = viewer.classList.contains('open');
        const isClosing = viewer.classList.contains('closing');
        if (isOpen && !wasOpen) animateViewerOpen();
        if (!isOpen && !isClosing && wasOpen) resetViewer();
        wasOpen = isOpen;
      }).observe(viewer, { attributes:true, attributeFilter:['class'] });
    }

    /* -------------------------------------------------------
       5) Keyboard users receive the same image emphasis as hover.
       ------------------------------------------------------- */
    qa('.loop-card, .archive-card, .niche-card, .project-cover').forEach(card => {
      card.addEventListener('focusin', () => card.classList.add('v31-key-focus'));
      card.addEventListener('focusout', () => card.classList.remove('v31-key-focus'));
    });

  } catch (error) {
    console.warn('MOVX v31 enhancement failed open:', error);
  }
})();


/* MOVX v32 — editorial architecture runtime
   Adds authored chapter markers, generated-list numbering and slow section presence.
   Additive and fail-open: all content stays visible without JavaScript. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

  root.classList.add('movx-v32');
  root.dataset.movxArchitecture = 'v32-editorial';

  try {
    /* -------------------------------------------------------
       1) Editorial chapter labels. Kept outside the content flow
          on desktop, but collapse into the flow on small screens.
       ------------------------------------------------------- */
    const chapters = [
      { node: document.getElementById('livingArchive'), index: '01', label: 'Arquivo vivo' },
      { node: document.getElementById('nicheIndex'), index: '02', label: 'Territórios' },
      { node: document.getElementById('archiveControls'), index: '03', label: 'Arquivo' },
      { node: document.getElementById('projectsList') || q('.projects-list'), index: '04', label: 'Selecionados' },
      { node: document.getElementById('about') || q('.about-section'), index: '05', label: 'Sobre' },
      { node: document.getElementById('services') || q('.services-section'), index: '06', label: 'Serviços' },
      { node: document.getElementById('process') || q('.process-section'), index: '07', label: 'Processo' },
      { node: document.getElementById('contact') || q('.contact-section'), index: '08', label: 'Contato' }
    ].filter(item => item.node);

    chapters.forEach(({ node, index, label }) => {
      node.dataset.v32Index = index;
      node.dataset.v32Label = label;
    });

    if ('IntersectionObserver' in window && !reduced) {
      const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('v32-section-live');
        });
      }, { threshold: .08, rootMargin: '0px 0px -12% 0px' });
      chapters.forEach(({ node }) => sectionObserver.observe(node));
    } else {
      chapters.forEach(({ node }) => node.classList.add('v32-section-live'));
    }

    /* -------------------------------------------------------
       2) Number generated selected-work rows after every render.
          MutationObserver is used because the archive is data-driven.
       ------------------------------------------------------- */
    const projectHost = document.getElementById('projectsList') || q('.projects-list');
    const numberRows = () => {
      if (!projectHost) return;
      qa('.selected-index-row', projectHost).forEach((row, index) => {
        row.dataset.v32Order = String(index + 1).padStart(2, '0');
      });
    };

    numberRows();
    if (projectHost && 'MutationObserver' in window) {
      let scheduled = false;
      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          numberRows();
        });
      });
      observer.observe(projectHost, { childList:true, subtree:true });
    }

    /* -------------------------------------------------------
       3) Make grid rerenders settle as one composition instead
          of each card snapping independently.
       ------------------------------------------------------- */
    const gridHosts = [document.getElementById('nicheGrid'), document.getElementById('archiveGrid')].filter(Boolean);
    const settleGrid = host => {
      if (reduced) return;
      host.classList.remove('v32-grid-settled');
      requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('v32-grid-settled')));
    };

    gridHosts.forEach(host => {
      settleGrid(host);
      if (!('MutationObserver' in window)) return;
      let timer = 0;
      new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => settleGrid(host), 36);
      }).observe(host, { childList:true });
    });

    /* -------------------------------------------------------
       4) Stronger authored rhythm for filters: keyboard focus and
          pointer interaction both keep one current control visible.
          We do not override the app's filtering logic.
       ------------------------------------------------------- */
    const filterHost = document.getElementById('archiveControls');
    if (filterHost) {
      qa('button', filterHost).forEach(button => {
        button.addEventListener('focusin', () => button.classList.add('v32-filter-focus'));
        button.addEventListener('focusout', () => button.classList.remove('v32-filter-focus'));
      });
    }

  } catch (error) {
    console.warn('MOVX v32 architecture failed open:', error);
  }
})();


/* MOVX v33 — authored case-study runtime
   Reorganises already-existing case content into editorial spreads without changing project facts.
   It derives everything from MOVX_PROJECTS + the rendered case study, so language changes remain supported. */
(() => {
  'use strict';

  const root = document.documentElement;
  const viewer = document.getElementById('caseViewer');
  const caseHero = document.getElementById('caseHero');
  const caseInfo = document.getElementById('caseInfo');
  const caseSlides = document.getElementById('caseSlides');
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

  root.classList.add('movx-v33');
  root.dataset.movxCaseArchitecture = 'v33-editorial-case';

  if (!viewer || !caseHero || !caseInfo || !caseSlides) return;

  const normalizeSrc = value => {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return decodeURIComponent(url.pathname.replace(/^.*?\/assets\//,'assets/'));
    } catch {
      return String(value).split('?')[0].replace(/^\.\//,'');
    }
  };

  const detectProject = () => {
    const image = q('.case-hero__media img', caseHero);
    const src = normalizeSrc(image?.getAttribute('src') || image?.currentSrc || '');
    if (!src) return null;
    return projects.find(project => {
      const cover = normalizeSrc(project.cover);
      return src === cover || src.endsWith(cover) || cover.endsWith(src);
    }) || null;
  };

  let revealObserver = null;
  const setupEditorialReveal = () => {
    revealObserver?.disconnect();
    revealObserver = null;
    const targets = [
      q('.v33-case-intro', caseInfo),
      ...qa('.v33-case-chapter', caseInfo),
      q('.case-study-note', caseInfo)
    ].filter(Boolean);

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(node => node.classList.add('v33-editorial-in'));
      return;
    }

    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('v33-editorial-pending');
        entry.target.classList.add('v33-editorial-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold:.07, root:viewer, rootMargin:'0px 0px -6% 0px' });

    targets.forEach((node,index) => {
      const rect = node.getBoundingClientRect();
      if (index === 0 || rect.top < innerHeight * .92) node.classList.add('v33-editorial-in');
      else {
        node.classList.add('v33-editorial-pending');
        revealObserver.observe(node);
      }
    });
  };

  const wrapCaseInfo = () => {
    if (q('.v33-case-intro', caseInfo)) return;

    const introSelectors = ['.case-kicker','h2','.case-lead','.case-description','.project-tags','.case-facts'];
    const introNodes = introSelectors.map(selector => q(selector, caseInfo)).filter(Boolean);
    if (introNodes.length) {
      const intro = document.createElement('div');
      intro.className = 'v33-case-intro';
      caseInfo.insertBefore(intro, caseInfo.firstChild);
      introNodes.forEach(node => intro.appendChild(node));
    }

    const chaptersHost = document.createElement('div');
    chaptersHost.className = 'v33-case-chapters';
    const note = q('.case-study-note', caseInfo);
    if (note) caseInfo.insertBefore(chaptersHost, note);
    else caseInfo.appendChild(chaptersHost);

    const labels = qa(':scope > .case-chapter-label', caseInfo);
    labels.forEach((label,index) => {
      const chapter = document.createElement('section');
      chapter.className = 'v33-case-chapter';
      chapter.dataset.v33Chapter = String(index + 1).padStart(2,'0');
      label.dataset.v33Chapter = chapter.dataset.v33Chapter;

      const body = document.createElement('div');
      body.className = 'v33-chapter-body';

      let node = label.nextElementSibling;
      const movers = [];
      while (node && !node.classList.contains('case-chapter-label') && !node.classList.contains('case-study-note')) {
        movers.push(node);
        node = node.nextElementSibling;
      }

      chapter.appendChild(label);
      movers.forEach(item => body.appendChild(item));
      chapter.appendChild(body);
      chaptersHost.appendChild(chapter);
    });
  };

  const enhanceSlides = project => {
    qa(':scope > figure', caseSlides).forEach((figure,index) => {
      figure.dataset.v33Slide = String(index + 1).padStart(2,'0');
      figure.dataset.v33Role = index === 0 ? 'opener' : (index === project.slides.length - 1 ? 'closer' : 'sequence');
    });

    const end = q('.case-end', caseSlides);
    if (!end) return;
    const nextButton = q('[data-open-project]', end);
    const nextSlug = nextButton?.getAttribute('data-open-project');
    const next = projects.find(item => item.slug === nextSlug);
    if (!next || q('.v33-next-preview', end)) return;

    const preview = document.createElement('div');
    preview.className = 'v33-next-preview';
    preview.setAttribute('aria-hidden','true');
    const img = document.createElement('img');
    img.src = next.cover;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    preview.appendChild(img);
    end.insertBefore(preview, end.firstChild);
  };

  const enhance = () => {
    const project = detectProject();
    if (!project) return;

    viewer.dataset.v33Slug = project.slug;
    viewer.dataset.v33Layout = ['campaign','product','system'].includes(project.format) ? project.format : 'carousel';
    const index = Math.max(0, projects.findIndex(item => item.slug === project.slug));
    viewer.dataset.v33Side = index % 2 === 0 ? 'right' : 'left';
    viewer.dataset.v33Industry = project.industry || '';
    viewer.style.setProperty('--v33-accent', project.accent || 'var(--editorial-red,#9c2e24)');
    caseHero.style.setProperty('--v33-accent-x', viewer.dataset.v33Side === 'right' ? '82%' : '18%');

    wrapCaseInfo();
    enhanceSlides(project);
    setupEditorialReveal();
  };

  let scheduled = false;
  const scheduleEnhance = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try { enhance(); }
      catch (error) { console.warn('MOVX v33 case enhancement failed open:', error); }
    });
  };

  const contentObserver = new MutationObserver(scheduleEnhance);
  [caseHero,caseInfo,caseSlides].forEach(node => contentObserver.observe(node,{childList:true,subtree:false}));

  const stateObserver = new MutationObserver(() => {
    if (viewer.classList.contains('open')) scheduleEnhance();
    else revealObserver?.disconnect();
  });
  stateObserver.observe(viewer,{attributes:true,attributeFilter:['class']});

  if (viewer.classList.contains('open')) scheduleEnhance();
})();


/* MOVX v34 — quiet frame / loud work runtime
   Project-led accents + deliberate prewarming for faster case-study opening.
   Additive and fail-open: no content depends on this layer. */
(() => {
  'use strict';

  const root = document.documentElement;
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('movx-v34');
  root.dataset.movxQuietFrame = 'v34';

  if (!projects.length) return;

  const projectBySlug = new Map(projects.map(project => [project.slug, project]));
  const warmed = new Set();

  const formatName = format => ({
    carousel:'Carousel',
    campaign:'Campaign',
    product:'Product',
    system:'Visual system'
  }[format] || String(format || 'Project'));

  const findProjectNode = node => node?.closest?.('[data-open-project]') || null;

  const decorateProjectNodes = context => {
    qa('[data-open-project]', context).forEach(node => {
      const slug = node.getAttribute('data-open-project');
      const project = projectBySlug.get(slug);
      if (!project) return;
      node.style.setProperty('--v34-project-accent', project.accent || 'var(--editorial-red,#9c2e24)');
      node.dataset.v34Format = formatName(project.format);
      node.dataset.v34Project = project.slug;

      const preview = q('.selected-index-row__preview', node);
      if (preview) preview.dataset.v34Format = formatName(project.format);
    });
  };

  const warmImage = src => {
    if (!src || warmed.has(src)) return;
    warmed.add(src);
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    if (image.decode) image.decode().catch(() => {});
  };

  const prewarmProject = project => {
    if (!project) return;
    warmImage(project.cover);
    const slides = Array.isArray(project.slides) ? project.slides : [];
    slides.slice(0,3).forEach(warmImage);
  };

  try {
    decorateProjectNodes(document);

    /* Generated archives rerender after filters / locale changes. */
    const dynamicHosts = [
      document.getElementById('loopWall'),
      document.getElementById('archiveGrid'),
      document.getElementById('projectsList')
    ].filter(Boolean);

    if ('MutationObserver' in window) {
      dynamicHosts.forEach(host => {
        let scheduled = false;
        new MutationObserver(() => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            decorateProjectNodes(host);
          });
        }).observe(host, { childList:true, subtree:true });
      });
    }

    /* Warm only on intent, not on page load. Keeps initial network quiet. */
    const intentHandler = event => {
      const node = findProjectNode(event.target);
      if (!node) return;
      const project = projectBySlug.get(node.getAttribute('data-open-project'));
      prewarmProject(project);
    };

    document.addEventListener('pointerover', intentHandler, { passive:true, capture:true });
    document.addEventListener('focusin', intentHandler, true);
    document.addEventListener('pointerdown', intentHandler, { passive:true, capture:true });

    /* Selected-work previews get only a tiny damped vertical response. */
    if (!reduced && matchMedia('(pointer:fine)').matches) {
      let activeRow = null;
      let target = 0;
      let current = 0;
      let raf = 0;

      const tick = () => {
        raf = 0;
        current += (target - current) * .12;
        if (activeRow) {
          const preview = q('.selected-index-row__preview', activeRow);
          if (preview) preview.style.setProperty('--v34-preview-y', `${current.toFixed(2)}px`);
        }
        if (Math.abs(target-current) > .05) raf = requestAnimationFrame(tick);
      };

      qa('#projectsList .selected-index-row').forEach(row => {
        row.addEventListener('pointerenter', () => {
          activeRow = row;
          target = 0;
          current = 0;
        }, { passive:true });
        row.addEventListener('pointermove', event => {
          const rect = row.getBoundingClientRect();
          if (!rect.height) return;
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
          target = (y - .5) * 8;
          if (!raf) raf = requestAnimationFrame(tick);
        }, { passive:true });
        row.addEventListener('pointerleave', () => {
          target = 0;
          if (!raf) raf = requestAnimationFrame(tick);
          activeRow = null;
        }, { passive:true });
      });
    }

  } catch (error) {
    console.warn('MOVX v34 quiet-frame enhancement failed open:', error);
  }
})();


/* MOVX v35 — narrative chapter runtime
   Keeps section state continuous and readable. Text is never animated independently. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

  root.classList.add('movx-v35');
  root.dataset.movxNarrative = 'v35-chapters';

  try {
    const sections = qa('[data-v32-label]').filter(node => node instanceof HTMLElement);
    if (!sections.length) return;

    const status = document.createElement('div');
    status.className = 'v35-chapter-status';
    status.setAttribute('aria-hidden', 'true');
    status.innerHTML = '<b>01</b><i></i><span>Arquivo vivo</span>';
    document.body.appendChild(status);
    const statusIndex = q('b', status);
    const statusLabel = q('span', status);

    let current = null;
    const setCurrent = node => {
      if (!node) return;
      if (current !== node) {
        current?.classList.remove('v35-current');
        current = node;
        current.classList.add('v35-current');
        statusIndex.textContent = current.dataset.v32Index || '';
        statusLabel.textContent = current.dataset.v32Label || '';
        root.dataset.v35Chapter = current.dataset.v32Index || '';
      }
      const firstTop = sections[0]?.getBoundingClientRect().top ?? 0;
      const pastHero = firstTop <= innerHeight * .58;
      status.classList.toggle('is-visible', pastHero && current.id !== 'contact');
    };

    if (!reduced && 'IntersectionObserver' in window) {
      const enteredObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('v35-chapter-entered');
          enteredObserver.unobserve(entry.target);
        });
      }, { threshold:.04, rootMargin:'0px 0px -6% 0px' });
      sections.forEach(section => enteredObserver.observe(section));
    } else {
      sections.forEach(section => section.classList.add('v35-chapter-entered'));
    }

    const updateCurrent = () => {
      const readingLine = innerHeight * .42;
      let winner = sections[0];
      let best = Infinity;
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const contains = rect.top <= readingLine && rect.bottom >= readingLine;
        if (contains) {
          winner = section;
          best = 0;
          return;
        }
        if (best === 0) return;
        const distance = Math.min(Math.abs(rect.top - readingLine), Math.abs(rect.bottom - readingLine));
        if (distance < best) { best = distance; winner = section; }
      });
      setCurrent(winner);
    };

    let chapterRaf = 0;
    const scheduleCurrent = () => {
      if (chapterRaf) return;
      chapterRaf = requestAnimationFrame(() => {
        chapterRaf = 0;
        updateCurrent();
      });
    };
    addEventListener('scroll', scheduleCurrent, { passive:true });
    addEventListener('resize', scheduleCurrent, { passive:true });
    updateCurrent();

    const processRows = qa('#process .process-list li');
    if (processRows.length) {
      const setProcess = active => processRows.forEach(row => row.classList.toggle('v35-process-active', row === active));
      setProcess(processRows[0]);

      if (!reduced && 'IntersectionObserver' in window) {
        const processObserver = new IntersectionObserver(entries => {
          const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a,b) => Math.abs(a.boundingClientRect.top - innerHeight*.46) - Math.abs(b.boundingClientRect.top - innerHeight*.46));
          if (visible[0]) setProcess(visible[0].target);
        }, { threshold:[.18,.42,.7], rootMargin:'-26% 0px -30% 0px' });
        processRows.forEach(row => processObserver.observe(row));
      } else {
        processRows.forEach(row => row.classList.add('v35-process-active'));
      }
    }

    qa('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || !href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (!target || reduced) return;
        event.preventDefault();
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        try { history.replaceState(null,'',href); } catch {}
      });
    });

  } catch (error) {
    console.warn('MOVX v35 narrative enhancement failed open:', error);
  }
})();


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

/* MOVX v38 — selected cases / interaction QA runtime
   Adds semantic keyboard access, case-dialog focus management, project accents,
   near-viewport media decoding and composition-level filter settling. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const bySlug = new Map(projects.map(project => [project.slug, project]));
  const projectList = document.getElementById('projectsList');
  const archiveGrid = document.getElementById('archiveGrid');
  const viewer = document.getElementById('caseViewer');
  const closeButton = document.getElementById('caseClose');
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

  root.classList.add('movx-v38');
  root.dataset.movxSelectedCases = 'v38-editorial-focus';

  try {
    const decorateEntries = context => {
      if (!context) return;

      qa('.project-entry', context).forEach(entry => {
        const trigger = q('[data-open-project]', entry);
        const slug = trigger?.getAttribute('data-open-project');
        const project = bySlug.get(slug);
        if (project) {
          entry.dataset.v38Project = slug;
          entry.style.setProperty('--v38-accent', project.accent || 'var(--editorial-red,#9c2e24)');
        }
      });

      qa('.archive-card[data-open-project], .selected-index-row[data-open-project], .project-cover[data-open-project]', context).forEach(node => {
        if (node.matches('button,a,input,select,textarea')) return;
        node.setAttribute('role','button');
        node.setAttribute('tabindex','0');
        node.dataset.v38KeyboardProject = 'true';
        const slug = node.getAttribute('data-open-project');
        const project = bySlug.get(slug);
        const imageAlt = q('img', node)?.getAttribute('alt');
        if (!node.hasAttribute('aria-label')) {
          node.setAttribute('aria-label', imageAlt || project?.client || 'Abrir projeto');
        }
      });
    };

    decorateEntries(document);

    if ('MutationObserver' in window) {
      [projectList, archiveGrid].filter(Boolean).forEach(host => {
        let scheduled = false;
        new MutationObserver(() => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            decorateEntries(host);
          });
        }).observe(host, { childList:true, subtree:true });
      });
    }

    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target?.closest?.('[data-v38-keyboard-project="true"]');
      if (!target) return;
      if (event.target.closest('button,a,input,select,textarea') && event.target !== target) return;
      event.preventDefault();
      target.click();
    });

    /* Decode project covers just before they are likely to enter the viewport. */
    const prepareMedia = node => {
      const img = q('img', node);
      if (!img || img.dataset.v38Prepared === 'true') return;
      img.dataset.v38Prepared = 'true';
      if (img.getAttribute('fetchpriority') === 'low') img.setAttribute('fetchpriority','auto');
      if (img.decode) img.decode().catch(() => {});
    };

    if ('IntersectionObserver' in window && !reduced) {
      const mediaObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          prepareMedia(entry.target);
          mediaObserver.unobserve(entry.target);
        });
      }, { threshold:0, rootMargin:'900px 0px' });
      qa('#projectsList .project-cover, #archiveGrid .archive-card').forEach(node => mediaObserver.observe(node));
    } else {
      qa('#projectsList .project-cover, #archiveGrid .archive-card').forEach(prepareMedia);
    }

    /* Project-list filtering changes classes rather than children. Settle the whole
       chapter once instead of animating every entry independently. */
    if (projectList && 'MutationObserver' in window) {
      let timer = 0;
      new MutationObserver(mutations => {
        const entryChanged = mutations.some(m =>
          m.type === 'attributes' &&
          m.attributeName === 'class' &&
          m.target instanceof Element &&
          m.target.classList.contains('project-entry')
        );
        if (!entryChanged) return;
        projectList.classList.add('v38-list-updating');
        clearTimeout(timer);
        timer = setTimeout(() => projectList.classList.remove('v38-list-updating'), 150);
      }).observe(projectList, { subtree:true, attributes:true, attributeFilter:['class'] });
    }

    /* Case viewer behaves like a real dialog and returns focus to its opener. */
    let lastOpener = null;
    let wasOpen = viewer?.classList.contains('open') || false;

    document.addEventListener('pointerdown', event => {
      const opener = event.target?.closest?.('[data-open-project]');
      if (opener && !viewer?.contains(opener)) lastOpener = opener;
    }, { capture:true, passive:true });
    document.addEventListener('focusin', event => {
      const opener = event.target?.closest?.('[data-open-project]');
      if (opener && !viewer?.contains(opener)) lastOpener = opener;
    }, true);

    if (viewer) {
      viewer.setAttribute('role','dialog');
      viewer.setAttribute('aria-modal','true');
      viewer.setAttribute('tabindex','-1');

      const focusables = () => qa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', viewer)
        .filter(node => !node.disabled && node.getClientRects().length);

      viewer.addEventListener('keydown', event => {
        if (event.key !== 'Tab' || !viewer.classList.contains('open')) return;
        const nodes = focusables();
        if (!nodes.length) { event.preventDefault(); viewer.focus({preventScroll:true}); return; }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus({preventScroll:true});
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus({preventScroll:true});
        }
      });

      if ('MutationObserver' in window) {
        new MutationObserver(() => {
          const isOpen = viewer.classList.contains('open');
          if (isOpen && !wasOpen) {
            requestAnimationFrame(() => requestAnimationFrame(() => {
              (closeButton || viewer).focus({preventScroll:true});
            }));
          }
          if (!isOpen && wasOpen && lastOpener?.isConnected) {
            requestAnimationFrame(() => lastOpener.focus?.({preventScroll:true}));
          }
          wasOpen = isOpen;
        }).observe(viewer, { attributes:true, attributeFilter:['class'] });
      }
    }

  } catch (error) {
    console.warn('MOVX v38 selected-case enhancement failed open:', error);
  }
})();


/* MOVX v39 — perceptible parallax + 3D scroll runtime
   One rAF scheduler, viewport-gated media, no text transforms. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const signedViewportDistance = rect => clamp(((rect.top + rect.height * .5) - innerHeight * .5) / Math.max(1, innerHeight * .78), -1, 1);

  root.classList.add('movx-v39');
  root.dataset.movxDepthMotion = 'v39-parallax-3d-scroll';

  if (reduced) {
    root.classList.add('v39-reduced');
    return;
  }

  try {
    const heroStage = q('.social-cover-art__stage');
    const heroImage = q('.social-cover-art__image', heroStage || document);
    const heroOverlay = q('.v28-hero-overlay', heroStage || document);
    const heroType = q('.v28-hero-plane--type', heroOverlay || document);
    const heroCrt = q('.v28-hero-plane--crt', heroOverlay || document);
    const heroLower = q('.v28-hero-plane--lower', heroOverlay || document);
    const heroGrain = q('.v28-hero-grain', heroOverlay || document);
    const livingArchive = document.getElementById('livingArchive');
    const loopRows = livingArchive ? qa('.loop-row', livingArchive) : [];
    const nicheGrid = document.getElementById('nicheGrid');
    const projectList = document.getElementById('projectsList');
    const viewer = document.getElementById('caseViewer');

    const active = new Set();
    const observeTargets = new Set();
    const projectPointer = new WeakMap();
    let caseFrames = [];
    let projectEntries = [];
    let nicheCards = [];

    const markObserved = node => {
      if (!node || observeTargets.has(node)) return;
      observeTargets.add(node);
      viewportObserver?.observe(node);
    };

    let viewportObserver = null;
    if ('IntersectionObserver' in window) {
      viewportObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) active.add(entry.target);
          else active.delete(entry.target);
        });
        schedule();
      }, { threshold:0, rootMargin:'42% 0px 42% 0px' });
    }

    [heroStage, livingArchive, nicheGrid, projectList, viewer].filter(Boolean).forEach(markObserved);

    const refreshProjects = () => {
      projectEntries = projectList ? qa('.project-entry', projectList) : [];
      projectEntries.forEach((entry, index) => {
        entry.dataset.v39DepthIndex = String(index + 1);
        markObserved(entry);
        if (!finePointer || entry.dataset.v39PointerBound === 'true') return;
        entry.dataset.v39PointerBound = 'true';
        projectPointer.set(entry, { x:0, y:0, tx:0, ty:0 });
        const cover = q('.project-cover', entry);
        if (!cover) return;
        cover.addEventListener('pointermove', event => {
          const rect = cover.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const state = projectPointer.get(entry);
          if (!state) return;
          state.tx = clamp(((event.clientX - rect.left) / rect.width - .5) * 2, -1, 1);
          state.ty = clamp(((event.clientY - rect.top) / rect.height - .5) * 2, -1, 1);
          schedule();
        }, { passive:true });
        cover.addEventListener('pointerleave', () => {
          const state = projectPointer.get(entry);
          if (!state) return;
          state.tx = 0;
          state.ty = 0;
          schedule();
        }, { passive:true });
      });
    };

    const refreshNiches = () => {
      nicheCards = nicheGrid ? qa('.niche-card', nicheGrid) : [];
      nicheCards.forEach(markObserved);
    };

    const refreshCaseFrames = () => {
      caseFrames = viewer ? qa('.case-slide-frame', viewer) : [];
      caseFrames.forEach(markObserved);
      schedule();
    };

    let raf = 0;

    refreshProjects();
    refreshNiches();
    refreshCaseFrames();

    if ('MutationObserver' in window) {
      if (projectList) new MutationObserver(refreshProjects).observe(projectList, { childList:true, subtree:true });
      if (nicheGrid) new MutationObserver(refreshNiches).observe(nicheGrid, { childList:true });
      if (viewer) new MutationObserver(mutations => {
        if (mutations.some(m => m.type === 'childList' || (m.type === 'attributes' && m.attributeName === 'class'))) refreshCaseFrames();
      }).observe(viewer, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    }

    const heroPointer = { x:0, y:0, tx:0, ty:0 };
    if (heroStage && finePointer) {
      heroStage.addEventListener('pointermove', event => {
        const rect = heroStage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        heroPointer.tx = clamp(((event.clientX - rect.left) / rect.width - .5) * 2, -1, 1);
        heroPointer.ty = clamp(((event.clientY - rect.top) / rect.height - .5) * 2, -1, 1);
        schedule();
      }, { passive:true });
      heroStage.addEventListener('pointerleave', () => {
        heroPointer.tx = 0;
        heroPointer.ty = 0;
        schedule();
      }, { passive:true });
    }

    let lastScrollY = scrollY;
    let lastScrollAt = performance.now();
    let velocityTarget = 0;
    let velocity = 0;

    function setPx(node, name, value) { node?.style.setProperty(name, `${value.toFixed(2)}px`); }
    function setDeg(node, name, value) { node?.style.setProperty(name, `${value.toFixed(2)}deg`); }
    function setNum(node, name, value) { node?.style.setProperty(name, value.toFixed(4)); }

    function paintHero() {
      if (!heroStage || !heroImage || !active.has(heroStage)) return false;
      const rect = heroStage.getBoundingClientRect();
      const progress = clamp((-rect.top) / Math.max(1, rect.height * .78), 0, 1.15);
      heroPointer.x = lerp(heroPointer.x, heroPointer.tx, .13);
      heroPointer.y = lerp(heroPointer.y, heroPointer.ty, .13);
      const px = heroPointer.x;
      const py = heroPointer.y;

      setPx(heroStage, '--v39-hero-bg-x', -px * 15);
      setPx(heroStage, '--v39-hero-bg-y', -progress * 54 - py * 10);
      setNum(heroStage, '--v39-hero-bg-scale', 1.065 + progress * .055);

      if (heroOverlay) {
        setPx(heroOverlay, '--v39-hero-x', px * 24);
        setPx(heroOverlay, '--v39-hero-y', -progress * 76 + py * 18);
        setPx(heroOverlay, '--v39-hero-z', 38 + progress * 64);
        setDeg(heroOverlay, '--v39-hero-rx', -py * 2.8 + progress * 2.2);
        setDeg(heroOverlay, '--v39-hero-ry', px * 4.2);
        setNum(heroOverlay, '--v39-hero-scale', 1.045 + progress * .028);
      }
      setPx(heroType, '--v39-type-x', -px * 34 - progress * 24);
      setPx(heroType, '--v39-type-y', -progress * 46 - py * 15);
      setDeg(heroType, '--v39-type-ry', -px * 2.5);
      setPx(heroCrt, '--v39-crt-x', px * 46 + progress * 32);
      setPx(heroCrt, '--v39-crt-y', -progress * 112 + py * 24);
      setDeg(heroCrt, '--v39-crt-ry', px * 5.4);
      setPx(heroLower, '--v39-lower-x', px * 26 - progress * 12);
      setPx(heroLower, '--v39-lower-y', -progress * 78 + py * 17);
      setDeg(heroLower, '--v39-lower-rx', -py * 3.2);
      setPx(heroGrain, '--v39-grain-x', px * 10);
      setPx(heroGrain, '--v39-grain-y', py * 8 - progress * 18);

      return Math.abs(heroPointer.x - heroPointer.tx) > .008 || Math.abs(heroPointer.y - heroPointer.ty) > .008;
    }

    function paintArchive() {
      if (!livingArchive || !active.has(livingArchive) || !loopRows.length) return;
      const rect = livingArchive.getBoundingClientRect();
      const progress = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height), 0, 1);
      const t = (progress - .5) * 2;
      const amplitudes = [
        { y:-38, z:44, rx:3.8, rz:-.75 },
        { y:46, z:74, rx:-4.6, rz:.62 },
        { y:-30, z:52, rx:3.2, rz:-.42 }
      ];
      loopRows.forEach((row, index) => {
        const a = amplitudes[index % amplitudes.length];
        setPx(row, '--v39-row-y', t * a.y + velocity * (index === 1 ? -8 : 7));
        setPx(row, '--v39-row-z', (1 - Math.abs(t)) * a.z - 16);
        setDeg(row, '--v39-row-rx', t * a.rx);
        setDeg(row, '--v39-row-rz', t * a.rz + velocity * .22 * (index % 2 ? -1 : 1));
      });
    }

    function paintNiches() {
      if (innerWidth <= 900) return;
      nicheCards.forEach((card, index) => {
        if (!active.has(card)) return;
        const media = q('.niche-card__media', card);
        if (!media) return;
        const d = signedViewportDistance(card.getBoundingClientRect());
        const strength = 1 - Math.abs(d);
        const dir = index % 2 ? -1 : 1;
        setPx(media, '--v39-niche-y', -d * 36);
        setPx(media, '--v39-niche-z', -28 + strength * 66);
        setDeg(media, '--v39-niche-rx', d * 4.2);
        setDeg(media, '--v39-niche-ry', dir * d * 6.4);
        setNum(media, '--v39-niche-scale', .985 + strength * .035);
        setPx(media, '--v39-niche-img-x', dir * d * 14);
        setPx(media, '--v39-niche-img-y', d * 20);
      });
    }

    function paintProjects() {
      if (!projectEntries.length) return false;
      let closest = null;
      let closestDistance = Infinity;
      let pointerUnsettled = false;

      projectEntries.forEach((entry, index) => {
        const cover = q('.project-cover', entry);
        const image = cover && q('img', cover);
        if (!cover || !image) return;
        const rect = entry.getBoundingClientRect();
        const d = signedViewportDistance(rect);
        const abs = Math.abs(d);
        if (abs < closestDistance && rect.bottom > 0 && rect.top < innerHeight) {
          closestDistance = abs;
          closest = entry;
        }
        if (!active.has(entry)) return;

        const strength = 1 - abs;
        const dir = index % 2 ? -1 : 1;
        const pointer = projectPointer.get(entry) || { x:0,y:0,tx:0,ty:0 };
        pointer.x = lerp(pointer.x || 0, pointer.tx || 0, .14);
        pointer.y = lerp(pointer.y || 0, pointer.ty || 0, .14);
        if (projectPointer.has(entry)) projectPointer.set(entry, pointer);
        if (Math.abs(pointer.x - pointer.tx) > .008 || Math.abs(pointer.y - pointer.ty) > .008) pointerUnsettled = true;

        const desktop3d = innerWidth > 980;
        const ry = desktop3d ? (-dir * d * 15 + pointer.x * 5.5) : 0;
        const rx = desktop3d ? (d * 9 - pointer.y * 3.6) : 0;
        const rz = desktop3d ? (dir * d * .9 - velocity * dir * .8) : 0;
        const z = desktop3d ? (-92 + strength * 168) : 0;
        const y = -d * (desktop3d ? 78 : 24) + velocity * 8;
        const x = desktop3d ? dir * (1 - strength) * 18 : 0;
        const scale = desktop3d ? (.95 + strength * .075) : (.99 + strength * .018);

        setPx(cover, '--v39-project-x', x);
        setPx(cover, '--v39-project-y', y);
        setPx(cover, '--v39-project-z', z);
        setDeg(cover, '--v39-project-rx', rx);
        setDeg(cover, '--v39-project-ry', ry);
        setDeg(cover, '--v39-project-rz', rz);
        setNum(cover, '--v39-project-scale', scale);
        setPx(cover, '--v39-project-shadow-y', 18 + abs * 18);
        setPx(cover, '--v39-project-shadow-blur', 38 + abs * 22);
        setNum(cover, '--v39-project-shadow-a', .09 + strength * .10);
        setPx(cover, '--v39-project-img-x', pointer.x * 15 + dir * d * 14);
        setPx(cover, '--v39-project-img-y', pointer.y * 12 + d * 24);
        setNum(cover, '--v39-project-img-scale', 1.09 + strength * .025);
      });

      projectEntries.forEach(entry => entry.classList.toggle('v39-depth-current', entry === closest));
      return pointerUnsettled;
    }

    function paintCaseFrames() {
      if (!viewer?.classList.contains('open')) return;
      caseFrames.forEach((frame, index) => {
        if (!active.has(frame)) return;
        const rect = frame.getBoundingClientRect();
        const d = signedViewportDistance(rect);
        const strength = 1 - Math.abs(d);
        const dir = index % 2 ? -1 : 1;
        setPx(frame, '--v39-case-x', dir * d * 12);
        setPx(frame, '--v39-case-y', -d * 46);
        setPx(frame, '--v39-case-z', -70 + strength * 112);
        setDeg(frame, '--v39-case-rx', d * 6.6);
        setDeg(frame, '--v39-case-ry', dir * d * 3.8);
        setNum(frame, '--v39-case-scale', .975 + strength * .035);
        setPx(frame, '--v39-case-img-y', d * 18);
      });
    }

    function frame() {
      raf = 0;
      heroPointer.x = lerp(heroPointer.x, heroPointer.tx, .12);
      heroPointer.y = lerp(heroPointer.y, heroPointer.ty, .12);
      velocity = lerp(velocity, velocityTarget, .18);
      velocityTarget *= .72;

      const heroUnsettled = paintHero();
      paintArchive();
      paintNiches();
      const pointerUnsettled = paintProjects();
      paintCaseFrames();

      const moving = heroUnsettled || pointerUnsettled || Math.abs(velocity) > .012 || Math.abs(velocityTarget) > .012;
      if (moving) schedule();
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    addEventListener('scroll', () => {
      const now = performance.now();
      const dy = scrollY - lastScrollY;
      const dt = Math.max(16, now - lastScrollAt);
      velocityTarget = clamp(dy / dt, -2.4, 2.4);
      lastScrollY = scrollY;
      lastScrollAt = now;
      schedule();
    }, { passive:true });
    addEventListener('resize', schedule, { passive:true });
    addEventListener('load', schedule, { once:true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); }, { passive:true });
    schedule();

  } catch (error) {
    console.warn('MOVX v39 depth motion failed open:', error);
  }
})();


/* MOVX v86/v87 — shared artwork project transition
   Reuses the reliable v41 opener snapshot, but removes the generic shader language.
   The clicked artwork itself becomes the navigation: cover -> case hero -> cover.
   Copy remains planar; the transition is a single media gesture with an authored
   open-corner registration mark shared by the list and the case study. */
(() => {
  'use strict';

  const root = document.documentElement;
  const compact = matchMedia('(max-width:980px)').matches;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches || compact;
  const section = document.querySelector('.projects-list');
  const list = document.getElementById('projectsList');
  const viewer = document.getElementById('caseViewer');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  root.classList.add('movx-v41','movx-v86');
  root.dataset.movxProjectPortal = 'v86-shared-artwork';
  root.dataset.movxSignatureMotion = 'v87-editorial-continuity';

  /* v86/v87 must be the final visual owner. The build packages this stylesheet,
     and the existing v41 runtime appends it after all legacy CSS. */
  if (!document.querySelector('link[data-movx-v86-signature]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'v86-signature-motion.css?v=87-editorial-continuity';
    link.dataset.movxV86Signature = 'true';
    document.head.appendChild(link);
  }

  if (!viewer) return;

  /* --------------------------------------------------------------
     1) Project mood stays contextual but intentionally quiet.
     -------------------------------------------------------------- */
  let moodRaf = 0;
  const syncMood = () => {
    moodRaf = 0;
    const current = list?.querySelector('.project-entry.v39-depth-current') || list?.querySelector('.project-entry');
    if (!current || !section) return;
    const accent = getComputedStyle(current).getPropertyValue('--v38-accent').trim();
    if (accent) section.style.setProperty('--v41-mood', accent);
  };
  const scheduleMood = () => { if (!moodRaf) moodRaf = requestAnimationFrame(syncMood); };
  scheduleMood();
  if (list && 'MutationObserver' in window) {
    new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'attributes' && m.attributeName === 'class')) scheduleMood();
    }).observe(list, { subtree:true, attributes:true, attributeFilter:['class'] });
  }

  /* --------------------------------------------------------------
     2) Snapshot the exact artwork before the base runtime opens it.
     -------------------------------------------------------------- */
  let snapshot = null;
  let wasOpen = viewer.classList.contains('open');
  let transitionToken = 0;
  let activeAnimations = [];
  let heroStateRaf = 0;

  const mediaFor = opener => {
    if (!opener) return null;
    if (opener.matches('img')) return opener;
    return opener.querySelector('img') || opener.closest('.project-entry')?.querySelector('.project-cover img') || null;
  };
  const copyRect = rect => ({ left:rect.left, top:rect.top, width:rect.width, height:rect.height });
  const validRect = rect => !!rect && rect.width > 4 && rect.height > 4;
  const visibleRect = rect => {
    if (!validRect(rect)) return false;
    const right = Number.isFinite(rect.right) ? rect.right : rect.left + rect.width;
    const bottom = Number.isFinite(rect.bottom) ? rect.bottom : rect.top + rect.height;
    return bottom > 0 && rect.top < innerHeight && right > 0 && rect.left < innerWidth;
  };

  const accentFor = opener => {
    const entry = opener?.closest?.('.project-entry');
    const node = entry || opener;
    const value = node ? getComputedStyle(node).getPropertyValue('--v38-accent').trim() : '';
    return value || getComputedStyle(root).getPropertyValue('--editorial-red').trim() || '#9c2e24';
  };

  const takeSnapshot = opener => {
    if (!opener || viewer.contains(opener)) return;
    const img = mediaFor(opener);
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (!validRect(rect)) return;
    if (snapshot?.img && snapshot.img !== img) snapshot.img.classList.remove('v86-portal-source-hidden');
    snapshot = {
      opener,
      img,
      src:img.currentSrc || img.src,
      rect:copyRect(rect),
      slug:opener.getAttribute('data-open-project') || opener.closest('[data-open-project]')?.getAttribute('data-open-project') || '',
      accent:accentFor(opener),
      heroRect:null,
      heroImg:null,
      heroVisible:false
    };
  };

  document.addEventListener('pointerdown', event => {
    const opener = event.target?.closest?.('[data-open-project]');
    if (opener && !viewer.contains(opener)) takeSnapshot(opener);
  }, { capture:true, passive:true });
  document.addEventListener('focusin', event => {
    const opener = event.target?.closest?.('[data-open-project]');
    if (opener && !viewer.contains(opener)) takeSnapshot(opener);
  }, true);

  if (reduced) {
    root.classList.add('v86-shared-transition-reduced');
    return;
  }

  /* --------------------------------------------------------------
     3) One DOM shared-element stage. No WebGL, no chromatic aberration,
        no grain, no perspective-card motion.
     -------------------------------------------------------------- */
  let stage = null;
  let surface = null;
  let coverLayer = null;
  let containLayer = null;

  const ensureStage = () => {
    if (stage?.isConnected) return true;
    stage = document.createElement('div');
    stage.className = 'v41-project-transition';
    stage.setAttribute('aria-hidden','true');
    stage.innerHTML = '<div class="v86-project-transition__surface"><img class="v86-project-transition__image v86-project-transition__image--cover" alt=""><img class="v86-project-transition__image v86-project-transition__image--contain" alt=""></div>';
    document.body.appendChild(stage);
    surface = stage.querySelector('.v86-project-transition__surface');
    coverLayer = stage.querySelector('.v86-project-transition__image--cover');
    containLayer = stage.querySelector('.v86-project-transition__image--contain');
    return !!(surface && coverLayer && containLayer);
  };

  const cancelAnimations = () => {
    activeAnimations.forEach(animation => {
      try { animation.cancel(); } catch (_) {}
    });
    activeAnimations = [];
  };

  const hideStage = () => {
    cancelAnimations();
    stage?.classList.remove('v41-transition-live');
    root.classList.remove('v86-transition-running','v86-case-leaving');
  };

  const setSource = () => {
    if (!snapshot?.src || !ensureStage()) return false;
    coverLayer.src = snapshot.src;
    containLayer.src = snapshot.src;
    surface.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
    return true;
  };

  const place = rect => {
    if (!surface || !validRect(rect)) return;
    surface.style.left = `${rect.left}px`;
    surface.style.top = `${rect.top}px`;
    surface.style.width = `${rect.width}px`;
    surface.style.height = `${rect.height}px`;
    surface.style.transform = 'none';
  };

  const inverseTransform = (from, to) => {
    const sx = clamp(from.width / Math.max(1,to.width), .03, 32);
    const sy = clamp(from.height / Math.max(1,to.height), .03, 32);
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    return `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`;
  };

  const targetForOpen = () => {
    const media = viewer.querySelector('.case-hero__media');
    const img = media?.querySelector('img');
    const rect = media?.getBoundingClientRect();
    return media && img && validRect(rect) ? { media, img, rect:copyRect(rect) } : null;
  };

  const syncHeroState = () => {
    heroStateRaf = 0;
    if (!snapshot || !viewer.classList.contains('open')) return;
    const target = targetForOpen();
    if (!target) {
      snapshot.heroVisible = false;
      return;
    }
    snapshot.heroRect = target.rect;
    snapshot.heroImg = target.img;
    snapshot.heroVisible = visibleRect(target.rect);
  };
  const scheduleHeroState = () => {
    if (!heroStateRaf) heroStateRaf = requestAnimationFrame(syncHeroState);
  };

  const waitForOpenTarget = (token, attempt = 0) => {
    if (token !== transitionToken || !viewer.classList.contains('open')) return;
    const target = targetForOpen();
    if (target) { runOpenMorph(token,target); return; }
    /* v87: the mount budget is deliberately short. If the target is not ready,
       the stable case view wins over a late animation. */
    if (attempt >= 6) { finishOpen(token,null); return; }
    requestAnimationFrame(() => waitForOpenTarget(token,attempt + 1));
  };

  const animateLayers = direction => {
    const timing = { duration:direction > 0 ? 640 : 580, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' };
    if (direction > 0) {
      activeAnimations.push(coverLayer.animate([
        {opacity:1,offset:0},{opacity:1,offset:.44},{opacity:.18,offset:.86},{opacity:0,offset:1}
      ], timing));
      activeAnimations.push(containLayer.animate([
        {opacity:0,offset:0},{opacity:0,offset:.38},{opacity:.86,offset:.88},{opacity:1,offset:1}
      ], timing));
    } else {
      activeAnimations.push(coverLayer.animate([
        {opacity:0,offset:0},{opacity:.08,offset:.32},{opacity:.92,offset:.8},{opacity:1,offset:1}
      ], timing));
      activeAnimations.push(containLayer.animate([
        {opacity:1,offset:0},{opacity:.96,offset:.36},{opacity:.12,offset:.84},{opacity:0,offset:1}
      ], timing));
    }
  };

  function runOpenMorph(token,target){
    if (token !== transitionToken || !snapshot || !setSource()) { finishOpen(token,target); return; }
    cancelAnimations();
    const from = snapshot.rect;
    const to = target.rect;
    if (!validRect(from) || !validRect(to) || !surface.animate) { finishOpen(token,target); return; }

    snapshot.img?.classList.add('v86-portal-source-hidden');
    target.img.classList.add('v86-portal-target-hidden');
    snapshot.heroRect = copyRect(to);
    snapshot.heroImg = target.img;
    snapshot.heroVisible = visibleRect(to);

    stage.dataset.direction = 'open';
    stage.classList.add('v41-transition-live');
    stage.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
    root.classList.add('v86-transition-running','v86-case-arriving');
    place(to);

    const animation = surface.animate([
      { transform:inverseTransform(from,to), clipPath:'inset(0 0 0 0)' },
      { transform:'translate3d(0,0,0) scale(1,1)', clipPath:'inset(0 0 0 0)' }
    ], { duration:640, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' });
    activeAnimations.push(animation);
    animateLayers(1);
    animation.onfinish = () => finishOpen(token,target);
    animation.oncancel = () => {};
  }

  function finishOpen(token,target){
    if (token !== transitionToken) return;
    target?.img?.classList.remove('v86-portal-target-hidden');
    snapshot?.heroImg?.classList.remove('v86-portal-target-hidden');
    snapshot?.img?.classList.remove('v86-portal-source-hidden');
    hideStage();
    requestAnimationFrame(() => root.classList.remove('v86-case-arriving'));
    root.dataset.movxProjectTransition = 'settled';
    scheduleHeroState();
  }

  const refreshSourceRect = () => {
    if (!snapshot?.opener?.isConnected) return null;
    const img = mediaFor(snapshot.opener);
    const rect = img?.getBoundingClientRect();
    if (!img || !visibleRect(rect)) return null;
    snapshot.img = img;
    snapshot.rect = copyRect(rect);
    return { img, rect:copyRect(rect) };
  };

  const runCloseMorph = token => {
    const destination = refreshSourceRect();
    const from = snapshot?.heroRect;
    /* If the case hero is no longer in the viewport, inventing a morph from its
       old position would break spatial continuity. In that situation the normal
       close is cleaner and more truthful. */
    if (!snapshot || !snapshot.heroVisible || !visibleRect(from) || !destination || !setSource() || !surface?.animate) {
      finishClose(token); return;
    }
    cancelAnimations();
    destination.img.classList.add('v86-portal-source-hidden');
    stage.dataset.direction = 'close';
    stage.classList.add('v41-transition-live');
    stage.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
    root.classList.add('v86-transition-running','v86-case-leaving');
    place(destination.rect);

    const animation = surface.animate([
      { transform:inverseTransform(from,destination.rect) },
      { transform:'translate3d(0,0,0) scale(1,1)' }
    ], { duration:580, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' });
    activeAnimations.push(animation);
    animateLayers(-1);
    animation.onfinish = () => finishClose(token);
    animation.oncancel = () => {};
  };

  const finishClose = token => {
    if (token !== transitionToken) return;
    snapshot?.img?.classList.remove('v86-portal-source-hidden');
    snapshot?.heroImg?.classList.remove('v86-portal-target-hidden');
    root.classList.remove('v86-case-arriving');
    hideStage();
    root.dataset.movxProjectTransition = 'idle';
  };

  /* --------------------------------------------------------------
     4) Let the existing case viewer own state/navigation. v86 only
        visualises the state change and never blocks input.
     -------------------------------------------------------------- */
  if ('MutationObserver' in window) {
    new MutationObserver(() => {
      const isOpen = viewer.classList.contains('open');
      if (isOpen && !wasOpen) {
        const token = ++transitionToken;
        root.classList.add('v86-case-arriving');
        root.dataset.movxProjectTransition = 'opening';
        if (!snapshot || !setSource()) finishOpen(token,null);
        else {
          stage.dataset.direction = 'open';
          stage.classList.add('v41-transition-live');
          stage.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
          place(snapshot.rect);
          coverLayer.style.opacity = '1';
          containLayer.style.opacity = '0';
          waitForOpenTarget(token);
        }
      } else if (!isOpen && wasOpen) {
        const token = ++transitionToken;
        root.dataset.movxProjectTransition = 'closing';
        runCloseMorph(token);
      }
      wasOpen = isOpen;
    }).observe(viewer,{attributes:true,attributeFilter:['class']});
  }

  viewer.addEventListener('scroll',scheduleHeroState,{passive:true});
  addEventListener('resize',scheduleHeroState,{passive:true});
})();

/* MOVX v53 — process handoff bridge */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  let bound = false;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const smooth = t => t*t*(3-2*t);

  function bind(){
    if(bound) return true;
    const process = document.querySelector('#process, .process-section');
    const list = process?.querySelector('.process-list');
    if(!process || !list) return false;
    bound = true;
    root.classList.add('movx-v53-bridge');
    process.classList.add('v53-process-bridge');

    let raf = 0;
    const paint = () => {
      raf = 0;
      const rect = process.getBoundingClientRect();
      const raw = clamp((innerHeight - rect.top) / Math.max(1, innerHeight * .92));
      const entry = smooth(raw);
      const inv = 1 - entry;
      process.style.setProperty('--v53-entry', entry.toFixed(4));
      process.style.setProperty('--v53-list-y', `${(inv*62).toFixed(2)}px`);
      process.style.setProperty('--v53-list-z', `${(-inv*150).toFixed(2)}px`);
      process.style.setProperty('--v53-list-rx', `${(inv*7.5).toFixed(2)}deg`);
      process.style.setProperty('--v53-grid-o', `${clamp(inv*1.12,0,1).toFixed(4)}`);
      process.style.setProperty('--v53-title-o', `${clamp(.55+entry*.45,0,1).toFixed(4)}`);
    };
    const schedule = () => { if(!raf) raf = requestAnimationFrame(paint); };
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    addEventListener('load',schedule,{once:true});
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) schedule(); },{passive:true});
    paint();
    return true;
  }

  if(!bind() && 'MutationObserver' in window){
    const observer = new MutationObserver(()=>{ if(bind()) observer.disconnect(); });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
