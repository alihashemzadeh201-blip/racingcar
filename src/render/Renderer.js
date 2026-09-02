import * as THREE from 'three';

export class Renderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setClearColor(0x05060c, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  applyQuality(preset) {
    this.renderer.setPixelRatio(preset.pixelRatio);
    this.renderer.shadowMap.enabled = preset.shadows;
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
  }

  get size() {
    return this.renderer.getSize(new THREE.Vector2());
  }
}
