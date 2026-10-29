---
name: act-authoring
description: "Trigger: new act, nuevo acto, nuevo mundo, add a world, act 2, enemies for an act. Build one campaign act end to end, enemies first."
license: Apache-2.0
metadata:
  author: "MGarcia93"
  version: "1.0"
---

# Act Authoring

## Activation Contract

Load when adding or finishing a campaign act: a world that runs as one playthrough of six waves with its own boss, cinematics and unlock. A single enemy is out of scope; `enemy-authoring` owns that.

## Hard Rules

- The act is data: `src/campaign/act-0N-<world>.mjs`, registered in `src/campaign/acts.mjs`. Nothing outside `src/campaign/` may name an act, a wave count or the boss wave; `tests/campaign.test.mjs` enforces it.
- **Enemies come first.** A wave row that names a kind which does not exist is a broken act, and the act script decides which kinds it needs.
- The world must already exist in `src/backgrounds/`. Act worlds are top-down maps, never a lateral backdrop.
- The boss closes the last wave (`boss.wave === waves.length`). A boss slower than the player must declare ranged `actions` with a `range`: contact-only abilities never fire against a kiting player.
- Read the act script in `context/historia/` before writing a line. Dialogue is verbatim; the suite compares every act line against the script.
- `negro` only when a character addresses Maxi Negro. The plural is `zombies`.
- Cinematics live in `assets/narrative/acts/<act>/manifest.json`, declared through `act.narrative`. A scene missing from a manifest does not exist; one listed there appears in `?dev=narrative` for free.
- Never write or run tests for a new enemy before the user approves how it looks.

## Decision Gates

| Situation | Action |
| --- | --- |
| Kind missing from `src/enemies/` | Author it with `enemy-authoring`, visual approval first |
| Boss or mini-boss | `boss: true` on the ficha, `boss.wave` last, cast-detail sprite |
| Slower than the player | Ranged `actions` with `range`, not contact |
| Wave rows | One per wave; `mix` shares one roll, `life` declared for every kind |
| Scene beat | Blocking scene at a wave boundary; `banter` for lines that must not stop combat |
| Character unlock | Ask first: the guide says encounter, `progression.mjs` still unlocks by victory |

## Execution Steps

Run from the repository root.

1. Read the act script and `docs/campaign.md`. List the enemies, mini-boss, boss and cinematics it asks for.
2. Author the missing enemies: common kinds first, then the mini-boss, then the boss. Approve each look with the user before its tests.
3. Create `src/campaign/act-0N-<world>.mjs` with `duration`, `world`, `narrative`, `waves` and `boss`. Register it in `ACTS`; the validator runs on load.
4. Wire the cinematics under `assets/narrative/acts/<act>/`. Stage its enemies with `stage.actors` (`enemy`, `state: "dead"`), `flash`, `down`, `delay` and paced moves (`toward` + `speed`).
5. Play it: `?dev=enemies` per kind, `?dev=narrative` per scene, then a full run. Localhost plays 15-second waves; `?waves=60` shows the real pacing.
6. Run `node --test tests/*.test.mjs`. The act contract is `tests/campaign.test.mjs` plus the shipped act's `tests/narrative-act1.test.mjs`.

## Output Contract

Return the act id, its world, the enemies authored, the wave table, the boss and its actions, the cinematics with their bindings, files touched, and every check with its observed result. Never report an act as done with a missing kind, a failed check or a scene absent from the viewer.

## References

- `docs/campaign.md` — act shape, validator, wave length
- `docs/narrative-authoring.md` — steps, staging, act manifests, banter
- `references/act-plan.md` — the roster each act still needs, taken from the scripts
- `.opencode/skills/enemy-authoring/SKILL.md` — one enemy end to end
