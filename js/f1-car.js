/**
 * GRAND PRIX TELEMETRY // F1 MONOPLAZA RENDERER + POWERTRAIN MODEL
 * Single source of truth for the car sprite (ScrollyCar, Free-Drive kart, AI racers)
 * and for the gearbox / RPM model (modern F1: 8 forward gears, ~360 km/h top speed).
 * Local space: +x is the direction of travel. ZERO headlights are drawn.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // POWERTRAIN: 8-speed seamless-shift gearbox, 360 km/h terminal speed
  // ---------------------------------------------------------------------------
  const MAX_KMH = 360;
  const REDLINE_RPM = 13500;
  const IDLE_RPM = 4200;
  // Speed window of each gear [km/h]
  const GEAR_LO = [0, 72, 106, 141, 176, 212, 250, 300];
  const GEAR_HI = [80, 114, 149, 184, 221, 259, 307, 360];

  function resolvePowertrain(kmh) {
    const v = Math.max(0, Math.min(MAX_KMH, kmh || 0));
    if (v < 1) return { gear: 'N', rpm: IDLE_RPM };
    let g = 0;
    for (let i = GEAR_LO.length - 1; i >= 0; i--) {
      if (v >= GEAR_LO[i]) { g = i; break; }
    }
    const t = Math.min(1, Math.max(0, (v - GEAR_LO[g]) / (GEAR_HI[g] - GEAR_LO[g])));
    const rpmLo = g === 0 ? 5200 : 9800; // post-upshift revs
    const rpm = Math.round(rpmLo + (REDLINE_RPM - 300 - rpmLo) * t);
    return { gear: g + 1, rpm };
  }

  window.F1Powertrain = {
    MAX_KMH,
    REDLINE_RPM,
    GEARS: 8,
    resolve: resolvePowertrain
  };

  // ---------------------------------------------------------------------------
  // RENDERER
  // ---------------------------------------------------------------------------
  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function tyre(ctx, cx, cy, len, wid, steer, compound) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(steer || 0);
    ctx.fillStyle = '#07090d';
    ctx.beginPath();
    ctx.roundRect(-len / 2, -wid / 2, len, wid, 1.6);
    ctx.fill();
    // Tread highlight + compound-coloured sidewall marking
    ctx.fillStyle = '#161b25';
    ctx.fillRect(-len / 2 + 1.2, -wid / 2 + 0.9, len - 2.4, wid - 1.8);
    ctx.strokeStyle = compound;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-len / 2 + 1.4, -wid / 2 + 0.5);
    ctx.lineTo(len / 2 - 1.4, -wid / 2 + 0.5);
    ctx.moveTo(-len / 2 + 1.4, wid / 2 - 0.5);
    ctx.lineTo(len / 2 - 1.4, wid / 2 - 0.5);
    ctx.stroke();
    // Wheel cover / brake duct
    ctx.fillStyle = '#2b3445';
    ctx.fillRect(-len * 0.2, -wid * 0.18, len * 0.4, wid * 0.36);
    ctx.restore();
  }

  function drawF1Car(ctx, o) {
    o = o || {};
    const primary = o.primary || '#00f0ff';
    const secondary = o.secondary || '#e10600';
    const helmet = o.helmet || '#f8fafc';
    const visor = o.visor || '#ffb800';
    const carbon = '#0b1220';
    const carbonLight = '#1a263b';
    const steer = o.steer || 0;
    const compound = o.compound || '#ffd400'; // Pirelli medium

    // 1. Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(1.5, 3, 33, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Suspension (double wishbones)
    ctx.strokeStyle = '#7b8798';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    [-1, 1].forEach((s) => {
      ctx.moveTo(13, s * 3); ctx.lineTo(17, s * 8.2);
      ctx.moveTo(8.5, s * 3.4); ctx.lineTo(17, s * 8.2);
      ctx.moveTo(-14, s * 4); ctx.lineTo(-19, s * 7.6);
      ctx.moveTo(-21, s * 3.6); ctx.lineTo(-19, s * 7.6);
    });
    ctx.stroke();

    // 3. Four tyres (front steer, rear wider)
    [-1, 1].forEach((s) => {
      tyre(ctx, 17, s * 11, 11.5, 6.4, steer, compound);
      tyre(ctx, -19, s * 10.8, 14, 8.2, 0, compound);
    });

    // 4. Front wing (3 elements + endplates)
    ctx.fillStyle = carbon;
    ctx.fillRect(27.2, -11, 3.8, 22);
    ctx.strokeStyle = primary;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(27.2, -11, 3.8, 22);
    ctx.fillStyle = primary;
    ctx.fillRect(24.8, -10.2, 3, 20.4);
    ctx.fillStyle = secondary;
    ctx.fillRect(23.2, -9.4, 2.1, 18.8);
    ctx.fillStyle = secondary;
    ctx.fillRect(23, -11.7, 8.4, 1.1);
    ctx.fillRect(23, 10.6, 8.4, 1.1);

    // 5. Floor plate
    ctx.fillStyle = '#0a0f1a';
    poly(ctx, [[12, -9.5], [-8, -10.6], [-22, -8.2], [-27, -5], [-27, 5],
      [-22, 8.2], [-8, 10.6], [12, 9.5]]);
    ctx.fill();

    // 6. Sidepods with undercut + inlets (mirrored)
    [-1, 1].forEach((s) => {
      ctx.save();
      ctx.scale(1, s);
      ctx.fillStyle = carbonLight;
      poly(ctx, [[7, -5.2], [1, -9.2], [-10, -9.4], [-20, -6.2], [-26, -3],
        [-26, -1.6], [-9, -3.2], [4, -3]]);
      ctx.fill();
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(1, -9.2);
      ctx.lineTo(-10, -9.4);
      ctx.lineTo(-20, -6.2);
      ctx.stroke();
      // Sidepod inlet
      ctx.fillStyle = '#03050a';
      ctx.fillRect(2.2, -8.2, 2, 4.4);
      ctx.restore();
    });

    // 7. Monocoque + nose + engine cover
    ctx.fillStyle = carbon;
    poly(ctx, [[26, 0], [22, -1.7], [11, -3.5], [1, -4.8], [-10, -4.4],
      [-25, -2.1], [-26.5, 0], [-25, 2.1], [-10, 4.4], [1, 4.8], [11, 3.5], [22, 1.7]]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Livery: centre stripe + nose accent
    ctx.fillStyle = primary;
    poly(ctx, [[25, 0], [12, -1.5], [-2, -1.3], [-24, -0.9], [-24, 0.9], [-2, 1.3], [12, 1.5]]);
    ctx.fill();
    ctx.fillStyle = secondary;
    ctx.fillRect(19, -0.9, 5, 1.8);

    // Airbox / engine intake behind the driver
    ctx.fillStyle = '#03050a';
    ctx.beginPath();
    ctx.ellipse(-5, 0, 3.4, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 8. Cockpit opening, driver and halo
    ctx.fillStyle = '#010206';
    ctx.beginPath();
    ctx.ellipse(3.2, 0, 5.2, 2.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = helmet;
    ctx.beginPath();
    ctx.arc(2.6, 0, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = visor;
    ctx.fillRect(3.9, -1.9, 1.5, 3.8);
    ctx.strokeStyle = '#aab6c8';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-1.8, -3.4); ctx.lineTo(7.2, -0.4); ctx.lineTo(8.6, 0);
    ctx.lineTo(7.2, 0.4); ctx.lineTo(-1.8, 3.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-1.8, -3.4);
    ctx.quadraticCurveTo(-3.2, 0, -1.8, 3.4);
    ctx.stroke();

    // Wing mirrors
    ctx.fillStyle = primary;
    ctx.fillRect(6, -7.2, 2.4, 1.3);
    ctx.fillRect(6, 5.9, 2.4, 1.3);

    // Race number on the nose
    if (o.number !== undefined && o.number !== null) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 4.6px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(o.number), 15, 0);
    }

    // 9. Rear wing, DRS flap, beam wing, diffuser
    ctx.fillStyle = '#05080f';
    ctx.fillRect(-27, -6.2, 1.6, 12.4); // beam wing
    ctx.fillStyle = primary;
    ctx.fillRect(-31, -10, 4.2, 20); // main plane
    ctx.fillStyle = carbon;
    const drsShift = o.drs ? 1.4 : 0;
    ctx.fillRect(-30.3 - drsShift, -9.6, 2.6, 19.2); // DRS flap
    if (o.drs) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(-30.3 - drsShift, -9.6, 2.6, 19.2);
    }
    ctx.fillStyle = secondary;
    ctx.fillRect(-31.5, -10.9, 5.6, 1.2);
    ctx.fillRect(-31.5, 9.7, 5.6, 1.2);

    // Rain / brake light
    const lit = o.brake ? '#ff2a2a' : (o.rainLight ? '#ff0033' : '#5a0010');
    ctx.fillStyle = lit;
    if (o.brake) { ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 6; }
    ctx.fillRect(-32, -1.3, 1.6, 2.6);
    ctx.shadowBlur = 0;
  }

  window.F1Car = { draw: drawF1Car, LENGTH: 62, WIDTH: 24 };
  console.log('[F1Car] Hyper-detailed monoplaza renderer + 8-speed powertrain (360 km/h) ready.');
})();
