/**
 * depth-fx.js
 * Mirrors the perf tier already computed in config.js onto <html> as
 * classes, so the new wave/caustic/fog layers in ocean-depth-fx.css can
 * scale themselves down (or off) on mobile/low-power devices via plain
 * CSS — no extra rAF loop needed for these, since they're transform/opacity
 * driven and the browser compositor handles them cheaply on its own.
 */
(function (window, document) {
  'use strict';

  var OCEAN = window.OCEAN;
  var tier = (OCEAN && OCEAN.config && OCEAN.config.perfTier) || 'mid';
  var reduced = !!(OCEAN && OCEAN.config && OCEAN.config.prefersReducedMotion);

  var root = document.documentElement;
  root.classList.remove('perf-low', 'perf-mid', 'perf-high');
  root.classList.add('perf-' + (tier === 'off' ? 'low' : tier));
  if (tier === 'off' || reduced) root.classList.add('reduced-motion');
})(window, document);
