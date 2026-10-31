import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import act02 from '../src/campaign/act-02-rift.mjs';
import { ScenePlayer } from '../src/narrative/runtime.mjs';

// Act 2 ships its own manifest. These tests run the real files through the real
// loader, so a broken scene or a paraphrased line fails here and not mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act02)], fetcher });
const ACT_SCENES = ['act-02-arrival', 'act-02-solago', 'act-02-maiden', 'act-02-boss-intro', 'act-02-boss-defeat', 'act-02-epilogue'];

test('Solago rescue sounds an impact for each fallen walker without firing a shot', async () => {
  const catalog = await catalogFor();
  const entry = catalog.entries.find(item => item.id === 'act-02-solago');
  const impacts = [];
  let player;
  player = new ScenePlayer(entry.scene, { ...catalog, actions: entry.actions,
    onSound: id => impacts.push({ id, dead: Object.values(player.actors).filter(actor => actor.dead).length }),
  });
  for (let frame = 0; player.active && frame < 1000; frame++) {
    if (player.dialogue || player.splash || player.notice) player.advance();
    else player.tick(0.05);
  }
  assert.equal(player.status, 'completed');
  assert.deepEqual(impacts, [{ id: 'shovel', dead: 0 }, { id: 'shovel', dead: 1 }]);
  assert.equal(player.actors['walker-a'].dead, true);
  assert.equal(player.actors['walker-b'].dead, true);
});

test('the act registers its six cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(ACT_SCENES, catalog.entries.filter(entry => entry.id.startsWith('act-02-')).map(entry => entry.id));
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 6);
  assert.ok(catalog.banter.length >= 10, 'the walk to the boss carries the act banter');
});

test('every act two line is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const script = (await readFile(new URL('../context/historia/Discord_Survivors_Acto_2_League_of_Legends.md', import.meta.url), 'utf8')).toLowerCase();
  const lines = [];
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-02-'))) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      if (step.type === 'notice') lines.push(...step.lines);
    }
  }
  lines.push(...catalog.banter.map(line => line.text));
  assert.ok(lines.length > 30, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the act two speakers and expressions exist in the catalog', async () => {
  const catalog = await catalogFor();
  const steps = catalog.entries.filter(entry => entry.id.startsWith('act-02-')).flatMap(entry => entry.scene.steps);
  const spoken = steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  const speakers = new Set([...spoken.map(line => line.speaker), ...catalog.banter.map(line => line.speaker)]);
  for (const speaker of speakers) assert.ok(catalog.characters[speaker], `unknown speaker: ${speaker}`);
  for (const line of [...spoken, ...catalog.banter]) {
    if (!line.expression) continue;
    assert.ok(catalog.characters[line.speaker].expressions[line.expression],
      `${line.speaker} has no ${line.expression} portrait`);
  }
});

test('Solago is found on wave three and the Maiden closes wave five', async () => {
  const catalog = await catalogFor();
  const solago = catalog.bindings.find(binding => binding.scene === 'act-02-solago');
  assert.deepEqual({ when: solago.when, wave: solago.wave }, { when: 'before_wave', wave: 3 });
  const scene = catalog.entries.find(entry => entry.id === 'act-02-solago').scene;
  assert.ok(scene.steps.some(step => step.type === 'splash' && step.speaker === 'solago'
    && step.text.includes('¡SOLAGO DESBLOQUEADO!')), 'the unlock announcement keeps the portrait card');
  assert.equal(act02.miniboss.wave, 5);
  assert.equal(act02.miniboss.kind, 'maiden');
});

test('Yorick kneels in his defeat instead of walking out', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-02-boss-defeat').scene;
  const kneel = scene.steps.find(step => step.type === 'animate' && step.actor === 'yorick');
  assert.equal(kneel?.animation, 'kneel');
});

test('no two actors finish a scene on the same spot', async () => {
  const catalog = await catalogFor();
  const walk = (steps, at) => {
    for (const step of steps) {
      if (step.type === 'move' && step.to) at[step.actor] = step.to;
      if (step.type === 'parallel') walk(step.steps, at);
    }
    return at;
  };
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-02-'))) {
    const { actors } = entry.scene.stage;
    const at = walk(entry.scene.steps, Object.fromEntries(Object.entries(actors).map(([id, actor]) => [id, actor.at])));
    const seen = new Map();
    for (const [id, point] of Object.entries(at)) {
      assert.ok(!seen.has(point), `${entry.id}: ${id} ends on the same spot as ${seen.get(point)} (${point})`);
      seen.set(point, id);
    }
  }
});
