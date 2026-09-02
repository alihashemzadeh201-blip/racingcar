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
    this._right = new THREE.Vector3();
    this._ready = false;
  }

  setMode(mode) {
    this.mode = mode;
  }

  playIntro() {
    this._intro = 0;
  }

  playFinish() {
    this._finish = 3;
  }

  snap(vehicle) {
    this._ready = false;
    this._intro = 0;
    this._finish = 0;
    this._follow(vehicle, 1 / 60, true);
  }

  update(dt, vehicle) {
    if (this._finish > 0) {
      this._finish -= dt;
      const p = vehicle.physics;
      const a = p.yaw + this._finish * 0.35;
      this.camera.position.set(
        p.position.x + Math.sin(a) * 7,
        p.position.y + 2.0,
        p.position.z + Math.cos(a) * 7
      );
      this.camera.lookAt(p.position.x, p.position.y + 0.5, p.position.z);
      return;
    }
    this._follow(vehicle, dt, !this._ready);
    this._ready = true;
  }

  _follow(vehicle, dt, instant) {
    const p = vehicle.physics;
    const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    this._right.set(fwd.z, 0, -fwd.x);
    const speed = Math.abs(p.speed);
    const nitro = p.nitro && p.nitroAmount > 0.02 && p.throttle > 0.1;
    const targetFov = (this.mode === 'hood' ? 68 : 62) + speed * 0.06 + (nitro ? 6 : 0);
    this.fov = instant ? targetFov : damp(this.fov, targetFov, 5, dt);
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
    this._shake = Math.max(p.camShake * 0.5, nitro ? 0.08 : 0);

    let back, up, lookAhead;
    if (this.mode === 'hood') {
      back = -0.4;
      up = 1.05;
      lookAhead = 14;
    } else if (this.mode === 'bumper') {
      back = 3.2;
      up = 1.2;
      lookAhead = 12;
    } else {
      back = 5.8;
      up = 2.05;
      lookAhead = 10;
    }

    const desired = p.position.clone()
      .addScaledVector(fwd, -back)
      .add(new THREE.Vector3(0, up, 0));

    if (instant) {
      this._pos.copy(desired);
    } else {
      const follow = this.mode === 'hood' ? 22 : 18;
      this._pos.x = damp(this._pos.x, desired.x, follow, dt);
      this._pos.y = damp(this._pos.y, desired.y, 14, dt);
      this._pos.z = damp(this._pos.z, desired.z, follow, dt);
    }

    const look = p.position.clone().addScaledVector(fwd, lookAhead);
    look.y += 0.55;
    if (instant) {
      this._look.copy(look);
    } else {
      this._look.x = damp(this._look.x, look.x, 16, dt);
      this._look.y = damp(this._look.y, look.y, 16, dt);
      this._look.z = damp(this._look.z, look.z, 16, dt);
    }

    const sx = (Math.random() - 0.5) * this._shake * 0.18;
    const sy = (Math.random() - 0.5) * this._shake * 0.12;
    this.camera.position.set(this._pos.x + sx, this._pos.y + sy, this._pos.z);
    this.camera.lookAt(this._look);
  }

  menuCam(carPos, time) {
    const a = time * 0.18;
    this.camera.position.set(
      carPos.x + Math.sin(a) * 6.6,
      carPos.y + 1.7,
      carPos.z + Math.cos(a) * 6.6
    );
    this.camera.lookAt(carPos.x, carPos.y + 0.45, carPos.z);
    this.camera.fov = 42;
    this.camera.updateProjectionMatrix();
  }
}
