import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, chooseUpgrade, startNextWave, activateSpecial } from '../src/engine.mjs';

test('El Negro starts as a slow tank and moves diagonally without a speed bonus', () => {
  const run = createRun(() => 0.5);
  assert.equal(run.player.maxHp, 150);
  assert.equal(run.player.defense, 0.2);
  const { x, y } = run.player;
  step(run, 0.05, { x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(run.player.x - x, run.player.y - y) - run.player.speed * 0.05) < 0.001);
});

test('standing still for two seconds regenerates health; moving resets the passive', () => {
  const run = createRun(() => 0.5);
  run.player.hp = 80;
  run.spawnIn = 100;
  for (let i = 0; i < 39; i++) step(run, 0.05, {});
  assert.equal(run.player.hp, 80);
  for (let i = 0; i < 5; i++) step(run, 0.05, {});
  assert.ok(run.player.hp > 80);
  step(run, 0.05, { x: 1 });
  assert.equal(run.player.still, 0);
});

test('automatic remotes kill nearby enemies and award currency', () => {
  const run = createRun(() => 0.5);
  run.enemies.push({ id: 1, x: 560, y: 340, hp: 10, maxHp: 10, speed: 0, radius: 15, kind: 'zombie' });
  run.spawnIn = 100;
  for (let i = 0; i < 30; i++) step(run, 0.05, {});
  assert.equal(run.enemies.length, 0);
  assert.equal(run.coins, 2);
  assert.equal(run.kills, 1);
});

test('surviving a wave opens the shop and upgrades can stack', () => {
  const run = createRun(() => 0.5);
  run.time = run.duration - 0.01;
  step(run, 0.05, {});
  assert.equal(run.phase, 'shop');
  run.coins = 0;
  const damage = run.player.damage;
  assert.equal(chooseUpgrade(run, 'damage'), false);
  assert.equal(run.player.damage, damage);
  run.coins = 60;
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(run.coins, 40);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(run.coins, 10);
  assert.ok(run.player.damage > damage);
  assert.equal(chooseUpgrade(run, 'damage'), false);
  assert.equal(run.upgrades.damage, 2);
  assert.equal(startNextWave(run), true);
  assert.equal(run.wave, 2);
  assert.equal(run.phase, 'playing');
  assert.equal(run.duration, 60);
});

test('specials have cooldowns and the chair reduces movement', () => {
  const run = createRun(() => 0.5);
  assert.equal(activateSpecial(run, 'chair'), true);
  assert.equal(activateSpecial(run, 'chair'), false);
  const x = run.player.x;
  step(run, 0.05, { x: 1 });
  assert.ok(run.player.x - x < run.player.speed * 0.05);
  assert.equal(activateSpecial(run, 'anime'), true);
});

test('death is terminal and retry starts a clean run', () => {
  const run = createRun(() => 0.5);
  run.player.hp = 1;
  run.enemies.push({ id: 1, x: run.player.x + 30, y: run.player.y, hp: 999, maxHp: 999, radius: 20, speed: 0, kind: 'zombie' });
  step(run, 0.05, {});
  assert.equal(run.phase, 'dead');
  const time = run.time;
  step(run, 0.05, { x: 1 });
  assert.equal(run.time, time);
  assert.equal(createRun().kills, 0);
});

test('final wave requires defeating the Administrator, not just waiting', () => {
  const run = createRun(() => 0.5);
  run.wave = 3;
  run.phase = 'shop';
  startNextWave(run);
  const boss = run.enemies.find(enemy => enemy.kind === 'boss');
  assert.ok(boss);
  run.time = 80;
  step(run, 0.05, {});
  assert.equal(run.phase, 'playing');
  boss.hp = 0;
  step(run, 0.05, {});
  assert.equal(run.phase, 'won');
});
