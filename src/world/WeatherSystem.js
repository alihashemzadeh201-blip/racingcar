import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.enabled = false;
    this.lightning = 0;
    this._nextBolt = 4 + Math.random() * 8;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._rain = null;
    this._drops = null;
  }

  build(quality) {
    this.group.clear();
    const count = Math.floor(1400 * quality.rain);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = Math.random() * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: this.assets.textures.rain,
      color: 0xaac4ff,
      size: 0.55,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this._rain = new THREE.Points(geo, mat);
    this.group.add(this._rain);
    this._count = count;
    this._vel = 28;
  }

  setEnabled(v) {
    this.enabled = v;
    this.group.visible = v;
  }

  update(dt, cameraPos, qualityRain) {
    this.lightning = Math.max(0, this.lightning - dt * 3);
    if (!this.enabled) return 0;
    this._nextBolt -= dt;
    if (this._nextBolt < 0) {
      this.lightning = 1;
      this._nextBolt = 6 + Math.random() * 10;
    }
    if (!this._rain) return this.lightning;
    this._rain.position.copy(cameraPos);
    const arr = this._rain.geometry.attributes.position.array;
    for (let i = 0; i < this._count; i++) {
      arr[i * 3 + 1] -= this._vel * dt;
      arr[i * 3] -= 4 * dt;
      if (arr[i * 3 + 1] < -2) {
        arr[i * 3 + 1] = 24;
        arr[i * 3] = (Math.random() - 0.5) * 70;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 70;
      }
    }
    this._rain.geometry.attributes.position.needsUpdate = true;
    return this.lightning;
  }
}
