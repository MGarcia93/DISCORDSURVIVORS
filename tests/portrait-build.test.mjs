import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const recipe = resolve('art/characters/negro/expressions.json');
const base = resolve('art/characters/negro/portrait-neutral.svg');
const hash = value => createHash('sha256').update(value).digest('hex');
const build = (args, scratch) => spawnSync('python3', ['tools/build_portraits.py', ...args], {
  encoding: 'utf8', env: { ...process.env, HOME: scratch, TMPDIR: scratch, PYTHONDONTWRITEBYTECODE: '1' },
});
const snapshot = async out => Object.fromEntries(await Promise.all((await readdir(out)).sort().map(async file => [file, hash(await readFile(join(out, file)))])));

test('Yorick expressions preserve the approved spectral gravedigger and match generated assets', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'yorick-build-'));
  try {
    const source = resolve('art/characters/yorick/portrait-neutral.svg');
    const original = hash(await readFile(source));
    const out = join(scratch, 'portraits');
    const result = build(['--recipe', resolve('art/characters/yorick/expressions.json'), '--out', out], scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['angry', 'neutral', 'surprised', 'tired'];
    assert.deepEqual((await readdir(out)).sort(), names.map(name => `${name}.svg`));
    const neutral = await readFile(join(out, 'neutral.svg'), 'utf8');
    const identity = svg => svg.replace(/<g id="expression-(?:brows|eyes|mouth)">[\s\S]*?<\/g>/g, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/ data-expression="[^"]*"/, '');
    for (const name of names) {
      const svg = await readFile(join(out, `${name}.svg`), 'utf8');
      assert.equal(svg, await readFile(resolve(`assets/narrative/portraits/yorick/${name}.svg`), 'utf8'), `${name} output is up to date`);
      assert.equal(identity(svg), identity(neutral), `${name} preserves every non-expression layer`);
      for (const id of ['arm', 'pauldron', 'hood', 'face', 'beard', 'spectral-pendant', 'shovel', 'hand']) {
        assert.ok(svg.includes(`<g id="${id}">`), `${id} exists`);
      }
      if (name !== 'neutral') assert.notEqual(svg.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0], neutral.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(hash(await readFile(source)), original);
    const before = await snapshot(out);
    assert.equal(build(['--recipe', resolve('art/characters/yorick/expressions.json'), '--out', out], scratch).status, 0);
    assert.deepEqual(await snapshot(out), before);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('Lilith cinematic portraits use the approved swept horns and black and gold costume', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'lilith-build-'));
  try {
    const source = resolve('art/characters/lilith/portrait-neutral.svg');
    const original = hash(await readFile(source));
    const out = join(scratch, 'portraits');
    const args = ['--recipe', resolve('art/characters/lilith/expressions.json'), '--out', out];
    const result = build(args, scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['angry', 'neutral', 'surprised'];
    assert.deepEqual((await readdir(out)).sort(), names.map(name => `${name}.svg`));
    const neutral = await readFile(join(out, 'neutral.svg'), 'utf8');
    const identity = svg => svg.replace(/<g id="expression-(?:brows|eyes|mouth)">[\s\S]*?<\/g>/g, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/ data-expression="[^"]*"/, '');
    const catalog = JSON.parse(await readFile(resolve('assets/narrative/characters.json'), 'utf8'));
    for (const name of names) {
      const svg = await readFile(join(out, `${name}.svg`), 'utf8');
      const registered = resolve('assets/narrative', catalog.lilith.expressions[name]);
      assert.equal(svg, await readFile(registered, 'utf8'), `${name} catalog portrait is up to date`);
      assert.equal(identity(svg), identity(neutral), `${name} preserves every non-expression layer`);
      for (const id of ['horn-crown', 'head', 'hair', 'body', 'corset', 'gorget', 'pauldrons', 'wings']) {
        assert.ok(svg.includes(`<g id="${id}">`), `${name} retains ${id}`);
      }
      if (name !== 'neutral') assert.notEqual(svg.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0], neutral.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(hash(await readFile(source)), original, 'the supplied neutral design is unchanged');
    const before = await snapshot(out);
    assert.equal(build(args, scratch).status, 0);
    assert.deepEqual(await snapshot(out), before);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('portrait command reuses approved identity for eight facial expressions, deterministically', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'portrait-build-'));
  try {
    const original = hash(await readFile(base)), out = join(scratch, 'portraits');
    const result = build(['--recipe', recipe, '--out', out], scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
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
  assert.deepEqual(Object.keys(character.expressions).sort(), ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired']);
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

test('Solago keeps one buck-toothed mouth and exposes its eight catalog expressions', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'solago-build-'));
  try {
    const solagoRecipe = resolve('art/characters/solago/expressions.json');
    const solagoBase = resolve('art/characters/solago/portrait-neutral.svg');
    const original = hash(await readFile(solagoBase)), out = join(scratch, 'portraits');
    const result = build(['--recipe', solagoRecipe, '--out', out], scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
    assert.deepEqual((await readdir(out)).sort(), names.map(name => `${name}.svg`).sort());
    const neutral = await readFile(join(out, 'neutral.svg'), 'utf8');
    const neutralMouth = neutral.match(/<g id="expression-mouth">[\s\S]*?<\/g>/)?.[0];
    for (const name of names) {
      const svg = await readFile(join(out, `${name}.svg`), 'utf8');
      assert.equal(svg, await readFile(resolve(`assets/narrative/portraits/solago/${name}.svg`), 'utf8'), `${name} output is up to date`);
      for (const id of ['body-outline', 'neck', 'shirt', 'head', 'hair', 'hair-fade', 'ear']) {
        const pattern = new RegExp(`<g id="${id}"[^>]*>[\\s\\S]*?<\\/g>`);
        assert.equal(svg.match(pattern)?.[0], neutral.match(pattern)?.[0], `${name} preserves ${id}`);
        assert.ok(svg.match(pattern), `${id} actually exists`);
      }
      assert.match(svg, new RegExp(`data-expression="${name}"`));
      if (name === 'disgusted') assert.doesNotMatch(svg, /M79 84h14v15/, 'disgusted uses the Excalibur grimace');
      else {
        assert.match(svg, /M79 84h14v15/, `${name} keeps the left paleta`);
        assert.match(svg, /M95 84h14v15/, `${name} keeps the right paleta`);
      }
      if (name !== 'neutral') assert.notEqual(svg.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0], neutral.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(hash(await readFile(solagoBase)), original, 'generation never modifies the approved source');

    const { loadCatalog } = await import('../src/narrative/catalog.mjs');
    const catalog = await loadCatalog({ fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) }) });
    const character = catalog.characters.solago;
    assert.equal(character.sprite, 'solago');
    assert.deepEqual(Object.keys(character.expressions).sort(), names);
    for (const [expression, file] of Object.entries(character.expressions)) {
      assert.match(await readFile(new URL(file), 'utf8'), new RegExp(`data-expression="${expression}"`));
    }
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('Warrior keeps one drawn face and exposes its eight catalog expressions', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'warrior-build-'));
  try {
    const warriorRecipe = resolve('art/characters/warrior/expressions.json');
    const warriorBase = resolve('art/characters/warrior/portrait-neutral.svg');
    const original = hash(await readFile(warriorBase)), out = join(scratch, 'portraits');
    const result = build(['--recipe', warriorRecipe, '--out', out], scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
    assert.deepEqual((await readdir(out)).sort(), names.map(name => `${name}.svg`).sort());
    const neutral = await readFile(join(out, 'neutral.svg'), 'utf8');
    for (const name of names) {
      const svg = await readFile(join(out, `${name}.svg`), 'utf8');
      assert.equal(svg, await readFile(resolve(`assets/narrative/portraits/warrior/${name}.svg`), 'utf8'), `${name} output is up to date`);
      for (const id of ['body-outline', 'neck', 'shirt', 'jacket', 'under-chin-fill', 'head', 'chin-fullness', 'jaw-neck-transition', 'hair', 'headband', 'ear']) {
        const pattern = new RegExp(`<g id="${id}"[^>]*>[\\s\\S]*?<\\/g>`);
        assert.equal(svg.match(pattern)?.[0], neutral.match(pattern)?.[0], `${name} preserves ${id}`);
        assert.ok(svg.match(pattern), `${id} actually exists`);
      }
      assert.match(svg, new RegExp(`data-expression="${name}"`));
      if (name !== 'neutral') assert.notEqual(svg.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0], neutral.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(hash(await readFile(warriorBase)), original, 'generation never modifies the approved source');

    const { loadCatalog } = await import('../src/narrative/catalog.mjs');
    const catalog = await loadCatalog({ fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) }) });
    const character = catalog.characters.warrior;
    assert.equal(character.sprite, 'warrior');
    assert.deepEqual(Object.keys(character.expressions).sort(), names);
    for (const [expression, file] of Object.entries(character.expressions)) {
      assert.match(await readFile(new URL(file), 'utf8'), new RegExp(`data-expression="${expression}"`));
    }
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('Papazito keeps one round face and exposes its eight catalog expressions', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'papazito-build-'));
  try {
    const recipe = resolve('art/characters/papazito/expressions.json');
    const base = resolve('art/characters/papazito/portrait-neutral.svg');
    const original = hash(await readFile(base)), out = join(scratch, 'portraits');
    const result = build(['--recipe', recipe, '--out', out], scratch);
    assert.equal(result.status, 0, result.stderr);
    const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
    assert.deepEqual((await readdir(out)).sort(), names.map(name => `${name}.svg`).sort());
    const neutral = await readFile(join(out, 'neutral.svg'), 'utf8');
    for (const name of names) {
      const svg = await readFile(join(out, `${name}.svg`), 'utf8');
      assert.equal(svg, await readFile(resolve(`assets/narrative/portraits/papazito/${name}.svg`), 'utf8'), `${name} output is up to date`);
      for (const id of ['body-outline', 'neck', 'shirt', 'construction-vest', 'reflective-bands', 'head', 'short-hair', 'ear']) {
        const pattern = new RegExp(`<g id="${id}"[^>]*>[\\s\\S]*?<\\/g>`);
        assert.equal(svg.match(pattern)?.[0], neutral.match(pattern)?.[0], `${name} preserves ${id}`);
        assert.ok(svg.match(pattern), `${id} actually exists`);
      }
      assert.match(svg, new RegExp(`data-expression="${name}"`));
      if (name !== 'neutral') assert.notEqual(svg.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0], neutral.match(/<g id="expression-eyes">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(hash(await readFile(base)), original, 'generation never modifies the approved source');

    const { loadCatalog } = await import('../src/narrative/catalog.mjs');
    const catalog = await loadCatalog({ fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) }) });
    const character = catalog.characters.papasito;
    assert.equal(character.sprite, 'papazito');
    assert.deepEqual(Object.keys(character.expressions).sort(), names);
    for (const [expression, file] of Object.entries(character.expressions)) {
      assert.match(await readFile(new URL(file), 'utf8'), new RegExp(`data-expression="${expression}"`));
    }
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
