/**
 * GRAND PRIX TELEMETRY // PERSISTENT SKIDMARKS BUFFER
 * High-performance offscreen canvas accumulator for tire rubber tracks during heavy braking,
 * burnouts, and high-G cornering drifts.
 */

(function () {
  'use strict';

  class SkidmarksBuffer {
    constructor(width = 1350, height = 1050) {
      this.width = width;
      this.height = height;

      // Offscreen canvas for persistence without redrawing hundreds of path segments
      this.offCanvas = document.createElement('canvas');
      this.offCanvas.width = this.width;
      this.offCanvas.height = this.height;
      this.ctx = this.offCanvas.getContext('2d', { alpha: true });

      this.lastLeft = null;
      this.lastRight = null;
      this.decayCounter = 0;
      this.hasMarks = false;
    }

    /**
     * Resizes buffer if world dimensions change
     */
    resize(width, height) {
      this.width = width;
      this.height = height;
      this.offCanvas.width = width;
      this.offCanvas.height = height;
    }

    /**
     * Adds a skid mark pair from rear tires
     */
    addMark(rearLeft, rearRight, opacity = 0.5) {
      if (!this.ctx) return;

      const alpha = Math.min(Math.max(opacity, 0), 1);
      this.ctx.strokeStyle = `rgba(15, 20, 28, ${alpha * 0.4})`;
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';

      if (this.lastLeft && this.lastRight) {
        this.hasMarks = true;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastLeft.x, this.lastLeft.y);
        this.ctx.lineTo(rearLeft.x, rearLeft.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastRight.x, this.lastRight.y);
        this.ctx.lineTo(rearRight.x, rearRight.y);
        this.ctx.stroke();
      }

      this.lastLeft = { x: rearLeft.x, y: rearLeft.y };
      this.lastRight = { x: rearRight.x, y: rearRight.y };
    }

    /**
     * Resets last positions when tires are not skidding
     */
    breakMark() {
      this.lastLeft = null;
      this.lastRight = null;
    }

    /**
     * Blits the offscreen skidmark layer onto the main canvas
     */
    render(ctx) {
      if (!this.hasMarks || !this.offCanvas || !ctx) return;
      ctx.drawImage(this.offCanvas, 0, 0);

      // Very slow subtle fade/decay over time (every 120 frames)
      this.decayCounter++;
      if (this.decayCounter % 180 === 0) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }

    clear() {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      this.hasMarks = false;
      this.breakMark();
    }
  }

  const defaultBuffer = new SkidmarksBuffer(1350, 1050);
  window.SkidmarksBuffer = defaultBuffer;
  window.SkidmarksBufferClass = SkidmarksBuffer;

  function registerSkidmarks() {
    if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
      window.CanvasStage.addRender((ctx) => {
        defaultBuffer.render(ctx);
      });
      return true;
    }
    return false;
  }

  if (!registerSkidmarks()) {
    window.addEventListener('DOMContentLoaded', registerSkidmarks);
  }

  console.log('[SkidmarksBuffer] Initialized persistent offscreen skidmarks accumulator.');
})();
