import TextureFactory from './TextureFactory.js';
import TimerManager from './TimerManager.js';
import PlayerController from './PlayerController.js';
import InputManager from './InputManager.js';
import Enemy from './Enemy.js';
import BonusManager from './BonusManager.js';
import UIManager from './UIManager.js';
import Starfield from './Starfield.js';
import { GAME_W, GAME_H } from './constants.js';
import { loadHighScore, saveHighScore } from './storage.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
    this.state = { isPlaying: false, score: 0, highScore: 0, difficulty: 1, hits: 3, maxHits: 3 };
    this.music = null;
    this.musicTween = null;
    this.musicBaseVolume = 0.4;
    this.menuMusic = null;
    this.menuMusicTween = null;
    this.menuMusicBaseVolume = 0.35;
    this.gameOverMusic = null;
    this.gameOverMusicTween = null;
    this.gameOverMusicBaseVolume = 0.45;
    // Firing cooldown
    this.fireCooldownMs = 500;
    this.nextFireTime = 0;
    // Laser sebzés paraméterek
    this.laserBaseDamage = 0.7;   // középponti találat sebzése
    this.laserFalloff = 0.25;     // szélek felé csökkenés mértéke (dist/radius * falloff)
    // Ütközés sebezhetetlenség és sebzés
    this.invulnDurationMs = 800;
    this.invulnerableUntil = 0;
    this.collisionDamage = 0.5;
    // Power shot (hold-beam)
    this.state.beamCharges = 0;
    this.holdBeamActive = false;
    this.holdBeamDuration = 2000; // ms – hosszabb ideig tart
    this.holdBeamTickMs = 90; // gyorsabb tick
    this.holdBeamBaseTickDamage = 0.65; // erősebb alapsebzés tickenként
    this.holdBeamFalloff = 0.2; // kisebb esés a szélek felé
    // Rocket power-up
    this.state.rocketCharges = 0;
    // Lézersugarak (követő vizuál)
    this.beams = [];
    this.textureFactory = new TextureFactory(this);
    this.timerManager = new TimerManager(this);
    this.playerController = new PlayerController(this);
    this.inputManager = new InputManager(this);
    this.enemy = new Enemy(this);
    this.bonusManager = new BonusManager(this);
    this.uiManager = new UIManager(this);
    this.starfield = new Starfield(this);
  }

  preload() {
    this.load.image('hero1', 'assets/hero1.png');
    // Játék alatti zenék (választható)
    this.load.audio('bgm1', ['assets/symphony_of_desctruction.mp3']);
    this.load.audio('bgm2', ['assets/boss_fight.mp3']);
    this.load.audio('bgm3', ['assets/galactic_wrath.mp3']);
    this.load.audio('menu_bgm', ['assets/main_theme.mp3']);
    this.load.audio('gameover_bgm', ['assets/galactic_wrath.mp3']);
    // Enemik képei (PNG)
    this.load.image('enemy1', 'assets/enemy1.png');
    this.load.image('enemy2', 'assets/enemy2.png');
    this.load.image('enemy3', 'assets/enemy3.png');
    // Bonus/powerup képek
    this.load.image('hp', 'assets/hp.png');
    this.load.image('beam', 'assets/beam.png');
    this.load.image('rocketPU', 'assets/rocket.png');
  }

  create() {
    this.state.highScore = loadHighScore();
    this.textureFactory.createAll();
    this.starfield.create();

    const player = this.playerController.create();
    this.enemy.createGroup();
    this.bonusManager.createGroup();
    this.rockets = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(player, this.enemy.group, (_p, enemy) => this.onPlayerHitEnemy(enemy), null, this);
    this.physics.add.overlap(player, this.bonusManager.group, (_p, bonus) => this.collectBonus(bonus), null, this);
    this.physics.add.overlap(this.rockets, this.enemy.group, (rocket, enemy) => this.onRocketHitEnemy(rocket, enemy), null, this);

    // Menü állapot (nehézség + zene)
    this.menu = {
      rows: [
        { name: 'Nehézség', values: ['Könnyű', 'Normál', 'Nehéz'], idx: 1 },
        { name: 'Zene', values: ['Symphony', 'Boss Fight', 'Galactic Wrath'], keys: ['bgm1','bgm2','bgm3'], idx: 0 },
        { name: 'Start!', values: ['Indítás'], idx: 0 }
      ],
      selected: 0
    };

    this.currentBgmKey = 'bgm1';
    // Egér helyett célkereszt
    this.input.setDefaultCursor('none');
    this.crosshair = this.add.image(GAME_W/2, GAME_H/2, 'crosshair').setDepth(99);
    this.input.on('pointermove', (p) => {
      const x = Phaser.Math.Clamp(p.worldX ?? p.x, 0, GAME_W);
      const y = Phaser.Math.Clamp(p.worldY ?? p.y, 0, GAME_H);
      this.crosshair.setPosition(x, y);
    });

    this.uiManager.create(this.state.highScore);
    if (this.uiManager.updateHP) this.updateHPUI();
    if (this.uiManager.updateBeamCharges) this.uiManager.updateBeamCharges(this.state.beamCharges || 0);
    if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges || 0, this.state.beamCharges || 0);
    this.renderMainMenu();

    // Menü zene: indításkor halkan, finom fade‑in
    if (!this.menuMusic) {
      this.menuMusic = this.sound.add('menu_bgm', { loop: true, volume: 0 });
      this.menuMusic.play();
      this.fadeSoundTo(this.menuMusic, this.menuMusicBaseVolume, 600);
    }

    this.inputManager.init();
    // Space nem indítja a játékot; START a menüben Enterrel
    this.inputManager.registerPauseHandler(() => { if (this.state.isPlaying) this.pauseGame(); });
    this.inputManager.registerResumeHandler(() => { if (this.state.isPlaying && this.physics.world.isPaused) this.resumeGame(); });
    this.inputManager.registerPointerHandler((pointer) => {
      if (!this.state.isPlaying) { return; }
      if (this.physics.world.isPaused) return;
      // Ha van erősített lövés töltet és nem aktív még a tartott sugár, indítsuk el
      if (this.state.rocketCharges > 0) {
        this.fireTripleRockets();
      } else if (this.state.beamCharges > 0 && !this.holdBeamActive) {
        this.startHoldBeam();
      } else {
        this.fireLaser(pointer);
      }
    });
    this.inputManager.registerPointerUpHandler(() => {
      if (this.holdBeamActive) this.stopHoldBeam();
    });

    // Menü navigáció: ↑/↓ sorváltás, ←/→ értékváltás (csak ha nem játék folyik)
    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => { if (!this.state.isPlaying) { this.menu.selected = (this.menu.selected + this.menu.rows.length - 1) % this.menu.rows.length; this.renderMainMenu(); } });
    kb.on('keydown-DOWN', () => { if (!this.state.isPlaying) { this.menu.selected = (this.menu.selected + 1) % this.menu.rows.length; this.renderMainMenu(); } });
    kb.on('keydown-LEFT', () => { if (!this.state.isPlaying && this.menu.selected < this.menu.rows.length - 1) { const row = this.menu.rows[this.menu.selected]; row.idx = (row.idx + row.values.length - 1) % row.values.length; this.applyMenuSideEffects(); this.renderMainMenu(); } });
    kb.on('keydown-RIGHT', () => { if (!this.state.isPlaying && this.menu.selected < this.menu.rows.length - 1) { const row = this.menu.rows[this.menu.selected]; row.idx = (row.idx + 1) % row.values.length; this.applyMenuSideEffects(); this.renderMainMenu(); } });
    kb.on('keydown-ENTER', () => { if (!this.state.isPlaying && this.menu.selected === this.menu.rows.length - 1) { this.startGame(); } });

    // Pause, ha az ablak fókuszt veszít vagy a tab elrejtődik
    const onBlur = () => { if (this.state.isPlaying) this.pauseGame(); };
    const onVisibility = () => { if (document.hidden && this.state.isPlaying) this.pauseGame(); };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    });

    this.resetGameState();
  }

  startGame() {
    this.resetGameState();
    this.enemy.clearAll();
    this.bonusManager.clearAll();
    this.uiManager.hideOverlay();
    this.state.isPlaying = true;
    this.state.score = 0;
    // Alap nehézség a menüből
    const diffIdx = this.menu?.rows?.[0]?.idx ?? 1;
    const diffStart = [0.8, 1.0, 1.3][diffIdx] || 1.0;
    this.state.difficulty = diffStart;
    this.state.maxHits = 3;
    this.state.hits = this.state.maxHits;
    this.state.beamCharges = 0;
    this.state.rocketCharges = 0;
    this.state.rocketCharges = 0;
    this.invulnerableUntil = 0;
    this.updateScore(0);
    if (this.uiManager.updateHP) this.updateHPUI();
    if (this.uiManager.updateBeamCharges) this.uiManager.updateBeamCharges(this.state.beamCharges || 0);
    if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges || 0, this.state.beamCharges || 0);
    // Időzítők engedélyezése
    this.time.paused = false;
    this.physics.resume();
    this.starfield.start();
    // Menü zene kúszás le és állítás
    if (this.menuMusic) {
      this.fadeSoundTo(this.menuMusic, 0, 300, () => this.menuMusic && this.menuMusic.pause());
    }
    // Game Over zene biztos leállítása
    if (this.gameOverMusic) {
      this.fadeSoundTo(this.gameOverMusic, 0, 200, () => this.gameOverMusic && this.gameOverMusic.stop());
    }
    // Zene: kiválasztott játékzene, finom fade-in
    const musicIdx = this.menu?.rows?.[1]?.idx ?? 0;
    this.currentBgmKey = (this.menu?.rows?.[1]?.keys?.[musicIdx]) || 'bgm1';
    if (!this.music) {
      this.music = this.sound.add(this.currentBgmKey, { loop: true, volume: 0 });
      this.music.play();
    } else {
      // Ha másik zenét választott a menüben, cseréljük le a Sound instance‑t
      if (this.music.key !== this.currentBgmKey) {
        try { this.music.stop(); } catch {}
        this.music.destroy();
        this.music = this.sound.add(this.currentBgmKey, { loop: true, volume: 0 });
        this.music.play();
      } else if (this.music.isPaused) {
        this.music.resume();
      } else if (!this.music.isPlaying) {
        this.music.play();
      }
    }
    this.fadeSoundTo(this.music, this.musicBaseVolume, 600);
    this.startTimers();
  }

  togglePause() {
    const paused = this.physics.world.isPaused;
    if (paused) this.resumeGame(); else this.pauseGame();
  }

  pauseGame() {
    if (this.physics.world.isPaused) return;
    this.physics.world.isPaused = true;
    // Időzítők felfüggesztése, ne gyűljenek a spawnok
    this.time.paused = true;
    this.uiManager.showPauseScreen();
    this.starfield.stop();
    // célkereszt maradhat látható; pozíció frissítés pointermove-re történik
    // Aktív tartott sugár leállítása és vizuálok törlése
    if (this.holdBeamActive) this.stopHoldBeam();
    for (const b of this.beams) { b.ttl = 0; }
    // Zene: menüzene fel, játékmuzsika le
    if (this.music && this.music.isPlaying) {
      this.fadeSoundTo(this.music, 0, 250, () => this.music && this.music.pause());
    }
    if (!this.menuMusic) {
      this.menuMusic = this.sound.add('menu_bgm', { loop: true, volume: 0 });
      this.menuMusic.play();
    } else if (this.menuMusic.isPaused) {
      this.menuMusic.resume();
    } else if (!this.menuMusic.isPlaying) {
      this.menuMusic.play();
    }
    this.fadeSoundTo(this.menuMusic, this.menuMusicBaseVolume, 300);
  }

  resumeGame() {
    if (!this.physics.world.isPaused) return;
    this.physics.world.isPaused = false;
    // Időzítők folytatása
    this.time.paused = false;
    this.uiManager.hideOverlay();
    this.starfield.start();
    // Zene vissza
    if (this.menuMusic && !this.menuMusic.isPaused) {
      this.fadeSoundTo(this.menuMusic, 0, 250, () => this.menuMusic && this.menuMusic.pause());
    }
    if (this.music && this.music.isPaused) {
      this.music.resume();
    }
    if (this.music) this.fadeSoundTo(this.music, this.musicBaseVolume, 300);
  }

  gameOver() {
    if (!this.state.isPlaying) return;
    this.state.isPlaying = false;
    this.timerManager.clearAll();
    // Állítsuk le az időt, hogy semmi se spawnoljon
    this.time.paused = true;
    this.physics.pause();
    this.starfield.stop();
    if (this.music) {
      this.fadeSoundTo(this.music, 0, 400, () => this.music && this.music.stop());
    }
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      saveHighScore(this.state.highScore);
    }
    this.uiManager.updateHighScore(this.state.highScore);
    this.uiManager.showGameOver(this.state.score, this.state.highScore);

    // Game Over zene: játsszuk le és fade‑eljük fel
    if (!this.gameOverMusic) {
      this.gameOverMusic = this.sound.add('gameover_bgm', { loop: false, volume: 0 });
      this.gameOverMusic.play();
    } else {
      this.gameOverMusic.stop();
      this.gameOverMusic.setVolume(0);
      this.gameOverMusic.play();
    }
    this.fadeSoundTo(this.gameOverMusic, this.gameOverMusicBaseVolume, 500);
  }

  collectBonus(bonus) {
    if (!bonus.active) return;
    bonus.disableBody(true, true);
    const kind = bonus.getData('kind') || (bonus.texture && bonus.texture.key === 'hp' ? 'heal' : 'beam');
    const points = bonus.getData('points') ?? (kind === 'heal' ? 150 : 0);

    // Pontszám megjelenítése csak ha > 0
    if (points > 0) {
      this.updateScore(this.state.score + points);
      const fx = this.add.text(bonus.x, bonus.y, `+${points}`, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: '20px',
        color: '#22c55e'
      }).setDepth(15).setOrigin(0.5);
      this.tweens.add({ targets: fx, y: fx.y - 30, alpha: 0, duration: 600, onComplete: () => fx.destroy() });
    }

    if (kind === 'heal') {
      // Gyógyítás: +heal találatnyit, max-ig
      const heal = bonus.getData('heal') ?? 1;
      if (this.state.hits < this.state.maxHits) {
        this.state.hits = Math.min(this.state.maxHits, this.state.hits + heal);
        if (this.uiManager.updateHP) this.updateHPUI();
        const healFx = this.add.text(bonus.x, bonus.y - 18, '+HP', {
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
          fontSize: '18px',
          color: '#a7f3d0'
        }).setDepth(15).setOrigin(0.5);
        this.tweens.add({ targets: healFx, y: healFx.y - 22, alpha: 0, duration: 600, onComplete: () => healFx.destroy() });
      }
    } else if (kind === 'beam') {
      // Power shot: +charges töltet
      const charges = bonus.getData('charges') ?? 3;
      this.state.beamCharges = (this.state.beamCharges || 0) + charges;
      if (this.uiManager.updateBeamCharges) this.uiManager.updateBeamCharges(this.state.beamCharges);
      if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges || 0, this.state.beamCharges || 0);
      const fx = this.add.text(bonus.x, bonus.y - 18, `BEAM +${charges}`, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: '18px',
        color: '#f472b6'
      }).setDepth(15).setOrigin(0.5);
      this.tweens.add({ targets: fx, y: fx.y - 22, alpha: 0, duration: 700, onComplete: () => fx.destroy() });
    } else if (kind === 'rocket') {
      const charges = bonus.getData('charges') ?? 3;
      this.state.rocketCharges = (this.state.rocketCharges || 0) + charges;
      if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges, this.state.beamCharges || 0);
      const fx = this.add.text(bonus.x, bonus.y - 18, `ROCKET +${charges}`, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: '18px',
        color: '#fb923c'
      }).setDepth(15).setOrigin(0.5);
      this.tweens.add({ targets: fx, y: fx.y - 22, alpha: 0, duration: 700, onComplete: () => fx.destroy() });
    }
  }

  fireTripleRockets() {
    if ((this.state.rocketCharges || 0) <= 0) return;
    this.state.rocketCharges -= 1;
    if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges, this.state.beamCharges || 0);
    const originX = this.playerController.sprite.x;
    const originY = this.playerController.sprite.y - (this.playerController.sprite.displayHeight || 30) * 0.35;
    const speeds = [ -15, 0, 15 ];
    const speed = 520;
    speeds.forEach(deg => {
      const rad = Phaser.Math.DegToRad(deg - 90); // -90 = felfelé
      const vx = Math.cos(rad) * speed;
      const vy = Math.sin(rad) * speed;
      const r = this.rockets.get(originX, originY, 'rocketBullet');
      if (!r) return;
      r.setActive(true).setVisible(true);
      r.body.enable = true;
      r.setAngle(deg);
      r.setVelocity(vx, vy);
      r.checkWorldBounds = true;
      r.outOfBoundsKill = true;
      // Időzített megsemmisítés biztonságból
      this.time.addEvent({ delay: 2000, callback: () => r.destroy(), callbackScope: this });
    });
  }

  onRocketHitEnemy(rocket, enemy) {
    if (enemy && enemy.active) {
      // One-shot kill
      const pts = enemy.getData('points') ?? 50;
      const boom = this.add.circle(enemy.x, enemy.y, 10, 0xfca5a5, 1).setDepth(60);
      this.tweens.add({ targets: boom, alpha: 0, scale: 2, duration: 220, onComplete: () => boom.destroy() });
      enemy.disableBody(true, true);
      this.updateScore(this.state.score + pts);
    }
    if (rocket && rocket.active) rocket.destroy();
  }

  fireLaser(pointer) {
    const now = this.time && typeof this.time.now === 'number' ? this.time.now : performance.now();
    if (now < this.nextFireTime) return; // rate limit 0.5s
    this.nextFireTime = now + this.fireCooldownMs;
    if (!this.playerController.sprite) return;
    const sx = this.playerController.sprite.x;
    const sy = this.playerController.sprite.y - (this.playerController.sprite.displayHeight || 30) * 0.35;
    const tx = Phaser.Math.Clamp(pointer.worldX ?? pointer.x, 0, GAME_W);
    const ty = Phaser.Math.Clamp(pointer.worldY ?? pointer.y, 0, GAME_H);

    // Vizualizáció: dinamikus lézer, amely követi a player és a célpont pozícióját a rövid élettartama alatt
    const g = this.add.graphics().setDepth(50);
    g.lineStyle(2, 0x22d3ee, 1);
    const impact = this.add.circle(tx, ty, 6, 0x38bdf8, 1).setDepth(51);

    // Célkeresés: legközelebbi enemy, ha a kattintás az objektum sugarán belül van
    let target = null; let bestDist = Number.POSITIVE_INFINITY; let bestR = 0;
    this.enemy.group.children.each((obj) => {
      if (!obj.active) return;
      const dx = tx - obj.x; const dy = ty - obj.y; const d = Math.hypot(dx, dy);
      const r = Math.min(obj.displayWidth || obj.width || 40, obj.displayHeight || obj.height || 40) / 2;
      if (d <= r && d < bestDist) { target = obj; bestDist = d; bestR = r; }
    });

    if (!target) {
      // Ha nincs célpont, egy gyorsan elhalványuló sugár a kattintási pontra
      const tempBeam = { g, impact, target: null, ttl: 120, ttlMax: 120 };
      this.beams.push(tempBeam);
      return;
    }
    const hp = target.getData('hp') ?? 1.0;
    const maxHp = target.getData('maxHp') ?? 1.0;
    // Sebzés: nagyobb alapérték és enyhe esés a szélek felé
    const norm = bestDist / Math.max(1, bestR);
    const dmg = Math.max(0, this.laserBaseDamage - norm * this.laserFalloff);
    const newHp = Math.max(0, hp - dmg);
    target.setData('hp', newHp);

    // Vizuális visszajelzés: vörösbe tintelés a sebzéssel arányosan
    const ratio = Phaser.Math.Clamp(newHp / Math.max(0.001, maxHp), 0, 1);
    const red = Phaser.Display.Color.GetColor(255, 64 + Math.floor(128 * (1 - ratio)), 64);
    target.setTint(red);

    if (newHp <= 0) {
      // Megsemmisítés: kis robbanás és disable
      const boom = this.add.circle(target.x, target.y, 10, 0xfca5a5, 1).setDepth(60);
      this.tweens.add({ targets: boom, alpha: 0, scale: 2, duration: 220, onComplete: () => boom.destroy() });
      target.disableBody(true, true);
      // Pontozás: ellenség kilövése – pont a leíró szerint
      const pts = target.getData('points') ?? 50;
      this.updateScore(this.state.score + pts);
    }

    // Nyilvántartjuk a sugár vizuált, hogy követhesse a player és a célpont mozgását pár száz ms-ig
    const beam = { g, impact, target, ttl: 150, ttlMax: 150 };
    this.beams.push(beam);
  }

  startTimers() {
    this.timerManager.clearAll();
    this.timerManager.addLoop(200, () => {
      if (!this.state.isPlaying) return;
      this.updateScore(this.state.score + 10);
      this.state.difficulty += 0.02;
    });
    this.timerManager.addLoop(700, () => { if (this.state.isPlaying) this.enemy.spawn(this.state.difficulty); });
    this.timerManager.addLoop(3500, () => { if (this.state.isPlaying) this.bonusManager.spawn(this.state.difficulty); });
    this.timerManager.addLoop(1500, () => { this.enemy.cleanupOffscreen(); this.bonusManager.cleanupOffscreen(); });
  }

  resetGameState() {
    this.timerManager.clearAll();
    this.playerController.reset();
    this.state.isPlaying = false;
    this.state.difficulty = 1;
    this.updateScore(0);
    this.state.maxHits = 3;
    this.state.hits = this.state.maxHits;
    this.state.beamCharges = 0;
    this.state.rocketCharges = 0;
    this.state.rocketCharges = 0;
    this.invulnerableUntil = 0;
    if (this.uiManager.updateHP) this.updateHPUI();
    if (this.uiManager.updateBeamCharges) this.uiManager.updateBeamCharges(this.state.beamCharges || 0);
    if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges || 0, this.state.beamCharges || 0);
    // Időzítők felfüggesztése amíg nem indul a játék
    this.time.paused = true;
    this.physics.pause();
    this.starfield.stop();
  }

  updateScore(value) {
    this.state.score = Math.max(0, Math.floor(value));
    this.uiManager.updateScore(this.state.score);
  }

  update() {
    if (!this.state.isPlaying || this.physics.world.isPaused) return;
    // Csillagmező, sugarak és ellenfelek frissítése csak aktív játék közben
    if (this.starfield) this.starfield.update(this.time?.now || 0, this.game.loop.delta || 16);
    this.updateBeams(this.game.loop.delta || 16);
    if (this.enemy) this.enemy.update(this.time?.now || performance.now(), this.game.loop.delta || 16);
    const axis = this.inputManager.getAxis();
    this.playerController.update(axis);
  }

  renderMainMenu() {
    if (!this.uiManager) return;
    const a = (i) => (i === this.menu.selected ? '>' : ' ');
    const diffRow = this.menu.rows[0];
    const musicRow = this.menu.rows[1];
    const body = [
      'Lődd le az ellenséges űrhajókat!',
      'Mozgás: A/D vagy Bal/Jobb nyíl',
      'Lövés: kattintás',
      '',
      `${a(0)} Nehézség: <${diffRow.values[diffRow.idx]}>`,
      `${a(1)} Zene: <${musicRow.values[musicRow.idx]}>`,
      '',
      `${a(2)} Start!`,
      '',
      'Menü: ↑/↓ – sor,  ←/→ – váltás, Enter – Start',
    ].join('\n');
    this.uiManager.setOverlayMessage(body);
    this.uiManager.overlay.setVisible(true);
  }

  applyMenuSideEffects() {
    // Jelenleg csak azonnali elő-nézetet nem igénylünk; a kiválasztott zene a startnál érvényesül
  }

  startHoldBeam() {
    if (this.holdBeamActive || (this.state.beamCharges || 0) <= 0) return;
    this.holdBeamActive = true;
    this.state.beamCharges -= 1;
    if (this.uiManager.updateBeamCharges) this.uiManager.updateBeamCharges(this.state.beamCharges);
    if (this.uiManager.updateRocketCharges) this.uiManager.updateRocketCharges(this.state.rocketCharges || 0, this.state.beamCharges || 0);
    // létrehozunk egy beam recordot, ami a pointert követi és tickel sebzést
    const g = this.add.graphics().setDepth(55);
    const impact = this.add.circle(0, 0, 7, 0xf0abfc, 1).setDepth(56);
    const beam = { g, impact, target: null, ttl: this.holdBeamDuration, ttlMax: this.holdBeamDuration, followPointer: true, nextTick: 0 };
    this.beams.push(beam);
  }

  stopHoldBeam() {
    this.holdBeamActive = false;
    // A következő updateBeams törli a beam-et, ha lejár a TTL; itt azonnal is lezárhatjuk
    for (const b of this.beams) {
      if (b.followPointer) b.ttl = 0;
    }
  }

  updateBeams(delta) {
    if (!this.beams || !this.playerController?.sprite) return;
    const sx = this.playerController.sprite.x;
    const sy = this.playerController.sprite.y - (this.playerController.sprite.displayHeight || 30) * 0.35;
    const dt = delta;
    for (let i = this.beams.length - 1; i >= 0; i -= 1) {
      const b = this.beams[i];
      b.ttl -= dt;
      const t = Math.max(0, b.ttl) / b.ttlMax;
      const alpha = t;
      const g = b.g;
      const impact = b.impact;
      let ex, ey;
      if (b.followPointer) {
        const p = this.input.activePointer;
        ex = Phaser.Math.Clamp(p.worldX ?? p.x, 0, GAME_W);
        ey = Phaser.Math.Clamp(p.worldY ?? p.y, 0, GAME_H);
      } else if (b.target && b.target.active) {
        ex = b.target.x; ey = b.target.y;
      } else if (impact) {
        ex = impact.x; ey = impact.y;
      }
      if (g && ex !== undefined) {
        g.clear();
        const color = b.followPointer ? 0xf0abfc : 0x22d3ee;
        g.lineStyle(b.followPointer ? 4 : 3, color, alpha);
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath();
        g.alpha = alpha;
      }
      if (impact) {
        impact.setPosition(ex ?? impact.x, ey ?? impact.y);
        impact.setAlpha(alpha);
        impact.setScale(1.0 + 0.3 * (1 - t));
      }

      // Sebzés tick a követő sugaraknál
      if (b.followPointer && this.state.isPlaying && !this.physics.world.isPaused) {
        b.nextTick -= dt;
        if (b.nextTick <= 0) {
          b.nextTick = this.holdBeamTickMs;
          // Keressünk célpontot az endpoint körül és okozzunk sebzést
          let target = null; let bestDist = Number.POSITIVE_INFINITY; let bestR = 0;
          this.enemy?.group?.children.each((obj) => {
            if (!obj.active) return;
            const dx = (ex - obj.x); const dy = (ey - obj.y); const d = Math.hypot(dx, dy);
            const r = Math.min(obj.displayWidth || obj.width || 40, obj.displayHeight || obj.height || 40) / 2;
            if (d <= r && d < bestDist) { target = obj; bestDist = d; bestR = r; }
          });
          if (target) {
            const hp = target.getData('hp') ?? 1.0;
            const maxHp = target.getData('maxHp') ?? 1.0;
            const norm = bestDist / Math.max(1, bestR);
            const tickDmg = Math.max(0, this.holdBeamBaseTickDamage - norm * this.holdBeamFalloff);
            const newHp = Math.max(0, hp - tickDmg);
            target.setData('hp', newHp);
            const ratio = Phaser.Math.Clamp(newHp / Math.max(0.001, maxHp), 0, 1);
            target.setTint(Phaser.Display.Color.GetColor(255, 64 + Math.floor(128 * (1 - ratio)), 64));
            if (newHp <= 0) {
              const boom = this.add.circle(target.x, target.y, 10, 0xfca5a5, 1).setDepth(60);
              this.tweens.add({ targets: boom, alpha: 0, scale: 2, duration: 220, onComplete: () => boom.destroy() });
              target.disableBody(true, true);
              const pts = target.getData('points') ?? 50;
              this.updateScore(this.state.score + pts);
            }
          }
        }
      }
      if (b.ttl <= 0) {
        if (g) g.destroy();
        if (impact) impact.destroy();
        this.beams.splice(i, 1);
      }
    }
  }

  onPlayerHitEnemy(enemy) {
    const now = (this.time && typeof this.time.now === 'number') ? this.time.now : performance.now();
    if (now < this.invulnerableUntil) return; // sebezhetetlenségi ablak
    this.invulnerableUntil = now + this.invulnDurationMs;

    // Player sebződik
    const dmgHits = (enemy && enemy.getData) ? (enemy.getData('playerDamage') ?? 1) : 1;
    this.state.hits = Math.max(0, this.state.hits - dmgHits);
    if (this.uiManager.updateHP) this.updateHPUI();
    if (this.playerController.sprite) {
      this.tweens.add({ targets: this.playerController.sprite, alpha: 0.3, yoyo: true, repeat: 3, duration: 80 });
    }

    // Enemy is kapjon sebzést ütközéskor
    if (enemy && enemy.active) {
      const hp = enemy.getData('hp') ?? 1.0;
      const maxHp = enemy.getData('maxHp') ?? 1.0;
      const newHp = Math.max(0, hp - this.collisionDamage);
      enemy.setData('hp', newHp);
      // Árnyaljuk a színt a maradék HP arányában
      const ratio = Phaser.Math.Clamp(newHp / Math.max(0.001, maxHp), 0, 1);
      enemy.setTint(Phaser.Display.Color.GetColor(255, 120 + Math.floor(80 * (1 - ratio)), 120));
      if (newHp <= 0) {
        const boom = this.add.circle(enemy.x, enemy.y, 10, 0xfca5a5, 1).setDepth(60);
        this.tweens.add({ targets: boom, alpha: 0, scale: 2, duration: 220, onComplete: () => boom.destroy() });
        enemy.disableBody(true, true);
        const pts = enemy.getData('points') ?? 50;
        this.updateScore(this.state.score + pts);
      } else {
        // egy ütközés után is vegyük le, hogy ne okozzon azonnal többszörös sebzést
        enemy.disableBody(true, true);
      }
    }

    if (this.state.hits <= 0) {
      this.gameOver();
    }
  }

  updateHPUI() {
    const pct = (this.state.hits / this.state.maxHits) * 100;
    this.uiManager.updateHP(pct);
  }

  fadeSoundTo(sound, targetVolume, duration = 400, onComplete) {
    if (!sound) return;
    // külön tween nyilvántartás a két csatornához
    if (sound === this.music) { if (this.musicTween) this.musicTween.stop(); }
    if (sound === this.menuMusic) { if (this.menuMusicTween) this.menuMusicTween.stop(); }

    const v = Phaser.Math.Clamp(targetVolume, 0, 1);
    const tween = this.tweens.add({ targets: sound, volume: v, duration, ease: 'Sine.InOut', onComplete });

    if (sound === this.music) this.musicTween = tween;
    if (sound === this.menuMusic) this.menuMusicTween = tween;
  }
}
