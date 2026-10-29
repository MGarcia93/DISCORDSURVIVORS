# Progression authoring

Status: shared stats, kill XP, deferred level choices, the four-offer item
shop and initial character parameters are connected to the game. Remaining
character upgrade paths are tracked in
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

## Catalog entries

`createCatalog({ items, upgrades }, { characters, effects })` in
`src/reward-catalog.mjs` validates and freezes data-only entries. An item has
`id`, `name`, `lore`, `price`, `maxCopies`, and `modifiers` or supported `effects`.
An upgrade has `id`, `name`, `characters` (`all` or one registered character ID),
`minLevel`, `requires` and a nonempty `ranks` array. Each rank has its own
modifiers or effects. Prerequisites are `{ id, rank }` references; missing
entries, impossible ranks and cycles are rejected.

An effect references `{ type, value }`; its trusted registry entry provides
`validate(value)` and `describe(value)`. Actual effect execution is not part
of this catalog module. New mechanics still need a reusable implementation.

`selectLevelOptions(catalog, { character, level, ranks }, random)` draws one
eligible own upgrade and two common upgrades, or three common upgrades when
no own upgrade is eligible. It returns fewer when pools are insufficient,
without duplicate filler. The engine stores the drawn options, applies the
chosen rank once and offers an explicit continuation when the pool is empty;
`src/run-rewards.mjs` owns those steps and `src/game/overlays.mjs` renders them.
`describeReward` derives mechanical text from entry data.

## Initial data and tuning

Edit `src/reward-data.mjs` to add entries to `ITEMS` or `LEVEL_UPGRADES`.
`BALANCE` holds wave length (`waves.duration`, in seconds), which wave is the
boss (`waves.bossWave`), XP and gold rewards, survival income and shop size.
Waves currently last 15 seconds for playtesting; change that single number to
lengthen or shorten every wave. HUD labels, boss timing and wave endings all
read this configuration, so no other file needs editing. Initial
XP uses the approved `10 * currentLevel ** 2` curve and one XP per ordinary
kill. Gold, prices, item caps and upgrade magnitudes are provisional tuning,
not measured final balance. The first catalog includes all eight lore items.

The engine now pays gold from the run's configured enemy rewards and survival
bonus, independently of XP. Initial tuning is one coin per ordinary kill and
five per survived wave; explicit zero rewards remain zero. The legacy enemy
bounty and survival amounts are compatibility fallbacks only when omitted
from an explicitly supplied balance object.
Gallina has `enabled: false` until its provisional range effect is confirmed.

Character entries cover the parameters the game already owns: waifu and
Patrona duration, smoke duration and radius, mushroom blast radius, Negro's
regeneration threshold, chair pulse radius and waifu firing interval, Solago's
smile duration and cooldown, Patrona radius, Papazito's sale value and softened
sale penalties, and Negro's prerequisite-gated bounce chain. Each is consumed
by the real combat or sale code. Sale proceeds round down to whole coins.

New mechanics implemented as parameter-driven behavior:

| Effect | What it does | Where |
|---|---|---|
| `stillShield` | Standing still charges a shield (up to the effect value) that absorbs contact damage before health. | `src/engine.mjs` |
| `waifuPierce` | Modo Otaku shots continue to the next enemy after a hit, with the usual 15% falloff. | `src/engine.mjs` |
| `biteTargets` | Melee hits extra enemies in reach at 70% damage. | `src/engine.mjs` |
| `patronaFinal` | La Patrona deals a last burst, as a fraction of damage, when she leaves. | `src/characters/solago.mjs` |
| `confusionStacks` | Each mushroom blast applies one extra stack, still capped at three (bosses at one). | `src/engine.mjs` |
| `smokeBonus` | Splash (`spore`) damage rises against enemies breathing smoke. | `src/engine.mjs` |
| `brickPierce` | Bricks continue to the next enemy after a hit. | `src/engine.mjs` |
| `brickFragments` | A brick impact spawns that many radial fragments at 35% damage. | `src/engine.mjs` |

Still unimplemented, because their geometry or timing is not decided yet:
second bites, knockback, shielded counterattacks, extra mushroom projectiles,
spore zones, smoke trails, confusion propagation, fan shots,
next-attack-after-sale, panic extension and the seña activation burst.

## Run reward state

`src/run-rewards.mjs` provides the standalone acquisition state machine.
`initializeRewards(run, { catalog, balance })` captures base stats and initializes
XP, queued levels, owned items and ranks. Pass a catalog validated with the
supported effect registry. `awardXP` queues levels without stopping combat;
`beginRewards` resolves choices before generating shop offers. Choices use
each queued level's eligibility, not the highest level earned that wave.

`chooseLevelReward`, `skipEmptyChoice` and `buyItem` reject invalid or premature
actions without spending resources. Acquisitions retain independent stat and
effect sources. Shop purchases mark their existing offer sold without drawing
a replacement. `finishRewards` clears only the resolved boundary's offers;
it preserves XP, build and savings. Effect bonuses are accumulated as data;
combat consumes the initially supported bonuses. `createRun` initializes this
state automatically; kill settlement awards XP once and normal wave endings
prepare choices before the shop. The narrative director refuses a before-wave
scene while choices remain. Final victory discards pending choices without
opening a shop, while preserving the existing victory event.

Item portraits are pixel art drawn in `src/game/item-icons.mjs`, not image
assets: each id has a 32×32 drawing that scales to its card canvas. A new item
id needs one drawing there; until it exists the card shows a neutral crate
instead of a blank space, so catalog authoring never breaks the shop.

The four-offer shop replaces the legacy upgrade list in the interface: each
offer shows its lore, mechanical effect, real capped stat preview, price and
owned/maximum count. A bought offer stays visible and disabled; rendering never
draws a replacement or rerolls. When nothing is eligible the shop shows that
message and the next-wave button stays available. The healing service remains a
separate, labelled purchase and cannot bypass pending choices.

The exported legacy `chooseUpgrade` callback API remains compatible for
callers and tests but is no longer reachable from the interface. Its actual
stat changes are normalized into independent point sources, so later
item/level recalculations do not erase them. New catalog entries must use
modifiers/effect references, not legacy callbacks. Catalog IDs are author data:
counts and ranks use `Object.hasOwn`, so IDs such as `constructor` or
`toString` never resolve to inherited properties.

## Checks

```sh
node --test tests/stat-modifiers.test.mjs
node --test tests/reward-catalog.test.mjs
node --test tests/reward-data.test.mjs
node --test tests/run-rewards.test.mjs
node --test tests/reward-ui.test.mjs
node --test tests/character-upgrades.test.mjs
node --test tests/character-mechanics.test.mjs
node --test tests/*.test.mjs
node --check src/stat-modifiers.mjs
```
