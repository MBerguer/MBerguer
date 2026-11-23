/**
 * GRAND PRIX TELEMETRY // MOTION BRIDGE (Lenis 1.1 + GSAP ScrollTrigger)
 * Provides unified kinetic inertial scrolling and frame-synchronized GSAP ticker.
 */

(function () {
  'use strict';

  // Smooth fade-in and parallax reveal for scrollytelling sections (runs regardless of CDN state)
  function initSmoothSectionTransitions() {
    const sections = document.querySelectorAll('.scrolly-section');
    if (!sections.length) return;

    function updateSectionsVisibility() {
      const vh = window.innerHeight || 900;
      sections.forEach((sec, idx) => {
        if (idx === 0 || sec.id === 'hero-section') {
          sec.classList.remove('section-below-fold');
          return;
        }
        const rect = sec.getBoundingClientRect();
        // Only dim sections that haven't entered the bottom 8% of the viewport yet
        if (rect.top > vh * 0.92) {
          sec.classList.add('section-below-fold');
        } else {
          sec.classList.remove('section-below-fold');
        }
      });
    }

    window.addEventListener('scroll', updateSectionsVisibility, { passive: true });
    window.addEventListener('resize', updateSectionsVisibility, { passive: true });
    updateSectionsVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothSectionTransitions);
  } else {
    initSmoothSectionTransitions();
  }

  // 1. Check prerequisites loaded via CDN
  if (typeof window.Lenis === 'undefined' || typeof window.gsap === 'undefined') {
    console.warn('[MotionBridge] Waiting for Lenis and GSAP to load...');
    return;
  }

  // 2. Register GSAP Plugins
  if (window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
  if (window.ScrollToPlugin) {
    window.gsap.registerPlugin(window.ScrollToPlugin);
  }

  // 3. Initialize Lenis Smooth Scroll Engine (Tuned for silky velocity-aliased inertia)
  const lenis = new window.Lenis({
    lerp: 0.062,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.92,
    infinite: false,
  });

  window.appLenis = lenis;

  // 4. Zero-Lag Ticker Synchronization Bridge
  // Notify ScrollTrigger whenever Lenis updates scroll
  lenis.on('scroll', (e) => {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.update();
    }
  });

  // Drive Lenis RAF updates strictly from GSAP's optimized ticker
  window.gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Eliminate lag smoothing stuttering on high-refresh displays
  window.gsap.ticker.lagSmoothing(0);

  // 5. Public Motion Bridge API
  window.MotionBridge = {
    lenis: lenis,
    gsap: window.gsap,
    ScrollTrigger: window.ScrollTrigger,

    scrollTo(target, options = {}) {
      const opts = Object.assign({ offset: -60, duration: 1.2 }, options);
      lenis.scrollTo(target, opts);
    },

    pause() {
      lenis.stop();
    },

    resume() {
      lenis.start();
    }
  };

  console.log('[MotionBridge] Initialized Lenis + GSAP ScrollTrigger bridge successfully.');
})();
