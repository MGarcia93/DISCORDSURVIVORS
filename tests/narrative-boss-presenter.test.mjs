import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('the held-beat actions sit where a character panel puts them and take the click', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /#narrative-layer \{[^}]*pointer-events: none;/, 'the layer lets clicks reach the game');
  const actions = css.match(/\.narrative-splash \.actions, \.narrative-notice \.actions \{[^}]*\}/)?.[0] ?? '';
  assert.match(actions, /pointer-events: auto/, 'the actions take the click a visible button would swallow');
  assert.match(actions, /right: 12px;[^}]*bottom: 12px;/, 'they close the panel at its bottom right, like a character panel');
});

test('a splash and a notice ask the player to continue instead of skipping ahead', () => {
  const { root, content } = fixture();
  const catalog = { characters: { visitor: { sprite: 'negro', name: 'Visitor', expressions: { neutral: 'neutral.svg' } } } };
  const view = createPresenter(root, catalog, assert.fail);
  view.render({ active: false, time: 0, camera: { x: 0, y: 0, zoom: 1 }, scene: { stage: { points: {}, actors: {}, props: {} } }, props: {}, actors: {}, notice: { title: 'ADMINISTRADOR', lines: ['Solicitud denegada.'] } }, null, null);
  assert.match(content.innerHTML, /data-action="narrative-next"/, 'the notice offers a Continue button');
  assert.match(content.innerHTML, /ADMINISTRADOR/);
  view.render({ active: false, time: 0, camera: { x: 0, y: 0, zoom: 1 }, scene: { stage: { points: {}, actors: {}, props: {} } }, props: {}, actors: {}, splash: { speaker: 'visitor', text: 'WARRIOR DESBLOQUEADO' } }, null, null);
  assert.match(content.innerHTML, /data-action="narrative-next"/, 'the splash offers a Continue button');
  assert.match(content.innerHTML, /WARRIOR DESBLOQUEADO/);
  view.dispose();
});

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

test('portrait conversations keep the cast sprites on the stage', () => {
  for (const sprite of ['negro', 'jhony']) {
    const { root, calls, content } = fixture();
    const catalog = { characters: { visitor: {
      sprite, name: 'Visitor', expressions: { neutral: 'neutral.svg' },
    } } };
    const view = createPresenter(root, catalog, assert.fail);
    const line = { speaker: 'visitor', expression: 'neutral', text: 'Still here.' };
    const player = {
      active: false, time: 0, camera: { x: 572, y: 374, zoom: 1 },
      scene: { stage: { background: 'arena', points: { spot: [700, 480] },
        actors: { visitor: { character: 'visitor', at: 'spot' } } },
      steps: [{ type: 'dialogue', lines: [line] }] },
      props: {}, actors: { visitor: {
        character: 'visitor', x: 700, y: 480, facing: 1, animation: 'idle',
      } },
    };
    view.render(player, null, null, { preview: true });
    const withoutPortrait = calls.splice(0);
    player.dialogue = line;
    view.render(player, null, null, { preview: true });
    assert.deepEqual(calls, withoutPortrait, `${sprite} remains drawn during portrait dialogue`);
    assert.match(content.innerHTML, /neutral\.svg/, 'the portrait remains visible too');
    assert.match(content.innerHTML, /Still here\./);
    view.dispose();
  }
});
