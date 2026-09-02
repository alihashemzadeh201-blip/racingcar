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
    uVignette: { value: 0.55 },
    uGrain: { value: 0.08 },
    uAberration: { value: 0.0018 },
    uRain: { value: 1 }
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
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    uniform float uRain;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      float ab = uAberration + uSpeed * 0.0008 + uNitro * 0.004;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ab).b;

      float vig = smoothstep(0.9, 0.2, r2 * (0.7 + uVignette));
      col *= vig;

      // cinematic grade
      col.r = pow(col.r, 0.96) * 1.04;
      col.b = pow(col.b, 0.92) * 1.08;
      col.g *= 0.98;
      col = mix(col, col * vec3(0.75, 0.9, 1.15), 0.12);
      col = mix(col, vec3(dot(col, vec3(0.3,0.5,0.2))), -0.08);

      float g = hash(uv * vec2(1920.0, 1080.0) + uTime * 60.0);
      col += (g - 0.5) * uGrain;

      // speed lines
      float ang = atan(c.y, c.x);
      float sl = smoothstep(0.18, 0.7, r2) * uSpeed * 0.012;
      float lines = smoothstep(0.6, 1.0, fract(ang * 18.0 + uTime * 9.0));
      col += lines * sl * vec3(0.7, 0.85, 1.0);

      // nitro wash
      col += uNitro * 0.08 * vec3(0.3, 0.8, 1.0);
      col *= 1.0 + uNitro * 0.08;

      // rain droplets (screen)
      if (uRain > 0.01) {
        vec2 ruv = uv * vec2(6.0, 4.0);
        ruv.y += uTime * 0.15;
        float drops = smoothstep(0.92, 1.0, hash(floor(ruv * 20.0)));
        col += drops * 0.08 * uRain * vec3(0.7, 0.8, 1.0);
      }

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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.55, 0.22);
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
