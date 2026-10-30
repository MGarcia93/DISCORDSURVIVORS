import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const names = ['angry', 'annoyed', 'disgusted', 'happy', 'neutral', 'scared', 'surprised', 'tired'];
const identity = svg => svg.replace(/<g id="expression-(?:brows|eyes|mouth)">[\s\S]*?<\/g>/g, '')
  .replace(/<title>[\s\S]*?<\/title>/, '').replace(/ data-expression="[^"]*"/, '');

test('Maxi cinematic expressions preserve the approved identity and reproducible generated portraits', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'maxi-blanco-portraits-'));
  try {
    const result = spawnSync('python3', ['tools/build_portraits.py', '--recipe',
      'art/characters/maxi-blanco/expressions.json', '--out', scratch], {
      encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, names.map(name => `${name}.svg\n`).join(''));
    assert.deepEqual((await readdir(scratch)).sort(), names.map(name => `${name}.svg`));
    const neutral = await readFile(join(scratch, 'neutral.svg'), 'utf8');
    const facialLayers = new Set();
    for (const name of names) {
      const svg = await readFile(join(scratch, `${name}.svg`), 'utf8');
      assert.equal(svg, await readFile(`assets/narrative/portraits/maxi-blanco/${name}.svg`, 'utf8'));
      assert.equal(identity(svg), identity(neutral), `${name} preserves identity`);
      assert.doesNotMatch(svg, /id="glasses"/);
      facialLayers.add(svg.match(/<g id="expression-mouth">[\s\S]*?<\/g>/)?.[0]);
    }
    assert.equal(facialLayers.size, names.length, 'each expression has a distinct mouth');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
