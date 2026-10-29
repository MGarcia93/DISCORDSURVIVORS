import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCatalog } from '../src/narrative/catalog.mjs';
import { createPresenter } from '../src/narrative/presenter.mjs';
import { CHARACTERS, ROSTER } from '../src/characters/index.mjs';
import { drawJhony } from '../src/npcs/jhony.mjs';

const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });

test('Jhony builds eight distinct expressions from the approved identity and keeps the corrected hoop', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'jhony-portraits-'));
  try {
    const base = await readFile('art/characters/jhony/portrait-neutral.svg', 'utf8');
    const build = () => spawnSync('python3', ['tools/build_portraits.py',
      '--recipe', resolve('art/characters/jhony/expressions.json'), '--out', scratch], {
      encoding: 'utf8', env: { ...process.env, HOME: scratch, TMPDIR: scratch, PYTHONDONTWRITEBYTECODE: '1' },
    });
    const result = build();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await readdir(scratch)).sort(), names.map(name => `${name}.svg`));
    const neutral = await readFile(join(scratch, 'neutral.svg'), 'utf8');
    const group = (svg, id) => svg.match(new RegExp(`<g id="${id}"[^>]*>[\\s\\S]*?<\\/g>`))?.[0];
    const outputs = [];
    for (const name of names) {
      const svg = await readFile(join(scratch, `${name}.svg`), 'utf8');
      outputs.push(svg);
      assert.equal(svg, await readFile(`assets/narrative/portraits/jhony/${name}.svg`, 'utf8'));
      for (const id of ['hair-back', 'body-outline', 'neck', 'tank-top', 'leather-jacket',
        'jacket-collar', 'jacket-damage', 'head', 'ears', 'hair-front', 'nose', 'facial-hair', 'glasses']) {
        assert.ok(group(svg, id), id);
        assert.equal(group(svg, id), group(neutral, id), `${name} keeps ${id}`);
      }
      assert.equal((svg.match(/d="M75 103h2v5h4v-5h2v7h-2v2h-5v-2h-1z"/g) ?? []).length, 1,
        `${name} has exactly one hoop on the viewer's left`);
      assert.doesNotMatch(svg, /ponytail|left-lip-hoop/);
      if (name !== 'neutral') {
        assert.notEqual(group(svg, 'expression-eyes'), group(neutral, 'expression-eyes'));
        assert.notEqual(group(svg, 'expression-mouth'), group(neutral, 'expression-mouth'));
      }
    }
    assert.equal(new Set(outputs.map(svg => group(svg, 'expression-eyes'))).size, 8);
    assert.equal(new Set(outputs.map(svg => group(svg, 'expression-mouth'))).size, 8);
    assert.equal(build().status, 0);
    for (const [index, name] of names.entries()) {
      assert.equal(await readFile(join(scratch, `${name}.svg`), 'utf8'), outputs[index]);
    }
    assert.equal(await readFile('art/characters/jhony/portrait-neutral.svg', 'utf8'), base);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('the shipped narrative catalog registers Jhony portraits without making him playable', async () => {
  const catalog = await loadCatalog({ fetcher });
  const character = catalog.characters.jhony;
  assert.ok(character, 'Jhony is a narrative speaker');
  assert.equal(character.name, 'Jhony');
  assert.equal(character.sprite, 'jhony');
  assert.deepEqual(Object.keys(character.expressions).sort(), names);
  for (const [name, path] of Object.entries(character.expressions)) {
    assert.match(await readFile(new URL(path), 'utf8'), new RegExp(`data-expression="${name}"`));
  }
  assert.equal(Object.hasOwn(CHARACTERS, 'jhony'), false);
  assert.equal(ROSTER.length, 4);
  assert.ok(catalog.entries.every(entry => entry.error === null));
  assert.deepEqual(catalog.bindings, [], 'this does not activate any Act 1 scenes');
});

function viewFixture() {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 })
      : (...args) => { calls.push([key, ...args]); },
    set: (_, key, value) => { calls.push(['set', key, value]); return true; },
  });
  const canvas = { getContext: () => ctx };
  const content = { innerHTML: '', querySelectorAll: () => [] };
  const errorBox = {};
  const root = { querySelector: selector => ({ canvas, '.narrative-content': content,
    '.narrative-error': errorBox })[selector] };
  return { root, content, ctx, calls };
}

test('the presenter draws the NPC sprite and selects every registered expression', async () => {
  const catalog = await loadCatalog({ fetcher });
  const { root, content, ctx, calls } = viewFixture();
  const errors = [];
  const view = createPresenter(root, catalog, error => errors.push(error));
  const player = {
    active: false, time: 0.125, camera: { x: 572, y: 374, zoom: 1 },
    scene: { stage: { background: 'zomboid' } }, props: {},
    actors: { jhony: { character: 'jhony', x: 700, y: 480, facing: -1, animation: 'walk' } },
  };
  view.render(player, null, null, { preview: true });
  const rendered = [...calls];
  calls.length = 0;
  drawJhony(ctx, 700, 480, { facing: -1, moving: true, time: 0.125, scale: 2 });
  assert.deepEqual(rendered.slice(-calls.length - 1, -1), calls);
  for (const expression of names) {
    view.render(null, { speaker: 'jhony', expression, text: 'NPC portrait probe' }, null);
    assert.ok(content.innerHTML.includes(catalog.characters.jhony.expressions[expression]));
    assert.match(content.innerHTML, /Jhony/);
  }
  view.render({ active: false, splash: { speaker: 'jhony', text: 'Jhony' } }, null, null);
  assert.ok(content.innerHTML.includes(catalog.characters.jhony.expressions.neutral));
  assert.match(content.innerHTML, /narrative-splash/);
  assert.deepEqual(errors, []);
  view.dispose();
  assert.equal(root.hidden, true);
});

test('the presenter still accepts existing sprites and rejects unknown ones', () => {
  for (const character of ROSTER) {
    const { root } = viewFixture();
    assert.doesNotThrow(() => createPresenter(root, { characters: {
      actor: { sprite: character.id },
    } }, () => {}));
  }
  assert.throws(() => createPresenter({}, { characters: {
    invalid: { sprite: 'missing-sprite' },
  } }, () => {}), /Unknown sprite for invalid: missing-sprite/);
});
