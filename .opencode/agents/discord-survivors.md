---
description: Project agent for the Discord Survivors browser game: gameplay, narrative scenes and character portraits under this repo's conventions.
mode: primary
color: "#d8cf78"
---

# Discord Survivors

Playable pixel-art browser prototype: title menu, survivor select, three story scenes, four waves, upgrades between waves, Administrator boss. Static files, native ES modules, Canvas.

## Repository facts

- No build step, no bundler, no npm dependencies. Never add one for convenience.
- Serve locally: `python3 -m http.server 5173 --bind 127.0.0.1`, open `http://localhost:5173`. Modules require HTTP, not `file://`.
- Narrative development viewer: `/?dev=narrative`.
- Tests: `node --test tests/*.test.mjs`. Browser checks live in `tests/*-browser.mjs` and use `tests/helpers/chromium.mjs`; set `CHROMIUM_PATH` when Playwright's Chromium is not auto-detected.

## Architecture rules

`src/app.mjs` is the composition root. It wires screens, engine, bus and the narrative module, routes input and runs the frame loop; it holds no game rules and never branches on character identity.

- Add a feature as a self-contained module that app plugs in: narrative arrives through `src/narrative/integration.mjs`, screens through `src/screens/`, drawing through `src/game/`, rules through `src/engine.mjs`.
- Extend by registration, never by editing shared product code: a new character is a module in `src/characters/` registered in `CHARACTERS` and `ROSTER`; a new enemy is an entry in `ENEMY_KINDS`; a new upgrade is an entry in the upgrade table.
- If a change to one feature forces edits in `src/app.mjs`, `src/engine.mjs` or `src/game/renderer.mjs`, add a seam instead of a branch.
- Polymorphism means an object contract: no class hierarchies, no `instanceof`, no tag the consumer switches on. Behaviour lives on the object (`draw`, `preview`, `initPlayer`, `update`, `contactDefenseBonus`, HUD hooks).
- Dependency direction: the engine knows no DOM and no UI; the core knows nothing about narrative; UI reads state and emits intents. Cross-cutting reactions go through `src/bus.mjs` events.
- Unlock metadata lives on the character (`unlock: { flag }`, `null` means always playable) and `UNLOCK_CHAIN` is derived from `ROSTER`, so `src/progression.mjs` never names a character.
- A closed data schema may dispatch with a switch (`src/narrative/runtime.mjs` scene actions); that is schema validation. Adding a case means schema, validation and docs together, never a behaviour exception.
- No test-only branches in product code: tests import the registry and the public functions.
- One responsibility per file: `src/engine.mjs` rules, `src/game/renderer.mjs` drawing, `src/game/hud.mjs` and `src/game/overlays.mjs` UI, `src/screens/` flow.

## Hard rules

- Keep audio, images and gameplay offline: no network calls at runtime.
- Narrative stays data-driven: scenes in `assets/narrative/scenes/`, speakers and portrait paths in `assets/narrative/characters.json`. Blocking scenes run only at wave boundaries; never couple scene logic into combat.
- Portrait work loads the `character-portraits` skill first. Files under `assets/narrative/portraits/` are build output and are never hand-edited.
- Write code, comments, UI copy, tests, commit messages and docs in English.
- Conventional commits only, no AI attribution. Never commit `context/`, `.atl/`, `.engram/` or `odd/`.
- Do not push, open pull requests or merge unless the user explicitly asks.
- Gameplay changes keep existing behaviour covered by a test; run the full suite before reporting done.

## Where to look

| Area | Path |
| --- | --- |
| Game loop, waves, upgrades | `src/` |
| Narrative engine and viewer | `src/narrative/` |
| Scene data and catalog | `assets/narrative/` |
| Character portrait sources | `art/characters/<name>/` |
| Authoring contract | `docs/narrative-authoring.md` |
