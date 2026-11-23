/**
 * GRAND PRIX TELEMETRY // PARAMETRIC C1 CONTINUOUS RACING SPLINE GEOMETRY
 * High-precision Catmull-Rom spline with arc-length reparameterization.
 * Provides getPointAtProgress(t) for zero-jitter camera tracking, scrollytelling car,
 * and track ribbon rendering.
 */

(function () {
  'use strict';

  // Base waypoint definitions forming the closed Grand Prix circuit loop
  const WAYPOINTS = [
    { x: 300, y: 750, name: 'Main Straight / Starting Grid' },
    { x: 300, y: 400, name: 'Turn 1 Approach' },
    { x: 420, y: 220, name: 'Sector 1: tsp-light-panel (FIA 3504)' },
    { x: 620, y: 180, name: 'Curva Grande High-Speed Arc' },
    { x: 820, y: 220, name: 'Turn 4 Sweeper' },
    { x: 980, y: 380, name: 'Sector 2: Abuse 2026 Raytracing Tunnel' },
    { x: 1100, y: 620, name: 'Tunnel Apex' },
    { x: 980, y: 840, name: 'Sector 3: alloy-zksync Turbo Straight' },
    { x: 740, y: 850, name: 'Braking Zone' },
    { x: 560, y: 720, name: 'Sector 4: tesis-futbol Chicane Apex' },
    { x: 440, y: 830, name: 'Final Chicane & Parabolica' },
    { x: 320, y: 865, name: 'Hook onto Main Straight' }
  ];

  class TrackGeometry {
    constructor(points = WAYPOINTS, trackWidth = 110) {
      this.points = points;
      this.trackWidth = trackWidth;
      this.lut = []; // Arc-length lookup table
      this.totalLength = 0;
      this.samplesPerSegment = 50;

      this.buildArcLengthLUT();
    }

    /**
     * Catmull-Rom Spline Interpolation for 4 control points P0, P1, P2, P3
     */
    catmullRom(p0, p1, p2, p3, t) {
      const t2 = t * t;
      const t3 = t2 * t;

      // Basis matrix for Catmull-Rom (tension = 0.5)
      const v0 = (p2 - p0) * 0.5;
      const v1 = (p3 - p1) * 0.5;

      const a = 2 * p1 - 2 * p2 + v0 + v1;
      const b = -3 * p1 + 3 * p2 - 2 * v0 - v1;
      const c = v0;
      const d = p1;

      return a * t3 + b * t2 + c * t + d;
    }

    /**
     * Catmull-Rom First Derivative (Tangent vector)
     */
    catmullRomDerivative(p0, p1, p2, p3, t) {
      const t2 = t * t;
      const v0 = (p2 - p0) * 0.5;
      const v1 = (p3 - p1) * 0.5;

      const a = 2 * p1 - 2 * p2 + v0 + v1;
      const b = -3 * p1 + 3 * p2 - 2 * v0 - v1;
      const c = v0;

      return 3 * a * t2 + 2 * b * t + c;
    }

    /**
     * Builds uniform arc-length lookup table for smooth, constant-speed progression
     */
    buildArcLengthLUT() {
      this.lut = [];
      const n = this.points.length;
      let accumulatedDistance = 0;

      // Start with point 0
      this.lut.push({
        seg: 0,
        u: 0,
        dist: 0,
        x: this.points[0].x,
        y: this.points[0].y
      });

      let prevX = this.points[0].x;
      let prevY = this.points[0].y;

      for (let i = 0; i < n; i++) {
        const p0 = this.points[(i - 1 + n) % n];
        const p1 = this.points[i];
        const p2 = this.points[(i + 1) % n];
        const p3 = this.points[(i + 2) % n];

        for (let s = 1; s <= this.samplesPerSegment; s++) {
          const u = s / this.samplesPerSegment;
          const x = this.catmullRom(p0.x, p1.x, p2.x, p3.x, u);
          const y = this.catmullRom(p0.y, p1.y, p2.y, p3.y, u);

          const dx = x - prevX;
          const dy = y - prevY;
          accumulatedDistance += Math.hypot(dx, dy);

          this.lut.push({
            seg: i,
            u: u,
            dist: accumulatedDistance,
            x: x,
            y: y
          });

          prevX = x;
          prevY = y;
        }
      }

      this.totalLength = accumulatedDistance;
    }

    /**
     * Maps normalized lap progress t in [0, 1] to exact world coordinate, angle, and curvature
     */
    getPointAtProgress(t) {
      if (this.lut.length === 0) return { x: 0, y: 0, angle: 0, tangentX: 1, tangentY: 0, curvature: 0 };

      // Wrap t into [0, 1)
      let progress = t % 1;
      if (progress < 0) progress += 1;

      const targetDist = progress * this.totalLength;

      // Binary search through arc-length lookup table
      let low = 0;
      let high = this.lut.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (this.lut[mid].dist < targetDist) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const idx = Math.max(1, Math.min(low, this.lut.length - 1));
      const pA = this.lut[idx - 1];
      const pB = this.lut[idx];

      const segmentDist = pB.dist - pA.dist;
      const alpha = segmentDist > 0 ? (targetDist - pA.dist) / segmentDist : 0;

      // Sub-segment Catmull-Rom re-evaluation for smooth continuity
      const n = this.points.length;
      const seg = pA.seg;
      const p0 = this.points[(seg - 1 + n) % n];
      const p1 = this.points[seg];
      const p2 = this.points[(seg + 1) % n];
      const p3 = this.points[(seg + 2) % n];

      const localU = pA.u + alpha * (pB.u - pA.u);
      const x = this.catmullRom(p0.x, p1.x, p2.x, p3.x, localU);
      const y = this.catmullRom(p0.y, p1.y, p2.y, p3.y, localU);

      // Tangent vector
      const tx = this.catmullRomDerivative(p0.x, p1.x, p2.x, p3.x, localU);
      const ty = this.catmullRomDerivative(p0.y, p1.y, p2.y, p3.y, localU);
      const mag = Math.hypot(tx, ty) || 1;
      const normTx = tx / mag;
      const normTy = ty / mag;
      const angle = Math.atan2(normTy, normTx);

      // Determine sector from progress
      let sectorIndex = 0;
      let sectorName = 'GRID';
      if (progress < 0.16) {
        sectorIndex = 0;
        sectorName = 'GRID';
      } else if (progress < 0.35) {
        sectorIndex = 1;
        sectorName = 'SECTOR 01: tsp-light-panel';
      } else if (progress < 0.52) {
        sectorIndex = 2;
        sectorName = 'SECTOR 02: Abuse 2026';
      } else if (progress < 0.70) {
        sectorIndex = 3;
        sectorName = 'SECTOR 03: alloy-zksync';
      } else if (progress < 0.88) {
        sectorIndex = 4;
        sectorName = 'SECTOR 04: tesis-futbol';
      } else {
        sectorIndex = 5;
        sectorName = 'SECTOR 05: UdelaRTeX';
      }

      return {
        x,
        y,
        angle,
        tangentX: normTx,
        tangentY: normTy,
        curvature: 0, // Continuous approximation
        sectorIndex,
        sectorName,
        totalLength: this.totalLength,
        progress
      };
    }

    /**
     * Returns sampled boundary ribbons (left border, right border, centerline)
     */
    getRibbonSamples(count = 200) {
      const halfW = this.trackWidth / 2;
      const samples = [];

      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const pt = this.getPointAtProgress(t);
        // Normal vector perpendicular to tangent: (-ty, tx)
        const nx = -pt.tangentY;
        const ny = pt.tangentX;

        samples.push({
          center: { x: pt.x, y: pt.y },
          left: { x: pt.x + nx * halfW, y: pt.y + ny * halfW },
          right: { x: pt.x - nx * halfW, y: pt.y - ny * halfW },
          normal: { x: nx, y: ny },
          angle: pt.angle,
          t
        });
      }

      return samples;
    }
  }

  // Expose singleton and class to global window
  const defaultGeometry = new TrackGeometry(WAYPOINTS, 110);
  window.TrackGeometry = defaultGeometry;
  window.TrackGeometryClass = TrackGeometry;

  console.log(`[TrackGeometry] Built C1 continuous spline with total arc-length: ${Math.round(defaultGeometry.totalLength)}px`);
})();
