import * as THREE from 'three';

export const CAR_CATALOG = [
  {
    id: 'nightshade',
    name: 'NIGHTSHADE',
    class: 'GT COUPE',
    color: 0x2f6dff,
    accent: 0x3cf0ff,
    stats: { accel: 78, top: 84, handling: 80, brake: 76 },
    physics: { acceleration: 32, topSpeed: 76, reverseMax: 18, reverseAccel: 16, brakeForce: 48, drag: 0.0034, rolling: 1.6, steerMax: 0.55, steerMin: 0.18, turnRate: 2.6, grip: 0.9, driftGrip: 0.28, driftThreshold: 28, nitroAccel: 26, mass: 1380 }
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    class: 'HYPER',
    color: 0xe01430,
    accent: 0xff2d6a,
    stats: { accel: 72, top: 96, handling: 70, brake: 74 },
    physics: { acceleration: 30, topSpeed: 88, reverseMax: 16, reverseAccel: 14, brakeForce: 46, drag: 0.0028, rolling: 1.4, steerMax: 0.48, steerMin: 0.14, turnRate: 2.35, grip: 0.84, driftGrip: 0.26, driftThreshold: 32, nitroAccel: 30, mass: 1280 }
  },
  {
    id: 'sakura',
    name: 'SAKURA',
    class: 'DRIFT',
    color: 0xff5aa8,
    accent: 0xffffff,
    stats: { accel: 80, top: 74, handling: 96, brake: 82 },
    physics: { acceleration: 34, topSpeed: 70, reverseMax: 20, reverseAccel: 18, brakeForce: 52, drag: 0.0038, rolling: 1.8, steerMax: 0.68, steerMin: 0.24, turnRate: 3.15, grip: 0.78, driftGrip: 0.18, driftThreshold: 18, nitroAccel: 22, mass: 1180 }
  },
  {
    id: 'thunder',
    name: 'THUNDER',
    class: 'MUSCLE',
    color: 0xffc107,
    accent: 0x111111,
    stats: { accel: 94, top: 80, handling: 64, brake: 70 },
    physics: { acceleration: 40, topSpeed: 74, reverseMax: 16, reverseAccel: 15, brakeForce: 44, drag: 0.0036, rolling: 2.0, steerMax: 0.5, steerMin: 0.16, turnRate: 2.2, grip: 0.82, driftGrip: 0.3, driftThreshold: 26, nitroAccel: 28, mass: 1520 }
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    class: 'PROTO',
    color: 0xe8eef6,
    accent: 0x7a5cff,
    stats: { accel: 86, top: 90, handling: 86, brake: 88 },
    physics: { acceleration: 36, topSpeed: 82, reverseMax: 18, reverseAccel: 16, brakeForce: 54, drag: 0.003, rolling: 1.5, steerMax: 0.58, steerMin: 0.2, turnRate: 2.75, grip: 0.92, driftGrip: 0.24, driftThreshold: 24, nitroAccel: 28, mass: 1220 }
  },
  {
    id: 'obsidian',
    name: 'OBSIDIAN',
    class: 'GT3',
    color: 0x1db954,
    accent: 0xffc857,
    stats: { accel: 82, top: 88, handling: 88, brake: 90 },
    physics: { acceleration: 34, topSpeed: 80, reverseMax: 17, reverseAccel: 16, brakeForce: 56, drag: 0.0031, rolling: 1.5, steerMax: 0.56, steerMin: 0.19, turnRate: 2.7, grip: 0.94, driftGrip: 0.26, driftThreshold: 26, nitroAccel: 24, mass: 1260 }
  }
];

export const PAINTS = [
  0x2f6dff, 0xe01430, 0xff5aa8, 0xffc107, 0xe8eef6, 0x1db954,
  0xff5a1f, 0x3cf0ff, 0x7a5cff, 0xffffff, 0x222222, 0x0a3cff
];

export const WHEEL_STYLES = ['SPORT', 'TEK', 'CLASSIC'];

function paintMat(color, envMap) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.45,
    roughness: 0.32,
    envMap: envMap || null,
    envMapIntensity: 0.9
  });
}

let SHARED_BODY_GEO = null;
function getBodyGeometry() {
  if (SHARED_BODY_GEO) return SHARED_BODY_GEO;
  const shape = new THREE.Shape();
  shape.moveTo(-2.05, 0.42);
  shape.bezierCurveTo(-2.18, 0.42, -2.22, 0.52, -2.12, 0.62);
  shape.bezierCurveTo(-1.9, 0.7, -1.35, 0.72, -1.05, 0.78);
  shape.bezierCurveTo(-0.85, 1.05, -0.35, 1.18, 0.15, 1.16);
  shape.bezierCurveTo(0.55, 1.12, 0.85, 0.92, 1.15, 0.72);
  shape.bezierCurveTo(1.55, 0.62, 1.9, 0.58, 2.08, 0.55);
  shape.bezierCurveTo(2.2, 0.52, 2.22, 0.46, 2.12, 0.42);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.22,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.12,
    bevelSegments: 6,
    curveSegments: 16
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.61, 0, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const t = Math.max(0, Math.min(1, (y - 0.5) / 0.7));
    pos.setX(i, x * (1 - t * t * 0.35));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  SHARED_BODY_GEO = geo;
  return geo;
}

export function createCarMesh(def, paint, wheelStyle, envMap) {
  const group = new THREE.Group();
  group.name = def.id;
  const color = paint ?? def.color;

  const bodyMat = paintMat(color, envMap);
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.5, roughness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x89a7c4,
    metalness: 0.2,
    roughness: 0.08,
    transparent: true,
    opacity: 0.55
  });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.85, roughness: 0.22 });
  const lightFront = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 2.2,
    roughness: 0.25
  });
  const lightRear = new THREE.MeshStandardMaterial({
    color: 0x550000,
    emissive: 0xff1a1a,
    emissiveIntensity: 1.4,
    roughness: 0.35
  });

  const body = new THREE.Group();
  body.name = 'body';

  const shell = new THREE.Mesh(getBodyGeometry(), bodyMat);
  shell.castShadow = true;
  body.add(shell);

  const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 14), glassMat);
  cabin.scale.set(0.82, 0.42, 0.95);
  cabin.position.set(0, 0.98, -0.12);
  body.add(cabin);

  const roof = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 10), bodyMat);
  roof.scale.set(0.72, 0.18, 0.78);
  roof.position.set(0, 1.16, -0.18);
  body.add(roof);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), bodyMat);
  nose.scale.set(1.15, 0.38, 0.62);
  nose.position.set(0, 0.52, 1.95);
  body.add(nose);

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), bodyMat);
  tail.scale.set(1.2, 0.36, 0.55);
  tail.position.set(0, 0.54, -1.85);
  body.add(tail);

  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), lightFront);
  hlL.scale.set(1.5, 0.7, 0.45);
  hlL.position.set(0.42, 0.52, 2.22);
  body.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = -0.42;
  body.add(hlR);

  const tlL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), lightRear);
  tlL.scale.set(1.7, 0.55, 0.4);
  tlL.position.set(0.4, 0.56, -2.08);
  body.add(tlL);
  const tlR = tlL.clone();
  tlR.position.x = -0.4;
  body.add(tlR);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.28), bodyMat);
  spoiler.position.set(0, 0.92, -2.02);
  body.add(spoiler);

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x66ddff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 8), flameMat);
  flameL.rotation.x = Math.PI / 2;
  flameL.position.set(0.32, 0.32, -2.22);
  body.add(flameL);
  const flameR = flameL.clone();
  flameR.position.x = -0.32;
  body.add(flameR);

  group.add(body);

  const wheels = new THREE.Group();
  wheels.name = 'wheels';
  const wheelMeshes = [];
  const positions = [
    [1.08, 0.34, 1.28],
    [-1.08, 0.34, 1.28],
    [1.08, 0.34, -1.28],
    [-1.08, 0.34, -1.28]
  ];
  positions.forEach((p) => {
    const w = makeWheel(wheelStyle, chrome, darkMat);
    w.position.set(p[0], p[1], p[2]);
    wheels.add(w);
    wheelMeshes.push(w);
  });
  group.add(wheels);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  group.userData = {
    body,
    bodyMat,
    lightRear,
    lightFront,
    flameL,
    flameR,
    flameMat,
    wheelMeshes,
    shadow,
    def
  };
  return group;
}

function makeWheel(style, chrome, dark) {
  const pivot = new THREE.Group();
  const spinner = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.22, 18),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.05 })
  );
  tire.rotation.z = Math.PI / 2;
  spinner.add(tire);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.16, style === 'CLASSIC' ? 10 : 18),
    chrome
  );
  rim.rotation.z = Math.PI / 2;
  spinner.add(rim);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.05, 14),
    new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.35 })
  );
  disc.rotation.z = Math.PI / 2;
  spinner.add(disc);
  pivot.add(spinner);
  pivot.userData.disc = disc;
  pivot.userData.spinner = spinner;
  return pivot;
}

export function applyPaint(mesh, color) {
  if (mesh.userData.bodyMat) {
    mesh.userData.bodyMat.color.setHex(color);
    mesh.userData.bodyMat.needsUpdate = true;
  }
}

export function applyWheels(mesh, style, envMap) {
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.85, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.5, roughness: 0.45 });
  const wheels = mesh.getObjectByName('wheels');
  if (!wheels) return;
  const positions = mesh.userData.wheelMeshes.map((w) => w.position.clone());
  wheels.clear();
  mesh.userData.wheelMeshes = [];
  positions.forEach((p) => {
    const w = makeWheel(style, chrome, dark);
    w.position.copy(p);
    wheels.add(w);
    mesh.userData.wheelMeshes.push(w);
  });
}
