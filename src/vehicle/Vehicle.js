import * as THREE from 'three';
import { VehiclePhysics } from './VehiclePhysics.js';
import { createCarMesh, applyPaint } from './CarFactory.js';
import { damp } from '../utils/math.js';

export class Vehicle {
  constructor({ def, paint, wheelStyle, envMap, isPlayer = false }) {
    this.def = def;
    this.isPlayer = isPlayer;
    this.physics = new VehiclePhysics(def.physics);
    this.mesh = createCarMesh(def, paint, wheelStyle, envMap);
    this.paint = paint ?? def.color;
    this.wheelStyle = wheelStyle ?? 'SPORT';
    this.name = def.name;
    this.finished = false;
    this.finishTime = 0;
    this.lap = 1;
    this.checkpoint = 0;
    this.raceT = 0;
    this.progress = 0;
    this.lastT = 0;
    this.place = 1;
    this._steerVis = 0;
    this.headlights = [];
    if (isPlayer) this._addHeadlights();
  }

  _addHeadlights() {
    const spotL = new THREE.SpotLight(0xe8f4ff, 8, 48, Math.PI / 7, 0.45, 1.2);
    const spotR = new THREE.SpotLight(0xe8f4ff, 8, 48, Math.PI / 7, 0.45, 1.2);
    spotL.position.set(0.55, 0.55, 2.3);
    spotR.position.set(-0.55, 0.55, 2.3);
    const tL = new THREE.Object3D();
    const tR = new THREE.Object3D();
    tL.position.set(0.55, 0.2, 18);
    tR.position.set(-0.55, 0.2, 18);
    this.mesh.add(tL, tR, spotL, spotR);
    spotL.target = tL;
    spotR.target = tR;
    this.headlights.push(spotL, spotR);
  }

  setQuality(preset) {
    this.headlights.forEach((l) => {
      l.intensity = preset.shadows ? 10 : 6;
      l.castShadow = false;
    });
  }

  spawn(pos, yaw, t = 0) {
    this.physics.reset(pos, yaw);
    this.finished = false;
    this.finishTime = 0;
    this.lap = 1;
    this.checkpoint = 0;
    this.raceT = t;
    this.progress = 0;
    this.lastT = t;
    this.syncTransform();
  }

  syncTransform() {
    const p = this.physics;
    this.mesh.position.copy(p.position);
    this.mesh.rotation.set(p.pitch, p.yaw, p.roll, 'YXZ');
  }

  updateVisuals(dt) {
    const p = this.physics;
    const ud = this.mesh.userData;
    this._steerVis = damp(this._steerVis, p.steer * 0.55, 12, dt);
    ud.wheelMeshes.forEach((w, i) => {
      const spinning = w.children[0];
      if (spinning) spinning.rotation.x += p.speed * dt / 0.33;
      if (i < 2) w.rotation.y = this._steerVis;
      if (w.userData.disc) {
        w.userData.disc.material.emissiveIntensity = p.brake > 0.4 ? 0.8 : 0;
      }
    });
    ud.lightRear.emissiveIntensity = p.brake > 0.15 ? 5.5 : p.speed < -1 ? 2 : 1.1;
    const nos = p.nitro && p.nitroAmount > 0.02 && p.throttle > 0.1;
    ud.flameMat.opacity = nos ? 0.85 : 0;
    ud.flameL.scale.z = nos ? 1 + Math.random() * 1.4 : 0.01;
    ud.flameR.scale.z = nos ? 1 + Math.random() * 1.4 : 0.01;
    ud.body.position.y = Math.sin(performance.now() * 0.02) * Math.min(0.02, Math.abs(p.speed) * 0.0004);
    this.syncTransform();
  }

  setPaint(color) {
    this.paint = color;
    applyPaint(this.mesh, color);
  }

  get worldPosition() {
    return this.physics.position;
  }
}
