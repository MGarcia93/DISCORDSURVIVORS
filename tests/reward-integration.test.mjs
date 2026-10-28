import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, step, startNextWave, activateSpecial, chooseLevelReward,
  skipEmptyChoice, buyItem, chooseUpgrade, buyHeal, sellBelonging,
} from '../src/engine.mjs';
import { BALANCE } from '../src/reward-data.mjs';

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
  const balance = structuredClone(BALANCE);
  balance.gold = { rewards: { zombie: 7, runner: 9, boss: 13 }, survival: 11 };
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
  bossRun.enemies = [{ id: 1, kind: 'boss', hp: 0, x: 0, y: 0 }];
  step(bossRun, 0, {});
  assert.equal(bossRun.coins, 13);
  assert.equal(bossRun.phase, 'won');
});

test('configured zero gold rewards remain zero instead of falling back to legacy amounts', () => {
  const balance = structuredClone(BALANCE);
  balance.gold = { rewards: { zombie: 0, runner: 0, boss: 0 }, survival: 0 };
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
  assert.equal(run.levelChoices.length, 3);
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

test('queued levels use individual eligibility and never auto-grant bounce', () => {
  const run = createRun(() => 0.5);
  kills(run, 50); clearWave(run);
  assert.equal(run.level, 3);
  assert.ok(!run.levelChoices.some(entry => entry.id === 'remote-bounce'));
  assert.equal(run.player.rewardBonuses.bounce, undefined);
  run.random = () => 0.99;
  chooseLevelReward(run, run.levelChoices.find(entry => entry.characters === 'all').id);
  assert.ok(run.levelChoices.some(entry => entry.id === 'remote-bounce'));
  assert.equal(run.player.rewardBonuses.bounce, undefined);
  assert.equal(chooseLevelReward(run, 'remote-bounce'), true);
  assert.equal(run.player.rewardBonuses.bounce, 1);
});

test('legacy exported stat purchases compose with new level and item sources', () => {
  const run = createRun(() => 0.5);
  kills(run, 10); clearWave(run);
  run.coins = 1000;
  assert.equal(chooseLevelReward(run, 'stat-attack'), true);
  assert.equal(run.player.damage, 31.5);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(run.player.damage, 40.95);
  assert.equal(buyItem(run, 'slipper'), true);
  assert.ok(Math.abs(run.player.damage - 44.85) < 1e-9);
  assert.equal(run.levelRanks['stat-attack'], 1);
  assert.equal(run.upgrades.damage, 1);
  assert.equal(run.items.slipper, 1);
});

test('Negro shots bounce only after the corresponding level choice', () => {
  for (const unlocked of [false, true]) {
    const run = createRun(() => 0.5);
    if (unlocked) {
      kills(run, 50); clearWave(run); run.random = () => 0.99;
      chooseLevelReward(run, run.levelChoices.find(entry => entry.characters === 'all').id);
      chooseLevelReward(run, 'remote-bounce'); startNextWave(run);
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
    kills(run, 10); clearWave(run);
    const own = run.levelChoices.find(entry => entry.characters === character);
    chooseLevelReward(run, own.id); startNextWave(run);
    assert.equal(activateSpecial(run, key), true);
    assert.equal(run.player[key], expected);
  }
});

test('selected smoke duration affects the next actual smoke cloud', () => {
  const run = createRun(() => 0.5, 'warrior');
  kills(run, 10); clearWave(run);
  chooseLevelReward(run, 'smoke-time'); startNextWave(run);
  run.player.smokeCloudCooldown = 0;
  step(run, 0.05, { x: 1 });
  const smoke = run.effects.findLast(effect => effect.kind === 'smoke');
  assert.ok(Math.abs(smoke.ttl - 6.35) < 1e-9);
});

test('sale upgrades improve proceeds while preserving debt settlement and giving no XP', () => {
  const run = createRun(() => 0.5, 'papazito');
  kills(run, 10); clearWave(run);
  chooseLevelReward(run, 'sale-value'); startNextWave(run);
  run.player.senaDebt = 5;
  const coins = run.coins, xp = run.xp;
  assert.equal(sellBelonging(run, 'psp'), true);
  assert.equal(run.coins, coins + 17);
  assert.equal(run.player.senaDebt, 0);
  assert.equal(run.xp, xp);
});

test('final boss victory suppresses pending reward screens without losing victory state', () => {
  const run = createRun(() => 0.5);
  kills(run, 10);
  run.wave = 4;
  run.enemies = [{ id: ++run.serial, kind: 'boss', hp: 0, maxHp: 1, radius: 1, speed: 0, x: 0, y: 0 }];
  step(run, 0.01, { x: 1 });
  assert.equal(run.phase, 'won');
  assert.deepEqual(run.pendingLevels, []);
  assert.equal(run.levelChoices, null);
  assert.equal(run.shopOffers, null);
  assert.equal(chooseLevelReward(run, 'otaku-time'), false);
  assert.equal(skipEmptyChoice(run), false);
});
