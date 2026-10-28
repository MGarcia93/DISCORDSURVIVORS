# Add or preview a narrative scene

Each scene lives in its own JSON file. The narrative module owns playback; combat does not know scene IDs, dialogue, or staging. The bundled scenes and portraits are **development samples, not canonical story or approved character art**.

## Preview without playing

Serve the repository as described in the README and open `http://localhost:5173/?dev=narrative`.
The development viewer uses the same catalog, interpreter and presentation as gameplay. Select a scene, play, advance, skip or restart it. Its actors, flags and completion history are isolated in memory; no progression storage is written. Closing or restarting the viewer discards them.

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

## Sprite sequence

Declare `stage.points` as named `[x,y]` coordinates in the 1144×748 arena, `stage.actors` as named `{ character, at }` entries, and optional `stage.props` as `{ at, state }` entries. Actor/prop IDs are local to that scene; these are presentation entities, not combat enemies. The initial scene state is also its preview setup.

| Step | Fields | Meaning |
| --- | --- | --- |
| `dialogue` | `lines` | Manual portrait conversation |
| `move` | `actor`, `to`, `duration` | Walk to a named point |
| `animate` | `actor`, `animation`, `duration` | `idle`, `walk`, `point` or `celebrate` |
| `camera` | `to`, optional `zoom`, `duration` | Pan/zoom; zoom range 0.25–4 |
| `prop` | `prop`, `state` | Change a scene-local prop state |
| `sound` | `sound` | Play a catalog sound without waiting |
| `splash` | `speaker`, `text`, `duration` | Timed presentation using a catalog portrait |
| `wait` | `duration` | Wait in narrative seconds |
| `parallel` | `steps` | Run independent actions together |

Durations are nonnegative seconds. Parallel actions cannot write the same actor, camera or prop, and cannot contain dialogue, splash or custom actions. Sequential actions appear in the top-level `steps` array. The sample arrival shows movement and camera in parallel, followed by conversation and splash.

The initial renderer uses the existing arena and character sprite drawers plus labeled placeholder props. New maps, detailed prop art and new sprite animation capabilities are separate art/presentation work, not automatically supplied by a scene JSON. Existing named animations are simple staging poses.

## Results, repetition and boundaries

- `repeat` is `always` (default) or `once` per live run. No new persisted save format is introduced.
- `effects` is an array of `{ key, value }` required result flags, with string/boolean/finite-number values. Flags are recorded for the live narrative session; story-specific unlock/save integration is deferred.
- Finishing or skipping records the result once. Skip fast-forwards stage actions, suppresses queued sounds, applies flags, and restores the camera. Cancellation/failure grants no completion result.
- Blocking scenes run only **after a wave → before shop**, or **after shop → before the next wave**. A first-wave pre-scene is also supported. Combat, abilities, wave time and cooldowns do not advance during a blocking scene.
- Multiple bindings at the same boundary run in manifest order. The original shop, rewards and final victory logic remain owned by combat/progression.
- Narration does not clear combat entities or directly manipulate stored unlocks. Never put irreversible gameplay effects in a presentation action.

## Scene-local JavaScript

For a genuinely special action, add a sibling `.mjs` and reference it through that scene's manifest `module`. It exports `actions`, whose entries expose `validate(step, scene)` and `start(step, presentation)`. `start` returns `tick(dt)` (true when complete), `skip()` (apply final presentation state), and optional `cancel()` (release resources). See `sample-extension.mjs`.

Extensions receive only scene presentation state. They are **trusted application code, not sandboxed scripts**; keep them synchronous, bounded and free of storage, network, combat or irreversible side effects. External waits/promises are not supported. A shared new feature belongs in the narrative module only if multiple scenes genuinely need it.

## Banter during a wave

The bridge exposes `enqueueBanter({ speaker, expression?, text, priority?, duration?, ttl? })`. Only one line is visible; queued lines sort by descending priority, then insertion order. Expired lines are discarded. Duration defaults to readable text length. Combat is never paused; ending the wave clears the current line and queue. Banter uses a compact panel, not the blocking dialogue UI.

## Checks

```sh
node --test tests/narrative-*.test.mjs
node --test tests/*.test.mjs
```

Use the development viewer after changing visual staging or assets. Validation catches unknown speakers, expressions, actors, points, actions, invalid durations and conflicting parallel actions. Runtime/asset errors appear in the viewer and release scene ownership rather than trapping the game.
