import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog } from '../src/narrative/catalog.mjs';
import { loadPreviewCatalog } from '../src/narrative/viewer.mjs';

const localFetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
test('each sample is independently loaded and validated from its own JSON file', async () => {
  const catalog = await loadCatalog({ fetcher: localFetch });
  assert.equal(catalog.entries.length, 4);
  assert.deepEqual(catalog.bindings, [], 'examples never run in normal play without explicit author mappings');
  for (const entry of catalog.entries) {
    assert.equal(entry.error, null, entry.id);
    assert.equal(entry.scene.id, entry.id);
  }
  assert.equal(typeof catalog.entries[2].actions.highlight.start, 'function');
});

test('an invalid scene is reported by name without hiding valid scenes', async () => {
  const fetcher = async url => {
    const response = await localFetch(url);
    const data = await response.json();
    if (String(url).endsWith('sample-conversation.json')) data.steps[0].lines[0].expression = 'missing';
    return { ok: true, json: async () => data };
  };
  const catalog = await loadCatalog({ fetcher });
  assert.match(catalog.entries[0].error, /sample-conversation.*expression/);
  assert.equal(catalog.entries[1].error, null);
});

test('missing catalogs and ambiguous scene IDs fail with actionable messages', async () => {
  await assert.rejects(loadCatalog({ fetcher: async () => ({ ok: false, status: 404 }) }), /404/);
  const fetcher = async url => {
    const response = await localFetch(url), data = await response.json();
    if (String(url).endsWith('manifest.json')) data.scenes.push(data.scenes[0]);
    return { ok: true, json: async () => data };
  };
  await assert.rejects(loadCatalog({ fetcher }), /Duplicate scene/);
});

test('uncached preview loads do not mix a new scene with an older cached character catalog', async () => {
  const fetcher = async (url, options) => {
    const response = await localFetch(url), data = await response.json();
    if (String(url).endsWith('characters.json') && options.cache !== 'no-store') {
      return { ok: true, json: async () => ({ guide: data.guide, guest: data.guest }) };
    }
    return { ok: true, json: async () => data };
  };
  const catalog = await loadPreviewCatalog({ fetcher });
  assert.equal(catalog.entries.find(entry => entry.id === 'act-04-warrior-rescue-preview').error, null);
  assert.equal(catalog.characters['maxi-negro'].name, 'Maxi Negro');
});
