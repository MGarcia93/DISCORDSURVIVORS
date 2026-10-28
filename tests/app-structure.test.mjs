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
const stateModule = read('../src/app/state.mjs');

const spritesExport = [...sprites.matchAll(/export function (\w+)/g)].map(match => match[1]);

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

test('app.mjs imports every sprite renderer it references', () => {
  assert.ok(spritesExport.includes('drawWarrior'), 'sprites.mjs still exports drawWarrior');
  pinSpriteImports(app, app.match(/import \{([^}]*)\} from '\.\/sprites\.mjs';/), 'app.mjs');
  assert.match(app, /<b>\+350%<\/b><small>DAÑO POR BOMBA/, 'Warrior profile reflects the bomb damage');
  assert.match(app, /<b>\+200%<\/b><small>ALCANCE/, 'Warrior profile reflects the reach buff');
  assert.match(app, /<b>0,6<\/b><small>HONGOS\/SEGUNDO/, 'Warrior profile reflects the slower bomb cadence');
});

test('Papazito contract: merchant menu pauses the run and the sold monitor vignette lives in the draw loop', () => {
  const frame = app.slice(app.indexOf('function frame('), app.indexOf('document.addEventListener(\'click\''));
  assert.match(overlays, /state\.sellMenuOpen \? 'sellMenu'/, 'the overlay has its own merchant phase');
  assert.match(overlays, /data-sale=/, 'the merchant cards are real buttons');
  assert.match(frame, /!state\.paused && !state\.sellMenuOpen/, 'the run steps stop while the merchant menu is open');
  assert.match(hud, /state\.sellMenuOpen/, 'ability buttons disable while the merchant menu is open');
  assert.match(renderer, /sellVisionTtl/, 'the sold monitor vignette renders inside the draw loop');
  assert.match(app, /'PAPAZITO'/, 'the selection stage can name Papazito');
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
  assert.match(app, /import \{ draw, rounded \} from '\.\/game\/renderer\.mjs';/, 'app consumes the renderer module');
  assert.doesNotMatch(app, /\bfunction (updateHUD|overlay)\b/, 'app.mjs no longer owns the hud/overlay bodies');
  assert.doesNotMatch(app, /\bfunction draw\b/, 'app.mjs no longer owns the draw body');
});

// T1 (app split): the shell's shared mutable state must live in one module so
// screens, HUD, overlays and the loop never own hidden module-scope bindings
// again. Consumers stay in app.mjs for now; only the storage moved.
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
