import { GAME_W, GAME_H } from './constants.js';

export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.cursors = null;
    this.keys = null;
    this.startHandler = null;
    this.pauseHandler = null;
    this.resumeHandler = null;
    this.pointerHandler = null;
    this.pointerUpHandler = null;
  }

  init() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = this.scene.input.keyboard.addKeys('A,D,SPACE,P,ESC');
    // Egér/koppintás: nem mozgat, hanem továbbítjuk a koordinátát
    this.scene.input.on('pointerdown', (pointer) => {
      if (this.pointerHandler) this.pointerHandler(pointer);
    });
    this.scene.input.on('pointerup', (pointer) => {
      if (this.pointerUpHandler) this.pointerUpHandler(pointer);
    });
    this.keys.SPACE.on('down', () => {
      // Space csak folytatásra használjuk (pause-ból), nem játékindításra
      if (this.resumeHandler) this.resumeHandler();
    });
    this.keys.P.on('down', () => { if (this.pauseHandler) this.pauseHandler(); });
    if (this.keys.ESC) this.keys.ESC.on('down', () => { if (this.resumeHandler) this.resumeHandler(); });
  }

  registerStartHandler(fn) { this.startHandler = fn; }
  registerPauseHandler(fn) { this.pauseHandler = fn; }
  registerResumeHandler(fn) { this.resumeHandler = fn; }
  registerPointerHandler(fn) { this.pointerHandler = fn; }
  registerPointerUpHandler(fn) { this.pointerUpHandler = fn; }

  getAxis() {
    let axis = 0;
    if (!this.cursors || !this.keys) return axis;
    if (this.cursors.left.isDown || this.keys.A.isDown) axis -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) axis += 1;
    return axis;
  }
}
