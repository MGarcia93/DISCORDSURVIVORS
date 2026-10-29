# Papafrita: cinematic portraits and a casual NPC sprite

Papafrita is not playable. His approved cinematic portraits wear red insect
armour and a creature above his uncovered face. His separate stage sprite wears
the photo outfit: a black tee, denim bermuda shorts and black/white-soled trainers.
The sprite has **no armour or creature hat**.

## Preview

Serve the repository, then open:

- `art/characters/papafrita/cinematic-preview.html` — actual cinematic presenter,
  with dialogue, splash, banter and all eight expressions; no progress is saved.
- `art/characters/papafrita/expression-preview.html` — expression contact sheet.
- `art/characters/papafrita/sprite-preview.html` — approved casual sprite comparison.

The narrative speaker and sprite id is `papafrita`. The sprite is available for
optional staging but no story scene, gameplay binding, roster entry, stats or
unlock is added. Existing world-viewer cast slots are unchanged.

```json
{ "speaker": "papafrita", "expression": "happy", "text": "Example line." }
```

## Rebuild portraits

```sh
python3 tools/build_portraits.py --recipe art/characters/papafrita/expressions.json --out assets/narrative/portraits/papafrita
```

Keep `portrait-neutral.svg` as the only base. Only brows, eyes and mouth vary.
The approved extended frame is `-12 -38 184 238`; catalog field
`"portraitLayout": "extended"` preserves its pixel scale and bottom alignment
beside the standard 160×200 cast instead of shrinking the face to fit the hat.

## Checks

```sh
node --test tests/papafrita.test.mjs
node --test tests/*.test.mjs
```
