import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The selection screen module had a runtime ReferenceError: it referenced
// drawWarrior in its body without importing it, every sprite call threw in
// the browser, and the canvas stayed empty. This pins every sprite renderer
// referenced by app.mjs to an explicit import from sprites.mjs.
const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const sprites = readFileSync(new URL('../src/sprites.mjs', import.meta.url), 'utf8');

test('app.mjs imports every sprite renderer it references', () => {
  const spritesExport = [...sprites.matchAll(/export function (\w+)/g)].map(match => match[1]);
  assert.ok(spritesExport.includes('drawWarrior'), 'sprites.mjs still exports drawWarrior');
  const importLine = app.match(/import \{([^}]*)\} from '\.\/sprites\.mjs';/);
  assert.ok(importLine, 'app.mjs imports sprites.mjs by name');
  const imported = importLine[1].split(',').map(name => name.trim());
  // every sprite renderer used somewhere in the body must be in the import
  for (const name of spritesExport) {
    const referenced = new RegExp(`\\b${name}\\(`).test(app.replace(importLine[0], ''));
    if (referenced) {
      assert.ok(imported.includes(name), `app.mjs body references ${name}() and must import it`);
    }
  }
  assert.match(app, /typeof effect\.text !== 'string'\) continue/, 'non-text effects must never be passed to fillText as undefined');
  for (const name of ['drawSmokeCloud', 'drawShroomBlast', 'drawAstralAura']) {
    assert.ok(imported.includes(name), `app.mjs must import ${name} for Warrior's visual effects`);
  }
  const updateHud = app.slice(app.indexOf('function updateHUD()'), app.indexOf('function rounded('));
  const drawLoop = app.slice(app.indexOf('function draw()'), app.indexOf('function frame('));
  assert.doesNotMatch(updateHud, /drawAstralAura/, 'HUD updates have no canvas context and must not render');
  assert.match(drawLoop, /drawAstralAura\(/, 'the active astral aura renders inside the canvas draw loop');
  assert.match(app, /<b>\+350%<\/b><small>DAÑO POR BOMBA/, 'Warrior profile reflects the bomb damage');
  assert.match(app, /<b>\+200%<\/b><small>ALCANCE/, 'Warrior profile reflects the reach buff');
  assert.match(app, /<b>0,6<\/b><small>HONGOS\/SEGUNDO/, 'Warrior profile reflects the slower bomb cadence');
});

test('Papazito contract: merchant menu pauses the run and the sold monitor vignette lives in the draw loop', () => {
  const updateHud = app.slice(app.indexOf('function updateHUD()'), app.indexOf('function rounded('));
  const drawLoop = app.slice(app.indexOf('function draw()'), app.indexOf('function frame('));
  const frame = app.slice(app.indexOf('function frame('), app.indexOf('document.addEventListener(\'click\''));
  assert.match(app, /state\.sellMenuOpen \? 'sellMenu'/, 'the overlay has its own merchant phase');
  assert.match(app, /data-sale=/, 'the merchant cards are real buttons');
  assert.match(frame, /!state\.paused && !state\.sellMenuOpen/, 'the run steps stop while the merchant menu is open');
  assert.match(updateHud, /state\.sellMenuOpen/, 'ability buttons disable while the merchant menu is open');
  assert.match(drawLoop, /sellVisionTtl/, 'the sold monitor vignette renders inside the draw loop');
  assert.match(app, /'PAPAZITO'/, 'the selection stage can name Papazito');
});

// T1 (app split): the shell's shared mutable state must live in one module so
// screens, HUD, overlays and the loop never own hidden module-scope bindings
// again. Consumers stay in app.mjs for now; only the storage moved.
const stateModule = readFileSync(new URL('../src/app/state.mjs', import.meta.url), 'utf8');

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
