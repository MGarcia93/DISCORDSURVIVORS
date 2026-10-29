import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun as engineRun, step, chooseUpgrade, buyHeal, startNextWave,
  chooseLevelReward, buyItem, sellBelonging, UPGRADES,
} from '../src/engine.mjs';
import { createCatalog } from '../src/reward-catalog.mjs';
import { beginRewards, awardXP } from '../src/run-rewards.mjs';
import { resolveStatState } from '../src/stat-modifiers.mjs';
import { BALANCE } from '../src/reward-data.mjs';

const oneXp = structuredClone(BALANCE);
oneXp.xp.rewards = { zombie: 1, runner: 1, brute: 1, boss: 0 };
const createRun = (random = Math.random, character = 'negro', options = {}) =>
  engineRun(random, character, { balance: oneXp, ...options });

const modifier = (stat, value) => ({ stat, operation: 'flat', value });
const catalog = modifiers => createCatalog({
  items: [{ id: 'probe', name: 'Probe', lore: 'Regression fixture',
    price: 0, maxCopies: 1, modifiers }], upgrades: [],
});

function settle(run, count) {
  run.spawnIn = run.shotIn = 1e6;
  run.enemies = Array.from({ length: count }, (_, i) => ({
    id: i + 1, kind: i % 2 ? 'runner' : 'zombie', hp: 0, x: 0, y: 0,
  }));
  step(run, 0, {});
}

test('exact overflow survives settlement and wave changes', () => {
  const run = createRun(() => 0);
  settle(run, 100);
  assert.deepEqual([run.level, run.xp, run.kills], [3, 50, 100]);
  settle(run, 50);
  assert.deepEqual([run.level, run.xp, run.kills], [4, 10, 150]);
  step(run, 0, {});
  assert.equal(run.kills, 150);
  run.time = run.duration;
  step(run, 0, {});
  assert.equal(run.xp, 10);
  assert.equal(startNextWave(run), false);
  while (run.pendingLevels.length) {
    assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
  }
  assert.equal(startNextWave(run), true);
  assert.equal(run.xp, 10);
});

test('HP examples apply once through item purchases', () => {
  for (const [hp, delta, expected] of [[60, 20, 80], [60, -20, 60], [90, -20, 80]]) {
    const run = createRun(() => 0, 'negro', { catalog: catalog([modifier('life', delta)]) });
    run.player.hp = hp;
    run.player.maxHp = 100;
    run.statState = Object.freeze({
      base: Object.freeze({ ...run.statState.base, life: 100 }), sources: Object.freeze({}),
    });
    run.phase = 'shop'; beginRewards(run);
    assert.equal(buyItem(run, 'probe'), true);
    assert.deepEqual([run.player.hp, run.player.maxHp], [expected, 100 + delta]);
    const before = JSON.stringify(run);
    assert.equal(buyItem(run, 'probe'), false);
    assert.equal(JSON.stringify(run), before);
  }
});

test('blocked commands preserve complete serialized state', () => {
  const run = createRun(() => 0);
  awardXP(run, 50);
  run.time = run.duration; step(run, 0, {});
  for (const action of [
    () => chooseUpgrade(run, 'damage'), () => buyHeal(run),
    () => buyItem(run, 'scissors'), () => chooseLevelReward(run, 'missing'),
    () => startNextWave(run), () => sellBelonging(run, 'missing'),
  ]) {
    const before = JSON.stringify(run);
    assert.equal(action(), false);
    assert.equal(JSON.stringify(run), before);
  }
});

test('zero-defense percentage source permits legacy armor without a partial charge', () => {
  const run = createRun(() => 0, 'negro', {
    catalog: catalog([{ stat: 'defense', operation: 'percent', value: -100 }]),
  });
  run.phase = 'shop'; run.coins = 100; beginRewards(run);
  assert.equal(buyItem(run, 'probe'), true);
  assert.equal(run.player.defense, 0);
  assert.equal(chooseUpgrade(run, 'armor'), true);
  assert.equal(run.coins, 82);
  assert.equal(run.upgrades.armor, 1);
  assert.equal(run.player.defense, 0.05);
  assert.equal(resolveStatState(run.statState).defense, 0.05);
  const armor = UPGRADES.find(entry => entry.id === 'armor');
  const original = armor.apply;
  try {
    armor.apply = player => { player.damage = Infinity; };
    const before = JSON.stringify(run);
    assert.equal(chooseUpgrade(run, 'armor'), false);
    assert.equal(JSON.stringify(run), before);
  } finally {
    armor.apply = original;
  }
});
