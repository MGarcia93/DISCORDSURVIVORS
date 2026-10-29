---
name: enemy-authoring
description: "Trigger: new enemy, enemigo nuevo, add a zombie, enemy sprite, minijefe. Author one enemy end to end with visual approval before tests."
license: Apache-2.0
metadata:
  author: "MGarcia93"
  version: "1.0"
---

# Enemy Authoring

## Activation Contract

Load when adding, reskinning or retuning an enemy, and when designing an act's boss or mini-boss. Playable characters live in `src/characters/` and are out of scope.

## Hard Rules

- One file per enemy: `src/enemies/<kind>.mjs`, registered in `src/enemies/index.mjs`. Never several kinds in one file.
- Author all six stats as percentages of `BASE_STATS`: life, defense, attack, attackSpeed, attackDistance, moveSpeed. `radius` and `bounty` stay outside the sheet.
- Ask first whether it carries a rule of its own. If yes, stop: that is engine work, not data authoring.
- An enemy missing its `src/waves.mjs` row or its `BALANCE.xp` / `BALANCE.gold` reward entry does not exist: it never spawns properly and pays bounty only.
- Regular enemies use the budget style: closed ink contour, four stepped tones, ~30 rectangles, cast scale 2. Bosses and mini-bosses get cast detail, 60-90 rectangles.
- No common enemy renders taller than the player, and its sprite flood-fills as one connected figure.
- Visual approval comes first: never write or run tests until the user approved how it looks.

## Decision Gates

| Situation | Action |
| --- | --- |
| Needs a new behaviour | Stop: scope it as engine work and record it in the contract before coding |
| Boss or mini-boss | Cast-level detail; special attacks come from the reusable pattern catalogue |
| Only numbers change | Edit the sheet only, no drawing work |
| Wave placement | Add it to the row's `mix` and declare its `life`, as the act script asks |

## Execution Steps

Run from the repository root.

1. Read `context/discord_survivors_enemigos.md` and the act script in `context/historia/`. Confirm role and wave.
2. Ask whether it carries a specific behaviour, then stop if the answer is yes.
3. Create `src/enemies/<kind>.mjs` from `src/enemies/zombie.mjs`: sheet, radius, bounty, `draw`. Register it in `ENEMY_KINDS` and `ENEMY_IDS`.
4. Add its `mix` weight and `life` override to `src/waves.mjs`, and its `xp` / `gold` entries to `src/reward-data.mjs`.
5. Draw it in `src/sprites.mjs` with the budget style. Confirm the silhouette is connected and under the player's height.
6. Serve `python3 -m http.server 5173 --bind 127.0.0.1` and open `?dev=enemies`: pick the kind, set the wave, watch it walk, stop at its reach and swing. Magnify true game pixels before judging detail.
7. Show the user the result and wait for explicit approval.
8. Only after approval: `node --test tests/*.test.mjs`, with sheet assertions in `tests/enemy-table.test.mjs`, wave assertions in `tests/waves.test.mjs` and silhouette guards in `tests/sprite.test.mjs`.
9. If a rule changed, update `context/discord_survivors_enemigos.md`.

## Output Contract

Return the kind id, the resolved sheet, wave placement, reward entries, files touched, the sandbox URL for review, and every check with its observed result. Never report an enemy as done while visual approval or a required check is pending.

## References

- `context/discord_survivors_enemigos.md` — the authoring contract
- `src/enemies/zombie.mjs` — the template ficha
- `src/sprites.mjs` — `torsoBands` and the budget style
- `tests/sprite.test.mjs` — the silhouette guards to extend
