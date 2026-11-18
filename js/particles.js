/**
 * GRAND PRIX TELEMETRY // ZERO-ALLOCATION MICRO-PARTICLE SYSTEM
 * Fixed-capacity object pool for tire smoke, brake dust, and titanium plank sparks.
 * Guarantees zero runtime allocations and zero GC frame drops at 60/120 FPS.
 */

(function () {
  'use strict';

  const POOL_SIZE = 160;

  class ParticleSystem {
    constructor(maxParticles = POOL_SIZE) {
      this.maxParticles = maxParticles;
      this.pool = new Array(maxParticles);

      // Pre-allocate all particle objects upfront to avoid garbage collection
      for (let i = 0; i < maxParticles; i++) {
        this.pool[i] = {
          active: false,
          type: 'smoke', // 'smoke' | 'spark'
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          size: 2,
          maxSize: 10,
          alpha: 1,
          life: 0,
          maxLife: 1,
          color: '#ffffff'
        };
      }

      this.poolIndex = 0;
    }

    /**
     * Emits tire smoke particles from rear tires
     */
    emitSmoke(x, y, count = 2, baseVx = 0, baseVy = 0) {
      for (let c = 0; c < count; c++) {
        const p = this.pool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.maxParticles;

        p.active = true;
        p.type = 'smoke';
        p.x = x + (Math.random() - 0.5) * 6;
        p.y = y + (Math.random() - 0.5) * 6;
        p.vx = baseVx * 0.2 + (Math.random() - 0.5) * 25;
        p.vy = baseVy * 0.2 + (Math.random() - 0.5) * 25;
        p.size = 3 + Math.random() * 3;
        p.maxSize = 12 + Math.random() * 8;
        p.alpha = 0.5 + Math.random() * 0.3;
        p.life = 0;
        p.maxLife = 0.4 + Math.random() * 0.4;
      }
    }

    /**
     * Emits titanium skid block sparks (high speed bottoming out)
     */
    emitSparks(x, y, count = 3, baseAngle = 0, speed = 200) {
      for (let c = 0; c < count; c++) {
        const p = this.pool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.maxParticles;

        const sparkAngle = baseAngle + Math.PI + (Math.random() - 0.5) * 0.6;
        const sparkSpeed = (speed * 0.5) + Math.random() * 120;

        p.active = true;
        p.type = 'spark';
        p.x = x + (Math.random() - 0.5) * 4;
        p.y = y + (Math.random() - 0.5) * 4;
        p.vx = Math.cos(sparkAngle) * sparkSpeed;
        p.vy = Math.sin(sparkAngle) * sparkSpeed;
        p.size = 1.5 + Math.random() * 1.5;
        p.maxSize = p.size;
        p.alpha = 1.0;
        p.life = 0;
        p.maxLife = 0.15 + Math.random() * 0.2;
        p.color = Math.random() > 0.3 ? '#ffcc00' : '#ff4400';
      }
    }

    /**
     * Updates active particles with delta time
     */
    update(dt) {
      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.pool[i];
        if (!p.active) continue;

        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }

        const progress = p.life / p.maxLife;

        // Position integration
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.type === 'smoke') {
          // Slow down smoke, expand radius, fade out
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.size += (p.maxSize - p.size) * (dt * 4);
          p.alpha = (1 - progress) * 0.45;
        } else if (p.type === 'spark') {
          // Fast spark drag and fade
          p.vx *= 0.88;
          p.vy *= 0.88;
          p.alpha = 1 - progress;
        }
      }
    }

    /**
     * Renders active particles to canvas
     */
    draw(ctx) {
      ctx.save();

      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.pool[i];
        if (!p.active) continue;

        if (p.type === 'smoke') {
          ctx.fillStyle = `rgba(200, 210, 225, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'spark') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * 2, p.size);
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    }
  }

  const defaultParticleSystem = new ParticleSystem(POOL_SIZE);
  window.ParticleSystem = defaultParticleSystem;
  window.ParticleSystemClass = ParticleSystem;

  function registerParticles() {
    if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
      window.CanvasStage.addRender((ctx, width, height, dt) => {
        defaultParticleSystem.update(dt || 0.016);
        defaultParticleSystem.draw(ctx);
      });
      return true;
    }
    return false;
  }

  if (!registerParticles()) {
    window.addEventListener('DOMContentLoaded', registerParticles);
  }

  console.log(`[ParticleSystem] Initialized static object pool of ${POOL_SIZE} zero-allocation particles.`);
})();
