<div align="center">

```
  ██████╗ ███████╗██████╗  ██████╗ ██╗   ██╗███████╗██████╗      ██████╗ ██████╗ 
  ██╔══██╗██╔════╝██╔══██╗██╔════╝ ██║   ██║██╔════╝██╔══██╗    ██╔════╝ ██╔══██╗
  ██████╔╝█████╗  ██████╔╝██║  ███╗██║   ██║█████╗  ██████╔╝    ██║  ███╗██████╔╝
  ██╔══██╗██╔══╝  ██╔══██╗██║   ██║██║   ██║██╔══╝  ██╔══██╗    ██║   ██║██╔═══╝ 
  ██████╔╝███████╗██║  ██║╚██████╔╝╚██████╔╝███████╗██║  ██║    ╚██████╔╝██║     
  ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚═╝     
               [ TELEMETRY & LOW-LATENCY SYSTEMS CONSOLE ]
```

### **MARTÍN BERGUER**
**Staff Systems & Simulation Engineer**  
`Rust` • `Low-Latency Concurrency` • `Motorsport Telemetry` • `Applied ML under Uncertainty`

<p align="center">
  <a href="https://linkedin.com/in/mberguer" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <img src="https://img.shields.io/badge/Focus-Rust_Systems_%26_Engine_Simulation-DEA584?style=flat-square&logo=rust&logoColor=black" alt="Rust Systems" />
  <img src="https://img.shields.io/badge/MSc-ML_%26_Data_Eng_(UdelaR)-00529B?style=flat-square" alt="UdelaR MSc" />
  <img src="https://img.shields.io/badge/FIA_Standard-3504--2019_Simulation-E10600?style=flat-square&logo=f1&logoColor=white" alt="FIA 3504-2019" />
  <img src="https://img.shields.io/badge/Base-Montevideo_%2F_Remote-10B981?style=flat-square" alt="Location" />
</p>

---

</div>

```ascii
 ╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 ║  PIT-WALL TELEMETRY STATUS                                                          SIGNAL: LOCKED ║
 ╠══════════════════════╦══════════════════════════════════════════╦══════════════════════════════════════╣
 ║  PRIMARY ENGINE      ║  CONCURRENCY & ACTORS                    ║  DOMAIN INTERSECTION                 ║
 ║  🦀 Rust (Nightly)   ║  Tokio • Event-Sourcing • Zero-Copy      ║  Motorsport Sim • Graphics • ML      ║
 ╚══════════════════════╩══════════════════════════════════════════╩══════════════════════════════════════╝
```

---

### 🏁 THE 5 FLAGSHIP ENGINES

```
  SECTOR 01 ─────────────────────────────────────────────────────────────
```
#### 🏎️ [`tsp-light-panel`](https://github.com/MBerguer/tsp-light-panel) — FIA F1 Track Safety Panel Simulator
> **Full-scale web simulator of Formula 1 trackside light panel systems compliant with FIA Standard 3504-2019.**
- **Architecture:** Pure Rust domain engine with an actor model orchestrated via `tokio`.
- **Determinism:** Append-only event store with snapshotting for bit-accurate race replay and telemetry rewind.
- **Safety State Machine:** Hierarchical authority model (`Race Control` > `Marshal Post` > `Trackside Panel`).
- **Telemetry Gateway:** Typed WebSocket pipeline built on `axum`, feeding a reactive SVG track visualization and operational race dashboards.
- *Stack:* `Rust` • `Tokio` • `Axum` • `Event Sourcing` • `WebSocket` • `TypeScript`

```
  SECTOR 02 ─────────────────────────────────────────────────────────────
```
#### 🎮 [`Abuse_2026`](https://github.com/MBerguer/Abuse_2026) — Cult 1996 DOS Shooter Engine Port + Raytracing
> **Modern 64-bit engine reconstruction of Crack dot Com's classic 1996 sci-fi shooter *Abuse*, upgraded with real-time lighting.**
- **Engine Modernization:** Decoupled legacy DOS memory management and rendering loops into modern cross-platform pipelines.
- **Lighting Pipeline:** Real-time 2D raytracing and dynamic lighting cast through occlusion maps, reviving 90s sprite aesthetics with modern GPU illumination.
- **Precision:** Preserved original physics and projectile mechanics while achieving uncapped 144+ FPS frame pacing.
- *Stack:* `C++20` • `Vulkan / OpenGL` • `Custom Shaders` • `Real-Time Raytracing` • `Game Systems`

```
  SECTOR 03 ─────────────────────────────────────────────────────────────
```
#### ⚡ [`alloy-zksync`](https://github.com/MBerguer/alloy-zksync) — High-Performance Zero-Knowledge Rust Engine
> **Rust systems extension integrating the high-speed Alloy ecosystem with ZKsync Era cryptographic execution.**
- **Low-Overhead Infrastructure:** Memory-efficient state serialization, custom transaction types, and zero-knowledge proof payload encoding in pure Rust.
- **Throughput:** Engineered to eliminate allocation bottlenecks in high-frequency cryptographic submission pipelines.
- *Stack:* `Rust` • `Alloy Core` • `ZK-Rollups` • `Async Concurrency` • `Cryptographic State`

```
  SECTOR 04 ─────────────────────────────────────────────────────────────
```
#### ⚽ [`tesis-futbol`](https://github.com/MBerguer/tesis-futbol) — Behavioral Trajectory Prediction under Uncertainty
> **Master's Thesis Research (UdelaR) — Probabilistic state modeling and real-time trajectory forecasting in high-entropy sports environments.**
- **Applied Inherent Uncertainty:** Formulated continuous-space Markov decision models and spatial-temporal neural architectures to forecast adversarial entity movements.
- **Data Engineering:** High-frequency event streaming, distributed feature extraction, and sub-millisecond inference pipelines.
- *Stack:* `Python` • `PyTorch` • `Probabilistic Modeling` • `Distributed ETL` • `Real-Time Inference`

```
  SECTOR 05 ─────────────────────────────────────────────────────────────
```
#### 📄 [`UdelaRTeX`](https://github.com/MBerguer/UdelaRTeX) — The Academic Typesetting Standard for UdelaR
> **The comprehensive open-source LaTeX suite and template framework adopted across Uruguay's largest university.**
- **Academic Impact:** Empowers thousands of engineering, science, and mathematics students and faculty members to produce peer-review and publication-ready documents.
- **Precision Engineering:** Automated build matrices, typographic micro-spacing, and official institutional branding specifications.
- *Stack:* `TeX / LaTeX` • `CI/CD Automation` • `Open Source Tooling`

---

### 🕹️ BERGUER GRAND PRIX — THE INTERACTIVE EXPERIENCE

Instead of browsing another static portfolio, experience the codebase through an interactive race:

```ascii
      ┌────────────────────────────────────────────────────────────┐
      │  🏎️  PLAY THE BERGUER GP IN YOUR BROWSER                   │
      │  Drive the kart, hit the apex, and inspect live telemetry. │
      │                                                            │
      │  >> [ LAUNCH BERGUER GP: https://mberguer.github.io ] <<   │
      └────────────────────────────────────────────────────────────┘
```
*(Use `W` `A` `S` `D` or arrow keys to steer, drift through sector checkpoints to inspect architecture deep dives, or switch to Pit-Wall Terminal mode).*

---

### 🛠️ CORE ENGINEERING ARSENAL

| Systems & Backend | Motorsport & Graphics | Data & Mathematics | Infrastructure & Cloud |
| :--- | :--- | :--- | :--- |
| **Rust** (Async, Tokio, Actors) | **FIA 3504-2019** Track Safety | **Probabilistic ML** & Bayes | **Docker** & **Kubernetes** |
| **C++20** (Low-level, Memory) | **Real-Time Raytracing** | Spatial-Temporal Modeling | **Terraform** / IaC |
| **TypeScript / Go / Python** | **2D/3D Game Engines** | Sensor Fusion & Telemetry | **GCP / AWS** Systems |
| Zero-Cost Abstractions | Frame Pacing & Shaders | High-Throughput ETL | Prometheus & Observability |

---

<div align="center">

```
 [ PIT STOP: martin.berguer@gmail.com ] • [ MONTEVIDEO, UY ] • [ STATUS: READY TO RACE ]
```

<sub>Built with precision. No cookie-cutter metrics. Just raw engineering, low latency, and clean code.</sub>

</div>
