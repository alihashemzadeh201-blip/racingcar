import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070814);
    this.scene.fog = new THREE.FogExp2(0x0c1020, 0.0075);
    this.world = new THREE.Group();
    this.vehicles = new THREE.Group();
    this.fx = new THREE.Group();
    this.scene.add(this.world, this.vehicles, this.fx);
  }

  setEnv(envMap) {
    this.scene.environment = envMap;
  }

  setFog(quality) {
    const d = quality.buildingDensity > 0.9 ? 0.0068 : 0.0088;
    this.scene.fog.density = d;
  }

  clearWorld() {
    while (this.world.children.length) this.world.remove(this.world.children[0]);
    while (this.vehicles.children.length) this.vehicles.remove(this.vehicles.children[0]);
  }
}
