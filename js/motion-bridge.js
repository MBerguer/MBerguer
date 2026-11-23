/**
 * GRAND PRIX TELEMETRY // MOTION BRIDGE (Lenis 1.1 + GSAP ScrollTrigger)
 * Provides unified kinetic inertial scrolling and frame-synchronized GSAP ticker.
 */

(function () {
  'use strict';

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

  // Smooth fade-in and parallax reveal for scrollytelling sections
  function initSmoothSectionTransitions() {
    const sections = document.querySelectorAll('.scrolly-section');
    if (!sections.length) return;

    sections.forEach((sec, idx) => {
      if (idx === 0 || sec.id === 'hero-section') {
        sec.classList.add('section-in-view');
      }
    });

    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-in-view');
          } else if (entry.boundingClientRect.top > window.innerHeight * 0.82) {
            entry.target.classList.remove('section-in-view');
          }
        });
      }, {
        threshold: [0.06, 0.18],
        rootMargin: '0px 0px -6% 0px'
      });

      sections.forEach((sec) => io.observe(sec));
    } else {
      sections.forEach((sec) => sec.classList.add('section-in-view'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothSectionTransitions);
  } else {
    initSmoothSectionTransitions();
  }

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
