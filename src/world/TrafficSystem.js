import * as THREE from 'three';
import { createCarMesh, CAR_CATALOG } from '../vehicle/CarFactory.js';
import { clamp } from '../utils/math.js';

export class TrafficSystem {
  constructor() {
    this.cars = [];
    this.group = new THREE.Group();
  }

  build(track, envMap, quality) {
    this.group.clear();
    this.cars = [];
    const n = quality.maxTraffic;
    for (let i = 0; i < n; i++) {
      const def = CAR_CATALOG[i % CAR_CATALOG.length];
      const mesh = createCarMesh(def, def.color, 'SPORT', envMap);
      mesh.scale.setScalar(0.95);
      const t = (i / n + 0.05) % 1;
      const lane = i % 2 === 0 ? 5.2 : -5.2;
      const speed = 12 + (i % 5) * 2.5;
      this.group.add(mesh);
      this.cars.push({ mesh, t, lane, speed, alive: true, hit: 0 });
    }
    return this.group;
  }

  update(dt, track, racers) {
    for (const c of this.cars) {
      if (c.hit > 0) {
        c.hit -= dt;
        continue;
      }
      c.t = (c.t + (c.speed * dt) / track.length) % 1;
      const s = track.sampleT(c.t);
      const pos = s.point.clone().addScaledVector(s.binormal, c.lane);
      pos.y += 0.2;
      const yaw = Math.atan2(s.tangent.x, s.tangent.z);
      c.mesh.position.copy(pos);
      c.mesh.rotation.set(0, yaw, 0);
      c.position = pos;
      c.yaw = yaw;

      for (const r of racers) {
        const d = r.physics.position.distanceTo(pos);
        if (d < 2.6) {
          const dir = r.physics.position.clone().sub(pos).normalize();
          r.physics.applyHit(6, dir);
          c.hit = 0.6;
          c.t = (c.t - 0.01 + 1) % 1;
        }
      }
    }
  }
}
