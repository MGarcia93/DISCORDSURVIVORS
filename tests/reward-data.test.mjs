import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATALOG, BALANCE, EFFECTS } from '../src/reward-data.mjs';
import { itemPrice } from '../src/run-rewards.mjs';
import { getAct } from '../src/campaign/acts.mjs';
import { waveEntryBudget } from '../src/game/wave-budget.mjs';
import { describeReward, selectLevelOptions } from '../src/reward-catalog.mjs';
import { createRun } from '../src/engine.mjs';
import { createStatState, resolveStatState, withStatSource } from '../src/stat-modifiers.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';
import { UNIT_PX } from '../src/stats.mjs';
import { enemyAttackRange } from '../src/enemies/index.mjs';

test('the shelf costs more than the campaign pays by act four', () => {
  const total = DEFAULT_CATALOG.items.reduce((sum, item) => {
    if (item.enabled === false) return sum;
    for (let owned = 0; owned < item.maxCopies; owned++) sum += itemPrice(item, owned, 1);
    return sum;
  }, 0);
  const budget = waveEntryBudget(getAct('act-04'), 1, BALANCE);
  assert.ok(budget.coins < total * 0.6,
    `act 4 wave 1 buys less than 60% of the shelf (${budget.coins} of ${total})`);
});

test('the initial catalog contains the fifteen approved generic items with different prices', () => {
  assert.equal(DEFAULT_CATALOG.items.length, 15);
  assert.equal(new Set(DEFAULT_CATALOG.items.map(item => item.id)).size, 15);
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
  assert.equal(BALANCE.xp.factor, 9);
  assert.equal(BALANCE.xp.exponent, 1.1);
  assert.ok(BALANCE.xp.rewards.zombie >= 1);
  assert.ok(BALANCE.xp.rewards.runner >= 1);
  assert.equal(BALANCE.shopSize, 4);
  assert.notEqual(BALANCE.gold.survival, BALANCE.xp.rewards.zombie);
});

test('the cadence reward adds the same attacks per second to every sheet', () => {
  const entry = DEFAULT_CATALOG.upgrades.find(upgrade => upgrade.id === 'stat-attackSpeed');
  assert.ok(entry.ranks.every(rank => rank.modifiers.every(modifier => modifier.stat === 'attackSpeed'
    && modifier.operation === 'flat')), 'cadence is a rate: a percentage makes the fast body gain more');
  const gain = character => {
    const run = createRun(() => 0.5, character);
    let state = createStatState(run.player);
    entry.ranks.forEach((rank, index) => { state = withStatSource(state, `rank:${index}`, rank.modifiers); });
    return 1 / resolveStatState(state).shotInterval - 1 / run.player.shotInterval;
  };
  const fast = gain('papafrita');
  const slow = gain('warrior');
  assert.ok(Math.abs(fast - slow) < 1e-9, `both gain the same rate (${fast} vs ${slow})`);
});

test('the paleta growth stacks three times and still cannot outrange a ranged enemy', () => {
  const entry = DEFAULT_CATALOG.upgrades.find(upgrade => upgrade.id === 'paleta-growth');
  assert.equal(entry.characters, 'solago');
  assert.equal(entry.minLevel, 3);
  assert.equal(entry.ranks.length, 3, 'it stacks: three mouths, three reaches');
  assert.ok(entry.chance <= 0.2, `a jackpot cannot be the most common offer (${entry.chance})`);

  const run = createRun(() => 0.5, 'solago');
  const reaches = [run.player.attackRange];
  for (let rank = 0; rank < 3; rank++) {
    assert.equal(applyUpgradeRank(run, entry), true);
    reaches.push(run.player.attackRange);
  }
  assert.ok(reaches[0] < 95, 'she starts in melee');
  // Flat, like every reach source: each rank is the same step, never a share of
  // her sheet, and the whole ladder still leaves her inside a ranged enemy's
  // reach without needing a cap.
  for (let rank = 1; rank < reaches.length; rank++) {
    assert.ok(Math.abs((reaches[rank] - reaches[rank - 1]) - 5 * UNIT_PX) < 1e-9, `rank ${rank} is a flat step`);
  }
  assert.ok(reaches[3] < enemyAttackRange('alchemist'), 'the shortest ranged reach is still longer');
  assert.ok(reaches[3] < 179, `and she stays under 179 px (${reaches[3]})`);
});

test('no reach ceiling anywhere, and the shelf keeps Solago under 179 px', async () => {
  const { createRun } = await import('../src/engine.mjs');
  const { applyUpgradeRank, grantItem } = await import('../src/run-rewards.mjs');
  const reach = DEFAULT_CATALOG.upgrades.find(entry => entry.id === 'stat-attackDistance');
  const catalogue = DEFAULT_CATALOG.items.filter(item => item.modifiers.some((modifier) => modifier.stat === 'attackDistance'));
  const maxReach = (character) => {
    const run = createRun(() => 0.5, character);
    for (let rank = 0; rank < reach.ranks.length; rank++) applyUpgradeRank(run, reach);
    if (character === 'solago') {
      const jackpot = DEFAULT_CATALOG.upgrades.find(entry => entry.id === 'paleta-growth');
      for (let rank = 0; rank < jackpot.ranks.length; rank++) applyUpgradeRank(run, jackpot);
    }
    for (const item of catalogue) for (let copy = 0; copy < item.maxCopies; copy++) grantItem(run, item.id);
    return run.player.attackRange;
  };
  // No ficha declares a ceiling: this is arithmetic, not a clamp.
  for (const entry of Object.values((await import('../src/characters/index.mjs')).CHARACTERS)) {
    assert.equal(entry.statCaps?.attackDistance, undefined, `${entry.id} has no reach cap`);
  }
  const solago = maxReach('solago');
  assert.ok(solago <= 179, `Solago tops out at ${solago} px with the whole shelf and her jackpot`);
  assert.ok(maxReach('jhony') < maxReach('negro'), 'the melee body still reaches less than the ranged one');
});
