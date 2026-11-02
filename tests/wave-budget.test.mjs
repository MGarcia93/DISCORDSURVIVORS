import test from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE, balanceFor, playtestBalance } from '../src/reward-data.mjs';
import { getAct } from '../src/campaign/acts.mjs';
import { waveEntryBudget, levelForXP } from '../src/game/wave-budget.mjs';

const act1 = getAct('act-01');
const act2 = getAct('act-02');

test('the first wave starts with the character sheet and nothing else', () => {
  const entry = waveEntryBudget(act1, 1, BALANCE);
  assert.deepEqual([entry.level, entry.choices, entry.coins, entry.xp], [1, 0, 0, 0]);
});

test('the budget is the act itself: density and rewards of the waves before it', () => {
  const entry = waveEntryBudget(act1, 3, BALANCE);
  // Wave 1 fields 48 walkers and wave 2 another 60, one XP each at the real
  // pacing. 108 XP lands on level 3: the curve asks 30 and 40 for the first two.
  assert.equal(entry.duration, 60);
  assert.equal(entry.xp, 108);
  assert.equal(entry.level, 3);
  assert.equal(entry.choices, 2);
  // One coin per walker plus the survival payout of the two cleared waves.
  assert.equal(entry.coins, 108 + 2 * BALANCE.gold.survival);
});

test('the playtest pacing moves the budget with it', () => {
  const real = waveEntryBudget(act1, 3, BALANCE);
  const fast = waveEntryBudget(act1, 3, playtestBalance());
  assert.equal(fast.duration, 15);
  assert.ok(fast.coins < real.coins, 'a shorter wave feeds fewer enemies');
  assert.ok(fast.choices > real.choices, 'the test economy levels faster');
});

test('a forced wave length is honoured by the budget', () => {
  const entry = waveEntryBudget(act1, 3, balanceFor('?waves=30'));
  assert.equal(entry.duration, 30);
  assert.equal(entry.xp, 54);
});

test('the budget never shrinks as the wave advances', () => {
  let previous = { level: 0, coins: -1 };
  for (let wave = 1; wave <= act1.boss.wave; wave++) {
    const entry = waveEntryBudget(act1, wave, BALANCE);
    assert.ok(entry.level >= previous.level, `level regressed at wave ${wave}`);
    assert.ok(entry.coins >= previous.coins, `coins regressed at wave ${wave}`);
    previous = entry;
  }
});

test('a mini-boss pays into the waves that come after its own', () => {
  const before = waveEntryBudget(act2, act2.miniboss.wave, BALANCE);
  const after = waveEntryBudget(act2, act2.miniboss.wave + 1, BALANCE);
  const maiden = BALANCE.xp.rewards[act2.miniboss.kind];
  assert.ok(after.xp > before.xp);
  assert.ok(after.xp - before.xp >= maiden, 'the mini-boss XP lands exactly once');
});

test('the level curve is the engine curve', () => {
  assert.equal(levelForXP(BALANCE, 0), 1);
  assert.equal(levelForXP(BALANCE, 29), 1);
  assert.equal(levelForXP(BALANCE, 30), 2);
  assert.equal(levelForXP(BALANCE, 69), 2);
  assert.equal(levelForXP(BALANCE, 70), 3);
});
