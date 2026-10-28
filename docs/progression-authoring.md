# Progression authoring

Status: the shared permanent-stat calculation is available as a standalone
module. The current game shop and combat have not been migrated yet. XP,
catalogs and character upgrade paths are tracked in
[`../odd/tasks/item-level-progression.md`](../odd/tasks/item-level-progression.md).

## Stat modifiers

Use stat points or relative percentages, never engine pixels, mitigation
fractions or firing intervals:

```js
const modifiers = [
  { stat: 'attack', operation: 'flat', value: 2 },
  { stat: 'attack', operation: 'percent', value: 10 },
];
```

Supported stats are `life`, `defense`, `attack`, `attackDistance`,
`attackSpeed` and `moveSpeed`. An attack-speed bonus increases attacks per
second; the resolver converts it to an interval internally. Defense points
use the existing conversion and mitigation cap from `src/stats.mjs`.

Permanent modifiers use `(base + sum of points) * (1 + sum of percentages / 100)`.
For base attack 10, +2 points and two +10% bonuses produce 14.4 damage,
independent of acquisition order.

## Keep each source independent

```js
import {
  createStatState, withStatSource, previewStatSource, applyStatState,
} from '../src/stat-modifiers.mjs';

const initial = createStatState(run.player);
const preview = previewStatSource(initial, 'item:example:1', modifiers);
const acquired = withStatSource(initial, 'item:example:1', modifiers);
applyStatState(run.player, acquired);
```

Capture the base once before permanent modifiers are applied, then retain the
returned snapshot. Snapshots copy and freeze their modifier data. Reusing a
source ID replaces its contribution rather than adding it twice. Passing
`null` removes that source. Previewing does not change the state or player.

Applying a permanent maximum-life increase grants its effective delta once:
60/100 plus 20 becomes 80/120. Reapplying the same snapshot does not heal again.
Reductions only clamp excess current life: 60/100 minus 20 becomes 60/80;
90/100 becomes 80/80. Do not use this acquisition API to implement temporary
maximum-life buffs; their lifecycle policy remains undecided.

Unknown stats or operations, non-finite values and invalid resulting stats
fail before a new snapshot is returned. Life and attack speed must remain
positive; other finite stats must remain nonnegative. Existing unlimited
reach is preserved without modifiers, but modifying it is explicitly rejected
until its gameplay rule is defined. Conversion rounding is not added here.

## Checks

```sh
node --test tests/stat-modifiers.test.mjs
node --test tests/*.test.mjs
node --check src/stat-modifiers.mjs
```
