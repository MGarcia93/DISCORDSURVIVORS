# Agent notes — Discord Survivors

Vanilla ES modules in the browser, served over HTTP (`file://` breaks module
loading). Vite builds the deployable artifact; the source stays plain ESM with no
framework, no TypeScript and no `src/`-path aliases, so `node --test`, `node
--check` and `tools/balance.mjs` keep importing `src/` directly.

```sh
npm run dev                 # Vite dev server, same module paths as the source
node tools/serve.mjs        # the same game, no install, no-store
npm run build               # dist/: hashed JS/CSS plus a verbatim copy of assets/
npm run preview             # serve dist/ to check the real artifact
```

## Checks

```sh
node --test tests/*.test.mjs
node --check <every file you touched>
node tools/balance.mjs            # headless campaign per character, 24 runs each
node tools/balance.mjs --runs=48  # tighter estimate
node tools/balance.mjs --matrix --runs=6   # random vs optimal decisions, thin vs full purse
node tools/balance.mjs --compare --runs=6  # the same campaigns, perfect execution vs average player
```

Visual cinematic staging has its own order: implement the scene first, show it in
`?dev=narrative`, wait for the user's explicit approval, and only then write its
regression tests. Read `.opencode/skills/discord-survivors-dialogos/SKILL.md`
(movement in cinematics, long maps) and `docs/narrative-authoring.md#moving-dialogue`
before changing a scene that needs travel, pursuit or a camera move.

## Layout

| Path | What lives there |
| --- | --- |
| `src/app.mjs` | shell: routing, frame loop, click and key handling |
| `src/screens/` | one module per screen; `story-pages.mjs` is pure data |
| `src/backgrounds/` | world backgrounds (see below) |
| `src/audio/` | the mix: one context, two buses, the lapped bed and the SFX voices |
| `src/narrative/` | scene catalog, runtime, presenter, director, viewer |
| `src/campaign/` | the campaign map: one module per act with its waves, boss and world; validated on load |
| `src/characters/` | playable fichas; each owns its stats, profile and drawing |
| `src/enemies/` | enemy fichas; each owns its sheet and drawing, `index.mjs` is the registry |
| `src/pickups.mjs` | the drop a body leaves: chance, heal, one object per ficha and its drawing |
| `assets/narrative/` | scene JSON, portraits, manifest |
| `assets/audio/` | music tracks, one file per act |
| `docs/narrative-authoring.md` | authoring contract for scenes and worlds |
| `docs/audio.md` | buses, the bed cue, the wave filter, the lapped loop |
| `docs/campaign.md` | how to add a world: act shape, contract, wave length |
| `context/historia/` | approved story scripts — read the act before writing a scene |
| `.opencode/skills/enemy-authoring/` | how to add an enemy end to end: ficha, wave, rewards, sprite, visual approval, tests |
| `.opencode/skills/act-authoring/` | how to build a whole act: enemies first, then waves, boss and cinematics |

## World backgrounds

Read `docs/narrative-authoring.md#world-backgrounds` before changing these. The
rules that keep the game playable:

1. **Act worlds are top-down maps.** The camera looks down and the whole canvas
   is ground: streets, sand, flagstones, a lane, a floor plan. Buildings are
   roofs, pillars are bases with a shadow, trees are crowns. A lateral backdrop
   (sky on top, facades in elevation) breaks the projection: a character
   walking up ends up standing inside a wall. `room` is the one exception, a
   front-view menu illustration that is never used as a scene stage.
2. **Every world paints a full-canvas base first.** The baked canvas is opaque,
   so a transparent pixel shows the stage through it. This is tested for every
   world at 1144×748 and 480×270.
3. **`draw` is baked once** per world and canvas size, then blitted with a
   single `drawImage`; it can be as detailed as needed. Only `animate` runs per
   frame — put moving things there and keep it cheap.
4. **Use fractions of `width`/`height`**, never a fixed pixel layout: the same
   module renders the narrative stage (1144×748) and the story page (480×270).
5. Add a world: copy `src/backgrounds/arena.mjs`, change `id`, `title` and the
   painting, then register it in `WORLDS` inside `src/backgrounds/index.mjs`.
   Scenes and story pages reference it by id.

## Audio

Read `docs/audio.md` before adding a sound. The rules that keep it listenable:

1. **One `AudioContext`, two buses.** `music` and `sfx` hang off a master in
   `src/audio/engine.mjs`. Never create a second context: a bus that cannot be
   ducked is a bus that will cut the music.
2. **The bed is a cue, not an event.** `musicCue({ screen, run, paused, blocked })`
   in `src/audio/mix.mjs` is a pure function of state the shell already has.
   Do not push music changes from gameplay code; the frame loop asks once.
3. **A scene ducks, it never stops the music.** Cutting the bed for a dialogue
   line is what makes a game feel cheap.
4. **The loop laps.** `scheduleLap` overlaps the end of a lap with the start of
   the next for 0.25 s. Plain `loop = true` reintroduces the 30 dB click the
   provisional track has at its seam.
5. **The bed sits under the SFX.** `MUSIC_BED_GAIN` is the one number the whole
   mix scales from; everything else is relative to it.
6. **The player's level wins.** The **SONIDO** menu and the pause overlay own
   the levels and the mute switch; CONTROLES is the key manual. A constant in
   `mix.mjs` is a default, never a verdict on how loud the game should be.
7. `mix.mjs` stays DOM-free and WebAudio-free so `tests/audio.test.mjs` can run
   it under `node --test`. Put browser code in `engine.mjs` only.

## Dev screens

Everything in this table, plus `?playtest`, the world selector on the character
screen and the `Alt+Shift+U` unlock-all shortcut, reads `DEV` from
`src/dev-flags.mjs`. A production build inlines that to `false` and the minifier
drops the branches, so the surfaces stay in the source and never ship: nothing
here is deleted, and `npm run dev` keeps all of it.

| URL | What it does |
| --- | --- |
| `?dev=worlds` | every world at stage size with the cast; pick an actor and walk it with WASD or the arrow keys |
| `?dev=enemies` | a throwaway run of one enemy kind on a chosen world: it walks in, stops at its own attack distance and swings on its own cadence against a dummy that never moves. Shows the resolved sheet for the chosen wave |
| `?dev=narrative` | select, play, restart and skip standalone scenes |
| `?dev=balance` | balance lab: pick a character, a world and a wave, spend that wave's entry budget on level upgrades and items (left click adds, right click or `−1` takes one back, the headings count what is left, a maxed card reads `RANK 5/5`), then play the wave for real. Its **Cinematics** switch is off by default; on, it plays the act's scenes, banter and wave boundaries on the chosen wave, and either way it records nothing. It never advances: pause, clear or die and you can repeat the wave or go back to the build |
| `?dev=items` | the drop each ficha leaves on kill, at the arena's own scale rule on the run's ground layer: six objects, their ficha and the drop rules. Same effect for all of them, only the drawing changes |

All five are isolated: they never write progress or unlocks. The balance lab is
the only place that turns the playtest pacing on from the interface; anywhere
else it is `?playtest`, and without it the game runs the real balance.

## Scene JSON

`stage.background` names the world and defaults to `arena`. `stage` only
accepts `points`, `actors`, `props` and `background`; an unknown world id or an
unknown field fails validation with a clear message instead of silently
painting the default. Stage coordinates are in the 1144×748 space and actors
stand around y 440–510.
