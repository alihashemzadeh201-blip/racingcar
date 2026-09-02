import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uNitro: { value: 0 },
    uRain: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uNitro;
    uniform float uRain;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);

      float ab = uNitro * 0.0016;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ab).b;

      col *= 1.18;
      col += 0.03;

      float vig = smoothstep(1.15, 0.42, r2);
      col *= mix(1.0, vig, 0.35);

      float g = fract(sin(dot(uv * vec2(164.0, 311.0), vec2(12.9898, 78.233)) + uTime) * 43758.5453);
      col += (g - 0.5) * 0.025;

      col += uNitro * 0.05 * vec3(0.25, 0.7, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.28, 0.35, 0.85);
    this.grade = new ShaderPass(GradeShader);
    this.output = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.grade);
    this.composer.addPass(this.output);
    window.addEventListener('resize', () => this.resize());
    this.enabled = true;
  }

  applyQuality(preset) {
    this.bloom.strength = preset.bloom ? preset.bloomStrength : 0;
    this.bloom.threshold = 0.85;
    this.bloom.radius = 0.32;
    this.bloom.enabled = preset.bloom;
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pr = this.renderer.getPixelRatio();
    this.composer.setSize(w, h);
    this.composer.setPixelRatio(pr);
    this.bloom.setSize(w, h);
  }

  render(dt, speed, nitro, rain) {
    this.grade.uniforms.uTime.value += dt;
    this.grade.uniforms.uSpeed.value = speed;
    this.grade.uniforms.uNitro.value = nitro ? 1 : 0;
    this.grade.uniforms.uRain.value = rain ? 1 : 0;
    this.composer.render();
  }
}
