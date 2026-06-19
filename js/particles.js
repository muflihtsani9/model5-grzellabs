/**
 * particles.js
 * Single canvas-based system for ambient bubbles + drifting motes.
 * Replaces what would otherwise be 3-4 separate DOM-animation systems —
 * one rAF loop, one canvas, scaled by perf tier. This is the main reason
 * the page stays smooth on low-end mobile devices.
 */
(function (window, document) {
  'use strict';

  const OCEAN = window.OCEAN;

  function initParticles() {
    const canvas = document.getElementById('oceanCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    const tier = OCEAN.config.perfTier;
    if (tier === 'off') {
      canvas.style.display = 'none';
      return;
    }

    const COUNTS = { low: 45, mid: 80, high: 140 };
    const particleCount = COUNTS[tier] || 60;

    let width, height, dpr;
    let particles = [];
    let rafId = null;
    let running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle() {
      const isBubble = Math.random() > 0.15; // 85% chance to be a bubble
      return {
        x: Math.random() * width,
        y: height + Math.random() * height,
        r: isBubble ? OCEAN.utils.rand(2, 8) : OCEAN.utils.rand(0.6, 2.2),
        speed: isBubble ? OCEAN.utils.rand(16, 40) : OCEAN.utils.rand(5, 15),
        drift: OCEAN.utils.rand(-14, 14),
        sway: OCEAN.utils.rand(0.4, 1.2),
        phase: Math.random() * Math.PI * 2,
        alpha: isBubble ? OCEAN.utils.rand(0.3, 0.7) : OCEAN.utils.rand(0.3, 0.68),
        isBubble
      };
    }

    function seed() {
      particles = Array.from({ length: particleCount }, makeParticle);
    }

    let lastT = performance.now();
    function tick(t) {
      if (!running) return;
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += dt * p.sway;
        p.y -= p.speed * dt;
        const x = p.x + Math.sin(p.phase) * 10;

        if (p.y < -20) {
          particles[i] = makeParticle();
          particles[i].y = height + 10;
          continue;
        }

        ctx.beginPath();
        if (p.isBubble) {
          ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(x - p.r * 0.3, p.y - p.r * 0.3, 0, x, p.y, p.r);
          grad.addColorStop(0, `rgba(255,255,255,${p.alpha})`);
          grad.addColorStop(0.7, `rgba(143,227,240,${p.alpha * 0.35})`);
          grad.addColorStop(1, 'rgba(143,227,240,0)');
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = `rgba(244,249,255,${p.alpha * 0.4})`;
          ctx.stroke();
        } else {
          ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(143,227,240,${p.alpha})`;
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (rafId) return;
      running = true;
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    resize();
    seed();
    start();

    window.addEventListener('resize', OCEAN.utils.debounce(() => {
      resize();
      seed();
    }, 250));

    // Pause when tab hidden — saves battery, no visible gap on return.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticles);
  } else {
    initParticles();
  }
})(window, document);