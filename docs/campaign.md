# Campaign worlds

A world is a **run**: the player picks it, plays its waves and the act ends with
its boss. The campaign is not one continuous run, so progress is per act.

Defeating a world boss closes the world with the same shop every wave opens, so
the fight's coins and earned levels are spent before moving on. The shop's
**SIGUIENTE MUNDO** crosses to the next playable act; there is no separate
victory panel, and the destination is announced by the arrival card. The last
world offers **TERMINAR CAMPAÑA** and only then shows the campaign ending.

The next act starts with the same character, acquired items, upgrade ranks,
permanent statistics, reward bonuses, level, XP and coins. Health is restored to the upgraded maximum
and all abilities are ready, with no cooldown. The battlefield and temporary
combat effects start fresh. Sold possessions stay sold.
**OTRA PARTIDA** after a death does not replay the world where the run ended: it
starts the campaign over from the first world, with the chosen character and
nothing carried over (no items, ranks, level, XP or coins). A cleared campaign
replays the last world it ended on. The last act offers replay and the main menu,
not a transition back to the first world. Closing scenes must finish or be
skipped before continuing.

## Where things live

| Path | What it owns |
| --- | --- |
| `src/campaign/acts.mjs` | the campaign map: every world, its order and its status |
| `src/campaign/act-01-zomboid.mjs` | one act: waves, boss, world, real wave length |
| `src/campaign/act-02-rift.mjs` | the second act: six waves, the Maiden, Yorick |
| `src/campaign/act-03-inferno.mjs` | the third act: six waves, Lord Zir, Lilith |
| `src/campaign/act-04-exiles.mjs` | the fourth act: six waves, the Lotus Alchemist, the Taskmaster |
| `src/campaign/act-05-discord.mjs` | the fifth act: six waves, four restored bosses, the Administrator |
| `src/campaign/validate.mjs` | the contract an act must satisfy |
| `src/waves.mjs` | interpretation only: budget and the spawn roll |

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
  // A line of them is also allowed: same wave, spawned one at a time, and the
  // next one walks in when the previous one dies. Act 5 restores four that way.
  // miniboss: [{ wave: 5, kind: 'alarmZombie', name: 'EL ZOMBI DE LA ALARMA' }, ...],
  // Optional: this act's tier over the enemy sheets. Every statistic belongs to
  // the enemy's own ficha (src/enemies/); this block only multiplies the ones it
  // names, per kind and per statistic, so a world can field shipped bodies at its
  // own level without authoring a second table. A stat left out, or an act with
  // no block at all, fields the sheet exactly as written. Acts 1-4 declare none:
  // their tier is baked into the sheets, one +25% rung per act.
  statMultipliers: {
    zombie: { life: 2.44, attack: 2.44 },
    archer: { life: 1.25 },
  },
  waves: [                   // one row per wave, numbered from 1
    // Optional per-wave modifiers: `speedBoost` multiplies the speed of that
    // wave's enemies, `specialLock` mutes the cast's specials for its first
    // seconds. Act 5's hotfix wave uses both.
    { wave: 1, perMinute: 48, mix: { zombie: 1 }, speedBoost: 1.3, specialLock: 10 },
    // ...
  ],
};
```

A wave says **who** arrives and **how often**, never how hard they hit: life,
defense, attack, cadence, reach and speed all come from the enemy ficha. Each
act's sheet values are that act's rung of one ladder: act 1's base body is the
reference (zombie 46 life / 12 damage), and every act above it adds 25% of the
base, baked into the fichas. A world that fields a body from another rung — act
5 recycles the whole cast — says so once, in `statMultipliers`.

The validator rejects an unknown world, an unknown enemy kind, a wave whose mix
does not share one roll, a wave that re-authors a statistic, a tier that names an
unknown kind or statistic or a multiplier that is not positive, a boss that is not on the
last wave, and a mini-boss (or any entry of a mini-boss line) that is unknown,
unnamed or not before the boss. A `planned` act only needs its slot.

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

## Character encounters and unlocks

Completing or manually skipping the Solago encounter in Act 2, Papasito encounter
in Act 3 or Warrior rescue in Act 4 unlocks that character for future runs, with
any survivor. Winning a world no longer grants the next played-character reward.
Character sheets declare the encounter scene in `unlock.scene`; availability is
derived from the existing `seenScenes` history or a legacy unlock flag. Old
encounter history therefore restores access without replaying or rewriting saves.
Cancelled/failed scenes and isolated dev previews do not grant unlocks.

Jhony is the exception: he refuses to join in Act 1, so meeting him there grants
nothing. The last scene of his own epilogue (`act-07-credits`, the post-credits
where he asks «¿otra?») is what makes him selectable, which sits behind the
postgame gate of Act 7.

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
swarm, Lord Zir himself as the mini-boss and Lilith as the boss. Wave 5 is
untimed: defeating Lord Zir ends the wave immediately and clears his remaining
bats; the timer cannot end the fight while he is alive. Its cinematics
live in `assets/narrative/acts/act-03/manifest.json`; the dialogue for the two
bosses is the addendum at the end of the act script.

## Act 4

Combat waves 4 and 5 use `laboratory`, matching the lotus and alchemist scenes.
Wave 6 returns to `exiles` for the Wheel of Pain. A wave's optional `world`
overrides the act's default scenery; explicit dev-sandbox scenery takes priority.
Wave world IDs must name a registered background.

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

## Act 5

Act 5 runs in the `discord` corrupted server and authors **no new common enemy**:
the Administrator recycles the four worlds, so the six waves mix shipped kinds —
zombies and minions, then skeletons, barbarians, walkers and slavers. Wave 4 is
the hotfix: its raiders are 30% faster and the cast's specials are cut for the
first ten seconds. Wave 5 restores the four bosses the group already beat
(`alarmZombie`, `yorick`, `lilith`, `taskmaster`) through the mini-boss line, one
at a time. El Administrador del Servidor (`administrator`) closes the run on wave
6 with three phases: `/mute` and `/timeout` with recycled copies, dangerous
ground plus one `rollback`, then the breakdown that gives the specials back and
attacks without pause. Its cinematics live in
`assets/narrative/acts/act-05/manifest.json`. The epilogue is a wide scroll of
the `discord` world: the group walks back through the server to the window where
Maxi is waiting, plugged in.

## Wave composition

A wave declares `perMinute` (how often something spawns) and `mix` (the weight
of each kind). Every spawn rolls against those percentages, so two runs of the
same wave are not the same wave: that is the game's randomness.

A wave may also declare `ramp`: stages of its own mix, each with the share of the
clock it covers. When it does, **each spawn rolls against the percentages active
at that moment** — the opening minutes are one mix, the last third another — and
the wave's `mix` stays as the fallback for a wave with no ramp. It is still one
roll per spawn, so the run keeps its randomness; what changes is that a wave can
build to a spike instead of asking for the whole budget at second zero.

Act 3 wave 4 is the reference: half the wave is skeletons and shamans, then
twenty percent burning elites, then four fifths elites for the last third.

## Wave length

The act declares the real length, and that is what every build plays: no host
shortens a wave. The fast pacing is a tool the user turns on, never something the
environment decides:

- `?playtest` runs 15-second waves and multiplies XP by ten, the tuning pacing.
- `?waves=<seconds>` forces only the length, on top of either mode.
- `?dev=balance` opens the balance lab: pick a character, a world and a wave,
  spend that wave's entry budget on level upgrades and items, and play the
  wave for real. The budget is projected from the waves before it, so a level-5 build at
  wave 5 is a claim about the campaign and not a number someone typed. A left
  click adds a rank or an item, a right click (or the card's `−1`) takes one back
  and returns the budget, and each group counts what is left, so the build is
  editable until the wave starts. A card at its cap reads `RANK 5/5` or `2/2`, not
  a refusal. A lab run never advances the campaign. Its cinematics are an opt-in
  switch: off, the wave plays no scene at all; on, it replays that wave's scenes,
  banter and boundaries from a throwaway memory, so nothing is recorded and
  nothing unlocks. Its shop and its death screen offer repeat and back to the
  build screen, and the pause menu is the way out of a wave that is still running.

`balanceFor(search)` in `src/reward-data.mjs` resolves both flags; the shipped
`BALANCE` object is the real one.

## Act 6

Act 6 is the Papafrita epilogue, **«Nadie te vino a buscar»**, and the campaign's
postgame. It runs in the `monster-hunter` Primordial Forest with nine new fichas:
`jagras`, `vespoid`, `kestodon`, `mernos` and `hornetaur` as the common kinds,
`greatJagras` as the wave-2 elite (bigger, with a mane, but not a boss),
`kuluYaKu` on wave 3 and `pukeiPukei` on wave 5 as the two mini-bosses, and
`rathalos` closing wave 6. Every sheet is authored on the act-6 rung of the
ladder, so the act declares no `statMultipliers`.

The two mini-bosses sit on **different waves**, which is why the engine opens a
mini-boss line per wave: an entry belongs to the wave it names, and act 5's four
entries on one wave still read as one line. Both waves are `untimed`: the
mini-boss decides when the wave ends.

Rathalos attacks at distance with `ctx.enemyShot`: the fireball is a projectile
that travels, while the sheet keeps contact reach for the bite. Pukei-Pukei spits
its venom the same way.

Its cinematics live in `assets/narrative/acts/act-06/manifest.json` and every line
is quoted from `context/historia/Discord_Survivors_Epilogo_Papafrita.md`. The
parental punchline appears exactly once, in the reunion.

## Monster Hunter

Monster Hunter was a rejected pitch inside Act 4 until the epilogue made it
playable: it is now the `monster-hunter` world and act 6.
