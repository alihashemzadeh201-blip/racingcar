import * as THREE from 'three';
import { damp } from '../utils/math.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'chase';
    this.fov = 60;
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._shake = 0;
    this._intro = 0;
    this._finish = 0;
    this._tmp = new THREE.Vector3();
    this._right = new THREE.Vector3();
  }

  setMode(mode) {
    this.mode = mode;
  }

  playIntro() {
    this._intro = 3.4;
  }

  playFinish() {
    this._finish = 4;
  }

  update(dt, vehicle, inputCam) {
    const p = vehicle.physics;
    const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    this._right.set(fwd.z, 0, -fwd.x);
    const speed = Math.abs(p.speed);
    const nitro = p.nitro && p.nitroAmount > 0.02 && p.throttle > 0.1;
    const targetFov = (this.mode === 'hood' ? 68 : 58) + speed * 0.12 + (nitro ? 10 : 0) + p.driftFactor * 4;
    this.fov = damp(this.fov, targetFov, 3, dt);
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
    this._shake = Math.max(p.camShake, nitro ? 0.18 : 0, p.driftFactor * 0.06);

    if (this._intro > 0) {
      this._intro -= dt;
      const k = 1 - this._intro / 3.4;
      const orbit = p.yaw + Math.PI * 0.7 - k * 2.2;
      const r = 9 - k * 2;
      this.camera.position.set(
        p.position.x + Math.sin(orbit) * r,
        p.position.y + 2.4 + Math.sin(k * Math.PI) * 1.4,
        p.position.z + Math.cos(orbit) * r
      );
      this.camera.lookAt(p.position.x, p.position.y + 0.6, p.position.z);
      return;
    }

    if (this._finish > 0) {
      this._finish -= dt;
      const a = p.yaw + this._finish * 0.4;
      this.camera.position.set(
        p.position.x + Math.sin(a) * 8,
        p.position.y + 2.2,
        p.position.z + Math.cos(a) * 8
      );
      this.camera.lookAt(p.position.x, p.position.y + 0.5, p.position.z);
      return;
    }

    let back, up, lookAhead;
    if (this.mode === 'hood') {
      back = -0.45;
      up = 1.05;
      lookAhead = 16;
    } else if (this.mode === 'bumper') {
      back = 3.4;
      up = 1.15;
      lookAhead = 14;
    } else {
      back = 7.2 + speed * 0.018;
      up = 2.15;
      lookAhead = 12;
      back += p.driftFactor * 0.8;
    }

    const driftSlide = this._right.clone().multiplyScalar(-p.steer * p.driftFactor * 1.4);
    const desired = p.position.clone()
      .addScaledVector(fwd, -back)
      .add(new THREE.Vector3(0, up + (p.grounded ? 0 : 0.8), 0))
      .add(driftSlide);

    if (!this._pos.lengthSq()) this._pos.copy(desired);
    const follow = this.mode === 'hood' ? 16 : 6;
    this._pos.x = damp(this._pos.x, desired.x, follow, dt);
    this._pos.y = damp(this._pos.y, desired.y, 8, dt);
    this._pos.z = damp(this._pos.z, desired.z, follow, dt);

    const look = p.position.clone().addScaledVector(fwd, lookAhead);
    look.y += 0.4 - p.pitch * 2;
    look.addScaledVector(this._right, p.steer * 2.2 + p.driftFactor * p.steer * 3);
    this._look.x = damp(this._look.x, look.x, 8, dt);
    this._look.y = damp(this._look.y, look.y, 8, dt);
    this._look.z = damp(this._look.z, look.z, 8, dt);

    const sx = (Math.random() - 0.5) * this._shake * 0.28;
    const sy = (Math.random() - 0.5) * this._shake * 0.2;
    this.camera.position.set(this._pos.x + sx, this._pos.y + sy, this._pos.z);
    this.camera.lookAt(this._look);
  }

  menuCam(carPos, time) {
    const a = time * 0.18;
    this.camera.position.set(
      carPos.x + Math.sin(a) * 7.4,
      carPos.y + 1.8,
      carPos.z + Math.cos(a) * 7.4
    );
    this.camera.lookAt(carPos.x, carPos.y + 0.5, carPos.z);
    this.camera.fov = 42;
    this.camera.updateProjectionMatrix();
  }
}
