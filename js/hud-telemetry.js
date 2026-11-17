/**
 * GRAND PRIX TELEMETRY // REAL-TIME COCKPIT SPEEDOMETER & LED TACHOMETER HUD
 * High-frequency digital speedometer scaling dynamically from 0 to 318 KM/H with
 * rapid unit-by-unit deceleration/acceleration tickers and 16-segment RPM shift lights.
 */

(function () {
  'use strict';

  function initHudTelemetry() {
    const speedNum = document.getElementById('speed-num');
    const gearNum = document.getElementById('gear-num');
    const rpmFill = document.getElementById('rpm-fill');
    const rpmNum = document.getElementById('rpm-num');
    const gNum = document.getElementById('g-num');

    let currentSpeed = 0; // Displayed speed
    let targetSpeed = 0;
    let currentRpm = 800;
    let targetRpm = 800;
    let lateralG = 0;

    /**
     * Directly set target speed (0 - 350 KM/H)
     */
    function setSpeed(val) {
      targetSpeed = Math.max(0, Math.min(350, Math.round(val)));
    }

    /**
     * Updates speed with realistic high-rate stepped tick (incrementing/decrementing unit-by-unit)
     */
    function updateSpeed(target, dt = 0.016) {
      targetSpeed = Math.max(0, Math.min(350, Math.round(target)));

      // Step-by-step deceleration / acceleration ticker
      if (currentSpeed < targetSpeed) {
        // Accelerating up rapidly unit-by-unit
        const step = Math.max(1, Math.round((targetSpeed - currentSpeed) * Math.min(1, 14 * dt)));
        currentSpeed = Math.min(targetSpeed, currentSpeed + step);
      } else if (currentSpeed > targetSpeed) {
        // Hard braking deceleration decreasing unit-by-unit
        const step = Math.max(1, Math.round((currentSpeed - targetSpeed) * Math.min(1, 20 * dt)));
        currentSpeed = Math.max(targetSpeed, currentSpeed - step);
      }

      // Update Speedometer UI
      if (speedNum) {
        speedNum.textContent = String(Math.round(currentSpeed));
      }

      // Calculate Gear & RPM based on current speed
      let gear = 1;
      if (currentSpeed < 10) {
        gear = currentSpeed === 0 ? 'N' : 1;
        targetRpm = 850 + currentSpeed * 250;
      } else if (currentSpeed < 65) {
        gear = 2;
        targetRpm = 5000 + (currentSpeed - 10) * 110;
      } else if (currentSpeed < 125) {
        gear = 3;
        targetRpm = 6800 + (currentSpeed - 65) * 85;
      } else if (currentSpeed < 190) {
        gear = 4;
        targetRpm = 8000 + (currentSpeed - 125) * 65;
      } else if (currentSpeed < 255) {
        gear = 5;
        targetRpm = 9200 + (currentSpeed - 190) * 55;
      } else if (currentSpeed < 305) {
        gear = 6;
        targetRpm = 10400 + (currentSpeed - 255) * 45;
      } else {
        gear = 7;
        targetRpm = 11600 + (currentSpeed - 305) * 40;
      }

      // Smooth RPM lerp
      targetRpm = Math.min(13500, Math.max(800, targetRpm));
      currentRpm += (targetRpm - currentRpm) * Math.min(1, 16 * dt);

      // Gear badge
      if (gearNum) {
        gearNum.textContent = String(gear);
      }

      // RPM fill and numeric readout
      if (rpmFill) {
        const rpmPercent = Math.min(100, Math.max(0, ((currentRpm - 800) / (13500 - 800)) * 100));
        rpmFill.style.width = rpmPercent.toFixed(1) + '%';

        // Dynamic LED color gradient
        if (currentRpm > 12200) {
          // Shift light flash (blue/violet shift flash)
          rpmFill.style.background = (Date.now() % 160 < 80) ? '#00f0ff' : '#a855f7';
        } else if (currentRpm > 10500) {
          // Red zone
          rpmFill.style.background = 'linear-gradient(90deg, #eab308, #ff0033)';
        } else if (currentRpm > 7500) {
          // Amber zone
          rpmFill.style.background = 'linear-gradient(90deg, #10b981, #eab308)';
        } else {
          // Green zone
          rpmFill.style.background = '#10b981';
        }
      }

      if (rpmNum) {
        rpmNum.textContent = String(Math.round(currentRpm));
      }

      // Lateral G estimation
      if (gNum) {
        const lateral = (currentSpeed > 50) ? (Math.sin(Date.now() * 0.003) * 2.8 * (currentSpeed / 300)).toFixed(1) : '0.0';
        gNum.textContent = `${lateral}G`;
      }
    }

    // Main animation frame sync loop
    let lastTime = performance.now();
    function tick(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Determine active speed source
      if (window.FreeDriveManager && window.FreeDriveManager.isActive && window.appEngine && window.appEngine.kart) {
        const kartKmh = Math.abs(window.appEngine.kart.speed * 0.55);
        updateSpeed(kartKmh, dt);
      } else if (window.appLenis && Math.abs(window.appLenis.velocity || 0) > 0.05) {
        const scrollKmh = Math.min(335, Math.abs(window.appLenis.velocity) * 0.38);
        updateSpeed(scrollKmh, dt);
      } else if (window.ScrollyCar) {
        updateSpeed(window.ScrollyCar.speed, dt);
      } else {
        updateSpeed(0, dt);
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Public HUD Telemetry API
    window.HudTelemetry = {
      setSpeed,
      updateSpeed,
      get speed() { return currentSpeed; },
      get rpm() { return currentRpm; }
    };

    console.log('[HudTelemetry] Initialized real-time speedometer & LED tachometer.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHudTelemetry);
  } else {
    initHudTelemetry();
  }
})();
