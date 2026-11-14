/**
 * GRAND PRIX TELEMETRY // SECTOR 2: ABUSE 2026 2D DYNAMIC RAYTRACING WIDGET
 * Interactive 2D volumetric lightcaster and shadow projection engine.
 * Features polygonal ray-segment intersection, light cone falloff, and
 * DOS 1996 flat-shading vs C++20 2026 dynamic raytracing toggle.
 */

(function () {
  'use strict';

  class RaytracingWidget {
    constructor(canvasId = 'raytracing-canvas', toggleId = 'btn-raytrace-mode') {
      this.canvas = document.getElementById(canvasId);
      this.toggleBtn = document.getElementById(toggleId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      this.mode = 'CPP20'; // 'CPP20' | 'DOS1996'
      this.lightX = 140;
      this.lightY = 100;
      this.isHovered = false;

      // Obstacle walls & columns in local canvas coordinates
      this.obstacles = [
        // Outer boundaries
        [{ x: 0, y: 0 }, { x: 480, y: 0 }, { x: 480, y: 220 }, { x: 0, y: 220 }],
        // Industrial pillar 1
        [{ x: 80, y: 50 }, { x: 130, y: 50 }, { x: 130, y: 100 }, { x: 80, y: 100 }],
        // Industrial pillar 2
        [{ x: 220, y: 110 }, { x: 270, y: 110 }, { x: 270, y: 170 }, { x: 220, y: 170 }],
        // Crate obstacle
        [{ x: 340, y: 40 }, { x: 400, y: 40 }, { x: 400, y: 90 }, { x: 340, y: 90 }]
      ];

      this.segments = [];
      this.buildSegments();

      this.initEvents();
      this.startLoop();
    }

    buildSegments() {
      this.segments = [];
      this.obstacles.forEach((poly) => {
        for (let i = 0; i < poly.length; i++) {
          const p1 = poly[i];
          const p2 = poly[(i + 1) % poly.length];
          this.segments.push({ a: p1, b: p2 });
        }
      });
    }

    initEvents() {
      if (!this.canvas) return;

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.lightX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.lightY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        this.isHovered = true;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.isHovered = false;
      });

      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', () => {
          this.mode = this.mode === 'CPP20' ? 'DOS1996' : 'CPP20';
          this.toggleBtn.textContent = this.mode === 'CPP20' ? '⚡ MODE: C++20 RAYTRACING (2026)' : '🕹️ MODE: CLASSIC DOS FLAT (1996)';
          this.toggleBtn.classList.toggle('dos-mode', this.mode === 'DOS1996');
        });
      }
    }

    /**
     * Casts a ray from (ox, oy) at angle theta against all scene segments
     */
    castRay(ox, oy, angle) {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      let closestDist = Infinity;
      let hitPoint = null;

      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        const sx = seg.b.x - seg.a.x;
        const sy = seg.b.y - seg.a.y;

        const denom = dx * sy - dy * sx;
        if (Math.abs(denom) < 1e-6) continue;

        const t = ((seg.a.x - ox) * sy - (seg.a.y - oy) * sx) / denom;
        const u = ((seg.a.x - ox) * dy - (seg.a.y - oy) * dx) / denom;

        if (t > 0 && u >= 0 && u <= 1) {
          if (t < closestDist) {
            closestDist = t;
            hitPoint = {
              x: ox + dx * t,
              y: oy + dy * t,
              dist: t
            };
          }
        }
      }

      return hitPoint || { x: ox + dx * 500, y: oy + dy * 500, dist: 500 };
    }

    /**
     * Calculates full visibility polygon by casting rays to every unique vertex
     */
    computeVisibilityPolygon(ox, oy) {
      const angles = [];

      // Collect angles to all obstacle vertices
      this.obstacles.forEach((poly) => {
        poly.forEach((pt) => {
          const a = Math.atan2(pt.y - oy, pt.x - ox);
          // Cast rays slightly offset to both sides of vertex corners
          angles.push(a - 0.0001, a, a + 0.0001);
        });
      });

      // Sort angles clockwise
      angles.sort((a, b) => a - b);

      const points = [];
      angles.forEach((angle) => {
        const hit = this.castRay(ox, oy, angle);
        points.push(hit);
      });

      return points;
    }

    startLoop() {
      const self = this;
      function tick() {
        self.render();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    render() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Idle animated light source when mouse is not over canvas
      if (!this.isHovered) {
        const t = Date.now() * 0.0018;
        this.lightX = w * 0.5 + Math.cos(t) * 90;
        this.lightY = h * 0.5 + Math.sin(t * 1.3) * 45;
      }

      // Base background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      if (this.mode === 'CPP20') {
        // --- C++20 DYNAMIC RAYTRACING PIPELINE ---
        const visPoints = this.computeVisibilityPolygon(this.lightX, this.lightY);

        if (visPoints.length > 2) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(visPoints[0].x, visPoints[0].y);
          for (let i = 1; i < visPoints.length; i++) {
            ctx.lineTo(visPoints[i].x, visPoints[i].y);
          }
          ctx.closePath();

          // Radial light gradient with purple/violet tone matching Abuse 2026 brand
          const grad = ctx.createRadialGradient(
            this.lightX, this.lightY, 4,
            this.lightX, this.lightY, 260
          );
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.95)');
          grad.addColorStop(0.35, 'rgba(139, 92, 246, 0.45)');
          grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.15)');
          grad.addColorStop(1, 'rgba(10, 13, 20, 0)');

          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();
        }

        // Draw light source emitter
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(this.lightX, this.lightY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // --- CLASSIC DOS 1996 FLAT SHADING ---
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, w, h);
      }

      // Draw obstacle boxes & columns
      this.obstacles.slice(1).forEach((poly, idx) => {
        ctx.save();
        ctx.fillStyle = this.mode === 'CPP20' ? '#0f172a' : '#312e81';
        ctx.strokeStyle = this.mode === 'CPP20' ? '#a855f7' : '#4f46e5';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Technical hatch / label inside pillar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '8px monospace';
        ctx.fillText(`COL_0${idx + 1}`, poly[0].x + 6, poly[0].y + 16);
        ctx.restore();
      });

      // Telemetry HUD overlay inside canvas
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.font = '10px monospace';
      ctx.fillText(`RAYS: ${this.mode === 'CPP20' ? this.obstacles.length * 4 * 3 : 0} | 144 FPS | C++20 SHADOW OCCLUSION`, 10, h - 10);
    }
  }

  window.RaytracingWidget = RaytracingWidget;

  function init() {
    if (document.getElementById('raytracing-canvas')) {
      window.activeRaytraceWidget = new RaytracingWidget();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
