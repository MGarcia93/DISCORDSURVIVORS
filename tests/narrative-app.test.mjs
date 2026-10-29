import test from 'node:test';
import assert from 'node:assert/strict';

function browser() {
  const handlers = new Map(), cache = new Map(), storage = new Map();
  const ctx = new Proxy({}, { get: () => () => 0, set: () => true });
  const element = selector => {
    if (cache.has(selector)) return cache.get(selector);
    const node = {
      dataset: {}, style: {}, disabled: false, hidden: false, innerHTML: '', textContent: '', isConnected: true,
      classList: { toggle() {}, add() {}, remove() {} },
      focus() { document.activeElement = this; }, setPointerCapture() {}, click() {},
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
  let frame;
  globalThis.requestAnimationFrame = callback => { frame = callback; };
  const dispatch = (name, data) => { for (const handler of handlers.get(name) ?? []) handler({ preventDefault() {}, repeat: false, ...data }); };
  return {
    click(action, dataset = {}) { dispatch('click', { target: { closest: () => ({ disabled: false, dataset: { action, ...dataset } }) } }); },
    key(key) { dispatch('keydown', { key }); },
    touch() { dispatch('pointerdown', { target: { closest: () => ({ dataset: { direction: 'right' }, setPointerCapture() {} }) }, pointerId: 1 }); },
    blur() { dispatch('window:blur', {}); },
    focus() { dispatch('window:focus', {}); },
    frame(timestamp) { frame(timestamp); }, storage,
  };
}

test('real app input and wave transitions honor narrative ownership without changing ordinary play', async () => {
  const dom = browser();
  await import('../src/app.mjs');
  const { state } = await import('../src/app/state.mjs');
  const { narrative } = await import('../src/narrative/integration.mjs');
  const characters = { guide: { name: 'Guide', expressions: { neutral: 'portrait.svg' } } };
  const entry = id => ({ id, actions: {}, scene: { id, steps: [{ type: 'dialogue', lines: [{ speaker: 'guide', text: id }] }] } });
  const catalog = { characters, sounds: {}, entries: [entry('after'), entry('before')], bindings: [
    { when: 'after_wave', wave: 1, scene: 'after' }, { when: 'before_wave', wave: 2, scene: 'before' },
  ] };
  narrative.load = async () => catalog;
  narrative.makeView = () => ({ render() {}, dispose() {} });
  dom.click('play');
  await Promise.resolve(); await Promise.resolve();
  assert.equal(state.run.phase, 'playing');
  assert.equal(narrative.blocked, false);
  dom.key('q');
  assert.ok(state.run.player.anime > 0, 'existing keyboard ability still works');
  state.run.time = 59.99;
  dom.frame(1000); dom.frame(1100);
  assert.equal(state.run.phase, 'shop');
  assert.equal(narrative.blocked, true, 'post-wave scene precedes the shop');
  const before = JSON.stringify(state.run);
  dom.key('e'); dom.touch(); dom.click(undefined, { special: 'chair' });
  dom.click(undefined, { upgrade: 'damage' });
  dom.frame(1200);
  assert.equal(JSON.stringify(state.run), before, 'keyboard, touch, purchases and clicks cannot bypass the scene');
  assert.equal(state.keys.size, 0);
  dom.key('Enter');
  assert.equal(narrative.blocked, false);
  dom.click('next-wave');
  assert.equal(state.run.wave, 1, 'pre-wave scene happens before the next stage starts');
  assert.equal(narrative.blocked, true);
  dom.key('Escape');
  assert.equal(state.run.wave, 2);
  assert.equal(state.run.phase, 'playing');
  dom.key('Escape'); assert.equal(state.paused, true, 'ordinary pause remains available after scene completion');
  dom.key('Escape'); assert.equal(state.paused, false);
  dom.click('home');
  assert.equal(state.run, null);
  assert.equal(narrative.blocked, false);
  // Playing a scene is remembered so a second run can skip it, but it never
  // grants an unlock on its own.
  const record = JSON.parse(dom.storage.get('discord-survivors.progress.v1'));
  assert.ok(Array.isArray(record.seenScenes) && record.seenScenes.length > 0, 'the played scene is remembered');
  assert.equal(Object.keys(record).filter(key => !['version', 'seenScenes'].includes(key)).length, 0, 'and nothing else was written');

  // A pre-wave scene owns suspension independently of the gameplay pause menu.
  const opening = { id: 'opening', actions: {}, scene: { id: 'opening', steps: [
    { type: 'wait', duration: 0.2 }, { type: 'dialogue', lines: [{ speaker: 'guide', text: 'Resumed' }] },
  ] } };
  narrative.load = async () => ({ ...catalog, entries: [opening], bindings: [{ when: 'before_wave', wave: 1, scene: 'opening' }] });
  dom.click('play');
  await Promise.resolve(); await Promise.resolve();
  dom.blur(); document.hidden = true;
  assert.equal(state.paused, false, 'scene blur must not set an inaccessible gameplay pause');
  dom.frame(1300);
  assert.equal(narrative.director.player.time, 0, 'scene clock suspends while the window is inactive');
  document.hidden = false; dom.focus();
  dom.frame(1400); dom.frame(1500);
  assert.equal(narrative.director.player.dialogue.text, 'Resumed', 'scene resumes on focus without skipping');
  assert.equal(state.run.elapsed, 0, 'combat time remains frozen throughout the scene');
  dom.key('Enter');
  assert.equal(narrative.blocked, false);
  dom.blur(); dom.focus();
  assert.equal(state.paused, true, 'ordinary gameplay blur still pauses until the player resumes');
  dom.key('Escape');
  assert.equal(state.paused, false);
  dom.click('home');
});
