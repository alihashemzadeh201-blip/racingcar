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
    const spotL = new THREE.SpotLight(0xe8f4ff, 8, 48, Math.PI / 6, 0.45, 1.1);
    const spotR = new THREE.SpotLight(0xe8f4ff, 8, 48, Math.PI / 6, 0.45, 1.1);
    spotL.position.set(0.45, 0.55, 2.2);
    spotR.position.set(-0.45, 0.55, 2.2);
    const tL = new THREE.Object3D();
    const tR = new THREE.Object3D();
    tL.position.set(0.45, 0.2, 16);
    tR.position.set(-0.45, 0.2, 16);
    this.mesh.add(tL, tR, spotL, spotR);
    spotL.target = tL;
    spotR.target = tR;
    this.headlights.push(spotL, spotR);
  }

  setQuality(preset) {
    this.headlights.forEach((l) => {
      l.intensity = 8;
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
    this.mesh.rotation.set(0, p.yaw, 0);
    const ud = this.mesh.userData;
    if (ud.body) {
      ud.body.rotation.x = p.pitch;
      ud.body.rotation.z = p.roll;
    }
  }

  updateVisuals(dt) {
    const p = this.physics;
    const ud = this.mesh.userData;
    this._steerVis = damp(this._steerVis, p.steer * 0.45, 12, dt);
    ud.wheelMeshes.forEach((w, i) => {
      if (w.userData.spinner) w.userData.spinner.rotation.x += p.speed * dt / 0.34;
      if (i < 2) w.rotation.y = this._steerVis;
    });
    ud.lightRear.emissiveIntensity = p.brake > 0.15 ? 4.5 : 1.2;
    const nos = p.nitro && p.nitroAmount > 0.02 && p.throttle > 0.1;
    ud.flameMat.opacity = nos ? 0.85 : 0;
    ud.flameL.scale.z = nos ? 1 + Math.random() * 1.2 : 0.01;
    ud.flameR.scale.z = nos ? 1 + Math.random() * 1.2 : 0.01;
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
