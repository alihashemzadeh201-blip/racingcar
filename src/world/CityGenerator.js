import * as THREE from 'three';
import { hash01, rand, pick } from '../utils/math.js';

export class CityGenerator {
  constructor() {
    this.group = new THREE.Group();
    this.lamps = [];
    this.neons = [];
    this.flicker = [];
  }

  build(track, assets, quality) {
    this.group.clear();
    this.lamps = [];
    this.neons = [];
    this.flicker = [];

    this._ground();
    this._buildings(track, assets, quality);
    this._streetLamps(track, assets, quality);
    this._props(track, assets);
    this._skyline(assets);
    this._construction(track);
    return this.group;
  }

  _ground() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x0b0c12, roughness: 0.95, metalness: 0.05 });
    const g = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), mat);
    g.rotation.x = -Math.PI / 2;
    g.position.y = -0.2;
    g.receiveShadow = true;
    this.group.add(g);
  }

  _occupied(track, x, z, extra = 18) {
    if (!this._occ) {
      this._occ = new Set();
      for (let i = 0; i < 420; i++) {
        const p = track.curve.getPointAt(i / 420);
        const gx = Math.round(p.x / 10);
        const gz = Math.round(p.z / 10);
        const rad = 3;
        for (let dx = -rad; dx <= rad; dx++) {
          for (let dz = -rad; dz <= rad; dz++) {
            this._occ.add(`${gx + dx},${gz + dz}`);
          }
        }
      }
    }
    return this._occ.has(`${Math.round(x / 10)},${Math.round(z / 10)}`);
  }

  _buildings(track, assets, quality) {
    const density = quality.buildingDensity;
    const winA = new THREE.MeshStandardMaterial({
      map: assets.textures.windows,
      color: 0x151824,
      roughness: 0.55,
      metalness: 0.25,
      emissive: 0xffffff,
      emissiveMap: assets.textures.windows,
      emissiveIntensity: 0.85
    });
    const winB = new THREE.MeshStandardMaterial({
      map: assets.textures.windows2,
      color: 0x12141c,
      roughness: 0.6,
      metalness: 0.2,
      emissive: 0xffffff,
      emissiveMap: assets.textures.windows2,
      emissiveIntensity: 0.7
    });
    const bodyMats = [
      new THREE.MeshStandardMaterial({ color: 0x15171f, roughness: 0.7, metalness: 0.25 }),
      new THREE.MeshStandardMaterial({ color: 0x1c1520, roughness: 0.65, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.72, metalness: 0.22 }),
      new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.6, metalness: 0.35 })
    ];

    const geos = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.BoxGeometry(1, 1, 1)
    ];

    const count = Math.floor(280 * density);
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 8) {
      attempts++;
      const x = rand(-720, 720);
      const z = rand(-820, 780);
      if (this._occupied(track, x, z, 16)) continue;
      const h = 12 + hash01(placed * 3.1) * 70 * (0.6 + density);
      const w = 10 + hash01(placed * 7.7) * 18;
      const d = 10 + hash01(placed * 9.1) * 18;
      const mesh = new THREE.Mesh(geos[0], pick(bodyMats));
      mesh.position.set(x, h / 2, z);
      mesh.scale.set(w, h, d);
      mesh.castShadow = false;
      this.group.add(mesh);

      const facade = new THREE.Mesh(geos[0], hash01(placed) > 0.5 ? winA : winB);
      facade.position.set(x, h / 2, z);
      facade.scale.set(w * 1.01, h * 0.96, d * 1.01);
      this.group.add(facade);

      if (hash01(placed * 1.7) > 0.55) {
        this._neonSign(assets, x, h, z, w, d);
      }
      if (hash01(placed * 2.2) > 0.7) {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(w * 1.05, 0.35, 0.2),
          new THREE.MeshStandardMaterial({
            color: pick([0xff2d6a, 0x3cf0ff, 0xffc857, 0x7dffb3]),
            emissive: 0xffffff,
            emissiveIntensity: 2.2
          })
        );
        strip.position.set(x, 6 + hash01(placed) * (h - 8), z + d * 0.51);
        this.group.add(strip);
        this.flicker.push(strip);
      }
      placed++;
    }
  }

  _neonSign(assets, x, h, z, w, d) {
    const tex = pick(assets.textures.signs);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.2), mat);
    const face = hash01(x * 0.1 + z) > 0.5 ? 1 : -1;
    sign.position.set(x, Math.min(h - 4, 14 + hash01(z) * 20), z + face * (d * 0.51 + 0.2));
    if (Math.abs(face) === 1) sign.rotation.y = face > 0 ? 0 : Math.PI;
    if (hash01(x) > 0.5) {
      sign.position.set(x + face * (w * 0.51 + 0.2), sign.position.y, z);
      sign.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    this.group.add(sign);
    this.neons.push(sign);
  }

  _streetLamps(track, assets, quality) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x22242c, metalness: 0.7, roughness: 0.4 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffe6c0,
      emissive: 0xffcc88,
      emissiveIntensity: 3
    });
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 7.2, 6);
    const headGeo = new THREE.BoxGeometry(0.8, 0.12, 0.3);
    const n = 90;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const s = track.sampleT(u);
      [1, -1].forEach((side, k) => {
        if ((i + k) % 2 === 1) return;
        const p = s.point.clone().addScaledVector(s.binormal, side * (track.width / 2 + 2.4));
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.copy(p);
        pole.position.y += 3.6;
        const head = new THREE.Mesh(headGeo, lampMat);
        head.position.copy(p);
        head.position.y += 7.15;
        head.position.addScaledVector(s.binormal, -side * 0.4);
        this.group.add(pole, head);
        this.lamps.push({ position: head.position.clone(), mesh: head });
      });
    }
  }

  _props(track) {
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5511, emissive: 0x331100, roughness: 0.6 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xc45, metalness: 0.4, roughness: 0.5 });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x333 });
    for (let i = 0; i < 24; i++) {
      const u = (i * 0.037 + 0.1) % 1;
      const s = track.sampleT(u);
      const side = i % 2 === 0 ? 1 : -1;
      const p = s.point.clone().addScaledVector(s.binormal, side * (track.width / 2 + 4.5));
      if (i % 3 === 0) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), coneMat);
        cone.position.copy(p); cone.position.y += 0.35;
        this.group.add(cone);
      } else if (i % 3 === 1) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10), barrelMat);
        b.position.copy(p); b.position.y += 0.45;
        this.group.add(b);
      } else {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.4), benchMat);
        bench.position.copy(p); bench.position.y += 0.25;
        this.group.add(bench);
      }
    }

    // Parking bays
    const carDummyMat = new THREE.MeshStandardMaterial({ color: 0x223, metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 8; i++) {
      const u = 0.78 + i * 0.008;
      const s = track.sampleT(u);
      const p = s.point.clone().addScaledVector(s.binormal, track.width / 2 + 8);
      const dummy = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 4.2), carDummyMat);
      dummy.position.copy(p); dummy.position.y = 0.6;
      dummy.rotation.y = Math.atan2(s.tangent.x, s.tangent.z) + Math.PI / 2;
      this.group.add(dummy);
    }
  }

  _skyline(assets) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0c0e18,
      emissive: 0x1a1030,
      emissiveIntensity: 0.4,
      roughness: 0.8
    });
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 900 + hash01(i) * 200;
      const h = 40 + hash01(i * 4) * 140;
      const m = new THREE.Mesh(new THREE.BoxGeometry(30 + hash01(i * 2) * 40, h, 30), mat);
      m.position.set(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r);
      this.group.add(m);
    }
  }

  _construction(track) {
    const u = 0.2;
    const s = track.sampleT(u);
    const p = s.point.clone().addScaledVector(s.binormal, track.width / 2 + 10);
    const crane = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.6, roughness: 0.4 });
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 40, 1.2), steel);
    mast.position.y = 20;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(28, 0.8, 0.8), steel);
    arm.position.set(8, 38, 0);
    crane.add(mast, arm);
    crane.position.copy(p);
    this.group.add(crane);
  }

  update(time) {
    for (let i = 0; i < this.flicker.length; i++) {
      const m = this.flicker[i];
      const f = 1.4 + Math.sin(time * 9 + i) * 0.4 + (hash01(Math.floor(time * 12 + i)) > 0.92 ? -1 : 0);
      if (m.material.emissiveIntensity !== undefined) m.material.emissiveIntensity = Math.max(0.2, f);
    }
  }
}
