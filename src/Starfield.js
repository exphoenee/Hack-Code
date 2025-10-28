import { GAME_W, GAME_H } from './constants.js';

export default class Starfield {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
    this.running = false;
  }

  create() {
    // Négy parallax réteg: lassabb => halványabb, gyorsabb => fényesebb, közeliek 2px
    const configs = [
      { count: 100, speed: 30,  size: 1.0, alpha: 0.25, depth: -10 },
      { count: 65, speed: 60,  size: 1.2, alpha: 0.40, depth: -10 },
      { count: 35, speed: 95,  size: 1.6, alpha: 0.70, depth: -10 },
      { count: 20, speed: 150, size: 2.0, alpha: 1.00, depth: -10 }, // legközelebbi, leggyorsabb 2px
    ];

    const DOT_BASE = 6; // 'dot' textúra 6x6, skála = kívántMéret / DOT_BASE
    this.layers = configs.map(cfg => {
      const stars = [];
      for (let i = 0; i < cfg.count; i += 1) {
        const x = Phaser.Math.Between(0, GAME_W);
        const y = Phaser.Math.Between(0, GAME_H); // kitöltés induláskor; respawn fent történik
        const star = this.scene.add.image(x, y, 'dot')
          .setAlpha(cfg.alpha)
          .setDepth(cfg.depth);
        const scale = (cfg.size / DOT_BASE);
        star.setScale(scale);
        stars.push({ sprite: star, speed: cfg.speed });
      }
      return { config: cfg, stars };
    });

    this.stop(); // induláskor álljon, amíg a játék nem fut
  }

  start() { this.running = true; }
  stop() { this.running = false; }

  update(_time, delta) {
    if (!this.running) return;
    const dt = delta / 1000;
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        const sp = s.sprite;
        sp.y += s.speed * dt;
        if (sp.y > GAME_H + 2) {
          sp.y = -2; // fent újraspawn
          sp.x = Phaser.Math.Between(0, GAME_W);
        }
      }
    }
  }
}
