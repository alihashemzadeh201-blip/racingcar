import { CAR_CATALOG, PAINTS, WHEEL_STYLES } from '../vehicle/CarFactory.js';
import { TRACKS } from '../race/TrackGenerator.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.screens = {
      loading: document.getElementById('screen-loading'),
      menu: document.getElementById('screen-menu'),
      garage: document.getElementById('screen-garage'),
      track: document.getElementById('screen-track'),
      settings: document.getElementById('screen-settings'),
      controls: document.getElementById('screen-controls'),
      pause: document.getElementById('screen-pause'),
      results: document.getElementById('screen-results')
    };
    this.hud = document.getElementById('hud');
    this._bind();
    this._buildGarage();
    this._buildTracks();
    this._syncSettings();
    this._lastCount = null;
    this.resetCountdown = () => {
      this._lastCount = null;
    };
  }

  _bind() {
    document.getElementById('menu-nav').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      this.game.audio.ui();
      this.game.onMenu(btn.dataset.action);
    });
    document.querySelectorAll('[data-back]').forEach((b) => {
      b.addEventListener('click', () => {
        this.game.audio.ui();
        this.game.show(b.dataset.back);
      });
    });
    document.getElementById('garage-confirm').addEventListener('click', () => {
      this.game.audio.ui();
      this.game.show('track');
    });
    document.getElementById('track-confirm').addEventListener('click', () => {
      this.game.audio.ui();
      this.game.startRace();
    });
    document.getElementById('screen-pause').addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (b) this.game.onPause(b.dataset.action);
    });
    document.getElementById('screen-results').addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (b) this.game.onPause(b.dataset.action);
    });
    document.getElementById('quality-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this._seg(e.currentTarget, b);
      this.game.setQuality(b.dataset.q);
    });
    document.getElementById('cam-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this._seg(e.currentTarget, b);
      this.game.setCameraMode(b.dataset.c);
    });
    document.getElementById('rain-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this._seg(e.currentTarget, b);
      this.game.setRain(b.dataset.r === 'on');
    });
    ['vol-master', 'vol-music', 'vol-sfx'].forEach((id) => {
      document.getElementById(id).addEventListener('input', (e) => {
        const map = { 'vol-master': 'master', 'vol-music': 'music', 'vol-sfx': 'sfx' };
        this.game.settings.set(map[id], e.target.value / 100);
        this.game.audio.applySettings();
      });
    });
  }

  _seg(root, btn) {
    root.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
  }

  _buildGarage() {
    const list = document.getElementById('car-list');
    list.innerHTML = '';
    CAR_CATALOG.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'car-card' + (i === 0 ? ' on' : '');
      el.innerHTML = `<div class="name">${c.name}</div><div class="class">${c.class}</div>`;
      el.addEventListener('click', () => {
        this.game.audio.ui();
        list.querySelectorAll('.car-card').forEach((n) => n.classList.remove('on'));
        el.classList.add('on');
        this.game.selectCar(c.id);
        this._stats(c);
      });
      list.appendChild(el);
    });
    this._stats(CAR_CATALOG[0]);

    const sw = document.getElementById('paint-swatches');
    PAINTS.forEach((hex, i) => {
      const s = document.createElement('div');
      s.className = 'swatch' + (i === 0 ? ' on' : '');
      s.style.background = `#${hex.toString(16).padStart(6, '0')}`;
      s.addEventListener('click', () => {
        sw.querySelectorAll('.swatch').forEach((n) => n.classList.remove('on'));
        s.classList.add('on');
        this.game.selectPaint(hex);
      });
      sw.appendChild(s);
    });
    const wo = document.getElementById('wheel-opts');
    WHEEL_STYLES.forEach((w, i) => {
      const b = document.createElement('button');
      b.textContent = w;
      if (i === 0) b.classList.add('on');
      b.addEventListener('click', () => {
        wo.querySelectorAll('button').forEach((n) => n.classList.remove('on'));
        b.classList.add('on');
        this.game.selectWheels(w);
      });
      wo.appendChild(b);
    });
  }

  _stats(c) {
    const box = document.getElementById('car-stats');
    const row = (label, v) =>
      `<div class="stat-row"><span>${label}</span><div class="stat-bar"><i style="width:${v}%"></i></div><span>${v}</span></div>`;
    box.innerHTML =
      `<h3 style="font-family:Orbitron;letter-spacing:.2em;margin-bottom:8px">${c.name}</h3>` +
      row('ACCEL', c.stats.accel) +
      row('TOP SPEED', c.stats.top) +
      row('HANDLING', c.stats.handling) +
      row('BRAKING', c.stats.brake);
  }

  _buildTracks() {
    const grid = document.getElementById('track-grid');
    grid.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const el = document.createElement('div');
      el.className = 'track-card' + (i === 0 ? ' on' : '');
      el.innerHTML = `<h3>${t.name}</h3><p>${t.desc}</p><div class="track-meta">${t.lengthKm} KM · ${t.laps} LAPS · NIGHT</div>`;
      el.addEventListener('click', () => {
        grid.querySelectorAll('.track-card').forEach((n) => n.classList.remove('on'));
        el.classList.add('on');
        this.game.selectTrack(t.id);
      });
      grid.appendChild(el);
    });
  }

  _syncSettings() {
    const s = this.game.settings.data;
    document.getElementById('vol-master').value = s.master * 100;
    document.getElementById('vol-music').value = s.music * 100;
    document.getElementById('vol-sfx').value = s.sfx * 100;
    document.querySelectorAll('#quality-seg button').forEach((b) => b.classList.toggle('on', b.dataset.q === s.quality));
    document.querySelectorAll('#cam-seg button').forEach((b) => b.classList.toggle('on', b.dataset.c === s.camera));
    document.querySelectorAll('#rain-seg button').forEach((b) => b.classList.toggle('on', (b.dataset.r === 'on') === s.rain));
  }

  show(name) {
    Object.entries(this.screens).forEach(([k, el]) => {
      el.classList.toggle('active', k === name);
    });
    const racing = name === 'hud' || name === 'none';
    if (name === 'none') {
      Object.values(this.screens).forEach((el) => el.classList.remove('active'));
    }
  }

  setLoading(p, status) {
    document.getElementById('load-bar').style.width = `${Math.floor(p * 100)}%`;
    document.getElementById('load-pct').textContent = `${Math.floor(p * 100)}%`;
    document.getElementById('load-status').textContent = status;
  }

  setHudVisible(v) {
    this.hud.classList.toggle('hidden', !v);
  }

  updateHud(h, vehicle) {
    document.getElementById('hud-place').textContent = h.place;
    document.getElementById('hud-lap').textContent = h.lap;
    document.getElementById('hud-time').textContent = h.time;
    const kmh = Math.max(0, Math.round(Math.abs(vehicle.physics.speed) * 3.6));
    document.getElementById('hud-speed').textContent = kmh;
    document.getElementById('hud-gear').textContent = vehicle.physics.gear === 0 ? 'R' : vehicle.physics.gear;
    document.getElementById('nitro-fill').style.width = `${vehicle.physics.nitroAmount * 100}%`;
    document.getElementById('rpm-fill').style.width = `${Math.min(100, (vehicle.physics.rpm / 8500) * 100)}%`;
    document.getElementById('cp-fill').style.width = `${h.progress * 100}%`;

    const cd = document.getElementById('countdown');
    if (h.countdown > 0 && h.countdown !== this._lastCount) {
      this._lastCount = h.countdown;
      cd.textContent = h.countdown >= 4 ? '' : h.countdown === 0 ? 'GO' : String(h.countdown);
      cd.classList.remove('show');
      void cd.offsetWidth;
      cd.classList.add('show');
      this.game.audio.countdown(h.countdown);
    }
    if (h.go && this._lastCount !== 0) {
      this._lastCount = 0;
      cd.textContent = 'GO';
      cd.classList.remove('show');
      void cd.offsetWidth;
      cd.classList.add('show');
      this.game.audio.countdown(0);
      const ban = document.getElementById('race-banner');
      ban.textContent = 'RACE';
      ban.classList.remove('show');
      void ban.offsetWidth;
      ban.classList.add('show');
    }

    const drift = document.getElementById('drift-pop');
    if (vehicle.physics.driftCombo > 40) {
      drift.textContent = `DRIFT  ${Math.floor(vehicle.physics.driftCombo)}`;
      drift.classList.add('show');
    } else {
      drift.classList.remove('show');
    }
  }

  drawMinimap(track, vehicles, player) {
    const c = document.getElementById('minimap');
    const g = c.getContext('2d');
    const w = c.width;
    const h = c.height;
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(4,8,16,0.2)';
    g.fillRect(0, 0, w, h);
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const p = track.curve.getPointAt(i / 120);
      pts.push(p);
    }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    pts.forEach((p) => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    });
    const pad = 16;
    const sx = (w - pad * 2) / (maxX - minX);
    const sz = (h - pad * 2) / (maxZ - minZ);
    const s = Math.min(sx, sz);
    const map = (p) => [
      pad + (p.x - minX) * s,
      pad + (p.z - minZ) * s
    ];
    g.strokeStyle = 'rgba(60,240,255,0.7)';
    g.lineWidth = 3;
    g.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = map(p);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.closePath();
    g.stroke();
    vehicles.forEach((v) => {
      const [x, y] = map(v.physics.position);
      g.fillStyle = v === player ? '#3cf0ff' : '#ff2d6a';
      g.beginPath();
      g.arc(x, y, v === player ? 4.5 : 3, 0, Math.PI * 2);
      g.fill();
    });
  }

  showResults(race) {
    const player = race.results.find((r) => r.player) || { name: 'YOU', time: race.time };
    const place = race.player.place;
    document.getElementById('results-title').textContent = place === 1 ? 'VICTORY' : 'FINISH';
    document.getElementById('results-place').textContent = `P${place}`;
    document.getElementById('results-time').textContent = player.time ? document.getElementById('hud-time').textContent : '';
    const list = document.getElementById('results-list');
    const rows = [...race.field].sort((a, b) => a.place - b.place);
    list.innerHTML = rows
      .map(
        (v) =>
          `<li class="${v.isPlayer ? 'player' : ''}"><span>P${v.place}  ${v.isPlayer ? 'YOU' : v.name}</span><span>${
            v.finished ? '' : 'DNF'
          }</span></li>`
      )
      .join('');
    this.show('results');
    this.setHudVisible(true);
  }
}
