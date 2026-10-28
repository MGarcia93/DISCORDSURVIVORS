# Solago: one base, consistent buck teeth

The approved identity is the short, narrow-shouldered bust with an oversized head, cropped spiky dark hair, dark crew tee and **two prominent front teeth**. `portrait-neutral.svg` is the editable source.

Reusable procedure for other characters: [`character-portraits`](../../../.opencode/skills/character-portraits/SKILL.md).

## Rebuild portraits

Requires Python 3 standard library only:

```sh
python3 tools/build_portraits.py \
  --recipe art/characters/solago/expressions.json \
  --out assets/narrative/portraits/solago
```

The command validates every expression before writing any output. `--help` documents its arguments. Invalid recipes and unknown options fail without changing existing generated portraits. Repeated builds produce identical SVGs.

## What stays fixed

Head shape, skin palette, hair, neck, tee and body proportions come from **one base SVG**. The base identifies three replaceable facial groups:

| Base group | Recipe override | Purpose |
| --- | --- | --- |
| `expression-brows` | `brows` | Brow position and attitude |
| `expression-eyes` | `eyes` | Open, narrowed or closed eyes |
| `expression-mouth` | `mouth` | Mouth shape |

The base mouth stays in every expression so the buck teeth never change size: only `disgusted` overrides it with the Excalibur-style clenched grimace (brows, eyes and mouth together).

The generated files repeat the complete SVG **as build output**, so the game can load ordinary images. Do not edit those copies: edit the source base or recipe and regenerate.

## Use in dialogue

The narrative catalog maps `solago` to the playable `solago` sprite and eight expressions. A conversation still needs only data:

```json
{ "speaker": "solago", "expression": "angry", "text": "¡NO SOY UNA CRIATURA, HIJO DE PUTA!" }
```

Available expression IDs: `neutral`, `happy`, `annoyed`, `angry`, `surprised`, `scared`, `tired`, `disgusted`. Omitting `expression` uses neutral. This does not change gameplay sprites, abilities or story text.

`angry` and `scared` support the Act 2 rescue scene; `disgusted` reuses the Act 4 reaction language; `happy` matches the Sonrisa Blindada gag. These are Solago's portrait assets only.

```sh
node --test tests/portrait-build.test.mjs
```

The tests check reproducible output, unchanged identity layers, valid catalog assets and unchanged files after rejected commands. Use the narrative viewer for visual review; tests do not approve artistic likeness.
