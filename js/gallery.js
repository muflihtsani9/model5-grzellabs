/**
 * gallery.js
 * Renders the 3:4 photo grid from OCEAN_SETTINGS.galleryPhotos (set in
 * config/settings.js). Photos are loaded from assets/images/ automatically.
 * Falls back to a gradient placeholder when a photo file is missing.
 */
(function (window, document) {
  'use strict';

  const OCEAN    = window.OCEAN;
  const SETTINGS = window.OCEAN_SETTINGS || {};

  let galleryData = [];
  let activeIndex = 0;

  const PLATE_GRADIENTS = [
    'linear-gradient(155deg, rgba(62,198,224,0.22), rgba(4,28,50,0.92))',
    'linear-gradient(155deg, rgba(255,215,106,0.16), rgba(6,18,34,0.94))',
    'linear-gradient(155deg, rgba(143,227,240,0.18), rgba(8,16,38,0.92))',
    'linear-gradient(155deg, rgba(255,138,122,0.12), rgba(4,15,28,0.94))',
    'linear-gradient(155deg, rgba(62,198,224,0.14), rgba(255,215,106,0.07), rgba(4,16,30,0.94))',
    'linear-gradient(155deg, rgba(143,227,240,0.1), rgba(2,10,20,0.95))'
  ];

  const PLACEHOLDER_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
      <path d="M4 17l4.5-5 3 3 4-5 4.5 5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="9" cy="8" r="1.4"/>
      <rect x="3" y="4" width="18" height="16" rx="2.4"/>
    </svg>`;

  function plateFor(index) {
    return PLATE_GRADIENTS[index % PLATE_GRADIENTS.length];
  }

  function mediaMarkup(item, index, forLightbox) {
    if (item.src) {
      return `<img class="gallery__media" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.caption || '')}" loading="${forLightbox ? 'eager' : 'lazy'}">`;
    }
    const indexLabel = String(index + 1).padStart(2, '0');
    return `
      <div class="gallery__placeholder" style="background:${plateFor(index)}">
        ${PLACEHOLDER_SVG}
        ${forLightbox ? '' : `<span class="gallery__placeholder-index">${indexLabel} / ${String(galleryData.length).padStart(2, '0')}</span>`}
      </div>`;
  }

  function buildTile(item, index) {
    const el = document.createElement('div');
    el.className = 'gallery__item';
    el.style.setProperty('--d', `${(index % 4) * 0.08}s`);
    el.setAttribute('data-index', String(index));
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Open photo: ${item.caption}`);
    el.innerHTML = `
      ${mediaMarkup(item, index, false)}
      <div class="gallery__overlay">
        <span class="gallery__caption">${escapeHtml(item.caption)}</span>
      </div>
    `;
    return el;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  function loadData() {
    const photos = SETTINGS.galleryPhotos || [];
    if (!photos.length) {
      return [1,2,3,4,5,6,7,8].map((n) => ({
        id: `g${n}`,
        caption: 'Add a caption for this memory',
        src: null
      }));
    }
    return photos.map((item, i) => ({
      id: `g${i + 1}`,
      caption: item.caption || '',
      src: item.file ? `assets/images/${item.file}` : null
    }));
  }

  function renderGrid(data) {
    const grid = document.querySelector('.gallery__grid');
    if (!grid) return;
    grid.innerHTML = '';
    data.forEach((item, i) => grid.appendChild(buildTile(item, i)));
  }

  function openLightbox(index) {
    activeIndex = index;
    const lightbox  = document.querySelector('.lightbox');
    const mediaWrap = lightbox?.querySelector('.lightbox__media-wrap');
    const caption   = lightbox?.querySelector('.lightbox__caption');
    if (!lightbox || !mediaWrap || !caption) return;

    const item = galleryData[index];
    mediaWrap.innerHTML = mediaMarkup(item, index, true);
    caption.textContent = item.caption || '';

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox() {
    const lightbox = document.querySelector('.lightbox');
    lightbox?.classList.remove('is-open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function step(delta) {
    if (!galleryData.length) return;
    activeIndex = (activeIndex + delta + galleryData.length) % galleryData.length;
    openLightbox(activeIndex);
  }

  function bindEvents() {
    const grid     = document.querySelector('.gallery__grid');
    const lightbox = document.querySelector('.lightbox');

    grid?.addEventListener('click', (e) => {
      const tile = e.target.closest('.gallery__item');
      if (!tile) return;
      openLightbox(Number(tile.getAttribute('data-index')));
    });

    grid?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tile = e.target.closest('.gallery__item');
      if (!tile) return;
      e.preventDefault();
      openLightbox(Number(tile.getAttribute('data-index')));
    });

    lightbox?.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
    lightbox?.querySelector('.lightbox__nav--prev')?.addEventListener('click', () => step(-1));
    lightbox?.querySelector('.lightbox__nav--next')?.addEventListener('click', () => step(1));

    lightbox?.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox?.classList.contains('is-open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function initGallery() {
    galleryData = loadData();
    renderGrid(galleryData);
    bindEvents();

    const tiles = document.querySelectorAll('.gallery__item');
    if (OCEAN.config.prefersReducedMotion) {
      tiles.forEach((t) => t.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    tiles.forEach((t) => observer.observe(t));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }
})(window, document);
