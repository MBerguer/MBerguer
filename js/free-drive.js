/**
 * GRAND PRIX TELEMETRY // SEAMLESS FREE-DRIVE MODE & HOLOGRAPHIC CHECKPOINTS
 * Smooth cinematic camera zoom, Lenis scroll suspension, continuous state transfer,
 * holographic on-track checkpoints, and non-blocking telemetry slide-over drawer.
 */

(function () {
  'use strict';

  const CHECKPOINTS_DATA = [
    {
      id: 'tsp-light-panel',
      sector: 'SECTOR 01',
      title: 'tsp-light-panel',
      subtitle: 'F1 Trackside Light Panel Engine (FIA Standard 3504-2019)',
      x: 585,
      y: 200,
      radius: 95,
      color: '#e10600',
      specs: [
        { label: 'Standard', val: 'FIA 3504-2019' },
        { label: 'Latency', val: '< 15 μs' },
        { label: 'Runtime', val: 'Tokio Actor Model' }
      ],
      arch: 'Pure domain Rust actor model over Tokio, append-only event sourcing for deterministic incident replay, and typed Axum WebSocket gateway connected to React UI.',
      tags: ['Rust', 'Tokio', 'Event Sourcing', 'Axum', 'FIA 3504-2019'],
      gh: 'https://github.com/MBerguer/tsp-light-panel'
    },
    {
      id: 'abuse-2026',
      sector: 'SECTOR 02',
      title: 'Abuse 2026',
      subtitle: 'Engine Port & 2D Dynamic Raytracing in C++20',
      x: 1025,
      y: 475,
      radius: 95,
      color: '#a855f7',
      specs: [
        { label: 'Standard', val: 'C++20 ISO' },
        { label: 'Frame Rate', val: '144+ FPS' },
        { label: 'Lighting', val: '2D Volumetric' }
      ],
      arch: 'Complete 64-bit modernization of Crack dot Com 1996 DOS engine with C++20. Dynamic volumetric raytracing and polygonal shadow occlusion at 144+ FPS without altering original assembly physics.',
      tags: ['C++20', 'Raytracing', 'Vulkan/GL', 'Game Engine', 'SIMD'],
      gh: 'https://github.com/MBerguer/Abuse_2026'
    },
    {
      id: 'alloy-zksync',
      sector: 'SECTOR 03',
      title: 'alloy-zksync',
      subtitle: 'Zero-Copy High-Throughput Rust Infrastructure for ZKsync Era',
      x: 840,
      y: 850,
      radius: 95,
      color: '#00f0ff',
      specs: [
        { label: 'Throughput', val: '680k tx/sec' },
        { label: 'Allocations', val: '0 (Zero-Copy)' },
        { label: 'Target', val: 'ZKsync Era' }
      ],
      arch: 'Rust extension for the Alloy Ethereum framework optimized for ZKsync Era. Zero-copy memory buffer serialization and in-place cryptographic packet encoding for high-frequency financial rollups.',
      tags: ['Rust', 'Alloy', 'ZK-Rollup', 'Zero-Copy', 'Low-Latency'],
      gh: 'https://github.com/MBerguer/alloy-zksync'
    },
    {
      id: 'tesis-futbol',
      sector: 'SECTOR 04',
      title: 'tesis-futbol (MSc UdelaR)',
      subtitle: 'State Estimation & Trajectory Prediction under Uncertainty',
      x: 550,
      y: 650,
      radius: 90,
      color: '#f59e0b',
      specs: [
        { label: 'Degree', val: 'MSc UdelaR' },
        { label: 'Pipeline', val: 'Real-Time ETL' },
        { label: 'Model', val: 'Kalman / Bayes' }
      ],
      arch: 'Master thesis research at UdelaR in Machine Learning & Data Engineering. Dynamic multi-agent tracking, probabilistic graphical models, and spatial-temporal trajectory prediction under high entropy.',
      tags: ['Python', 'Probabilistic ML', 'PyTorch', 'Kalman Filter', 'Data Eng'],
      gh: 'https://github.com/MBerguer/tesis-futbol'
    },
    {
      id: 'udelartex',
      sector: 'SECTOR 05',
      title: 'UdelaRTeX',
      subtitle: 'The Standard Academic Typography Suite of UdelaR',
      x: 300,
      y: 700,
      radius: 90,
      color: '#10b981',
      specs: [
        { label: 'Adoption', val: '2,400+ Theses' },
        { label: 'Faculties', val: '14 Institutos' },
        { label: 'CI/CD', val: 'GitHub Actions' }
      ],
      arch: 'Open-source LaTeX framework and automated CI/CD publication toolchain adopted across faculties at Universidad de la República. Standardized academic typographical compliance.',
      tags: ['LaTeX', 'Open Source', 'CI/CD Automation', 'UdelaR', 'Typography'],
      gh: 'https://github.com/MBerguer/UdelaRTeX'
    }
  ];

  class FreeDriveManager {
    constructor() {
      this.isActive = false;
      this.btnToggle = document.getElementById('btn-toggle-freedrive');
      this.hudOverlay = document.getElementById('pitwall-hud-overlay');
      this.scrollyTrack = document.getElementById('scrollytelling-track');
      this.banner = document.getElementById('freedrive-banner');
      this.drawer = document.getElementById('project-drawer');
      this.btnCloseDrawer = document.getElementById('btn-close-drawer');

      this.checkpoints = CHECKPOINTS_DATA;
      this.activeCheckpointId = null;

      this.initEvents();
      this.initCanvasRender();
    }

    initEvents() {
      const self = this;

      // Keybinding: 'T' to toggle, 'Escape' to close drawer or exit free-drive
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 't' || e.key === 'T') {
          self.toggleFreeDrive();
        } else if (e.key === 'Escape') {
          if (self.drawer && self.drawer.classList.contains('active')) {
            self.closeDrawer();
          } else if (self.isActive) {
            self.exitFreeDrive();
          }
        }
      });

      if (this.btnToggle) {
        this.btnToggle.addEventListener('click', () => {
          self.toggleFreeDrive();
        });
      }

      if (this.btnCloseDrawer) {
        this.btnCloseDrawer.addEventListener('click', () => {
          self.closeDrawer();
        });
      }
    }

    toggleFreeDrive() {
      if (this.isActive) {
        this.exitFreeDrive();
      } else {
        this.enterFreeDrive();
      }
    }

    enterFreeDrive() {
      if (this.isActive) return;
      this.isActive = true;

      if (window.MotionBridge && typeof window.MotionBridge.pause === 'function') {
        window.MotionBridge.pause();
      } else if (window.appLenis) {
        window.appLenis.stop();
      }

      if (window.ScrollyCar && window.appEngine && window.appEngine.kart) {
        const car = window.ScrollyCar;
        const k = window.appEngine.kart;
        k.x = car.x;
        k.y = car.y;
        k.angle = car.angle;
        k.speed = (car.speed / 3.6);
      }

      if (this.scrollyTrack) {
        this.scrollyTrack.classList.add('freedrive-hidden');
      }

      if (this.btnToggle) {
        this.btnToggle.classList.add('active');
        this.btnToggle.innerHTML = '<span>EXIT FREE-DRIVE (T)</span> ✕';
      }

      if (this.banner) {
        this.banner.classList.add('visible');
      }

      if (window.EngineAudio && typeof window.EngineAudio.unmute === 'function') {
        window.EngineAudio.unmute();
      }
    }

    exitFreeDrive() {
      if (!this.isActive) return;
      this.isActive = false;

      if (window.MotionBridge && typeof window.MotionBridge.resume === 'function') {
        window.MotionBridge.resume();
      } else if (window.appLenis) {
        window.appLenis.start();
      }

      if (this.scrollyTrack) {
        this.scrollyTrack.classList.remove('freedrive-hidden');
      }

      if (this.btnToggle) {
        this.btnToggle.classList.remove('active');
        this.btnToggle.innerHTML = '<span>FREE-DRIVE (T)</span> 🕹️';
      }

      if (this.banner) {
        this.banner.classList.remove('visible');
      }

      this.closeDrawer();
    }

    /**
     * Proximity check to track checkpoints during manual driving
     */
    checkSectorCheckpoints(kartX, kartY) {
      if (!this.isActive) return;

      for (const cp of this.checkpoints) {
        const dist = Math.hypot(kartX - cp.x, kartY - cp.y);
        if (dist <= cp.radius) {
          if (this.activeCheckpointId !== cp.id) {
            this.activeCheckpointId = cp.id;
            this.openDrawer(cp);
          }
          return;
        }
      }
    }

    openDrawer(cp) {
      if (!this.drawer) return;

      const sectorEl = document.getElementById('drawer-sector');
      const titleEl = document.getElementById('drawer-title');
      const subEl = document.getElementById('drawer-sub');
      const specsEl = document.getElementById('drawer-specs');
      const archEl = document.getElementById('drawer-arch');
      const tagsEl = document.getElementById('drawer-tags');
      const linkEl = document.getElementById('drawer-gh-link');

      if (sectorEl) {
        sectorEl.textContent = cp.sector;
        sectorEl.style.borderColor = cp.color;
        sectorEl.style.color = cp.color;
      }
      if (titleEl) titleEl.textContent = cp.title;
      if (subEl) subEl.textContent = cp.subtitle;
      if (archEl) archEl.textContent = cp.arch;
      if (linkEl) linkEl.href = cp.gh;

      if (specsEl && cp.specs) {
        specsEl.innerHTML = cp.specs.map(s => `
          <div class="spec-card">
            <div class="spec-label">${s.label}</div>
            <div class="spec-val" style="color: ${cp.color};">${s.val}</div>
          </div>
        `).join('');
      }

      if (tagsEl && cp.tags) {
        tagsEl.innerHTML = cp.tags.map(t => `
          <span class="tech-tag" style="border-color: ${cp.color}; color: #fff;">${t}</span>
        `).join('');
      }

      this.drawer.classList.add('active');
    }

    closeDrawer() {
      if (this.drawer) {
        this.drawer.classList.remove('active');
      }
      this.activeCheckpointId = null;
    }

    /**
     * Renders glowing holographic beacons on canvas
     */
    initCanvasRender() {
      const self = this;
      if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
        window.CanvasStage.addRender((ctx) => {
          if (!self.isActive) return;

          // Render glowing holographic rings for all checkpoints
          const t = Date.now() * 0.003;
          self.checkpoints.forEach((cp) => {
            const isNear = self.activeCheckpointId === cp.id;
            const pulse = (Math.sin(t * 2) + 1) * 0.5;

            ctx.save();
            ctx.strokeStyle = cp.color;
            ctx.lineWidth = isNear ? 3 : 1.5;
            ctx.setLineDash([6, 6]);

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, cp.radius + pulse * 6, 0, Math.PI * 2);
            ctx.stroke();

            // Center beacon icon
            ctx.fillStyle = cp.color;
            ctx.shadowColor = cp.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Holographic label
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(cp.sector, cp.x, cp.y - cp.radius - 8);

            ctx.restore();
          });

          // Check kart coordinates if manual kart is driving
          if (window.appEngine && window.appEngine.kart) {
            self.checkSectorCheckpoints(window.appEngine.kart.x, window.appEngine.kart.y);
          }
        });
      }
    }
  }

  const manager = new FreeDriveManager();
  window.FreeDriveManager = manager;
  window.enterFreeDrive = () => manager.enterFreeDrive();
  window.exitFreeDrive = () => manager.exitFreeDrive();

  console.log('[FreeDriveManager] Holographic checkpoints & non-blocking telemetry drawer ready.');
})();
