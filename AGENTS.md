# Agent notes — Discord Survivors

Vanilla ES modules in the browser: no build step, no package manager, no
dependencies. Serve the repository over HTTP (`file://` breaks module loading).

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

## Checks

```sh
node --test tests/*.test.mjs
node --check <every file you touched>
```

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
| `assets/narrative/` | scene JSON, portraits, manifest |
| `assets/audio/` | music tracks, one file per act |
| `docs/narrative-authoring.md` | authoring contract for scenes and worlds |
| `docs/audio.md` | buses, the bed cue, the wave filter, the lapped loop |
| `docs/campaign.md` | how to add a world: act shape, contract, wave length |
| `context/historia/` | approved story scripts — read the act before writing a scene |
| `.opencode/skills/enemy-authoring/` | how to add an enemy end to end: ficha, wave, rewards, sprite, visual approval, tests |

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
6. **The player's level wins.** The sliders in CONTROLES are the control. A
   constant in `mix.mjs` is a default, never a verdict on how loud the game
   should be.
7. `mix.mjs` stays DOM-free and WebAudio-free so `tests/audio.test.mjs` can run
   it under `node --test`. Put browser code in `engine.mjs` only.

## Dev screens

| URL | What it does |
| --- | --- |
| `?dev=worlds` | every world at stage size with the cast; pick an actor and walk it with WASD or the arrow keys |
| `?dev=enemies` | a throwaway run of one enemy kind on a chosen world: it walks in, stops at its own attack distance and swings on its own cadence against a dummy that never moves. Shows the resolved sheet for the chosen wave |
| `?dev=narrative` | select, play, restart and skip standalone scenes |

All three are isolated: they never write progress or unlocks.

## Scene JSON

`stage.background` names the world and defaults to `arena`. `stage` only
accepts `points`, `actors`, `props` and `background`; an unknown world id or an
unknown field fails validation with a clear message instead of silently
painting the default. Stage coordinates are in the 1144×748 space and actors
stand around y 440–510.
