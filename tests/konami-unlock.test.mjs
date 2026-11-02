import test from 'node:test';
import assert from 'node:assert/strict';

// Same minimal browser the app tests use: enough DOM for the shell, plus a real
// localStorage so the test can prove the code never writes to it.
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
  globalThis.requestAnimationFrame = () => 0;
  const dispatch = (name, data) => { for (const handler of handlers.get(name) ?? []) handler({ preventDefault() {}, repeat: false, ...data }); };
  return { key: key => dispatch('keydown', { key }), storage };
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const ROSTER_IDS = ['solago', 'warrior', 'papazito', 'jhony', 'papafrita'];

test('the Konami code on the menu unlocks the roster for the session only', async () => {
  const dom = browser();
  await import('../src/app.mjs');
  const { state } = await import('../src/app/state.mjs');
  const { isCharacterUnlocked } = await import('../src/progression.mjs');

  assert.equal(state.screen, 'home');
  assert.equal(isCharacterUnlocked('solago'), false, 'the roster starts locked');

  // Off the menu the code is just noise.
  state.screen = 'characters';
  for (const key of KONAMI) dom.key(key);
  assert.equal(isCharacterUnlocked('solago'), false, 'the roster screen is not the menu');
  state.screen = 'home';

  // Nine of the ten keys, then a wrong one: the egg must not open.
  for (const key of KONAMI.slice(0, 9)) dom.key(key);
  dom.key('x');
  assert.equal(isCharacterUnlocked('solago'), false, 'an interrupted code unlocks nothing');
  assert.equal(state.screen, 'home');

  for (const key of KONAMI) dom.key(key);
  assert.equal(state.debugUnlockAll, true, 'the egg shows the roster unlocked');
  assert.equal(state.screen, 'characters', 'and opens it');
  for (const id of ROSTER_IDS) assert.equal(isCharacterUnlocked(id), true, `${id} is playable`);
  assert.equal(dom.storage.size, 0, 'nothing is written: closing the tab closes the door');
});

test('a fresh session starts locked again', async () => {
  // A second instance of the module is what a reload gives the player.
  const reloaded = await import('../src/progression.mjs?session=2');
  assert.equal(reloaded.isCharacterUnlocked('solago'), false, 'the unlock did not survive the reload');
});
