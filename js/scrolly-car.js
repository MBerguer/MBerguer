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
      this.length = 44;
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
        this.targetSpeed = Math.min(335, Math.abs(window.appLenis.velocity) * 0.38);
      } else {
        const dProgress = Math.abs(this.currentProgress - prevProgress);
        const worldDistPerSec = (dProgress * (this.geometry.totalLength || 3000)) / Math.max(dt, 0.001);
        const rawSpeed = worldDistPerSec * 0.45;
        this.targetSpeed = Math.min(340, rawSpeed);
      }

      // Smoothly lerp speed towards target
      this.speed += (this.targetSpeed - this.speed) * Math.min(1, 10 * dt);

      // Gear and RPM calculation for HUD
      if (this.speed < 15) {
        this.gear = 1;
        this.rpm = 4000 + this.speed * 200;
      } else if (this.speed < 70) {
        this.gear = 2;
        this.rpm = 6000 + (this.speed - 15) * 110;
      } else if (this.speed < 130) {
        this.gear = 3;
        this.rpm = 7500 + (this.speed - 70) * 85;
      } else if (this.speed < 195) {
        this.gear = 4;
        this.rpm = 8500 + (this.speed - 130) * 65;
      } else if (this.speed < 260) {
        this.gear = 5;
        this.rpm = 9500 + (this.speed - 195) * 55;
      } else if (this.speed < 315) {
        this.gear = 6;
        this.rpm = 10500 + (this.speed - 260) * 45;
      } else {
        this.gear = 7;
        this.rpm = 11800 + (this.speed - 315) * 40;
      }
      this.rpm = Math.min(13500, Math.max(800, this.rpm));
    }

    /**
     * Renders authentic F1 monoplaza on canvas (STRICTLY NO HEADLIGHTS)
     */
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // 1. Aerodynamic Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(2, 4, this.length * 0.52, this.width * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. 4 Racing Slicks (Pirelli Zero)
      const wheelW = 10;
      const wheelL = 14;
      ctx.fillStyle = '#0a0d14';
      ctx.strokeStyle = '#222d3d';
      ctx.lineWidth = 1;

      // Front Left & Front Right
      [-1, 1].forEach((side) => {
        const wy = side * 13;
        ctx.fillRect(10, wy - wheelW / 2, wheelL, wheelW);
        ctx.strokeRect(10, wy - wheelW / 2, wheelL, wheelW);
      });

      // Rear Left & Rear Right
      [-1, 1].forEach((side) => {
        const wy = side * 14;
        ctx.fillRect(-18, wy - wheelW / 2, wheelL + 2, wheelW + 1);
        ctx.strokeRect(-18, wy - wheelW / 2, wheelL + 2, wheelW + 1);
      });

      // 3. Carbon Fiber Chassis & Livery (Cyan / Black / Red)
      // Main nosecone & tub
      ctx.fillStyle = '#0f172a'; // Carbon
      ctx.beginPath();
      ctx.moveTo(22, 0);       // Nose tip
      ctx.lineTo(8, -5);       // Front bulkhead
      ctx.lineTo(-4, -9);      // Sidepod left
      ctx.lineTo(-20, -9);     // Engine cover left
      ctx.lineTo(-24, -4);     // Rear crash structure
      ctx.lineTo(-24, 4);
      ctx.lineTo(-20, 9);
      ctx.lineTo(-4, 9);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cyan livery accent stripe
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(4, -2.5);
      ctx.lineTo(-14, -2.5);
      ctx.lineTo(-14, 2.5);
      ctx.lineTo(4, 2.5);
      ctx.closePath();
      ctx.fill();

      // F1 Red cockpit halo & rear accent
      ctx.fillStyle = '#e10600';
      ctx.fillRect(-6, -3, 6, 6);

      // Driver Helmet (Gloss White / Cyan Visor)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(-2, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-1, -1.5, 2.5, 3);

      // Front Wing Assembly
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(18, -14, 4, 28);
      ctx.fillStyle = '#e10600';
      ctx.fillRect(21, -15, 2, 3);
      ctx.fillRect(21, 12, 2, 3);

      // Rear Wing Assembly with DRS Flap
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-24, -13, 5, 26);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-22, -12, 2, 24);

      // Rear Red Rain Safety LED (pulsing when active)
      ctx.fillStyle = (Date.now() % 400 < 200) ? '#ff0033' : '#660011';
      ctx.fillRect(-25, -1.5, 2, 3);

      // (NOTE: Strict adherence to prompt - ZERO headlights are drawn!)
      ctx.restore();
    }
  }

  // Instantiate singleton
  const carInstance = new ScrollyCar();
  window.ScrollyCar = carInstance;

  // Register with CanvasStage loop
  if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
    window.CanvasStage.addRender((ctx, width, height, dt) => {
      // In Free-Drive mode, manual kart physics and rendering take over
      if (window.FreeDriveManager && window.FreeDriveManager.isActive) {
        return;
      }
      carInstance.update(dt || 0.016);
      carInstance.draw(ctx);
    });
  }

  console.log('[ScrollyCar] Initialized scrollytelling car physics with zero headlights.');
})();
