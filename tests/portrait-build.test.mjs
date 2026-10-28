import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const recipe = resolve('art/characters/negro/expressions.json');
const base = resolve('art/characters/negro/portrait-neutral-v2.svg');
const hash = value => createHash('sha256').update(value).digest('hex');
const build = (args, scratch) => spawnSync('python3', ['tools/build_portraits.py', ...args], {
  encoding: 'utf8', env: { ...process.env, HOME: scratch, TMPDIR: scratch, PYTHONDONTWRITEBYTECODE: '1' },
});
const snapshot = async out => Object.fromEntries(await Promise.all((await readdir(out)).sort().map(async file => [file, hash(await readFile(join(out, file)))])));

test('portrait command reuses approved identity for seven facial expressions, deterministically', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'portrait-build-'));
  try {
    const original = hash(await readFile(base)), out = join(scratch, 'portraits');
    const result = build(['--recipe', recipe, '--out', out], scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['annoyed', 'disgusted', 'disgusted-strong', 'happy', 'neutral', 'surprised', 'tired'];
    assert.deepEqual((await readdir(out)).sort(), names.map(name => `${name}.svg`).sort());
    const neutral = await readFile(join(out, 'neutral.svg'), 'utf8');
    for (const name of names) {
      const svg = await readFile(join(out, `${name}.svg`), 'utf8');
      assert.equal(svg, await readFile(resolve(`assets/narrative/portraits/negro/${name}.svg`), 'utf8'), `${name} output is up to date`);
      for (const id of ['body-outline', 'neck', 'hood', 'hoodie', 'head', 'hair', 'ear', 'glasses', 'drawstrings']) {
        const pattern = new RegExp(`<g id="${id}"[^>]*>[\\s\\S]*?<\\/g>`);
        assert.equal(svg.match(pattern)?.[0], neutral.match(pattern)?.[0], `${name} preserves ${id}`);
        assert.ok(svg.match(pattern), `${id} actually exists`);
      }
      assert.match(svg, new RegExp(`data-expression="${name}"`));
      if (name !== 'neutral') assert.notEqual(svg.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0], neutral.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(hash(await readFile(base)), original, 'generation never modifies the approved source');
    assert.notEqual(await readFile(join(out, 'disgusted.svg'), 'utf8'), await readFile(join(out, 'disgusted-strong.svg'), 'utf8'), 'the repeated gag has a stronger facial variant');
    const before = await snapshot(out);
    assert.equal(build(['--recipe', recipe, '--out', out], scratch).status, 0);
    assert.deepEqual(await snapshot(out), before, 'rebuilding produces identical bytes');
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('the narrative catalog exposes the same character with all generated expressions', async () => {
  const { loadCatalog } = await import('../src/narrative/catalog.mjs');
  const catalog = await loadCatalog({ fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) }) });
  const character = catalog.characters['maxi-negro'];
  assert.equal(character.sprite, 'negro');
  assert.deepEqual(Object.keys(character.expressions).sort(), ['annoyed', 'disgusted', 'disgusted-strong', 'happy', 'neutral', 'surprised', 'tired']);
  for (const [expression, file] of Object.entries(character.expressions)) {
    assert.match(await readFile(new URL(file), 'utf8'), new RegExp(`data-expression="${expression}"`));
  }
});

test('rejected recipe or unknown option leaves all existing generated portraits unchanged', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'portrait-reject-'));
  try {
    const out = join(scratch, 'portraits');
    assert.equal(build(['--recipe', recipe, '--out', out], scratch).status, 0);
    const before = await snapshot(out), invalid = JSON.parse(await readFile(recipe, 'utf8'));
    await copyFile(base, join(scratch, 'base.svg'));
    invalid.base = 'base.svg';
    invalid.expressions.happy.hair = [];
    const badRecipe = join(scratch, 'invalid.json');
    await writeFile(badRecipe, JSON.stringify(invalid));
    const rejected = build(['--recipe', badRecipe, '--out', out], scratch);
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /Unsupported expression layer: hair/);
    assert.equal(rejected.stdout, '');
    assert.deepEqual(await snapshot(out), before);
    const unknown = build(['--recipe', recipe, '--out', out, '--unknown'], scratch);
    assert.equal(unknown.status, 2);
    assert.match(unknown.stderr, /unrecognized arguments/);
    assert.deepEqual(await snapshot(out), before);
    const help = build(['--help'], scratch);
    assert.equal(help.status, 0);
    assert.match(help.stdout, /--recipe/);
    assert.match(help.stdout, /--out/);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
