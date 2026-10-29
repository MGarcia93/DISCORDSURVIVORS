# Add or preview a narrative scene

Each scene lives in its own JSON file. The narrative module owns playback; combat does not know scene IDs, dialogue, or staging. The `sample-*` scenes are **noncanonical development samples**. Props and other characters' portraits remain placeholders. El Negro, Solago, Warrior and Papazito use approved detailed pixel-art bases generated from one source portrait each; their expression sets are available for visual review.

The viewer also includes **Act 4 preview: Warrior rescue (placeholder art)**. It uses the approved rescue aftermath dialogue (Act 4 script, lines 232–252), following the guardian fight; the approach movement and camera are proposed staging. The existing arena, labeled props and basic pointing pose stand in for Conan scenery, chain-breaking animation and smoke. The unlock splash is presentation only: it never unlocks Warrior in real progress. This scene has no gameplay binding.

## Preview without playing

Serve the repository as described in the README and open `http://localhost:5173/?dev=narrative`.
The development viewer uses the same catalog, interpreter and presentation as gameplay. Select a scene, play, advance, skip or restart it. Its actors, flags and completion history are isolated in memory; no progression storage is written. Closing or restarting the viewer discards them. Each viewer opening loads fresh JSON without the browser HTTP cache or the gameplay catalog cache, so new scene/speaker files do not mix with older definitions. Reload the page after editing content; an already-open viewer does not hot-reload files.

## Add content

1. Add a scene JSON under `assets/narrative/scenes/`.
2. Register its `id`, `title` and `file` in `assets/narrative/manifest.json`.
3. Add speakers/portrait expressions to `characters.json`. Expressions are local image paths relative to the manifest. Every speaker needs `neutral`; a line may omit its expression.
4. Use the viewer to inspect validation errors and playback. Reload the page after editing files.
5. When ready, add a manifest binding such as `{ "when": "before_wave", "wave": 2, "scene": "my-scene" }`.

The samples have **no gameplay bindings**, so normal prototype play is unchanged. Bindings refer to the current prototype's wave numbers, not a newly implemented multi-act campaign. An authoring pass can later select/load a catalog per act without changing individual scene files.

## Portrait conversation

```json
{
  "id": "my-scene",
  "steps": [{ "type": "dialogue", "lines": [
    { "speaker": "guide", "expression": "neutral", "text": "Your dialogue." }
  ] }]
}
```

Names and portraits come from the character catalog. Text is rendered as text, not HTML. Advance is manual. No per-conversation JavaScript is needed.

Every character now exposes the same eight expressions: `neutral`, `happy`, `annoyed`, `angry`, `surprised`, `scared`, `tired`, `disgusted`.

El Negro (`maxi-negro`, the playable `negro` sprite) uses `disgusted` for the Act 4 Papafrita gag.

Solago (`solago`) keeps the same buck-toothed mouth in every expression so the character stays recognisable; `disgusted` swaps it for the Excalibur-style clenched grimace used in Act 4.

Warrior (`warrior`) supports the same eight expressions: `happy` covers the "Yo soy argentino, boludo" lines, `surprised` the Viaje Astral reaction and `disgusted` reuses the Act 4 grimace.

Papazito (`papasito`) supports the same eight expressions over his construction-vest base: `scared` covers the extortion-notification panic, `angry` the "¡ME RE CAGARON!" state and `disgusted` the Act 4 grimace.

These images are generated from one source portrait and facial overrides, not independently redrawn characters. See [the El Negro workflow](../art/characters/negro/README.md), [the Solago workflow](../art/characters/solago/README.md), [the Warrior workflow](../art/characters/warrior/README.md), [the Papazito workflow](../art/characters/papazito/README.md) and the [`character-portraits` skill](../.opencode/skills/character-portraits/SKILL.md).

Jhony (`jhony`) is an NPC with the same eight expressions and his own stage sprite.
His approved base keeps long loose hair, clear glasses, a pointed beard and one
lip hoop on the viewer's left; no ear or nose jewelry. His torn black leather
jacket, red lining and blood splashes match the approved stage sprite. Use
`annoyed` or `angry` for his quick temper and `neutral` for his comfort in Project
Zomboid. See [Jhony's sources and rebuild command](../art/characters/jhony/README.md).
Registering him as a speaker does not make him playable or activate Act 1 scenes.

Papafrita (`papafrita`) has eight expressions and a casual NPC stage sprite but
is not playable. His cinematic armour and creature hat intentionally differ from
the sprite's black tee, denim shorts and trainers. His catalog entry opts into
`"portraitLayout": "extended"` for the approved 184×238 frame: preserve pixel
scale and bottom alignment rather than squeezing the hat into a standard frame.
This adds no story scenes or wave bindings. See [Papafrita's preview and sources](../art/characters/papafrita/README.md).

## Act manifests

Each campaign act brings its own narrative files. The act descriptor in
`src/campaign/` declares `narrative`, a path relative to
`assets/narrative/manifest.json`:

```js
// src/campaign/act-01-zomboid.mjs
narrative: 'acts/act-01/manifest.json',
```

That manifest has the same shape as the shared one (`characters`, `sounds`,
`scenes`, `bindings`) plus `banter`, and its paths resolve from its own folder.
Everything is merged into one catalog: a run loads the shared manifest plus its
act, and **the development viewer loads every registered act**. That is the
whole rule — a cinematic that is not listed in a manifest does not exist, and a
cinematic that is listed appears in `?dev=narrative` automatically, playable in
isolation with its validation error shown if the file is broken.

A scene's `stage.background` must name a world from `src/backgrounds/`; an act
world and its scenes should agree.

## Banter during a wave

An act manifest can schedule combat comments instead of interrupting the run:

```json
"banter": [
  { "wave": 2, "at": 8, "speaker": "maxi-negro", "expression": "surprised", "text": "¿Eh?" }
]
```

`at` is the second of that wave. Each line fires once per run, never while a
scene owns the screen, and uses the same compact panel as `enqueueBanter`.

## Sprite sequence

Declare `stage.points` as named `[x,y]` coordinates in the 1144×748 arena, `stage.actors` as named entries, and optional `stage.props` as `{ at, state }` entries.

An actor is either a member of the cast or an enemy:

```json
"actors": {
  "negro": { "character": "maxi-negro", "at": "ground" },
  "shambler": { "enemy": "zombie", "at": "street" },
  "corpse": { "enemy": "brute", "at": "floor", "state": "dead" }
}
```

`enemy` names a kind from `src/enemies/` and `state` is `alive` (default) or `dead`: a dead enemy lies on the ground and never speaks. Enemy actors take the same `move` and `animate` steps as the cast, so a scene can walk a zombie in or push the boss forward; they never talk, unlock or fight. `stage.background` names the world the scene happens in (see [World backgrounds](#world-backgrounds)) and defaults to `arena`. Actor/prop IDs are local to that scene; these are presentation entities, not combat enemies. The initial scene state is also its preview setup.

| Step | Fields | Meaning |
| --- | --- | --- |
| `dialogue` | `lines` | Manual portrait conversation |
| `move` | `actor`, `to`, `duration` | Walk to a named point |
| `animate` | `actor`, `animation`, `duration` | `idle`, `walk`, `point` or `celebrate` |
| `camera` | `to`, optional `zoom`, `duration` | Pan/zoom; zoom range 1–4. The stage is exactly the canvas, so the camera is clamped and never shows black outside the map |
| `prop` | `prop`, `state` | Change a scene-local prop state |
| `down` | `actor` | Drop an enemy where it stands; a dead enemy never animates |
| `flash` | `at`, `duration` | A short burst at a point: muzzle flash, hit spark |
| `sound` | `sound` | Play a catalog sound without waiting |
| `splash` | `speaker`, `text`, `duration` | Timed presentation using a catalog portrait |
| `notice` | `title`, `lines`, `duration` | System message: the world's own UI, no portrait |
| `wait` | `duration` | Wait in narrative seconds |
| `parallel` | `steps` | Run independent actions together |

Durations are nonnegative seconds. Parallel actions cannot write the same actor, camera or prop, and cannot contain dialogue, splash or custom actions. Sequential actions appear in the top-level `steps` array. The sample arrival shows movement and camera in parallel, followed by conversation and splash.

The initial renderer uses the existing arena and character sprite drawers plus labeled placeholder props. New maps are separate worlds (see [World backgrounds](#world-backgrounds)); detailed prop art and new sprite animation capabilities remain separate art/presentation work, not automatically supplied by a scene JSON. Existing named animations are simple staging poses.

## World backgrounds

A world is one module in `src/backgrounds/` that paints the scenery of a place. Scenes pick one with `stage.background`, the story pages name theirs in `src/screens/story-pages.mjs`, and the combat renderer uses the same registry. Open **`?dev=worlds`** to see every world at full stage size, animating, with the playable cast on it: pick a character and walk it with **WASD** or the arrow keys to try staging and contrast.

| World | Used by |
| --- | --- |
| `arena` (default) | the combat arena; scenes that do not name a world |
| `room` | home screen; story page 1 (El Negro's room) |
| `zomboid` | Act 1 — Knox County; story page 2 |
| `rift` | Act 2 — Summoner's Rift |
| `inferno` | Act 3 — the dungeon |
| `exiles` | Act 4 — the Exiled Lands; the shipped Act 4 preview |
| `discord` | Act 5 — the corrupted server |

Each world exports `{ id, title, draw, animate? }`:

- `draw(ctx, { width, height })` paints the static scenery. It runs **once** per world and canvas size, into an offscreen canvas; every later frame blits that canvas with a single `drawImage`. Per-tile detail is therefore free at runtime.
- `animate(ctx, { width, height, time })` is optional and runs every frame, after the bake. Put only what actually moves there (a flickering brazier, a lava glow, a glitch tear, drifting fog).
- Sizes: a world must paint whatever `width`/`height` it is given; use fractions of `width`/`height`, never a fixed pixel layout.

**Perspective — act worlds are top-down maps.** The game camera looks down at the arena, so the whole canvas is ground: streets, sand, flagstones, a lane, a floor plan. Buildings are roofs, pillars are bases with a shadow cast to the bottom-right, trees are crowns. A lateral/side-view backdrop (sky on top, facades in elevation) breaks the projection: a character walking up ends up standing inside a wall. The only exception is `room`, which is a front-view menu illustration and is never used as a scene stage.

The cast walks anywhere on that ground: the dev viewer clamps to 3–97% of the canvas, with no horizon line to stop against.

Add a world:

1. Copy `src/backgrounds/arena.mjs` to `src/backgrounds/<world>.mjs` and change `id`, `title` and the painting.
2. Import and register it in the `WORLDS` object in `src/backgrounds/index.mjs`.
3. Reference it from a scene (`"stage": { "background": "<world>" }`) or from a story page.
4. Run `node --test tests/backgrounds.test.mjs` and open `?dev=worlds` to look at it.

Every world must paint a full-canvas base (`pixel(ctx, 0, 0, width, height, color)`) before its details: the baked canvas is opaque, so any transparent pixel would show the stage behind the background. That invariant is tested for every registered world at the narrative and story sizes.

Unknown world ids fail validation (`Unknown background: <id>`), and `stage` only accepts `points`, `actors`, `props` and `background`, so a misspelled field is reported instead of silently painting the default arena.

## Results, repetition and boundaries

- `repeat` is `always` (default) or `once` per live run. No new persisted save format is introduced.
- `effects` is an array of `{ key, value }` required result flags, with string/boolean/finite-number values. Flags are recorded for the live narrative session; story-specific unlock/save integration is deferred.
- Finishing or skipping records the result once. Skip fast-forwards stage actions, suppresses queued sounds, applies flags, and restores the camera. Cancellation/failure grants no completion result.
- Blocking scenes run only **after a wave → before shop**, or **after shop → before the next wave**. A first-wave pre-scene is also supported. Combat, abilities, wave time and cooldowns do not advance during a blocking scene.
- Multiple bindings at the same boundary run in manifest order. The original shop, rewards and final victory logic remain owned by combat/progression.
- Narration does not clear combat entities or directly manipulate stored unlocks. Never put irreversible gameplay effects in a presentation action.

## Scene-local JavaScript

For a genuinely special action, add a sibling `.mjs` and reference it through that scene's manifest `module`. It exports `actions`, whose entries expose `validate(step, scene)` and `start(step, presentation)`. `start` returns `tick(dt)` (true when complete), `skip()` (apply final presentation state), and optional `cancel()` (release resources). See `sample-extension.mjs`.

Extensions receive the scene runtime, including its presentation fields, lifecycle methods and callbacks—not the live combat run. Use only the presentation fields (`actors`, `props`, `camera`); do not invoke lifecycle methods or completion callbacks from an action. They are **trusted application code, not sandboxed scripts**; keep them synchronous, bounded and free of storage, network, combat or irreversible side effects. External waits/promises are not supported. A shared new feature belongs in the narrative module only if multiple scenes genuinely need it.

## Banter during a wave

The host exposes `enqueueBanter({ speaker, expression?, text, sound?, priority?, duration?, ttl? })`. Only one line is visible; queued lines sort by descending priority, then insertion order. Expired lines are discarded. Duration defaults to readable text length. A catalog sound starts when its line becomes visible, not when queued. Combat is never paused; ending the wave clears the current line and queue. Banter uses a compact panel, not the blocking dialogue UI.

## Checks

```sh
node --test tests/narrative-*.test.mjs
node --test tests/*.test.mjs
```

With an existing Chromium installation and the local server running, a dependency-free browser check is also available:

```sh
CHROMIUM_PATH=/path/to/chrome node tests/narrative-browser.mjs
```

`GAME_URL` overrides the local URL. The check prints its external scratch directory (including screenshots); remove that directory after inspecting the results. It never installs a browser. `tests/narrative-compatibility.mjs` emits deterministic existing-game snapshots against a supplied `GAME_URL`, so separate served checkouts can be compared without putting history-dependent assertions in tests.

Use the development viewer after changing visual staging or assets. Validation catches unknown speakers, expressions, actors, points, actions, invalid durations and conflicting parallel actions. Runtime/asset errors appear in the viewer and release scene ownership rather than trapping the game.
