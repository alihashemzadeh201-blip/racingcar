export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.engine = null;
    this.started = false;
    this._gear = 1;
  }

  async resume() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this._applyVolumes();
      this._setupEngine();
      this._setupAmbience();
      this._setupMusic();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.started = true;
  }

  _applyVolumes() {
    if (!this.master) return;
    this.master.gain.value = this.settings.data.master;
    this.musicGain.gain.value = this.settings.data.music;
    this.sfxGain.gain.value = this.settings.data.sfx;
  }

  applySettings() {
    this._applyVolumes();
  }

  _noise(seconds = 1) {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _setupEngine() {
    const ctx = this.ctx;
    this.engGain = ctx.createGain();
    this.engGain.gain.value = 0;
    this.engFilter = ctx.createBiquadFilter();
    this.engFilter.type = 'lowpass';
    this.engFilter.frequency.value = 800;
    this.oscA = ctx.createOscillator();
    this.oscB = ctx.createOscillator();
    this.oscA.type = 'sawtooth';
    this.oscB.type = 'square';
    this.oscA.frequency.value = 50;
    this.oscB.frequency.value = 51;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.18;
    this.oscA.connect(oscGain);
    this.oscB.connect(oscGain);
    oscGain.connect(this.engFilter);
    const src = ctx.createBufferSource();
    src.buffer = this._noise(2);
    src.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.08;
    src.connect(ng);
    ng.connect(this.engFilter);
    this.engFilter.connect(this.engGain);
    this.engGain.connect(this.sfxGain);
    this.oscA.start();
    this.oscB.start();
    src.start();

    this.screech = ctx.createBufferSource();
    this.screech.buffer = this._noise(2);
    this.screech.loop = true;
    this.screechFilter = ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.value = 1800;
    this.screechGain = ctx.createGain();
    this.screechGain.gain.value = 0;
    this.screech.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.sfxGain);
    this.screech.start();

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    const wind = ctx.createBufferSource();
    wind.buffer = this._noise(2);
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.value = 800;
    wind.connect(wf);
    wf.connect(this.windGain);
    this.windGain.connect(this.sfxGain);
    wind.start();

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    const rain = ctx.createBufferSource();
    rain.buffer = this._noise(2);
    rain.loop = true;
    const rf = ctx.createBiquadFilter();
    rf.type = 'highpass';
    rf.frequency.value = 4000;
    rain.connect(rf);
    rf.connect(this.rainGain);
    this.rainGain.connect(this.sfxGain);
    rain.start();
  }

  _setupAmbience() {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const g = this.ctx.createGain();
    g.gain.value = 0.03;
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start();
  }

  _setupMusic() {
    // Dark pulsing bass + sparse arpeggio
    const ctx = this.ctx;
    this.musicOsc = ctx.createOscillator();
    this.musicOsc.type = 'sawtooth';
    this.musicOsc.frequency.value = 55;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 220;
    const g = ctx.createGain();
    g.gain.value = 0.07;
    this.musicOsc.connect(f);
    f.connect(g);
    g.connect(this.musicGain);
    this.musicOsc.start();
    this._musicFilter = f;
    this._musicGain = g;
    this._notes = [55, 55, 82.5, 73.4, 55, 98, 82.5, 73.4];
    this._noteI = 0;
    this._noteT = 0;
  }

  beep(freq = 880, dur = 0.12, type = 'square', vol = 0.12) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  impact() {
    this.beep(90, 0.18, 'sawtooth', 0.2);
  }

  ui() {
    this.beep(720, 0.07, 'square', 0.08);
  }

  countdown(n) {
    if (n <= 0) this.beep(1320, 0.28, 'square', 0.16);
    else this.beep(660, 0.15, 'square', 0.12);
  }

  update(dt, vehicle, raining, inRace) {
    if (!this.ctx) return;
    this._applyVolumes();
    const p = vehicle?.physics;
    if (p && inRace) {
      const rpm = p.rpm;
      const f = 40 + rpm * 0.018;
      this.oscA.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.05);
      this.oscB.frequency.setTargetAtTime(f * 1.01, this.ctx.currentTime, 0.05);
      this.engFilter.frequency.setTargetAtTime(400 + rpm * 0.2 + p.throttle * 600, this.ctx.currentTime, 0.08);
      const vol = 0.04 + Math.min(0.22, Math.abs(p.speed) * 0.003) + p.throttle * 0.08;
      this.engGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
      this.screechGain.gain.setTargetAtTime(p.driftFactor * 0.12 + (p.slide > 6 ? 0.06 : 0), this.ctx.currentTime, 0.08);
      this.windGain.gain.setTargetAtTime(Math.min(0.1, Math.abs(p.speed) * 0.0012), this.ctx.currentTime, 0.1);
      if (p.gear !== this._gear) {
        this._gear = p.gear;
        this.beep(180, 0.05, 'square', 0.05);
      }
    } else if (this.engGain) {
      this.engGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 0.2);
      this.screechGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(raining ? 0.045 : 0, this.ctx.currentTime, 0.3);
    }
    this._noteT += dt;
    if (this._noteT > 0.5 && this.musicOsc) {
      this._noteT = 0;
      this._noteI = (this._noteI + 1) % this._notes.length;
      this.musicOsc.frequency.setTargetAtTime(this._notes[this._noteI], this.ctx.currentTime, 0.04);
    }
  }
}
