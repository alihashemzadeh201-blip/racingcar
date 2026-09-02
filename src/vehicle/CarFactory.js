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
  const profile = new THREE.Shape();
  profile.moveTo(-2.22, 0.16);
  profile.bezierCurveTo(-2.28, 0.16, -2.32, 0.28, -2.26, 0.48);
  profile.lineTo(-2.12, 0.62);
  profile.lineTo(-1.55, 0.7);
  profile.lineTo(-1.05, 1.08);
  profile.bezierCurveTo(-0.7, 1.2, 0.05, 1.22, 0.45, 1.12);
  profile.lineTo(1.12, 0.74);
  profile.lineTo(1.85, 0.58);
  profile.bezierCurveTo(2.15, 0.52, 2.32, 0.42, 2.3, 0.28);
  profile.lineTo(2.22, 0.16);
  profile.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(profile, {
    depth: 1.72,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.08,
    bevelSegments: 2,
    steps: 1
  });
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.translate(0.86, 0, 0);
  bodyGeo.computeVertexNormals();
  SHARED_BODY_GEO = bodyGeo;
  return bodyGeo;
}

export function createCarMesh(def, paint, wheelStyle, envMap) {
  const group = new THREE.Group();
  group.name = def.id;

  const bodyMat = mat({
    color: paint ?? def.color,
    metalness: 0.92,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMap,
    envMapIntensity: 1.6,
    sheen: 0.2,
    sheenColor: new THREE.Color(def.accent)
  });
  const darkMat = mat({ color: 0x111114, metalness: 0.7, roughness: 0.4, envMap, envMapIntensity: 0.8 });
  const glassMat = mat({
    color: 0x071018,
    metalness: 0.35,
    roughness: 0.04,
    transparent: true,
    opacity: 0.48,
    envMap,
    envMapIntensity: 2.4
  });
  const chrome = mat({ color: 0xcfd8e3, metalness: 1, roughness: 0.12, envMap, envMapIntensity: 2 });
  const interior = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.8, metalness: 0.1 });
  const lightFront = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdff4ff,
    emissiveIntensity: 4,
    roughness: 0.2
  });
  const lightRear = new THREE.MeshStandardMaterial({
    color: 0x330000,
    emissive: 0xff1a1a,
    emissiveIntensity: 1.2,
    roughness: 0.3
  });
  const accentMat = mat({
    color: def.accent,
    metalness: 0.6,
    roughness: 0.3,
    emissive: def.accent,
    emissiveIntensity: 0.35,
    envMap
  });

  const body = new THREE.Group();
  body.name = 'body';

  const shell = new THREE.Mesh(getBodyGeometry(), bodyMat);
  shell.castShadow = true;
  body.add(shell);

  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.28, 4.2), bodyMat);
  lower.position.y = 0.34;
  lower.castShadow = true;
  body.add(lower);

  const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 2.2), darkMat);
  cabinFloor.position.set(0, 0.62, -0.15);
  body.add(cabinFloor);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.06, 1.28), bodyMat);
  hood.position.set(0, 0.7, 1.28);
  hood.rotation.x = 0.05;
  hood.castShadow = true;
  body.add(hood);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.22, 0.5), bodyMat);
  nose.position.set(0, 0.38, 2.2);
  body.add(nose);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.38), darkMat);
  splitter.position.set(0, 0.22, 2.32);
  body.add(splitter);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.55), bodyMat);
  cabin.position.set(0, 0.92, -0.15);
  cabin.castShadow = true;
  body.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.2), bodyMat);
  roof.position.set(0, 1.16, -0.22);
  body.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.02, 0.9), glassMat);
  windshield.position.set(0, 0.98, 0.62);
  windshield.rotation.x = -0.55;
  body.add(windshield);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.02, 0.7), glassMat);
  rearGlass.position.set(0, 0.98, -0.95);
  rearGlass.rotation.x = 0.5;
  body.add(rearGlass);

  const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 1.2), glassMat);
  sideGlassL.position.set(0.78, 0.92, -0.15);
  body.add(sideGlassL);
  const sideGlassR = sideGlassL.clone();
  sideGlassR.position.x = -0.78;
  body.add(sideGlassR);

  const seats = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.7), interior);
  seats.position.set(0, 0.72, -0.2);
  body.add(seats);
  const wheelCol = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 12), darkMat);
  wheelCol.position.set(0.32, 0.78, 0.25);
  body.add(wheelCol);

  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.18, 0.9), bodyMat);
  trunk.position.set(0, 0.7, -1.55);
  body.add(trunk);

  const spoilerArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.06), darkMat);
  spoilerArm.position.set(0, 0.92, -2.05);
  body.add(spoilerArm);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.32), bodyMat);
  spoiler.position.set(0, 1.04, -2.08);
  body.add(spoiler);

  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 2.2), darkMat);
  skirtL.position.set(0.96, 0.28, 0);
  body.add(skirtL);
  const skirtR = skirtL.clone();
  skirtR.position.x = -0.96;
  body.add(skirtR);

  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.12), bodyMat);
  mirrorL.position.set(1.02, 0.82, 0.45);
  body.add(mirrorL);
  const mirrorR = mirrorL.clone();
  mirrorR.position.x = -1.02;
  body.add(mirrorR);

  const hlGeo = new THREE.BoxGeometry(0.42, 0.12, 0.08);
  const hlL = new THREE.Mesh(hlGeo, lightFront);
  hlL.position.set(0.58, 0.48, 2.42);
  body.add(hlL);
  const hlR = new THREE.Mesh(hlGeo, lightFront);
  hlR.position.set(-0.58, 0.48, 2.42);
  body.add(hlR);

  const tlGeo = new THREE.BoxGeometry(0.5, 0.12, 0.06);
  const tlL = new THREE.Mesh(tlGeo, lightRear);
  tlL.position.set(0.55, 0.58, -2.2);
  body.add(tlL);
  const tlR = new THREE.Mesh(tlGeo, lightRear);
  tlR.position.set(-0.55, 0.58, -2.2);
  body.add(tlR);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 3.6), accentMat);
  stripe.position.set(0, 0.72, 0.1);
  body.add(stripe);

  const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10), chrome);
  exhaustL.rotation.x = Math.PI / 2;
  exhaustL.position.set(0.42, 0.28, -2.22);
  body.add(exhaustL);
  const exhaustR = exhaustL.clone();
  exhaustR.position.x = -0.42;
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
  flameL.position.set(0.42, 0.28, -2.48);
  body.add(flameL);
  const flameR = flameL.clone();
  flameR.position.x = -0.42;
  body.add(flameR);

  group.add(body);

  const wheels = new THREE.Group();
  wheels.name = 'wheels';
  const wheelMeshes = [];
  const positions = [
    [0.82, 0.32, 1.38],
    [-0.82, 0.32, 1.38],
    [0.82, 0.32, -1.38],
    [-0.82, 0.32, -1.38]
  ];
  positions.forEach((p, i) => {
    const w = makeWheel(wheelStyle, chrome, darkMat);
    w.position.set(p[0], p[1], p[2]);
    if (p[0] < 0) w.rotation.z = Math.PI;
    wheels.add(w);
    wheelMeshes.push(w);
  });
  group.add(wheels);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.3, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false })
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
  const g = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 0.22, 18),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.1 })
  );
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, style === 'CLASSIC' ? 12 : 18), chrome);
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3, emissive: 0x331100, emissiveIntensity: 0 })
  );
  disc.rotation.z = Math.PI / 2;
  disc.name = 'disc';
  g.add(disc);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), dark);
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  if (style === 'TEK') {
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.03), chrome);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.x = (i / 5) * Math.PI * 2;
      spoke.position.y = 0;
      g.add(spoke);
    }
  }
  g.userData.disc = disc;
  return g;
}

export function applyPaint(mesh, color) {
  if (mesh.userData.bodyMat) {
    mesh.userData.bodyMat.color.setHex(color);
  }
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
    if (signs[i] < 0) w.rotation.z = Math.PI;
    wheels.add(w);
    mesh.userData.wheelMeshes.push(w);
  });
}
