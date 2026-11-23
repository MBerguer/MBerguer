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

    let camX = 0;
    let camY = 0;
    let camScale = 1.0;
    let camInitialized = false;

    // 3. Central Render Loop with Delta Time
    let lastTime = performance.now();
    function tick(now) {
      if (isSuspended) {
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1); // Clamp delta time to avoid large jumps
      lastTime = now;

      // 1. Clear full canvas viewport in device coordinates
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // 2. Dynamic Camera Transform (Centered Overview in Scrollytelling, Chase Camera in Free-Drive)
      const isFreeDrive = window.FreeDriveManager && window.FreeDriveManager.isActive;
      const kart = window.appEngine && window.appEngine.kart;

      let targetX = 0;
      let targetY = 0;
      let targetScale = 1.0;

      if (isFreeDrive && kart) {
        // Chase Camera: keeps the player kart perfectly centered in viewport
        const chaseScale = Math.min(Math.max(width / 950, 0.85), 1.25);
        targetScale = chaseScale;
        targetX = width / 2 - kart.x * chaseScale;
        targetY = height / 2 - kart.y * chaseScale;
      } else if (window.ScrollyCar) {
        // Scrollytelling Mode: dynamic lateral framing keeping ScrollyCar in prominent view
        const car = window.ScrollyCar;
        const scrollyScale = Math.min(Math.max(width / 1200, 0.72), 1.05);
        targetScale = scrollyScale;

        // Position car in visible lateral margins beside bento cards when viewport allows
        if (width >= 1150) {
          const cardWidth = Math.min(width - 240, 960);
          const leftGutter = Math.max(70, (width - cardWidth) / 2 - 45);
          const rightGutter = Math.min(width - 70, (width + cardWidth) / 2 + 45);
          const desiredScreenX = car.x < 620 ? leftGutter : rightGutter;
          targetX = desiredScreenX - car.x * scrollyScale;
        } else {
          // Narrower viewports: centered overview with gentle lateral tracking
          const centerOverviewX = (width - 1280 * scrollyScale) / 2;
          const lateralBias = (car.x < 620 ? 0.08 : -0.08) * width;
          targetX = centerOverviewX + lateralBias;
        }

        // Vertical tracking centered around track midpoint with smooth vertical influence
        const centerY = (height - 960 * scrollyScale) / 2;
        const verticalBias = (480 - car.y) * 0.25 * scrollyScale;
        targetY = centerY + verticalBias;
      } else {
        // Scrollytelling Overview: scales and centers the full 1280x960 circuit
        const overviewScale = Math.min(width / 1280, height / 960, 1.0);
        targetScale = overviewScale;
        targetX = (width - 1280 * overviewScale) / 2;
        targetY = (height - 960 * overviewScale) / 2;
      }

      if (!camInitialized) {
        camX = targetX;
        camY = targetY;
        camScale = targetScale;
        camInitialized = true;
      } else {
        const lerpFactor = isFreeDrive ? Math.min(1, 12 * dt) : Math.min(1, 8 * dt);
        camX += (targetX - camX) * lerpFactor;
        camY += (targetY - camY) * lerpFactor;
        camScale += (targetScale - camScale) * lerpFactor;
      }

      ctx.save();
      ctx.translate(camX, camY);
      ctx.scale(camScale, camScale);

      renderCallbacks.forEach((cb) => {
        try {
          cb(ctx, width, height, dt, now);
        } catch (e) {
          console.error('[CanvasStage] Error in render callback:', e);
        }
      });

      ctx.restore();

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
      get camera() { return { x: camX, y: camY, scale: camScale }; },
      get worldScale() { return Math.min(width / 1280, height / 960, 1.0); },
      get worldOffsetX() { return (width - 1280 * Math.min(width / 1280, height / 960, 1.0)) / 2; },
      get worldOffsetY() { return (height - 960 * Math.min(width / 1280, height / 960, 1.0)) / 2; },
      screenToWorld(sx, sy) {
        const s = Math.min(width / 1280, height / 960, 1.0);
        const ox = (width - 1280 * s) / 2;
        const oy = (height - 960 * s) / 2;
        return { x: (sx - ox) / s, y: (sy - oy) / s };
      },
      worldToScreen(wx, wy) {
        const s = Math.min(width / 1280, height / 960, 1.0);
        const ox = (width - 1280 * s) / 2;
        const oy = (height - 960 * s) / 2;
        return { x: wx * s + ox, y: wy * s + oy };
      },

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

  if (document.getElementById('circuit-canvas')) {
    initCanvasStage();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasStage);
  } else {
    initCanvasStage();
  }
})();
