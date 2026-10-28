# Papazito: one base, reusable expressions

The approved identity is the broad, round-faced bust with very full cheeks, short black hair, a dark tee and an **orange construction vest with reflective strips** over it — the "paraguayo trucho" running gag. `portrait-neutral.svg` is the editable source.

Reusable procedure for other characters: [`character-portraits`](../../../.opencode/skills/character-portraits/SKILL.md).

## Rebuild portraits

Requires Python 3 standard library only:

```sh
python3 tools/build_portraits.py \
  --recipe art/characters/papazito/expressions.json \
  --out assets/narrative/portraits/papazito
```

The command validates every expression before writing any output. `--help` documents its arguments. Invalid recipes and unknown options fail without changing existing generated portraits. Repeated builds produce identical SVGs.

## What stays fixed

Head shape, skin palette, hair, ears, neck, tee, vest and reflective strips come from **one base SVG**. The base identifies three replaceable facial groups:

| Base group | Recipe override | Purpose |
| --- | --- | --- |
| `expression-brows` | `brows` | Brow position and attitude |
| `expression-eyes` | `eyes` | Open, narrowed or closed eyes |
| `expression-mouth` | `mouth` | Mouth shape |

The reflective strips and the vest panels are identity layers: they never change between expressions. Nobody else in the cast wears them.

## Use in dialogue

The narrative catalog maps `papasito` to the playable `papazito` sprite and eight expressions. A conversation still needs only data:

```json
{ "speaker": "papasito", "expression": "scared", "text": "¡ANAMENCUÁ!" }
```

Available expression IDs: `neutral`, `happy`, `annoyed`, `angry`, `surprised`, `scared`, `tired`, `disgusted`. Omitting `expression` uses neutral. This does not change gameplay sprites, abilities or story text.

`scared` covers the extortion-notification panic, `angry` the "¡ME RE CAGARON!" state and `disgusted` reuses the Act 4 Excalibur-style grimace. Papazito never uses Solago's oversized paletas: his teeth stay a thin strip.

```sh
node --test tests/portrait-build.test.mjs
```

The tests check reproducible output, unchanged identity layers, valid catalog assets and unchanged files after rejected commands. Use the narrative viewer for visual review; tests do not approve artistic likeness.
