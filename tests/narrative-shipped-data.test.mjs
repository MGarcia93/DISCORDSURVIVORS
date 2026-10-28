import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog } from '../src/narrative/catalog.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';
import { createRun, startNextWave, step } from '../src/engine.mjs';

// The rest of the narrative suite builds catalogs by hand. This file runs the
// shipping manifest and the shipped scene files through the real engine, so a
// broken scene file or a bad URL fails here instead of at runtime.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });

async function shippedCatalog() {
  return loadCatalog({ fetcher });
}

function playWave(run, director) {
  while (run.phase === 'playing' && run.time < run.duration + 5) {
    if (!director.blocked) {
      run.enemies.length = 0;
      step(run, 0.5, { x: 0, y: 0 });
    }
    director.tick(0.5);
    director.observe();
  }
}

test('the shipped manifest plays its real scene at a wave boundary and blocks the run', async () => {
  const catalog = await shippedCatalog();
  assert.deepEqual(catalog.bindings, [], 'shipping bindings stay empty until an author maps a scene');
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));

  const director = new WaveDirector({ ...catalog, bindings: [{ when: 'after_wave', wave: 1, scene: 'act-04-warrior-rescue-preview' }] });
  const run = createRun(() => 0.5);
  director.attach(run);
  assert.equal(director.blocked, false, 'wave one starts without a binding');

  playWave(run, director);
  assert.equal(run.phase, 'shop', 'the wave still ends on its own');
  assert.equal(director.blocked, true, 'the shipped scene takes over the boundary');
  for (let i = 0; i < 40 && !director.player.dialogue; i++) director.tick(0.1);
  assert.equal(director.player.dialogue.text, 'Bueno, listo. Sos libre.');

  const frozen = JSON.stringify(run);
  for (let i = 0; i < 10; i++) director.tick(0.1);
  assert.equal(JSON.stringify(run), frozen, 'the shell skips step() while the scene owns the boundary');
});

test('the shipped scene finishes, applies its effect and hands the shop back', async () => {
  const catalog = await shippedCatalog();
  const director = new WaveDirector({ ...catalog, bindings: [{ when: 'after_wave', wave: 1, scene: 'act-04-warrior-rescue-preview' }] });
  const run = createRun(() => 0.5);
  director.attach(run);
  playWave(run, director);

  for (let guard = 0; director.blocked && guard < 40; guard++) director.skip();
  assert.equal(director.blocked, false, 'skipping releases the boundary');
  assert.equal(director.flags['preview-warrior-rescue'], true, 'a skipped scene still applies required effects');
  assert.equal(run.phase, 'shop', 'the shop keeps its phase');

  let started = 0;
  director.nextWave(() => { started++; startNextWave(run); });
  assert.equal(started, 1);
  assert.equal(run.wave, 2);
});

test('bindings resolve in manifest order and repeat once is honoured with shipped data', async () => {
  const catalog = await shippedCatalog();
  const director = new WaveDirector({ ...catalog, bindings: [
    { when: 'before_wave', wave: 2, scene: 'sample-conversation' },
    { when: 'before_wave', wave: 2, scene: 'act-04-warrior-rescue-preview' },
  ] });
  const run = createRun(() => 0.5);
  director.attach(run);
  run.phase = 'shop';
  let started = 0;
  director.nextWave(() => { started++; run.wave = 2; run.phase = 'playing'; run.time = 0; });
  assert.equal(director.player.scene.id, 'sample-conversation', 'first binding plays first');
  director.skip();
  assert.equal(director.player.scene.id, 'act-04-warrior-rescue-preview', 'second binding follows');
  assert.equal(started, 0, 'the wave only starts after every bound scene finishes');
  director.skip();
  assert.equal(started, 1);
  assert.equal(run.wave, 2);
});
