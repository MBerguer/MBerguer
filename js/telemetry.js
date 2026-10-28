/**
 * Tincho GP - Telemetry HUD, Minimap & Project Data Sheets
 */
const PROJECT_DATA = {
  'tsp-light-panel': {
    sector: 'SECTOR 01 // PIT-WALL TELEMETRY',
    title: 'tsp-light-panel',
    subtitle: 'Simulador FIA Standard 3504-2019 de Paneles F1 en Rust Concurrente',
    github: 'https://github.com/MBerguer/tsp-light-panel',
    specs: {
      'Language': 'Rust (Edition 2021)',
      'Concurrency': 'Tokio Actor Model',
      'Protocol': 'Typed WebSocket (Axum)',
      'Compliance': 'FIA Standard 3504-2019'
    },
    architecture: `
      Sistema web de simulación integral para paneles luminosos trackside de Fórmula 1:
      • <b>Modelo de Actores Concurrente:</b> Arquitectura desacoplada sobre <code>tokio</code> donde cada puesto de comisario y panel es un actor independiente.
      • <b>Event Sourcing & Determinismo:</b> Append-only event store con soporte de snapshots para reproducir incidentes y banderas con precisión de milisegundos.
      • <b>Jerarquía de Seguridad Estricta:</b> <code>Race Control > Marshal Post > Trackside Panel</code> con arbitraje de señales en tiempo real.
      • <b>Frontend Reactivo:</b> UI en React + Zustand + trazado SVG de circuito con 3 dashboards operativos en directo.
    `,
    tags: ['Rust', 'Tokio', 'Axum', 'Event Sourcing', 'F1 Telemetry', 'FIA Standard', 'WebSocket']
  },

  'abuse-2026': {
    sector: 'SECTOR 02 // GRAPHICS & ENGINE ARCHITECTURE',
    title: 'Abuse 2026',
    subtitle: 'Modern 64-bit Engine Reconstruction & Real-Time Raytracing in C++',
    github: 'https://github.com/MBerguer/Abuse_2026',
    specs: {
      'Language': 'Modern C++20',
      'Lighting': '2D Dynamic Raytracing',
      'Target FPS': '144+ FPS Uncapped',
      'Legacy Origin': 'Crack dot Com (1996)'
    },
    architecture: `
      Port y modernización profunda del motor del legendario shooter de acción DOS de 1996:
      • <b>Reconstrucción de Memoria:</b> Sustitución del modelo de punteros crudos y memoria segmentada DOS por punteros modernos con gestión RAII.
      • <b>Pipeline de Trazado de Rayos 2D:</b> Implementación de un shader de iluminación dinámica y oclusión volumétrica que revive los sprites retro con sombras realistas.
      • <b>Desacoplamiento de Frame Pacing:</b> Físicas a 60 Hz determinísticas con renderizado interpolado a altas tasas de refresco (144Hz / 240Hz).
    `,
    tags: ['C++20', 'Raytracing', 'Game Engine', 'Custom Shaders', 'Vulkan/OpenGL', 'Retro Computing']
  },

  'alloy-zksync': {
    sector: 'SECTOR 03 // SYSTEMS INFRASTRUCTURE & CRYPTO',
    title: 'alloy-zksync',
    subtitle: 'Infraestructura Rust de Alto Rendimiento para ZKsync Era',
    github: 'https://github.com/MBerguer/alloy-zksync',
    specs: {
      'Language': 'Rust',
      'Ecosystem': 'Alloy Core',
      'Domain': 'Zero-Knowledge Rollups',
      'Performance': 'Zero-Allocation Serialization'
    },
    architecture: `
      Extensión de nivel de sistemas para el ecosistema Alloy en Rust:
      • <b>Serialización de Estado Eficiente:</b> Tipos criptográficos nativos y codificación personalizada de transacciones sin sobrecarga de memoria (Zero-Copy).
      • <b>Ejecución ZK-Rollup:</b> Integración con la máquina virtual de ZKsync Era para pipelines de verificación masiva.
      • <b>Enfoque de Rendimiento:</b> Diseñado para resistir millones de llamadas RPC y pipelines asíncronos con consumo mínimo de CPU.
    `,
    tags: ['Rust', 'Alloy', 'Zero-Knowledge', 'High Throughput', 'Systems Programming', 'Async']
  },

  'tesis-futbol': {
    sector: 'SECTOR 04 // MACHINE LEARNING & PROBABILISTIC SYSTEMS',
    title: 'tesis-futbol (MSc ML UdelaR)',
    subtitle: 'Predicción de Comportamiento y Trayectorias bajo Incertidumbre',
    github: 'https://github.com/MBerguer/tesis-futbol',
    specs: {
      'Institution': 'Universidad de la República',
      'Degree': 'Master\'s in ML & Data Eng',
      'Methodology': 'Probabilistic Graphical Models',
      'Domain': 'High-Entropy Sports Analytics'
    },
    architecture: `
      Investigación de tesis enfocada en la modelación predictiva en entornos multi-agente dinámicos:
      • <b>Modelado de Incertidumbre:</b> Estimación de distribuciones de probabilidad sobre trayectorias futuras de entidades en movimiento continuo.
      • <b>Ingeniería de Datos en Tiempo Real:</b> Procesamiento de secuencias espacio-temporales y extracción de features en baja latencia.
      • <b>Aplicación a la Telemetría:</b> Técnicas de estimación de estados aplicables tanto a táctica deportiva como a predicción de líneas ideales en pista.
    `,
    tags: ['Machine Learning', 'Python', 'PyTorch', 'Probabilistic Models', 'Data Engineering', 'UdelaR']
  },

  'udelartex': {
    sector: 'SECTOR 05 // ACADEMIC STANDARDS & OPEN SOURCE',
    title: 'UdelaRTeX',
    subtitle: 'La Suite Tipográfica Académica Estándar de la UdelaR',
    github: 'https://github.com/MBerguer/UdelaRTeX',
    specs: {
      'Standard': 'LaTeX / TeX Scientific',
      'Adoption': 'Thousands of Students / Researchers',
      'Automation': 'CI/CD Compilation Engine',
      'License': 'Open Source'
    },
    architecture: `
      El marco tipográfico y suite de plantillas oficial de facto para la comunidad académica uruguaya:
      • <b>Estandarización Rigurosa:</b> Cumplimiento automatizado de normativas institucionales de tesis, posgrados y artículos científicos.
      • <b>Tooling y CI/CD:</b> Infraestructura de integración continua para validación y compilación reproducible de documentos complejos.
      • <b>Impacto Comunitario:</b> Proyecto de referencia adoptado de manera transversal por generaciones de ingenieros y científicos en Uruguay.
    `,
    tags: ['LaTeX', 'Open Source', 'Academic Publishing', 'UdelaR', 'CI/CD Automation']
  }
};

class TelemetrySystem {
  constructor() {
    this.speedEl = document.getElementById('speed-num');
    this.gearEl = document.getElementById('gear-num');
    this.rpmBarEl = document.getElementById('rpm-fill');
    this.rpmNumEl = document.getElementById('rpm-num');
    this.gForceEl = document.getElementById('g-num');
    this.lapTimeEl = document.getElementById('lap-time-val');
    this.bestLapEl = document.getElementById('best-lap-val');

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.drawer = document.getElementById('project-drawer');
    this.drawerSector = document.getElementById('drawer-sector');
    this.drawerTitle = document.getElementById('drawer-title');
    this.drawerSub = document.getElementById('drawer-sub');
    this.drawerSpecs = document.getElementById('drawer-specs');
    this.drawerArch = document.getElementById('drawer-arch');
    this.drawerTags = document.getElementById('drawer-tags');
    this.drawerBtn = document.getElementById('drawer-gh-link');

    this.lapStartTime = Date.now();
    this.bestLapMs = null;
  }

  updateHUD(kart) {
    const kmh = Math.abs(Math.round(kart.speed * 0.45));
    if (this.speedEl) this.speedEl.textContent = kmh;
    if (this.gearEl) this.gearEl.textContent = kart.gear;
    if (this.rpmNumEl) this.rpmNumEl.textContent = kart.rpm;
    if (this.rpmBarEl) {
      const pct = Math.min(100, (kart.rpm / 13500) * 100);
      this.rpmBarEl.style.width = `${pct}%`;
    }
    if (this.gForceEl) {
      this.gForceEl.textContent = `${kart.gForce.toFixed(1)}G`;
    }

    // Lap timer
    const elapsed = Date.now() - this.lapStartTime;
    if (this.lapTimeEl) {
      this.lapTimeEl.textContent = this.formatTime(elapsed);
    }
  }

  formatTime(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  recordLap() {
    const elapsed = Date.now() - this.lapStartTime;
    if (!this.bestLapMs || elapsed < this.bestLapMs) {
      this.bestLapMs = elapsed;
      if (this.bestLapEl) this.bestLapEl.textContent = this.formatTime(this.bestLapMs);
    }
    this.lapStartTime = Date.now();
  }

  drawMinimap(track, kart, aiRacers = []) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Bounding box scale
    const scaleX = w / 1400;
    const scaleY = h / 1100;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = 20;
    const offsetY = 15;

    // Track path
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const pts = track.centerline;
    ctx.moveTo(pts[0].x * scale + offsetX, pts[0].y * scale + offsetY);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * scale + offsetX, pts[i].y * scale + offsetY);
    }
    ctx.closePath();
    ctx.stroke();

    // Checkpoint markers
    for (const cp of track.checkpoints) {
      ctx.fillStyle = cp.color;
      ctx.beginPath();
      ctx.arc(cp.x * scale + offsetX, cp.y * scale + offsetY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // AI Racers on Minimap
    for (const ai of aiRacers) {
      ctx.fillStyle = ai.primaryColor;
      ctx.beginPath();
      ctx.arc(ai.x * scale + offsetX, ai.y * scale + offsetY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Kart position marker
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(kart.x * scale + offsetX, kart.y * scale + offsetY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  openProject(projectId) {
    const data = PROJECT_DATA[projectId];
    if (!data) return;

    if (this.drawerSector) this.drawerSector.textContent = data.sector;
    if (this.drawerTitle) this.drawerTitle.textContent = data.title;
    if (this.drawerSub) this.drawerSub.textContent = data.subtitle;

    // Specs
    if (this.drawerSpecs) {
      this.drawerSpecs.innerHTML = Object.entries(data.specs).map(([k, v]) => `
        <div class="spec-item">
          <span class="spec-label">${k}</span>
          <span class="spec-val">${v}</span>
        </div>
      `).join('');
    }

    if (this.drawerArch) {
      this.drawerArch.innerHTML = data.architecture;
    }

    if (this.drawerTags) {
      this.drawerTags.innerHTML = data.tags.map(t => `<span class="tech-tag">${t}</span>`).join('');
    }

    if (this.drawerBtn) {
      this.drawerBtn.href = data.github;
      this.drawerBtn.innerHTML = `<span>Inspect ${data.title} on GitHub</span> ↗`;
    }

    if (this.drawer) {
      this.drawer.classList.add('open');
    }
  }

  closeDrawer() {
    if (this.drawer) {
      this.drawer.classList.remove('open');
    }
  }
}

window.telemetrySystem = new TelemetrySystem();
