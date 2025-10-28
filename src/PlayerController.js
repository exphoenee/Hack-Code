import { GAME_W, GAME_H } from './constants.js';

export default class PlayerController {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.BASE_ANGLE = 180; // állítsd, ha nem felfelé néz az asset
    this.TARGET_W = 48;    // megjelenített szélesség px-ben
    this.COLLIDER_RATIO = 0.35; // kör hitbox arány
  }

  create() {
    const useHero = this.scene.textures && this.scene.textures.exists('hero1');
    const key = useHero ? 'hero1' : 'playerTri';

    this.sprite = this.scene.physics.add.image(GAME_W / 2, GAME_H - 80, key)
      .setOrigin(0.5)
      .setCollideWorldBounds(true);

    if (useHero) {
      if (this.sprite.width > 0) {
        const scale = this.TARGET_W / this.sprite.width;
        this.sprite.setScale(scale);
      }
      this.sprite.setAngle(this.BASE_ANGLE);
      const texW = this.sprite.width;
      const texH = this.sprite.height;
      const r = Math.max(8, Math.floor(Math.min(texW, texH) * this.COLLIDER_RATIO));
      this.sprite.setCircle(r, (texW / 2) - r, (texH / 2) - r);
    } else {
      // Fallback a generált háromszög textúrára
      this.sprite.setScale(1);
      this.sprite.setAngle(this.BASE_ANGLE -90);
      this.sprite.setCircle(18, 6, 10);
    }
    return this.sprite;
  }

  reset() {
    if (!this.sprite) return;
    this.sprite.setPosition(GAME_W / 2, GAME_H - 80);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngle(this.BASE_ANGLE);
  }

  update(axis) {
    if (!this.sprite) return;
    const speed = 260;
    this.sprite.setVelocityX(axis * speed);
    // Nem döntjük meg a sprite-ot, a tájolás rögzített
  }
}
