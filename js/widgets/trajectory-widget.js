/**
 * GRAND PRIX TELEMETRY // SECTOR 4: TESIS-FUTBOL PROBABILISTIC TRAJECTORY WIDGET
 * Interactive soccer pitch canvas with draggable player, Kalman/Gaussian probability cone,
 * adjustable variance slider (sigma), and real-time state estimation metrics.
 */

(function () {
  'use strict';

  class TrajectoryWidget {
    constructor(canvasId = 'trajectory-canvas', sliderId = 'slider-sigma') {
      this.canvas = document.getElementById(canvasId);
      this.slider = document.getElementById(sliderId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      this.sigma = 1.4; // Initial variance scale
      this.player = { x: 70, y: 110, radius: 10, isDragging: false };
      this.target = { x: 380, y: 70, radius: 9 };
      this.defender = { x: 230, y: 115, radius: 9 };

      this.valSigma = document.getElementById('val-sigma-num');
      this.valProb = document.getElementById('val-pass-prob');
      this.needsRedraw = true;

      this.initEvents();
      this.startLoop();
    }

    initEvents() {
      if (!this.canvas) return;

      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
          y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
      };

      this.canvas.addEventListener('mousedown', (e) => {
        const pos = getPos(e);
        const dist = Math.hypot(pos.x - this.player.x, pos.y - this.player.y);
        if (dist <= this.player.radius * 2) {
          this.player.isDragging = true;
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.player.isDragging) return;
        const pos = getPos(e);
        this.player.x = Math.max(30, Math.min(200, pos.x));
        this.player.y = Math.max(30, Math.min(this.canvas.height - 30, pos.y));
        this.updateMetrics();
      });

      window.addEventListener('mouseup', () => {
        this.player.isDragging = false;
      });

      // Touch events for mobile
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          const pos = getPos(t);
          if (Math.hypot(pos.x - this.player.x, pos.y - this.player.y) <= 30) {
            this.player.isDragging = true;
            e.preventDefault();
          }
        }
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (!this.player.isDragging || e.touches.length === 0) return;
        const t = e.touches[0];
        const pos = getPos(t);
        this.player.x = Math.max(30, Math.min(200, pos.x));
        this.player.y = Math.max(30, Math.min(this.canvas.height - 30, pos.y));
        this.updateMetrics();
      });

      window.addEventListener('touchend', () => {
        this.player.isDragging = false;
      });

      if (this.slider) {
        this.slider.addEventListener('input', (e) => {
          this.sigma = parseFloat(e.target.value);
          if (this.valSigma) {
            this.valSigma.textContent = `${this.sigma.toFixed(1)}σ`;
          }
          this.updateMetrics();
        });
      }

      this.updateMetrics();
    }

    updateMetrics() {
      // Distance from trajectory to defender
      const dx = this.target.x - this.player.x;
      const dy = this.target.y - this.player.y;
      const dist = Math.hypot(dx, dy) || 1;

      // Interception risk based on defender proximity and uncertainty sigma
      const midX = (this.player.x + this.target.x) * 0.5;
      const midY = (this.player.y + this.target.y) * 0.5;
      const defDist = Math.hypot(this.defender.x - midX, this.defender.y - midY);

      const baseSuccess = Math.max(0.4, Math.min(0.98, 1 - (40 / defDist)));
      const adjusted = Math.max(0.2, Math.min(0.99, baseSuccess - (this.sigma - 1.0) * 0.18));

      if (this.valProb) {
        this.valProb.textContent = `${(adjusted * 100).toFixed(1)}%`;
      }
      this.needsRedraw = true;
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
      if (!this.ctx || !this.canvas || !this.needsRedraw) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // 1. Technical Tactical Pitch Background
      ctx.fillStyle = '#06130d'; // Deep tactical turf green
      ctx.fillRect(0, 0, w, h);

      // Pitch lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1.5;

      // Touchline border
      ctx.strokeRect(15, 15, w - 30, h - 30);
      // Halfway line
      ctx.beginPath();
      ctx.moveTo(w / 2, 15);
      ctx.lineTo(w / 2, h - 15);
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Penalty box (right side)
      ctx.strokeRect(w - 95, h / 2 - 55, 80, 110);

      // 2. Trajectory Math & Gaussian Uncertainty Cone
      const p1 = this.player;
      const p2 = this.target;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const perpAngle = angle + Math.PI / 2;

      // Uncertainty expands proportionally to distance and sigma
      const maxSpread = 28 * this.sigma;

      // 2-Sigma Confidence Fan (Outer 95% interval)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(
        (p1.x + p2.x) * 0.5 + Math.cos(perpAngle) * maxSpread * 0.6,
        (p1.y + p2.y) * 0.5 + Math.sin(perpAngle) * maxSpread * 0.6,
        p2.x + Math.cos(perpAngle) * maxSpread,
        p2.y + Math.sin(perpAngle) * maxSpread
      );
      ctx.lineTo(p2.x - Math.cos(perpAngle) * maxSpread, p2.y - Math.sin(perpAngle) * maxSpread);
      ctx.quadraticCurveTo(
        (p1.x + p2.x) * 0.5 - Math.cos(perpAngle) * maxSpread * 0.6,
        (p1.y + p2.y) * 0.5 - Math.sin(perpAngle) * maxSpread * 0.6,
        p1.x, p1.y
      );
      ctx.closePath();

      const grad2 = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      grad2.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      grad2.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
      ctx.fillStyle = grad2;
      ctx.fill();

      // 1-Sigma Confidence Core (Inner 68% interval)
      const coreSpread = maxSpread * 0.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(
        (p1.x + p2.x) * 0.5 + Math.cos(perpAngle) * coreSpread * 0.6,
        (p1.y + p2.y) * 0.5 + Math.sin(perpAngle) * coreSpread * 0.6,
        p2.x + Math.cos(perpAngle) * coreSpread,
        p2.y + Math.sin(perpAngle) * coreSpread
      );
      ctx.lineTo(p2.x - Math.cos(perpAngle) * coreSpread, p2.y - Math.sin(perpAngle) * coreSpread);
      ctx.quadraticCurveTo(
        (p1.x + p2.x) * 0.5 - Math.cos(perpAngle) * coreSpread * 0.6,
        (p1.y + p2.y) * 0.5 - Math.sin(perpAngle) * coreSpread * 0.6,
        p1.x, p1.y
      );
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.fill();

      // Mean Expected Trajectory Vector (Central Dashed Line)
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 3. Defender Node
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(this.defender.x, this.defender.y, this.defender.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DEF', this.defender.x, this.defender.y);
      ctx.restore();

      // 4. Target Teammate Node
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, this.target.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ST', this.target.x, this.target.y);
      ctx.restore();

      // 5. Draggable Playmaker Node (Player #10)
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = this.player.isDragging ? 16 : 8;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('10', this.player.x, this.player.y);
      ctx.restore();

      // In-canvas math info
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '9px monospace';
      ctx.fillText(`DRAG #10 | GAUSSIAN KALMAN CONE N(μ, Σ) | σ=${this.sigma.toFixed(1)}`, 20, h - 8);
      this.needsRedraw = false;
    }
  }

  window.TrajectoryWidget = TrajectoryWidget;

  function init() {
    if (document.getElementById('trajectory-canvas')) {
      window.activeTrajectoryWidget = new TrajectoryWidget();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
