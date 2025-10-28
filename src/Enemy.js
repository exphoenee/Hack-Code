export default class Enemy {
  constructor(scene) {
    this.scene = scene;
    this._group = null;
    // Enemy leírók: sprite kulcs, max HP és méret-szorzó a player szélességéhez viszonyítva
    // Pontszámok a HP arányában (alap 50 pont / 1 HP)
    this.types = [
      // amp: pixeles amplitúdó, freq: Hz (ciklus / másodperc), colliderRatio: ütközőkör sugár aránya (0..1)
      { key: 'enemy1', maxHp: 1.0,  size: 0.90, points: 50,  playerDamage: 1, amp: 45, freq: 0.3, colliderRatio: 0.46 },   // kicsi
      { key: 'enemy2', maxHp: 2.0,  size: 1.35, points: 100, playerDamage: 2, amp: 3,  freq: 0.5, colliderRatio: 0.48 },   // nagy
      { key: 'enemy3', maxHp: 1.5,  size: 1.15, points: 75,  playerDamage: 1, amp: 15, freq: 0.6, colliderRatio: 0.47 },   // közepes
    ];
  }

  createGroup() {
    this._group = this.scene.physics.add.group({ immovable: true });
  }

  get group() { return this._group; }

  spawn(difficulty) {
    if (!this._group) this.createGroup();
    const x = Phaser.Math.Between(24, this.scene.scale.width - 24);
    const y = -30;
    const type = Phaser.Math.RND.pick(this.types);
    const enemy = this._group.get(x, y, type.key);
    if (!enemy) return;
    enemy.setActive(true).setVisible(true);
    enemy.body.enable = true;
    enemy.setPosition(x, y);
    enemy.setTexture(type.key);

    // Méretezés a player szélességéhez képest
    const baseW = (this.scene.playerController?.sprite?.displayWidth) || 48;
    if (enemy.width > 0) {
      const targetW = baseW * type.size;
      const scale = targetW / enemy.width;
      enemy.setScale(scale);
    }
    // Kör ütköző a textúra (nem skálázott) méret alapján – Arcade Physics offsetek textúra-térben értelmezettek
    if (enemy.body) {
      const texW = enemy.width;
      const texH = enemy.height;
      const ratio = type.colliderRatio ?? 0.45;
      const r = Math.floor(Math.min(texW, texH) * ratio);
      if (enemy.setCircle) enemy.setCircle(r, (texW / 2) - r, (texH / 2) - r);
    }
    // Mozgás és forgás tiltás
    enemy.setVelocity(0, 160 + (difficulty * 40));
    if (enemy.setAngularVelocity) enemy.setAngularVelocity(0);
    if (enemy.body) enemy.body.allowRotation = false;
    if (enemy.setAngle) enemy.setAngle(0);

    enemy.checkWorldBounds = true;
    enemy.outOfBoundsKill = true;
    enemy.setData('maxHp', type.maxHp);
    enemy.setData('hp', type.maxHp);
    enemy.setData('points', type.points ?? Math.round(50 * type.maxHp));
    enemy.setData('playerDamage', type.playerDamage ?? Math.max(1, Math.round(type.maxHp)));
    // Szines mozgás paraméterek
    enemy.setData('baseX', x);
    enemy.setData('amp', type.amp ?? 0);
    enemy.setData('freq', type.freq ?? 0);
    enemy.setData('spawnAt', this.scene.time?.now ?? performance.now());
    enemy.clearTint();
  }

  clearAll() {
    if (this._group) this._group.clear(true, true);
  }

  cleanupOffscreen() {
    if (!this._group) return;
    this._group.children.each(obj => {
      if (obj.active && obj.y > this.scene.scale.height + 40) obj.disableBody(true, true);
    });
  }

  update(time, delta) {
    if (!this._group) return;
    const tNow = (typeof time === 'number') ? time : (this.scene.time?.now ?? performance.now());
    const width = this.scene.scale.width;
    this._group.children.each(obj => {
      if (!obj.active) return;
      const baseX = obj.getData('baseX');
      const amp = obj.getData('amp') || 0;
      const freq = obj.getData('freq') || 0;
      const spawnAt = obj.getData('spawnAt') || tNow;
      if (!baseX || !amp || !freq) return;
      const elapsed = (tNow - spawnAt) / 1000;
      const offset = amp * Math.sin(2 * Math.PI * freq + elapsed * 2 * Math.PI * freq);
      let nx = baseX + offset;
      // maradjon képernyőn belül
      const r = Math.min(obj.displayWidth || obj.width || 40, obj.displayHeight || obj.height || 40) / 2;
      const minX = r + 2, maxX = width - r - 2;
      if (nx < minX) nx = minX; else if (nx > maxX) nx = maxX;
      obj.setX(nx);
    });
  }
}
