import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { UNIT_PX } from '../src/stats.mjs';

test('ranged attacks are bounded by the attackDistance stat like every other attack', () => {
  const run = createRun(() => 0.5);
  run.spawnIn = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 400, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });

  step(run, 0.05, {});

  assert.equal(run.enemies[0].hp, 500, 'outside the attack range means no shot');
  assert.equal(run.projectiles.length, 0, 'no projectile leaves without a target in range');

  const near = createRun(() => 0.5);
  near.spawnIn = 100;
  near.shotIn = 0.001;
  near.enemies.push({ id: 1, x: near.player.x + 280, y: near.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });

  step(near, 0.05, {});

  assert.ok(near.projectiles.length >= 1, 'inside the attack range the shot fires');
});

test('enemy defense mitigates the damage enemies receive, the same rule for every entity', () => {
  const run = createRun(() => 0.5); // EL NEGRO: 30 damage per shot
  run.spawnIn = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 280, y: run.player.y, hp: 1000, maxHp: 1000, speed: 0, radius: 10, kind: 'zombie', defense: 0.2 });

  for (let i = 0; i < 24; i++) step(run, 0.05, {}); // ~1.2s: enough for two shots (~0.45s apart) to land

  assert.ok(Math.abs(run.enemies[0].hp - (1000 - 2 * 30 * 0.8)) < 1e-6);
});

test('EL NEGRO canonically holds a quarter-of-screen attack range from his sheet', () => {
  const negro = createRun(() => 0.5).player;
  assert.equal(negro.attackRange, 260 * UNIT_PX);
});

test('Warrior ranged shots preserve the shroom device for mushroom rendering', () => {
  const run = createRun(() => 0.5, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 100, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });

  step(run, 0.05, {});

  assert.equal(run.projectiles[0]?.device, 'shroom');
});

test('Papazito ladrillazos carry the brick device for their own projectile art', () => {
  const run = createRun(() => 0.5, 'papazito');
  run.spawnIn = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 100, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });

  step(run, 0.05, {});

  assert.equal(run.projectiles[0]?.device, 'brick');
  assert.equal(run.projectiles[0]?.damage, 30, 'one heavy 300% attack, no multiplier');
});

test('a Warrior mushroom bomb deals 45 damage before its area splash', () => {
  const run = createRun(() => 0.5, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 100, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });

  step(run, 0.05, {});

  assert.equal(run.projectiles[0]?.damage, 45);
});

test('a projectile whose locked target dies disappears instead of changing targets', () => {
  const run = createRun(() => 0.5);
  run.spawnIn = 100;
  run.shotIn = 100;
  run.enemies.push(
    { id: 1, x: 400, y: 300, hp: 0, maxHp: 30, speed: 0, radius: 14, kind: 'zombie' },
    { id: 2, x: 430, y: 300, hp: 100, maxHp: 100, speed: 0, radius: 14, kind: 'zombie' },
  );
  run.projectiles.push({ x: 360, y: 300, target: 1, damage: 30, kind: 'remote', device: 'phone', hit: [], ttl: 3, angle: 0 });

  step(run, 0.05, {});

  assert.equal(run.enemies.find(enemy => enemy.id === 2).hp, 100);
  assert.equal(run.projectiles.length, 0);
});

test('the gamer volley cycles its appearance through remote, joystick and phone', () => {
  const run = createRun(() => 0.5);
  run.spawnIn = 100;
  run.shotIn = 100;
  run.enemies.push({ id: 1, x: 800, y: 500, hp: 1000, maxHp: 1000, speed: 0, radius: 10, kind: 'zombie' });
  const devices = [];

  for (let i = 0; i < 3; i++) {
    run.shotIn = 0;
    step(run, 0.01, {});
    devices.push(run.projectiles.at(-1)?.device);
  }

  assert.deepEqual(devices, ['remote', 'joystick', 'phone']);
});
