import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { createCatalog } from '../src/reward-catalog.mjs';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';
import {
  initializeRewards, awardXP, beginRewards, chooseLevelReward,
  skipEmptyChoice, buyItem, finishRewards, itemPrice, nextLevelXP,
} from '../src/run-rewards.mjs';

const setup = (options = {}, character = 'negro') => {
  const run = createRun(() => 0.25, character);
  initializeRewards(run, options);
  return run;
};
const serialize = run => JSON.stringify(run);
// Whatever the shipped curve says, a test asks for "level N" and gets the XP
// that costs, instead of hardcoding a number that ages.
const toLevel = (run, target) => {
  let total = 0;
  for (let level = 1; level < target; level++) total += nextLevelXP(run, level);
  return total;
};

test('approved XP curve carries overflow and queues each earned level without stopping combat', () => {
  for (const target of [3, 4]) {
    const run = setup();
    const overflow = 7;
    assert.equal(awardXP(run, toLevel(run, target) + overflow), true);
    assert.equal(run.phase, 'playing');
    assert.equal(run.level, target);
    assert.equal(run.xp, overflow);
    assert.deepEqual(run.pendingLevels, Array.from({ length: target - 1 }, (_, index) => index + 2));
    assert.equal(run.levelChoices, null);
    assert.equal(run.coins, 0);
  }
});

test('each copy of an item costs more than the one before, and later waves charge more', () => {
  const item = { price: 40 };
  assert.deepEqual([0, 1, 2, 3].map(owned => itemPrice(item, owned)), [40, 160, 280, 400]);
  assert.equal(itemPrice(item, 0, 3), 56, 'the shelf inflates with the campaign');
});

test('invalid XP awards leave every state field unchanged', () => {
  const run = setup();
  for (const value of [-1, NaN, Infinity, 0.5]) {
    const before = serialize(run);
    assert.equal(awardXP(run, value), false);
    assert.equal(serialize(run), before);
  }
});

test('each pending level gets stable choices at its own eligibility level', () => {
  const run = setup();
  awardXP(run, toLevel(run, 3));
  run.phase = 'shop';
  // 0.1 opens the signature slot at level 2, where the only own entry is the
  // duration upgrade this case is about.
  run.random = () => 0.1;
  beginRewards(run);
  assert.equal(run.levelChoices.length, 4);
  assert.ok(!run.levelChoices.some(entry => entry.id === 'remote-bounce'));
  const before = serialize(run.levelChoices);
  beginRewards(run);
  assert.equal(serialize(run.levelChoices), before);
  assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
  assert.deepEqual(run.pendingLevels, [3]);
  assert.equal(run.levelRanks['otaku-time'], 1);
  assert.equal(run.player.rewardBonuses.waifuDuration, 1);
  assert.equal(run.shopOffers, null);
});

test('shop purchases are blocked until all level choices are resolved', () => {
  const run = setup();
  run.coins = 1000;
  awardXP(run, nextLevelXP(run, 1));
  run.phase = 'shop';
  beginRewards(run);
  const before = serialize(run);
  assert.equal(buyItem(run, 'scissors'), false);
  assert.equal(chooseLevelReward(run, 'not-offered'), false);
  assert.equal(skipEmptyChoice(run), false);
  assert.equal(serialize(run), before);
  assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
  assert.equal(run.pendingLevels.length, 0);
  assert.equal(run.shopOffers.length, 4);
});

test('empty eligible level pools explicitly advance without granting or spending anything', () => {
  const catalog = createCatalog({ items: [], upgrades: [] });
  const run = setup({ catalog });
  awardXP(run, 29);
  run.phase = 'shop';
  beginRewards(run);
  assert.deepEqual(run.levelChoices, []);
  assert.equal(skipEmptyChoice(run), true);
  assert.equal(run.pendingLevels.length, 1);
  assert.equal(skipEmptyChoice(run), true);
  assert.equal(run.level, 3);
  assert.deepEqual(run.levelRanks, {});
  assert.deepEqual(run.shopOffers, []);
  assert.equal(run.coins, 0);
});

test('shop offers are distinct and stable and purchases never replace a sold offer', () => {
  const run = setup();
  run.phase = 'shop'; run.coins = 1000;
  beginRewards(run);
  const ids = run.shopOffers.map(offer => offer.id);
  assert.equal(new Set(ids).size, 4);
  const item = run.rewardCatalog.items.find(entry => entry.id === ids[0]);
  assert.equal(buyItem(run, item.id), true);
  assert.equal(run.coins, 1000 - item.price);
  assert.equal(run.items[item.id], 1);
  assert.equal(run.shopOffers[0].bought, true);
  beginRewards(run);
  assert.deepEqual(run.shopOffers.map(offer => offer.id), ids);
  const before = serialize(run);
  assert.equal(buyItem(run, item.id), false);
  assert.equal(buyItem(run, 'missing'), false);
  assert.equal(serialize(run), before);
});

test('unaffordable purchases fail atomically; saved gold is not reset', () => {
  const run = setup();
  run.phase = 'shop'; run.coins = 1;
  beginRewards(run);
  const before = serialize(run);
  assert.equal(buyItem(run, run.shopOffers[0].id), false);
  assert.equal(serialize(run), before);
  finishRewards(run);
  assert.equal(run.coins, 1);
  assert.equal(run.level, 1);
});

test('items can reappear next wave until their own cap; fewer or no offers are valid', () => {
  const catalog = createCatalog({ items: [{
    id: 'health', name: 'Health', lore: 'Example.', price: 10, maxCopies: 2,
    modifiers: [{ stat: 'life', operation: 'flat', value: 20 }],
  }], upgrades: [] });
  const run = setup({ catalog });
  run.phase = 'shop'; run.coins = 100; run.player.hp = 60;
  for (const hp of [80, 100]) {
    beginRewards(run);
    assert.equal(run.shopOffers.length, 1);
    assert.equal(buyItem(run, 'health'), true);
    assert.equal(run.player.hp, hp);
    finishRewards(run);
  }
  beginRewards(run);
  assert.deepEqual(run.shopOffers, []);
  assert.equal(run.items.health, 2);
  // The second copy costs four times: 10 + 40.
  assert.equal(run.coins, 50);
});

test('starting a later reward cycle preserves XP, items, ranks and other stat sources', () => {
  const run = setup();
  awardXP(run, nextLevelXP(run, 1) + 2);
  run.phase = 'shop'; beginRewards(run);
  const choice = run.levelChoices.find(entry => entry.characters === 'all');
  assert.equal(chooseLevelReward(run, choice.id), true);
  const stats = serialize(run.statState);
  finishRewards(run);
  assert.equal(run.xp, 2);
  assert.equal(run.levelRanks[choice.id], 1);
  assert.equal(serialize(run.statState), stats);
  assert.equal(run.shopOffers, null);
});

test('reward generation and rejected actions cannot grant a character ability automatically', () => {
  const run = setup();
  awardXP(run, 150);
  assert.equal(run.player.rewardBonuses.bounce, undefined);
  run.phase = 'shop'; beginRewards(run);
  // Offering is not granting: the guaranteed milestone is listed, not applied.
  const offered = run.levelChoices.find(entry => entry.id !== 'remote-bounce');
  assert.ok(run.levelChoices.length > 0);
  chooseLevelReward(run, offered.id);
  assert.equal(run.player.rewardBonuses.bounce, undefined);
  assert.equal(chooseLevelReward(run, 'not-in-this-selection'), false);
  assert.equal(run.player.rewardBonuses.bounce, undefined);
});

test('every world keeps paying experience, fractional perAct included', () => {
  const later = (act, kills) => {
    const run = createRun(() => 0.25, 'negro', {}, act);
    initializeRewards(run);
    run.spawnIn = run.shotIn = 1e6;
    run.enemies = Array.from({ length: kills }, (_, index) => ({ id: index + 1, kind: 'zombie', hp: 0, x: 0, y: 0 }));
    step(run, 0, {});
    return run;
  };
  // The first world is the reference: whole points per kill.
  const reference = later(PLAYABLE_ACTS[0], 20);
  assert.deepEqual([reference.level, reference.xp, reference.xpCarry], [2, 11, 0]);
  // The second world pays 1.6 per kill. The product used to be rejected for not
  // being a whole number, so the campaign stopped levelling the moment it left
  // Act 1: twenty kills are 32 points there, level 3 with 3 over.
  const second = later(PLAYABLE_ACTS[1], 20);
  assert.deepEqual([second.level, second.xp], [3, 3], 'the second world still levels');
  // Six kills there are 9.6 points: one level and a change, and the change
  // waits in the carry instead of being rounded away or thrown out.
  const carried = later(PLAYABLE_ACTS[1], 6);
  assert.deepEqual([carried.level, carried.xp, carried.xpCarry], [2, 0, 0.6]);
  // A late world pays three and a half points per kill and keeps growing.
  const late = later(PLAYABLE_ACTS[4], 40);
  assert.deepEqual([late.level, late.xp, late.xpCarry], [5, 34, 0], 'no float drift in the carry');
});
