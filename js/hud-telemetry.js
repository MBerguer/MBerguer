/**
 * GRAND PRIX TELEMETRY // REAL-TIME COCKPIT SPEEDOMETER & LED TACHOMETER HUD
 * High-frequency digital speedometer scaling dynamically from 0 to 360 KM/H with
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

    // Dirty-checking cache to eliminate layout recalculations
    let lastSpeedStr = '';
    let lastGearStr = '';
    let lastRpmStr = '';
    let lastWidthStr = '';
    let lastGStr = '';
    let lastRpmBg = '';

    /**
     * Directly set target speed (0 - 350 KM/H)
     */
    function setSpeed(val) {
      targetSpeed = Math.max(0, Math.min(360, Math.round(val)));
    }

    /**
     * Updates speed with realistic high-rate stepped tick (incrementing/decrementing unit-by-unit)
     */
    function updateSpeed(target, dt = 0.016) {
      targetSpeed = Math.max(0, Math.min(360, Math.round(target)));

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
      const speedStr = String(Math.round(currentSpeed));
      if (speedNum && speedStr !== lastSpeedStr) {
        speedNum.textContent = speedStr;
        lastSpeedStr = speedStr;
      }

      // Calculate Gear & RPM (8-speed F1 gearbox, 360 km/h)
      const pt = window.F1Powertrain.resolve(currentSpeed);
      const gear = pt.gear;
      targetRpm = pt.rpm;

      // Smooth RPM lerp
      targetRpm = Math.min(13500, Math.max(800, targetRpm));
      currentRpm += (targetRpm - currentRpm) * Math.min(1, 16 * dt);

      // Gear badge
      const gearStr = String(gear);
      if (gearNum && gearStr !== lastGearStr) {
        gearNum.textContent = gearStr;
        lastGearStr = gearStr;
      }

      // RPM fill and numeric readout
      if (rpmFill) {
        const rpmPercent = Math.min(100, Math.max(0, ((currentRpm - 800) / (13500 - 800)) * 100));
        const widthStr = rpmPercent.toFixed(1) + '%';
        if (widthStr !== lastWidthStr) {
          rpmFill.style.width = widthStr;
          lastWidthStr = widthStr;
        }

        // Dynamic LED color gradient
        let targetBg = '#10b981';
        if (currentRpm > 12200) {
          targetBg = (Date.now() % 160 < 80) ? '#00f0ff' : '#a855f7';
        } else if (currentRpm > 10500) {
          targetBg = 'linear-gradient(90deg, #eab308, #ff0033)';
        } else if (currentRpm > 7500) {
          targetBg = 'linear-gradient(90deg, #10b981, #eab308)';
        }
        if (targetBg !== lastRpmBg) {
          rpmFill.style.background = targetBg;
          lastRpmBg = targetBg;
        }
      }

      const rpmStr = String(Math.round(currentRpm));
      if (rpmNum && rpmStr !== lastRpmStr) {
        rpmNum.textContent = rpmStr;
        lastRpmStr = rpmStr;
      }

      // Lateral G estimation
      if (gNum) {
        const lateral = (currentSpeed > 50) ? (Math.sin(Date.now() * 0.003) * 2.8 * (currentSpeed / 300)).toFixed(1) : '0.0';
        const gStr = `${lateral}G`;
        if (gStr !== lastGStr) {
          gNum.textContent = gStr;
          lastGStr = gStr;
        }
      }
    }

    // Main animation frame sync loop
    let lastTime = performance.now();
    function tick(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Determine active speed source
      if (window.FreeDriveManager && window.FreeDriveManager.isActive && window.appEngine && window.appEngine.kart) {
        const kartKmh = Math.abs(window.appEngine.kart.speed * (360 / 540));
        updateSpeed(kartKmh, dt);
      } else if (window.appLenis && Math.abs(window.appLenis.velocity || 0) > 0.05) {
        const scrollKmh = Math.min(360, Math.abs(window.appLenis.velocity) * 0.38);
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
