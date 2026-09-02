import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x141c32);
    this.scene.fog = new THREE.FogExp2(0x151c30, 0.0028);
    this.world = new THREE.Group();
    this.vehicles = new THREE.Group();
    this.fx = new THREE.Group();
    this.scene.add(this.world, this.vehicles, this.fx);
  }

  setEnv(envMap) {
    this.scene.environment = envMap;
    if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 1.1;
  }

  setFog(quality) {
    this.scene.fog.density = quality.buildingDensity > 0.9 ? 0.0024 : 0.0032;
    this.scene.fog.color.set(0x151c30);
    this.scene.background.set(0x141c32);
  }

  clearWorld() {
    while (this.world.children.length) this.world.remove(this.world.children[0]);
    while (this.vehicles.children.length) this.vehicles.remove(this.vehicles.children[0]);
  }
}
