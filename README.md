# Discord Survivors — La última partida

A playable pixel-art browser prototype based on the supplied Discord Survivors concept. Start → select a survivor → three short story scenes → survive three waves → defeat the Administrator in wave four. Solago unlocks after the first map is won.

## Play locally

From this directory, run:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open **http://localhost:5173** in a current browser. No build, package install, account, or backend is required. Serve the directory over HTTP rather than opening `index.html` directly; the game uses JavaScript modules.

### Narrative development viewer

Open **http://localhost:5173/?dev=narrative** to select, play, restart and skip standalone scenes without playing any waves. **Enter/Space** advances dialogue and **Escape** skips a scene. Preview state is isolated and never writes character unlocks. Choose **Act 4 preview: Warrior rescue (placeholder art)** to see the approved rescue dialogue with sample sprite staging. Other samples are noncanonical; all portrait/prop art is provisional. Normal gameplay has no preview scenes bound by default.

Scenes live individually in `assets/narrative/scenes/`, with speaker/expression resources in `assets/narrative/characters.json`. Both portrait conversations and sprite/camera sequences use the separate `src/narrative/` module. See [scene authoring and extension instructions](docs/narrative-authoring.md) for JSON actions, optional scene-local JavaScript, wave-boundary bindings, banter and verification.

Each world's scenery lives in `src/backgrounds/` and is selected per scene with `stage.background`; the story pages and the combat arena use the same registry. A world is painted once into an offscreen canvas and then blitted, so adding one costs nothing per frame. Open **http://localhost:5173/?dev=worlds** to see every world animating at full stage size, with the cast on it — pick a character and walk it with WASD or the arrow keys. See [World backgrounds](docs/narrative-authoring.md#world-backgrounds).

## Controls

| Action | Control |
| --- | --- |
| Move | WASD, arrow keys, or touch direction buttons |
| Attack | Automatic alternating remote, joystick, and phone shots; a shot locks its target in flight and vanishes if it dies, while a successful remote hit can bounce to up to two more enemies |
| Regenerate health | Stand still for two seconds |
| Modo Otaku | Q or the ability button; smaller eight-second waifu summon, eighteen-second cooldown |
| Me da paja | E or the ability button; six-second chair aura, twenty-five-second cooldown |
| Solago's Mordida de paleta | Automatic short-range melee attack |
| Sonrisa blindada | Automatic temporary defense boost |
| STAND: ¡LA PATRONA! | E or the ability button; Solago crouches and stays still while she attacks for seven seconds, then takes one scissors hit |
| Test-unlock characters | At the main menu press **Alt+Shift+U**; writes one global debug-unlock flag to local storage |
| Pause / resume | Escape or the pause / resume buttons |

Leaving the browser tab automatically pauses combat. Between waves, spend dropped currency on upgrades, heal at the delivery button, or continue without buying. Upgrades stack through several levels with rising prices; levels persist for the whole run. Surviving a wave gives twenty bonus currency. Defeat the Administrator to win; waiting out the final wave is not enough. Retry creates a fresh run.

The title menu supports Up/Down to choose and Enter to confirm. Open **CONTROLES** for the in-game control panel, or **SONIDO** for the music and effects levels and the mute switch; Escape closes either. Menus honour the system reduced-motion preference.

Solago's chore meter fills every eight kills. When full, it grants +30% damage and attack speed for eight seconds. **Alt+Shift+U** on the title screen sets one `debugUnlockAll` flag in the versioned local-storage record. The shared character-unlock check uses that same flag for every implemented character and future characters registered through it. Without the debug flag, normal map-one victory unlocks Solago. This is local browser progress, not account sync. The cheat only changes local storage; it does not edit the run or character data.

Solago plays as a short-range fighter: an animated palette-bite attack, a slightly extended melee reach and narrower hitbox, timed Smile Armor defense, and the E-key Patrona Stand ultimate with a scissors slash. Every eight kills fill the chore-task meter; the temporary buff starts automatically. While the Stand is active Solago crouches and cannot move; when it expires he takes a scissors hit but remains where the player left him.

## Papazito's economy

La Seña runs on a combat timer, not coin pickups. Each stage starts with a random bill of 8–12 coins due in 8–12 seconds. Each bill adds at least 4 coins to the next randomized charge and shortens the next interval by at least 1 second, down to a 4-second minimum. Random variation never makes a later bill cheaper or its interval longer. The HUD reveals the next exact bill and countdown, the last payment, and outstanding debt. An empty wallet does not cancel the bill: unpaid amounts accumulate as debt. Sales repay that debt before adding any remaining proceeds to the wallet, while still granting their temporary damage bonus and penalties. Debt, escalation and panic reset at the next stage; sold belongings remain sold for the run.

Every bill grants the existing five-second panic buff (+30% movement and a 40% shorter firing interval). Active sale penalties and their remaining time appear under the passive bar. **Q** opens the sale menu; **R** fires three rings of 48 bricks with a 40-second cooldown.

## Visual direction

The interface is a game screen, not a promotional website: a pixel-art room with El Negro in his chair, a local bitmap title, a sprite roster, illustrated story scenes, pixel-framed dialogs, and an arena HUD. There is no website navigation rail, promotional card grid, or footer. The combat camera is zoomed out 10% to show a slightly wider playfield, with proportionally adjusted movement and collision distances and crisp, modestly smaller sprites.

El Negro's sprite uses the supplied photographs and humorous references: broad yellow hoodie, dark hair tied back, glasses, facial hair, ear jewellery, and facial piercings. The same sprite appears in the room, roster, preview, story, and combat, with standing, walking, and seated poses. This is a first pixel-art interpretation, not a claim of final likeness approval.

Sprites are drawn with hard-edged rectangles on a pixelated canvas and enlarged without smoothing. Character selection and the menu use integer sprite scales. Combat has a 10% wider world view with proportionally scaled movement and physics distances.

The two silhouettes stay deliberately distinct at gameplay scale: El Negro is the broad, heavy tank, while Solago is roughly a fifth shorter and half as wide, with thin arms, a narrow tee, short legs, and a large head that carries his overbite. Both share the same ground line, so the height difference reads instead of hiding behind an offset.

## Prototype boundaries

- El Negro is the starter. Solago is the second playable character and unlocks after beating the first map. Other confirmed members remain unavailable placeholders until their kits are implemented.
- The three regular waves last 60 seconds each. The final boss wave has no time limit. This is a prototype format, not the proposed 15–20 minute final run.
- One arena, two normal enemy types, one boss, three attacks/abilities for El Negro and Solago, six stackable upgrades, and a repeatable delivery heal.
- Only character unlock progress and the audio settings (mute plus a music and an SFX level) are stored; there are no run saves, accounts, multiplayer, or additional worlds yet.
- Audio is one `AudioContext` with two buses: a music bed that opens its filter wave by wave, and a polyphonic SFX bus the narrative shares. The Act 1 music is a provisional 32-second demo, lapped with a short crossfade; see `docs/audio.md`.
- The gamer volley alternates between a TV remote, joystick, and cellphone. Each shot locks onto its first target and disappears if that enemy dies before impact, instead of homing toward an unrelated enemy. A landed hit can still bounce through up to two more targets. The smaller, long-haired waifu companion has her own layered hairstyle, outfit, and pixel-art silhouette.
- The anime summon is a smaller, detailed pixel-art companion with its own outfit and long lilac hair.
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

The deterministic engine tests cover movement, the stationary passive, automatic attacks, 60-second waves, stacking upgrade levels and prices, the delivery heal, abilities, death/retry, and the final boss victory condition. The engine takes an injectable random function and has no browser dependency.

An optional browser smoke check is available when Playwright and its Chromium browser are installed in your test environment. With the local server running:

```sh
node tests/browser-smoke.mjs
node tests/pixel-ui.mjs
node tests/shop-ui.mjs
node tests/solago-unlock-ui.mjs
```

For a separate test-tools installation, set `PLAYWRIGHT_MODULE` to the absolute path of Playwright's `index.mjs` and optionally `CHROMIUM_PATH` to an existing Chromium executable. `GAME_URL` overrides the local URL. The Solago browser check exercises the debug shortcut, character selection, melee HUD, Stand ability and local-storage persistence. The other checks cover desktop/mobile navigation, combat, pixel-art presentation and shop progression.

## Files

- `index.html`, `styles.css`: shell, responsive layout, and presentation.
- `src/app.mjs`: screen navigation, input, rendering, pause, and HUD.
- `src/engine.mjs`: combat, waves, currency, and upgrades.
- `src/progression.mjs`: versioned local-storage unlock state and debug unlock flag.
- `src/sprites.mjs`: photo-referenced pixel character, enemies, chair, and summon.
- `src/scenes.mjs`: pixel room, arena tiles, story scenes, and bitmap title.
- `tests/game.test.mjs`: deterministic simulation checks.
- `tests/balance.test.mjs`: wave length, stacking economy, delivery heal, and survival bonus.
- `tests/shop-ui.mjs`: accelerated desktop/mobile shop and purchase flow.
- `tests/solago.test.mjs`, `tests/progression.test.mjs`, `tests/solago-unlock-ui.mjs`: Solago mechanics, save gating, and test unlock.
- `art/solago-pixel-concept.png`: visual reference for Solago and the Patrona; in-game sprites are drawn procedurally and do not load this preview.
- `assets/negro-gamer.png`: user-supplied character illustration.

To share a link later, publish this directory on a static host. No deployment or public upload is performed by the local server command.
