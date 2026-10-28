import test from 'node:test';
import assert from 'node:assert/strict';

// Browser-less boot smoke: app.mjs is only loadable where a DOM exists, and
// text-pinned structural tests cannot check that the ESM graph actually
// links. A missing named export (formatTime) once killed the whole graph at
// link time and shipped a black screen with the suite green. This harness
// stubs the DOM surface the shell touches and boots the real modules.
function bootDom() {
  const ctx = new Proxy({}, {
    get: (_t, key) => (key === 'canvas' ? null : () => 0),
    set: () => true,
  });
  const cache = new Map();
  const makeEl = sel => {
    if (cache.has(sel)) return cache.get(sel);
    const el = {
      sel, dataset: {}, style: {}, disabled: false, innerHTML: '', textContent: '',
      classList: { toggle() {}, add() {}, remove() {} },
      focus() {}, setPointerCapture() {}, click() {},
      querySelector: s => findEl(s),
      querySelectorAll: () => [],
      getContext: () => ctx,
      closest: () => null,
    };
    cache.set(sel, el);
    return el;
  };
  const findEl = sel => makeEl(sel);
  globalThis.document = {
    querySelector: findEl,
    querySelectorAll: () => [],
    addEventListener() {},
    body: { classList: { toggle() {} } },
    activeElement: null,
    hidden: false,
  };
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    scrollTo() {},
  };
  // In-memory progress storage so unlock flows are exercisable headlessly.
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  };
  globalThis.requestAnimationFrame = () => 0;
}

test('the app ESM graph links and boots home, selection, arena and overlays', async () => {
  bootDom();
  await import('../src/app.mjs');
  const { state } = await import('../src/app/state.mjs');
  const screens = await import('../src/screens/characters.mjs');
  const gameScreen = await import('../src/screens/game.mjs');
  const overlays = await import('../src/game/overlays.mjs');
  const hud = await import('../src/game/hud.mjs');
  const renderer = await import('../src/game/renderer.mjs');

  screens.characters();
  assert.equal(state.screen, 'home', 'boot lands on home; characters() only renders its markup');
  assert.ok(String(makeHtml(state)).includes('sprite-preview'), 'selection markup built without throwing');

  state.selectedCharacter = 'warrior';
  const progression = await import('../src/progression.mjs');
  assert.equal(progression.unlockAllForTesting(), true, 'debug unlock works on the stub storage');
  screens.characters();
  assert.match(String(makeHtml(state)), /WARRIOR/, 'the selected ficha drives the stage');

  state.selectedCharacter = 'negro';
  gameScreen.game();
  assert.ok(state.run, 'entering the arena creates a run');
  hud.updateHUD();
  overlays.overlay();
  // A bare `run` reference here shipped a console-error arena: every exported
  // paint path must execute, not only link.
  renderer.draw();
  state.paused = false;
  assert.equal(state.run.phase, 'playing', 'the run starts playing');
});

// Records every innerHTML assignment the stub saw, so assertions can check
// what the screens actually rendered.
function makeHtml(state) {
  return state.content.innerHTML ?? '';
}
