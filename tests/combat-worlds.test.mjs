import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine.mjs';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';
import { validateAct } from '../src/campaign/validate.mjs';
import act04 from '../src/campaign/act-04-exiles.mjs';

const previousDocument = globalThis.document;
const previousWindow = globalThis.window;
globalThis.document = { querySelector: () => null };
globalThis.window = { matchMedia: () => ({ matches: false }) };
const { drawRunScene, playerFacing } = await import('../src/game/renderer.mjs');
globalThis.document = previousDocument;
globalThis.window = previousWindow;

test('the body turns with the swing and goes back to the keys afterwards', () => {
  assert.equal(playerFacing({ attackFlash: 0.2, swingFacing: -1 }, 1), -1, 'a blow on the left turns him left');
  assert.equal(playerFacing({ attackFlash: 0.2, swingFacing: 1 }, -1), 1, 'a blow on the right turns him right');
  assert.equal(playerFacing({ attackFlash: 0, swingFacing: -1 }, 1), 1, 'out of the flash the keys decide again');
  assert.equal(playerFacing({ attackFlash: 0.2 }, -1), -1, 'a shot without a swing keeps the walking face');
});

function painting(run, options) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_target, key) => key === 'canvas' ? null : (...args) => {
      calls.push([key, ...args]);
      return 0;
    },
    set: (_target, key, value) => { calls.push(['set', key, value]); return true; },
  });
  drawRunScene(ctx, run, options);
  return calls;
}

test('Act 4 combat visits the laboratory for waves 4 and 5, then returns to the camp', () => {
  const run = createRun(() => 0.5, 'negro', {}, act04);
  for (let wave = 1; wave <= 6; wave++) {
    run.wave = wave;
    const world = wave === 4 || wave === 5 ? 'laboratory' : 'exiles';
    assert.deepEqual(painting(run), painting(run, { world }), `wave ${wave}`);
  }
});

test('every wave paints its own world, and an explicit sandbox world still wins', () => {
  for (const act of PLAYABLE_ACTS.filter(act => act.id !== act04.id)) {
    const run = createRun(() => 0.5, 'negro', {}, act);
    for (const { wave, world } of act.waves) {
      run.wave = wave;
      assert.deepEqual(painting(run), painting(run, { world: world ?? act.world }), `${act.id} wave ${wave}`);
    }
  }
  const run = createRun(() => 0.5, 'negro', {}, act04);
  run.wave = 4;
  const overridden = painting(run, { world: 'rift' });
  run.wave = 1;
  assert.deepEqual(overridden, painting(run, { world: 'rift' }));
});

test('optional wave worlds must name a registered background', () => {
  const invalid = structuredClone(act04);
  invalid.waves[3].world = 'missing-laboratory';
  assert.throws(() => validateAct(invalid), /wave 4 unknown world: missing-laboratory/);
  assert.equal(validateAct(act04), act04);
});
