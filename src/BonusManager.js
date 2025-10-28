import { GAME_W, GAME_H } from './constants.js';

export default class BonusManager {
  constructor(scene) {
    this.scene = scene;
    this._group = null;
    // Leírók: mit okoz, mennyi pont jár érte és milyen gyakran spawnol
    this.types = [
      // size: megjelenített cél-szélesség px-ben
      // colliderRatio: ütközőkör sugár aránya a textúra kisebbik oldalához képest (0..1)
      // weight: relatív súly (gyakoriság); nagyobb = gyakoribb
      { key: 'hp',      kind: 'heal',   heal: 1, points: 150, size: 45, colliderRatio: 0.4, weight: 6 },
      { key: 'beam',    kind: 'beam',   charges: 3, points: 0,   size: 45, colliderRatio: 0.4, weight: 4 },
      { key: 'rocketPU',kind: 'rocket', charges: 3, points: 0,   size: 50, colliderRatio: 0.4, weight: 3 }
    ];
  }

  createGroup() {
    this._group = this.scene.physics.add.group();
  }

  get group() { return this._group; }

  spawn(difficulty) {
    if (!this._group) this.createGroup();
    const x = Phaser.Math.Between(28, GAME_W - 28);
    const y = -20;
    // Súlyozott választás a leírók között
    let total = 0;
    for (const t of this.types) total += (t.weight ?? 1);
    let r = Math.random() * (total || 1);
    let type = this.types[0];
    for (const t of this.types) {
      r -= (t.weight ?? 1);
      if (r <= 0) { type = t; break; }
    }
    const bonus = this._group.get(x, y, type.key);
    if (!bonus) return;
    bonus.setActive(true).setVisible(true);
    bonus.body.enable = true;
    bonus.setPosition(x, y);
    // Biztosítsuk, hogy a helyes textúra legyen beállítva újrafelhasznált sprite esetén is
    if (bonus.texture?.key !== type.key) {
      bonus.setTexture(type.key);
    }
    // Skálázás a leíró szerinti cél-szélességre
    const targetW = (type.size ?? 32);
    if (bonus.width > 0) {
      const scale = targetW / bonus.width;
      bonus.setScale(scale);
    }
    // Kör ütköző a textúra mérete és a leíró alapján
    if (bonus.body) {
      const texW = bonus.width;
      const texH = bonus.height;
      const ratio = (type.colliderRatio ?? 0.45);
      const r = Math.floor(Math.min(texW, texH) * ratio);
      if (bonus.setCircle) bonus.setCircle(r, (texW / 2) - r, (texH / 2) - r);
    }
    bonus.setVelocity(0, 120 + difficulty * 30);
    bonus.setAngularVelocity(Phaser.Math.Between(-60, 60));
    bonus.checkWorldBounds = true;
    bonus.outOfBoundsKill = true;
    // Leíró adatok a sprite-hoz
    bonus.setData('kind', type.kind);
    if (type.points !== undefined) bonus.setData('points', type.points);
    if (type.heal !== undefined) bonus.setData('heal', type.heal);
    if (type.charges !== undefined) bonus.setData('charges', type.charges);
  }

  clearAll() {
    if (this._group) this._group.clear(true, true);
  }

  cleanupOffscreen() {
    if (!this._group) return;
    this._group.children.each(obj => {
      if (obj.active && obj.y > GAME_H + 40) obj.disableBody(true, true);
    });
  }
}
