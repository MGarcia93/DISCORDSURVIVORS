import test from 'node:test';
import assert from 'node:assert/strict';
import maxi, { drawMaxiBlanco } from '../src/npcs/maxi-blanco.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

function record(options) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => (...args) => calls.push([key, ...args]),
    set: (_, key, value) => { calls.push(['set', key, value]); return true; },
  });
  drawMaxiBlanco(ctx, 100, 150, options);
  return calls;
}

test('Maxi Blanco is a noncombatant cameo, not a playable survivor', () => {
  assert.equal(maxi.id, 'maxi-blanco');
  assert.equal(maxi.label, 'Maxi Blanco');
  assert.equal(maxi.stats, undefined);
  assert.equal(maxi.unlock, undefined);
  assert.equal(Object.hasOwn(CHARACTERS, maxi.id), false);
});

test('the outfit uses navy cloth, gray joggers and dark slippers on an integer grid', () => {
  const calls = record({});
  for (const color of ['#303d60', '#aaaab0', '#292a33']) {
    assert.ok(calls.some(call => call[0] === 'set' && call[2] === color), color);
  }
  assert.ok(calls.filter(call => call[0] === 'fillRect').every(call => call.slice(1).every(Number.isInteger)));
  assert.equal(calls[0][0], 'save');
  assert.equal(calls.at(-1)[0], 'restore');
});

test('the cameo supports both facings and two walking frames without idle jitter', () => {
  assert.deepEqual(record({ time: 0 }), record({ time: 2 }));
  assert.notDeepEqual(record({ moving: true, time: 0 }), record({ moving: true, time: 0.125 }));
  assert.ok(record({ facing: -1 }).some(call => call[0] === 'scale' && call[1] === -2 && call[2] === 2));
});
