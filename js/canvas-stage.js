/**
 * GRAND PRIX TELEMETRY // HIGH-DPI CANVAS STAGE & VISIBILITY LIFECYCLE
 * Manages crisp Retina/High-DPI canvas buffer scaling, debounced viewport resizing,
 * and lifecycle suspension on document visibilitychange (0% GPU/CPU when hidden).
 */

(function () {
  'use strict';

  function initCanvasStage() {
    const canvas = document.getElementById('circuit-canvas');
    if (!canvas) {
      console.warn('[CanvasStage] Canvas element #circuit-canvas not found.');
      return null;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    let dpr = 1;
    let width = 0;
    let height = 0;
    let isSuspended = false;
    let rafId = null;

    const renderCallbacks = new Set();
    const resizeCallbacks = new Set();

    // 1. High-DPI Viewport Resizing
    function resize() {
      // Cap DPR to 2 for performance on ultra-dense displays (e.g. Retina / 4K)
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
      ctx.scale(dpr, dpr);

      // Disable image smoothing for crisp pixel-art / technical lines if desired, or keep smooth
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Notify resize listeners
      resizeCallbacks.forEach((cb) => {
        try {
          cb(width, height, dpr);
        } catch (e) {
          console.error('[CanvasStage] Error in resize callback:', e);
        }
      });
    }

    // 2. Debounced Resize Listener using ResizeObserver & Window Resize
    let resizeTimer = null;
    function scheduleResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
      }, 50);
    }

    window.addEventListener('resize', scheduleResize, { passive: true });
    window.addEventListener('orientationchange', scheduleResize, { passive: true });

    // Initial sizing
    resize();

    // 3. Central Render Loop with Delta Time
    let lastTime = performance.now();
    function tick(now) {
      if (isSuspended) {
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1); // Clamp delta time to avoid large jumps
      lastTime = now;

      renderCallbacks.forEach((cb) => {
        try {
          cb(ctx, width, height, dt, now);
        } catch (e) {
          console.error('[CanvasStage] Error in render callback:', e);
        }
      });

      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!rafId && !isSuspended) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // 4. Page Visibility Lifecycle Management (0% GPU in inactive tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isSuspended = true;
        stopLoop();
        console.log('[CanvasStage] Document hidden -> Animation loop suspended.');
      } else {
        isSuspended = false;
        lastTime = performance.now();
        startLoop();
        console.log('[CanvasStage] Document visible -> Animation loop resumed.');
      }
    });

    startLoop();

    // 5. Public Canvas Stage API
    const StageAPI = {
      get canvas() { return canvas; },
      get ctx() { return ctx; },
      get width() { return width; },
      get height() { return height; },
      get dpr() { return dpr; },
      get isSuspended() { return isSuspended; },

      resize,

      addRender(callback) {
        renderCallbacks.add(callback);
      },

      removeRender(callback) {
        renderCallbacks.delete(callback);
      },

      onResize(callback) {
        resizeCallbacks.add(callback);
        // Call immediately with current dimensions
        callback(width, height, dpr);
      },

      removeResize(callback) {
        resizeCallbacks.delete(callback);
      }
    };

    window.CanvasStage = StageAPI;
    return StageAPI;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasStage);
  } else {
    initCanvasStage();
  }
})();
