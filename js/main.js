/**
 * Track Simulator - Master Game Loop & Event Orchestration
 */
(function() {
  const canvas = document.getElementById('circuit-canvas');
  const ctx = canvas.getContext('2d');

  // Track & Telemetry Systems
  const track = new window.Track();
  const telemetry = window.telemetrySystem;

  // Player Kart (Tincho #1 - Cyan & Carbon)
  const kart = new window.Kart(300, 720, {
    number: '1',
    primaryColor: '#00f0ff',
    secondaryColor: '#e10600',
    helmetColor: '#f8fafc',
    visorColor: '#ffb800'
  });

  const camera = {
    x: kart.x,
    y: kart.y,
    smooth: 0.1
  };

  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    handbrake: false
  };

  let lastTime = performance.now();
  let currentMode = 'gp'; // 'gp' or 'console'

  // Only resize if CanvasStage is not already handling high-DPI scaling
  if (!window.CanvasStage) {
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        input.up = true;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        input.down = true;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        input.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        input.right = true;
        break;
      case ' ':
      case 'Shift':
        input.handbrake = true;
        break;
      case 'Escape':
        telemetry.closeDrawer();
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        input.up = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        input.down = false;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        input.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        input.right = false;
        break;
      case ' ':
      case 'Shift':
        input.handbrake = false;
        break;
    }
  });

  // Mobile Touch Controls
  function bindTouch(btnId, keyName) {
    const el = document.getElementById(btnId);
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      input[keyName] = true;
    }, { passive: false });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      input[keyName] = false;
    }, { passive: false });
  }

  bindTouch('btn-touch-up', 'up');
  bindTouch('btn-touch-down', 'down');
  bindTouch('btn-touch-left', 'left');
  bindTouch('btn-touch-right', 'right');
  bindTouch('btn-touch-drift', 'handbrake');

  // Mode Switcher (GP vs Pit-Wall Console) - Protected against null elements
  const btnToggleMode = document.getElementById('btn-toggle-mode');
  const consoleView = document.getElementById('console-view');

  if (btnToggleMode && consoleView) {
    btnToggleMode.addEventListener('click', () => {
      if (currentMode === 'gp') {
        currentMode = 'console';
        consoleView.classList.add('active');
        btnToggleMode.innerHTML = '<span>🏎️ Play Track Simulator</span>';
        btnToggleMode.classList.add('active');
      } else {
        currentMode = 'gp';
        consoleView.classList.remove('active');
        btnToggleMode.innerHTML = '<span>📋 Pit-Wall Console</span>';
        btnToggleMode.classList.remove('active');
      }
    });
  }

  // Sound Toggle - Protected against null elements
  const btnSound = document.getElementById('btn-sound');
  if (btnSound && window.soundEngine && typeof window.soundEngine.toggleMute === 'function') {
    btnSound.addEventListener('click', () => {
      const isAudible = window.soundEngine.toggleMute();
      btnSound.textContent = isAudible ? '🔊' : '🔇';
    });
  }

  // Close Drawer Button - Protected against null elements
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  if (btnCloseDrawer && telemetry && typeof telemetry.closeDrawer === 'function') {
    btnCloseDrawer.addEventListener('click', () => telemetry.closeDrawer());
  }

  let passedSector4 = false;

  // Master Loop (Executes only when in Free-Drive mode, avoiding canvas conflicts with Scrollytelling)
  function loop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    const isFreeDrive = window.FreeDriveManager && window.FreeDriveManager.isActive;

    if (isFreeDrive) {
      // 1. Update Player Physics
      kart.update(dt, input);

      // 2. Track checkpoints & dynamic elements
      track.update(dt, kart, (cp) => {
        if (window.FreeDriveManager && typeof window.FreeDriveManager.openDrawer === 'function') {
          // Handled via FreeDriveManager
        } else if (telemetry && typeof telemetry.openProject === 'function') {
          telemetry.openProject(cp.id);
        }
        if (cp.id === 'tesis-futbol') passedSector4 = true;
        if (cp.id === 'udelartex' && passedSector4) {
          if (telemetry && typeof telemetry.recordLap === 'function') {
            telemetry.recordLap();
          }
          passedSector4 = false;
        }
      });

      // 3. Smooth Camera Follow on Player
      const targetCamX = kart.x;
      const targetCamY = kart.y;
      camera.x += (targetCamX - camera.x) * camera.smooth;
      camera.y += (targetCamY - camera.y) * camera.smooth;

      // 4. Render Manual Kart (into the stage without clearing TrackRenderer)
      kart.draw(ctx);

      // 5. Update HUD
      if (telemetry && typeof telemetry.updateHUD === 'function') {
        telemetry.updateHUD(kart);
      }
      if (telemetry && typeof telemetry.drawMinimap === 'function') {
        telemetry.drawMinimap(track, kart);
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // 6. Export appEngine to window for FreeDriveManager, TouchControls & AudioDSP coupling
  window.appEngine = {
    kart: kart,
    input: input,
    camera: camera,
    track: track,
    telemetry: telemetry,
    get currentMode() { return currentMode; },
    set currentMode(m) { currentMode = m; }
  };
})();
