<div align="center">

<!-- 16-BIT RETRO PADDOCK TELEMETRY HEADER -->
<img src="https://raw.githubusercontent.com/MBerguer/MBerguer/main/assets/header-16bit.svg?v=2" width="100%" alt="Martín Berguer Header" />

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&weight=700&size=18&duration=2800&pause=1000&color=00F0FF&center=true&vCenter=true&width=680&lines=Low-latency+systems+%26+actor-model+engines+in+Rust;FIA+Standard+3504-2019+F1+trackside+simulation;C%2B%2B20+64-bit+engine+reconstruction+%2B+2D+raytracing;Machine+Learning+trajectory+forecasting+under+uncertainty" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://linkedin.com/in/mberguer" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <img src="https://img.shields.io/badge/Primary_Core-Rust_(Tokio_%2F_Actors)-DEA584?style=flat-square&logo=rust&logoColor=black" alt="Rust" />
  <img src="https://img.shields.io/badge/MSc-ML_%26_Data_Eng_(UdelaR)-00529B?style=flat-square" alt="UdelaR MSc" />
  <img src="https://img.shields.io/badge/FIA_Standard-3504--2019_Simulation-E10600?style=flat-square&logo=f1&logoColor=white" alt="FIA 3504-2019" />
  <img src="https://img.shields.io/badge/Base-Montevideo_%2F_Remote-10B981?style=flat-square" alt="Location" />
</p>

</div>

---

### 🕹️ 16-BIT TRACK TELEMETRY // REAL-TIME ARCADE

<!-- 16-BIT CONTINUOUS FORWARD RACE ARCADE (CLICK TO DRIVE IN BROWSER) -->
<div align="center">

<a href="https://mberguer.github.io" target="_blank">
  <img src="https://raw.githubusercontent.com/MBerguer/MBerguer/main/assets/tincho-gp-arcade.svg?v=3" width="100%" alt="16-Bit Track Telemetry Simulator" />
</a>

<p align="center">
  <sub>👆 <b>Haz click en el simulador 16-bit para tomar el volante en tiempo real (60 FPS + audio de motor sintetizado).</b></sub><br/>
  <sub>Controles: <code>W</code> <code>A</code> <code>S</code> <code>D</code> / Flechas para pilotar &bull; <code>ESPACIO</code> / <code>SHIFT</code> para derrapar en las curvas.</sub>
</p>

</div>

---

### 🍱 BENTO GRID // PIT-WALL SYSTEMS ARCHITECTURE

<div align="center">

<table width="100%" border="0" cellspacing="12" cellpadding="16">
  <!-- ROW 1: FLAGSHIP HERO CARD (SPANS FULL WIDTH) -->
  <tr>
    <td colspan="2" bgcolor="#0d1117" style="border: 1px solid #00f0ff; border-radius: 8px;">
      <span style="color:#e10600; font-family:monospace; font-weight:800; font-size:12px;">🏎️ SECTOR 01 // FIA STANDARD 3504-2019 SIMULATOR</span>
      <h3><a href="https://github.com/MBerguer/tsp-light-panel" style="color:#00f0ff; text-decoration:none;">tsp-light-panel</a> — F1 Trackside Light Panel Engine</h3>
      <p style="color:#cbd5e1; font-size:13px; line-height:1.6;">
        Simulador web integral de paneles luminosos de Fórmula 1 conforme al estándar oficial FIA 3504-2019. Motor de dominio puro en <b>Rust</b> estructurado con modelo de actores sobre <code>tokio</code>, event sourcing append-only para replay y auditoría determinística de carrera, jerarquía estricta <code>Race Control > Marshal > Panel</code>, y gateway WebSocket tipado en <code>axum</code>.
      </p>
      <code>Rust</code> &nbsp;•&nbsp; <code>Tokio Actors</code> &nbsp;•&nbsp; <code>Event Sourcing</code> &nbsp;•&nbsp; <code>Axum WS</code> &nbsp;•&nbsp; <code>Deterministic Replay</code> &nbsp;•&nbsp; <code>TypeScript</code>
    </td>
  </tr>

  <!-- ROW 2: TWO COLUMNS (ABUSE 2026 & ALLOY-ZKSYNC) -->
  <tr valign="top">
    <td width="50%" bgcolor="#0d1117" style="border: 1px solid #a855f7; border-radius: 8px;">
      <span style="color:#a855f7; font-family:monospace; font-weight:800; font-size:12px;">🎮 SECTOR 02 // GRAPHICS & RAYTRACING</span>
      <h3><a href="https://github.com/MBerguer/Abuse_2026" style="color:#a855f7; text-decoration:none;">Abuse 2026</a> — 64-Bit Engine Port</h3>
      <p style="color:#94a3b8; font-size:13px; line-height:1.5;">
        Port y reconstrucción completa del clásico shooter DOS de 1996 de Crack dot Com a arquitecturas modernas de 64-bit con <b>C++20</b>. Incorpora un pipeline de trazado de rayos 2D (*raytracing*) con iluminación y oclusión volumétrica dinámica a 144+ FPS.
      </p>
      <code>C++20</code> &nbsp;•&nbsp; <code>2D Raytracing</code> &nbsp;•&nbsp; <code>Game Systems</code> &nbsp;•&nbsp; <code>Vulkan / GL</code>
    </td>
    <td width="50%" bgcolor="#0d1117" style="border: 1px solid #00f0ff; border-radius: 8px;">
      <span style="color:#00f0ff; font-family:monospace; font-weight:800; font-size:12px;">⚡ SECTOR 03 // LOW-OVERHEAD CRYPTO</span>
      <h3><a href="https://github.com/MBerguer/alloy-zksync" style="color:#00f0ff; text-decoration:none;">alloy-zksync</a> — Rust Infrastructure</h3>
      <p style="color:#94a3b8; font-size:13px; line-height:1.5;">
        Extensión de nivel de sistemas para el ecosistema Alloy en <b>Rust</b> orientada a ZKsync Era. Serialización y codificación de transacciones criptográficas sin asignaciones redundantes en memoria (*Zero-Copy*), minimizando la sobrecarga de CPU.
      </p>
      <code>Rust</code> &nbsp;•&nbsp; <code>Alloy Core</code> &nbsp;•&nbsp; <code>ZK-Rollups</code> &nbsp;•&nbsp; <code>Zero-Copy</code>
    </td>
  </tr>

  <!-- ROW 3: TWO COLUMNS (TESIS ML & UDELARTEX) -->
  <tr valign="top">
    <td width="50%" bgcolor="#0d1117" style="border: 1px solid #ffb800; border-radius: 8px;">
      <span style="color:#ffb800; font-family:monospace; font-weight:800; font-size:12px;">⚽ SECTOR 04 // APPLIED MACHINE LEARNING</span>
      <h3><a href="https://github.com/MBerguer/tesis-futbol" style="color:#ffb800; text-decoration:none;">tesis-futbol</a> — Uncertainty Forecasting</h3>
      <p style="color:#94a3b8; font-size:13px; line-height:1.5;">
        Tesis de Maestría en ML & Data Engineering (UdelaR). Estimación de estados y predicción de trayectorias en entornos deportivos y dinámicos de alta entropía bajo incertidumbre inherente con modelos gráficos probabilísticos.
      </p>
      <code>Python</code> &nbsp;•&nbsp; <code>Probabilistic ML</code> &nbsp;•&nbsp; <code>PyTorch</code> &nbsp;•&nbsp; <code>Real-Time ETL</code>
    </td>
    <td width="50%" bgcolor="#0d1117" style="border: 1px solid #10b981; border-radius: 8px;">
      <span style="color:#10b981; font-family:monospace; font-weight:800; font-size:12px;">📄 SECTOR 05 // SCIENTIFIC OPEN SOURCE</span>
      <h3><a href="https://github.com/MBerguer/UdelaRTeX" style="color:#10b981; text-decoration:none;">UdelaRTeX</a> — Institutional Suite</h3>
      <p style="color:#94a3b8; font-size:13px; line-height:1.5;">
        La suite tipográfica de referencia adoptada masivamente por miles de estudiantes, docentes y posgraduados de la Universidad de la República. Automatización CI/CD y estandarización tipográfica rigurosa.
      </p>
      <code>LaTeX / TeX</code> &nbsp;•&nbsp; <code>CI/CD Pipelines</code> &nbsp;•&nbsp; <code>Open Source</code>
    </td>
  </tr>
</table>

</div>

---

### 🔍 TELEMETRY DEEP DIVES (EXPANDIBLE DIRECTO EN GITHUB)

<details>
<summary><b>🏎️ SECTOR 01: tsp-light-panel (FIA Standard 3504-2019 en Rust)</b></summary>
<br/>

- **Lenguaje & Concurrencia:** Rust (Nightly / 2021) • Modelo de actores asíncrono sobre `tokio`.
- **Event Sourcing:** Log de eventos append-only con snapshots en disco para reproducción determinística milisegundo a milisegundo.
- **WebSocket Gateway:** Servidor en `axum` con mensajes serializados mediante `ts-rs` hacia la UI React con trazado vectorial SVG.
- **Repositorio:** [github.com/MBerguer/tsp-light-panel](https://github.com/MBerguer/tsp-light-panel)
</details>

<details>
<summary><b>🎮 SECTOR 02: Abuse 2026 (Port de Motor a 64-bit + Raytracing en C++20)</b></summary>
<br/>

- **Arquitectura Gráfica:** Modernización del loop original de DOS a un pipeline con Shaders y trazado de rayos bidimensional en tiempo real.
- **Oclusión Volumétrica:** Sombras y luces dinámicas proyectadas desde los disparos y fuentes ambientales sobre mapas de oclusión de sprites retro.
- **Frame Pacing:** Físicas determinísticas a 60 Hz con renderizado interpolado desacoplado para monitores de 144Hz+.
- **Repositorio:** [github.com/MBerguer/Abuse_2026](https://github.com/MBerguer/Abuse_2026)
</details>

<details>
<summary><b>⚡ SECTOR 03: alloy-zksync (Infraestructura Rust de Alto Rendimiento)</b></summary>
<br/>

- **Zero-Allocation State:** Serialización criptográfica Zero-Copy optimizada para pipelines masivos en la EVM de ZKsync Era.
- **Eficiencia de CPU:** Eliminación de overhead de asignación en memoria para soportar alto throughput transaccional.
- **Repositorio:** [github.com/MBerguer/alloy-zksync](https://github.com/MBerguer/alloy-zksync)
</details>

<details>
<summary><b>⚽ SECTOR 04: tesis-futbol (Predicción de Trayectorias bajo Incertidumbre)</b></summary>
<br/>

- **Investigación de Posgrado:** Maestría en Machine Learning y Data Engineering (Universidad de la República).
- **Modelación Estocástica:** Modelos gráficos probabilísticos aplicados a trayectorias dinámicas multiobjeto en entornos de alta entropía.
- **Pipeline de Datos:** Extracción de features espacio-temporales e inferencia de baja latencia.
- **Repositorio:** [github.com/MBerguer/tesis-futbol](https://github.com/MBerguer/tesis-futbol)
</details>

<details>
<summary><b>📄 SECTOR 05: UdelaRTeX (La Suite Tipográfica de la UdelaR)</b></summary>
<br/>

- **Estandarización Académica:** Plantillas oficiales para tesis, monografías y papers científicos adoptadas por miles de universitarios.
- **Automatización CI/CD:** Compilación reproducible y chequeos tipográficos automáticos.
- **Repositorio:** [github.com/MBerguer/UdelaRTeX](https://github.com/MBerguer/UdelaRTeX)
</details>

---

### 🛠️ CORE ENGINEERING ARSENAL

```ascii
 ┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
 │  🦀 Rust Systems Core        │  🏎️ Simulation & Graphics     │  🤖 Data & Applied Math      │
 ├──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │  • Async Tokio & Actor Model │  • FIA Standard 3504-2019    │  • Probabilistic ML (UdelaR) │
 │  • Zero-Cost Abstractions    │  • 2D Real-Time Raytracing   │  • Spatial-Temporal Modeling │
 │  • High-Throughput Pipelines │  • C++20 Memory Safety       │  • Real-Time Sensor Fusion   │
 │  • Memory Profiling / SIMD   │  • Game Engine Architecture  │  • Distributed ETL / Streams │
 └──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

<div align="center">

```
 [ PIT STOP: martin.berguer@gmail.com ] • [ MONTEVIDEO, UY ] • [ STATUS: READY TO RACE ]
```

<sub>Diseñado con precisión. Cero métricas genéricas de IA. Solo ingeniería de sistemas, baja latencia y código limpio.</sub>

</div>
