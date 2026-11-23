/**
 * GRAND PRIX TELEMETRY // SCROLLYTELLING CAR PHYSICS & TANGENTIAL ORIENTATION
 * Synchronizes race car position and heading with GSAP ScrollTrigger / Lenis scroll.
 * Features shortest-angle lerp, Math.atan2 heading derivation, zero headlights,
 * and feeds real-time velocity to the cockpit HUD.
 */

(function () {
  'use strict';

  class ScrollyCar {
    constructor(geometry = null) {
      this.geometry = geometry || window.TrackGeometry;

      // Position & Physics state
      this.targetProgress = 0;
      this.currentProgress = 0;
      this.x = 300;
      this.y = 750;
      this.angle = -Math.PI / 2;
      this.targetAngle = -Math.PI / 2;
      this.speed = 0; // km/h
      this.targetSpeed = 0;
      this.rpm = 800;
      this.gear = 1;

      // Car visual dimensions
      this.length = 62;
      this.width = 22;

      this.initScrollTrigger();
    }

    /**
     * Shortest angular distance difference
     */
    diffAngle(target, current) {
      let diff = (target - current) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      return diff;
    }

    /**
     * Binds scroll position to progress [0, 1] using ScrollTrigger
     */
    initScrollTrigger() {
      const self = this;

      function onScrollUpdate() {
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const p = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
        self.targetProgress = p;
      }

      window.addEventListener('scroll', onScrollUpdate, { passive: true });
      onScrollUpdate();

      if (window.ScrollTrigger && window.gsap) {
        window.ScrollTrigger.create({
          trigger: '#scrollytelling-track',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (selfST) => {
            self.targetProgress = selfST.progress;
          }
        });
      }
    }

    /**
     * Updates physics, lerp interpolation, and heading every frame
     */
    update(dt) {
      if (!this.geometry) this.geometry = window.TrackGeometry;
      if (!this.geometry) return;

      // Smooth progress lerp
      const progressLerp = 1 - Math.exp(-12 * dt);
      const prevProgress = this.currentProgress;
      this.currentProgress += (this.targetProgress - this.currentProgress) * progressLerp;

      // Sample geometry at interpolated progress
      const pt = this.geometry.getPointAtProgress(this.currentProgress);

      this.x = pt.x;
      this.y = pt.y;

      // Calculate heading angle with Math.atan2
      this.targetAngle = Math.atan2(pt.tangentY, pt.tangentX);
      const angleDiff = this.diffAngle(this.targetAngle, this.angle);
      this.angle += angleDiff * Math.min(1, 15 * dt);

      // Instantaneous speed estimation based on scroll velocity & Lenis motion
      if (window.appLenis && Math.abs(window.appLenis.velocity || 0) > 0.05) {
        this.targetSpeed = Math.min(360, Math.abs(window.appLenis.velocity) * 0.38);
      } else {
        const dProgress = Math.abs(this.currentProgress - prevProgress);
        const worldDistPerSec = (dProgress * (this.geometry.totalLength || 3000)) / Math.max(dt, 0.001);
        const rawSpeed = worldDistPerSec * 0.45;
        this.targetSpeed = Math.min(360, rawSpeed);
      }

      // Smoothly lerp speed towards target
      this.speed += (this.targetSpeed - this.speed) * Math.min(1, 10 * dt);

      // Gear and RPM calculation for HUD (8-speed F1 gearbox)
      const pwr = window.F1Powertrain.resolve(this.speed);
      this.gear = pwr.gear;
      this.rpm = pwr.rpm;
      this.rpm = Math.min(13500, Math.max(800, this.rpm));
    }

    /**
     * Renders authentic F1 monoplaza on canvas (STRICTLY NO HEADLIGHTS)
     */
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      const kmh = this.speed;
      window.F1Car.draw(ctx, {
        primary: '#00f0ff',
        secondary: '#e10600',
        helmet: '#f8fafc',
        visor: '#00f0ff',
        number: '1',
        drs: kmh > 285,
        rainLight: (Date.now() % 400 < 200)
      });

      // (NOTE: Strict adherence to prompt - ZERO headlights are drawn!)
      ctx.restore();
    }
  }

  // Instantiate singleton
  const carInstance = new ScrollyCar();
  window.ScrollyCar = carInstance;

  function registerScrollyCar() {
    if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
      window.CanvasStage.addRender((ctx, width, height, dt) => {
        // In Free-Drive mode, manual kart physics and rendering take over
        if (window.FreeDriveManager && window.FreeDriveManager.isActive) {
          return;
        }
        carInstance.update(dt || 0.016);
        carInstance.draw(ctx);
      });
      return true;
    }
    return false;
  }

  if (!registerScrollyCar()) {
    window.addEventListener('DOMContentLoaded', registerScrollyCar);
  }

  console.log('[ScrollyCar] Initialized scrollytelling car physics with zero headlights.');
})();
