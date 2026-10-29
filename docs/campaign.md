# Campaign worlds

A world is a **run**: the player picks it, plays its waves and the act ends with
its boss. The campaign is not one continuous run, so progress is per act.

## Where things live

| Path | What it owns |
| --- | --- |
| `src/campaign/acts.mjs` | the campaign map: every world, its order and its status |
| `src/campaign/act-01-zomboid.mjs` | one act: waves, boss, world, real wave length |
| `src/campaign/validate.mjs` | the contract an act must satisfy |
| `src/waves.mjs` | interpretation only: budget, life and the spawn roll |

`src/campaign/acts.mjs` is the **only** module that knows how many worlds exist
or in what order they run. Everything else — engine, renderer, HUD, narrative —
reads the descriptor it is handed. No module outside `src/campaign/` may name an
act, a wave count or the boss wave; `tests/campaign.test.mjs` enforces that.

## Add a world

1. Create `src/campaign/act-0N-<world>.mjs` with the shape below.
2. Add it to `ACTS` in `src/campaign/acts.mjs`.
3. Reference an existing world from `src/backgrounds/` in `world`.
4. Run `node --test tests/campaign.test.mjs tests/waves.test.mjs`.

```js
export default {
  id: 'act-06',
  order: 6,
  title: 'World title',
  status: 'playable',        // 'planned' holds a slot with no waves yet
  world: 'monster-hunter',   // must exist in src/backgrounds/
  duration: 60,              // real wave length in seconds
  boss: { wave: 6, kind: 'alarmZombie', name: 'EL JEFE' },
  waves: [                   // one row per wave, numbered from 1
    { wave: 1, perMinute: 48, mix: { zombie: 1 }, life: { zombie: 46 } },
    // ...
  ],
};
```

The validator rejects an unknown world, an unknown enemy kind, a wave whose mix
does not share one roll, a kind with no declared life, and a boss that is not on
the last wave. A `planned` act only needs its slot.

## Wave length

The act declares the real length. Local playtests shorten every wave to 15
seconds through `balanceFor(hostname)` in `src/reward-data.mjs`; any other host
plays `act.duration`. Append `?waves=<seconds>` to force a length anywhere, so
the real pacing can be exercised on localhost without touching code.

## Monster Hunter

Monster Hunter is **not** a world. It is a rejected pitch inside Act 4, so it
lives in that act's script and, later, in that act's scene manifest. It joins
`ACTS` the day it becomes playable.
