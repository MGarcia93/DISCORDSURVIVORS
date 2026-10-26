# Discord Survivors — La última partida

A playable pixel-art browser prototype based on the supplied Discord Survivors concept. Start → select El Negro → three short story scenes → survive three waves → defeat the Administrator in wave four.

## Play locally

From this directory, run:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open **http://localhost:5173** in a current browser. No build, package install, account, or backend is required. Serve the directory over HTTP rather than opening `index.html` directly; the game uses JavaScript modules.

## Controls

| Action | Control |
| --- | --- |
| Move | WASD, arrow keys, or touch direction buttons |
| Attack | Automatic; remotes bounce through up to three targets |
| Regenerate health | Stand still for two seconds |
| Modo Otaku | Q or the ability button; eight-second summon, twenty-second cooldown |
| Me da paja | E or the ability button; six-second chair aura, twenty-five-second cooldown |
| Pause / resume | Escape or the pause / resume buttons |

Leaving the browser tab automatically pauses combat. Between waves, spend dropped currency on upgrades or continue without buying. Each upgrade is available once per shop. Surviving a wave gives twelve bonus currency. Defeat the Administrator to win; waiting out the final wave is not enough. Retry creates a fresh run.

The title menu supports Up/Down to choose and Enter to confirm. Open **CONTROLES** for the in-game control panel; Escape closes it. Menus honour the system reduced-motion preference.

## Visual direction

The interface is a game screen, not a promotional website: a pixel-art room with El Negro in his chair, a local bitmap title, a sprite roster, illustrated story scenes, pixel-framed dialogs, and an arena HUD. There is no website navigation rail, promotional card grid, or footer.

El Negro's sprite uses the supplied photographs and humorous references: broad yellow hoodie, dark hair tied back, glasses, facial hair, ear jewellery, and facial piercings. The same sprite appears in the room, roster, preview, story, and combat, with standing, walking, and seated poses. This is a first pixel-art interpretation, not a claim of final likeness approval.

Sprites are drawn with hard-edged rectangles on a low-resolution canvas and enlarged without smoothing. Character selection and the menu use integer sprite scales. Combat keeps its original world coordinates and physics while rendering to a half-resolution canvas with pixel-aligned character positions.

## Prototype boundaries

- Only El Negro is playable. The other confirmed members are unavailable placeholders, not unlockable content yet.
- The three regular waves last 30, 35, and 40 seconds. The final boss wave has no time limit. These short rounds are for testing, not the proposed 15–20 minute final format.
- One arena, two normal enemy types, one boss, one weapon, two active abilities, and four shop upgrades.
- No permanent progression, saves, audio, multiplayer, or additional worlds yet.
- The supplied gamer illustration remains in `assets/` as a reference; the UI now uses original pixel sprites instead. Other supplied photographs have not been copied into the project.
- UI and story copy follow the supplied Spanish concept. Technical identifiers and developer documentation are English.
- All runtime visuals and text work offline once served locally. No external font or image requests are required; the title uses a local bitmap alphabet.

## Verify

Requires Node.js with its built-in test runner:

```sh
node --test tests/*.test.mjs
node --check src/app.mjs
node --check src/engine.mjs
node --check src/sprites.mjs
node --check src/scenes.mjs
```

The deterministic engine tests cover movement, the stationary passive, automatic attacks, shop transactions, abilities, death/retry, and the final boss victory condition. The engine takes an injectable random function and has no browser dependency.

An optional browser smoke check is available when Playwright and its Chromium browser are installed in your test environment. With the local server running:

```sh
node tests/browser-smoke.mjs
node tests/pixel-ui.mjs
```

For a separate test-tools installation, set `PLAYWRIGHT_MODULE` to the absolute path of Playwright's `index.mjs` and optionally `CHROMIUM_PATH` to an existing Chromium executable. `GAME_URL` overrides the local URL. The checks exercise desktop navigation, abilities, pause/resume, touch controls, the new title/character/story screens, and removal of the website shell. Visual likeness still requires human review.

## Files

- `index.html`, `styles.css`: shell, responsive layout, and presentation.
- `src/app.mjs`: screen navigation, input, rendering, pause, and HUD.
- `src/engine.mjs`: combat, waves, currency, and upgrades.
- `src/sprites.mjs`: photo-referenced pixel character, enemies, chair, and summon.
- `src/scenes.mjs`: pixel room, arena tiles, story scenes, and bitmap title.
- `tests/game.test.mjs`: deterministic simulation checks.
- `assets/negro-gamer.png`: user-supplied character illustration.

To share a link later, publish this directory on a static host. No deployment or public upload is performed by the local server command.
