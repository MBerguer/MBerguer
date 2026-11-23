/**
 * GRAND PRIX TELEMETRY // INTERACTIVE LAP PROGRESS SCRUBBER HUD
 * Maps 0-100% lap telemetry progress, provides sector navigation pills (S1-S5),
 * and live lap timing ticker.
 */

(function () {
  'use strict';

  function initScrubber() {
    const progressBar = document.getElementById('lap-progress-bar');
    const progressTrack = document.getElementById('lap-progress-track');
    const sectorPills = document.querySelectorAll('.sector-pill');
    const lapTimeVal = document.getElementById('lap-time-val');

    let startTime = Date.now();
    let isTimingActive = true;
    let lastTimerUpdate = 0;

    // 1. Live Lap Timer Ticker (F1 Style MM:SS.mmm, throttled to 15 FPS for peak performance)
    function updateTimer() {
      if (!isTimingActive || !lapTimeVal) return;
      const now = Date.now();
      if (now - lastTimerUpdate >= 65) {
        lastTimerUpdate = now;
        const elapsed = now - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const centis = Math.floor((elapsed % 1000) / 10);
        lapTimeVal.textContent =
          String(minutes).padStart(2, '0') + ':' +
          String(seconds).padStart(2, '0') + '.' +
          String(centis).padStart(2, '0');
      }
      requestAnimationFrame(updateTimer);
    }
    requestAnimationFrame(updateTimer);

    // Cached sector elements for zero-query DOM traversal in scroll listener
    const sections = [
      { id: '#hero-section', sector: 0, el: document.querySelector('#hero-section') },
      { id: '#sector-01', sector: 1, el: document.querySelector('#sector-01') },
      { id: '#sector-02', sector: 2, el: document.querySelector('#sector-02') },
      { id: '#sector-03', sector: 3, el: document.querySelector('#sector-03') },
      { id: '#sector-04', sector: 4, el: document.querySelector('#sector-04') },
      { id: '#sector-05', sector: 5, el: document.querySelector('#sector-05') }
    ];

    let lastActiveSector = -1;
    let lastProgressStr = '';

    // 2. Scroll Progress Synchronization
    function updateScrubber() {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

      const pStr = (progress * 100).toFixed(1) + '%';
      if (progressBar && pStr !== lastProgressStr) {
        progressBar.style.width = pStr;
        lastProgressStr = pStr;
      }

      let currentSector = 0;
      const threshold = window.innerHeight * 0.45;
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const el = sec.el || (sec.el = document.querySelector(sec.id));
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            currentSector = sec.sector;
          }
        }
      }

      if (currentSector !== lastActiveSector) {
        lastActiveSector = currentSector;
        sectorPills.forEach((pill) => {
          const s = parseInt(pill.getAttribute('data-sector') || '0', 10);
          if (s === currentSector) {
            pill.classList.add('active');
          } else {
            pill.classList.remove('active');
          }
        });
      }
    }

    window.addEventListener('scroll', updateScrubber, { passive: true });
    updateScrubber();

    // 3. Track Click Scrubbing
    if (progressTrack) {
      progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = ratio * maxScroll;

        if (window.MotionBridge && typeof window.MotionBridge.scrollTo === 'function') {
          window.MotionBridge.scrollTo(targetScroll, { duration: 1.0 });
        } else if (window.appLenis) {
          window.appLenis.scrollTo(targetScroll, { duration: 1.0 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      });
    }

    // 4. Sector Navigation Pills
    sectorPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const target = pill.getAttribute('data-target');
        if (!target) return;
        const targetEl = document.querySelector(target);
        if (!targetEl) return;

        if (window.MotionBridge && typeof window.MotionBridge.scrollTo === 'function') {
          window.MotionBridge.scrollTo(target, { offset: -60, duration: 1.2 });
        } else if (window.appLenis) {
          window.appLenis.scrollTo(target, { offset: -60, duration: 1.2 });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Public Telemetry Scrubber API
    window.TelemetryScrubber = {
      resetTimer() {
        startTime = Date.now();
      },
      updateScrubber
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrubber);
  } else {
    initScrubber();
  }
})();
