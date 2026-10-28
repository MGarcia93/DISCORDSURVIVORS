import test from 'node:test';
import assert from 'node:assert/strict';
import { NarrativeHost } from '../src/narrative/host.mjs';

test('discarded presentation errors cannot fail replacement scenes', async () => {
  const callbacks = [];
  const scene = { id: 'own', steps: [{ type: 'dialogue', lines: [{ speaker: 'guide', text: 'Independent' }] }] };
  const catalog = {
    characters: { guide: { expressions: { neutral: 'ok.svg' } } }, sounds: {},
    entries: [{ id: 'own', scene, actions: {} }],
    bindings: [{ when: 'before_wave', wave: 1, scene: 'own' }],
  };
  const host = new NarrativeHost({
    load: async () => catalog,
    audio: { stop() {}, play() {} },
    makeView(root, catalog, onError) {
      callbacks.push(onError);
      return { render() {}, dispose() {} };
    },
  });
  const root = { hidden: true, textContent: '' };
  await host.attach({ phase: 'playing', wave: 1, time: 0 }, root);
  await host.attach({ phase: 'playing', wave: 1, time: 0 }, root);
  callbacks[0]('Portrait unavailable: /missing-old-portrait.svg');
  assert.equal(host.error, null);
  assert.equal(host.director.player.status, 'playing');
  assert.equal(host.blocked, true);
});
