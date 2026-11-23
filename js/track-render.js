/**
 * GRAND PRIX TELEMETRY // PROCEDURAL 16-BIT TRACK ASPHALT & FIA KERBS RENDERER
 * High-performance canvas ribbon renderer with procedural asphalt dithering,
 * FIA red/white alternating kerbs, rubbered racing groove, and starting grid slots.
 */

(function () {
  'use strict';

  class TrackRenderer {
    constructor(geometry = null) {
      this.geometry = geometry || window.TrackGeometry;
      this.asphaltPattern = null;
      this.bakedCanvas = null;
      this.createAsphaltPattern();
    }

    /**
     * Pre-generates a tiny 64x64 offscreen dithered noise pattern for authentic 16-bit texture
     */
    createAsphaltPattern() {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const pCtx = pCanvas.getContext('2d');

      pCtx.fillStyle = '#1c2333';
      pCtx.fillRect(0, 0, 64, 64);

      // Noise grains
      const imgData = pCtx.getImageData(0, 0, 64, 64);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));         // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
      }
      pCtx.putImageData(imgData, 0, 0);

      // Create pattern on main context if available, or store canvas
      this.patternCanvas = pCanvas;
    }

    /**
     * Draws the main asphalt track ribbon with runoffs and dithered surface
     */
    drawAsphalt(ctx, camera = { x: 0, y: 0, zoom: 1 }) {
      if (!this.geometry) this.geometry = window.TrackGeometry;
      if (!this.geometry) return;

      const samples = this.geometry.getRibbonSamples(220);
      if (samples.length < 2) return;

      ctx.save();

      // Lazy-compile pattern with active context
      if (!this.asphaltPattern && this.patternCanvas) {
        this.asphaltPattern = ctx.createPattern(this.patternCanvas, 'repeat');
      }

      // 1. Runoff Gravel Border (Dark amber/slate border strip)
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const nx = s.normal.x * 14;
        const ny = s.normal.y * 14;
        const pt = { x: s.left.x + nx, y: s.left.y + ny };
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        const s = samples[i];
        const nx = s.normal.x * 14;
        const ny = s.normal.y * 14;
        ctx.lineTo(s.right.x - nx, s.right.y - ny);
      }
      ctx.closePath();
      ctx.fillStyle = '#0f1420';
      ctx.fill();
      ctx.strokeStyle = '#1f293d';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // 2. Main Track Asphalt Surface
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].left;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        ctx.lineTo(samples[i].right.x, samples[i].right.y);
      }
      ctx.closePath();

      if (this.asphaltPattern) {
        ctx.fillStyle = this.asphaltPattern;
      } else {
        ctx.fillStyle = '#1c2333';
      }
      ctx.fill();

      // 3. Track Edge Boundary Lines (High-contrast crisp borders & technical white lines)
      ctx.strokeStyle = '#2a364f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].left;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].right;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Inner crisp white lines
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].left;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].right;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // 4. Darkened Rubber Groove (Racing line tire wear)
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].center;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = 'rgba(5, 7, 12, 0.55)';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 5. Centerline Racing Telemetry Tracer (High-visibility neon cyan with glow)
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].center;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.setLineDash([12, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    /**
     * Draws FIA standard alternating red/white and cyan/white kerbs on turns
     */
    drawKerbs(ctx, camera = { x: 0, y: 0, zoom: 1 }) {
      if (!this.geometry) this.geometry = window.TrackGeometry;
      if (!this.geometry) return;

      const samples = this.geometry.getRibbonSamples(220);
      if (samples.length < 2) return;

      ctx.save();
      const kerbWidth = 11;

      for (let i = 0; i < samples.length - 1; i++) {
        const sA = samples[i];
        const sB = samples[i + 1];

        // Alternating tooth pattern every 3 samples
        const tooth = Math.floor(i / 3) % 2 === 0;

        // Colors: Neon Red & White, with Cyan accent near sector transitions
        const isCyanZone = (sA.t > 0.30 && sA.t < 0.40) || (sA.t > 0.65 && sA.t < 0.75);
        const colActive = isCyanZone ? '#06b6d4' : '#ef4444';
        const colWhite = '#f8fafc';

        ctx.shadowColor = tooth ? colActive : 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = tooth ? 8 : 4;

        // Left Kerb
        const lx1 = sA.left.x, ly1 = sA.left.y;
        const lx2 = sB.left.x, ly2 = sB.left.y;
        const lkx2 = lx2 + sB.normal.x * kerbWidth;
        const lky2 = ly2 + sB.normal.y * kerbWidth;
        const lkx1 = lx1 + sA.normal.x * kerbWidth;
        const lky1 = ly1 + sA.normal.y * kerbWidth;

        // Prevent self-intersection / triangular spikes on tight inside curves
        if ((lx2 - lx1) * (lkx2 - lkx1) + (ly2 - ly1) * (lky2 - lky1) > 0) {
          ctx.fillStyle = tooth ? colActive : colWhite;
          ctx.beginPath();
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.lineTo(lkx2, lky2);
          ctx.lineTo(lkx1, lky1);
          ctx.closePath();
          ctx.fill();
        }

        // Right Kerb
        const rx1 = sA.right.x, ry1 = sA.right.y;
        const rx2 = sB.right.x, ry2 = sB.right.y;
        const rkx2 = rx2 - sB.normal.x * kerbWidth;
        const rky2 = ry2 - sB.normal.y * kerbWidth;
        const rkx1 = rx1 - sA.normal.x * kerbWidth;
        const rky1 = ry1 - sA.normal.y * kerbWidth;

        if ((rx2 - rx1) * (rkx2 - rkx1) + (ry2 - ry1) * (rky2 - rky1) > 0) {
          ctx.fillStyle = tooth ? colActive : colWhite;
          ctx.beginPath();
          ctx.moveTo(rx1, ry1);
          ctx.lineTo(rx2, ry2);
          ctx.lineTo(rkx2, rky2);
          ctx.lineTo(rkx1, rky1);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    /**
     * Draws authentic F1 starting grid slots on the main straight
     */
    drawGridSlots(ctx) {
      if (!this.geometry) return;
      ctx.save();

      // Draw P1, P2, P3 starting grid slots at beginning of lap (progress 0.005 to 0.04)
      const gridSlots = [
        { t: 0.012, pole: 'P1', offsetSide: 1 },
        { t: 0.024, pole: 'P2', offsetSide: -1 },
        { t: 0.036, pole: 'P3', offsetSide: 1 }
      ];

      gridSlots.forEach((slot) => {
        const pt = this.geometry.getPointAtProgress(slot.t);
        const nx = -pt.tangentY;
        const ny = pt.tangentX;
        const cx = pt.x + nx * (slot.offsetSide * 28);
        const cy = pt.y + ny * (slot.offsetSide * 28);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(pt.angle);

        // Open bracket starting box
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Closed at the FRONT (+x = driving direction), open at the rear
        ctx.moveTo(16, -14);
        ctx.lineTo(16, 14);
        ctx.lineTo(6, 14);
        ctx.moveTo(16, -14);
        ctx.lineTo(6, -14);
        ctx.stroke();

        // Pole label
        ctx.fillStyle = slot.pole === 'P1' ? '#00f0ff' : '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.pole, -6, 0);

        ctx.restore();
      });

      // Finish / Start Line (checkered strip across track)
      const finishPt = this.geometry.getPointAtProgress(0.002);
      const halfW = this.geometry.trackWidth / 2;
      const fnx = -finishPt.tangentY;
      const fny = finishPt.tangentX;

      const pLeft = { x: finishPt.x + fnx * halfW, y: finishPt.y + fny * halfW };
      const pRight = { x: finishPt.x - fnx * halfW, y: finishPt.y - fny * halfW };

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    /**
     * Pre-renders (bakes) the static track ribbon, kerbs, and grid slots into an offscreen canvas
     */
    ensureBakedTrack() {
      if (this.bakedCanvas) return;
      if (!this.geometry) this.geometry = window.TrackGeometry;
      if (!this.geometry) return;

      const bCanvas = document.createElement('canvas');
      bCanvas.width = 1350;
      bCanvas.height = 1050;
      const bCtx = bCanvas.getContext('2d');

      this.drawAsphalt(bCtx, { x: 0, y: 0, zoom: 1 });
      this.drawKerbs(bCtx, { x: 0, y: 0, zoom: 1 });
      this.drawGridSlots(bCtx);

      this.bakedCanvas = bCanvas;
    }

    /**
     * Unified render call
     */
    render(ctx, camera) {
      this.ensureBakedTrack();
      if (this.bakedCanvas) {
        ctx.drawImage(this.bakedCanvas, 0, 0);
      } else {
        this.drawAsphalt(ctx, camera);
        this.drawKerbs(ctx, camera);
        this.drawGridSlots(ctx);
      }
    }
  }

  // Register with CanvasStage if already loaded
  const defaultRenderer = new TrackRenderer();
  window.TrackRenderer = defaultRenderer;
  window.TrackRendererClass = TrackRenderer;

  function registerTrackRenderer() {
    if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
      window.CanvasStage.addRender((ctx) => {
        defaultRenderer.render(ctx, { x: 0, y: 0, zoom: 1 });
      });
      return true;
    }
    return false;
  }

  if (!registerTrackRenderer()) {
    window.addEventListener('DOMContentLoaded', registerTrackRenderer);
  }

  console.log('[TrackRenderer] Procedural 16-bit asphalt and FIA kerbs renderer initialized.');
})();
