import test from 'node:test';
import assert from 'node:assert/strict';

// The lab used to borrow the campaign's exits: clear a wave and the shop offered
// the next one, die and the run restarted the campaign. A lab run now carries
// its own flag, so the overlays offer repeat and back to the build screen. This
// boots the real app and clicks the real actions, because the oracle is the
// routing between the overlay and the shell, not the button markup alone.
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
const { step } = await import('../src/engine.mjs');
const { PLAYABLE_ACTS } = await import('../src/campaign/acts.mjs');
const { seedRun } = await import('../src/game/balance-seed.mjs');
const { narrative } = await import('../src/narrative/integration.mjs');

// The lab run still attaches the narrative host, and a host waiting on its
// catalog swallows every click. An empty catalog keeps the scenes out of a test
// about the shop and the pause menu.
narrative.load = async () => ({ characters: {}, sounds: {}, entries: [], bindings: [] });
narrative.makeView = () => ({ render() {}, dispose() {} });

// Entering the arena attaches the host, which resolves its load in a microtask:
// the first interaction of a screen happens after that.
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

const box = dom.node('#game-overlay');
const render = () => { state.lastPhase = ''; overlay(); return box.innerHTML; };
const endWave = run => { run.spawnIn = 100; run.time = run.duration; step(run, 0, {}); };

async function openLab({ wave = 2, picks = {}, items = {} } = {}) {
  state.balanceCharacter = 'negro';
  state.balanceAct = PLAYABLE_ACTS[0].id;
  state.balanceWave = wave;
  state.balancePicks = picks;
  state.balanceItems = items;
  dom.click('balance-play');
  await settle();
}

test('a lab run is flagged, never a campaign run', async () => {
  const { createRun } = await import('../src/engine.mjs');
  const { run } = seedRun({ act: PLAYABLE_ACTS[0], wave: 2, random: () => 0.5 });
  assert.equal(run.lab, true);
  assert.notEqual(createRun(() => 0.5).lab, true);
});

test('clearing a lab wave repeats or returns instead of advancing the campaign', async () => {
  await openLab({ wave: 2 });
  assert.equal(state.screen, 'game');
  assert.equal(state.run.lab, true);
  assert.equal(state.run.wave, 2);
  endWave(state.run);
  assert.equal(state.run.phase, 'shop', 'the wave really reached the shop');
  await settle();
  const html = render();
  assert.match(html, /EL BOTÍN ES TUYO/);
  assert.match(html, /data-action="balance-repeat"/);
  assert.match(html, /data-action="balance-back"/);
  assert.doesNotMatch(html, /data-action="next-wave"/, 'a lab shop never offers the next wave');
  assert.doesNotMatch(html, /data-action="next-act"/);
  assert.match(html, /se tira al salir/, 'the shop says its purchases are thrown away');
});

test('repeat re-seeds the same wave with the lab build', async () => {
  await openLab({ wave: 3 });
  const first = state.run;
  endWave(first);
  await settle();
  dom.click('balance-repeat');
  await settle();
  assert.equal(state.screen, 'game');
  assert.equal(state.run.lab, true);
  assert.equal(state.run.wave, 3, 'the repeated wave is the one being measured');
  assert.equal(state.run.phase, 'playing');
  assert.notEqual(state.run, first, 'repeat is a fresh run, not the spent one');
  assert.equal(state.run.player.hp, state.run.player.maxHp);
});

test('dying in the lab offers repeat and back, never another campaign run', async () => {
  await openLab({ wave: 2 });
  state.run.phase = 'dead';
  const html = render();
  assert.match(html, /data-action="balance-repeat"/);
  assert.match(html, /data-action="balance-back"/);
  assert.doesNotMatch(html, /data-action="play"/);
  assert.doesNotMatch(html, /data-action="home"/);
});

test('pausing a lab wave is a way back to the build screen', async () => {
  await openLab({ wave: 4 });
  state.paused = true;
  const html = render();
  state.paused = false;
  assert.match(html, /data-action="balance-back"/);
  assert.match(html, /Laboratorio de balance/);
});

test('back reopens the lab and keeps the build, not the spent run', async () => {
  await openLab({ wave: 2, picks: { 'stat-attack': 1 }, items: {} });
  const ranks = state.run.levelRanks;
  assert.ok(Object.values(ranks).some(rank => rank > 0), 'the seeded run carries the picked build');
  dom.click('balance-back');
  await settle();
  assert.equal(state.screen, 'balance');
  assert.equal(state.run, null);
  assert.deepEqual(state.balancePicks, { 'stat-attack': 1 }, 'the build survives the trip back');
  assert.equal(state.balanceWave, 2);
});

test('a lab run skips the cinematics by default, a campaign run still plays them', async () => {
  let loads = 0;
  const catalog = () => { loads++; return { characters: {}, sounds: {}, entries: [], bindings: [] }; };
  narrative.load = async () => catalog();

  state.balanceCinematics = false;
  await openLab({ wave: 2 });
  assert.equal(loads, 0, 'the lab never even asks for the narrative catalog');
  assert.equal(narrative.blocked, false, 'no scene owns the screen of a lab wave');

  loads = 0;
  dom.click('play');
  await settle();
  assert.equal(loads, 1, 'a normal run still attaches the story');
});

test('the lab can switch the cinematics on for the wave it is measuring', async () => {
  let loads = 0;
  const waveScene = {
    characters: { guide: { name: 'Guide', sprite: 'negro', expressions: { neutral: 'sample.svg' } } }, sounds: {},
    entries: [{ id: 'lab-wave', actions: {}, scene: { id: 'lab-wave', steps: [{ type: 'dialogue', lines: [{ speaker: 'guide', text: 'Two thousand hours' }] }] } }],
    bindings: [{ when: 'before_wave', wave: 2, scene: 'lab-wave' }],
  };
  narrative.load = async () => { loads++; return waveScene; };

  state.balanceCinematics = true;
  await openLab({ wave: 2 });
  assert.equal(loads, 1, 'the toggle asks for the act catalog the wave belongs to');
  assert.equal(narrative.director?.player?.scene.id, 'lab-wave', 'the scene bound to that wave opens on it');
  assert.equal(narrative.blocked, true, 'the wave waits for the scene like a campaign wave does');
  assert.ok(narrative.director?.seen instanceof Set, 'the lab remembers scenes in memory, never in the player progress');
  narrative.skip();
  assert.equal(narrative.blocked, false, 'skipping hands the wave back to the player');

  // The switch survives a trip back to the build screen but stays opt-in.
  dom.click('balance-back');
  await settle();
  assert.equal(state.balanceCinematics, true, 'going back does not silently turn the story off');

  state.balanceCinematics = false;
  loads = 0;
  await openLab({ wave: 2 });
  assert.equal(loads, 0, 'turning it off skips the cinematics again');
  narrative.load = async () => ({ characters: {}, sounds: {}, entries: [], bindings: [] });
});

test('an ordinary run keeps the campaign exits', async () => {
  const { createRun } = await import('../src/engine.mjs');
  const run = createRun(() => 0.5, 'negro', {}, PLAYABLE_ACTS[0]);
  state.screen = 'game';
  state.run = run;
  endWave(run);
  const html = render();
  assert.match(html, /data-action="next-wave"/);
  assert.doesNotMatch(html, /data-action="balance-repeat"/);
});
