import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { CHARACTERS, ROSTER } from '../src/characters/index.mjs';
import { createPresenter } from '../src/narrative/presenter.mjs';
import { loadCatalog } from '../src/narrative/catalog.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });

function fixture() {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 })
      : (...args) => { calls.push([key, ...args]); },
    set: (_, key, value) => { calls.push(['set', key, value]); return true; },
  });
  const content = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
  const root = { querySelector: key => ({ canvas: { getContext: () => ctx },
    '.narrative-content': content, '.narrative-error': {} })[key] };
  return { root, content, calls, ctx };
}

test('Papafrita production sprite keeps the approved casual photo outfit in every pose', async () => {
  const { default: npc, drawPapafrita } = await import('../src/npcs/papafrita.mjs');
  for (const [options, expected] of [
    [{}, '28d84d26bb93138773fb2880da4108b25e6aa6906a14550d6d5ae223a48527bb'],
    [{ facing: -1 }, 'e8331ecbc22825b1620d2263b54f562b12933576d025657364d538b5956d910f'],
    [{ moving: true, time: 0.125 }, '9d4d7e54f3feb063e693296e2f0f417a9ce922df31d8c6dde9ca51f5b61dcd0b'],
  ]) {
    const { ctx, calls } = fixture();
    drawPapafrita(ctx, 100, 150, options);
    assert.equal(hash(JSON.stringify(calls)), expected);
    assert.ok(calls.filter(([kind]) => kind === 'fillRect').every(([, ...values]) => values.every(Number.isInteger)));
  }
  assert.equal(npc.id, 'papafrita');
  assert.equal(npc.stats, undefined);
  assert.equal(npc.unlock, undefined);
  assert.equal(Object.hasOwn(CHARACTERS, 'papafrita'), false);
  assert.equal(ROSTER.length, 4);
});

test('Papafrita portraits rebuild reproducibly without changing the approved head, neck or body', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'papafrita-build-'));
  try {
    const basePath = 'art/characters/papafrita/portrait-neutral.svg';
    assert.equal(hash(await readFile(basePath)), 'd539dba70e1cb74687fb5e8305430100409b93447e7bcc3a62d1274ad008abfd');
    const result = spawnSync('python3', ['tools/build_portraits.py', '--recipe',
      'art/characters/papafrita/expressions.json', '--out', scratch], {
      encoding: 'utf8', env: { ...process.env, HOME: scratch, TMPDIR: scratch, PYTHONDONTWRITEBYTECODE: '1' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await readdir(scratch)).sort(), names.map(name => `${name}.svg`));
    for (const name of names) {
      assert.equal(await readFile(join(scratch, `${name}.svg`), 'utf8'),
        await readFile(`assets/narrative/portraits/papafrita/${name}.svg`, 'utf8'));
    }
    const check = spawnSync('python3', ['-c', `
import xml.etree.ElementTree as E
from pathlib import Path
base=E.parse('${basePath}').getroot()
def shape(e):
 return (e.tag,tuple(sorted(e.attrib.items())),tuple(shape(c) for c in e))
frozen={e.get('id'):shape(e) for e in base if e.get('id') and e.get('id') not in {'expression-brows','expression-eyes','expression-mouth'}}
for path in Path('assets/narrative/portraits/papafrita').glob('*.svg'):
 root=E.parse(path).getroot()
 assert root.get('viewBox')=='-12 -38 184 238'
 for e in root:
  if e.get('id') in frozen: assert shape(e)==frozen[e.get('id')],path
`], { encoding: 'utf8' });
    assert.equal(check.status, 0, check.stderr);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('the cinematic catalog and presenter support Papafrita without activating scenes or unlocks', async () => {
  const catalog = await loadCatalog({ fetcher });
  const character = catalog.characters.papafrita;
  assert.ok(character, 'Papafrita is registered as a cinematic speaker');
  assert.equal(character.sprite, 'papafrita');
  assert.equal(character.portraitLayout, 'extended');
  assert.deepEqual(Object.keys(character.expressions).sort(), names);
  assert.deepEqual(catalog.bindings, []);
  assert.ok(catalog.entries.every(entry => entry.error === null));
  const { root, content, calls } = fixture();
  const view = createPresenter(root, catalog, error => assert.fail(error));
  view.render({ active: false, time: 0, camera: { x: 572, y: 374, zoom: 1 },
    scene: { stage: { background: 'arena' } }, props: {},
    actors: { visitor: { character: 'papafrita', x: 700, y: 480, facing: -1, animation: 'walk' } },
  }, null, null, { preview: true });
  assert.ok(calls.some(call => call[0] === 'translate' && call[1] === 700 && call[2] === 480));
  for (const expression of names) {
    view.render(null, { speaker: 'papafrita', expression, text: 'Cinematic preview' }, null);
    assert.match(content.innerHTML, /portrait-extended/);
    assert.ok(content.innerHTML.includes(character.expressions[expression]));
  }
  view.render({ active: false, splash: { speaker: 'papafrita', text: 'Papafrita' } }, null, null);
  assert.match(content.innerHTML, /narrative-splash/);
  assert.match(content.innerHTML, /class="narrative-splash-extended-frame"/,
    'the larger image overflows upward from a standard-height splash frame');
  assert.ok(content.innerHTML.includes(character.expressions.neutral));
  view.dispose();
});

test('extended portrait styling is opt-in and existing characters keep their original image markup', () => {
  for (const extended of [false, true]) {
    const { root, content } = fixture();
    const view = createPresenter(root, { characters: {
      visitor: { name: 'Visitor', sprite: 'negro', expressions: { neutral: 'neutral.svg' },
        ...(extended ? { portraitLayout: 'extended' } : {}) },
    } }, () => {});
    view.render(null, { speaker: 'visitor', text: 'Preview' }, null);
    assert.ok(content.innerHTML.includes(extended
      ? '<img class="narrative-portrait portrait-extended"'
      : '<img class="narrative-portrait"'));
    view.render({ active: false, splash: { speaker: 'visitor', text: 'Preview' } }, null, null);
    assert.equal(content.innerHTML.includes('narrative-splash-extended-frame'), extended);
  }
  assert.throws(() => createPresenter({}, { characters: {
    unknown: { sprite: '__proto__' },
  } }, () => {}), /Unknown sprite for unknown: __proto__/);
});
