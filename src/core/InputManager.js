export class InputManager {
  constructor() {
    this.keys = new Set();
    this.steer = 0;
    this.throttle = 0;
    this.brake = 0;
    this.handbrake = false;
    this.nitro = false;
    this.pausePressed = false;
    this.restartPressed = false;
    this.cameraPressed = false;
    this._padSteer = 0;
    this._padThrottle = 0;
    this._padBrake = 0;

    this._onDown = (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    this._onUp = (e) => this.keys.delete(e.code);
    window.addEventListener('keydown', this._onDown, { passive: false });
    window.addEventListener('keyup', this._onUp);
    window.addEventListener('blur', () => this.keys.clear());
  }

  get down() {
    return (code) => this.keys.has(code);
  }

  update() {
    const k = this.keys;
    const left = k.has('KeyA') || k.has('ArrowLeft');
    const right = k.has('KeyD') || k.has('ArrowRight');
    const up = k.has('KeyW') || k.has('ArrowUp');
    const down = k.has('KeyS') || k.has('ArrowDown');

    let steer = (right ? 1 : 0) - (left ? 1 : 0);
    let throttle = up ? 1 : 0;
    let brake = down ? 1 : 0;
    let handbrake = k.has('Space');
    let nitro = k.has('ShiftLeft') || k.has('ShiftRight');

    this._readGamepad();
    if (Math.abs(this._padSteer) > 0.08) steer = this._padSteer;
    if (this._padThrottle > 0.05) throttle = Math.max(throttle, this._padThrottle);
    if (this._padBrake > 0.05) brake = Math.max(brake, this._padBrake);

    this.steer = -steer;
    this.throttle = throttle;
    this.brake = brake;
    this.handbrake = handbrake || this._padHandbrake;
    this.nitro = nitro || this._padNitro;
    this.pausePressed = k.has('Escape') || this._padPause;
    this.restartPressed = k.has('KeyR');
    this.cameraPressed = k.has('KeyC') || this._padCam;
  }

  _readGamepad() {
    this._padSteer = 0;
    this._padThrottle = 0;
    this._padBrake = 0;
    this._padHandbrake = false;
    this._padNitro = false;
    this._padPause = false;
    this._padCam = false;
    const pads = navigator.getGamepads?.() || [];
    for (const p of pads) {
      if (!p) continue;
      const ax = p.axes || [];
      const bt = p.buttons || [];
      const sx = ax[0] || 0;
      this._padSteer = Math.abs(sx) > 0.12 ? sx : 0;
      const rt = bt[7]?.value ?? 0;
      const lt = bt[6]?.value ?? 0;
      const a = bt[0]?.value ?? 0;
      const b = bt[1]?.value ?? 0;
      this._padThrottle = Math.max(rt, a);
      this._padBrake = Math.max(lt, b);
      this._padHandbrake = !!(bt[2]?.pressed || bt[5]?.pressed);
      this._padNitro = !!(bt[3]?.pressed || bt[4]?.pressed);
      this._padPause = !!bt[9]?.pressed;
      this._padCam = !!bt[8]?.pressed;
      break;
    }
  }

  consumeKey(code) {
    const had = this.keys.has(code);
    this.keys.delete(code);
    return had;
  }

  dispose() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup', this._onUp);
  }
}
