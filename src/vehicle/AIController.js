import * as THREE from 'three';
import { clamp, saturate, wrapAngle, angleDiff, rand } from '../utils/math.js';

export class AIController {
  constructor(vehicle, track, style = {}) {
    this.vehicle = vehicle;
    this.track = track;
    this.skill = style.skill ?? 0.75;
    this.aggressiveness = style.aggressiveness ?? 0.5;
    this.lineOffset = style.lineOffset ?? 0;
    this.look = style.look ?? 0.06;
    this.nitroChance = style.nitroChance ?? 0.4;
    this.name = style.name ?? vehicle.name;
    this.enabled = false;
    this._stuck = 0;
    this._target = new THREE.Vector3();
  }

  update(dt, playerProgress, field) {
    const v = this.vehicle;
    const p = v.physics;
    if (!this.enabled) {
      p.throttle = 0;
      p.brake = 0;
      p.steerInput = 0;
      p.handbrake = true;
      p.nitro = false;
      return;
    }
    const t = this.track;
    const look = this.look + Math.abs(p.speed) * 0.00035;
    const sample = t.sampleT((v.raceT + look) % 1);
    const n = sample.binormal;
    const offset = this.lineOffset + Math.sin(v.raceT * 40 + this.skill * 10) * 0.6;
    this._target.copy(sample.point).addScaledVector(n, offset);

    const to = this._target.clone().sub(p.position);
    to.y = 0;
    const desired = Math.atan2(to.x, to.z);
    let err = angleDiff(p.yaw, desired);
    err = clamp(err, -1.2, 1.2);
    p.steerInput = clamp(err * (1.6 + this.skill), -1, 1);

    const ahead = t.curvatureAhead(v.raceT, 0.08);
    const corner = saturate(ahead * 18);
    const targetSpeed = THREE.MathUtils.lerp(p.stats.topSpeed * (0.72 + this.skill * 0.28), 18, corner);
    const rubber = clamp((playerProgress - v.progress) * 0.0008, -8, 12);
    const want = targetSpeed + rubber + this.aggressiveness * 4;

    if (p.speed > want + 4) {
      p.throttle = 0.15;
      p.brake = saturate((p.speed - want) / 20);
    } else {
      p.throttle = 0.7 + this.skill * 0.3;
      p.brake = 0;
    }

    p.handbrake = corner > 0.55 && p.speed > 22 && Math.abs(err) > 0.25;
    const straight = corner < 0.12 && p.speed > 30;
    p.nitro = straight && Math.random() < this.nitroChance * dt * 8 && p.nitroAmount > 0.3;

    if (Math.abs(p.speed) < 1.5) this._stuck += dt;
    else this._stuck = 0;
    if (this._stuck > 1.6) {
      p.throttle = 0;
      p.brake = 1;
      p.speed = -8;
      this._stuck = 0;
    }

    this._avoid(field, p);
  }

  _avoid(field, p) {
    const pos = p.position;
    for (const other of field) {
      if (other === this.vehicle) continue;
      const d = other.physics.position.clone().sub(pos);
      const dist = d.length();
      if (dist > 8 || dist < 0.001) continue;
      const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
      const ahead = d.dot(fwd);
      if (ahead > 0.4 && ahead < 10) {
        const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
        const side = d.dot(right);
        p.steerInput = clamp(p.steerInput + (side > 0 ? -0.45 : 0.45), -1, 1);
        if (dist < 4.2) p.throttle *= 0.7;
      }
    }
  }
}
