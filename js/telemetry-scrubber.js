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

    // 1. Live Lap Timer Ticker (F1 Style MM:SS.mmm)
    function updateTimer() {
      if (!isTimingActive || !lapTimeVal) return;
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const centis = Math.floor((elapsed % 1000) / 10);
      lapTimeVal.textContent =
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(centis).padStart(2, '0');
      requestAnimationFrame(updateTimer);
    }
    requestAnimationFrame(updateTimer);

    // 2. Scroll Progress Synchronization
    function updateScrubber() {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

      if (progressBar) {
        progressBar.style.width = (progress * 100).toFixed(2) + '%';
      }

      // Update active sector pill
      const sections = [
        { id: '#hero-section', sector: 0 },
        { id: '#sector-01', sector: 1 },
        { id: '#sector-02', sector: 2 },
        { id: '#sector-03', sector: 3 },
        { id: '#sector-04', sector: 4 },
        { id: '#sector-05', sector: 5 }
      ];

      let currentSector = 0;
      sections.forEach((sec) => {
        const el = document.querySelector(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) {
            currentSector = sec.sector;
          }
        }
      });

      sectorPills.forEach((pill) => {
        const s = parseInt(pill.getAttribute('data-sector') || '0', 10);
        if (s === currentSector) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
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
