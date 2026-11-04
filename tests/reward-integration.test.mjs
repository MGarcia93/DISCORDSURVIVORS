import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun as engineRun, step, startNextWave, activateSpecial, chooseLevelReward,
  skipEmptyChoice, buyItem, chooseUpgrade, buyHeal, sellBelonging,
} from '../src/engine.mjs';
import { BALANCE, DEFAULT_CATALOG } from '../src/reward-data.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';

// The shipped balance grants playtest XP; these cases pin the curve itself, so
// they run with one XP per ordinary kill and override only what they test.
const oneXp = structuredClone(BALANCE);
// These cases pin the mechanics, not the shipped curve: a fixed curve keeps the
// arithmetic readable whatever the balance says today.
oneXp.xp.factor = 10; oneXp.xp.exponent = 2;
oneXp.xp.rewards = { zombie: 1, runner: 1, brute: 1, boss: 0 };
const createRun = (random = Math.random, character = 'negro', options = {}) =>
  engineRun(random, character, { balance: oneXp, ...options });

function kills(run, count) {
  run.spawnIn = 100;
  for (let index = 0; index < count; index++) {
    run.enemies.push({ id: ++run.serial, kind: 'zombie', hp: 0, maxHp: 1, x: 0, y: 0, radius: 1, speed: 0 });
    step(run, 0.001, { x: 1 });
  }
}
function clearWave(run) {
  run.time = run.duration - 0.001;
  step(run, 0.01, { x: 1 });
}

test('configured gold rewards control all enemy payouts and survival income independently of XP', () => {
  const balance = structuredClone(oneXp);
  balance.gold = { rewards: { zombie: 7, runner: 9, alarmZombie: 13 }, survival: 11 };
  const run = createRun(() => 0.5, 'negro', { balance });
  run.spawnIn = 100;
  run.enemies = ['zombie', 'runner'].map((kind, id) => ({ id, kind, hp: 0, x: 0, y: 0 }));
  step(run, 0, {});
  assert.equal(run.coins, 16);
  assert.equal(run.xp, 2);
  clearWave(run);
  assert.equal(run.coins, 27);
  assert.equal(run.xp, 2);
  const bossRun = createRun(() => 0.5, 'negro', { balance });
  bossRun.wave = 4;
  bossRun.enemies = [{ id: 1, kind: 'alarmZombie', boss: true, hp: 0, x: 0, y: 0 }];
  step(bossRun, 0, {});
  assert.equal(bossRun.coins, 13 + 11, 'the fight bounty and the survival pay');
  assert.equal(bossRun.phase, 'shop');
  assert.equal(bossRun.worldCleared, true);
});

test('configured zero gold rewards remain zero instead of falling back to legacy amounts', () => {
  const balance = structuredClone(oneXp);
  balance.gold = { rewards: { zombie: 0, runner: 0, alarmZombie: 0 }, survival: 0 };
  const run = createRun(() => 0.5, 'negro', { balance });
  kills(run, 1); clearWave(run);
  assert.equal(run.coins, 0);
  assert.equal(run.xp, 1);
});

test('real kill settlement awards XP once, not survival income or later frames', () => {
  const run = createRun(() => 0.5);
  kills(run, 10);
  assert.equal(run.level, 2);
  assert.equal(run.xp, 0);
  assert.equal(run.kills, 10);
  assert.deepEqual(run.pendingLevels, [2]);
  assert.equal(run.phase, 'playing');
  step(run, 0.01, { x: 1 });
  assert.equal(run.xp, 0);
  clearWave(run);
  assert.equal(run.phase, 'shop');
  assert.equal(run.xp, 0);
  assert.equal(run.levelChoices.length, 4);
});

test('level choices block old purchases, healing and next wave, then expose the item shop', () => {
  const run = createRun(() => 0.5);
  kills(run, 10); clearWave(run);
  run.coins = 1000; run.player.hp = 50;
  const before = JSON.stringify(run);
  assert.equal(startNextWave(run), false);
  assert.equal(chooseUpgrade(run, 'damage'), false);
  assert.equal(buyHeal(run), false);
  assert.equal(buyItem(run, 'scissors'), false);
  assert.equal(JSON.stringify(run), before);
  assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
  assert.equal(run.pendingLevels.length, 0);
  assert.equal(run.shopOffers.length, 4);
  assert.equal(startNextWave(run), true);
});

test('a milestone level is four own upgrades, and choosing one is what grants it', () => {
  const run = createRun(() => 0.5);
  kills(run, 140); clearWave(run);
  assert.equal(run.level, 4);
  // The queue starts at the first level that was pending (2); spending it is
  // what brings the menu to the level-4 milestone.
  assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
  assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
  assert.equal(run.pendingLevels[0], 4);
  assert.equal(run.levelChoices.length, 4);
  assert.ok(run.levelChoices.every(entry => entry.characters === 'negro'), 'the whole menu is his own pool');
  const picked = run.levelChoices[0];
  assert.equal(chooseLevelReward(run, picked.id), true);
  assert.equal(run.levelRanks[picked.id], 1, 'the chosen signature is the one that lands');
  assert.equal(run.player.rewardBonuses.bounce, undefined, 'and it never auto-grants another one');
});

test('legacy exported stat purchases compose with new level and item sources', () => {
  const run = createRun(() => 0.5);
  kills(run, 10); clearWave(run);
  run.coins = 1000;
  // Derived from the catalogue, so retuning a rank never breaks the case.
  const base = run.player.damage;
  const ranked = 1 + DEFAULT_CATALOG.upgrades.find(entry => entry.id === 'stat-attack').ranks[0].modifiers[0].value / 100;
  assert.equal(chooseLevelReward(run, 'stat-attack'), true);
  assert.ok(Math.abs(run.player.damage - base * ranked) < 1e-9);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.ok(Math.abs(run.player.damage - base * ranked * 1.3) < 1e-9);
  const beforeItem = run.player.damage;
  // The shelf roll depends on how many items exist, so this case asks for the
  // copy it is about instead of hoping the sample brings it.
  run.shopOffers = [{ id: 'slipper', bought: false }];
  assert.equal(buyItem(run, 'slipper'), true);
  // The item's percentage stacks with the level rank instead of multiplying it.
  assert.ok(run.player.damage > beforeItem, 'the item adds on top of both');
  assert.ok(run.player.damage < beforeItem * 1.1 + 1e-9, 'and it shares the percentage pool');
  assert.equal(run.levelRanks['stat-attack'], 1);
  assert.equal(run.upgrades.damage, 1);
  assert.equal(run.items.slipper, 1);
});

test('Negro shots bounce only after the corresponding level choice', () => {
  for (const unlocked of [false, true]) {
    const run = createRun(() => 0.5);
    if (unlocked) {
      kills(run, 50); clearWave(run);
      while (run.pendingLevels.length) {
        assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
      }
      // The entry is gated to 14, so the test takes the rank directly: what is
      // under test here is what the shot does once the upgrade is owned.
      const entry = DEFAULT_CATALOG.upgrades.find(candidate => candidate.id === 'remote-bounce');
      assert.equal(applyUpgradeRank(run, entry), true);
      assert.equal(startNextWave(run), true);
    }
    run.spawnIn = run.shotIn = 100;
    run.enemies = [1, 2].map(id => ({ id, kind: 'zombie', hp: 100, maxHp: 100,
      x: run.player.x + 50 + id * 10, y: run.player.y, radius: 1, speed: 0 }));
    run.projectiles.push({ x: run.enemies[0].x, y: run.player.y, target: 1,
      damage: 10, kind: 'remote', hit: [], ttl: 3, angle: 0, attack: run.player.characterDef.attack });
    for (let i = 0; i < 4; i++) step(run, 0.05, { x: -1 });
    assert.equal(run.enemies[0].hp, 90);
    assert.equal(run.enemies[1].hp, unlocked ? 91.5 : 100);
  }
});

test('selected duration effects alter real waifu and Patrona activations', () => {
  for (const [character, key, expected] of [['negro', 'anime', 9], ['solago', 'stand', 8]]) {
    const run = createRun(() => 0.5, character);
    // 0.1 opens the signature slot: a level only offers it a quarter of the time.
    run.random = () => 0.1;
    kills(run, 10); clearWave(run);
    const own = run.levelChoices.find(entry => entry.characters === character);
    chooseLevelReward(run, own.id); startNextWave(run);
    assert.equal(activateSpecial(run, key), true);
    assert.equal(run.player[key], expected);
  }
});

test('selected smoke duration affects the next actual smoke cloud', () => {
  const run = createRun(() => 0.5, 'warrior');
  run.random = () => 0.1;
  kills(run, 10); clearWave(run);
  chooseLevelReward(run, 'smoke-time'); startNextWave(run);
  run.player.smokeCloudCooldown = 0;
  step(run, 0.05, { x: 1 });
  const smoke = run.effects.findLast(effect => effect.kind === 'smoke');
  assert.ok(Math.abs(smoke.ttl - 6.35) < 1e-9);
});

test('sale upgrades improve proceeds while preserving debt settlement and giving no XP', () => {
  const run = createRun(() => 0.5, 'papazito');
  run.random = () => 0.1;
  kills(run, 10); clearWave(run);
  chooseLevelReward(run, 'sale-value'); startNextWave(run);
  run.player.senaDebt = 5;
  const coins = run.coins, xp = run.xp;
  assert.equal(sellBelonging(run, 'psp'), true);
  assert.equal(run.coins, coins + 17);
  assert.equal(run.player.senaDebt, 0);
  assert.equal(run.xp, xp);
});

test('world boss victory pays its rewards into the shop before the next world', () => {
  const run = createRun(() => 0.5);
  kills(run, 10);
  run.wave = 4;
  run.enemies = [{ id: ++run.serial, kind: 'alarmZombie', boss: true, hp: 0, maxHp: 1, radius: 1, speed: 0, x: 0, y: 0 }];
  step(run, 0.01, { x: 1 });
  assert.equal(run.phase, 'shop');
  assert.equal(run.worldCleared, true);
  assert.ok(run.pendingLevels.length > 0, 'earned levels are not thrown away');
  assert.ok(run.levelChoices?.length, 'the shop offers them before the next game');
  assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
});
