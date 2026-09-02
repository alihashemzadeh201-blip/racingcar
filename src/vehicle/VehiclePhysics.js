import * as THREE from 'three';
import { damp, clamp, saturate, wrapAngle } from '../utils/math.js';

export class VehiclePhysics {
  constructor(stats) {
    this.stats = { ...stats };
    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.speed = 0;
    this.velocity = new THREE.Vector3();
    this.steer = 0;
    this.steerInput = 0;
    this.throttle = 0;
    this.brake = 0;
    this.handbrake = false;
    this.nitro = false;
    this.driftFactor = 0;
    this.grounded = true;
    this.airTime = 0;
    this.rpm = 1200;
    this.gear = 1;
    this.nitroAmount = 1;
    this.surfaceGrip = 1;
    this.collisionTimer = 0;
    this.camShake = 0;
    this.driftScore = 0;
    this.driftCombo = 0;
    this.wheelSpin = 0;
    this.slide = 0;
    this.engineLoad = 0;
    this.onJump = false;
    this.resetUp = 0;
  }

  reset(pos, yaw) {
    this.position.copy(pos);
    this.yaw = yaw;
    this.pitch = 0;
    this.roll = 0;
    this.speed = 0;
    this.velocity.set(0, 0, 0);
    this.steer = 0;
    this.driftFactor = 0;
    this.grounded = true;
    this.airTime = 0;
    this.rpm = 1200;
    this.gear = 1;
    this.nitroAmount = 1;
    this.driftScore = 0;
    this.driftCombo = 0;
    this.slide = 0;
    this.camShake = 0;
  }

  applyHit(impulse, dir) {
    this.speed *= 0.55;
    this.velocity.addScaledVector(dir, impulse);
    this.camShake = Math.min(1, this.camShake + impulse * 0.15);
    this.collisionTimer = 0.25;
    this.nitroAmount = Math.max(0, this.nitroAmount - 0.05);
  }

  update(dt) {
    const s = this.stats;
    dt = clamp(dt, 0, 0.05);

    const maxSteer = THREE.MathUtils.lerp(s.steerMax, s.steerMin, saturate(Math.abs(this.speed) / s.topSpeed));
    this.steer = damp(this.steer, this.steerInput * maxSteer, 14, dt);

    let accel = 0;
    const spd01 = saturate(Math.abs(this.speed) / s.topSpeed);
    if (this.throttle > 0 && this.speed >= -2) {
      const curve = 1 - spd01 * spd01 * 0.62;
      accel += this.throttle * s.acceleration * curve;
    }
    const boosting = this.nitro && this.nitroAmount > 0.02 && this.throttle > 0.1;
    if (boosting) {
      accel += s.nitroAccel * (0.6 + 0.4 * this.nitroAmount);
      this.nitroAmount = Math.max(0, this.nitroAmount - dt * 0.32);
    } else {
      this.nitroAmount = Math.min(1, this.nitroAmount + dt * 0.045);
    }

    if (this.brake > 0 && this.speed > 0.6) {
      accel -= this.brake * s.brakeForce * (this.grounded ? 1 : 0.15);
    } else if (this.brake > 0 && this.speed <= 0.6) {
      accel -= this.brake * s.reverseAccel;
    }

    accel -= this.speed * s.drag * Math.abs(this.speed);
    accel -= Math.sign(this.speed) * s.rolling * (this.grounded ? 1 : 0.05);

    if (!this.grounded) accel *= 0.25;

    this.speed += accel * dt;
    const cap = s.topSpeed + (boosting ? 16 : 0);
    this.speed = clamp(this.speed, -s.reverseMax, cap);

    const speedAbs = Math.abs(this.speed);
    const lateralDemand = Math.abs(this.steer) * speedAbs;
    const wantDrift =
      (this.handbrake && speedAbs > 7) ||
      (lateralDemand > s.driftThreshold && speedAbs > 14 && this.throttle > 0.2);
    const targetDrift = wantDrift ? 1 : 0;
    this.driftFactor = damp(this.driftFactor, targetDrift, this.handbrake ? 10 : 3.2, dt);

    if (this.driftFactor > 0.35 && speedAbs > 10) {
      this.nitroAmount = Math.min(1, this.nitroAmount + dt * 0.12);
      this.driftCombo += dt * speedAbs * this.driftFactor * 4;
      this.driftScore += dt * speedAbs * this.driftFactor * 8;
    } else {
      this.driftCombo = damp(this.driftCombo, 0, 4, dt);
    }

    const grip = THREE.MathUtils.lerp(s.grip, s.driftGrip, this.driftFactor) * this.surfaceGrip * (this.grounded ? 1 : 0.05);
    const signed = Math.sign(this.speed || 1);
    const steerYaw = this.steer * clamp(this.speed / 10, -1.6, 1.6);
    const driftYaw = this.steer * this.driftFactor * 2.1 * signed;
    this.yaw += (steerYaw * 0.85 + driftYaw * 0.5) * dt * s.turnRate;
    this.yaw = wrapAngle(this.yaw);

    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    let vF = this.velocity.x * forward.x + this.velocity.z * forward.z;
    let vR = this.velocity.x * right.x + this.velocity.z * right.z;
    vF = damp(vF, this.speed, this.grounded ? 9 : 1.5, dt);
    const latKeep = Math.pow(1 - saturate(grip * 0.9), dt * 60);
    vR *= latKeep;
    if (this.handbrake && this.grounded) {
      vR += this.steer * speedAbs * 0.55 * dt;
      vF *= Math.pow(0.94, dt * 60);
      this.speed = vF;
    }
    this.slide = Math.abs(vR);

    if (!this.grounded) {
      this.velocity.y -= 26 * dt;
      this.airTime += dt;
      this.onJump = true;
    } else {
      this.velocity.y = 0;
      this.airTime = 0;
      this.onJump = false;
    }

    this.velocity.set(forward.x * vF + right.x * vR, this.velocity.y, forward.z * vF + right.z * vR);
    this.position.addScaledVector(this.velocity, dt);

    const pitchTarget = THREE.MathUtils.clamp(-accel * 0.0035, -0.06, 0.05);
    const rollTarget = THREE.MathUtils.clamp(-this.steer * 0.12 - vR * 0.008, -0.18, 0.18);
    this.pitch = damp(this.pitch, pitchTarget, 8, dt);
    this.roll = damp(this.roll, rollTarget, 8, dt);

    this.wheelSpin += this.speed * dt / 0.33;
    this._updateDrivetrain(dt, boosting);
    this.camShake = damp(this.camShake, 0, 6, dt);
    this.collisionTimer = Math.max(0, this.collisionTimer - dt);
    this.engineLoad = saturate(this.throttle);
  }

  _updateDrivetrain(dt, boosting) {
    const s = this.stats;
    const ratios = [0, 3.2, 2.15, 1.55, 1.18, 0.94, 0.78];
    const top = s.topSpeed;
    const abs = Math.abs(this.speed);
    let g = 1;
    const thresholds = [0, 12, 22, 34, 48, 62, 90];
    for (let i = 1; i < thresholds.length; i++) {
      if (abs > thresholds[i] * (top / 76)) g = i;
    }
    if (this.speed < -1) g = 0;
    if (g !== this.gear) this.gear = g;
    const ratio = g === 0 ? 2.8 : ratios[g];
    const targetRpm = 900 + abs * ratio * 38 + this.throttle * 400 + (boosting ? 600 : 0);
    this.rpm = damp(this.rpm, clamp(targetRpm, 800, 8800), 8, dt);
  }
}
