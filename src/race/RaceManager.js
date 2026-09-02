import { formatTime } from '../utils/math.js';

export class RaceManager {
  constructor() {
    this.laps = 3;
    this.time = 0;
    this.state = 'idle';
    this.countdown = 0;
    this.results = [];
    this.started = false;
    this.finished = false;
    this.player = null;
    this.field = [];
    this.bestLap = null;
  }

  setup(player, field, laps) {
    this.player = player;
    this.field = field;
    this.laps = laps;
    this.time = 0;
    this.state = 'countdown';
    this.countdown = 3.05;
    this.results = [];
    this.started = false;
    this.finished = false;
    this.bestLap = null;
    for (const v of field) {
      v.lap = 1;
      v.checkpoint = 0;
      v.finished = false;
      v.finishTime = 0;
      v.progress = 0;
      v.lastT = 0;
      v._lapTime = 0;
    }
  }

  update(dt, track) {
    if (this.state === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = 'racing';
        this.started = true;
        this.time = 0;
      }
      return;
    }
    if (this.state !== 'racing') return;
    this.time += dt;

    for (const v of this.field) {
      if (v.finished) continue;
      const info = track.closest(v.physics.position, v.raceT);
      const d = track.wrapProgress(v.lastT, info.t);
      if (d > -0.2) {
        v.progress += d * track.length;
        if (info.t + 0.0001 < v.lastT && v.lastT > 0.75 && info.t < 0.25 && v.progress > 80) {
          v.lap += 1;
          if (v === this.player) {
            const lt = this.time - (v._lapStart || 0);
            v._lapStart = this.time;
            if (!this.bestLap || lt < this.bestLap) this.bestLap = lt;
          }
        }
      }
      v.lastT = info.t;
      v.raceT = info.t;
      v._lapStart = v._lapStart ?? 0;

      if (v.lap > this.laps && !v.finished) {
        v.finished = true;
        v.finishTime = this.time;
        v.physics.throttle = 0;
        this.results.push({
          name: v.isPlayer ? 'YOU' : v.name,
          vehicle: v,
          time: this.time,
          player: v.isPlayer
        });
        if (v.isPlayer) {
          this.finished = true;
          this.state = 'results';
        }
      }
    }

    const sorted = [...this.field].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      const pa = (a.lap - 1) * track.length + a.raceT * track.length;
      const pb = (b.lap - 1) * track.length + b.raceT * track.length;
      return pb - pa;
    });
    sorted.forEach((v, i) => (v.place = i + 1));

    if (!this.player.finished && this.results.length >= this.field.length) {
      this.finished = true;
      this.state = 'results';
    }
  }

  hud() {
    const p = this.player;
    return {
      place: p.place,
      total: this.field.length,
      lap: Math.min(p.lap, this.laps),
      laps: this.laps,
      time: formatTime(this.time),
      seconds: this.time,
      progress: Math.min(1, ((p.lap - 1) + p.raceT) / this.laps),
      finished: this.finished,
      countdown: this.state !== 'countdown' ? 0 : this.countdown > 2 ? 3 : this.countdown > 1 ? 2 : this.countdown > 0.12 ? 1 : 0,
      go: this.state === 'countdown' && this.countdown <= 0.12
    };
  }
}
