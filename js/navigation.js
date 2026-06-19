/**
 * navigation.js
 * Navbar active-link tracking + mobile drawer open/close.
 */
(function (window, document) {
  'use strict';

  const OCEAN = window.OCEAN;

  function initNavigation() {
    const navLinks = document.querySelectorAll('.navbar__link');
    const drawerLinks = document.querySelectorAll('.nav-drawer__link');
    const menuBtn = document.querySelector('.navbar__menu-btn');
    const closeBtn = document.querySelector('.nav-drawer__close');
    const drawer = document.querySelector('.nav-drawer');

    function setActive(sectionId) {
      const hasMatchingLink = Array.from(navLinks).some(
        (link) => link.getAttribute('data-scroll-to') === sectionId
      );
      // Sections like "ending" intentionally have no navbar link of their own —
      // keep whichever link was last active rather than clearing the indicator,
      // so it doesn't look like navigation broke right as the page concludes.
      if (!hasMatchingLink) return;

      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('data-scroll-to') === sectionId);
      });
      drawerLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('data-scroll-to') === sectionId);
      });
    }

    OCEAN.bus.on('section:change', setActive);
    // Sync immediately on boot too — if the page loads already "at" the
    // default section, smooth-scroll.js's change-detection has nothing to
    // diff against and may never emit, so don't rely on that alone.
    setActive(OCEAN.state.currentSection);

    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      document.body.classList.add('no-scroll');
      menuBtn?.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      menuBtn?.setAttribute('aria-expanded', 'false');
    }

    menuBtn?.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    OCEAN.bus.on('nav:close', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });

    drawer?.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})(window, document);