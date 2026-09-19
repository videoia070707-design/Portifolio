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
