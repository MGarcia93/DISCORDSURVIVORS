# Warrior: one base, reusable expressions

The approved identity is the gym-bro bust from the 80s reference: a red headband over short dark hair, bloodshot eyes (pinkish whites with red veins), a long nose, full lips, light stubble and a hint of double chin, wearing an open colour-blocked windbreaker (teal, violet, pink) over a white tank top. `portrait-neutral.svg` is the editable source.

Reusable procedure for other characters: [`character-portraits`](../../../.opencode/skills/character-portraits/SKILL.md).

## Rebuild portraits

Requires Python 3 standard library only:

```sh
python3 tools/build_portraits.py \
  --recipe art/characters/warrior/expressions.json \
  --out assets/narrative/portraits/warrior
```

The command validates every expression before writing any output. `--help` documents its arguments. Invalid recipes and unknown options fail without changing existing generated portraits. Repeated builds produce identical SVGs.

## What stays fixed

Head shape, skin palette, hair, headband, ears, neck, windbreaker and tank top come from **one base SVG**. The base identifies three replaceable facial groups:

| Base group | Recipe override | Purpose |
| --- | --- | --- |
| `expression-brows` | `brows` | Brow position and attitude |
| `expression-eyes` | `eyes` | Open, narrowed or closed eyes |
| `expression-mouth` | `mouth` | Mouth shape |

The generated files repeat the complete SVG **as build output**, so the game can load ordinary images. Do not edit those copies: edit the source base or recipe and regenerate.

## Use in dialogue

The narrative catalog maps `warrior` to the playable `warrior` sprite and eight expressions. A conversation still needs only data:

```json
{ "speaker": "warrior", "expression": "annoyed", "text": "¿Qué humo?" }
```

Available expression IDs: `neutral`, `happy`, `annoyed`, `angry`, `surprised`, `scared`, `tired`, `disgusted`. Omitting `expression` uses neutral. This does not change gameplay sprites, abilities or story text.

`happy` covers the "Yo soy argentino, boludo" lines, `surprised` the Viaje Astral reaction and `disgusted` reuses the Act 4 Excalibur-style grimace shared with El Negro's gag.

```sh
node --test tests/portrait-build.test.mjs
```

The tests check reproducible output, unchanged identity layers, valid catalog assets and unchanged files after rejected commands. Use the narrative viewer for visual review; tests do not approve artistic likeness.
