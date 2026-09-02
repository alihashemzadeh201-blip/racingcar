import * as THREE from 'three';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.street = [];
    this.moon = null;
    this.hemi = null;
    this.flash = null;
    this.ambient = null;
  }

  build(lamps, quality) {
    this.street.forEach((l) => this.scene.remove(l));
    this.street = [];
    if (this.moon) this.scene.remove(this.moon);
    if (this.hemi) this.scene.remove(this.hemi);
    if (this.flash) this.scene.remove(this.flash);
    if (this.ambient) this.scene.remove(this.ambient);

    this.ambient = new THREE.AmbientLight(0x4a5570, 0.55);
    this.scene.add(this.ambient);

    this.hemi = new THREE.HemisphereLight(0x8aa6d6, 0x2a1828, 1.15);
    this.scene.add(this.hemi);

    this.moon = new THREE.DirectionalLight(0xd8e6ff, 1.65);
    this.moon.position.set(-80, 120, 40);
    this.moon.castShadow = quality.shadows;
    if (quality.shadows) {
      this.moon.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
      const s = 40;
      this.moon.shadow.camera.left = -s;
      this.moon.shadow.camera.right = s;
      this.moon.shadow.camera.top = s;
      this.moon.shadow.camera.bottom = -s;
      this.moon.shadow.camera.near = 10;
      this.moon.shadow.camera.far = 260;
      this.moon.shadow.bias = -0.0005;
    }
    this.scene.add(this.moon);

    this.flash = new THREE.PointLight(0x88aaff, 0, 600);
    this.flash.position.set(0, 80, 0);
    this.scene.add(this.flash);

    const n = quality.streetLights;
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight(0xffe0b0, 0, 42, 1.6);
      this.scene.add(l);
      this.street.push(l);
    }
    this._lamps = lamps;
  }

  update(playerPos, lightning = 0) {
    this.flash.intensity = lightning * 40;
    if (!this._lamps?.length) return;
    const scored = this._lamps.map((l) => ({
      l,
      d: l.position.distanceToSquared(playerPos)
    }));
    scored.sort((a, b) => a.d - b.d);
    for (let i = 0; i < this.street.length; i++) {
      const src = scored[i];
      if (!src) {
        this.street[i].intensity = 0;
        continue;
      }
      this.street[i].position.copy(src.l.position);
      this.street[i].intensity = 14;
    }
    if (this.moon.castShadow) {
      this.moon.position.set(playerPos.x - 40, playerPos.y + 80, playerPos.z + 20);
      this.moon.target.position.copy(playerPos);
      this.moon.target.updateMatrixWorld();
      this.scene.add(this.moon.target);
    }
  }
}
