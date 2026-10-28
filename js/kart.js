/**
 * Tincho GP - High-Precision Kart Physics & Detailed Rendering
 */
class Kart {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.angle = options.angle !== undefined ? options.angle : -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.steerAngle = 0;

    // Physical constants
    this.accelPower = 440;
    this.brakePower = 680;
    this.maxSpeed = 540;
    this.reverseMaxSpeed = 130;
    this.friction = 0.985;
    this.drag = 0.00055;
    this.tireGrip = 0.88;
    this.driftFactor = 0;

    // Visuals & styling
    this.width = 26;
    this.length = 46;
    this.wheelTurnAngle = 0;
    this.skidMarks = [];
    this.particles = [];

    // Livery customization
    this.number = options.number || '1';
    this.primaryColor = options.primaryColor || '#00f0ff';
    this.secondaryColor = options.secondaryColor || '#e10600';
    this.helmetColor = options.helmetColor || '#f8fafc';
    this.visorColor = options.visorColor || '#ffb800';
    this.isAi = options.isAi || false;

    // Telemetry stats
    this.rpm = 1200;
    this.gear = 1;
    this.gForce = 0;
    this.prevSpeed = 0;
  }

  update(dt, input) {
    // 1. Steering
    const maxSteer = 0.65;
    let targetSteer = 0;
    if (input.left) targetSteer -= maxSteer;
    if (input.right) targetSteer += maxSteer;

    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, 14 * dt);
    this.wheelTurnAngle = this.steerAngle;

    // 2. Acceleration / Braking
    if (input.up) {
      if (this.speed < this.maxSpeed) {
        this.speed += this.accelPower * dt;
      }
    } else if (input.down) {
      if (this.speed > 5) {
        this.speed -= this.brakePower * dt;
      } else {
        this.speed -= this.accelPower * 0.45 * dt;
        if (this.speed < -this.reverseMaxSpeed) this.speed = -this.reverseMaxSpeed;
      }
    } else {
      this.speed *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.speed) < 2) this.speed = 0;
    }

    this.speed -= Math.sign(this.speed) * (this.speed * this.speed) * this.drag * dt;

    // 3. Turning rate
    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    const turnSensitivity = 2.8 * (0.35 + 0.65 * (1 - speedRatio * 0.45));
    if (Math.abs(this.speed) > 1) {
      const turnDir = this.speed >= 0 ? 1 : -1;
      this.angle += this.steerAngle * turnSensitivity * dt * turnDir;
    }

    // 4. Lateral Drift
    const targetVx = Math.cos(this.angle) * this.speed;
    const targetVy = Math.sin(this.angle) * this.speed;

    let currentGrip = this.tireGrip;
    if (input.handbrake || (Math.abs(this.steerAngle) > 0.5 && this.speed > 250)) {
      currentGrip = 0.56;
    }

    const gripLerp = Math.min(1, currentGrip * 9 * dt);
    this.vx += (targetVx - this.vx) * gripLerp;
    this.vy += (targetVy - this.vy) * gripLerp;

    const currentHeading = Math.atan2(this.vy, this.vx);
    let slipAngle = Math.abs(this.angle - currentHeading);
    while (slipAngle > Math.PI) slipAngle -= Math.PI * 2;
    this.driftFactor = Math.min(1, (Math.abs(slipAngle) / (Math.PI * 0.45)));

    // 5. Position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 6. Skid Marks & Smoke
    if (this.driftFactor > 0.35 && Math.abs(this.speed) > 120) {
      this.addSkidMarks();
      if (Math.random() < 0.6) this.emitSmoke();
      if (!this.isAi && window.soundEngine) {
        window.soundEngine.updateSkid(this.driftFactor);
      }
    } else if (!this.isAi && window.soundEngine) {
      window.soundEngine.updateSkid(0);
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.8;
      p.radius += dt * 14;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.skidMarks.length > 250) {
      this.skidMarks.splice(0, this.skidMarks.length - 250);
    }

    if (!this.isAi) {
      this.updateTelemetry(dt);
    }
  }

  addSkidMarks() {
    const rearOffset = -this.length * 0.38;
    const trackWidth = this.width * 0.46;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    this.skidMarks.push({
      lX: this.x + cos * rearOffset - sin * trackWidth,
      lY: this.y + sin * rearOffset + cos * trackWidth,
      rX: this.x + cos * rearOffset + sin * trackWidth,
      rY: this.y + sin * rearOffset - cos * trackWidth,
      alpha: Math.min(0.65, this.driftFactor * 0.8)
    });
  }

  emitSmoke() {
    const rearOffset = -this.length * 0.4;
    this.particles.push({
      x: this.x + Math.cos(this.angle) * rearOffset + (Math.random() - 0.5) * 12,
      y: this.y + Math.sin(this.angle) * rearOffset + (Math.random() - 0.5) * 12,
      vx: -this.vx * 0.15 + (Math.random() - 0.5) * 30,
      vy: -this.vy * 0.15 + (Math.random() - 0.5) * 30,
      radius: 4 + Math.random() * 5,
      life: 0.8 + Math.random() * 0.4
    });
  }

  updateTelemetry(dt) {
    const kmh = Math.abs(Math.round(this.speed * 0.45));
    let g = 1;
    let rpmBase = 0;
    if (this.speed < -5) {
      g = 'R';
      rpmBase = (Math.abs(this.speed) / this.reverseMaxSpeed) * 6000;
    } else if (kmh < 45) {
      g = 1;
      rpmBase = 2000 + (kmh / 45) * 9000;
    } else if (kmh < 85) {
      g = 2;
      rpmBase = 3500 + ((kmh - 45) / 40) * 8000;
    } else if (kmh < 130) {
      g = 3;
      rpmBase = 4500 + ((kmh - 85) / 45) * 7500;
    } else if (kmh < 175) {
      g = 4;
      rpmBase = 5200 + ((kmh - 130) / 45) * 7000;
    } else if (kmh < 215) {
      g = 5;
      rpmBase = 6000 + ((kmh - 175) / 40) * 6500;
    } else {
      g = 6;
      rpmBase = 7000 + ((kmh - 215) / 50) * 5500;
    }
    this.gear = g;
    this.rpm = Math.min(13500, Math.max(1200, Math.round(rpmBase)));

    const accelKmh = (this.speed - this.prevSpeed) / dt;
    this.gForce = Math.abs((accelKmh / 9.81) * 0.05) + (this.driftFactor * 1.8);
    this.prevSpeed = this.speed;

    if (window.soundEngine) {
      window.soundEngine.updateEngine(this.rpm / 13500, kmh);
    }
  }

  draw(ctx) {
    // 1. Skid Marks
    if (this.skidMarks.length > 1) {
      ctx.save();
      for (let i = 1; i < this.skidMarks.length; i++) {
        const p0 = this.skidMarks[i - 1];
        const p1 = this.skidMarks[i];
        ctx.strokeStyle = `rgba(5, 8, 14, ${p1.alpha})`;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(p0.lX, p0.lY);
        ctx.lineTo(p1.lX, p1.lY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p0.rX, p0.rY);
        ctx.lineTo(p1.rX, p1.rY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Smoke Particles
    if (this.particles.length > 0) {
      ctx.save();
      for (const p of this.particles) {
        ctx.fillStyle = `rgba(220, 230, 245, ${p.life * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Volumetric Headlights
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const lightGradient = ctx.createRadialGradient(25, 0, 10, 180, 0, 190);
    const beamColor = this.primaryColor === '#00f0ff' ? 'rgba(0, 240, 255,' : 'rgba(255, 184, 0,';
    lightGradient.addColorStop(0, `${beamColor} 0.5)`);
    lightGradient.addColorStop(0.35, `${beamColor} 0.15)`);
    lightGradient.addColorStop(1, `${beamColor} 0)`);

    ctx.fillStyle = lightGradient;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.arc(15, 0, 210, -Math.PI * 0.22, Math.PI * 0.22);
    ctx.closePath();
    ctx.fill();

    // 4. Kart Body (High-Detail F1 Style)
    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-this.length * 0.45 + 3, -this.width * 0.5 + 4, this.length * 0.9, this.width);

    // Front Wishbone Suspension Arms
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(6, -6); ctx.lineTo(14, -this.width * 0.52);
    ctx.moveTo(12, -6); ctx.lineTo(15, -this.width * 0.52);
    ctx.moveTo(6, 6); ctx.lineTo(14, this.width * 0.52);
    ctx.moveTo(12, 6); ctx.lineTo(15, this.width * 0.52);
    // Rear Wishbones
    ctx.moveTo(-10, -8); ctx.lineTo(-15, -this.width * 0.52);
    ctx.moveTo(-10, 8); ctx.lineTo(-15, this.width * 0.52);
    ctx.stroke();

    // 4 Wide Slick Tires with Colored Sidewall Line
    this.drawTire(ctx, -this.length * 0.3, -this.width * 0.52, 0);
    this.drawTire(ctx, -this.length * 0.3, this.width * 0.52, 0);
    this.drawTire(ctx, this.length * 0.28, -this.width * 0.52, this.wheelTurnAngle);
    this.drawTire(ctx, this.length * 0.28, this.width * 0.52, this.wheelTurnAngle);

    // Rear Aerodynamic Wing with Endplates
    ctx.fillStyle = this.primaryColor;
    ctx.fillRect(-this.length * 0.46, -this.width * 0.58, 6, this.width * 1.16);
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-this.length * 0.48, -this.width * 0.6, 10, 3);
    ctx.fillRect(-this.length * 0.48, this.width * 0.6 - 3, 10, 3);
    // Rain light
    ctx.fillStyle = '#ff0044';
    ctx.beginPath();
    ctx.arc(-this.length * 0.46, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Chassis Monocoque (Aerodynamic tapered nose)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(this.length * 0.45, 0);
    ctx.lineTo(this.length * 0.15, -this.width * 0.28);
    ctx.lineTo(-this.length * 0.35, -this.width * 0.4);
    ctx.lineTo(-this.length * 0.4, 0);
    ctx.lineTo(-this.length * 0.35, this.width * 0.4);
    ctx.lineTo(this.length * 0.15, this.width * 0.28);
    ctx.closePath();
    ctx.fill();

    // Colored Livery Sidepods
    ctx.fillStyle = this.primaryColor;
    ctx.beginPath();
    ctx.roundRect(-this.length * 0.3, -this.width * 0.42, this.length * 0.45, 4, 2);
    ctx.roundRect(-this.length * 0.3, this.width * 0.42 - 4, this.length * 0.45, 4, 2);
    ctx.fill();

    // Front Wing with Multi-element Flaps
    ctx.fillStyle = this.primaryColor;
    ctx.fillRect(this.length * 0.38, -this.width * 0.54, 5, this.width * 1.08);
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(this.length * 0.32, -this.width * 0.56, 11, 3);
    ctx.fillRect(this.length * 0.32, this.width * 0.56 - 3, 11, 3);

    // Cockpit Tub & Halo
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Halo Safety Ring
    ctx.strokeStyle = this.primaryColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Driver Helmet & Visor
    ctx.fillStyle = this.helmetColor;
    ctx.beginPath();
    ctx.arc(-2, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.visorColor;
    ctx.fillRect(0, -3.5, 3.5, 7);

    // Number Badge
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.length * 0.22, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.number, this.length * 0.22, 0);

    ctx.restore();
  }

  drawTire(ctx, x, y, steer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(steer);
    // Tire rubber
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-6, -3.5, 12, 7, 2);
    ctx.fill();
    // Yellow Pirelli stripe
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * AI Competitor Racer - Follows the circuit line autonomously
 */
class AiRacer extends Kart {
  constructor(x, y, waypoints, options = {}) {
    super(x, y, options);
    this.waypoints = waypoints;
    this.currentWpIndex = options.startIndex || 0;
    this.targetSpeed = options.targetSpeed || 380;
    this.isAi = true;
  }

  updateAi(dt) {
    const targetWp = this.waypoints[this.currentWpIndex];
    const dx = targetWp.x - this.x;
    const dy = targetWp.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Advance to next waypoint
    if (dist < 120) {
      this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
    }

    // Steering towards waypoint
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const fakeInput = {
      up: this.speed < this.targetSpeed,
      down: this.speed > this.targetSpeed + 30,
      left: diff < -0.08,
      right: diff > 0.08,
      handbrake: Math.abs(diff) > 0.5 && this.speed > 260
    };

    this.update(dt, fakeInput);
  }
}

window.Kart = Kart;
window.AiRacer = AiRacer;
