# Dodge! — Phaser 3 mini‑játék

Ez egy egyszerű, moduláris Phaser 3 alapú űr-ügyességi játék.

100% ChatGPT-vel készült!

Élő (telepített) változat: https://exphoenee.github.io/Hack-Code/

## Készítők / Kreditek
- Zene: Suno.ai
- Képek/Art: DALL‑E
- Kód: CODEX

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

## Menürendszer
- Választható nehézség: Könnyű / Normál / Nehéz
  - A nehézség egy leíró tömb alapján állítja a spawn gyakoriságokat, sebzésszorzót, invulnerabilitást és pontticket.
- Választható játékzene: 3 track közül
- Űrhajó kiválasztása: Warrior / Fighter előnézettel
  - Enter a „Start!” soron a játék indításához
  - Navigáció: ↑/↓ sor, ←/→ érték

## Nehézségek (röviden)
- Könnyű: ritkább ellenfelek/bónuszok, hosszabb sebezhetetlenség, magasabb alap sebzés
- Normál: kiegyensúlyozott beállítások
- Nehéz: sűrűbb spawn, rövidebb sebezhetetlenség, nagyobb játékos‑sebzés szorzó

## Űrhajók
- Warrior
  - Nagyobb test (kb. 48 px), közepes sebesség, 3 HP
- Fighter
  - Kisebb test (kb. 38 px), gyorsabb mozgás, 2 HP

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
