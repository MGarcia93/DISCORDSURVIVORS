import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getWorld } from '../src/backgrounds/index.mjs';
import act from '../src/campaign/act-01-zomboid.mjs';

function rectangles(world, width, height) {
  const calls = [];
  const ctx = {
    fillStyle: '',
    fillRect(x, y, w, h) { calls.push({ color: this.fillStyle, x, y, w, h }); },
  };
  world.draw(ctx, { width, height });
  return calls;
}

test('Project Zomboid combat uses its own street without replacing cinematic worlds', async () => {
  assert.equal(act.world, 'zomboid-combat');
  assert.equal(getWorld(act.world).id, 'zomboid-combat');
  const jhony = JSON.parse(await readFile(new URL('../assets/narrative/acts/act-01/scenes/jhony.json', import.meta.url)));
  assert.equal(jhony.stage.background, 'jhony-street');
  assert.deepEqual(jhony.stage.size, [2288, 748]);
  assert.equal(getWorld('zomboid').id, 'zomboid', 'other cinematics retain their original map');
});

test('the combat street keeps houses and wrecks outside the central fighting area', () => {
  const world = getWorld('zomboid-combat');
  assert.equal(world.id, 'zomboid-combat');
  for (const [width, height] of [[1144, 748], [480, 270]]) {
    const calls = rectangles(world, width, height);
    assert.deepEqual(calls[0], { color: '#242e27', x: 0, y: 0, w: width, h: height });
    const buildingsAndCars = calls.filter(call => ['#171e22', '#151b20'].includes(call.color));
    assert.ok(buildingsAndCars.length >= 5, 'houses and parked wrecks frame the road');
    for (const { x, y, w, h } of buildingsAndCars) {
      const overlaps = x < width * 0.88 && x + w > width * 0.12
        && y < height * 0.86 && y + h > height * 0.24;
      assert.equal(overlaps, false, 'large scenery does not cover the combat centre');
    }
    assert.equal(world.animate, undefined, 'the fixed arena needs no per-frame scenery work');
  }
});

test('all fixed Act 1 cinematics use the updated houses and cars', async () => {
  for (const file of ['arrival', 'wave-4-alarm', 'boss-intro', 'boss-defeat', 'epilogue']) {
    const scene = JSON.parse(await readFile(new URL(`../assets/narrative/acts/act-01/scenes/${file}.json`, import.meta.url)));
    assert.equal(scene.stage.background, 'zomboid-combat', `${file} must not keep the old scenery`);
    assert.equal(scene.stage.size, undefined, `${file} retains its fixed stage dimensions`);
  }
});
