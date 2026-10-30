import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import act03 from '../src/campaign/act-03-inferno.mjs';

// Act 3 ships its own manifest. These tests run the real files through the real
// loader, so a broken scene or a paraphrased line fails here and not mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act03)], fetcher });
const ACT_SCENES = ['act-03-arrival', 'act-03-papasito', 'act-03-loot', 'act-03-zir',
  'act-03-boss-intro', 'act-03-boss-defeat', 'act-03-epilogue'];

test('the act registers its seven cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(ACT_SCENES, catalog.entries.filter(entry => entry.id.startsWith('act-03-')).map(entry => entry.id));
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 7);
  assert.ok(catalog.banter.length >= 8, 'the walk to the boss carries the act banter');
});

test('every act three line is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const script = (await readFile(new URL('../context/historia/Discord_Survivors_Acto_3_Diablo.md', import.meta.url), 'utf8')).toLowerCase();
  const lines = [];
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-03-'))) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      if (step.type === 'notice') lines.push(...step.lines);
    }
  }
  lines.push(...catalog.banter.map(line => line.text));
  assert.ok(lines.length > 40, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the act three speakers and expressions exist in the catalog', async () => {
  const catalog = await catalogFor();
  const steps = catalog.entries.filter(entry => entry.id.startsWith('act-03-')).flatMap(entry => entry.scene.steps);
  const spoken = steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  const speakers = new Set([...spoken.map(line => line.speaker), ...catalog.banter.map(line => line.speaker)]);
  for (const speaker of speakers) assert.ok(catalog.characters[speaker], `unknown speaker: ${speaker}`);
  for (const line of [...spoken, ...catalog.banter]) {
    if (!line.expression) continue;
    assert.ok(catalog.characters[line.speaker].expressions[line.expression],
      `${line.speaker} has no ${line.expression} portrait`);
  }
});

test('Papasito is found on wave three and Zir and Lilith close their waves', async () => {
  const catalog = await catalogFor();
  const papasito = catalog.bindings.find(binding => binding.scene === 'act-03-papasito');
  assert.deepEqual({ when: papasito.when, wave: papasito.wave }, { when: 'before_wave', wave: 3 });
  const scene = catalog.entries.find(entry => entry.id === 'act-03-papasito').scene;
  assert.ok(scene.steps.some(step => step.type === 'notice'
    && step.lines.includes('¡PAPASITO DESBLOQUEADO!')), 'the unlock announcement is staged');
  assert.equal(act03.miniboss.wave, 5);
  assert.equal(act03.miniboss.kind, 'lordZir');
  assert.equal(act03.boss.wave, 6);
  assert.equal(act03.boss.kind, 'lilith');
});

test('the mini-boss and the boss each get their own scene before their wave', async () => {
  const catalog = await catalogFor();
  const zir = catalog.bindings.find(binding => binding.scene === 'act-03-zir');
  const boss = catalog.bindings.find(binding => binding.scene === 'act-03-boss-intro');
  assert.deepEqual({ when: zir.when, wave: zir.wave }, { when: 'before_wave', wave: 5 });
  assert.deepEqual({ when: boss.when, wave: boss.wave }, { when: 'before_wave', wave: 6 });
  const zirScene = catalog.entries.find(entry => entry.id === 'act-03-zir').scene;
  assert.equal(zirScene.stage.actors.zir.enemy, 'lordZir');
  const bossScene = catalog.entries.find(entry => entry.id === 'act-03-boss-intro').scene;
  assert.equal(bossScene.stage.actors.lilith.enemy, 'lilith');
});

test('Lilith lies dead with her echo in the scene after the fight', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-03-boss-defeat').scene;
  assert.equal(scene.stage.actors.lilith.state, 'dead');
  assert.equal(scene.stage.actors.echo.enemy, 'lilithEcho');
  assert.equal(scene.stage.actors.echo.state, 'dead');
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
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-03-'))) {
    const { actors } = entry.scene.stage;
    const at = walk(entry.scene.steps, Object.fromEntries(Object.entries(actors).map(([id, actor]) => [id, actor.at])));
    const seen = new Map();
    for (const [id, point] of Object.entries(at)) {
      assert.ok(!seen.has(point), `${entry.id}: ${id} ends on the same spot as ${seen.get(point)} (${point})`);
      seen.set(point, id);
    }
  }
});
