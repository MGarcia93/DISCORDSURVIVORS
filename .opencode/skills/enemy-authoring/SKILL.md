---
name: enemy-authoring
description: "Trigger: new enemy, enemigo nuevo, add a zombie, enemy sprite, minijefe. Author one enemy end to end with visual approval before tests."
license: Apache-2.0
metadata:
  author: "MGarcia93"
  version: "2.0"
---

# Enemy Authoring

## Activation Contract

Load when adding, reskinning or retuning an enemy, and when designing an act's boss or mini-boss. Playable characters live in `src/characters/` and are out of scope.

## Hard Rules

- One file per enemy: `src/enemies/<kind>.mjs`, registered in `src/enemies/index.mjs`. Never several kinds in one file.
- The id is the enemy's name, never a role: `alarmZombie`, not `boss`. The role is a flag on the ficha, `boss: true`.
- Author all six stats as percentages of `BASE_STATS`: life, defense, attack, attackSpeed, attackDistance, moveSpeed. `radius` and `bounty` stay outside the sheet.
- Ask first whether it carries a rule of its own. If it does, its abilities live **in its own ficha** as `actions` (key, `chance`, `cooldown`, effect). The engine owns one selector that rolls among them; **nothing is inherited between enemies**.
- An enemy missing its `src/waves.mjs` row or its `BALANCE.xp` / `BALANCE.gold` entry does not exist: it never spawns properly and pays bounty only. A boss closes a wave through `BALANCE.waves.bossKind`.
- Regular enemies use the budget style: ~30 rectangles, cast scale 2. Bosses and mini-bosses carry the cast's detail: 120-240 rectangles.
- Every mass is rounded with `roundedMass`. A hard-cornered box reads as a placeholder next to the cast.
- No common enemy renders taller than the player, and its sprite flood-fills as one connected figure.
- Visual approval comes first: never write or run tests until the user approved how it looks.

## Decision Gates

| Situation | Action |
| --- | --- |
| Carries a rule of its own | Declare `actions` in its ficha; abilities get `ctx.spawnEnemy` and `ctx.shockwave` |
| Boss or mini-boss | Cast detail, `boss: true`, and `BALANCE.waves.bossKind` points at it |
| Only numbers change | Edit the sheet only, no drawing work |
| Wave placement | Add it to the row's `mix` and declare its `life`, as the act script asks |

## Execution Steps

Run from the repository root.

1. Read `context/discord_survivors_enemigos.md` and the act script in `context/historia/`. Confirm role, wave and which abilities it declares.
2. Ask whether it carries a specific behaviour.
3. Create `src/enemies/<kind>.mjs` from `src/enemies/zombie.mjs`: sheet, radius, bounty, `draw`, and `actions` when it has them. Register it in `ENEMY_KINDS` and `ENEMY_IDS`.
4. Add its `mix` weight and `life` override to `src/waves.mjs`, its `xp` / `gold` entries to `src/reward-data.mjs`, and point `BALANCE.waves.bossKind` at it when it closes a wave.
5. Draw it in `src/sprites.mjs` at the density its level asks for, rounding every mass with `roundedMass`. Confirm the silhouette is connected and under the player's height.
6. Serve `python3 -m http.server 5173 --bind 127.0.0.1` and open `?dev=enemies`: pick the kind and wave, watch it walk, stop and act. A boss spawns alone and needs ~11 s to reach the dummy, so wait before judging its abilities. Magnify true game pixels for detail.
7. Show the user the result and wait for explicit approval.
8. Only after approval: `node --test tests/*.test.mjs` — sheet in `tests/enemy-table.test.mjs`, waves in `tests/waves.test.mjs`, actions in `tests/enemy-behavior.test.mjs`, silhouettes in `tests/sprite.test.mjs`.
9. If a rule changed, update `context/discord_survivors_enemigos.md`.

## Output Contract

Return the kind id, the resolved sheet, wave placement, reward entries, the actions it declares, files touched, the sandbox URL for review, and every check with its observed result. Never report an enemy as done while visual approval or a required check is pending.

## References

- `context/discord_survivors_enemigos.md` — the authoring contract
- `src/enemies/zombie.mjs` — the plain template ficha
- `src/enemies/alarm-zombie.mjs` — the boss template, with `actions`
- `src/sprites.mjs` — `torsoBands`, `roundedMass` and both densities
- `tests/sprite.test.mjs` — the silhouette guards to extend
