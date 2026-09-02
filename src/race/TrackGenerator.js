import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TRACKS = [
  {
    id: 'aurora',
    name: 'AURORA LOOP',
    desc: 'Downtown night circuit. Long start straight, hairpin, tunnel, bridge jump and neon district.',
    laps: 3,
    reverse: false,
    lengthKm: 2.4,
    weather: 'rain'
  },
  {
    id: 'harbor',
    name: 'HARBOR REVERSE',
    desc: 'Same streets, opposite direction. Late braking into the jump landing and a brutal hairpin exit.',
    laps: 3,
    reverse: true,
    lengthKm: 2.4,
    weather: 'rain'
  }
];

const RAW_POINTS = [
  [0, 0, 0],
  [0, 0, 140],
  [0, 0, 280],
  [6, 0, 420],
  [40, 0, 540],
  [140, 0, 620],
  [260, 0, 660],
  [380, 0, 650],
  [480, 0, 580],
  [530, 0, 480],
  [520, 0, 370],
  [450, 0, 300],
  [360, 0, 270],
  [300, 0, 200],
  [310, 0, 110],
  [280, 0, 20],
  [270, -1.2, -80],
  [265, -2.8, -180],
  [270, -3.0, -280],
  [300, -1.6, -370],
  [350, 1.5, -450],
  [400, 6.5, -530],
  [410, 8.8, -600],
  [360, 3.2, -670],
  [270, 0.4, -710],
  [160, 0, -730],
  [40, 0, -700],
  [-70, 0, -640],
  [-160, 0, -540],
  [-220, 0, -420],
  [-250, 0, -300],
  [-210, 0, -190],
  [-270, 0, -90],
  [-200, 0, 10],
  [-260, 0, 110],
  [-190, 0, 200],
  [-90, 0, 250],
  [-20, 0, 160],
  [0, 0, 60]
];

export function buildCurve(reverse = false) {
  const pts = RAW_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  if (reverse) pts.reverse();
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.25);
}

export function roadFrame(curve, u) {
  const p = curve.getPointAt(u);
  const t = curve.getTangentAt(u).normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  let side = new THREE.Vector3().crossVectors(t, worldUp);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  else side.normalize();
  const up = new THREE.Vector3().crossVectors(side, t).normalize();
  return { point: p, tangent: t, binormal: side, normal: up };
}

export function createRoadGeometry(curve, width = 16, segs = 500) {
  const half = width / 2;
  const pos = [];
  const nrm = [];
  const uv = [];
  const idx = [];
  const left = [];
  const right = [];
  const centers = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const { point: p, tangent: t, binormal: side, normal: up } = roadFrame(curve, u);
    const l = p.clone().addScaledVector(side, -half).addScaledVector(up, 0.04);
    const r = p.clone().addScaledVector(side, half).addScaledVector(up, 0.04);
    left.push(l.clone());
    right.push(r.clone());
    centers.push(p.clone());
    pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
    nrm.push(up.x, up.y, up.z, up.x, up.y, up.z);
    uv.push(0, u * 40, 1, u * 40);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    idx.push(a, b, d, a, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, left, right, centers, segs };
}

export function createBarrierGeometry(edge, height = 0.9) {
  const segs = edge.length - 1;
  const pos = [];
  const nrm = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const p = edge[i];
    const next = edge[Math.min(i + 1, segs)];
    const prev = edge[Math.max(i - 1, 0)];
    const dir = next.clone().sub(prev).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const inner = p.clone().addScaledVector(side, 0.12);
    const outer = p.clone().addScaledVector(side, -0.12);
    const innerT = inner.clone(); innerT.y += height;
    const outerT = outer.clone(); outerT.y += height;
    const base = pos.length / 3;
    pos.push(
      inner.x, inner.y, inner.z,
      outer.x, outer.y, outer.z,
      outerT.x, outerT.y, outerT.z,
      innerT.x, innerT.y, innerT.z
    );
    for (let k = 0; k < 4; k++) nrm.push(0, 1, 0);
    uv.push(0, i * 0.2, 1, i * 0.2, 1, i * 0.2, 0, i * 0.2);
    if (i < segs) {
      const b = i * 4;
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function createLaneMarks(curve, width, segs = 280) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xdde8ff, transparent: true, opacity: 0.55 });
  const dash = new THREE.BoxGeometry(0.12, 0.03, 3.2);
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.7 });
  for (let i = 0; i < segs; i++) {
    if (i % 2 === 0) continue;
    const u = i / segs;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const yaw = Math.atan2(t.x, t.z);
    const side = new THREE.Vector3(t.z, 0, -t.x).normalize();
    [-width * 0.25, width * 0.25].forEach((off) => {
      const m = new THREE.Mesh(dash, mat);
      m.position.copy(p).addScaledVector(side, off);
      m.position.y += 0.06;
      m.rotation.y = yaw;
      group.add(m);
    });
    if (i % 4 === 1) {
      const c = new THREE.Mesh(dash, centerMat);
      c.position.copy(p);
      c.position.y += 0.06;
      c.rotation.y = yaw;
      c.scale.set(1, 1, 0.6);
      group.add(c);
    }
  }
  return group;
}

export function sectionAt(t) {
  // Approximate regions along the closed loop
  if (t > 0.28 && t < 0.42) return 'hairpin';
  if (t > 0.42 && t < 0.58) return 'tunnel';
  if (t > 0.58 && t < 0.70) return 'bridge';
  if (t > 0.66 && t < 0.72) return 'jump';
  if (t > 0.72 && t < 0.86) return 'neon';
  if (t > 0.86 && t < 0.96) return 'wet';
  return 'city';
}
