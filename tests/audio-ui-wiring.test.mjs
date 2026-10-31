import test from 'node:test';
import assert from 'node:assert/strict';

// The volume sliders are wired through one document-level `input` listener.
// Checking that in a browser needs playwright; this captures the listener the
// real app.mjs registers and drives it with a slider-shaped target, so a break
// in the chain fails here instead of shipping a control that does nothing.
function bootDom() {
  const listeners = new Map();
  const ctx = new Proxy({}, { get: (_t, key) => (key === 'canvas' ? null : () => 0), set: () => true });
  const cache = new Map();
  const makeEl = sel => {
    if (cache.has(sel)) return cache.get(sel);
    const el = {
      sel, dataset: {}, style: {}, disabled: false, innerHTML: '', textContent: '',
      classList: { toggle() {}, add() {}, remove() {} },
      focus() {}, setPointerCapture() {}, click() {},
      querySelector: next => makeEl(next),
      querySelectorAll: () => [],
      getContext: () => ctx,
      closest: () => null,
    };
    cache.set(sel, el);
    return el;
  };
  globalThis.document = {
    querySelector: sel => makeEl(sel),
    querySelectorAll: () => [],
    addEventListener: (type, handler) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    body: { classList: { toggle() {} } },
    activeElement: null,
    hidden: false,
  };
  globalThis.window = { matchMedia: () => ({ matches: false }), addEventListener() {}, scrollTo() {} };
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  };
  globalThis.requestAnimationFrame = () => 0;
  return { listeners, store };
}

test('dragging a volume slider reaches the engine and the readout', async () => {
  const { listeners } = bootDom();
  await import('../src/app.mjs');
  const { audio } = await import('../src/audio/index.mjs');

  const handlers = listeners.get('input') ?? [];
  assert.ok(handlers.length > 0, 'app.mjs registers an input listener');

  const slider = { dataset: { volume: 'music' }, value: '20' };
  slider.closest = () => slider;
  for (const handler of handlers) handler({ target: slider });

  assert.equal(audio.volumes.music, 0.2, 'the slider position reaches the engine');
  const label = globalThis.document.querySelector('[data-volume-label="music"]');
  assert.equal(label.textContent, '20%', 'and the readout follows the drag');

  const effects = { dataset: { volume: 'sfx' }, value: '5' };
  effects.closest = () => effects;
  for (const handler of handlers) handler({ target: effects });
  assert.equal(audio.volumes.sfx, 0.05, 'the effects slider is wired the same way');
});
