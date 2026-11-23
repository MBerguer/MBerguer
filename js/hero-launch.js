/**
 * GRAND PRIX TELEMETRY // FIA 5-LIGHT START GANTRY & LAUNCH IMPULSE
 * Controls progressive arming of 5 FIA red starting lights during hero scroll,
 * followed by instantaneous Lights Out with tactile camera shake impulse and tire burnout.
 * Hardened with state hysteresis to eliminate 60Hz flickering and competing listeners.
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
    let lastLitCount = -1;
    let lastStatusKey = '';

    function triggerLaunchImpulse() {
      if (hasLaunched) return;
      hasLaunched = true;

      // 1. Camera Shake Impulse (+-3px)
      if (canvasViewport) {
        canvasViewport.classList.remove('camera-shake');
        requestAnimationFrame(() => {
          canvasViewport.classList.add('camera-shake');
          if (shakeTimer) clearTimeout(shakeTimer);
          shakeTimer = setTimeout(() => {
            canvasViewport.classList.remove('camera-shake');
          }, 500);
        });
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

    function updateGantry(p) {
      // p is normalized progression [0, 1] through the hero start sequence
      const clampedP = Math.min(Math.max(p, 0), 1.0);

      // Re-arm launch only when scrolled significantly back up (hysteresis)
      if (clampedP < 0.35) {
        hasLaunched = false;
      }

      // Light thresholds: 0 lights at launch, 1-5 red lights during arming
      let litCount = 0;
      let statusKey = '0';
      let label = 'SCROLL TO ARM STARTING LIGHTS';
      let color = 'var(--accent-amber)';

      if (clampedP >= 0.88) {
        litCount = 0; // LIGHTS OUT
        statusKey = 'launch';
        label = '🟢 LIGHTS OUT // TELEMETRY LAUNCH!';
        color = 'var(--accent-emerald)';
      } else if (clampedP > 0.72) {
        litCount = 5;
        statusKey = '5';
        label = '🔴 HOLD FOR LIGHTS OUT...';
        color = 'var(--accent-f1-red)';
      } else if (clampedP > 0.56) {
        litCount = 4;
        statusKey = '4';
        label = 'RPM PEAK 12,500 // CLUTCH ARMED';
        color = 'var(--accent-amber)';
      } else if (clampedP > 0.40) {
        litCount = 3;
        statusKey = '3';
        label = 'SYSTEM TELEMETRY SYNCHRONIZED';
        color = 'var(--accent-cyan)';
      } else if (clampedP > 0.24) {
        litCount = 2;
        statusKey = '2';
        label = 'START SEQUENCE ARMED';
        color = 'var(--text-dim)';
      } else if (clampedP > 0.08) {
        litCount = 1;
        statusKey = '1';
        label = 'START PROCEDURE COMMENCED';
        color = 'var(--text-dim)';
      }

      // Only mutate DOM lights if count changed
      if (litCount !== lastLitCount) {
        lastLitCount = litCount;
        lights.forEach((light, idx) => {
          if (idx < litCount) {
            light.classList.add('lit');
          } else {
            light.classList.remove('lit');
          }
        });
      }

      // Only mutate status text if state changed
      if (statusText && statusKey !== lastStatusKey) {
        lastStatusKey = statusKey;
        statusText.textContent = label;
        statusText.style.color = color;
      }

      // Trigger impulse when reaching Lights Out
      if (clampedP >= 0.88 && !hasLaunched) {
        triggerLaunchImpulse();
      }
    }

    // Unified single driver: GSAP ScrollTrigger if available, else native scroll listener
    const getGantryScrollDist = () => (window.innerWidth <= 900 ? 130 : 500);

    if (window.ScrollTrigger && window.gsap) {
      window.ScrollTrigger.create({
        trigger: '#hero-section',
        start: 'top top',
        end: () => `+=${getGantryScrollDist()}`,
        invalidateOnRefresh: true,
        pin: false,
        onUpdate: (self) => {
          updateGantry(self.progress);
        }
      });
      // Initial state
      updateGantry(0);
    } else {
      function onScrollFallback() {
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const p = Math.min(1.0, scrollY / getGantryScrollDist());
        updateGantry(p);
      }
      window.addEventListener('scroll', onScrollFallback, { passive: true });
      onScrollFallback();
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
