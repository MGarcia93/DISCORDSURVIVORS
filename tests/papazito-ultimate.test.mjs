import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, activateSpecial, step, WORLD_SCALE as WS } from '../src/engine.mjs';

function arena() {
  const run = createRun(() => 0.5, 'papazito');
  run.spawnIn = run.shotIn = 1000;
  run.duration = 1000;
  return run;
}

test('ANAMENCUÁ emits exactly three dense, evenly spaced outward rings without targets', () => {
  const run = arena();
  assert.equal(activateSpecial(run, 'anamencua'), true);
  assert.equal(activateSpecial(run, 'anamencua'), false);
  step(run, 0.01);
  assert.equal(run.projectiles.length, 48);
  const first = [...run.projectiles];
  const angles = first.map(shot => Math.atan2(shot.vy, shot.vx));
  for (let i = 0; i < first.length; i++) {
    const shot = first[i];
    assert.equal(shot.device, 'brick');
    assert.equal(shot.target, undefined);
    assert.ok(Math.abs(Math.hypot(shot.x - run.player.x, shot.y - run.player.y) - (18 + 2.8) * WS) < 1e-8);
    const gap = (angles[(i + 1) % 48] - angles[i] + Math.PI * 2) % (Math.PI * 2);
    assert.ok(Math.abs(gap - Math.PI * 2 / 48) < 1e-8);
  }
  for (let i = 0; i < 8; i++) step(run, 0.05);
  assert.equal(run.projectiles.length, 48, 'the second burst is not continuous rain');
  const oldX = first[0].x;
  run.player.x += 20;
  step(run, 0.05);
  assert.equal(run.projectiles.length, 96);
  assert.ok(Math.abs(first[0].x - oldX - 14 * WS) < 1e-8, 'old bricks keep flying straight');
  const second = run.projectiles[48];
  assert.ok(Math.abs(second.x - run.player.x - 32 * WS) < 1e-8, 'new ring follows the current player position');
  for (let i = 0; i < 20; i++) step(run, 0.05);
  assert.equal(run.projectiles.length, 144, 'three bursts, never a fourth');
  assert.equal(activateSpecial(run, 'anamencua'), false, '40-second cooldown remains');
  for (let i = 0; i < 70; i++) step(run, 0.05);
  assert.equal(run.projectiles.length, 0, 'outward bricks expire without targets');
  for (let i = 0; i < 720; i++) step(run, 0.05);
  assert.equal(activateSpecial(run, 'anamencua'), true);
  step(run, 0.01);
  assert.equal(run.projectiles.length, 48, 'the next activation resets the burst counter');
});

test('three brick rings hit enemies in every direction with defense and sale damage applied', () => {
  const run = arena();
  run.player.sellDamageTtl = 10;
  run.player.sellDamageFrac = 0.5;
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    run.enemies.push({ id: ++run.serial, kind: 'zombie', x: run.player.x + Math.cos(angle) * 100 * WS,
      y: run.player.y + Math.sin(angle) * 100 * WS, hp: 200, maxHp: 200, defense: 0.2, radius: 3 * WS, speed: 0 });
  }
  activateSpecial(run, 'anamencua');
  for (let i = 0; i < 150; i++) step(run, 0.01);
  for (const enemy of run.enemies) assert.ok(Math.abs(enemy.hp - (200 - 3 * 30 * 1.5 * 0.8)) < 1e-8);
  assert.equal(run.enemies.length, 4);
});

test('radial brick kills use the normal bounty and kill bookkeeping', () => {
  const run = arena();
  run.enemies.push({ id: ++run.serial, kind: 'zombie', x: run.player.x + 100 * WS,
    y: run.player.y, hp: 1, maxHp: 1, radius: 3 * WS, speed: 0 });
  activateSpecial(run, 'anamencua');
  for (let i = 0; i < 12; i++) step(run, 0.05);
  assert.equal(run.kills, 1);
  assert.equal(run.coins, run.rewardBalance.gold.rewards.zombie);
  assert.equal(run.enemies.length, 0);
});
