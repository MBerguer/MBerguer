/**
 * Track Simulator - Circuit Geometry, Sectors & Interactive Checkpoints
 */
class Track {
  constructor() {
    // Waypoints forming a high-speed technical circuit with chicanes, hairpins and straights
    this.centerline = [
      { x: 300, y: 700 },  // Start / Finish Straight (Sector 5 - UdelaRTeX)
      { x: 300, y: 350 },  // Heading to Turn 1
      { x: 420, y: 200 },  // Sector 1: FIA Light Panels (tsp-light-panel)
      { x: 750, y: 200 },  // High speed sweeper
      { x: 950, y: 350 },  // Sector 2: Abuse 2026 Raytracing Tunnel Entrance
      { x: 1100, y: 600 }, // Inside the Tunnel
      { x: 980, y: 850 },  // Sector 3: alloy-zksync Rust Turbo Straight
      { x: 700, y: 850 },  // Heavy braking zone
      { x: 550, y: 650 },  // Sector 4: tesis-futbol Predictive Chicane Apex
      { x: 450, y: 820 },  // Final chicane onto straight
      { x: 300, y: 850 }   // Hook back into Start Line
    ];

    this.trackWidth = 140;

    // 5 Signature Project Checkpoints
    this.checkpoints = [
      {
        id: 'tsp-light-panel',
        sector: 'SECTOR 01',
        title: 'tsp-light-panel',
        subtitle: 'Simulador FIA Standard 3504-2019 de Paneles F1 en Rust',
        x: 585,
        y: 200,
        radius: 90,
        color: '#e10600',
        active: false,
        flagState: 'GREEN' // Cycles GREEN -> YELLOW -> RED on kart approach
      },
      {
        id: 'abuse-2026',
        sector: 'SECTOR 02',
        title: 'Abuse 2026',
        subtitle: 'Engine Port & Raytracing en C++ del clásico DOS de 1996',
        x: 1025,
        y: 475,
        radius: 95,
        color: '#a855f7',
        active: false
      },
      {
        id: 'alloy-zksync',
        sector: 'SECTOR 03',
        title: 'alloy-zksync',
        subtitle: 'Infraestructura Rust de alta velocidad para ZKsync Era',
        x: 840,
        y: 850,
        radius: 90,
        color: '#00f0ff',
        active: false
      },
      {
        id: 'tesis-futbol',
        sector: 'SECTOR 04',
        title: 'tesis-futbol',
        subtitle: 'Predicción de Comportamiento y Trayectorias bajo Incertidumbre (UdelaR)',
        x: 550,
        y: 650,
        radius: 85,
        color: '#ffb800',
        active: false
      },
      {
        id: 'udelartex',
        sector: 'SECTOR 05',
        title: 'UdelaRTeX',
        subtitle: 'La Suite Tipográfica Académica estándar de la UdelaR',
        x: 300,
        y: 620,
        radius: 80,
        color: '#10b981',
        active: false
      }
    ];

    this.pulseTime = 0;
  }

  update(dt, kart, onTriggerCheckpoint) {
    this.pulseTime += dt;

    // Cycle FIA light panel simulation (tsp-light-panel)
    const tspCp = this.checkpoints[0];
    const distToTsp = Math.hypot(kart.x - tspCp.x, kart.y - tspCp.y);
    if (distToTsp < 240) {
      const cycle = Math.floor(this.pulseTime * 3) % 3;
      tspCp.flagState = cycle === 0 ? 'GREEN' : cycle === 1 ? 'YELLOW' : 'DOUBLE_YELLOW';
    } else {
      tspCp.flagState = 'GREEN';
    }

    // Checkpoint proximity checks
    for (const cp of this.checkpoints) {
      const d = Math.hypot(kart.x - cp.x, kart.y - cp.y);
      if (d < cp.radius) {
        if (!cp.active) {
          cp.active = true;
          if (window.soundEngine) window.soundEngine.playCheckpointChime();
          if (onTriggerCheckpoint) onTriggerCheckpoint(cp);
        }
      } else if (d > cp.radius * 1.5) {
        cp.active = false;
      }
    }
  }

  draw(ctx, kart) {
    // 1. Draw Asphalt Circuit
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer Asphalt Border (Curb foundation)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = this.trackWidth + 18;
    this.drawPath(ctx);

    // Curbs (Alternating red & white FIA Kerbs)
    ctx.strokeStyle = '#e10600';
    ctx.lineWidth = this.trackWidth + 12;
    ctx.setLineDash([20, 20]);
    this.drawPath(ctx);
    ctx.setLineDash([]);

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = this.trackWidth + 12;
    ctx.setLineDash([0, 20, 20, 0]);
    this.drawPath(ctx);
    ctx.setLineDash([]);

    // Main Smooth Racing Asphalt
    ctx.strokeStyle = '#101522';
    ctx.lineWidth = this.trackWidth;
    this.drawPath(ctx);

    // Racing Line (Rubbered-in groove)
    ctx.strokeStyle = 'rgba(5, 8, 14, 0.4)';
    ctx.lineWidth = this.trackWidth * 0.45;
    this.drawPath(ctx);

    // Dashed Centerline (Fluorescent track guide)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 25]);
    this.drawPath(ctx);
    ctx.setLineDash([]);

    // 2. Start / Finish Line (Sector 5 Checkered)
    this.drawFinishLine(ctx, 300, 680);

    // 3. Draw Signature Sector Elements
    this.drawFIAStation(ctx, this.checkpoints[0]);
    this.drawAbuseTunnel(ctx, this.checkpoints[1]);
    this.drawAlloyTurboZone(ctx, this.checkpoints[2]);
    this.drawMLTrajectoryLine(ctx, kart, this.checkpoints[3]);
    this.drawAcademicPodium(ctx, this.checkpoints[4]);

    // 4. Draw Checkpoint Waypoint Holograms
    for (const cp of this.checkpoints) {
      this.drawCheckpointHologram(ctx, cp);
    }
  }

  drawPath(ctx) {
    ctx.beginPath();
    const pts = this.centerline;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  drawFinishLine(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    const boxW = 12;
    const boxH = 12;
    const totalW = this.trackWidth * 0.9;
    const cols = Math.floor(totalW / boxW);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 2; r++) {
        ctx.fillStyle = (c + r) % 2 === 0 ? '#ffffff' : '#0a0d14';
        ctx.fillRect(-totalW / 2 + c * boxW, r * boxH - boxH, boxW, boxH);
      }
    }
    ctx.restore();
  }

  drawFIAStation(ctx, cp) {
    // FIA Light Panel array (Simulating tsp-light-panel)
    ctx.save();
    ctx.translate(cp.x, cp.y - 70);

    // Gantry post
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-50, -10, 100, 20);

    // LED Matrix display (Standard 3504-2019)
    let ledColor = '#10b981'; // Green
    if (cp.flagState === 'YELLOW' || cp.flagState === 'DOUBLE_YELLOW') {
      ledColor = '#ffb800'; // Yellow
    }

    ctx.fillStyle = '#05070a';
    ctx.fillRect(-45, -8, 90, 16);

    ctx.fillStyle = ledColor;
    ctx.shadowColor = ledColor;
    ctx.shadowBlur = 15;
    for (let i = -35; i <= 35; i += 12) {
      ctx.beginPath();
      ctx.arc(i, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FIA 3504-2019 PANEL', 0, 22);

    ctx.restore();
  }

  drawAbuseTunnel(ctx, cp) {
    // Dark Industrial Bunker with Raytraced Ambience
    ctx.save();
    ctx.translate(cp.x, cp.y);

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ABUSE 2026 // RAYTRACE ZONE', 0, -50);

    ctx.restore();
  }

  drawAlloyTurboZone(ctx, cp) {
    // Neon speed markings on asphalt
    ctx.save();
    ctx.translate(cp.x, cp.y);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    for (let i = -30; i <= 30; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i - 10, -15);
      ctx.lineTo(i, 0);
      ctx.lineTo(i - 10, 15);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ALLOY ZKSYNC // RUST BOOST', 0, 32);

    ctx.restore();
  }

  drawMLTrajectoryLine(ctx, kart, cp) {
    // Dynamic trajectory projection (Simulating tesis-futbol prediction under uncertainty)
    ctx.save();
    const dist = Math.hypot(kart.x - cp.x, kart.y - cp.y);

    if (dist < 260) {
      ctx.strokeStyle = '#ffb800';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.shadowColor = '#ffb800';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(kart.x, kart.y);

      // Model future trajectory based on kart velocity & steer
      let px = kart.x;
      let py = kart.y;
      let pAngle = kart.angle;
      for (let step = 0; step < 8; step++) {
        pAngle += kart.steerAngle * 0.15;
        px += Math.cos(pAngle) * 22;
        py += Math.sin(pAngle) * 22;
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffb800';
      ctx.font = '10px monospace';
      ctx.fillText('ML TRAJECTORY ESTIMATOR', cp.x - 60, cp.y - 45);
    }
    ctx.restore();
  }

  drawAcademicPodium(ctx, cp) {
    ctx.save();
    ctx.translate(cp.x - 70, cp.y);

    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.fillText('UDELARTEX // FINISH PIT', 0, 0);
    ctx.restore();
  }

  drawCheckpointHologram(ctx, cp) {
    ctx.save();
    ctx.translate(cp.x, cp.y);

    const pulse = Math.sin(this.pulseTime * 4) * 5;
    ctx.strokeStyle = cp.color;
    ctx.lineWidth = cp.active ? 3 : 1.5;
    ctx.shadowColor = cp.color;
    ctx.shadowBlur = cp.active ? 20 : 8;

    // Outer pulsing ring
    ctx.beginPath();
    ctx.arc(0, 0, cp.radius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Center icon diamond
    ctx.fillStyle = cp.color;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();

    // Sector tag
    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cp.sector, 0, -cp.radius - 12);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(cp.title, 0, cp.radius + 18);

    ctx.restore();
  }
}

window.Track = Track;
