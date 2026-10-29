import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { awardXP } from '../src/run-rewards.mjs';
import { createCatalog } from '../src/reward-catalog.mjs';
import { handleRewardAction } from '../src/game/reward-actions.mjs';
import { drawItemIcon, ILLUSTRATED_ITEMS } from '../src/game/item-icons.mjs';

const previousDocument = globalThis.document, previousWindow = globalThis.window;
const drawnArt = [];
const makeContext = () => ({ clearRect() {}, fillRect() {}, fillStyle: '', imageSmoothingEnabled: true });
const box = {
  innerHTML: '',
  querySelector: () => ({ focus() {} }),
  querySelectorAll: selector => selector !== 'canvas[data-art]' ? [] : [...box.innerHTML.matchAll(/data-art="([^"]+)"/g)]
    .map(match => ({ dataset: { art: match[1] }, width: 64, height: 64,
      getContext: () => { drawnArt.push(match[1]); return makeContext(); } })),
};
globalThis.document = { querySelector: selector => selector === '#game-overlay' ? box : null };
globalThis.window = { matchMedia: () => ({ matches: false }) };
const { state } = await import('../src/app/state.mjs');
const { overlay } = await import('../src/game/overlays.mjs');
after(() => {
  if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
});

function render(run) {
  state.run = run; state.paused = state.sellMenuOpen = false; state.lastPhase = '';
  overlay();
  return box.innerHTML;
}
function endWave(run) {
  run.spawnIn = 100; run.time = run.duration;
  step(run, 0, {});
}
const ids = attribute => [...box.innerHTML.matchAll(new RegExp(`data-${attribute}="([^"]+)"`, 'g'))].map(match => match[1]);
const activate = (run, dataset) => handleRewardAction(run, dataset, () => render(run));

test('shop renders exactly four stored items and a separate healing service without rerolling', () => {
  let calls = 0;
  const run = createRun(() => { calls++; return 0.5; });
  endWave(run); run.coins = 1000;
  render(run);
  const offers = ids('item'), generated = calls;
  assert.equal(offers.length, 4);
  assert.equal(new Set(offers).size, 4);
  assert.match(box.innerHTML, /Servicio de curación/);
  assert.deepEqual(ids('upgrade'), []);
  const item = run.rewardCatalog.items.find(entry => entry.id === offers[0]);
  assert.equal(activate(run, { item: offers[0] }), true);
  assert.equal(run.coins, 1000 - item.price);
  assert.deepEqual(ids('item'), offers);
  assert.match(box.innerHTML, /COMPRADO/);
  render(run);
  assert.equal(calls, generated);
  assert.deepEqual(ids('item'), offers);
});

test('rendered level controls advance consecutive choices and then show the shop', () => {
  const run = createRun(() => 0.5);
  awardXP(run, 50); endWave(run);
  const coins = run.coins;
  render(run);
  assert.equal(ids('level').length, 3);
  assert.match(box.innerHTML, /Nivel 2 · 2 elecciones pendientes/);
  assert.deepEqual(ids('item'), []);
  run.random = () => 0;
  assert.equal(activate(run, { level: ids('level')[0] }), true);
  assert.match(box.innerHTML, /Nivel 3 · 1 elección pendiente/);
  assert.match(box.innerHTML, /RANGO \d+\/\d+/);
  assert.equal(activate(run, { level: ids('level')[0] }), true);
  assert.equal(ids('level').length, 0);
  assert.equal(ids('item').length, 4);
  assert.equal(run.coins, coins);
});

test('rendered empty-choice continuation reaches an empty shop without blocking', () => {
  const catalog = createCatalog({ items: [], upgrades: [] });
  const run = createRun(() => 0.5, 'negro', { catalog });
  awardXP(run, 50); endWave(run); render(run);
  assert.match(box.innerHTML, /data-action="skip-level"/);
  assert.equal(activate(run, { action: 'skip-level' }), true);
  assert.equal(activate(run, { action: 'skip-level' }), true);
  assert.match(box.innerHTML, /No quedan objetos elegibles/);
  assert.match(box.innerHTML, /data-action="next-wave"/);
  assert.equal(run.level, 3);
  assert.deepEqual(run.levelRanks, {});
});

test('unaffordable rendered purchases reject without changing the run', () => {
  const run = createRun(() => 0.5);
  endWave(run); run.coins = 0; render(run);
  const before = JSON.stringify(run);
  assert.equal(activate(run, { item: ids('item')[0] }), false);
  assert.equal(JSON.stringify(run), before);
});

test('catalog text is escaped and the real capped-stat preview is visible', () => {
  const catalog = createCatalog({ upgrades: [], items: [{
    id: 'constructor', name: 'Armor <trial>', lore: '<img src=x>', price: 5, maxCopies: 1,
    modifiers: [{ stat: 'defense', operation: 'flat', value: 100 }],
  }] });
  const run = createRun(() => 0.5, 'negro', { catalog });
  endWave(run); render(run);
  assert.match(box.innerHTML, /Armor &lt;trial&gt;/);
  assert.match(box.innerHTML, /&lt;img src=x&gt;/);
  assert.ok(!box.innerHTML.includes('<img'));
  assert.match(box.innerHTML, /Defensa: 4 → 15/);
  assert.match(box.innerHTML, /0\/1/);
  assert.equal(run.player.defense, 0.2);
});

test('every shop offer paints its own item portrait on a canvas', () => {
  const run = createRun(() => 0.5);
  endWave(run);
  drawnArt.length = 0;
  render(run);
  const offers = ids('item');
  const art = [...box.innerHTML.matchAll(/data-art="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(art, offers, 'one canvas per offer, in order');
  assert.deepEqual(drawnArt, offers, 'each canvas is painted with its item art');
  for (const id of ['scissors', 'bleach', 'slipper', 'antidepressants', 'extortion-phone', 'magic-mushrooms', 'alcohol', 'chicken']) {
    const ctx = makeContext();
    drawItemIcon(ctx, id, 64);
    assert.ok(true, id);
  }
});

test('unknown item ids still paint the fallback crate instead of a blank card', () => {
  const ctx = makeContext();
  let painted = 0;
  ctx.fillRect = () => { painted += 1; };
  drawItemIcon(ctx, 'not-a-real-item', 64);
  assert.ok(painted > 0);
  assert.ok(!ILLUSTRATED_ITEMS.includes('not-a-real-item'));
});

test('valid catalog IDs matching object properties render and acquire their first rank', () => {
  const catalog = createCatalog({ items: [], upgrades: [{
    id: 'constructor', name: 'Example', characters: 'all', minLevel: 2, requires: [],
    ranks: [{ modifiers: [{ stat: 'attack', operation: 'percent', value: 10 }] }],
  }] });
  const run = createRun(() => 0, 'negro', { catalog });
  awardXP(run, 10); endWave(run); render(run);
  assert.match(box.innerHTML, /RANGO 1\/1/);
  assert.equal(activate(run, { level: ids('level')[0] }), true);
  assert.equal(run.levelRanks.constructor, 1);
  assert.equal(run.player.damage, 33);
});
