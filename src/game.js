import MainScene from './MainScene.js';
import { GAME_W, GAME_H } from './constants.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [MainScene]
};

// eslint-disable-next-line no-new
new Phaser.Game(config);

