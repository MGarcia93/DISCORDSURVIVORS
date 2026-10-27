import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, startNextWave, step } from '../src/engine.mjs';
import { ENEMY_KINDS } from '../src/enemies.mjs';

test('enemy kinds are a data table with per-wave formulas and combat fields', () => {
  assert.equal(ENEMY_KINDS.zombie.hp(1), 46);
  assert.equal(ENEMY_KINDS.zombie.hp(10), 100);
  assert.equal(ENEMY_KINDS.runner.hp(2), 38);
  assert.equal(ENEMY_KINDS.zombie.speed(5), 60);
  assert.equal(ENEMY_KINDS.runner.speed(5), 108);
  assert.equal(ENEMY_KINDS.boss.hp(4), 2200);
  assert.equal(ENEMY_KINDS.zombie.radius, 17);
  assert.equal(ENEMY_KINDS.runner.radius, 13);
  assert.equal(ENEMY_KINDS.boss.radius, 38);
  assert.equal(ENEMY_KINDS.boss.speed(4), 52);
  for (const kind of ['zombie', 'runner']) {
    assert.equal(ENEMY_KINDS[kind].contactDamage, 12);
    assert.equal(ENEMY_KINDS[kind].bounty, 2);
  }
  assert.equal(ENEMY_KINDS.boss.contactDamage, 30);
  assert.equal(ENEMY_KINDS.boss.bounty, 30);
});

test('spawned zombies and runners read hp, radius and speed from the table', () => {
  const zombieRun = createRun(() => 0.1);
  zombieRun.spawnIn = 0;
  step(zombieRun, 0.016);
  const zombie = zombieRun.enemies[0];
  assert.equal(zombie.kind, 'zombie');
  assert.equal(zombie.hp, 46);
  assert.equal(zombie.radius, 17 * 1.1);
  assert.equal(zombie.speed, 45 * 1.1);

  const runnerRun = createRun(() => 0.1);
  runnerRun.wave = 2;
  runnerRun.spawnIn = 0;
  step(runnerRun, 0.016);
  const runner = runnerRun.enemies[0];
  assert.equal(runner.kind, 'runner');
  assert.equal(runner.hp, 38);
  assert.equal(runner.radius, 13 * 1.1);
  assert.equal(runner.speed, 97 * 1.1);
});

test('the wave-4 boss takes its stats from the table', () => {
  const run = createRun();
  run.wave = 3;
  run.phase = 'shop';
  assert.equal(startNextWave(run), true);
  const [boss] = run.enemies;
  assert.equal(boss.kind, 'boss');
  assert.equal(boss.hp, 2200);
  assert.equal(boss.radius, 38 * 1.1);
  assert.equal(boss.speed, 52 * 1.1);
});

test('contact damage and coin rewards read the table at runtime', () => {
  const run = createRun();
  run.enemies.push({ id: 1, kind: 'boss', hp: 999, maxHp: 999, x: run.player.x, y: run.player.y,
    radius: 10 * 1.1, speed: 0 });
  const before = run.player.hp;
  step(run, 0.016);
  assert.equal(run.player.hp, before - 30 * (1 - 0.2));

  const killRun = createRun(() => 0.5);
  killRun.enemies.push({ id: 1, kind: 'boss', hp: 1, maxHp: 1, x: killRun.player.x, y: killRun.player.y,
    radius: 10 * 1.1, speed: 0 });
  step(killRun, 0.05, {});
  for (let i = 0; i < 40; i++) step(killRun, 0.05, {});
  assert.equal(killRun.kills, 1);
  assert.equal(killRun.coins, 30);
  assert.equal(killRun.phase, 'won');
});
