import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import jhony, { drawJhony } from '../src/npcs/jhony.mjs';
import { CHARACTERS, ROSTER } from '../src/characters/index.mjs';
import { drawCast, STAGE_CAST } from '../src/screens/world-cast.mjs';

function record(draw) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform'
      ? () => ({ a: 1, d: 1 })
      : (...args) => { calls.push([key, ...args]); },
    set: (_, key, value) => { calls.push(['set', key, value]); return true; },
  });
  draw(ctx);
  return calls;
}

test('Jhony preserves the approved black-leather sprite in both directions and walk frames', () => {
  // Fingerprints captured from approved draft 03 before production integration.
  const cases = [
    [{}, 'b69c41c75cc47e06b33b386e1ebeb58bc00dd0fe2a2a462003b067010c3a09aa'],
    [{ facing: -1 }, 'a26f5b8ffcb4c3bc96bc0f4a20287e0239f774d3a29141077975d4a621c941ab'],
    [{ moving: true, time: 0 }, 'b69c41c75cc47e06b33b386e1ebeb58bc00dd0fe2a2a462003b067010c3a09aa'],
    [{ moving: true, time: 0.125 }, '018082a86fcccc6dc6bf23cb132a614be149ca3ddce6f20a06703a9de426b640'],
  ];
  for (const [options, expected] of cases) {
    const calls = record(ctx => drawJhony(ctx, 100, 150, options));
    const hash = createHash('sha256').update(JSON.stringify(calls)).digest('hex');
    assert.equal(hash, expected, JSON.stringify(options));
    for (const [kind, ...args] of calls.filter(([kind]) => kind === 'fillRect')) {
      assert.equal(kind, 'fillRect');
      assert.ok(args.every(Number.isInteger), 'all sprite rectangles use integer pixels');
    }
  }
});

test('Jhony joins only the stage cast, never the playable roster or unlock system', () => {
  assert.deepEqual(ROSTER.map(character => character.id), ['negro', 'solago', 'warrior', 'papazito']);
  assert.equal(Object.hasOwn(CHARACTERS, 'jhony'), false);
  assert.deepEqual(STAGE_CAST, [...ROSTER, jhony]);
  assert.equal(jhony.id, 'jhony');
  assert.equal(jhony.label, 'Jhony');
  assert.equal(jhony.stats, undefined);
  assert.equal(jhony.unlock, undefined);
});

test('the world viewer draws the controlled Jhony with the approved movement and facing', () => {
  const pos = { x: 0.70, y: 0.80 };
  const options = { actor: 'jhony', pos, moving: true, facing: -1 };
  const cast = record(ctx => drawCast(ctx, 1144, 748, 0.125, options));
  const expected = record(ctx => jhony.draw(ctx, 1144 * pos.x, 748 * pos.y, {
    time: 0.125, moving: true, facing: -1, player: {},
  }));
  assert.deepEqual(cast.slice(-expected.length), expected);
  assert.ok(expected.some(call => call[0] === 'scale' && call[1] === -2 && call[2] === 2));
  assert.ok(expected.some(call => call[0] === 'translate' && call[1] === 801 && call[2] === 598));
});

test('adding the NPC leaves every existing world-viewer actor drawing unchanged', () => {
  for (const actor of ROSTER.map(character => character.id)) {
    const pos = { x: 0.42, y: 0.63 };
    const options = { actor, pos, moving: true, facing: -1 };
    const expected = record(ctx => ROSTER.forEach((character, index) => {
      const controlled = character.id === actor;
      character.draw(ctx, 1144 * (controlled ? pos.x : 0.30 + index * 0.14),
        748 * (controlled ? pos.y : 0.68), {
          time: 1.1, moving: controlled, facing: controlled ? -1 : 1, player: {},
        });
    }));
    const actual = record(ctx => drawCast(ctx, 1144, 748, 1.1, options));
    assert.deepEqual(actual.slice(0, expected.length), expected, actor);
  }
});
