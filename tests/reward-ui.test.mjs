import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { awardXP, nextLevelXP } from '../src/run-rewards.mjs';
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

test('the boss shop continues to the next world and death still only offers replay', async () => {
  const { PLAYABLE_ACTS } = await import('../src/campaign/acts.mjs');
  for (const [index, act] of PLAYABLE_ACTS.entries()) {
    const run = createRun(() => 0.5, 'negro', {}, act);
    run.phase = 'shop';
    run.worldCleared = true;
    run.time = run.duration;
    step(run, 0, {});
    const html = render(run);
    assert.match(html, /data-action="next-act"/, 'the shop hands over to the trip');
    assert.match(html, /EL BOTÍN ES TUYO/);
    if (index < 4) {
      assert.match(html, /SIGUIENTE MUNDO/);
      // The destination is announced on arrival, not inside the button.
      assert.ok(!html.includes(PLAYABLE_ACTS[index + 1].title));
    } else {
      // The campaign's last world stops there until a second clear opens the
      // epilogue, and the epilogue itself cannot be reached from a first run.
      assert.match(html, /TERMINAR CAMPAÑA/, `${act.id} has nowhere to continue on a first run`);
    }
    run.phase = 'dead';
    const dead = render(run);
    assert.doesNotMatch(dead, /data-action="next-act"/);
    assert.match(dead, /data-action="restart-campaign"/, 'death restarts the campaign from the first world');
    assert.doesNotMatch(dead, /data-action="play"/, 'death never replays the world it died in');
  }

  // The second ending is the one that hands the campaign over to the epilogue.
  const store = new Map([['discord-survivors.progress.v1', JSON.stringify({ version: 2, campaignClears: 2 })]]);
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  try {
    const finale = createRun(() => 0.5, 'negro', {}, PLAYABLE_ACTS.find(act => act.id === 'act-05'));
    finale.phase = 'shop';
    finale.worldCleared = true;
    finale.time = finale.duration;
    step(finale, 0, {});
    const html = render(finale);
    assert.match(html, /VOLVER AL DISCORD/, 'the epilogue is what the second ending opens');
    assert.ok(!html.includes(PLAYABLE_ACTS.find(act => act.id === 'act-06').title), 'still announced on arrival');
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

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
  awardXP(run, 29); endWave(run);
  const coins = run.coins;
  render(run);
  assert.equal(ids('level').length, 4);
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
  awardXP(run, 29); endWave(run); render(run);
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
  assert.match(box.innerHTML, /Defensa: 3 → 15/);
  assert.match(box.innerHTML, /0\/1/);
  assert.equal(run.player.defense, 0.15, 'a preview never mutates the sheet');
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

test('the rendered healing service charges its price and restores health', async () => {
  const { HEAL_COST, HEAL_AMOUNT } = await import('../src/engine.mjs');
  const run = createRun(() => 0.5);
  endWave(run);
  run.coins = 100;
  run.player.hp = 20;
  render(run);
  assert.match(box.innerHTML, /data-heal/, 'the shop paints the healing control');
  // The attribute carries no value, so the handler must act on its presence:
  // `dataset.heal` is an empty string, which is false like a missing one.
  assert.equal(activate(run, { heal: '' }), true);
  assert.equal(run.player.hp, 20 + HEAL_AMOUNT);
  assert.equal(run.coins, 100 - HEAL_COST);
  run.player.hp = run.player.maxHp;
  const before = JSON.stringify(run);
  assert.equal(activate(run, { heal: '' }), false, 'a full bar refuses the service');
  assert.equal(JSON.stringify(run), before);
  run.player.hp = 40;
  run.coins = HEAL_COST - 1;
  assert.equal(activate(run, { heal: '' }), false, 'a thin purse refuses the service');
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
  awardXP(run, nextLevelXP(run, 1)); endWave(run); render(run);
  assert.match(box.innerHTML, /RANGO 1\/1/);
  assert.equal(activate(run, { level: ids('level')[0] }), true);
  assert.equal(run.levelRanks.constructor, 1);
  assert.equal(run.player.damage, 23.76);
});
