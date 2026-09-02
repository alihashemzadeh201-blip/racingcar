import * as THREE from 'three';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.street = [];
    this.sun = null;
    this.hemi = null;
    this.flash = null;
    this.ambient = null;
    this.tod = 'day';
  }

  build(lamps, quality, tod = 'day', rain = false) {
    tod = tod || 'day';
    this.street.forEach((l) => this.scene.remove(l));
    this.street = [];
    if (this.sun) this.scene.remove(this.sun);
    if (this.hemi) this.scene.remove(this.hemi);
    if (this.flash) this.scene.remove(this.flash);
    if (this.ambient) this.scene.remove(this.ambient);
    this.tod = tod;
    this._lamps = lamps;

    if (tod === 'night') {
      this.ambient = new THREE.AmbientLight(0x4a5570, 0.5);
      this.hemi = new THREE.HemisphereLight(0x8aa6d6, 0x2a1828, 0.9);
      this.sun = new THREE.DirectionalLight(0xd8e6ff, 0.85);
      this.sun.position.set(-80, 120, 40);
    } else {
      const overcast = rain ? 0.7 : 1;
      this.ambient = new THREE.AmbientLight(rain ? 0x8aa0b8 : 0xfff3e0, 0.85 * overcast);
      this.hemi = new THREE.HemisphereLight(rain ? 0x9aadc2 : 0x9ec8ff, rain ? 0x6a7068 : 0xc2a078, 1.6 * overcast);
      this.sun = new THREE.DirectionalLight(rain ? 0xe8eef5 : 0xfff4d2, 2.6 * overcast);
      this.sun.position.set(60, 140, 40);
    }
    this.scene.add(this.ambient, this.hemi, this.sun);

    this.sun.castShadow = quality.shadows;
    if (quality.shadows) {
      this.sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
      const s = 50;
      this.sun.shadow.camera.left = -s;
      this.sun.shadow.camera.right = s;
      this.sun.shadow.camera.top = s;
      this.sun.shadow.camera.bottom = -s;
      this.sun.shadow.camera.near = 10;
      this.sun.shadow.camera.far = 280;
      this.sun.shadow.bias = -0.0005;
    }

    this.flash = new THREE.PointLight(0x88aaff, 0, 600);
    this.flash.position.set(0, 80, 0);
    this.scene.add(this.flash);

    if (tod === 'night') {
      const n = quality.streetLights;
      for (let i = 0; i < n; i++) {
        const l = new THREE.PointLight(0xffe0b0, 0, 42, 1.6);
        this.scene.add(l);
        this.street.push(l);
      }
    }
  }

  update(playerPos, lightning = 0) {
    this.flash.intensity = lightning * 40;
    if (this.sun?.castShadow) {
      this.sun.position.set(playerPos.x + 50, playerPos.y + 90, playerPos.z + 30);
      this.sun.target.position.copy(playerPos);
      this.sun.target.updateMatrixWorld();
      this.scene.add(this.sun.target);
    }
    if (!this.street.length || !this._lamps?.length) return;
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
      this.street[i].intensity = 12;
    }
  }
}
