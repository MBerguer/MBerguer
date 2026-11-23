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
      // Cap DPR to 1.25 for peak 60 FPS performance on ultra-dense displays (e.g. Retina / 4K)
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
      ctx.scale(dpr, dpr);

      // Fast image smoothing quality to eliminate bicubic re-sampling overhead
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';

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
    let camVelX = 0;
    let camVelY = 0;
    let camInitialized = false;

    // Quintic C2 smoothstep (0 velocity and 0 acceleration at endpoints)
    function quinticSmooth(edge0, edge1, x) {
      const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

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
        const car = window.ScrollyCar;
        const scrollyScale = Math.min(Math.max(width / 1200, 0.75), 1.05);
        targetScale = scrollyScale;

        // Continuous C2 quintic blend between left and right gutters (eliminates abrupt midline snap)
        const sideBlend = quinticSmooth(400, 880, car.x);

        if (width >= 1150) {
          const cardWidth = Math.min(width - 240, 960);
          const marginWidth = (width - cardWidth) / 2;
          const leftCenter = Math.max(90, marginWidth * 0.48);
          const rightCenter = Math.min(width - 90, width - marginWidth * 0.48);
          const desiredScreenX = leftCenter + (rightCenter - leftCenter) * sideBlend;
          targetX = desiredScreenX - car.x * scrollyScale;
        } else {
          const leftSide = width * 0.14;
          const rightSide = width * 0.86;
          const desiredScreenX = leftSide + (rightSide - leftSide) * sideBlend;
          targetX = desiredScreenX - car.x * scrollyScale;
        }

        // Keep ScrollyCar at 42% viewport height (clear of top-bar and bottom cockpit-hud)
        const desiredScreenY = height * 0.42;
        targetY = desiredScreenY - car.y * scrollyScale;
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
        camVelX = 0;
        camVelY = 0;
        camInitialized = true;
      } else if (isFreeDrive) {
        const lerpFactor = Math.min(1, 10 * dt);
        camX += (targetX - camX) * lerpFactor;
        camY += (targetY - camY) * lerpFactor;
        camScale += (targetScale - camScale) * lerpFactor;
        camVelX = 0;
        camVelY = 0;
      } else {
        // Critically-damped spring-damper velocity smoothing for silky scrollytelling camera motion
        const omega = 4.2; // Natural frequency (rad/s) - gentle, non-violent camera glide
        const zeta = 1.05; // Slightly overdamped to prevent any overshoot oscillation
        const ax = omega * omega * (targetX - camX) - 2 * zeta * omega * camVelX;
        const ay = omega * omega * (targetY - camY) - 2 * zeta * omega * camVelY;
        camVelX += ax * dt;
        camVelY += ay * dt;
        camX += camVelX * dt;
        camY += camVelY * dt;
        camScale += (targetScale - camScale) * (1 - Math.exp(-3.5 * dt));
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
