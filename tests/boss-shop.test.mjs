import test from 'node:test';
import assert from 'node:assert/strict';
import { applyUpgradeRank, beginRewards, buyItem, chooseLevelReward, skipEmptyChoice } from '../src/run-rewards.mjs';
import { createRun, startNextWave, step } from '../src/engine.mjs';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';
import { createNextWorldRun } from '../src/game/campaign-run.mjs';

// The boss closes its world with the same shop every other wave opens: the
// coins the fight paid are spent before the next server.
function atBoss(act) {
  const run = createRun(() => 0.5, 'negro', {}, act);
  run.player.hp = run.player.maxHp = 1e9;
  while (run.wave < act.boss.wave) {
    // A mini-boss line closes one member at a time before the shop opens.
    for (let guard = 0; run.phase === 'playing' && guard < 8; guard++) {
      run.time = run.duration;
      for (const enemy of run.enemies.filter(enemy => enemy.gauntlet !== undefined)) enemy.hp = 0;
      step(run, 0.016);
    }
    assert.equal(run.phase, 'shop', `wave ${run.wave} closes`);
    // A wave can hand out levels: the shop refuses to advance until they are
    // spent, and this helper only cares about the boss.
    while (run.pendingLevels.length) {
      beginRewards(run);
      if (!chooseLevelReward(run, run.levelChoices[0]?.id)) skipEmptyChoice(run);
    }
    assert.equal(startNextWave(run), true, `wave ${run.wave} advances`);
  }
  return run;
}

function defeatBoss(run) {
  const boss = run.enemies.find(enemy => enemy.boss);
  assert.ok(boss, 'the boss is on the field');
  boss.hp = 0;
  step(run, 0.016);
}

test('defeating a world boss opens its shop instead of ending the run', () => {
  const run = atBoss(PLAYABLE_ACTS[0]);
  defeatBoss(run);
  assert.equal(run.phase, 'shop');
  assert.equal(run.worldCleared, true);
  assert.deepEqual(run.enemies, []);
  assert.deepEqual(run.projectiles, []);
  assert.ok(run.shopOffers?.length, 'the shop has something to sell');
});

test('the boss shop spends the fight coins before the next world', () => {
  const run = atBoss(PLAYABLE_ACTS[0]);
  run.coins = 500;
  defeatBoss(run);
  const item = run.shopOffers.find(offer => !offer.bought);
  assert.ok(item, 'an item waits in the shop');
  const coins = run.coins;
  assert.equal(buyItem(run, item.id), true);
  assert.ok(run.coins < coins, 'the purchase is paid');
  const upgrade = run.rewardCatalog.upgrades.find(entry => entry.id === 'stat-attack');
  assert.equal(applyUpgradeRank(run, upgrade), true);
  assert.equal(run.statState['stat-attack'] ?? run.levelRanks['stat-attack'], 1);
});

test('continuing from the boss shop carries the build into the next world', () => {
  const run = atBoss(PLAYABLE_ACTS[0]);
  run.coins = 500;
  defeatBoss(run);
  const upgrade = run.rewardCatalog.upgrades.find(entry => entry.id === 'stat-attack');
  assert.equal(applyUpgradeRank(run, upgrade), true);
  const damage = run.player.damage;
  const next = createNextWorldRun(run);
  assert.ok(next, 'a cleared world continues');
  assert.equal(next.act.id, PLAYABLE_ACTS[1].id);
  assert.equal(next.player.damage, damage, 'the shop purchase travels with the survivor');
  assert.equal(next.worldCleared, false);
});

test('the last world hands the campaign ending instead of wrapping around', () => {
  const last = atBoss(PLAYABLE_ACTS.at(-1));
  defeatBoss(last);
  assert.equal(last.phase, 'shop');
  assert.equal(createNextWorldRun(last), null, 'nothing follows the last world');
});
