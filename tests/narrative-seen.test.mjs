import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESS_STORAGE_KEY, markSceneSeen, sceneSeenStore, seenScenes } from '../src/progression.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';

// Minimal localStorage: the progression module only reads and writes one key.
function storage(initial = null) {
  const data = new Map();
  if (initial !== null) data.set(PROGRESS_STORAGE_KEY, initial);
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    read: () => JSON.parse(data.get(PROGRESS_STORAGE_KEY) ?? '{}'),
  };
}

const catalog = (scene) => ({
  characters: {}, sounds: {}, backgrounds: {}, enemies: {},
  entries: [{ id: scene.id, title: scene.id, scene, actions: {} }],
  bindings: [], banter: [],
});

test('a played cinematic is remembered without touching the rest of the progress', () => {
  const store = storage(JSON.stringify({ version: 1, unlockSolago: true }));
  assert.deepEqual(seenScenes(store), []);
  assert.equal(markSceneSeen('act-01-arrival', store), true);
  assert.equal(markSceneSeen('act-01-arrival', store), true, 'marking twice is harmless');
  assert.deepEqual(seenScenes(store), ['act-01-arrival']);
  assert.equal(store.read().unlockSolago, true, 'the unlock flag survives');
});

test('a broken record reports nothing and never writes over it', () => {
  const store = storage('{not json');
  assert.deepEqual(seenScenes(store), []);
  assert.equal(markSceneSeen('act-01-arrival', store), false);
  assert.equal(store.read === undefined, false);
});

test('the director skips an already-seen scene and records a new one', () => {
  const store = storage();
  const scene = { id: 'probe', repeat: 'once', steps: [] };
  const director = new WaveDirector(catalog(scene), { seen: sceneSeenStore(store) });
  director.attach({ phase: 'shop', wave: 0, time: 0 });
  assert.equal(director.play('probe'), true, 'first time it plays');
  director.tick(0.1);
  assert.deepEqual(seenScenes(store), ['probe'], 'and it is written down');

  const again = new WaveDirector(catalog(scene), { seen: sceneSeenStore(store) });
  again.attach({ phase: 'shop', wave: 0, time: 0 });
  assert.equal(again.play('probe'), false, 'a new run does not replay it');
});

test('without a store the run keeps its own memory, like the dev viewer', () => {
  const scene = { id: 'probe', repeat: 'once', steps: [] };
  const director = new WaveDirector(catalog(scene));
  director.attach({ phase: 'shop', wave: 0, time: 0 });
  assert.equal(director.play('probe'), true);
  director.tick(0.1);
  assert.equal(director.play('probe'), false, 'once per run');
  director.detach();
  director.attach({ phase: 'shop', wave: 0, time: 0 });
  assert.equal(director.play('probe'), true, 'and a fresh run forgets');
});
