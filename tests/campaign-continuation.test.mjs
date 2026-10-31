import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chooseUpgrade } from '../src/engine.mjs';
import { applyUpgradeRank, buyItem } from '../src/run-rewards.mjs';
import { createNextWorldRun } from '../src/game/campaign-run.mjs';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';

test('next world retains real acquisitions without copying the old battlefield', () => {
  const old = createRun(() => 0.5);
  old.phase = 'shop';
  old.coins = 1000;
  const item = old.rewardCatalog.items.find(entry => entry.enabled !== false);
  old.shopOffers = [{ id: item.id, bought: false }];
  assert.equal(buyItem(old, item.id), true);
  const upgrade = id => old.rewardCatalog.upgrades.find(entry => entry.id === id);
  assert.equal(applyUpgradeRank(old, upgrade('stat-attack')), true);
  assert.equal(applyUpgradeRank(old, upgrade('otaku-time')), true);
  assert.equal(chooseUpgrade(old, 'regen'), true);
  old.level = 7; old.xp = 13;
  old.player.hp = 91;
  old.player.anime = 4; old.player.animeCooldown = 9;
  old.player.immune = 1;
  old.enemies.push({ kind: 'zombie', hp: 20 });
  old.effects.push({ kind: 'smoke', ttl: 3 });
  old.projectiles.push({ ttl: 5 });
  old.shockwaves.push({ radius: 4 });
  old.prison = { ttl: 2 };
  old.specialsLocked = 6;
  old.phase = 'shop';
  old.worldCleared = true;
  const before = JSON.stringify(old);
  const next = createNextWorldRun(old);
  assert.equal(next.act.id, PLAYABLE_ACTS[1].id);
  assert.equal(next.phase, 'playing');
  assert.equal(next.wave, 1);
  for (const key of ['items', 'levelRanks', 'upgrades', 'statState', 'effectSources']) {
    assert.deepEqual(next[key], old[key], key);
    assert.notEqual(next[key], old[key], `${key} is independently owned`);
  }
  for (const key of ['level', 'xp', 'coins']) assert.equal(next[key], old[key], key);
  assert.equal(next.player.hp, next.player.maxHp, 'the next world restores full health');
  for (const key of ['maxHp', 'damage', 'defense', 'speed', 'shotInterval', 'attackRange', 'regen']) {
    assert.equal(next.player[key], old.player[key], key);
  }
  assert.deepEqual(next.player.rewardBonuses, old.player.rewardBonuses);
  for (const key of ['enemies', 'effects', 'projectiles', 'shockwaves', 'pendingLevels']) {
    assert.deepEqual(next[key], [], key);
  }
  assert.equal(next.player.anime, 0);
  assert.equal(next.player.animeCooldown, 0);
  assert.equal(next.player.immune, 0);
  assert.equal(next.prison, undefined);
  assert.equal(next.specialsLocked, undefined);
  assert.equal(next.shopOffers, null);
  assert.equal(JSON.stringify(old), before, 'the previous build is unchanged');
  // Future purchases must still respect cumulative ranks and item ownership.
  assert.equal(applyUpgradeRank(next, upgrade('stat-attack')), true);
  assert.equal(next.levelRanks['stat-attack'], 2);
  assert.equal(old.levelRanks['stat-attack'], 1);
});

test('only a won nonterminal act continues; ordinary new runs keep their defaults', () => {
  const run = createRun(() => 0.5);
  const before = JSON.stringify(run);
  assert.equal(createNextWorldRun(run), null);
  assert.equal(JSON.stringify(run), before);
  run.phase = 'dead';
  assert.equal(createNextWorldRun(run), null);
  const last = createRun(() => 0.5, 'negro', {}, PLAYABLE_ACTS.at(-1));
  last.phase = 'shop';
  last.worldCleared = true;
  assert.equal(createNextWorldRun(last), null);
  assert.equal(run.level, 1);
  assert.deepEqual(run.items, {});
});
