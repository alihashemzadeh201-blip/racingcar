import * as THREE from 'three';
import { clamp, saturate, angleDiff } from '../utils/math.js';

export class AIController {
  constructor(vehicle, track, style = {}) {
    this.vehicle = vehicle;
    this.track = track;
    this.skill = style.skill ?? 0.75;
    this.aggressiveness = style.aggressiveness ?? 0.5;
    this.lineOffset = style.lineOffset ?? 0;
    this.look = style.look ?? 0.05;
    this.nitroChance = style.nitroChance ?? 0.35;
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
      p.handbrake = false;
      p.nitro = false;
      return;
    }

    const track = this.track;
    const here = track.closest(p.position, v.raceT);
    v.raceT = here.t;

    if (Math.abs(here.lateral) > track.width * 0.42) {
      const s = track.sampleT(here.t);
      const keep = clamp(here.lateral, -2.2, 2.2);
      p.position.copy(s.point).addScaledVector(s.binormal, keep);
      p.position.y = s.point.y;
      p.yaw = Math.atan2(s.tangent.x, s.tangent.z);
      p.speed = Math.max(12, Math.abs(p.speed) * 0.6);
      p.velocity.set(Math.sin(p.yaw) * p.speed, 0, Math.cos(p.yaw) * p.speed);
      this._stuck = 0;
    }

    const look = this.look + Math.abs(p.speed) * 0.00025;
    const ahead = track.sampleT((here.t + look) % 1);
    const offset = clamp(this.lineOffset, -2.4, 2.4);
    this._target.copy(ahead.point).addScaledVector(ahead.binormal, offset);

    const to = this._target.clone().sub(p.position);
    to.y = 0;
    const desired = Math.atan2(to.x, to.z);
    let err = angleDiff(p.yaw, desired);
    err += clamp(here.lateral * 0.08, -0.5, 0.5);
    p.steerInput = clamp(err * 1.8, -1, 1);
    p.handbrake = false;
    p.nitro = false;

    const corner = saturate(track.curvatureAhead(here.t, 0.07) * 16);
    const want = THREE.MathUtils.lerp(
      p.stats.topSpeed * (0.62 + this.skill * 0.22),
      22,
      corner
    );
    if (p.speed > want + 3) {
      p.throttle = 0.2;
      p.brake = saturate((p.speed - want) / 18);
    } else {
      p.throttle = 0.55 + this.skill * 0.35;
      p.brake = 0;
    }

    if (Math.abs(p.speed) < 2) this._stuck += dt;
    else this._stuck = 0;
    if (this._stuck > 1.2) {
      const s = track.sampleT(here.t);
      p.position.copy(s.point);
      p.position.y = s.point.y;
      p.yaw = Math.atan2(s.tangent.x, s.tangent.z);
      p.speed = 14;
      p.velocity.set(Math.sin(p.yaw) * 14, 0, Math.cos(p.yaw) * 14);
      this._stuck = 0;
    }

    this._avoid(field, p);
  }

  _avoid(field, p) {
    const pos = p.position;
    for (const other of field) {
      if (other === this.vehicle) continue;
      const dx = other.physics.position.x - pos.x;
      const dz = other.physics.position.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 7 || dist < 0.001) continue;
      const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
      const ahead = dx * fwd.x + dz * fwd.z;
      if (ahead > 0.5 && ahead < 8) {
        const right = fwd.z * dx + -fwd.x * dz;
        p.steerInput = clamp(p.steerInput + (right > 0 ? -0.35 : 0.35), -1, 1);
        if (dist < 3.8) p.throttle *= 0.75;
      }
    }
  }
}
