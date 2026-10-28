/**
 * Tincho GP - Master Game Loop & Event Orchestration
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

  // 2 AI Competitor Racers on Track
  const aiRacers = [
    new window.AiRacer(
      track.centerline[3].x,
      track.centerline[3].y,
      track.centerline,
      {
        number: '7',
        primaryColor: '#e10600',
        secondaryColor: '#ffffff',
        helmetColor: '#e10600',
        visorColor: '#000000',
        startIndex: 4,
        targetSpeed: 420
      }
    ),
    new window.AiRacer(
      track.centerline[7].x,
      track.centerline[7].y,
      track.centerline,
      {
        number: '24',
        primaryColor: '#a855f7',
        secondaryColor: '#10b981',
        helmetColor: '#10b981',
        visorColor: '#00f0ff',
        startIndex: 8,
        targetSpeed: 390
      }
    )
  ];

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

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

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

  // Mode Switcher (GP vs Pit-Wall Console)
  const btnToggleMode = document.getElementById('btn-toggle-mode');
  const consoleView = document.getElementById('console-view');

  btnToggleMode.addEventListener('click', () => {
    if (currentMode === 'gp') {
      currentMode = 'console';
      consoleView.classList.add('active');
      btnToggleMode.innerHTML = '<span>🏎️ Play Tincho GP</span>';
      btnToggleMode.classList.add('active');
    } else {
      currentMode = 'gp';
      consoleView.classList.remove('active');
      btnToggleMode.innerHTML = '<span>📋 Pit-Wall Console</span>';
      btnToggleMode.classList.remove('active');
    }
  });

  // Sound Toggle
  const btnSound = document.getElementById('btn-sound');
  btnSound.addEventListener('click', () => {
    const isAudible = window.soundEngine.toggleMute();
    btnSound.textContent = isAudible ? '🔊' : '🔇';
  });

  // Close Drawer Button
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', () => telemetry.closeDrawer());
  }

  let passedSector4 = false;

  // Master Loop
  function loop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    if (currentMode === 'gp') {
      // 1. Update Player Physics
      kart.update(dt, input);

      // 2. Update AI Competitors
      for (const ai of aiRacers) {
        ai.updateAi(dt);
      }

      // 3. Track checkpoints & dynamic elements
      track.update(dt, kart, (cp) => {
        telemetry.openProject(cp.id);
        if (cp.id === 'tesis-futbol') passedSector4 = true;
        if (cp.id === 'udelartex' && passedSector4) {
          telemetry.recordLap();
          passedSector4 = false;
        }
      });

      // 4. Smooth Camera Follow on Player
      const targetCamX = kart.x;
      const targetCamY = kart.y;
      camera.x += (targetCamX - camera.x) * camera.smooth;
      camera.y += (targetCamY - camera.y) * camera.smooth;

      // 5. Render World
      const rect = canvas.getBoundingClientRect();
      const viewW = rect.width;
      const viewH = rect.height;

      ctx.clearRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(viewW / 2, viewH / 2);
      ctx.translate(-camera.x, -camera.y);

      // Draw Track & Checkpoints
      track.draw(ctx, kart);

      // Draw AI Racers
      for (const ai of aiRacers) {
        ai.draw(ctx);
      }

      // Draw Player Kart & Particles
      kart.draw(ctx);

      ctx.restore();

      // 6. Update HUD
      telemetry.updateHUD(kart);
      telemetry.drawMinimap(track, kart, aiRacers);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
