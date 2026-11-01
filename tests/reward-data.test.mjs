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
  assert.equal(BALANCE.xp.factor, 14);
  assert.equal(BALANCE.xp.exponent, 0.5);
  assert.ok(BALANCE.xp.rewards.zombie >= 1);
  assert.ok(BALANCE.xp.rewards.runner >= 1);
  assert.equal(BALANCE.shopSize, 4);
  assert.notEqual(BALANCE.gold.survival, BALANCE.xp.rewards.zombie);
});

test('the paleta growth stacks three times and ends up at a ranged reach', () => {
  const entry = DEFAULT_CATALOG.upgrades.find(upgrade => upgrade.id === 'paleta-growth');
  assert.equal(entry.characters, 'solago');
  assert.equal(entry.minLevel, 3);
  assert.equal(entry.ranks.length, 3, 'it stacks: three mouths, three reaches');
  assert.ok(entry.chance < 1, 'and it does not show up every run');

  const run = createRun(() => 0.5, 'solago');
  const reaches = [run.player.attackRange];
  for (let rank = 0; rank < 3; rank++) {
    assert.equal(applyUpgradeRank(run, entry), true);
    reaches.push(run.player.attackRange);
  }
  assert.ok(reaches[0] < 90, 'she starts in melee');
  assert.ok(reaches[1] > 130 && reaches[1] < 170, `first rank is a step, not a teleport (${reaches[1]})`);
  assert.ok(reaches[3] > 260, `third rank reaches like a ranged character (${reaches[3]})`);
  assert.ok(reaches[0] < reaches[1] && reaches[1] < reaches[2] && reaches[2] < reaches[3], 'each rank is more');
});
