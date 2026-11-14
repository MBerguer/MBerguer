/**
 * GRAND PRIX TELEMETRY // FIA 5-LIGHT START GANTRY & LAUNCH IMPULSE
 * Controls progressive arming of 5 FIA red starting lights during hero scroll,
 * followed by instantaneous Lights Out with tactile camera shake impulse and tire burnout.
 */

(function () {
  'use strict';

  function initHeroLaunch() {
    const gantry = document.getElementById('fia-start-gantry');
    const lights = document.querySelectorAll('.gantry-light');
    const statusText = document.getElementById('gantry-status-text');
    const canvasViewport = document.getElementById('viewport-fixed-canvas');

    if (!gantry || lights.length === 0) return;

    let hasLaunched = false;
    let shakeTimer = null;

    function triggerLaunchImpulse() {
      if (hasLaunched) return;
      hasLaunched = true;

      // 1. Camera Shake Impulse (+-3px)
      if (canvasViewport) {
        canvasViewport.classList.remove('camera-shake');
        void canvasViewport.offsetWidth; // Force reflow
        canvasViewport.classList.add('camera-shake');
        if (shakeTimer) clearTimeout(shakeTimer);
        shakeTimer = setTimeout(() => {
          canvasViewport.classList.remove('camera-shake');
        }, 500);
      }

      // 2. Burnout Smoke & Sparks at launch grid
      if (window.ParticleSystem && window.ScrollyCar) {
        const car = window.ScrollyCar;
        window.ParticleSystem.emitSmoke(car.x, car.y, 16, -Math.cos(car.angle) * 80, -Math.sin(car.angle) * 80);
        window.ParticleSystem.emitSparks(car.x, car.y, 20, car.angle, 260);
      }

      // 3. Burnout Skidmarks on starting grid
      if (window.SkidmarksBuffer && window.ScrollyCar) {
        const car = window.ScrollyCar;
        const nx = -Math.sin(car.angle) * 12;
        const ny = Math.cos(car.angle) * 12;
        window.SkidmarksBuffer.addMark(
          { x: car.x + nx, y: car.y + ny },
          { x: car.x - nx, y: car.y - ny },
          0.9
        );
      }

      console.log('[HeroLaunch] LIGHTS OUT! Monoplaza launched with camera shake impulse.');
    }

    function updateGantry(progress) {
      // Pinning hero sequence occurs in the first 0.08 of total scroll (approx first 500px)
      const p = Math.min(progress / 0.07, 1.0);

      if (p < 0.85) {
        hasLaunched = false;
      }

      // Light thresholds
      const litCount = p >= 0.85 ? 0 : (
        p > 0.65 ? 5 :
        p > 0.50 ? 4 :
        p > 0.35 ? 3 :
        p > 0.20 ? 2 :
        p > 0.05 ? 1 : 0
      );

      lights.forEach((light, idx) => {
        if (idx < litCount) {
          light.classList.add('lit');
        } else {
          light.classList.remove('lit');
        }
      });

      if (!statusText) return;

      if (p >= 0.85) {
        statusText.textContent = '🟢 LIGHTS OUT // TELEMETRY LAUNCH!';
        statusText.style.color = 'var(--accent-emerald)';
        triggerLaunchImpulse();
      } else if (litCount === 5) {
        statusText.textContent = '🔴 HOLD FOR LIGHTS OUT...';
        statusText.style.color = 'var(--accent-f1-red)';
      } else if (litCount === 4) {
        statusText.textContent = 'RPM PEAK 12,500 // CLUTCH ARMED';
        statusText.style.color = 'var(--accent-amber)';
      } else if (litCount === 3) {
        statusText.textContent = 'SYSTEM TELEMETRY SYNCHRONIZED';
        statusText.style.color = 'var(--accent-cyan)';
      } else if (litCount === 2) {
        statusText.textContent = 'START SEQUENCE ARMED';
        statusText.style.color = 'var(--text-dim)';
      } else if (litCount === 1) {
        statusText.textContent = 'START PROCEDURE COMMENCED';
        statusText.style.color = 'var(--text-dim)';
      } else {
        statusText.textContent = 'SCROLL TO ARM STARTING LIGHTS';
        statusText.style.color = 'var(--accent-amber)';
      }
    }

    // Scroll listener
    function onScroll() {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      updateGantry(progress);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // GSAP ScrollTrigger Pinning for cinematic launch if GSAP available
    if (window.ScrollTrigger && window.gsap) {
      window.ScrollTrigger.create({
        trigger: '#hero-section',
        start: 'top top',
        end: '+=500',
        pin: false, // Smooth scrub without harsh abrupt pinning on mobile
        onUpdate: (self) => {
          updateGantry(self.progress * 0.08);
        }
      });
    }

    window.HeroLaunch = {
      updateGantry,
      triggerLaunchImpulse
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroLaunch);
  } else {
    initHeroLaunch();
  }
})();
