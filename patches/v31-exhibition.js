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
        attributeFilter:['src','style','class']
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
