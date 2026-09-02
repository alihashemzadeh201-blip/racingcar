import * as THREE from 'three';

function pool(n, factory) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(factory());
  return arr;
}

export class ParticleManager {
  constructor(group, assets) {
    this.group = group;
    this.assets = assets;
    this.smoke = [];
    this.sparks = [];
    this.spray = [];
    this.marks = [];
    this._init();
  }

  _init() {
    const smokeMat = new THREE.SpriteMaterial({
      map: this.assets.textures.smoke,
      transparent: true,
      depthWrite: false,
      opacity: 0
    });
    this.smoke = pool(80, () => {
      const s = new THREE.Sprite(smokeMat.clone());
      s.visible = false;
      s.userData.life = 0;
      this.group.add(s);
      return s;
    });
    const sparkMat = new THREE.SpriteMaterial({
      map: this.assets.textures.spark,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    this.sparks = pool(60, () => {
      const s = new THREE.Sprite(sparkMat.clone());
      s.visible = false;
      s.userData.life = 0;
      s.userData.vel = new THREE.Vector3();
      this.group.add(s);
      return s;
    });
    const sprayMat = new THREE.SpriteMaterial({
      map: this.assets.textures.smoke,
      color: 0x88aacc,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.spray = pool(50, () => {
      const s = new THREE.Sprite(sprayMat.clone());
      s.visible = false;
      s.userData.life = 0;
      this.group.add(s);
      return s;
    });
    const markMat = new THREE.MeshBasicMaterial({
      map: this.assets.textures.skid,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const markGeo = new THREE.PlaneGeometry(0.35, 1.6);
    this.marks = pool(120, () => {
      const m = new THREE.Mesh(markGeo, markMat.clone());
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      m.userData.life = 0;
      this.group.add(m);
      return m;
    });
    this._si = 0;
    this._ki = 0;
    this._yi = 0;
    this._mi = 0;
  }

  emitSmoke(pos, intensity) {
    if (intensity < 0.2) return;
    const s = this.smoke[this._si++ % this.smoke.length];
    s.visible = true;
    s.position.copy(pos);
    s.position.y += 0.2;
    s.position.x += (Math.random() - 0.5) * 0.4;
    s.position.z += (Math.random() - 0.5) * 0.4;
    s.scale.setScalar(0.8 + Math.random());
    s.material.opacity = 0.35 * intensity;
    s.userData.life = 0.8;
  }

  emitSparks(pos, n = 8) {
    for (let i = 0; i < n; i++) {
      const s = this.sparks[this._ki++ % this.sparks.length];
      s.visible = true;
      s.position.copy(pos);
      s.position.y += 0.2;
      s.userData.vel.set((Math.random() - 0.5) * 8, 2 + Math.random() * 6, (Math.random() - 0.5) * 8);
      s.userData.life = 0.35 + Math.random() * 0.25;
      s.scale.setScalar(0.4);
      s.material.opacity = 1;
    }
  }

  emitSpray(pos, intensity) {
    if (intensity < 0.15) return;
    const s = this.spray[this._yi++ % this.spray.length];
    s.visible = true;
    s.position.copy(pos);
    s.position.y += 0.15;
    s.scale.setScalar(0.7);
    s.material.opacity = 0.25 * intensity;
    s.userData.life = 0.4;
  }

  emitMark(pos, yaw) {
    const m = this.marks[this._mi++ % this.marks.length];
    m.visible = true;
    m.position.copy(pos);
    m.position.y = pos.y + 0.05;
    m.rotation.z = -yaw;
    m.userData.life = 3.5;
    m.material.opacity = 0.5;
  }

  update(dt, vehicles, rain) {
    for (const v of vehicles) {
      const p = v.physics;
      const rear = p.position.clone();
      rear.x -= Math.sin(p.yaw) * 1.4;
      rear.z -= Math.cos(p.yaw) * 1.4;
      if (p.driftFactor > 0.35 && p.grounded) {
        this.emitSmoke(rear, p.driftFactor);
        if (Math.random() < dt * 18) this.emitMark(rear, p.yaw);
        if (p.driftFactor > 0.75 && Math.random() < dt * 10) this.emitSparks(rear, 3);
      }
      if (rain && Math.abs(p.speed) > 12 && p.grounded) this.emitSpray(rear, Math.min(1, Math.abs(p.speed) / 50));
      if (p.collisionTimer > 0 && Math.random() < 0.6) this.emitSparks(p.position, 6);
    }

    const step = (arr, grow, rise) => {
      for (const s of arr) {
        if (!s.visible) continue;
        s.userData.life -= dt;
        if (s.userData.life <= 0) {
          s.visible = false;
          continue;
        }
        if (s.scale) s.scale.multiplyScalar(1 + grow * dt);
        s.position.y += rise * dt;
        if (s.material.opacity > 0) s.material.opacity *= 1 - dt * 1.8;
      }
    };
    step(this.smoke, 1.6, 0.6);
    step(this.spray, 1.2, 0.4);
    for (const s of this.sparks) {
      if (!s.visible) continue;
      s.userData.life -= dt;
      if (s.userData.life <= 0) {
        s.visible = false;
        continue;
      }
      s.position.addScaledVector(s.userData.vel, dt);
      s.userData.vel.y -= 18 * dt;
      s.material.opacity = Math.max(0, s.userData.life * 3);
    }
    for (const m of this.marks) {
      if (!m.visible) continue;
      m.userData.life -= dt;
      if (m.userData.life <= 0) m.visible = false;
      else m.material.opacity = Math.min(0.5, m.userData.life * 0.15);
    }
  }
}
