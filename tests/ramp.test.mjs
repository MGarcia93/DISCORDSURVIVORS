import test from 'node:test';
import assert from 'node:assert/strict';
import { mixAt, pickKind } from '/home/max/discord-survivol/src/waves.mjs';

test('a ramped wave changes its mix as the clock runs', () => {
  const wave = { perMinute: 60, mix: { a: 1 }, ramp: [
    { until: 0.5, mix: { a: 1 } },
    { until: 1, mix: { b: 0.8, a: 0.2 } },
  ] };
  assert.equal(mixAt(wave, 0.1).a, 1, 'the first stage keeps its own mix');
  assert.equal(mixAt(wave, 0.6).b, 0.8, 'the second stage changes it');
  assert.equal(mixAt(wave, 0.99).b, 0.8);
  for (const progress of [0, 0.3, 0.6, 0.99]) {
    const total = Object.values(mixAt(wave, progress)).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `stage at ${progress} shares one roll`);
  }
  assert.equal(pickKind(wave, () => 0.99, 0.1), 'a');
});
