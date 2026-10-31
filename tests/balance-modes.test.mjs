import test from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE, balanceFor, playtestBalance } from '../src/reward-data.mjs';
import { createRun } from '../src/engine.mjs';
import { awardXP } from '../src/run-rewards.mjs';

// The shipped balance is the real one; the fast pacing is a tool the user turns
// on, not something the environment turns on for them.
test('the shipped balance runs the real pacing and pays one XP per ordinary kill', () => {
  const run = createRun(() => 0.5);
  assert.equal(run.act.duration, 60);
  assert.equal(run.duration, run.act.duration, 'no hostname shortens the wave');
  assert.equal(run.rewardBalance.xp.rewards.zombie, 1);
  assert.equal(run.rewardBalance.xp.multiplier ?? 1, 1);
});

test('ten ordinary kills buy the second level, not one', () => {
  const run = createRun(() => 0.5);
  for (let kill = 0; kill < 9; kill++) assert.equal(awardXP(run, 1), true);
  assert.equal(run.level, 1);
  assert.equal(run.xp, 9);
  assert.equal(awardXP(run, 1), true);
  assert.equal(run.level, 2);
  assert.equal(run.xp, 0);
  assert.deepEqual(run.pendingLevels, [2]);
});

test('playtest mode is opt-in and restores the fast pacing', () => {
  assert.equal(balanceFor('').waves, undefined);
  assert.equal(balanceFor('').xp.multiplier ?? 1, 1);
  const fast = balanceFor('?playtest');
  assert.equal(fast.waves.duration, 15);
  assert.equal(fast.xp.multiplier, 10);
  assert.equal(fast.xp.factor, BALANCE.xp.factor, 'the curve itself is shared');
});

test('?waves forces only the wave length, in either mode', () => {
  assert.equal(balanceFor('?waves=30').waves.duration, 30);
  assert.equal(balanceFor('?waves=30').xp.multiplier ?? 1, 1);
  assert.equal(balanceFor('?playtest&waves=45').waves.duration, 45);
  assert.equal(balanceFor('?playtest&waves=45').xp.multiplier, 10);
  assert.equal(balanceFor('?waves=nope').waves, undefined);
});

test('the multiplier scales what a kill pays and leaves the curve alone', () => {
  const fast = createRun(() => 0.5, 'negro', { balance: playtestBalance() });
  assert.equal(awardXP(fast, 1), true);
  assert.equal(fast.level, 2, 'one ordinary kill still buys a level in playtest');
  assert.equal(fast.xp, 0);
  // A fractional award is still rejected after scaling.
  const real = createRun(() => 0.5);
  const before = JSON.stringify(real);
  assert.equal(awardXP(real, 0.5), false);
  assert.equal(JSON.stringify(real), before);
});
