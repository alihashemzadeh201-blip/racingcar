import * as THREE from 'three';
import { AssetManager } from './core/AssetManager.js';
import { InputManager } from './core/InputManager.js';
import { SettingsManager } from './core/SettingsManager.js';
import { Renderer } from './render/Renderer.js';
import { SceneManager } from './render/SceneManager.js';
import { PostProcessing } from './render/PostProcessing.js';
import { CameraController } from './camera/CameraController.js';
import { TrackManager } from './race/TrackManager.js';
import { RaceManager } from './race/RaceManager.js';
import { TRACKS } from './race/TrackGenerator.js';
import { CAR_CATALOG, applyWheels } from './vehicle/CarFactory.js';
import { Vehicle } from './vehicle/Vehicle.js';
import { PlayerController } from './vehicle/PlayerController.js';
import { AIController } from './vehicle/AIController.js';
import { CityGenerator } from './world/CityGenerator.js';
import { LightingSystem } from './world/LightingSystem.js';
import { WeatherSystem } from './world/WeatherSystem.js';
import { TrafficSystem } from './world/TrafficSystem.js';
import { ParticleManager } from './fx/ParticleManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';

const TIPS = [
  'Hold SPACE and steer to initiate a drift. Nitro recharges while you slide.',
  'SHIFT dumps NOS. Save it for the tunnel exit and the front straight.',
  'Brake before the hairpin — late apex, then fire nitro on exit.',
  'The inner alley at the hairpin is a shortcut. Tight, but faster if you nail it.',
  'C cycles cameras. Hood cam is the purest way to feel 280 clicks at night.'
];

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.settings = new SettingsManager();
    this.input = new InputManager();
    this.assets = new AssetManager();
    this.rendererSys = new Renderer(this.canvas);
    this.renderer = this.rendererSys.renderer;
    this.scenes = new SceneManager();
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1800);
    this.cam = new CameraController(this.camera);
    this.post = new PostProcessing(this.renderer, this.scenes.scene, this.camera);
    this.audio = new AudioManager(this.settings);
    this.track = new TrackManager();
    this.race = new RaceManager();
    this.city = new CityGenerator();
    this.lights = new LightingSystem(this.scenes.scene);
    this.weather = new WeatherSystem(this.scenes.scene, this.assets);
    this.traffic = new TrafficSystem();
    this.particles = null;
    this.ui = new UIManager(this);
    this.state = 'loading';
    this.selectedCarId = CAR_CATALOG[0].id;
    this.selectedPaint = CAR_CATALOG[0].color;
    this.selectedWheels = 'SPORT';
    this.selectedTrackId = TRACKS[0].id;
    this.player = null;
    this.opponents = [];
    this.controllers = [];
    this.envMap = null;
    this.clock = new THREE.Clock();
    this._menuCar = null;
    this._fps = 60;
    this._adaptT = 0;
    this._camLatch = false;
    this._escLatch = false;
    document.getElementById('load-tip').textContent = TIPS[(Math.random() * TIPS.length) | 0];
    window.addEventListener('resize', () => this._resize());
  }

  async start() {
    this.ui.show('loading');
    try {
    await this.assets.loadAll((p, s) => this.ui.setLoading(p, s));
    this.ui.setLoading(0.92, 'COMPOSITING WORLD');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this._pmrem = pmrem;
    this.envDay = pmrem.fromScene(this.assets.makeEnvScene('day'), 0.04).texture;
    this.envNight = pmrem.fromScene(this.assets.makeEnvScene('night'), 0.04).texture;
    this.envMap = this.settings.data.tod === 'night' ? this.envNight : this.envDay;
    this.scenes.setEnv(this.envMap);
    this.particles = new ParticleManager(this.scenes.fx, this.assets);
    this.applyQuality(this.settings.quality);
    this._buildMenuWorld();
    this.ui.setLoading(1, 'READY');
    await new Promise((r) => setTimeout(r, 250));
    this.show('menu');
    this.clock.start();
    this.renderer.setAnimationLoop(() => this._frame());
    const unlock = () => {
      this.audio.resume();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    } catch (err) {
      console.error(err);
      this.ui.setLoading(1, `ERROR  ${err.message || err}`);
    }
  }

  applyQuality(q) {
    this.settings.set('quality', q);
    const preset = this.settings.preset;
    this.rendererSys.applyQuality(preset);
    this.post.applyQuality(preset);
    this.scenes.setFog(preset);
    if (this.player) this.player.setQuality(preset);
  }

  setQuality(q) {
    this.applyQuality(q);
  }

  setCameraMode(m) {
    this.settings.set('camera', m);
    this.cam.setMode(m);
  }

  setRain(on) {
    this.setWeather(on ? 'rain' : 'clear');
  }

  setWeather(w) {
    this.settings.set('weather', w);
    this.settings.set('rain', w === 'rain');
    this.weather.setEnabled(w === 'rain');
    this._applyAtmosphere();
  }

  setTod(tod) {
    this.settings.set('tod', tod);
    this.envMap = tod === 'night' ? this.envNight : this.envDay;
    this.scenes.setEnv(this.envMap);
    this._applyAtmosphere();
    if (this.state === 'menu' || this.state === 'garage') this._buildMenuWorld();
  }

  _applyAtmosphere() {
    const tod = this.settings.data.tod || 'day';
    const rain = this.settings.data.weather === 'rain';
    this.scenes.applyTod(tod);
    this.scenes.setFog();
    this.weather.setEnabled(rain);
    if (this.player) this.lights.build(this.city.lamps || [], this.settings.preset, tod, rain);
  }

  selectCar(id) {
    this.selectedCarId = id;
    const def = CAR_CATALOG.find((c) => c.id === id);
    this.selectedPaint = def.color;
    this._refreshMenuCar();
  }

  selectPaint(hex) {
    this.selectedPaint = hex;
    if (this._menuCar) this._menuCar.setPaint(hex);
  }

  selectWheels(style) {
    this.selectedWheels = style;
    if (this._menuCar) applyWheels(this._menuCar.mesh, style, this.envMap);
  }

  selectTrack(id) {
    this.selectedTrackId = id;
  }

  show(name) {
    if (name === 'menu') {
      this.state = 'menu';
      this.ui.show('menu');
      this.ui.setHudVisible(false);
      this._ensureMenuWorld();
    } else if (name === 'garage') {
      this.state = 'garage';
      this.ui.show('garage');
    } else if (name === 'track') {
      this.state = 'track';
      this.ui.show('track');
    } else if (name === 'settings') {
      this.state = 'settings';
      this.ui.show('settings');
    } else if (name === 'controls') {
      this.state = 'controls';
      this.ui.show('controls');
    }
  }

  onMenu(action) {
    if (action === 'play') this.show('garage');
    if (action === 'garage') this.show('garage');
    if (action === 'settings') this.show('settings');
    if (action === 'controls') this.show('controls');
  }

  onPause(action) {
    this.audio.ui();
    if (action === 'resume') this._resume();
    if (action === 'restart') this.startRace();
    if (action === 'quit') {
      this._buildMenuWorld();
      this.state = 'menu';
      this.ui.setHudVisible(false);
      this.show('menu');
    }
    if (action === 'pause-settings') this.show('settings');
  }

  _resume() {
    this.state = 'racing';
    this.ui.show('none');
    this.ui.setHudVisible(true);
  }

  startRace() {
    this.ui.resetCountdown();
    this.ui.setHudVisible(false);
    this.ui.show('loading');
    this.ui.setLoading(0.12, 'BUILDING CIRCUIT');
    this.state = 'loading';
    const run = () => {
      try {
        this.ui.setLoading(0.45, 'LAYING ASPHALT');
        this._rebuildWorld(true);
        this.ui.setLoading(1, 'GRID READY');
        this.state = 'countdown';
        this.ui.show('none');
        this.ui.setHudVisible(true);
        this.cam.snap(this.player);
        this.playerCtrl.enabled = false;
        this.controllers.forEach((c) => (c.enabled = false));
      } catch (err) {
        console.error('startRace failed', err);
        this.ui.setLoading(1, `ERROR  ${err.message || err}`);
        this.state = 'track';
        setTimeout(() => this.show('track'), 1600);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }

  _def() {
    return CAR_CATALOG.find((c) => c.id === this.selectedCarId) || CAR_CATALOG[0];
  }

  _trackDef() {
    return TRACKS.find((t) => t.id === this.selectedTrackId) || TRACKS[0];
  }

  _buildMenuWorld() {
    const tod = this.settings.data.tod || 'day';
    const rain = this.settings.data.weather === 'rain';
    this.scenes.clearWorld();
    this.scenes.applyTod(tod);
    this.weather.build(this.settings.preset);
    this.weather.setEnabled(rain);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 48),
      new THREE.MeshStandardMaterial({
        color: tod === 'night' ? 0x0a0c14 : 0xd8dde6,
        metalness: 0.55,
        roughness: 0.28,
        envMapIntensity: 1.2
      })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scenes.world.add(floor);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(7.2, 0.06, 8, 64),
      new THREE.MeshStandardMaterial({
        color: tod === 'night' ? 0x3cf0ff : 0x1a6dff,
        emissive: tod === 'night' ? 0x3cf0ff : 0x1a6dff,
        emissiveIntensity: tod === 'night' ? 2 : 0.35
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    this.scenes.world.add(ring);
    this._refreshMenuCar();
    this.lights.build([], this.settings.preset, tod, rain);
  }

  _refreshMenuCar() {
    if (this._menuCar) this.scenes.vehicles.remove(this._menuCar.mesh);
    this._menuCar = new Vehicle({
      def: this._def(),
      paint: this.selectedPaint,
      wheelStyle: this.selectedWheels,
      envMap: this.envMap,
      isPlayer: false
    });
    this._menuCar.mesh.position.set(0, 0, 0);
    this.scenes.vehicles.add(this._menuCar.mesh);
  }

  _ensureMenuWorld() {
    if (!this._menuCar) this._buildMenuWorld();
  }

  _rebuildWorld(resetVehicles) {
    const preset = this.settings.preset;
    const tdef = this._trackDef();
    const tod = this.settings.data.tod || 'day';
    const rain = this.settings.data.weather === 'rain';
    this.scenes.clearWorld();
    this.scenes.applyTod(tod);
    this.track.build({ reverse: tdef.reverse, assets: this.assets, quality: preset, rain });
    this.scenes.world.add(this.track.group);
    const skyMap = tod === 'night' ? this.assets.textures.skyNight : this.assets.textures.skyDay;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, fog: false })
    );
    this.scenes.world.add(sky);
    this.city.build(this.track, this.assets, preset);
    this.scenes.world.add(this.city.group);
    this.scenes.world.add(this.traffic.build(this.track, this.envMap, preset));
    this.weather.build(preset);
    this.weather.setEnabled(rain);
    this.lights.build(this.city.lamps, preset, tod, rain);

    const field = [];
    this.player = new Vehicle({
      def: this._def(),
      paint: this.selectedPaint,
      wheelStyle: this.selectedWheels,
      envMap: this.envMap,
      isPlayer: true
    });
    this.player.setQuality(preset);
    const spawn0 = this.track.spawnPose(0, 6);
    this.player.spawn(spawn0.pos, spawn0.yaw, spawn0.t);
    this.scenes.vehicles.add(this.player.mesh);
    field.push(this.player);
    this.playerCtrl = new PlayerController(this.player, this.input);

    this.opponents = [];
    this.controllers = [];
    const aiDefs = CAR_CATALOG.filter((c) => c.id !== this.selectedCarId);
    const styles = [
      { skill: 0.82, aggressiveness: 0.7, lineOffset: -1.4, look: 0.07, nitroChance: 0.5, name: 'KIRA' },
      { skill: 0.7, aggressiveness: 0.4, lineOffset: 1.8, look: 0.08, nitroChance: 0.3, name: 'NOVA' },
      { skill: 0.88, aggressiveness: 0.85, lineOffset: 0.4, look: 0.055, nitroChance: 0.6, name: 'REX' },
      { skill: 0.64, aggressiveness: 0.55, lineOffset: -2.2, look: 0.09, nitroChance: 0.25, name: 'MIRA' },
      { skill: 0.76, aggressiveness: 0.5, lineOffset: 2.4, look: 0.065, nitroChance: 0.4, name: 'JAX' }
    ];
    for (let i = 0; i < 5; i++) {
      const def = aiDefs[i % aiDefs.length];
      const v = new Vehicle({ def, paint: def.color, wheelStyle: 'SPORT', envMap: this.envMap });
      const sp = this.track.spawnPose(i + 1, 6);
      v.spawn(sp.pos, sp.yaw, sp.t);
      v.name = styles[i].name;
      this.scenes.vehicles.add(v.mesh);
      this.opponents.push(v);
      field.push(v);
      const ai = new AIController(v, this.track, styles[i]);
      this.controllers.push(ai);
    }
    this.race.setup(this.player, field, tdef.laps);
    this.cam.setMode(this.settings.data.camera);
    this.cam.snap(this.player);
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.input.update();
    this._handleGlobalInput();

    if (this.state === 'loading') {
      this.post.render(dt, 0, false, false);
      return;
    }
    if (this.state === 'menu' || this.state === 'garage' || this.state === 'track' || this.state === 'settings' || this.state === 'controls') {
      this._updateMenu(dt);
    } else if (this.state === 'countdown' || this.state === 'racing') {
      this._updateRace(dt);
    } else if (this.state === 'paused') {
      this._renderPaused();
      return;
    } else if (this.state === 'results') {
      this._updateResults(dt);
    }

    this._adapt(dt);
  }

  _handleGlobalInput() {
    if (this.input.consumeKey('Escape')) {
      if (this.state === 'racing' || this.state === 'countdown') {
        this.state = 'paused';
        this.ui.show('pause');
      } else if (this.state === 'paused') {
        this._resume();
      } else if (this.state !== 'menu' && this.state !== 'loading') {
        this.show('menu');
      }
    }
    if (this.input.consumeKey('KeyR') && (this.state === 'racing' || this.state === 'paused' || this.state === 'results')) {
      this.startRace();
    }
    if (this.input.consumeKey('KeyC') && (this.state === 'racing' || this.state === 'countdown')) {
      const order = ['chase', 'bumper', 'hood'];
      const i = order.indexOf(this.cam.mode);
      this.setCameraMode(order[(i + 1) % order.length]);
    }
  }

  _updateMenu(dt) {
    if (this._menuCar) {
      this._menuCar.mesh.rotation.y += dt * (this.state === 'garage' ? 0.45 : 0.28);
      this._menuCar.updateVisuals(dt);
      if (this.state === 'garage') {
        const t = performance.now() * 0.001;
        this.camera.position.set(Math.sin(t * 0.15) * 5.4, 1.55, Math.cos(t * 0.15) * 5.4);
        this.camera.lookAt(0, 0.55, 0);
        this.camera.fov = 38;
        this.camera.updateProjectionMatrix();
      } else {
        this.cam.menuCam(this._menuCar.mesh.position, performance.now() * 0.001);
      }
    }
    this.city.update(performance.now() * 0.001);
    const rain = this.settings.data.rain;
    this.weather.update(dt, this.camera.position, rain);
    this.audio.update(dt, this._menuCar, rain, false);
    this.post.render(dt, 0, false, rain);
  }

  _updateRace(dt) {
    const field = this.race.field;
    this.race.update(dt, this.track);

    if (this.state === 'countdown') {
      const h = this.race.hud();
      if (this.race.state === 'racing') {
        this.state = 'racing';
        this.playerCtrl.enabled = true;
        this.controllers.forEach((c) => (c.enabled = true));
      }
      this.ui.updateHud(h, this.player);
    }

    if (this.state === 'racing' || this.race.state === 'racing') {
      this.playerCtrl.update();
      const playerProgress = this.player.progress;
      this.controllers.forEach((c) => c.update(dt, playerProgress, field));
    }

    for (const v of field) {
      this._constrain(v, dt);
      v.physics.update(dt);
      v.updateVisuals(dt);
    }
    this._carCollisions(field);
    this.traffic.update(dt, this.track, field);
    this.particles.update(dt, field, this.settings.data.rain);
    this.city.update(performance.now() * 0.001);

    const lightning = this.weather.update(dt, this.camera.position, this.settings.data.rain);
    this.lights.update(this.player.physics.position, lightning);
    this.cam.update(dt, this.player);

    const h = this.race.hud();
    this.ui.updateHud(h, this.player);
    this.ui.drawMinimap(this.track, field, this.player);

    const p = this.player.physics;
    const nos = p.nitro && p.nitroAmount > 0.02 && p.throttle > 0.1;
    this.audio.update(dt, this.player, this.settings.data.rain, true);
    this.post.render(dt, Math.abs(p.speed), nos, this.settings.data.rain);

    if (this.race.finished && this.state === 'racing') {
      this.state = 'results';
      this.cam.playFinish();
      this.playerCtrl.enabled = false;
      this.ui.showResults(this.race);
    }
  }

  _updateResults(dt) {
    this.player.physics.throttle = 0;
    this.player.physics.brake = 0.4;
    this.player.physics.update(dt);
    this.player.updateVisuals(dt);
    this.opponents.forEach((v) => {
      v.physics.throttle *= 0.9;
      v.physics.update(dt);
      v.updateVisuals(dt);
    });
    this.cam.update(dt, this.player);
    this.lights.update(this.player.physics.position, 0);
    this.post.render(dt, Math.abs(this.player.physics.speed), false, this.settings.data.rain);
  }

  _renderPaused() {
    this.post.render(0, 0, false, this.settings.data.rain);
  }

  _constrain(v, dt) {
    const info = this.track.closest(v.physics.position, v.raceT);
    const p = v.physics;
    const roadY = info.point.y;
    const half = this.track.width / 2;
    const off = Math.abs(info.lateral) - half;
    p._offT = p._offT || 0;
    if (off > 0.4) {
      p.surfaceGrip = this.settings.data.rain ? 0.38 : 0.5;
      const dir = info.binormal.clone().multiplyScalar(-Math.sign(info.lateral || 1));
      if (off > 10) {
        p.position.addScaledVector(dir, (off - 10) * 0.35);
        const into = p.velocity.dot(info.binormal) * Math.sign(info.lateral || 1);
        if (into > 0) {
          p.velocity.addScaledVector(dir, into);
          p.speed *= 0.92;
        }
      }
      if (Math.abs(p.speed) < 2.5) p._offT += dt;
      else p._offT = 0;
      if (p._offT > 0.9) {
        const s = this.track.sampleT(v.raceT || info.t);
        p.position.copy(s.point);
        p.position.y = s.point.y;
        p.yaw = Math.atan2(s.tangent.x, s.tangent.z);
        p.speed = 8;
        p.velocity.set(Math.sin(p.yaw) * 8, 0, Math.cos(p.yaw) * 8);
        p._offT = 0;
      }
    } else {
      p._offT = 0;
      p.surfaceGrip = this.settings.data.rain ? 0.86 : 1;
    }
    if (p.grounded) {
      if (p.position.y > roadY + 0.85 && Math.abs(p.speed) > 16) {
        p.grounded = false;
      } else {
        p.position.y = roadY;
      }
    } else if (p.position.y <= roadY) {
      p.position.y = roadY;
      p.grounded = true;
      if (p.airTime > 0.35) p.camShake = Math.min(1, p.camShake + 0.4);
    }
  }

  _carCollisions(field) {
    for (let i = 0; i < field.length; i++) {
      for (let j = i + 1; j < field.length; j++) {
        const a = field[i];
        const b = field[j];
        const da = a.physics.position;
        const db = b.physics.position;
        const dx = da.x - db.x;
        const dz = da.z - db.z;
        const d2 = dx * dx + dz * dz;
        const min = 2.35;
        if (d2 < min * min && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const nz = dz / d;
          const pen = min - d;
          da.x += nx * pen * 0.5;
          da.z += nz * pen * 0.5;
          db.x -= nx * pen * 0.5;
          db.z -= nz * pen * 0.5;
          const dir = new THREE.Vector3(nx, 0, nz);
          const rel = Math.abs(a.physics.speed - b.physics.speed);
          a.physics.applyHit(2 + rel * 0.15, dir);
          b.physics.applyHit(2 + rel * 0.15, dir.clone().negate());
          if (a.isPlayer || b.isPlayer) this.audio.impact();
        }
      }
    }
  }

  _adapt(dt) {
    this._fps = this._fps * 0.9 + (1 / Math.max(dt, 0.008)) * 0.1;
  }

  _resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
