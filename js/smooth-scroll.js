/**
 * smooth-scroll.js
 * Smooth-scroll engine + scroll-driven UI (progress bar, depth rail,
 * active-section tracking, reveal-on-scroll animations).
 *
 * Design choice: rather than scroll-jacking (hijacking native scroll with a
 * virtual scroll library, which is what made the old build feel "broken or
 * uncomfortable"), this uses native scrolling with `scroll-behavior` for
 * anchor jumps and a single rAF-throttled scroll listener for everything
 * else. This keeps scrolling input-responsive (trackpad/wheel/touch all
 * behave normally) while still producing a premium, animated feel.
 */
(function (window, document) {
  'use strict';

  const OCEAN = window.OCEAN;
  const { clamp, throttleRaf } = OCEAN.utils;

  function initScroll() {
    const progressBar = document.querySelector('.scroll-progress');
    const depthFill = document.querySelector('.depth-rail__fill');
    const depthValue = document.querySelector('.depth-rail__value');
    const sections = OCEAN.config.sections
      .map((s) => ({ ...s, el: document.getElementById(s.id) }))
      .filter((s) => s.el);

    const maxDepthMeters = 40; // purely cosmetic — "surface" to "ending" depth

    function getDocHeight() {
      return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    }

    function updateOnScroll() {
      const scrollY = window.scrollY;
      const docHeight = getDocHeight();
      const pct = clamp(scrollY / docHeight, 0, 1);

      if (progressBar) progressBar.style.width = `${pct * 100}%`;

      if (depthFill) depthFill.style.height = `${pct * 100}%`;
      if (depthValue) {
        const meters = Math.round(pct * maxDepthMeters);
        depthValue.textContent = `${meters}m`;
        OCEAN.state.scrollDepthMeters = meters;
      }

      // Active section detection — midpoint-of-viewport method, cheap and robust.
      const probeY = scrollY + window.innerHeight * 0.4;
      let active = sections[0];
      for (const s of sections) {
        if (s.el.offsetTop <= probeY) active = s;
      }
      if (active && active.id !== OCEAN.state.currentSection) {
        OCEAN.state.currentSection = active.id;
        OCEAN.bus.emit('section:change', active.id);
      }

      // Navbar background toggle
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.toggle('is-scrolled', scrollY > 24);
    }

    const onScroll = throttleRaf(updateOnScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', OCEAN.utils.debounce(updateOnScroll, 200));
    updateOnScroll();

    // Smooth anchor navigation for nav links / buttons with data-scroll-to
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-scroll-to]');
      if (!trigger) return;
      e.preventDefault();
      const targetId = trigger.getAttribute('data-scroll-to');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top, behavior: OCEAN.config.prefersReducedMotion ? 'auto' : 'smooth' });
      OCEAN.bus.emit('nav:close');
    });

    initRevealObserver();
  }

  /**
   * IntersectionObserver-driven reveal system. Elements with `.reveal`,
   * `.memory-item`, `.gallery__item`, or `.wish-card` get `.is-visible`
   * added once they cross the threshold — animation itself lives in CSS,
   * keeping this module purely about *timing*, not visual style.
   */
  function initRevealObserver() {
    const targets = document.querySelectorAll(
      '.reveal, .reveal-stagger, .memory-item, .gallery__item, .wish-card'
    );
    if (!targets.length) return;

    if (OCEAN.config.prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScroll);
  } else {
    initScroll();
  }
})(window, document);