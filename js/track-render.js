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

      pCtx.fillStyle = '#141824';
      pCtx.fillRect(0, 0, 64, 64);

      // Noise grains
      const imgData = pCtx.getImageData(0, 0, 64, 64);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 24;
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
        const nx = s.normal.x * 12;
        const ny = s.normal.y * 12;
        const pt = { x: s.left.x + nx, y: s.left.y + ny };
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        const s = samples[i];
        const nx = s.normal.x * 12;
        const ny = s.normal.y * 12;
        ctx.lineTo(s.right.x - nx, s.right.y - ny);
      }
      ctx.closePath();
      ctx.fillStyle = '#0a0d14';
      ctx.fill();
      ctx.strokeStyle = '#1a2233';
      ctx.lineWidth = 1.5;
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
        ctx.fillStyle = '#141824';
      }
      ctx.fill();

      // 3. Track Edge Boundary Lines (Crisp technical white lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
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
      ctx.strokeStyle = 'rgba(5, 7, 12, 0.5)';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 5. Centerline Racing Telemetry Tracer
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i].center;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

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
      const kerbWidth = 10;

      for (let i = 0; i < samples.length - 1; i++) {
        const sA = samples[i];
        const sB = samples[i + 1];

        // Alternating tooth pattern every 3 samples
        const tooth = Math.floor(i / 3) % 2 === 0;

        // Colors: FIA Red & White, with Cyan accent near sector transitions
        const isCyanZone = (sA.t > 0.30 && sA.t < 0.40) || (sA.t > 0.65 && sA.t < 0.75);
        const colActive = isCyanZone ? '#00f0ff' : '#e10600';
        const colWhite = '#ffffff';

        // Left Kerb
        ctx.fillStyle = tooth ? colActive : colWhite;
        ctx.beginPath();
        ctx.moveTo(sA.left.x, sA.left.y);
        ctx.lineTo(sB.left.x, sB.left.y);
        ctx.lineTo(sB.left.x + sB.normal.x * kerbWidth, sB.left.y + sB.normal.y * kerbWidth);
        ctx.lineTo(sA.left.x + sA.normal.x * kerbWidth, sA.left.y + sA.normal.y * kerbWidth);
        ctx.closePath();
        ctx.fill();

        // Right Kerb
        ctx.fillStyle = tooth ? colActive : colWhite;
        ctx.beginPath();
        ctx.moveTo(sA.right.x, sA.right.y);
        ctx.lineTo(sB.right.x, sB.right.y);
        ctx.lineTo(sB.right.x - sB.normal.x * kerbWidth, sB.right.y - sB.normal.y * kerbWidth);
        ctx.lineTo(sA.right.x - sA.normal.x * kerbWidth, sA.right.y - sA.normal.y * kerbWidth);
        ctx.closePath();
        ctx.fill();
      }

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
        ctx.moveTo(-16, -14);
        ctx.lineTo(-16, 14);
        ctx.lineTo(-6, 14);
        ctx.moveTo(-16, -14);
        ctx.lineTo(-6, -14);
        ctx.stroke();

        // Pole label
        ctx.fillStyle = slot.pole === 'P1' ? '#00f0ff' : '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.pole, 6, 0);

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
     * Unified render call
     */
    render(ctx, camera) {
      this.drawAsphalt(ctx, camera);
      this.drawKerbs(ctx, camera);
      this.drawGridSlots(ctx);
    }
  }

  // Register with CanvasStage if already loaded
  const defaultRenderer = new TrackRenderer();
  window.TrackRenderer = defaultRenderer;
  window.TrackRendererClass = TrackRenderer;

  if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
    window.CanvasStage.addRender((ctx) => {
      defaultRenderer.render(ctx, { x: 0, y: 0, zoom: 1 });
    });
  }

  console.log('[TrackRenderer] Procedural 16-bit asphalt and FIA kerbs renderer initialized.');
})();
