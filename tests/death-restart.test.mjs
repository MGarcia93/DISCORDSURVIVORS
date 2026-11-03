import test from 'node:test';
import assert from 'node:assert/strict';

// Dying ends the campaign, it does not rewind one world: OTRA PARTIDA must start
// over in Mundo 01 with a fresh build. This boots the real app and clicks the
// real overlay button, because the oracle is the routing between the death panel
// and the shell, not the button markup alone.
function browser() {
  const handlers = new Map(), cache = new Map(), storage = new Map();
  const ctx = new Proxy({}, { get: () => () => 0, set: () => true });
  const element = selector => {
    if (cache.has(selector)) return cache.get(selector);
    const node = {
      dataset: {}, style: {}, disabled: false, hidden: false, innerHTML: '', textContent: '', isConnected: true,
      classList: { toggle() {}, add() {}, remove() {} },
      focus() {}, setPointerCapture() {}, click() {}, addEventListener() {},
      querySelector: key => element(`${selector} ${key}`), querySelectorAll: () => [],
      getContext: () => ctx, closest() { return this; },
    };
    cache.set(selector, node); return node;
  };
  globalThis.document = {
    querySelector: element, querySelectorAll: () => [], activeElement: null, hidden: false,
    body: { classList: { toggle() {} } },
    addEventListener(name, callback) { const list = handlers.get(name) ?? []; list.push(callback); handlers.set(name, list); },
  };
  globalThis.window = {
    matchMedia: () => ({ matches: false }), scrollTo() {},
    addEventListener(name, callback) { handlers.set(`window:${name}`, [callback]); },
  };
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  globalThis.requestAnimationFrame = () => 0;
  const dispatch = (name, data) => { for (const handler of handlers.get(name) ?? []) handler({ preventDefault() {}, repeat: false, ...data }); };
  return {
    click(action, dataset = {}) { dispatch('click', { target: { closest: () => ({ disabled: false, dataset: { action, ...dataset } }) } }); },
    node: selector => element(selector),
  };
}

const dom = browser();
await import('../src/app.mjs');
const { state } = await import('../src/app/state.mjs');
const { overlay } = await import('../src/game/overlays.mjs');
const { createRun } = await import('../src/engine.mjs');
const { PLAYABLE_ACTS } = await import('../src/campaign/acts.mjs');
const { narrative } = await import('../src/narrative/integration.mjs');

// Entering the arena attaches the narrative host, and a host waiting on its
// catalog swallows every click. An empty catalog keeps the scenes out of a test
// about the death panel.
narrative.load = async () => ({ characters: {}, sounds: {}, entries: [], bindings: [] });
narrative.makeView = () => ({ render() {}, dispose() {} });
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

const box = dom.node('#game-overlay');
const render = () => { state.lastPhase = ''; overlay(); return box.innerHTML; };

test('dying mid-campaign restarts the campaign in Mundo 01 with a fresh build', async () => {
  const third = PLAYABLE_ACTS[2];
  assert.equal(third.id, 'act-03', 'the test dies far enough into the campaign to tell the difference');
  const spent = createRun(() => 0.5, 'warrior', {}, third);
  // The run that died carries what the campaign gave it: world, wave and build.
  Object.assign(spent, { wave: 4, level: 9, xp: 12, coins: 120, kills: 400, items: { psp: 1 } });
  spent.phase = 'dead';
  state.run = spent;
  state.selectedCharacter = 'warrior';
  state.selectedAct = third.id;

  const html = render();
  assert.match(html, /data-action="restart-campaign"/, 'death offers a campaign restart');
  assert.match(html, /Mundo 01/, 'the panel says where the run starts again');
  assert.doesNotMatch(html, /data-action="play"/, 'death never replays the world it died in');

  dom.click('restart-campaign');
  await settle();

  assert.equal(state.screen, 'game');
  assert.notEqual(state.run, spent, 'a brand-new run, not the spent one');
  assert.equal(state.run.act.id, PLAYABLE_ACTS[0].id, 'back to the first world');
  assert.equal(state.run.wave, 1);
  assert.equal(state.run.level, 1);
  assert.equal(state.run.xp, 0);
  assert.equal(state.run.coins, 0);
  assert.deepEqual(state.run.items, {});
  assert.deepEqual(state.run.levelRanks, {});
  assert.equal(state.run.player.hp, state.run.player.maxHp, 'full life, no leftovers');
  assert.equal(state.run.character, 'warrior', 'the chosen character is kept');
  assert.equal(state.selectedAct, PLAYABLE_ACTS[0].id, 'the world picker follows the restart');
});

test('a cleared campaign still replays the world it ended on', async () => {
  const last = PLAYABLE_ACTS[4];
  const finale = createRun(() => 0.5, 'negro', {}, last);
  finale.phase = 'won';
  state.run = finale;
  state.selectedAct = last.id;

  const html = render();
  assert.match(html, /data-action="play"/, 'the ending keeps its replay button');
  assert.doesNotMatch(html, /data-action="restart-campaign"/);

  dom.click('play');
  await settle();
  assert.equal(state.run.act.id, last.id, 'a cleared campaign replays its own world');
  assert.equal(state.run.wave, 1);
});
