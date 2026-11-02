import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, campaignCatalogURLs, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import act06 from '../src/campaign/act-06-monster-hunter.mjs';

// The act ships its own manifest: these tests run the real files through the
// real loader, so a broken scene fails here instead of mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act06)], fetcher });
const SCRIPT = new URL('../context/historia/Discord_Survivors_Epilogo_Papafrita.md', import.meta.url);
const ACT_SCENES = [
  'act-06-prologue', 'act-06-reunion', 'act-06-explain', 'act-06-item', 'act-06-path',
  'act-06-venom', 'act-06-boss', 'act-06-defeat', 'act-06-expulsion', 'act-06-final',
  'act-06-credits',
];

test('the epilogue registers its eleven cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(catalog.entries.filter(entry => entry.id.startsWith('act-06-')).map(entry => entry.id), ACT_SCENES);
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 11);
  assert.ok(catalog.sounds.roar, 'the act brings its own roar');
  assert.ok(catalog.banter.length > 60, 'the act carries its combat banter');
  assert.deepEqual([...new Set(catalog.banter.map(line => line.wave))], [1, 2, 3, 4, 5, 6]);
});

test('every line of the epilogue is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const script = (await readFile(SCRIPT, 'utf8')).toLowerCase();
  const lines = [];
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-06-'))) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      // Notice titles are presenter chrome, not script text; their lines are.
      if (step.type === 'notice') lines.push(...step.lines);
    }
  }
  for (const line of catalog.banter) lines.push(line.text);
  assert.ok(lines.length > 150, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the wave bindings walk the script in order', async () => {
  const catalog = await catalogFor();
  const before = catalog.bindings.filter(binding => binding.when === 'before_wave').map(binding => [binding.wave, binding.scene]);
  assert.deepEqual(before, [
    [1, 'act-06-prologue'],
    [1, 'act-06-reunion'],
    [2, 'act-06-explain'],
    [3, 'act-06-item'],
    [4, 'act-06-path'],
    [5, 'act-06-venom'],
    [6, 'act-06-boss'],
  ]);
  const after = catalog.bindings.filter(binding => binding.when === 'after_wave').map(binding => binding.scene);
  assert.deepEqual(after, ['act-06-defeat', 'act-06-expulsion', 'act-06-final', 'act-06-credits']);
});

test('the parental punchline appears only once, in the reunion', async () => {
  const catalog = await catalogFor();
  const punchline = 'alguien te tiene que querer, si no tenés padres';
  const hits = [];
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-06-'))) {
    for (const step of entry.scene.steps) {
      if (step.type !== 'dialogue') continue;
      if (step.lines.some(line => line.text.toLowerCase().includes(punchline))) hits.push(entry.id);
    }
  }
  assert.deepEqual(hits, ['act-06-reunion']);
});

test('the bosses are staged as enemies, never as speaking actors', async () => {
  const catalog = await catalogFor();
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-06-'))) {
    for (const [id, actor] of Object.entries(entry.scene.stage.actors ?? {})) {
      if (actor.enemy) assert.ok(['kuluYaKu', 'pukeiPukei', 'rathalos', 'jagras'].includes(actor.enemy),
        `${id} stages a known enemy`);
      else assert.ok(catalog.characters[actor.character], `${id} stages a known character`);
    }
  }
});
