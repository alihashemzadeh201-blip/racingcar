import * as THREE from 'three';
import { rand, randi, hash01 } from '../utils/math.js';

function canvasTex(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export class AssetManager {
  constructor() {
    this.textures = {};
    this.progress = 0;
    this.status = 'BOOT';
  }

  async loadAll(onProgress) {
    const steps = [
      ['ASPHALT COMPOSITE', () => this._asphalt()],
      ['WET REFLECTION MASK', () => this._puddles()],
      ['CITY FACADES', () => this._buildings()],
      ['NEON SIGNAGE', () => this._signs()],
      ['SKY ENVELOPE', () => this._sky()],
      ['PARTICLE SPRITES', () => this._particles()],
      ['LIGHT FLARES', () => this._flares()],
      ['TIRE & DECALS', () => this._decals()]
    ];
    for (let i = 0; i < steps.length; i++) {
      this.status = steps[i][0];
      this.progress = i / steps.length;
      onProgress?.(this.progress, this.status);
      await new Promise((r) => setTimeout(r, 30));
      steps[i][1]();
    }
    this.progress = 1;
    this.status = 'READY';
    onProgress?.(1, this.status);
  }

  _asphalt() {
    this.textures.asphalt = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#141518';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const n = Math.random();
        g.fillStyle = `rgba(${20 + n * 40},${20 + n * 40},${22 + n * 38},${0.15 + n * 0.35})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.25})`;
        g.lineWidth = 2 + Math.random() * 8;
        g.beginPath();
        g.moveTo(Math.random() * w, Math.random() * h);
        g.lineTo(Math.random() * w, Math.random() * h);
        g.stroke();
      }
    }, 8, 80);

    this.textures.asphaltRough = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#888';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) {
        const v = 80 + Math.random() * 120;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, 8, 80);
    this.textures.asphaltRough.colorSpace = THREE.NoColorSpace;
  }

  _puddles() {
    this.textures.puddle = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        const grd = g.createRadialGradient(
          rand(0, w), rand(0, h), 4,
          rand(0, w), rand(0, h), rand(20, 70)
        );
        grd.addColorStop(0, 'rgba(255,255,255,0.85)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, w, h);
      }
    }, 4, 20);
    this.textures.puddle.colorSpace = THREE.NoColorSpace;
  }

  _buildings() {
    this.textures.windows = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = '#07080d';
      g.fillRect(0, 0, w, h);
      const cols = 6;
      const rows = 16;
      const cw = w / cols;
      const rh = h / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const lit = Math.random() > 0.38;
          if (!lit) continue;
          const pal = [
            [255, 214, 150],
            [180, 230, 255],
            [255, 90, 160],
            [120, 255, 210],
            [255, 255, 230]
          ];
          const c = pal[(Math.random() * pal.length) | 0];
          const a = 0.45 + Math.random() * 0.55;
          g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
          const pad = 4;
          g.fillRect(x * cw + pad, y * rh + pad, cw - pad * 2, rh - pad * 2);
        }
      }
    }, 1, 1);

    this.textures.windows2 = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = '#0b0d14';
      g.fillRect(0, 0, w, h);
      for (let y = 8; y < h; y += 14) {
        for (let x = 6; x < w; x += 12) {
          if (hash01(x * 0.13 + y * 2.1) > 0.55) {
            const v = 140 + hash01(x + y) * 115;
            g.fillStyle = `rgba(${v},${v * 0.85},${60},0.8)`;
            g.fillRect(x, y, 7, 8);
          }
        }
      }
    });

    this.textures.concrete = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#1a1c24';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 800; i++) {
        const v = 20 + Math.random() * 30;
        g.fillStyle = `rgb(${v},${v},${v + 4})`;
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, 4, 4);
  }

  _signs() {
    const words = [
      ['PULSE', '#3cf0ff'],
      ['NITRO', '#ff2d6a'],
      ['24H', '#ffc857'],
      ['RADIO', '#7dffb3'],
      ['GARAGE', '#ff6b2d'],
      ['SUSHI', '#ff4d9a'],
      ['CLUB', '#c77dff'],
      ['TOKYO', '#3cf0ff'],
      ['OPEN', '#7dffb3'],
      ['BAR', '#ff2d6a'],
      ['DRIFT', '#ffc857'],
      ['HOTEL', '#a8d8ff']
    ];
    this.textures.signs = words.map(([text, color]) =>
      canvasTex(512, 128, (g, w, h) => {
        g.fillStyle = '#05060a';
        g.fillRect(0, 0, w, h);
        g.fillStyle = color;
        g.shadowColor = color;
        g.shadowBlur = 18;
        g.font = 'bold 72px Orbitron, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(text, w / 2, h / 2 + 4);
      })
    );
  }

  _sky() {
    this.textures.sky = canvasTex(1024, 512, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#050614');
      grd.addColorStop(0.45, '#0c1028');
      grd.addColorStop(0.7, '#1a1030');
      grd.addColorStop(1, '#2a1230');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff';
      for (let i = 0; i < 500; i++) {
        g.globalAlpha = Math.random() * 0.8;
        g.fillRect(Math.random() * w, Math.random() * h * 0.65, 1, 1);
      }
      g.globalAlpha = 1;
      const glow = g.createRadialGradient(w * 0.72, h * 0.28, 4, w * 0.72, h * 0.28, 90);
      glow.addColorStop(0, 'rgba(255,255,240,0.9)');
      glow.addColorStop(0.2, 'rgba(180,200,255,0.25)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, w, h);
      const city = g.createLinearGradient(0, h * 0.72, 0, h);
      city.addColorStop(0, 'rgba(255, 80, 140, 0.0)');
      city.addColorStop(1, 'rgba(255, 40, 90, 0.25)');
      g.fillStyle = city;
      g.fillRect(0, h * 0.65, w, h * 0.35);
    });
  }

  _particles() {
    this.textures.smoke = canvasTex(128, 128, (g, w, h) => {
      const grd = g.createRadialGradient(64, 64, 8, 64, 64, 60);
      grd.addColorStop(0, 'rgba(220,220,230,0.55)');
      grd.addColorStop(0.4, 'rgba(180,180,190,0.25)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    this.textures.spark = canvasTex(32, 32, (g) => {
      const grd = g.createRadialGradient(16, 16, 1, 16, 16, 14);
      grd.addColorStop(0, '#fff');
      grd.addColorStop(0.3, '#ffd27a');
      grd.addColorStop(1, 'rgba(255,80,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 32, 32);
    });
    this.textures.rain = canvasTex(8, 32, (g) => {
      g.strokeStyle = 'rgba(180,200,255,0.65)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(4, 0);
      g.lineTo(4, 32);
      g.stroke();
    });
    this.textures.droplet = canvasTex(64, 64, (g) => {
      g.fillStyle = 'rgba(180,210,255,0.18)';
      g.beginPath();
      g.ellipse(32, 28, 18, 12, 0.3, 0, Math.PI * 2);
      g.fill();
    });
  }

  _flares() {
    this.textures.flare = canvasTex(128, 128, (g) => {
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 60);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.15, 'rgba(200,230,255,0.7)');
      grd.addColorStop(0.4, 'rgba(80,160,255,0.2)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
    });
    this.textures.redflare = canvasTex(128, 128, (g) => {
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 60);
      grd.addColorStop(0, 'rgba(255,240,240,1)');
      grd.addColorStop(0.2, 'rgba(255,40,40,0.7)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
    });
  }

  _decals() {
    this.textures.skid = canvasTex(32, 128, (g, w, h) => {
      g.fillStyle = 'rgba(10,10,12,0.7)';
      g.fillRect(8, 0, 16, h);
    }, 1, 1);
    this.textures.skid.colorSpace = THREE.SRGBColorSpace;
  }

  makeEnvScene() {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0x4466aa, 0x220011, 1.2));
    const cols = [0xff2d6a, 0x3cf0ff, 0x7dffb3, 0xffc857, 0x7a5cff];
    cols.forEach((c, i) => {
      const l = new THREE.PointLight(c, 40, 80);
      const a = (i / cols.length) * Math.PI * 2;
      l.position.set(Math.cos(a) * 12, 4 + (i % 2) * 3, Math.sin(a) * 12);
      scene.add(l);
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(40, 16, 12),
      new THREE.MeshBasicMaterial({ map: this.textures.sky, side: THREE.BackSide })
    );
    scene.add(sky);
    return scene;
  }
}
