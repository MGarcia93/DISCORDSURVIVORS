import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';

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
