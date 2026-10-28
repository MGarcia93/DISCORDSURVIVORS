import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATALOG, BALANCE, EFFECTS } from '../src/reward-data.mjs';
import { describeReward, selectLevelOptions } from '../src/reward-catalog.mjs';

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
    assert.equal(choices.length, 3);
    assert.equal(choices[0].characters, character);
    assert.ok(describeReward(choices[0].ranks[0], EFFECTS)[0]);
  }
});

test('XP configuration matches approved initial pacing and remains separate from gold', () => {
  assert.equal(BALANCE.xp.factor, 10);
  assert.equal(BALANCE.xp.exponent, 2);
  assert.equal(BALANCE.xp.rewards.zombie, 1);
  assert.equal(BALANCE.xp.rewards.runner, 1);
  assert.equal(BALANCE.shopSize, 4);
  assert.notEqual(BALANCE.gold.survival, BALANCE.xp.rewards.zombie);
});
