# Campaign worlds

A world is a **run**: the player picks it, plays its waves and the act ends with
its boss. The campaign is not one continuous run, so progress is per act.

## Where things live

| Path | What it owns |
| --- | --- |
| `src/campaign/acts.mjs` | the campaign map: every world, its order and its status |
| `src/campaign/act-01-zomboid.mjs` | one act: waves, boss, world, real wave length |
| `src/campaign/act-02-rift.mjs` | the second act: six waves, the Maiden, Yorick |
| `src/campaign/act-03-inferno.mjs` | the third act: six waves, Lord Zir, Lilith |
| `src/campaign/act-04-exiles.mjs` | the fourth act: six waves, the Lotus Alchemist, the Taskmaster |
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
  // Optional: one mini-boss, always before the boss wave. It is flagged
  // `boss: true` for its art and health bar, but killing it never ends the run.
  miniboss: { wave: 5, kind: 'maiden', name: 'LA MINIJEFA' },
  waves: [                   // one row per wave, numbered from 1
    { wave: 1, perMinute: 48, mix: { zombie: 1 }, life: { zombie: 46 } },
    // ...
  ],
};
```

The validator rejects an unknown world, an unknown enemy kind, a wave whose mix
does not share one roll, a kind with no declared life, a boss that is not on the
last wave, and a mini-boss that is unknown, unnamed or not before the boss. A
`planned` act only needs its slot.

Only the act's own boss closes the run: a boss-flagged mini-boss dying on its
wave does not end the map.

## Act 1 scenery

Act 1 combat uses `zomboid-combat`, a fixed top-down street with houses and
parked wrecks adapted from the approved Jhony cinematic art. Large scenery
stays around the perimeter, leaving the central fighting area clear. This is
visual scenery only: movement bounds, collision, waves and spawning are unchanged.
Act 1's five fixed-stage cinematics also use this updated street; their dialogue,
camera targets and actor positions are unchanged. Jhony keeps his separate,
larger `jhony-street` cinematic map. The older `zomboid` world remains available
for story pages and explicit previews.
Preview the combat layout in `?dev=worlds`, selecting **Act 1 — Knox County
combat street**, or start Act 1 to see it with combat effects and enemies.
Reload the whole page after adding a world to refresh the JavaScript registry.

## Act 4 rescue scenery

The Warrior rescue (`act-04-warrior`) runs on its own `warrior-camp` world: a
2744×748 strip with the Wheel of Pain near the entrance, the prisoner pen and
its cells deeper inside and the smoking building at the far end. The group walks
in, walks to the cell and the camera follows; dialogue, the wave-3 binding, the
cell prop and the unlock are unchanged. Preview it in `?dev=narrative` →
**Acto 4: El boliviano equivocado**.

## Act 3

Act 3 runs in the `inferno` dungeon with the seven kinds its script asks for:
skeletons, lesser demons, the ranged shaman, the burning elite, Lord Zir's bat
swarm, Lord Zir himself as the mini-boss and Lilith as the boss. Its cinematics
live in `assets/narrative/acts/act-03/manifest.json`; the dialogue for the two
bosses is the addendum at the end of the act script.

## Act 4

Act 4 runs in the `exiles` slavers' camp with the four common kinds its script
asks for: barbarians, slavers whose nets pin the player, archers, and alchemists
who throw lotus flasks and burst spores. El Alquimista del Loto is the mini-boss
on wave 5 and El Capataz de la Rueda del Dolor closes the run on wave 6. Its
cinematics live in `assets/narrative/acts/act-04/manifest.json`; the two bosses
have cinematic stage sprites (`src/npcs/`) and portrait sets, so they speak in
dialogue like the Act 2 and Act 3 bosses. The laboratory scenes use their own
`laboratory` world so the room reads apart from the camp. The script also names
hyenas on wave 1; this act ships the four kinds the roster needs, so the dunes
field raiders instead of a separate hyena ficha.

## Wave length

The act declares the real length. Local playtests shorten every wave to 15
seconds through `balanceFor(hostname)` in `src/reward-data.mjs`; any other host
plays `act.duration`. Append `?waves=<seconds>` to force a length anywhere, so
the real pacing can be exercised on localhost without touching code.

## Monster Hunter

Monster Hunter is **not** a world. It is a rejected pitch inside Act 4, so it
lives in that act's script and, later, in that act's scene manifest. It joins
`ACTS` the day it becomes playable.
