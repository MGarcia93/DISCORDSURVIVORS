import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, sellBelonging } from '../src/engine.mjs';

test('Papazito passive bar shows readiness, cooldown progress and active panic', () => {
  const p = createRun(() => 0.5, 'papazito').player;
  const def = p.characterDef;
  assert.deepEqual(def.taskHud(p), { percentage: 0, label: '10 ◈ · 10s', active: false });
  p.senaCooldown = 10;
  p.panicTtl = 5;
  assert.deepEqual(def.taskHud(p), { percentage: 0, label: '10 ◈ · 10s', active: true });
  assert.match(def.statusHud(p), /PÁNICO · 5s/);
  p.senaCooldown = 5;
  p.panicTtl = 0;
  assert.deepEqual(def.taskHud(p), { percentage: 50, label: '10 ◈ · 5s', active: false });
  p.senaCooldown = 0;
  assert.deepEqual(def.taskHud(p), { percentage: 100, label: '10 ◈ · 0s', active: false });
});

test('arena labels Papazito passive bar without changing Solago panel', async () => {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const nodes = new Map();
  const getNode = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { style: {}, classList: { toggle() {} }, querySelector: () => ({ focus() {} }) });
    return nodes.get(selector);
  };
  globalThis.document = { querySelector: getNode };
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  const { state } = await import('../src/app/state.mjs');
  const { game } = await import('../src/screens/game.mjs');
  const { updateHUD } = await import('../src/game/hud.mjs');
  const { overlay } = await import('../src/game/overlays.mjs');
  const previousContent = state.content;
  const previousCharacter = state.selectedCharacter;
  const previousRun = state.run;
  const previousSellMenu = state.sellMenuOpen;
  const previousPhase = state.lastPhase;
  state.content = { innerHTML: '' };
  try {
    state.selectedCharacter = 'papazito';
    game();
    assert.match(state.content.innerHTML, /<b>LA SEÑA<\/b>/);
    assert.match(state.content.innerHTML, /class="task-panel" ><div>/);
    state.run.player.senaDebt = 30;
    sellBelonging(state.run, 'psp');
    updateHUD();
    assert.match(getNode('#character-status').textContent, /DEUDA: 10 ◈/);
    assert.match(getNode('#character-status').textContent, /−15% VELOCIDAD · 10s/);
    assert.match(getNode('#task-label').textContent, /◈ · \d+s/);
    state.sellMenuOpen = true;
    state.lastPhase = '';
    overlay();
    assert.match(getNode('#game-overlay').innerHTML, /10 fichas a deuda · 15 fichas disponibles/);
    state.sellMenuOpen = false;
    state.selectedCharacter = 'solago';
    game();
    assert.match(state.content.innerHTML, /<b>PERMISO PARA JUGAR<\/b>/);
    assert.match(state.content.innerHTML, /class="character-status" hidden/);
    assert.equal(getNode('#character-status').textContent, '');
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    state.content = previousContent;
    state.selectedCharacter = previousCharacter;
    state.run = previousRun;
    state.sellMenuOpen = previousSellMenu;
    state.lastPhase = previousPhase;
  }
});
