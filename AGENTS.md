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
| `src/narrative/` | scene catalog, runtime, presenter, director, viewer |
| `src/characters/` | playable fichas; each owns its stats, profile and drawing |
| `assets/narrative/` | scene JSON, portraits, manifest |
| `docs/narrative-authoring.md` | authoring contract for scenes and worlds |
| `context/historia/` | approved story scripts — read the act before writing a scene |

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

## Dev screens

| URL | What it does |
| --- | --- |
| `?dev=worlds` | every world at stage size with the cast; pick an actor and walk it with WASD or the arrow keys |
| `?dev=narrative` | select, play, restart and skip standalone scenes |

Both are isolated: they never write progress or unlocks.

## Scene JSON

`stage.background` names the world and defaults to `arena`. `stage` only
accepts `points`, `actors`, `props` and `background`; an unknown world id or an
unknown field fails validation with a clear message instead of silently
painting the default. Stage coordinates are in the 1144×748 space and actors
stand around y 440–510.
