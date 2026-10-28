/**
 * Tincho GP - High-Precision Kart Physics & Rendering
 */
class Kart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2; // Facing north along start straight
    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.steerAngle = 0;

    // Physical constants
    this.accelPower = 420;
    this.brakePower = 650;
    this.maxSpeed = 520;
    this.reverseMaxSpeed = 120;
    this.friction = 0.985;
    this.drag = 0.0006;
    this.tireGrip = 0.88;
    this.driftFactor = 0;

    // Visuals & particles
    this.width = 24;
    this.length = 42;
    this.wheelTurnAngle = 0;
    this.skidMarks = [];
    this.particles = [];

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

    // Smooth steering wheel return
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, 14 * dt);
    this.wheelTurnAngle = this.steerAngle;

    // 2. Acceleration / Braking
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

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
      // Natural rolling resistance
      this.speed *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.speed) < 2) this.speed = 0;
    }

    // Aerodynamic drag
    this.speed -= Math.sign(this.speed) * (this.speed * this.speed) * this.drag * dt;

    // 3. Turning rate linked to speed
    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    const turnSensitivity = 2.8 * (0.35 + 0.65 * (1 - speedRatio * 0.45));
    if (Math.abs(this.speed) > 1) {
      const turnDir = this.speed >= 0 ? 1 : -1;
      this.angle += this.steerAngle * turnSensitivity * dt * turnDir;
    }

    // 4. Lateral Drift & Slip
    // Target forward velocity vector
    const targetVx = Math.cos(this.angle) * this.speed;
    const targetVy = Math.sin(this.angle) * this.speed;

    // Handbrake or sharp drift input
    let currentGrip = this.tireGrip;
    if (input.handbrake || (Math.abs(this.steerAngle) > 0.5 && this.speed > 250)) {
      currentGrip = 0.58; // break traction
    }

    // Blend current velocity with target velocity
    const gripLerp = Math.min(1, currentGrip * 9 * dt);
    this.vx += (targetVx - this.vx) * gripLerp;
    this.vy += (targetVy - this.vy) * gripLerp;

    // Calculate drift factor for audio/visual skid
    const currentHeading = Math.atan2(this.vy, this.vx);
    let slipAngle = Math.abs(this.angle - currentHeading);
    while (slipAngle > Math.PI) slipAngle -= Math.PI * 2;
    this.driftFactor = Math.min(1, (Math.abs(slipAngle) / (Math.PI * 0.45)));

    // 5. Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 6. Record Skid Marks & Emit Smoke
    if (this.driftFactor > 0.35 && Math.abs(this.speed) > 120) {
      this.addSkidMarks();
      if (Math.random() < 0.6) {
        this.emitSmoke();
      }
      if (window.soundEngine) {
        window.soundEngine.updateSkid(this.driftFactor);
      }
    } else {
      if (window.soundEngine) {
        window.soundEngine.updateSkid(0);
      }
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.8;
      p.radius += dt * 14;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Trim skid marks buffer for 60fps performance
    if (this.skidMarks.length > 300) {
      this.skidMarks.splice(0, this.skidMarks.length - 300);
    }

    // 8. Update Telemetry metrics
    this.updateTelemetry(dt);
  }

  addSkidMarks() {
    const rearOffset = -this.length * 0.38;
    const trackWidth = this.width * 0.46;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const leftX = this.x + cos * rearOffset - sin * trackWidth;
    const leftY = this.y + sin * rearOffset + cos * trackWidth;
    const rightX = this.x + cos * rearOffset + sin * trackWidth;
    const rightY = this.y + sin * rearOffset - cos * trackWidth;

    this.skidMarks.push({
      lX: leftX, lY: leftY,
      rX: rightX, rY: rightY,
      alpha: Math.min(0.65, this.driftFactor * 0.8)
    });
  }

  emitSmoke() {
    const rearOffset = -this.length * 0.4;
    const rx = this.x + Math.cos(this.angle) * rearOffset + (Math.random() - 0.5) * 12;
    const ry = this.y + Math.sin(this.angle) * rearOffset + (Math.random() - 0.5) * 12;

    this.particles.push({
      x: rx,
      y: ry,
      vx: -this.vx * 0.15 + (Math.random() - 0.5) * 30,
      vy: -this.vy * 0.15 + (Math.random() - 0.5) * 30,
      radius: 4 + Math.random() * 5,
      life: 0.8 + Math.random() * 0.4
    });
  }

  updateTelemetry(dt) {
    const kmh = Math.abs(Math.round(this.speed * 0.45));
    // Gears: 1: 0-45, 2: 45-85, 3: 85-130, 4: 130-175, 5: 175-215, 6: 215+
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

    // G-Force estimate
    const accelKmh = (this.speed - this.prevSpeed) / dt;
    this.gForce = Math.abs((accelKmh / 9.81) * 0.05) + (this.driftFactor * 1.8);
    this.prevSpeed = this.speed;

    if (window.soundEngine) {
      window.soundEngine.updateEngine(this.rpm / 13500, kmh);
    }
  }

  draw(ctx) {
    // 1. Draw Skid Marks
    if (this.skidMarks.length > 1) {
      ctx.save();
      for (let i = 1; i < this.skidMarks.length; i++) {
        const p0 = this.skidMarks[i - 1];
        const p1 = this.skidMarks[i];
        ctx.strokeStyle = `rgba(15, 20, 30, ${p1.alpha})`;
        ctx.lineWidth = 4;
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

    // 2. Draw Smoke Particles
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

    // 3. Draw Headlight Cone (Volumetric 2D Raycast)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const lightGradient = ctx.createRadialGradient(25, 0, 10, 180, 0, 190);
    lightGradient.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
    lightGradient.addColorStop(0.3, 'rgba(0, 240, 255, 0.15)');
    lightGradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.fillStyle = lightGradient;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.arc(15, 0, 210, -Math.PI * 0.22, Math.PI * 0.22);
    ctx.closePath();
    ctx.fill();

    // 4. Draw Kart Body
    // Rear Wing
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-this.length * 0.45, -this.width * 0.55, 6, this.width * 1.1);

    // Chassis (Deep Racing Cyan / Black livery)
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.roundRect(-this.length * 0.4, -this.width * 0.38, this.length * 0.8, this.width * 0.76, 5);
    ctx.fill();

    // Sidepods & Aerofoil in carbon-graphite
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-this.length * 0.25, -this.width * 0.5, this.length * 0.5, 3);
    ctx.fillRect(-this.length * 0.25, this.width * 0.5 - 3, this.length * 0.5, 3);

    // Front Wing (Nose cone)
    ctx.fillStyle = '#e10600'; // FIA red accent
    ctx.beginPath();
    ctx.moveTo(this.length * 0.35, -this.width * 0.48);
    ctx.lineTo(this.length * 0.52, 0);
    ctx.lineTo(this.length * 0.35, this.width * 0.48);
    ctx.closePath();
    ctx.fill();

    // Cockpit & Driver Helmet (Martín Berguer)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Helmet with Golden Visor
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(2, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb800'; // Visor
    ctx.fillRect(4, -3, 3, 6);

    // 4 Wheels with rotation angle on front tires
    this.drawTire(ctx, -this.length * 0.3, -this.width * 0.52, 0); // Rear Left
    this.drawTire(ctx, -this.length * 0.3, this.width * 0.52, 0);  // Rear Right
    this.drawTire(ctx, this.length * 0.28, -this.width * 0.52, this.wheelTurnAngle); // Front Left
    this.drawTire(ctx, this.length * 0.28, this.width * 0.52, this.wheelTurnAngle);  // Front Right

    ctx.restore();
  }

  drawTire(ctx, x, y, steer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(steer);
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(-5, -3, 10, 6, 2);
    ctx.fill();
    // Yellow Pirelli/Rotax sidewall line
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

window.Kart = Kart;
