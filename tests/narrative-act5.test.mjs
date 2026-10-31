import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import act05 from '../src/campaign/act-05-discord.mjs';
import { worldIds } from '../src/backgrounds/index.mjs';

// Act 5 ships its own manifest. These tests run the real files through the real
// loader, so a broken scene or a paraphrased line fails here and not mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act05)], fetcher });
const ACT_SCENES = ['act-05-prologue', 'act-05-reconnect', 'act-05-files', 'act-05-memory',
  'act-05-hotfix', 'act-05-ghosts', 'act-05-administrator', 'act-05-phases', 'act-05-defeat',
  'act-05-epilogue', 'act-05-final'];
const actEntries = catalog => catalog.entries.filter(entry => ACT_SCENES.includes(entry.id));

test('the act registers its eleven cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(actEntries(catalog).map(entry => entry.id), ACT_SCENES);
  assert.ok(catalog.entries.every(entry => !entry.error),
    catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  for (const entry of actEntries(catalog)) {
    assert.ok(worldIds.includes(entry.scene.stage.background), `${entry.id} names a real world`);
  }
});

test('the eleven scenes hang off the six waves in script order', async () => {
  const catalog = await catalogFor();
  const bindings = catalog.bindings.filter(binding => binding.scene.startsWith('act-05'));
  assert.deepEqual(bindings.map(binding => [binding.when, binding.wave, binding.scene]), [
    ['before_wave', 1, 'act-05-prologue'],
    ['before_wave', 1, 'act-05-reconnect'],
    ['before_wave', 2, 'act-05-files'],
    ['before_wave', 3, 'act-05-memory'],
    ['before_wave', 4, 'act-05-hotfix'],
    ['before_wave', 5, 'act-05-ghosts'],
    ['before_wave', 6, 'act-05-administrator'],
    ['before_wave', 6, 'act-05-phases'],
    ['after_wave', 6, 'act-05-defeat'],
    ['after_wave', 6, 'act-05-epilogue'],
    ['after_wave', 6, 'act-05-final'],
  ]);
  assert.ok(catalog.banter.length >= 5, 'the corrupted files wave carries its loot banter');
});

test('every act five line is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const scriptRaw = await readFile(new URL('../context/historia/Discord_Survivors_Acto_5_Discord_Corrupto.md', import.meta.url), 'utf8');
  // The script marks speakers, emphasis and commands with Markdown; the catalog
  // carries the same words without it, so both sides are normalised first.
  const script = scriptRaw.toLowerCase().replace(/\*\*/g, '').replace(/`/g, '');
  const lines = [];
  for (const entry of actEntries(catalog)) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      if (step.type === 'notice') lines.push(...step.lines);
    }
  }
  lines.push(...catalog.banter.map(line => line.text));
  assert.ok(lines.length > 120, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the whole act is covered: no approved line before the epilogue is left out', async () => {
  const catalog = await catalogFor();
  const said = new Set();
  for (const entry of actEntries(catalog)) {
    for (const step of entry.scene.steps) {
      for (const line of step.lines ?? []) said.add((line.text ?? line).toLowerCase());
    }
  }
  for (const line of catalog.banter) said.add(line.text.toLowerCase());
  const scriptRaw = await readFile(new URL('../context/historia/Discord_Survivors_Acto_5_Discord_Corrupto.md', import.meta.url), 'utf8');
  const spoken = scriptRaw.split('\n').slice(0, 584)
    .map(raw => raw.match(/^\*\*([^*]+):\*\*\s*(.+)$/))
    .filter(Boolean)
    .map(match => ({ speaker: match[1], text: match[2].toLowerCase().replace(/`/g, '') }))
    // The script header is metadata, not dialogue.
    .filter(line => !/^(personajes|oleadas|jefe final|aparición especial)$/i.test(line.speaker));
  for (const line of spoken) assert.ok(said.has(line.text), `missing from the act: ${line.speaker}: ${line.text}`);
});

test('the act five speakers and expressions exist in the catalog', async () => {
  const catalog = await catalogFor();
  const steps = actEntries(catalog).flatMap(entry => entry.scene.steps);
  const spoken = steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  const speakers = new Set([...spoken.map(line => line.speaker), ...catalog.banter.map(line => line.speaker)]);
  for (const speaker of speakers) assert.ok(catalog.characters[speaker], `unknown speaker: ${speaker}`);
  for (const line of [...spoken, ...catalog.banter]) {
    if (!line.expression) continue;
    assert.ok(catalog.characters[line.speaker].expressions[line.expression],
      `${line.speaker} has no ${line.expression} portrait`);
  }
});

test('Maxi never reaches a portrait panel before he joins the call', async () => {
  const catalog = await catalogFor();
  const epilogue = actEntries(catalog).find(entry => entry.id === 'act-05-epilogue').scene;
  const noticeIndex = epilogue.steps.findIndex(step => step.type === 'notice' && step.lines.includes('Maxi se ha unido al canal de voz.'));
  assert.notEqual(noticeIndex, -1, 'the join notice is what reveals him');
  const before = epilogue.steps.slice(0, noticeIndex).filter(step => step.type === 'dialogue');
  assert.ok(before.length, 'they talk before he appears');
  // The portrait strip lists every speaker of the scene, so the beats before the
  // notice must use the compact panel or Maxi's face shows up early.
  for (const step of before) assert.equal(step.layout, 'stage', 'early beats have no portrait strip');
  const speakerSets = epilogue.steps
    .filter(step => step.type === 'dialogue' && step.layout !== 'stage')
    .flatMap(step => step.lines.map(line => line.speaker));
  assert.equal(speakerSets.includes('maxi'), true, 'after the notice he speaks');
});

test('the corrupted bosses are staged in the ghosts scene and Maxi sits at the machine', async () => {
  const catalog = await catalogFor();
  const ghosts = actEntries(catalog).find(entry => entry.id === 'act-05-ghosts').scene;
  assert.deepEqual(ghosts.stage.actors.yorick, { character: 'yorick', at: 'portal-2' });
  assert.deepEqual(ghosts.stage.actors.lilith, { character: 'lilith', at: 'portal-3' });
  assert.deepEqual(ghosts.stage.actors.capataz, { character: 'taskmaster', at: 'portal-4' });
  assert.equal(ghosts.stage.actors.alarm.enemy, 'alarmZombie');
  // Papasito runs away from the bosses, which stand on the right.
  const run = ghosts.steps.find(step => step.type === 'move' && step.actor === 'papasito');
  assert.ok(ghosts.stage.points[run.to][0] < ghosts.stage.points['portal-3'][0]);

  const epilogue = actEntries(catalog).find(entry => entry.id === 'act-05-epilogue').scene;
  assert.deepEqual(epilogue.stage.actors.maxi, { character: 'maxi', at: 'maxi' });
  assert.ok(epilogue.steps.some(step => step.type === 'animate' && step.actor === 'maxi' && step.animation === 'kneel'),
    'Maxi is seated at the desk, not standing next to it');
});

test('the epilogue walks the group across a map wider than the viewport', async () => {
  const catalog = await catalogFor();
  const epilogue = actEntries(catalog).find(entry => entry.id === 'act-05-epilogue').scene;
  const [width, height] = epilogue.stage.size;
  assert.ok(width > 1144 && height >= 748, 'the walk needs room');
  const walk = epilogue.steps.find(step => step.type === 'parallel');
  const moves = walk.steps.filter(step => step.type === 'move');
  const camera = walk.steps.find(step => step.type === 'camera');
  assert.equal(moves.length, 4, 'the whole group walks');
  assert.ok(camera, 'the camera follows them');
  // The camera must not run ahead of the group: it stops left of the desk.
  assert.ok(camera.to === 'walk-cam');
  assert.ok(epilogue.stage.points['walk-cam'][0] < epilogue.stage.points.maxi[0], 'Maxi stays out of frame');
});
