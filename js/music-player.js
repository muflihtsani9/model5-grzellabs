/**
 * music-player.js
 * Single-song card player dengan cover art, artist, progress bar, time, dan controls.
 * Config dari OCEAN_SETTINGS.musicTracks[0] (config/settings.js).
 */
(function (window, document) {
  'use strict';

  const SETTINGS = window.OCEAN_SETTINGS || {};

  function fmt(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function injectPlayerHTML() {
    const html = `
      <div class="music-player" role="region" aria-label="Background music player">
        <button class="music-player__fab" aria-label="Toggle music player" aria-expanded="false">
          <span class="music-player__fab-icon music-player__fab-icon--note">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
          </span>
          <span class="music-player__fab-icon music-player__fab-icon--close" style="display:none">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </span>
          <div class="music-player__fab-bars" aria-hidden="true"><span></span><span></span><span></span></div>
        </button>
        <div class="music-player__card" aria-hidden="true">
          <div class="music-player__cover-wrap">
            <img class="music-player__cover" src="" alt="Album cover">
          </div>
          <div class="music-player__meta">
            <span class="music-player__title"></span>
            <span class="music-player__artist"></span>
          </div>
          <div class="music-player__progress" role="progressbar" aria-label="Track progress">
            <div class="music-player__progress-fill"></div>
          </div>
          <div class="music-player__time-row">
            <span class="music-player__time-cur">0:00</span>
            <span class="music-player__time-dur">0:00</span>
          </div>
          <div class="music-player__bar">
            <button class="music-player__prev" aria-label="Previous track">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button class="music-player__toggle" aria-label="Play music">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="music-player__next" aria-label="Next track">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 8.5 6V6H16v12z"/></svg>
            </button>
          </div>
          <div class="music-player__bars" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function initMusic() {
    injectPlayerHTML();
    
    const player       = document.querySelector('.music-player');
    const toggleBtn    = player?.querySelector('.music-player__toggle');
    const prevBtn      = player?.querySelector('.music-player__prev');
    const nextBtn      = player?.querySelector('.music-player__next');
    const fabBtn       = player?.querySelector('.music-player__fab');
    const fabIconNote  = player?.querySelector('.music-player__fab-icon--note');
    const fabIconClose = player?.querySelector('.music-player__fab-icon--close');
    const coverImg     = player?.querySelector('.music-player__cover');
    const titleEl      = player?.querySelector('.music-player__title');
    const artistEl     = player?.querySelector('.music-player__artist');
    const progressBar  = player?.querySelector('.music-player__progress');
    const progressFill = player?.querySelector('.music-player__progress-fill');
    const timeCur      = player?.querySelector('.music-player__time-cur');
    const timeDur      = player?.querySelector('.music-player__time-dur');

    if (!player || !toggleBtn) return;

    const tracks = SETTINGS.musicTracks || [];
    const track  = tracks[0];
    if (!track) { player.style.display = 'none'; return; }

    const audio     = new Audio();
    audio.loop      = true;
    audio.volume    = 0.75;
    audio.preload   = 'metadata';
    audio.src       = track.src;

    let isPlaying = false;

    // ── Populate cover & meta ───────────────────────────────
    if (coverImg && track.cover) {
      coverImg.src = track.cover;
      coverImg.alt = track.title || 'Album cover';
    }
    if (titleEl)  titleEl.textContent  = track.title  || 'Play music';
    if (artistEl) artistEl.textContent = track.artist || '';

    // ── Time ────────────────────────────────────────────────
    audio.addEventListener('loadedmetadata', () => {
      if (timeDur) timeDur.textContent = fmt(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (timeCur)      timeCur.textContent       = fmt(audio.currentTime);
    });

    // ── Seek on click ────────────────────────────────────────
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        if (!audio.duration) return;
        const rect  = progressBar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * audio.duration;
      });
    }

    // ── Playback UI ──────────────────────────────────────────
    function iconPlay()  { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'; }
    function iconPause() { return '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'; }

    function setPlayingUI(playing) {
      isPlaying = playing;
      player.classList.toggle('is-playing', playing);
      toggleBtn.innerHTML = playing ? iconPause() : iconPlay();
      toggleBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    }

    async function play() {
      try {
        if (audio.currentTime === 0 && track.startTime) {
           audio.currentTime = track.startTime;
        }
        await audio.play();
        setPlayingUI(true);
      } catch (err) {
        console.warn('[music] blocked:', err.message);
        setPlayingUI(false);
      }
    }

    function pause() {
      audio.pause();
      setPlayingUI(false);
    }
    
    // global play for pin lock
    window.playOceanMusic = () => {
      if (!isPlaying) play();
    };

    // ── Listen to pin unlocked event ─────────────────────────
    window.addEventListener('pinUnlocked', () => {
      window.playOceanMusic();
    });

    // ── Handle browser autoplay policy by playing on first interaction
    const unlockAudio = () => {
      if (!isPlaying) {
        window.playOceanMusic();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('scroll', unlockAudio);
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('scroll', unlockAudio, { once: true });

    // ── FAB toggle ───────────────────────────────────────────
    if (fabBtn) {
      fabBtn.addEventListener('click', () => {
        const isOpen = player.classList.toggle('is-open');
        fabBtn.setAttribute('aria-expanded', isOpen);
        player.querySelector('.music-player__card')?.setAttribute('aria-hidden', !isOpen);
        if (fabIconNote)  fabIconNote.style.display  = isOpen ? 'none' : '';
        if (fabIconClose) fabIconClose.style.display = isOpen ? ''     : 'none';
      });
    }

    // ── Controls ─────────────────────────────────────────────
    toggleBtn.addEventListener('click', () => {
      if (isPlaying) pause(); else play();
    });

    // Prev/Next: lagu cuma 1, restart dari awal
    if (prevBtn) prevBtn.addEventListener('click', () => { audio.currentTime = track.startTime || 0; if (!isPlaying) play(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { audio.currentTime = track.startTime || 0; if (!isPlaying) play(); });

    window.addEventListener('pagehide', () => { if (isPlaying) audio.pause(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusic);
  } else {
    initMusic();
  }

})(window, document);
