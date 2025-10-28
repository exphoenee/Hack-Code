export default class TextureFactory {
  constructor(scene) {
    this.scene = scene;
  }

  createAll() {
    this.createPlayerTexture();
    this.createObstacleTexture();
    this.createBonusTexture();
    this.createPowerTexture();
    this.createRocketPickupTexture();
    this.createRocketBulletTexture();
    this.createCrosshairTexture();
    this.createParticleTexture();
  }

  createPlayerTexture() {
    const g = this.scene.add.graphics();
    g.fillStyle(0x7dd3fc, 1);
    g.lineStyle(4, 0x0ea5e9, 1);
    g.beginPath();
    g.moveTo(0, 28); g.lineTo(20, -28); g.lineTo(-20, -28); g.closePath();
    g.fillPath(); g.strokePath();
    g.generateTexture('playerTri', 48, 64);
    g.destroy();
  }

  createObstacleTexture() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xf87171, 1);
    g.fillRoundedRect(0, 0, 40, 40, 6);
    g.generateTexture('obstacle', 40, 40);
    g.destroy();
  }

  createBonusTexture() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xa7f3d0, 1);
    g.lineStyle(3, 0x10b981, 1);
    g.beginPath();
    g.moveTo(16, 0); g.lineTo(32, 16); g.lineTo(16, 32); g.lineTo(0, 16); g.closePath();
    g.fillPath(); g.strokePath();
    g.generateTexture('bonus', 32, 32);
    g.destroy();
  }

  createPowerTexture() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xc4b5fd, 1);
    g.lineStyle(3, 0x7c3aed, 1);
    g.beginPath();
    g.moveTo(18, 0); g.lineTo(36, 18); g.lineTo(18, 36); g.lineTo(0, 18); g.closePath();
    g.fillPath(); g.strokePath();
    g.generateTexture('power', 36, 36);
    g.destroy();
  }

  createParticleTexture() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('dot', 6, 6);
    g.destroy();
  }

  createRocketPickupTexture() {
    if (this.scene.textures && this.scene.textures.exists('rocketPU')) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0xf97316, 1);
    g.lineStyle(3, 0xfb923c, 1);
    g.fillRoundedRect(0, 0, 36, 36, 6);
    g.save();
    g.translateCanvas(18, 18);
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(-6, 6); g.lineTo(0, -10); g.lineTo(6, 6); g.closePath();
    g.fillPath();
    g.restore();
    g.generateTexture('rocketPU', 36, 36);
    g.destroy();
  }

  createRocketBulletTexture() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xffe08a, 1);
    g.fillRoundedRect(0, 0, 6, 14, 2);
    g.lineStyle(1, 0xf59e0b, 1);
    g.strokeRoundedRect(0, 0, 6, 14, 2);
    g.generateTexture('rocketBullet', 6, 14);
    g.destroy();
  }

  createCrosshairTexture() {
    if (this.scene.textures && this.scene.textures.exists('crosshair')) return;
    const size = 24;
    const g = this.scene.add.graphics();
    g.lineStyle(2, 0x93c5fd, 1);
    // kör
    g.strokeCircle(size/2, size/2, 8);
    // kereszt
    g.beginPath();
    g.moveTo(size/2, 2); g.lineTo(size/2, size-2);
    g.moveTo(2, size/2); g.lineTo(size-2, size/2);
    g.strokePath();
    g.generateTexture('crosshair', size, size);
    g.destroy();
  }
}
