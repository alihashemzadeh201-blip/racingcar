const DEFAULTS = {
  quality: 'high',
  master: 0.8,
  music: 0.6,
  sfx: 0.85,
  camera: 'chase',
  rain: false,
  tod: 'day',
  weather: 'clear'
};

export class SettingsManager {
  constructor() {
    this.data = { ...DEFAULTS };
    try {
      const raw = localStorage.getItem('pulse.settings');
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch {
      /* ignore */
    }
    this.data.tod = this.data.tod || 'day';
    this.data.weather = this.data.weather || 'clear';
    this.data.rain = this.data.weather === 'rain';
    this._autoDetect();
  }

  _autoDetect() {
    try {
      const saved = localStorage.getItem('pulse.settings');
      if (saved) return;
    } catch {
      /* ignore */
    }
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      this.data.quality = 'low';
      return;
    }
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const software = /swiftshader|llvmpipe|softpipe/i.test(renderer);
    if (software || mem <= 2) this.data.quality = 'medium';
    else this.data.quality = 'high';
  }

  save() {
    try {
      localStorage.setItem('pulse.settings', JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  get quality() {
    return this.data.quality;
  }

  get preset() {
    const q = this.data.quality;
    const table = {
      low: {
        pixelRatio: 1,
        bloom: false,
        bloomStrength: 0,
        shadows: false,
        shadowSize: 512,
        streetLights: 2,
        particles: 0.35,
        buildingDensity: 0.45,
        rain: 0.3,
        ao: false,
        envReflections: false,
        maxTraffic: 4,
        anisotropic: 1,
        trees: false
      },
      medium: {
        pixelRatio: 1,
        bloom: true,
        bloomStrength: 0.22,
        shadows: false,
        shadowSize: 1024,
        streetLights: 4,
        particles: 0.7,
        buildingDensity: 0.7,
        rain: 0.7,
        ao: false,
        envReflections: true,
        maxTraffic: 8,
        anisotropic: 4,
        trees: true
      },
      high: {
        pixelRatio: Math.min(devicePixelRatio, 1.5),
        bloom: true,
        bloomStrength: 0.72,
        shadows: true,
        shadowSize: 1024,
        streetLights: 8,
        particles: 1,
        buildingDensity: 1,
        rain: 1,
        ao: false,
        envReflections: true,
        maxTraffic: 12,
        anisotropic: 8,
        trees: true
      },
      ultra: {
        pixelRatio: Math.min(devicePixelRatio, 2),
        bloom: true,
        bloomStrength: 0.36,
        shadows: true,
        shadowSize: 2048,
        streetLights: 12,
        particles: 1.25,
        buildingDensity: 1.15,
        rain: 1.2,
        ao: true,
        envReflections: true,
        maxTraffic: 16,
        anisotropic: 16,
        trees: true
      }
    };
    return table[q] || table.high;
  }
}
