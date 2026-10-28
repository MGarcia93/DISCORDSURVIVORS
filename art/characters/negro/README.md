# El Negro: one base, reusable expressions

The approved identity is the sprite-aligned bust with a yellow hoodie, tied dark hair and **ordinary clear-lens glasses**. `portrait-neutral-v2.svg` is the editable source; the first proposal is retained separately. The neutral base is approved and so is the current expression set.

Reusable procedure for other characters: [`character-portraits`](../../../.opencode/skills/character-portraits/SKILL.md).

## Rebuild portraits

Requires Python 3 standard library only:

```sh
python3 tools/build_portraits.py \
  --recipe art/characters/negro/expressions.json \
  --out assets/narrative/portraits/negro
```

The command validates every expression before writing any output. `--help` documents its arguments. Invalid recipes and unknown options fail without changing existing generated portraits. Repeated builds produce identical SVGs.

## What stays fixed

Head shape, skin palette, hair, nose, facial hair, piercings, transparent glasses, clothing and body proportions come from **one base SVG**, not individually redrawn portraits.

The base identifies three replaceable facial groups:

| Base group | Recipe override | Purpose |
| --- | --- | --- |
| `expression-brows` | `brows` | Brow position and attitude |
| `expression-eyes` | `eyes` | Open, narrowed or closed eyes |
| `expression-mouth` | `mouth` | Mouth shape |

`expressions.json` changes only those groups using colored integer-grid paths. Omitted groups inherit the neutral base. Each shape has `fill` (six-digit hex color) and `d` (integer SVG line commands); each replaced group accepts 1–32 shapes. `neutral: {}` preserves the original expression.

The generated files repeat the complete SVG **as build output**, so the game can load ordinary images. Do not edit those copies: edit the source base or recipe and regenerate. The generator can use another character's base/recipe later without changing its implementation; the skill will document the process only after the character is fully approved.

## Use in dialogue

The existing narrative catalog maps `maxi-negro` to the playable `negro` sprite and the five portrait expressions. A conversation still needs only data:

```json
{ "speaker": "maxi-negro", "expression": "annoyed", "text": "Example dialogue." }
```

Available expression IDs: `neutral`, `happy`, `annoyed`, `surprised`, `tired`, `disgusted`, `disgusted-strong`. Omitting `expression` uses neutral. This does not change gameplay sprites, abilities or story text.

The disgust variants follow the user-supplied Soul Eater frame: heavy lowered eyelids, pinched brows, small nose creases and a wide grimace of clenched teeth, with the whole mouth pulled slightly toward the character's right (screen left). The stronger version opens the mouth wider and exaggerates the brow pinch. They support Act 4's initial collective reaction and its stronger repetition. These are El Negro's portrait assets only; the four-character synchronized scene and the Administrator's later reaction are not implemented by this asset recipe.

```sh
node --test tests/portrait-build.test.mjs
```

The tests check reproducible output, unchanged identity layers, valid catalog assets and unchanged files after rejected commands. Use the narrative viewer for visual review; tests do not approve artistic likeness.
