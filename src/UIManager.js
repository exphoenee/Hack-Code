import { GAME_W, GAME_H } from './constants.js';

export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = null;
    this.hpText = null;
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.beamText = null;
    this.rocketText = null;
    this.highText = null;
    this.overlay = null;
    this.overlayMsg = null;
    this.hpBarWidth = 120;
    this.hpBarHeight = 8;
  }

  create(initialHighScore) {
    this.scoreText = this.scene.add.text(16, 12, 'Pont: 0', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '22px',
      color: '#e2e8f0'
    }).setDepth(10);

    this.highText = this.scene.add.text(GAME_W - 16, 12, `Rekord: ${initialHighScore}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '22px',
      color: '#94a3b8'
    }).setOrigin(1, 0).setDepth(10);

    // HP százalék
    this.hpText = this.scene.add.text(16, 36, 'HP: 100%', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '18px',
      color: '#a7f3d0'
    }).setDepth(10);

    // HP sáv
    const barX = 16;
    const barY = 58;
    this.hpBarBg = this.scene.add.rectangle(barX, barY, this.hpBarWidth, this.hpBarHeight, 0x1f2937, 0.8)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x334155, 1)
      .setDepth(10);
    this.hpBarFill = this.scene.add.rectangle(barX, barY, this.hpBarWidth, this.hpBarHeight, 0x10b981, 1)
      .setOrigin(0, 0.5)
      .setDepth(11);

    // Beam töltetek számláló
    this.beamText = this.scene.add.text(16, barY + 14, 'Beam: 0', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '16px',
      color: '#f0abfc'
    }).setDepth(10);
    this.beamText.setVisible(false);

    // Rocket töltetek számláló (alapesetben a beam alatt)
    this.rocketText = this.scene.add.text(16, (barY + 14) + 18, 'Rockets: 0', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '16px',
      color: '#fb923c'
    }).setDepth(10);
    this.rocketText.setVisible(false);

    this.overlay = this.scene.add.container(GAME_W / 2, GAME_H / 2).setDepth(20);
    const box = this.scene.add.rectangle(0, 0, GAME_W * 0.86, 360, 0x000000, 0.55)
      .setStrokeStyle(2, 0x64748b, 0.9);
    const title = this.scene.add.text(0, -140, 'DODGE!', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '48px',
      color: '#e2e8f0'
    }).setOrigin(0.5);
    this.overlayMsg = this.scene.add.text(0, 40, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '20px',
      color: '#cbd5e1',
      align: 'center',
      wordWrap: { width: GAME_W * 0.8, useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.overlay.add([box, title, this.overlayMsg]);
  }

  updateScore(score) { this.scoreText.setText(`Pont: ${score}`); }
  updateHighScore(highScore) { this.highText.setText(`Rekord: ${highScore}`); }
  updateBeamCharges(n) {
    if (!this.beamText) return;
    const count = n | 0;
    if (count <= 0) {
      this.beamText.setVisible(false);
    } else {
      this.beamText.setText(`Beam: ${count}`);
      this.beamText.setVisible(true);
    }
  }
  updateRocketCharges(n, beamCount = 0) {
    if (!this.rocketText) return;
    const count = n | 0;
    if (count <= 0) {
      this.rocketText.setVisible(false);
      return;
    }
    // Ha van beam is, a rocket a beam alá kerüljön, különben a beam helyére
    const yBase = this.beamText ? this.beamText.y : (this.hpBarBg ? (this.hpBarBg.y + 14) : 72);
    if ((beamCount | 0) > 0 && this.beamText?.visible) {
      this.rocketText.setY(yBase + 18);
    } else {
      this.rocketText.setY(yBase);
    }
    this.rocketText.setText(`Rockets: ${count}`);
    this.rocketText.setVisible(true);
  }
  updateHP(percent) {
    const pct = Math.max(0, Math.min(100, Math.round(percent)));
    if (this.hpText) this.hpText.setText(`HP: ${pct}%`);
    const w = (this.hpBarWidth * pct) / 100;
    if (this.hpBarFill) this.hpBarFill.width = w;
    // Zöld → Sárga → Piros
    const t = pct / 100;
    const r = Math.floor(255 * (1 - t));
    const g = Math.floor(200 * Math.min(1, t * 1.3));
    const color = (r << 16) | (g << 8) | 64;
    if (this.hpBarFill) this.hpBarFill.fillColor = color;
  }
  showStartScreen() { this.setOverlayMessage('Lődd le az ellenséges űrjhajókat!\nMozgás: A/D vagy Bal/Jobb nyíl\nLövés: kattintás\nKezdés: Space vagy kattintás'); this.overlay.setVisible(true); }
  showPauseScreen() { this.setOverlayMessage('Szünet\nFolytatás: Space vagy ESC'); this.overlay.setVisible(true); }
  showGameOver(score, highScore) { this.setOverlayMessage(`Vége!\nPont: ${score}\nRekord: ${highScore}\nÚjrakezdés: Space vagy Kattintás`); this.overlay.setVisible(true); }
  hideOverlay() { this.overlay.setVisible(false); }
  setOverlayMessage(msg) { this.overlayMsg.setText(msg); }
}
