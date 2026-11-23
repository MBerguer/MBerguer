/**
 * GRAND PRIX TELEMETRY // MOBILE ON-SCREEN TOUCH CONTROLS (D-PAD & PEDALS)
 * Auto-detects touch events on mobile/tablets, activates on-screen touch pedals
 * and steering D-pad, and routes low-latency inputs to kart physics engine.
 */

(function () {
  'use strict';

  class TouchControls {
    constructor() {
      this.container = document.getElementById('mobile-controls');
      this.btnLeft = document.getElementById('btn-touch-left');
      this.btnRight = document.getElementById('btn-touch-right');
      this.btnUp = document.getElementById('btn-touch-up');
      this.btnDown = document.getElementById('btn-touch-down');
      this.btnDrift = document.getElementById('btn-touch-drift');

      this.isTouchDevice = false;
      this.inputState = {
        left: false,
        right: false,
        up: false,
        down: false,
        handbrake: false
      };

      this.initAutoDetect();
      this.initButtonBindings();
    }

    /**
     * Auto-detects touch capabilities dynamically on first touchstart
     */
    initAutoDetect() {
      const detect = () => {
        if (window.innerWidth <= 900) return;
        this.isTouchDevice = true;
        if (this.container) {
          this.container.classList.add('touch-active');
        }
        window.removeEventListener('touchstart', detect);
      };

      window.addEventListener('touchstart', detect, { passive: true, once: true });

      // Check media query for coarse pointer (only on viewports > 900px where Free-Drive is enabled)
      if (window.innerWidth > 900 && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        this.isTouchDevice = true;
        if (this.container) {
          this.container.classList.add('touch-active');
        }
      }
    }

    /**
     * Binds touchstart and touchend listeners with tactile haptic feedback
     */
    initButtonBindings() {
      const bind = (btn, key) => {
        if (!btn) return;

        const startAction = (e) => {
          e.preventDefault();
          this.inputState[key] = true;
          btn.classList.add('pressed');
          this.syncWithEngine();

          // Subtle haptic tick
          if (navigator.vibrate) {
            try { navigator.vibrate(12); } catch (_) {}
          }
        };

        const stopAction = (e) => {
          e.preventDefault();
          this.inputState[key] = false;
          btn.classList.remove('pressed');
          this.syncWithEngine();
        };

        btn.addEventListener('touchstart', startAction, { passive: false });
        btn.addEventListener('touchend', stopAction, { passive: false });
        btn.addEventListener('touchcancel', stopAction, { passive: false });

        // Mouse fallbacks for debugging
        btn.addEventListener('mousedown', startAction);
        btn.addEventListener('mouseup', stopAction);
        btn.addEventListener('mouseleave', stopAction);
      };

      bind(this.btnLeft, 'left');
      bind(this.btnRight, 'right');
      bind(this.btnUp, 'up');
      bind(this.btnDown, 'down');
      bind(this.btnDrift, 'handbrake');
    }

    /**
     * Propagates touch input state into global engine inputs
     */
    syncWithEngine() {
      if (window.appEngine && window.appEngine.input) {
        Object.assign(window.appEngine.input, this.inputState);
      }
    }
  }

  const defaultControls = new TouchControls();
  window.TouchControls = TouchControls;
  window.activeTouchControls = defaultControls;

  console.log('[TouchControls] Auto-detecting mobile D-pad and pedals.');
})();
