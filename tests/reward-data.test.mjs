import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATALOG, BALANCE, EFFECTS } from '../src/reward-data.mjs';
import { describeReward, selectLevelOptions } from '../src/reward-catalog.mjs';
import { createRun } from '../src/engine.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';

test('the initial catalog contains the eight approved generic items with different prices', () => {
  assert.equal(DEFAULT_CATALOG.items.length, 8);
  assert.equal(new Set(DEFAULT_CATALOG.items.map(item => item.id)).size, 8);
  assert.ok(new Set(DEFAULT_CATALOG.items.map(item => item.price)).size > 1);
  assert.ok(DEFAULT_CATALOG.items.every(item => item.lore && item.maxCopies > 0));
  const alcohol = DEFAULT_CATALOG.items.find(item => item.id === 'alcohol');
  assert.ok(alcohol.modifiers.some(effect => effect.value < 0));
});

test('all six common stats and each character have initial data-authored options', () => {
  const common = DEFAULT_CATALOG.upgrades.filter(entry => entry.characters === 'all');
  assert.equal(new Set(common.flatMap(entry => entry.ranks[0].modifiers.map(effect => effect.stat))).size, 6);
  for (const character of ['negro', 'solago', 'warrior', 'papazito']) {
    const choices = selectLevelOptions(DEFAULT_CATALOG, { character, level: 2, ranks: {} }, () => 0);
    assert.equal(choices.length, 4);
    assert.equal(choices[0].characters, character);
    assert.ok(describeReward(choices[0].ranks[0], EFFECTS)[0]);
  }
});

test('XP configuration matches approved initial pacing and remains separate from gold', () => {
  assert.equal(BALANCE.xp.factor, 10);
  assert.equal(BALANCE.xp.exponent, 2);
  assert.ok(BALANCE.xp.rewards.zombie >= 1);
  assert.ok(BALANCE.xp.rewards.runner >= 1);
  assert.equal(BALANCE.shopSize, 4);
  assert.notEqual(BALANCE.gold.survival, BALANCE.xp.rewards.zombie);
});

test('the paleta growth turns her bite into reach in a single rank', () => {
  const entry = DEFAULT_CATALOG.upgrades.find(upgrade => upgrade.id === 'paleta-growth');
  assert.equal(entry.characters, 'solago');
  assert.equal(entry.minLevel, 3);
  assert.equal(entry.ranks.length, 1, 'one rank: finding it IS the build');
  assert.ok(entry.chance < 1, 'and it does not show up every run');

  const run = createRun(() => 0.5, 'solago');
  const base = run.player.attackRange;
  assert.ok(base < 90, 'she starts in melee');
  assert.equal(applyUpgradeRank(run, entry), true);
  assert.ok(run.player.attackRange > 190, `one rank already reaches (${run.player.attackRange})`);
});
