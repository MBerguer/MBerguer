/**
 * GRAND PRIX TELEMETRY // SECTOR 1: tsp-light-panel FIA 3504-2019 SIMULATOR
 * Interactive LED matrix simulator for F1 trackside light panels with Tokyo actor event stream.
 * Supports YELLOW, DOUBLE_YELLOW, GREEN, RED, and SC (Safety Car) flag states.
 */

(function () {
  'use strict';

  class FiaPanelWidget {
    constructor(canvasId = 'fia-matrix-canvas', logsId = 'fia-tokio-logs') {
      this.canvas = document.getElementById(canvasId);
      this.logsEl = document.getElementById(logsId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      this.currentFlag = 'YELLOW';
      this.flashRateHz = 2.0;
      this.lastToggle = Date.now();
      this.isFlashOn = true;

      this.cols = 28;
      this.rows = 20;

      this.initEvents();
      this.startRenderLoop();
      this.logEvent('SYSTEM_INIT', 'tokio::runtime::spawn actor light_panel_01 initialized in 8.4μs');
      this.setFlag('YELLOW');
    }

    setFlag(state) {
      const valid = ['GREEN', 'YELLOW', 'DOUBLE_YELLOW', 'RED', 'SC'];
      if (!valid.includes(state)) return;

      const prev = this.currentFlag;
      this.currentFlag = state;

      const latencyMicros = (Math.random() * 8 + 6).toFixed(1);
      this.logEvent('FLAG_CHANGE', `Transition [${prev}] -> [${state}] committed in ${latencyMicros}μs (axum::ws broadcast)`);

      // Update button active state
      const buttons = document.querySelectorAll('.fia-flag-btn');
      buttons.forEach((btn) => {
        if (btn.getAttribute('data-flag') === state) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    logEvent(tag, message) {
      if (!this.logsEl) return;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const logLine = document.createElement('div');
      logLine.className = 'terminal-log-line';
      logLine.innerHTML = `<span class="log-time">${timeStr}</span> <span class="log-tag">[${tag}]</span> ${message}`;
      this.logsEl.appendChild(logLine);

      // Keep max 15 lines
      while (this.logsEl.children.length > 15) {
        this.logsEl.removeChild(this.logsEl.firstChild);
      }
      this.logsEl.scrollTop = this.logsEl.scrollHeight;
    }

    initEvents() {
      const buttons = document.querySelectorAll('.fia-flag-btn');
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const flag = btn.getAttribute('data-flag');
          if (flag) this.setFlag(flag);
        });
      });
    }

    startRenderLoop() {
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

      // Flash timer
      const now = Date.now();
      const period = 1000 / (this.flashRateHz * 2);
      if (now - this.lastToggle > period) {
        this.isFlashOn = !this.isFlashOn;
        this.lastToggle = now;
      }

      // Background housing
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      // Panel Bezel
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      // Determine LED active color
      let ledColor = '#1a2233'; // Off
      let isFlashing = true;

      switch (this.currentFlag) {
        case 'GREEN':
          ledColor = '#00ff66';
          isFlashing = false; // Steady green
          break;
        case 'YELLOW':
          ledColor = this.isFlashOn ? '#ffaa00' : '#2a2000';
          break;
        case 'DOUBLE_YELLOW':
          ledColor = this.isFlashOn ? '#ffaa00' : '#2a2000';
          break;
        case 'RED':
          ledColor = '#ff0033';
          isFlashing = false; // Steady red
          break;
        case 'SC':
          ledColor = this.isFlashOn ? '#ffaa00' : '#2a2000';
          break;
      }

      // Draw LED Dot Matrix Grid
      const padX = 14;
      const padY = 14;
      const usableW = w - padX * 2;
      const usableH = h - padY * 2;
      const dotPitchX = usableW / this.cols;
      const dotPitchY = usableH / this.rows;
      const dotRadius = Math.min(dotPitchX, dotPitchY) * 0.38;

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cx = padX + c * dotPitchX + dotPitchX / 2;
          const cy = padY + r * dotPitchY + dotPitchY / 2;

          let isLit = true;
          // If SC mode, draw "SC" letters on matrix
          if (this.currentFlag === 'SC') {
            isLit = this.isScPixel(c, r);
          }

          ctx.beginPath();
          ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);

          if (isLit) {
            ctx.fillStyle = ledColor;
            ctx.fill();
            if (this.isFlashOn || !isFlashing) {
              ctx.shadowColor = ledColor;
              ctx.shadowBlur = 4;
            }
          } else {
            ctx.fillStyle = '#111827';
            ctx.shadowBlur = 0;
            ctx.fill();
          }
        }
      }
      ctx.shadowBlur = 0;
    }

    isScPixel(c, r) {
      // SC letter glyph pattern
      // Letter 'S' (columns 6-11)
      if (c >= 6 && c <= 11) {
        if (r >= 4 && r <= 6) return true; // Top bar
        if (r >= 7 && r <= 9 && c <= 7) return true; // Upper spine
        if (r >= 9 && r <= 11) return true; // Middle bar
        if (r >= 11 && r <= 13 && c >= 10) return true; // Lower spine
        if (r >= 13 && r <= 15) return true; // Bottom bar
      }
      // Letter 'C' (columns 15-20)
      if (c >= 15 && c <= 20) {
        if (r >= 4 && r <= 6) return true; // Top bar
        if (r >= 6 && r <= 13 && c <= 16) return true; // Vertical spine
        if (r >= 13 && r <= 15) return true; // Bottom bar
      }
      return false;
    }
  }

  window.FiaPanelWidget = FiaPanelWidget;

  function init() {
    if (document.getElementById('fia-matrix-canvas')) {
      window.activeFiaWidget = new FiaPanelWidget();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
