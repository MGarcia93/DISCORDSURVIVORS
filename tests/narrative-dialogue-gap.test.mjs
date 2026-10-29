import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresenter } from '../src/narrative/presenter.mjs';
import { ScenePlayer } from '../src/narrative/runtime.mjs';

// A conversation followed by a movement beat: the read line must not stay on
// screen once the player advances into the staging.
function fixture() {
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 }) : () => {},
    set: () => true,
  });
  const content = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
  const errorBox = { hidden: true, textContent: '' };
  const root = {
    hidden: true, innerHTML: '',
    querySelector: key => ({ canvas: { hidden: false, getContext: () => ctx }, '.narrative-content': content, '.narrative-error': errorBox })[key],
  };
  return { root, content };
}

const catalog = {
  characters: { guide: { name: 'Guía', sprite: 'negro', expressions: { neutral: 'portrait.svg' } } },
  sounds: {}, backgrounds: {},
};

test('the line the player already read leaves the screen when a beat starts', () => {
  // The presenter touches document.activeElement to restore focus on close.
  globalThis.document = { activeElement: null };
  const { root, content } = fixture();
  const view = createPresenter(root, catalog, () => {});
  const scene = {
    id: 'probe',
    stage: { points: { start: [400, 470], end: [700, 470] }, actors: { guide: { character: 'guide', at: 'start' } } },
    steps: [
      { type: 'dialogue', lines: [{ speaker: 'guide', text: 'Primera línea' }] },
      { type: 'move', actor: 'guide', to: 'end', duration: 2 },
    ],
  };
  const player = new ScenePlayer(scene, { characters: catalog.characters });
  view.render(player, null, null);
  assert.match(content.innerHTML, /Primera línea/);
  assert.match(content.innerHTML, /narrative-next/);

  player.advance();
  view.render(player, null, null);
  assert.doesNotMatch(content.innerHTML, /Primera línea/, 'the read line is gone');
  assert.doesNotMatch(content.innerHTML, /narrative-next/, 'there is nothing to advance');
  assert.match(content.innerHTML, /narrative-skip/, 'the player can still leave the scene');
  view.dispose();
  delete globalThis.document;
});
