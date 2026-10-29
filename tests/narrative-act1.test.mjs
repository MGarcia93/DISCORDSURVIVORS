import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, campaignCatalogURLs, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import { ScenePlayer, validateScene } from '../src/narrative/runtime.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';
import { createRun } from '../src/engine.mjs';
import act01 from '../src/campaign/act-01-zomboid.mjs';

// The act ships its own manifest: these tests run the real files through the
// real loader, so a broken scene fails here instead of mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act01)], fetcher });
const ACT_SCENES = ['act-01-arrival', 'act-01-wave-4-alarm', 'act-01-boss-intro', 'act-01-boss-defeat', 'act-01-jhony', 'act-01-epilogue'];

test('the act registers its six cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(ACT_SCENES, catalog.entries.filter(entry => entry.id.startsWith('act-01-')).map(entry => entry.id));
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 6);
  assert.equal(catalog.banter.length, 2);
  assert.ok(catalog.sounds.alarm && catalog.sounds.gunshot, 'the act brings its own alarm and shots');
});

test('the development viewer loads every campaign manifest, so a new act appears on its own', async () => {
  const urls = campaignCatalogURLs();
  const listed = urls.map(String);
  assert.ok(listed.includes(String(manifestURL)));
  assert.ok(listed.includes(String(actManifestURL(act01))));
  const catalog = await loadCatalog({ urls, fetcher });
  for (const id of ACT_SCENES) assert.ok(catalog.entries.some(entry => entry.id === id), `${id} is previewable`);
  assert.ok(catalog.entries.every(entry => !entry.error));
});

test('the arrival scene owns the first wave and releases it when done', async () => {
  const catalog = await catalogFor();
  const director = new WaveDirector(catalog);
  const run = createRun(() => 0.5);
  director.attach(run);
  assert.equal(director.blocked, true, 'the pre-scene takes the first wave');
  assert.equal(director.player.scene.id, 'act-01-arrival');
  for (let i = 0; i < 30 && !director.player.dialogue; i++) director.tick(0.1);
  assert.equal(director.player.dialogue.text, '¿Qué carajo...?');
  director.skip();
  assert.equal(director.blocked, false, 'combat gets the wave back');
  assert.ok(director.seen.has('act-01-arrival'));
});

test('the boss boundary plays the defeat, the veteran and the epilogue in order', async () => {
  const catalog = await catalogFor();
  const director = new WaveDirector(catalog);
  const run = createRun(() => 0.5);
  run.wave = 6;
  run.phase = 'won';
  director.attach(run);
  director.observe();
  const played = [];
  for (let i = 0; i < 6 && director.blocked; i++) {
    played.push(director.player.scene.id);
    director.skip();
  }
  assert.deepEqual(played, ['act-01-boss-defeat', 'act-01-jhony', 'act-01-epilogue']);
  assert.equal(director.blocked, false);
});

test('the act schedules its wave comments once per run', async () => {
  const catalog = await catalogFor();
  const director = new WaveDirector(catalog);
  const run = createRun(() => 0.5);
  director.attach(run);
  director.skip(); // release the opening scene so the wave can run
  run.wave = 2;
  run.time = 8;
  director.tick(0.1);
  assert.equal(director.banter.current.text, '¿Eh? ¿Hay otro boludo vivo por acá?');
  run.time = 40;
  director.tick(0.1);
  assert.equal(director.due.size, 1, 'the same comment never fires twice');
  run.wave = 5;
  run.time = 8;
  director.tick(0.1);
  assert.equal(director.due.size, 2);
  assert.equal(director.banter.queue.length + (director.banter.current ? 1 : 0), 2);
});

test('an act can show a system notice without a portrait', async () => {
  const catalog = await catalogFor();
  const scene = { id: 'probe', steps: [{ type: 'notice', title: 'ADMINISTRADOR', lines: ['Dificultad ajustada.'], duration: 2 }] };
  validateScene(scene, { characters: catalog.characters, sounds: {}, backgrounds: catalog.backgrounds });
  const player = new ScenePlayer(scene, { characters: catalog.characters });
  assert.equal(player.notice.title, 'ADMINISTRADOR');
  player.tick(2);
  assert.equal(player.notice, null);
  assert.equal(player.status, 'completed');
  const nested = { id: 'probe', steps: [{ type: 'parallel', steps: [{ type: 'notice', title: 'X', lines: ['y'], duration: 1 }] }] };
  assert.throws(() => validateScene(nested, {}), /Notice is not allowed inside parallel actions/);
});
