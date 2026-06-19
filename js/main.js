/**
 * main.js
 * Bootstraps the page: loading screen, hero entrance, renders memories
 * timeline and wishes from OCEAN_SETTINGS (config/settings.js).
 * No more JSON data files needed — all content lives in settings.js.
 */
(function (window, document) {
  'use strict';

  const OCEAN    = window.OCEAN;
  const SETTINGS = window.OCEAN_SETTINGS || {};

  /* ── Loading screen ─────────────────────────────────────── */
  function runLoader() {
    return new Promise((resolve) => {
      const loader   = document.querySelector('.loader');
      const fill     = loader?.querySelector('.loader__bar-fill');
      const label    = loader?.querySelector('.loader__label span');
      const pctLabel = loader?.querySelector('.loader__pct');
      if (!loader) { resolve(); return; }

      if (OCEAN.config.prefersReducedMotion) {
        loader.classList.add('is-hidden');
        resolve();
        return;
      }

      let pct = 0;
      const messages = ['Charting the depths', 'Releasing bubbles', 'Catching the light', 'Almost ashore'];
      let mIndex = 0;

      const interval = setInterval(() => {
        pct += OCEAN.utils.rand(6, 16);
        if (pct >= 100) pct = 100;
        if (fill)     fill.style.width = `${pct}%`;
        if (pctLabel) pctLabel.textContent = `${Math.round(pct)}%`;
        if (label && Math.random() > 0.55 && mIndex < messages.length - 1) {
          mIndex++;
          label.style.opacity = '0';
          setTimeout(() => { label.textContent = messages[mIndex]; label.style.opacity = '1'; }, 180);
        }
        if (pct >= 100) {
          clearInterval(interval);
          setTimeout(() => { loader.classList.add('is-hidden'); setTimeout(resolve, 600); }, 300);
        }
      }, 180);
    });
  }

  /* ── Hero entrance ──────────────────────────────────────── */
  function playHeroEntrance() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const title = hero.querySelector('.hero__title');
    const items = [
      hero.querySelector('.hero__eyebrow'),
      hero.querySelector('.hero__subtitle'),
      hero.querySelector('.hero__actions'),
      hero.querySelector('.hero__scroll-cue')
    ].filter(Boolean);

    if (OCEAN.config.prefersReducedMotion) {
      items.forEach((el) => { el.style.opacity = '1'; });
      title?.classList.add('is-revealed');
      return;
    }

    title?.classList.add('is-revealed');
    items.forEach((el, i) => {
      el.style.animation = `fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) ${0.25 + i * 0.16}s forwards`;
    });
  }

  /* ── Memories timeline ──────────────────────────────────── */
  function renderMemories() {
    const list = document.querySelector('.memories__list');
    if (!list) return;

    const data = (SETTINGS.memories && SETTINGS.memories.length)
      ? SETTINGS.memories
      : [{ depth: '4m', year: 'Chapter One', title: 'A memory worth keeping', text: 'Add your memory in config/settings.js.' }];

    list.innerHTML = `
      <div class="memories__spine" aria-hidden="true"><div class="memories__spine-fill"></div></div>
    ` + data.map((m) => `
      <div class="memory-item">
        <div class="memory-item__node"><span class="memory-item__node-dot"></span></div>
        <div class="memory-item__depth">${escapeHtml(m.depth)} below surface</div>
        <div class="memory-item__card">
          <div class="memory-item__year">${escapeHtml(m.year)}</div>
          <h3 class="memory-item__title">${escapeHtml(m.title)}</h3>
          <p class="memory-item__text">${escapeHtml(m.text)}</p>
        </div>
      </div>
    `).join('');

    observeNewly(list.querySelectorAll('.memory-item'));
    initSpineFill(list);
  }

  function initSpineFill(memoriesList) {
    const spine = memoriesList.querySelector('.memories__spine-fill');
    if (!spine) return;
    if (OCEAN.config.prefersReducedMotion) { spine.style.height = '100%'; return; }

    const update = OCEAN.utils.throttleRaf(() => {
      const rect = memoriesList.getBoundingClientRect();
      const total = rect.height;
      const visibleFromTop = OCEAN.utils.clamp(window.innerHeight * 0.6 - rect.top, 0, total);
      spine.style.height = `${(visibleFromTop / total) * 100}%`;
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── Wishes grid ────────────────────────────────────────── */
  const ICONS = {
    wave:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/></svg>',
    shell:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3c4.5 0 8 4 8 9a8 8 0 01-16 0c0-5 3.5-9 8-9z"/><path d="M12 7v10M9 9l3 3-3 3M15 9l-3 3 3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.6L22 9.2l-5.6 4.6L18 22l-6-4.2L6 22l1.6-8.2L2 9.2l7.4-0.6z"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6z" fill="currentColor" stroke="none"/></svg>',
    anchor:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M6 13a6 6 0 0012 0M4 13h2M18 13h2"/></svg>',
    heart:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.8-10-9.5C0.3 8 2 4.5 5.5 4.2 8 4 10.3 5.5 12 8c1.7-2.5 4-4 6.5-3.8C22 4.5 23.7 8 22 11.5 19.5 16.2 12 21 12 21z"/></svg>'
  };

  function renderWishes() {
    const grid = document.querySelector('.wishes__grid');
    if (!grid) return;

    const data = (SETTINGS.wishes && SETTINGS.wishes.length)
      ? SETTINGS.wishes
      : [{ icon: 'heart', text: 'Happy birthday!' }];

    grid.innerHTML = data.map((w, i) => `
      <div class="wish-card" style="--d:${(i % 3) * 0.1}s">
        <span class="wish-card__quote-mark">"</span>
        <div class="wish-card__icon">${ICONS[w.icon] || ICONS.heart}</div>
        <p class="wish-card__text">${escapeHtml(w.text)}</p>
      </div>
    `).join('');

    observeNewly(grid.querySelectorAll('.wish-card'));
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  function observeNewly(nodes) {
    if (!nodes.length) return;
    if (OCEAN.config.prefersReducedMotion) {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );
    nodes.forEach((n) => observer.observe(n));
  }

  function initMisc() {
    document.querySelectorAll('[data-replay]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: OCEAN.config.prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
    const yearEl = document.querySelector('[data-current-year]');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ── Boot ───────────────────────────────────────────────── */
  async function boot() {
    initMisc();
    renderMemories();
    renderWishes();
    await runLoader();
    OCEAN.state.loaded = true;
    playHeroEntrance();
    OCEAN.bus.emit('app:ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);
