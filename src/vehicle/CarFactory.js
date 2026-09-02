import * as THREE from 'three';

export const CAR_CATALOG = [
  {
    id: 'nightshade',
    name: 'NIGHTSHADE',
    class: 'GT COUPE',
    color: 0x1a1c28,
    accent: 0x3cf0ff,
    stats: { accel: 78, top: 84, handling: 80, brake: 76 },
    physics: { acceleration: 32, topSpeed: 76, reverseMax: 18, reverseAccel: 16, brakeForce: 48, drag: 0.0034, rolling: 1.6, steerMax: 0.55, steerMin: 0.18, turnRate: 2.6, grip: 0.9, driftGrip: 0.28, driftThreshold: 28, nitroAccel: 26, mass: 1380 }
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    class: 'HYPER',
    color: 0xb01030,
    accent: 0xff2d6a,
    stats: { accel: 72, top: 96, handling: 70, brake: 74 },
    physics: { acceleration: 30, topSpeed: 88, reverseMax: 16, reverseAccel: 14, brakeForce: 46, drag: 0.0028, rolling: 1.4, steerMax: 0.48, steerMin: 0.14, turnRate: 2.35, grip: 0.84, driftGrip: 0.26, driftThreshold: 32, nitroAccel: 30, mass: 1280 }
  },
  {
    id: 'sakura',
    name: 'SAKURA',
    class: 'DRIFT',
    color: 0xff6aa8,
    accent: 0xffffff,
    stats: { accel: 80, top: 74, handling: 96, brake: 82 },
    physics: { acceleration: 34, topSpeed: 70, reverseMax: 20, reverseAccel: 18, brakeForce: 52, drag: 0.0038, rolling: 1.8, steerMax: 0.68, steerMin: 0.24, turnRate: 3.15, grip: 0.78, driftGrip: 0.18, driftThreshold: 18, nitroAccel: 22, mass: 1180 }
  },
  {
    id: 'thunder',
    name: 'THUNDER',
    class: 'MUSCLE',
    color: 0xf0c030,
    accent: 0x111111,
    stats: { accel: 94, top: 80, handling: 64, brake: 70 },
    physics: { acceleration: 40, topSpeed: 74, reverseMax: 16, reverseAccel: 15, brakeForce: 44, drag: 0.0036, rolling: 2.0, steerMax: 0.5, steerMin: 0.16, turnRate: 2.2, grip: 0.82, driftGrip: 0.3, driftThreshold: 26, nitroAccel: 28, mass: 1520 }
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    class: 'PROTO',
    color: 0xdde6f0,
    accent: 0x7a5cff,
    stats: { accel: 86, top: 90, handling: 86, brake: 88 },
    physics: { acceleration: 36, topSpeed: 82, reverseMax: 18, reverseAccel: 16, brakeForce: 54, drag: 0.003, rolling: 1.5, steerMax: 0.58, steerMin: 0.2, turnRate: 2.75, grip: 0.92, driftGrip: 0.24, driftThreshold: 24, nitroAccel: 28, mass: 1220 }
  },
  {
    id: 'obsidian',
    name: 'OBSIDIAN',
    class: 'GT3',
    color: 0x0d1118,
    accent: 0xffc857,
    stats: { accel: 82, top: 88, handling: 88, brake: 90 },
    physics: { acceleration: 34, topSpeed: 80, reverseMax: 17, reverseAccel: 16, brakeForce: 56, drag: 0.0031, rolling: 1.5, steerMax: 0.56, steerMin: 0.19, turnRate: 2.7, grip: 0.94, driftGrip: 0.26, driftThreshold: 26, nitroAccel: 24, mass: 1260 }
  }
];

export const PAINTS = [
  0x1a1c28, 0xb01030, 0xff6aa8, 0xf0c030, 0xdde6f0, 0x0d1118,
  0x0a3cff, 0x1db954, 0xff5a1f, 0x3cf0ff, 0x7a5cff, 0xffffff
];

export const WHEEL_STYLES = ['SPORT', 'TEK', 'CLASSIC'];

function mat(params) {
  return new THREE.MeshPhysicalMaterial(params);
}

let SHARED_BODY_GEO = null;
function getBodyGeometry() {
  if (SHARED_BODY_GEO) return SHARED_BODY_GEO;
  const shape = new THREE.Shape();
  shape.moveTo(-2.18, 0.17);
  shape.bezierCurveTo(-2.32, 0.17, -2.36, 0.34, -2.26, 0.5);
  shape.bezierCurveTo(-2.16, 0.62, -1.72, 0.66, -1.28, 0.7);
  shape.bezierCurveTo(-1.05, 0.98, -0.55, 1.16, 0.05, 1.18);
  shape.bezierCurveTo(0.5, 1.16, 0.78, 0.98, 1.08, 0.7);
  shape.bezierCurveTo(1.5, 0.58, 1.92, 0.54, 2.2, 0.5);
  shape.bezierCurveTo(2.36, 0.46, 2.4, 0.32, 2.28, 0.2);
  shape.bezierCurveTo(2.16, 0.14, 1.55, 0.14, 1.28, 0.16);
  shape.bezierCurveTo(1.26, 0.4, 0.92, 0.42, 0.88, 0.16);
  shape.lineTo(-0.78, 0.16);
  shape.bezierCurveTo(-0.82, 0.42, -1.18, 0.42, -1.22, 0.16);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.52,
    bevelEnabled: true,
    bevelThickness: 0.24,
    bevelSize: 0.2,
    bevelSegments: 8,
    curveSegments: 24
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.76, 0, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const t = Math.max(0, Math.min(1, (y - 0.32) / 0.9));
    pos.setX(i, x * (1 - t * t * 0.48));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  SHARED_BODY_GEO = geo;
  return geo;
}

export function createCarMesh(def, paint, wheelStyle, envMap) {
  const group = new THREE.Group();
  group.name = def.id;

  const bodyMat = mat({
    color: paint ?? def.color,
    metalness: 0.86,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMap,
    envMapIntensity: 1.5,
    sheen: 0.15,
    sheenColor: new THREE.Color(def.accent)
  });
  const darkMat = mat({ color: 0x111114, metalness: 0.7, roughness: 0.38, envMap, envMapIntensity: 0.8 });
  const glassMat = mat({
    color: 0x6a8aaa,
    metalness: 0.15,
    roughness: 0.04,
    transparent: true,
    opacity: 0.42,
    envMap,
    envMapIntensity: 2.2
  });
  const chrome = mat({ color: 0xcfd8e3, metalness: 1, roughness: 0.12, envMap, envMapIntensity: 2 });
  const lightFront = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdff4ff,
    emissiveIntensity: 3.2,
    roughness: 0.2
  });
  const lightRear = new THREE.MeshStandardMaterial({
    color: 0x330000,
    emissive: 0xff1a1a,
    emissiveIntensity: 1.2,
    roughness: 0.3
  });

  const body = new THREE.Group();
  body.name = 'body';

  const shell = new THREE.Mesh(getBodyGeometry(), bodyMat);
  shell.castShadow = true;
  body.add(shell);

  const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 16), glassMat);
  cabin.scale.set(0.95, 0.48, 1.05);
  cabin.position.set(0, 0.92, -0.18);
  body.add(cabin);

  const roof = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 12), bodyMat);
  roof.scale.set(0.82, 0.22, 0.85);
  roof.position.set(0, 1.12, -0.22);
  roof.castShadow = true;
  body.add(roof);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), bodyMat);
  nose.scale.set(1.45, 0.42, 0.7);
  nose.position.set(0, 0.38, 2.05);
  body.add(nose);

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), bodyMat);
  tail.scale.set(1.5, 0.4, 0.65);
  tail.position.set(0, 0.42, -1.95);
  body.add(tail);

  const splitter = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), darkMat);
  splitter.scale.set(2.1, 0.12, 0.7);
  splitter.position.set(0, 0.18, 2.2);
  body.add(splitter);

  const mirrorGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorL.scale.set(1.6, 0.7, 0.9);
  mirrorL.position.set(0.95, 0.78, 0.42);
  body.add(mirrorL);
  const mirrorR = mirrorL.clone();
  mirrorR.position.x = -0.95;
  body.add(mirrorR);

  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), lightFront);
  hlL.scale.set(1.6, 0.7, 0.5);
  hlL.position.set(0.52, 0.46, 2.38);
  body.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = -0.52;
  body.add(hlR);

  const tlL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), lightRear);
  tlL.scale.set(1.8, 0.55, 0.4);
  tlL.position.set(0.5, 0.52, -2.22);
  body.add(tlL);
  const tlR = tlL.clone();
  tlR.position.x = -0.5;
  body.add(tlR);

  const spoiler = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), bodyMat);
  spoiler.scale.set(4.2, 0.18, 0.9);
  spoiler.position.set(0, 0.95, -2.12);
  body.add(spoiler);

  const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.16, 12), chrome);
  exhaustL.rotation.x = Math.PI / 2;
  exhaustL.position.set(0.38, 0.26, -2.28);
  body.add(exhaustL);
  const exhaustR = exhaustL.clone();
  exhaustR.position.x = -0.38;
  body.add(exhaustR);

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x66ddff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 8), flameMat);
  flameL.rotation.x = Math.PI / 2;
  flameL.position.set(0.38, 0.26, -2.52);
  body.add(flameL);
  const flameR = flameL.clone();
  flameR.position.x = -0.38;
  body.add(flameR);

  group.add(body);

  const wheels = new THREE.Group();
  wheels.name = 'wheels';
  const wheelMeshes = [];
  const positions = [
    [0.86, 0.32, 1.32],
    [-0.86, 0.32, 1.32],
    [0.86, 0.32, -1.32],
    [-0.86, 0.32, -1.32]
  ];
  positions.forEach((p) => {
    const w = makeWheel(wheelStyle, chrome, darkMat);
    w.position.set(p[0], p[1], p[2]);
    wheels.add(w);
    wheelMeshes.push(w);
  });
  group.add(wheels);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
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
    new THREE.TorusGeometry(0.3, 0.085, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.72, metalness: 0.08 })
  );
  tire.rotation.y = Math.PI / 2;
  spinner.add(tire);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.14, style === 'CLASSIC' ? 12 : 22),
    chrome
  );
  rim.rotation.z = Math.PI / 2;
  spinner.add(rim);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3, emissive: 0x331100, emissiveIntensity: 0 })
  );
  disc.rotation.z = Math.PI / 2;
  disc.name = 'disc';
  spinner.add(disc);
  pivot.add(spinner);
  pivot.userData.disc = disc;
  pivot.userData.spinner = spinner;
  return pivot;
}

export function applyPaint(mesh, color) {
  if (mesh.userData.bodyMat) mesh.userData.bodyMat.color.setHex(color);
}

export function applyWheels(mesh, style, envMap) {
  const chrome = mat({ color: 0xcfd8e3, metalness: 1, roughness: 0.12, envMap, envMapIntensity: 2 });
  const dark = mat({ color: 0x111114, metalness: 0.7, roughness: 0.4 });
  const wheels = mesh.getObjectByName('wheels');
  if (!wheels) return;
  const positions = mesh.userData.wheelMeshes.map((w) => w.position.clone());
  const signs = mesh.userData.wheelMeshes.map((w) => w.position.x);
  wheels.clear();
  mesh.userData.wheelMeshes = [];
  positions.forEach((p, i) => {
    const w = makeWheel(style, chrome, dark);
    w.position.copy(p);
    wheels.add(w);
    mesh.userData.wheelMeshes.push(w);
  });
}
