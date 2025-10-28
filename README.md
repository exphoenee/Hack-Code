# Dodge! — Phaser 3 mini‑játék

Ez egy egyszerű, moduláris Phaser 3 alapú űr-ügyességi játék.

100% ChatGPT-vel készült!

## Futtatás
- Nyisd meg az `index.html` fájlt egy böngészőben (ajánlott: Live Server / bármely statikus szerver).
- Internetkapcsolat szükséges a Phaser CDN betöltéséhez.

## Irányítás
- Mozgás: `A` / `D` vagy Bal/Jobb nyíl
- Lövés (alap): egérkattintás
- Power‑upok:
  - Beam: tartott sugár (töltetes, időzített)
  - Rockets: hármas rakétasorozat (először ez fogy, ha van)
- Szünet: `P`
- Folytatás: `Space` vagy `ESC`

## Játékmenet
- Kerüld az ellenségeket, lődd őket vagy vedd fel a power‑upokat.
- A HP három találatot bír, a zöld kocka (HP) gyógyít.
- Pontozás: ellenség típusa szerint; bónusz felvételekor a leíró szerinti pont jár.
- A rekord (high score) a böngésző `localStorage`‑ában tárolódik.

## Mappa‑felépítés
- `index.html` – belépési pont, Phaser betöltés.
- `src/` – ES modulok:
  - `MainScene.js` – fő jelenet és játéklogika
  - `PlayerController.js` – játékos vezérlése
  - `Enemy.js` – ellenségek spawner + mozgás
  - `BonusManager.js` – bónuszok/power‑upok spawner
  - `Starfield.js` – parallax csillagmező
  - `TextureFactory.js` – generált textúrák (fallback/ikonok)
  - `storage.js` – high score mentés/betöltés
  - `constants.js` – képernyő méretek, kulcsok
- `assets/` – képek, hangok, videók

## Megjegyzések
- A projekt a Phaser 3.55.2 CDN‑t használja.
- A kód ES modulokra bontott; szerkesztéshez bármely statikus szerver ajánlott.

Jó játékot!
