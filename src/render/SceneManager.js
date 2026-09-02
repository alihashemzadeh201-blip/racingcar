import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87b7e8);
    this.scene.fog = null;
    this.world = new THREE.Group();
    this.vehicles = new THREE.Group();
    this.fx = new THREE.Group();
    this.scene.add(this.world, this.vehicles, this.fx);
    this._sky = null;
  }

  setEnv(envMap) {
    this.scene.environment = envMap;
    if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 1.15;
  }

  setFog() {
    this.scene.fog = null;
  }

  applyTod(tod) {
    this.scene.fog = null;
    this.scene.background.set(tod === 'night' ? 0x10182c : 0x87b7e8);
  }

  clearWorld() {
    while (this.world.children.length) this.world.remove(this.world.children[0]);
    while (this.vehicles.children.length) this.vehicles.remove(this.vehicles.children[0]);
  }
}
