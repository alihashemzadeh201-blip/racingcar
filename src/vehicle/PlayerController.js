export class PlayerController {
  constructor(vehicle, input) {
    this.vehicle = vehicle;
    this.input = input;
    this.enabled = false;
  }

  update() {
    if (!this.enabled) {
      this.vehicle.physics.throttle = 0;
      this.vehicle.physics.brake = 0;
      this.vehicle.physics.steerInput = 0;
      this.vehicle.physics.handbrake = true;
      this.vehicle.physics.nitro = false;
      return;
    }
    const i = this.input;
    this.vehicle.physics.steerInput = i.steer;
    this.vehicle.physics.throttle = i.throttle;
    this.vehicle.physics.brake = i.brake;
    this.vehicle.physics.handbrake = i.handbrake;
    this.vehicle.physics.nitro = i.nitro;
  }
}
