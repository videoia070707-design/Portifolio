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
