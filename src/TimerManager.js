export default class TimerManager {
  constructor(scene) {
    this.scene = scene;
    this.events = [];
  }

  add(config) {
    const evt = this.scene.time.addEvent(config);
    this.events.push(evt);
    return evt;
  }

  addLoop(delay, callback) {
    return this.add({ delay, loop: true, callback });
  }

  clearAll() {
    this.events.forEach(evt => evt.remove(false));
    this.events = [];
  }
}

