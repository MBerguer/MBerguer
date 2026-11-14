/**
 * GRAND PRIX TELEMETRY // SEAMLESS FREE-DRIVE MODE CONTROLLER
 * Smooth cinematic camera zoom, Lenis scroll suspension, and continuous state transfer
 * between scrollytelling and manual track driving via hotkey 'T' or HUD button.
 */

(function () {
  'use strict';

  class FreeDriveManager {
    constructor() {
      this.isActive = false;
      this.btnToggle = document.getElementById('btn-toggle-freedrive');
      this.hudOverlay = document.getElementById('pitwall-hud-overlay');
      this.scrollyTrack = document.getElementById('scrollytelling-track');
      this.banner = document.getElementById('freedrive-banner');

      this.initEvents();
    }

    initEvents() {
      const self = this;

      // Keybinding: 'T' or 't' to toggle, 'Escape' to exit
      window.addEventListener('keydown', (e) => {
        // Do not trigger if typing in an input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 't' || e.key === 'T') {
          self.toggleFreeDrive();
        } else if (e.key === 'Escape' && self.isActive) {
          self.exitFreeDrive();
        }
      });

      if (this.btnToggle) {
        this.btnToggle.addEventListener('click', () => {
          self.toggleFreeDrive();
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

    /**
     * Seamlessly transition from scrollytelling into free-drive mode
     */
    enterFreeDrive() {
      if (this.isActive) return;
      this.isActive = true;

      console.log('[FreeDrive] Entering Free-Drive Mode...');

      // 1. Pause Lenis smooth scrolling engine
      if (window.MotionBridge && typeof window.MotionBridge.pause === 'function') {
        window.MotionBridge.pause();
      } else if (window.appLenis) {
        window.appLenis.stop();
      }

      // 2. Transfer physical position and momentum from ScrollyCar to manual Kart
      if (window.ScrollyCar) {
        const car = window.ScrollyCar;
        if (window.appEngine && window.appEngine.kart) {
          const k = window.appEngine.kart;
          k.x = car.x;
          k.y = car.y;
          k.angle = car.angle;
          k.speed = (car.speed / 3.6); // Convert km/h to m/s physics speed
        }
      }

      // 3. Fade out overlaying text cards to reveal open circuit
      if (this.scrollyTrack) {
        this.scrollyTrack.classList.add('freedrive-hidden');
      }

      // 4. Update HUD buttons and banner
      if (this.btnToggle) {
        this.btnToggle.classList.add('active');
        this.btnToggle.innerHTML = '<span>EXIT FREE-DRIVE (T)</span> ✕';
      }

      if (this.banner) {
        this.banner.classList.add('visible');
      }

      // Enable engine sound if available
      if (window.EngineAudio && typeof window.EngineAudio.unmute === 'function') {
        window.EngineAudio.unmute();
      }
    }

    /**
     * Seamlessly transition back to scrollytelling
     */
    exitFreeDrive() {
      if (!this.isActive) return;
      this.isActive = false;

      console.log('[FreeDrive] Exiting Free-Drive Mode -> Resuming Scrollytelling...');

      // 1. Resume Lenis smooth scroll
      if (window.MotionBridge && typeof window.MotionBridge.resume === 'function') {
        window.MotionBridge.resume();
      } else if (window.appLenis) {
        window.appLenis.start();
      }

      // 2. Restore scrollytelling card visibility
      if (this.scrollyTrack) {
        this.scrollyTrack.classList.remove('freedrive-hidden');
      }

      // 3. Reset HUD buttons and banner
      if (this.btnToggle) {
        this.btnToggle.classList.remove('active');
        this.btnToggle.innerHTML = '<span>FREE-DRIVE (T)</span> 🕹️';
      }

      if (this.banner) {
        this.banner.classList.remove('visible');
      }
    }
  }

  const manager = new FreeDriveManager();
  window.FreeDriveManager = manager;
  window.enterFreeDrive = () => manager.enterFreeDrive();
  window.exitFreeDrive = () => manager.exitFreeDrive();

  console.log('[FreeDriveManager] Initialized. Press "T" to toggle free-drive manual racing.');
})();
