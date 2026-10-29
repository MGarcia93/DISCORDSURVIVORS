# Jhony: NPC sprite and cinematic portraits

Jhony is an NPC, not a playable character. The approved design is draft 03:
long swept-back hair, clear rectangular glasses, a pointed beard, a torn black
leather jacket with red lining, a white tank top, dark jeans and blood splashes.
It uses the existing cast's 46px grid and shared pixel painter.

## Preview in the game

1. Serve the repository: `python3 -m http.server 5173 --bind 127.0.0.1`.
2. Open `http://localhost:5173/?dev=worlds`.
3. Select **Jhony** under **Actor** and a world such as **Zomboid**.
4. Walk with WASD or the arrow keys. This viewer saves no progression.

The renderer lives in `src/npcs/jhony.mjs`. The stage cast adds him separately
from the playable roster; no stats, abilities or unlocks are assigned.
The design comparison is available at `art/characters/jhony/sprite-preview.html`;
`sprite-preview-v3.png` records the approved appearance.

## Cinematic portraits

`portrait-neutral.svg` is the sole editable base on the shared 160×200 grid.
The approved identity keeps long loose hair, clear rectangular glasses, a pointed
beard and exactly one lip hoop on the **viewer's left**. There is no ear or nose
jewelry. Only brows, eyes and mouth change between expressions.

Rebuild from the recipe; never edit generated assets:

```sh
python3 tools/build_portraits.py --recipe art/characters/jhony/expressions.json --out assets/narrative/portraits/jhony
```

Available expressions: `neutral`, `happy`, `annoyed`, `angry`, `surprised`,
`scared`, `tired`, `disgusted`. See `expression-preview.html` or
`expression-sheet.png` for the complete set. `annoyed` and `angry` support his
quick temper, while `neutral` conveys his comfort in Project Zomboid.

The narrative catalog registers speaker and sprite id `jhony`. Dialogue omitting
`expression` uses `neutral`; the cinematic presenter also draws his NPC sprite:

```json
{ "speaker": "jhony", "expression": "annoyed", "text": "Example line." }
```

This makes Jhony available to scene authors without adding him to the playable
roster or unlock chain. Act 1 scene writing and gameplay bindings remain separate.

## Checks

```sh
node --test tests/jhony.test.mjs
node --test tests/jhony-portraits.test.mjs tests/portrait-build.test.mjs
node --test tests/*.test.mjs
```
