import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresenter } from '../src/narrative/presenter.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

function fixture() {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 }) : (...args) => calls.push([key, ...args]),
    set: (_, key, value) => { calls.push(['set', key, value]); return true; },
  });
  const content = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
  const root = {
    querySelector: key => ({ canvas: { getContext: () => ctx }, '.narrative-content': content, '.narrative-error': {} })[key],
  };
  return { root, calls, content };
}

test('existing actors and cinematic bosses render without changing the roster or progression', () => {
  const before = JSON.stringify(CHARACTERS);
  const priorStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { assert.fail('presenter accessed progression storage'); },
  });
  try {
    for (const sprite of [...Object.keys(CHARACTERS), 'jhony', 'papafrita', 'yorick', 'lordZir', 'lilith']) {
      const { root, calls, content } = fixture();
      const catalog = { characters: { visitor: { sprite, name: 'Visitor', expressions: { neutral: 'neutral.svg' } } } };
      const view = createPresenter(root, catalog, assert.fail);
      view.render({
        active: false, time: 0.125, camera: { x: 572, y: 374, zoom: 1 },
        scene: { stage: { background: 'arena' } }, props: {},
        actors: { visitor: { character: 'visitor', x: 700, y: 480, facing: -1, animation: 'walk' } },
      }, null, null, { preview: true });
      assert.ok(calls.some(([name]) => name === 'fillRect'), `${sprite} draws`);
      view.render(null, { speaker: 'visitor', expression: 'neutral', text: 'Legacy banter' }, null);
      assert.match(content.innerHTML, /Legacy banter/);
      assert.match(content.innerHTML, /neutral\.svg/);
      view.dispose();
      assert.equal(root.hidden, true);
    }
    for (const sprite of ['lordZir', 'lilith']) assert.equal(Object.hasOwn(CHARACTERS, sprite), false);
    for (const sprite of ['', 'missing-sprite', '__proto__']) {
      assert.throws(() => createPresenter({}, { characters: { invalid: { sprite } } }, assert.fail), {
        message: `Unknown sprite for invalid: ${sprite}`,
      });
    }
    assert.equal(JSON.stringify(CHARACTERS), before);
  } finally {
    if (priorStorage) Object.defineProperty(globalThis, 'localStorage', priorStorage);
    else delete globalThis.localStorage;
  }
});
