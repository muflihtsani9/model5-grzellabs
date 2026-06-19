/**
 * config.js
 * Central runtime configuration. All user-facing values come from
 * /config/settings.js — do not hardcode anything here.
 */
(function (window) {
  'use strict';

  const S = window.OCEAN_SETTINGS || {};

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer      = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen        = window.innerWidth < 720;

  function getPerfTier() {
    if (prefersReducedMotion)                      return 'off';
    if (isSmallScreen || isCoarsePointer)          return 'low';
    if (window.innerWidth < 1280)                  return 'mid';
    return 'high';
  }

  window.OCEAN = {
    config: {
      sections: [
        { id: 'hero',     label: 'Surface'   },
        { id: 'memories', label: 'Memories'  },
        { id: 'gallery',  label: 'Gallery'   },
        { id: 'letter',   label: 'The Letter'},
        { id: 'wishes',   label: 'Wishes'    },
        { id: 'ending',   label: 'Resurface' }
      ],
      recipientName: S.recipientName || 'You',
      audioTracks:   S.musicTracks   || [],
      perfTier:      getPerfTier(),
      prefersReducedMotion
    },
    state: {
      loaded: false,
      currentSection: 'hero',
      scrollDepthMeters: 0
    },
    bus: {
      _listeners: {},
      on(evt, fn) {
        (this._listeners[evt] = this._listeners[evt] || []).push(fn);
        return () => this.off(evt, fn);
      },
      off(evt, fn) {
        if (!this._listeners[evt]) return;
        this._listeners[evt] = this._listeners[evt].filter((f) => f !== fn);
      },
      emit(evt, payload) {
        (this._listeners[evt] || []).forEach((fn) => {
          try { fn(payload); } catch (e) { console.error('[OCEAN bus]', evt, e); }
        });
      }
    },
    utils: {
      clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
      lerp(a, b, t)      { return a + (b - a) * t; },
      rand(min, max)     { return Math.random() * (max - min) + min; },
      throttleRaf(fn) {
        let scheduled = false;
        return function throttled(...args) {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => { scheduled = false; fn.apply(this, args); });
        };
      },
      debounce(fn, wait) {
        let t;
        return function debounced(...args) {
          clearTimeout(t);
          t = setTimeout(() => fn.apply(this, args), wait);
        };
      }
    }
  };
})(window);
