import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Sprite renderer pinning: the selection screen module once referenced
// drawWarrior without importing it, every sprite call threw in the browser,
// and the canvas stayed empty. Every module that draws — the app composer and
// the game renderer — must import each sprite renderer it references.
const read = rel => readFileSync(new URL(rel, import.meta.url), 'utf8');
const app = read('../src/app.mjs');
const sprites = read('../src/sprites.mjs');
const hud = read('../src/game/hud.mjs');
const overlays = read('../src/game/overlays.mjs');
const renderer = read('../src/game/renderer.mjs');
const home = read('../src/screens/home.mjs');
const storyScreen = read('../src/screens/story.mjs');
const charactersScreen = read('../src/screens/characters.mjs');
const gameScreen = read('../src/screens/game.mjs');
const stateModule = read('../src/app/state.mjs');
const registry = read('../src/characters/index.mjs');
const progression = read('../src/progression.mjs');
const FICHAS = [
  ['negro', read('../src/characters/negro.mjs')],
  ['solago', read('../src/characters/solago.mjs')],
  ['warrior', read('../src/characters/warrior.mjs')],
  ['papazito', read('../src/characters/papazito.mjs')],
];

const spritesExport = [...sprites.matchAll(/export function (\w+)/g)].map(match => match[1]);
const DRAWING_MODULES = [
  ['app.mjs', app],
  ['screens/home.mjs', home],
  ['screens/story.mjs', storyScreen],
  ['screens/characters.mjs', charactersScreen],
  ['screens/game.mjs', gameScreen],
  ['game/renderer.mjs', renderer],
];

const pinSpriteImports = (module, importLine, label) => {
  assert.ok(importLine, `${label} imports sprites.mjs by name`);
  const imported = importLine[1].split(',').map(name => name.trim());
  for (const name of spritesExport) {
    const referenced = new RegExp(`\\b${name}\\(`).test(module.replace(importLine[0], ''));
    if (referenced) {
      assert.ok(imported.includes(name), `${label} body references ${name}() and must import it`);
    }
  }
  return imported;
};

test('every module that draws imports every sprite renderer it references', () => {
  assert.ok(spritesExport.includes('drawWarrior'), 'sprites.mjs still exports drawWarrior');
  for (const [label, source] of DRAWING_MODULES) {
    const importLine = source.match(/import \{([^}]*)\} from '\.\.?\/sprites\.mjs';/);
    if (!importLine) {
      for (const name of spritesExport) {
        assert.doesNotMatch(source, new RegExp(`\\b${name}\\(`), `${label} references ${name}() but never imports it`);
      }
      continue;
    }
    pinSpriteImports(source, importLine, label);
  }
});

test('fichas own their selection profile block and preview pose', () => {
  for (const [id, ficha] of FICHAS) {
    assert.match(ficha, /  label: '/, `${id} ficha exposes the roster card label`);
    assert.match(ficha, /  detailLabel: '/, `${id} ficha exposes the detail panel name`);
    assert.match(ficha, /  previewAria: '/, `${id} ficha describes its own preview canvas`);
    assert.match(ficha, /  profile: `/, `${id} ficha owns its profile HTML block`);
    assert.match(ficha, /  rosterPose: \{ x: \d+, y: \d+ \}/, `${id} ficha carries its roster pose`);
    assert.match(ficha, /  drawRoster\(ctx\)/, `${id} ficha draws its roster portrait`);
    assert.match(ficha, /  preview\(ctx, \{ time, cycle \}\)/, `${id} ficha animates its own preview`);
  }
  const warrior = FICHAS.find(([id]) => id === 'warrior')[1];
  assert.match(warrior, /<b>\+350%<\/b><small>DAÑO POR BOMBA/, 'Warrior profile reflects the bomb damage');
  assert.match(warrior, /<b>\+200%<\/b><small>ALCANCE/, 'Warrior profile reflects the reach buff');
  assert.match(warrior, /<b>0,6<\/b><small>HONGOS\/SEGUNDO/, 'Warrior profile reflects the slower bomb cadence');
  assert.match(registry, /export const ROSTER = \[/, 'the registry exports the card order');
  assert.match(progression, /export const UNLOCK_CHAIN = \[/, 'progression owns the unlock chain ids');
});

test('the selection screen and victory overlay are fully data-driven', () => {
  for (const id of ['negro', 'solago', 'warrior', 'papazito']) {
    assert.doesNotMatch(charactersScreen, new RegExp(`\\b${id}\\b`), `characters.mjs must not hardcode ${id}`);
    assert.doesNotMatch(overlays, new RegExp(`unlocked${id[0].toUpperCase()}${id.slice(1)}`), `overlays must not hardcode the ${id} unlock flag`);
  }
  assert.doesNotMatch(charactersScreen, /Warrior|Solago|Papazito/, 'characters.mjs renders from the fichas, never from per-character ternaries');
  assert.match(charactersScreen, /getCharacter\(state\.selectedCharacter\)/, 'the selected ficha drives the panel');
  assert.match(overlays, /victoryLine/, 'the won screen reads the ficha victory line');
});

test('Papazito contract: merchant menu pauses the run and the sold monitor vignette lives in the draw loop', () => {
  const frame = app.slice(app.indexOf('function frame('), app.indexOf('document.addEventListener(\'click\''));
  assert.match(overlays, /state\.sellMenuOpen \? 'sellMenu'/, 'the overlay has its own merchant phase');
  assert.match(overlays, /data-sale=/, 'the merchant cards are real buttons');
  assert.match(frame, /!state\.paused && !state\.sellMenuOpen/, 'the run steps stop while the merchant menu is open');
  assert.match(hud, /state\.sellMenuOpen/, 'ability buttons disable while the merchant menu is open');
  assert.match(renderer, /sellVisionTtl/, 'the sold monitor vignette renders inside the draw loop');
});

test('renderer.mjs owns the canvas draw loop: sprite imports, text guard, aura and vignette', () => {
  const imported = pinSpriteImports(renderer, renderer.match(/import \{([^}]*)\} from '\.\.\/sprites\.mjs';/), 'renderer.mjs');
  for (const name of ['drawSmokeCloud', 'drawShroomBlast', 'drawAstralAura']) {
    assert.ok(imported.includes(name), `renderer.mjs must import ${name} for Warrior's visual effects`);
  }
  assert.match(renderer, /typeof effect\.text !== 'string'\) continue/, 'non-text effects must never be passed to fillText as undefined');
  assert.doesNotMatch(hud, /drawAstralAura/, 'HUD updates have no canvas context and must not render');
  assert.match(renderer, /drawAstralAura\(/, 'the active astral aura renders inside the canvas draw loop');
});

test('the game trio lives in src/game/* and app only consumes it', () => {
  assert.match(hud, /export function updateHUD/, 'hud.mjs exports updateHUD');
  assert.match(overlays, /export function overlay/, 'overlays.mjs exports overlay');
  assert.match(renderer, /export function draw/, 'renderer.mjs exports draw');
  assert.match(app, /import \{ updateHUD \} from '\.\/game\/hud\.mjs';/, 'app consumes the hud module');
  assert.match(app, /import \{ overlay \} from '\.\/game\/overlays\.mjs';/, 'app consumes the overlays module');
  assert.match(app, /import \{ draw \} from '\.\/game\/renderer\.mjs';/, 'app consumes the renderer draw');
  assert.match(charactersScreen, /import \{ rounded \} from '\.\.\/game\/renderer\.mjs';/, 'the selection preview consumes the renderer helpers');
  assert.doesNotMatch(app, /\bfunction (updateHUD|overlay)\b/, 'app.mjs no longer owns the hud/overlay bodies');
  assert.doesNotMatch(app, /\bfunction draw\b/, 'app.mjs no longer owns the draw body');
});

test('screens live in src/screens/* and the composer only wires them', () => {
  for (const [file, symbol] of [
    ['home.mjs', 'home'], ['home.mjs', 'controls'], ['home.mjs', 'closeControls'],
    ['story.mjs', 'story'], ['characters.mjs', 'characters'], ['characters.mjs', 'drawPreview'],
    ['game.mjs', 'game'],
  ]) {
    const source = read(`../src/screens/${file}`);
    assert.match(source, new RegExp(`export function ${symbol}\\b`), `src/screens/${file} exports ${symbol}`);
  }
  assert.match(app, /import \{ home, controls, closeControls \} from '\.\/screens\/home\.mjs';/, 'app wires the home screen');
  assert.match(app, /import \{ story \} from '\.\/screens\/story\.mjs';/, 'app wires the story screen');
  assert.match(app, /import \{ characters, drawPreview \} from '\.\/screens\/characters\.mjs';/, 'app wires the selection screen');
  assert.match(app, /import \{ game \} from '\.\/screens\/game\.mjs';/, 'app wires the arena DOM builder');
  assert.doesNotMatch(app, /\bfunction (home|story|characters|game|drawPreview|controls|closeControls)\b/, 'app.mjs no longer owns the screen DOM builders');
});

// T1 (app split): the shell's shared mutable state must live in one module so
// screens, HUD, overlays and the loop never own hidden module-scope bindings
// again. Consumers stay in app.mjs for now; only the storage moved.
test('the composer references DOM shell access only through state', () => {
  assert.doesNotMatch(app, /\.\.\.content\b/, 'the bare content binding died with the T1 move; shell access must go through state.content');
  assert.doesNotMatch(app, /(?<![\w.$])content\./, 'no bare content binding may survive the T1 move');
});

test('the shared shell state lives in src/app/state.mjs and app consumes it', () => {
  assert.match(stateModule, /export const state = \{/, 'state.mjs exports a single shared state object');
  for (const slot of [
    'content', 'keys', 'screen', 'storyPage', 'run', 'paused', 'sellMenuOpen',
    'lastFrame', 'lastPhase', 'hudElapsed', 'facing', 'selectedCharacter',
    'solagoUnlocked', 'warriorUnlocked', 'papazitoUnlocked', 'debugUnlockAll', 'reducedMotion',
  ]) {
    assert.match(stateModule, new RegExp(`\\b${slot}:`), `state.mjs declares the ${slot} slot`);
  }
  assert.match(app, /import \{ state \} from '\.\/app\/state\.mjs';/, 'app.mjs imports the shared state');
  for (const slot of ['screen', 'storyPage', 'run', 'paused', 'sellMenuOpen', 'lastFrame', 'lastPhase', 'hudElapsed', 'facing', 'selectedCharacter', 'solagoUnlocked', 'warriorUnlocked', 'papazitoUnlocked', 'debugUnlockAll', 'reducedMotion']) {
    assert.doesNotMatch(app, new RegExp(`^(let|const) ${slot}\\b`, 'm'), `app.mjs no longer owns the ${slot} binding`);
  }
  const shellUses = [...app.matchAll(/\bstate\.(run|paused|screen|keys|content)\b/g)].length;
  assert.ok(shellUses >= 20, `app.mjs routes shell access through state.x (found ${shellUses})`);
});
