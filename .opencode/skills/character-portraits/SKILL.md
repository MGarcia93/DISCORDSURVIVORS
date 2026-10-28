---
name: character-portraits
description: "Trigger: new character portrait, facial expressions, pixel art face, retrato de personaje, expresiones. Build reusable portrait sets from one layered base."
license: Apache-2.0
metadata:
  author: "MGarcia93"
  version: "1.0"
---

# Character Portraits

## Activation Contract

Load when adding a dialogue portrait, adding or changing a facial expression, or fixing specific pixels of an existing portrait in this repo. Gameplay sprites are out of scope.

## Hard Rules

- Keep exactly one editable base SVG per character; expressions change only `expression-brows`, `expression-eyes`, `expression-mouth`.
- Never edit files under `assets/narrative/portraits/`: they are build output.
- Never write into another character's output directory.
- Path data uses integer pixel commands only: `fill` six-digit hex, `d` limited to `M L H V Z` and lowercase `h v z`.
- Keep the approved identity fixed: head shape, hair, ear, facial hair, piercings, clear-lens glasses, hoodie and proportions.
- When the reference is a link that does not show the intended face, ask for a direct screenshot instead of guessing.
- Show a rendered comparison and wait for explicit approval before adding more expressions or committing.

## Decision Gates

| Situation | Action |
| --- | --- |
| New character | Create the base SVG, then an empty `neutral` recipe; get the base approved before expressions |
| New expression | Add an override to the recipe only; never copy the portrait |
| A frozen shape blocks an expression (e.g. a static lip contour) | Move that shape inside its expression group in the base, then re-add it to every override that relied on it |
| Only the position is wrong | Shift that shape's absolute `M`/`L`/`H` x values; leave the rest untouched |

## Execution Steps

Run every command from the repository root.

1. Base: `art/characters/<name>/portrait-<variant>.svg`, `viewBox="0 0 160 200"`, `shape-rendering="crispEdges"`, one group per body part.
2. Recipe: `art/characters/<name>/expressions.json` with `name`, `base`, and `expressions` (must include `neutral`).
3. Build: `python3 tools/build_portraits.py --recipe art/characters/<name>/expressions.json --out assets/narrative/portraits/<name>`.
4. Register every expression in `assets/narrative/characters.json`; dialogue omitting `expression` uses neutral.
5. Render a contact sheet in Chromium against `http://localhost:5189/`, read the PNG back, and show it to the user.
6. After approval run `node --test tests/portrait-build.test.mjs` and `node --test tests/*.test.mjs`.

Dialogue usage stays data-only:

```json
{ "speaker": "maxi-negro", "expression": "disgusted", "text": "Example line." }
```

## Output Contract

Return the files created or changed, the expression ids added, the build result, the comparison image path, the test results, and what still needs user approval.

## References

Paths below are relative to this skill directory.

- `../../../art/characters/negro/README.md` — worked example, layer table, rebuild command
- `../../../docs/narrative-authoring.md` — scene and speaker contract
- `../../../tools/build_portraits.py` — builder, validation and `--help`
