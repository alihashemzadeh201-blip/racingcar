import * as THREE from 'three';
import {
  buildCurve,
  createRoadGeometry,
  createBarrierGeometry,
  createLaneMarks,
  sectionAt,
  roadFrame
} from './TrackGenerator.js';

export class TrackManager {
  constructor() {
    this.curve = null;
    this.length = 1;
    this.width = 16;
    this.group = new THREE.Group();
    this.left = [];
    this.right = [];
    this.centers = [];
    this.checkpoints = 24;
    this.reverse = false;
    this._tmp = new THREE.Vector3();
    this._tmp2 = new THREE.Vector3();
  }

  build({ reverse, assets, quality, rain = false }) {
    this.group.clear();
    this.reverse = reverse;
    this.curve = buildCurve(reverse);
    this.length = this.curve.getLength();
    const built = createRoadGeometry(this.curve, this.width, 520);
    this.left = built.left;
    this.right = built.right;
    this.centers = built.centers;
    this.segs = built.segs;

    const roadMat = new THREE.MeshStandardMaterial({
      color: rain ? 0x3a3e48 : 0x5a5e68,
      map: assets.textures.asphalt,
      roughnessMap: assets.textures.asphaltRough,
      roughness: rain ? 0.28 : 0.62,
      metalness: rain ? 0.28 : 0.08,
      envMapIntensity: rain ? 1.2 : 0.55
    });
    const road = new THREE.Mesh(built.geo, roadMat);
    road.receiveShadow = true;
    this.group.add(road);

    if (rain) {
      const puddleMat = new THREE.MeshPhysicalMaterial({
        color: 0x1a2030,
        metalness: 0.85,
        roughness: 0.08,
        transparent: true,
        opacity: 0.35,
        envMapIntensity: 2.2,
        polygonOffset: true,
        polygonOffsetFactor: -1
      });
      const puddles = new THREE.Mesh(built.geo.clone(), puddleMat);
      puddles.position.y = 0.015;
      this.group.add(puddles);
    }

    this.group.add(createLaneMarks(this.curve, this.width, 160));

    this._addStartFinish();
    this._addTunnel();
    this._addBridgeExtras();
    this._addShortcut(assets);
    return this.group;
  }

  _addStartFinish() {
    const p = this.curve.getPointAt(0);
    const t = this.curve.getTangentAt(0);
    const yaw = Math.atan2(t.x, t.z);
    const geo = new THREE.PlaneGeometry(this.width, 3.2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -yaw;
    m.position.copy(p);
    m.position.y += 0.08;
    this.group.add(m);

    const poleGeo = new THREE.BoxGeometry(0.12, 5.2, 0.12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222 });
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + 2, 0.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x3cf0ff, emissiveIntensity: 0.6 })
    );
    const pL = p.clone().add(new THREE.Vector3(t.z, 0, -t.x).multiplyScalar(this.width / 2 + 1));
    const pR = p.clone().add(new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(this.width / 2 + 1));
    const poleL = new THREE.Mesh(poleGeo, poleMat);
    const poleR = new THREE.Mesh(poleGeo, poleMat);
    poleL.position.copy(pL); poleL.position.y = 2.6;
    poleR.position.copy(pR); poleR.position.y = 2.6;
    banner.position.copy(p); banner.position.y = 5.1;
    banner.rotation.y = yaw;
    this.group.add(poleL, poleR, banner);
  }

  _addTunnel() {
    const segs = 40;
    const mat = new THREE.MeshStandardMaterial({ color: 0x12141c, roughness: 0.8, metalness: 0.2 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffe6aa, emissive: 0xffcc66, emissiveIntensity: 2 });
    for (let i = 0; i < segs; i++) {
      const u = 0.44 + (i / segs) * 0.13;
      const p = this.curve.getPointAt(u);
      const t = this.curve.getTangentAt(u);
      const yaw = Math.atan2(t.x, t.z);
      const ring = new THREE.Mesh(new THREE.BoxGeometry(this.width + 6, 0.4, 4.2), mat);
      ring.position.copy(p);
      ring.position.y += 5.4;
      ring.rotation.y = yaw;
      this.group.add(ring);
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.4, 4.2), mat);
      const wallR = wallL.clone();
      const side = new THREE.Vector3(t.z, 0, -t.x);
      wallL.position.copy(p).addScaledVector(side, this.width / 2 + 2.2);
      wallR.position.copy(p).addScaledVector(side, -(this.width / 2 + 2.2));
      wallL.position.y += 2.5;
      wallR.position.y += 2.5;
      wallL.rotation.y = yaw;
      wallR.rotation.y = yaw;
      this.group.add(wallL, wallR);
      if (i % 3 === 0) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 1.4), lightMat);
        lamp.position.copy(p);
        lamp.position.y += 5.1;
        lamp.rotation.y = yaw;
        this.group.add(lamp);
      }
    }
  }

  _addBridgeExtras() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 12; i++) {
      const u = 0.58 + (i / 12) * 0.1;
      const p = this.curve.getPointAt(u);
      const t = this.curve.getTangentAt(u);
      const side = new THREE.Vector3(t.z, 0, -t.x);
      [1, -1].forEach((s) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 12, 1.1), mat);
        pillar.position.copy(p).addScaledVector(side, s * (this.width / 2 + 3));
        pillar.position.y = p.y - 4;
        this.group.add(pillar);
      });
    }
  }

  _addShortcut() {
    // Inner cut near the hairpin
    const a = this.curve.getPointAt(0.30);
    const b = this.curve.getPointAt(0.38);
    const mid = a.clone().lerp(b, 0.5);
    const tanA = this.curve.getTangentAt(0.30);
    const inner = new THREE.Vector3(-tanA.z, 0, tanA.x).multiplyScalar(18);
    mid.add(inner);
    const pts = [a.clone(), mid, b.clone()];
    const c = new THREE.CatmullRomCurve3(pts, false);
    const built = createRoadGeometry(c, 8, 40);
    const mat = new THREE.MeshStandardMaterial({ color: 0x26282e, roughness: 0.4, metalness: 0.15 });
    const mesh = new THREE.Mesh(built.geo, mat);
    this.group.add(mesh);
    this.shortcut = { curve: c, width: 8 };
  }

  sampleT(t) {
    const u = ((t % 1) + 1) % 1;
    const f = roadFrame(this.curve, u);
    return { t: u, ...f, section: sectionAt(u) };
  }

  closest(position, hint = null) {
    let bestT = hint ?? 0;
    let bestD = Infinity;
    const wide = hint == null;
    const steps = wide ? 140 : 36;
    const window = wide ? 1 : 0.1;
    const start = wide ? 0 : hint - window / 2;
    for (let i = 0; i < steps; i++) {
      const u = ((start + (i / steps) * window) % 1 + 1) % 1;
      const p = this.curve.getPointAt(u);
      const d = p.distanceToSquared(position);
      if (d < bestD) {
        bestD = d;
        bestT = u;
      }
    }
    const span = window / steps;
    for (let i = 0; i <= 10; i++) {
      const u = (bestT - span / 2 + (i / 10) * span + 1) % 1;
      const p = this.curve.getPointAt(u);
      const d = p.distanceToSquared(position);
      if (d < bestD) {
        bestD = d;
        bestT = u;
      }
    }
    const s = this.sampleT(bestT);
    const lateral = new THREE.Vector3().subVectors(position, s.point).dot(s.binormal);
    return { ...s, lateral, dist: Math.sqrt(bestD), onRoad: Math.abs(lateral) < this.width / 2 + 1.2 };
  }

  curvatureAhead(t, look = 0.06) {
    const a = this.curve.getTangentAt(((t % 1) + 1) % 1);
    const b = this.curve.getTangentAt(((t + look) % 1 + 1) % 1);
    return 1 - Math.max(-1, Math.min(1, a.dot(b)));
  }

  spawnPose(index, total) {
    const row = Math.floor(index / 2);
    const side = index % 2 === 0 ? -1 : 1;
    const t = (1 - row * 0.012) % 1;
    const s = this.sampleT(t);
    const pos = s.point.clone().addScaledVector(s.binormal, side * 3.2);
    pos.y += 0.2;
    const yaw = Math.atan2(s.tangent.x, s.tangent.z);
    return { pos, yaw, t };
  }

  wrapProgress(prevT, nextT) {
    let d = nextT - prevT;
    if (d < -0.5) d += 1;
    if (d > 0.5) d -= 1;
    return d;
  }
}
