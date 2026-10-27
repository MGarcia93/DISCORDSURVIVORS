import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, step, activateSpecial } from '../src/engine.mjs';
import { UNIT_PX } from '../src/stats.mjs';

test('Solago has normal health and speed, 15% defense, stronger short-range melee and no projectiles', () => {
  const run = createRun(() => 0.5, 'solago');
  const negro = createRun(() => 0.5, 'negro');
  const p = run.player;
  assert.equal(p.maxHp, 100);
  assert.equal(p.speed, negro.player.speed);
  assert.equal(p.defense, 0.15);
  assert.equal(p.damage, 30 * 1.35);
  assert.equal(p.attackRange, 68.4 * UNIT_PX);
  assert.ok(p.hitRadius < negro.player.hitRadius, 'Solago has a narrower collision box than the tank');
  run.spawnIn = 100;
  run.enemies.push({ id: 1, x: p.x + p.attackRange - 4, y: p.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  step(run, 0.05, { x: 1, y: 1 });
  assert.equal(run.enemies[0].hp, 500 - p.damage);
  assert.equal(run.projectiles.length, 0);
  assert.ok(p.attackFlash > 0, 'A successful bite starts its attack animation');
});

test('Mordida de paleta cannot hit outside its reduced melee reach', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  run.enemies.push({ id: 1, x: run.player.x + run.player.attackRange + 20, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  step(run, 0.05, {});
  assert.equal(run.enemies[0].hp, 500);
});

test('Solago narrow hitbox avoids a graze that still reaches El Negro', () => {
  const negro = createRun(() => 0.5, 'negro');
  const solago = createRun(() => 0.5, 'solago');
  for (const run of [negro, solago]) {
    run.spawnIn = 100;
    run.shotIn = 100;
    run.enemies.push({ id: 1, x: run.player.x + 36, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 17 * WORLD_SCALE, kind: 'zombie' });
    step(run, 0.05, {});
  }
  assert.ok(negro.player.hp < negro.player.maxHp);
  assert.equal(solago.player.hp, solago.player.maxHp);
});

test('Sonrisa blindada periodically absorbs 25% extra incoming damage', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  run.player.smileCooldown = 0;
  run.enemies.push({ id: 1, x: run.player.x + 25, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  step(run, 0.05, {});
  assert.ok(run.player.smile > 0);
  assert.equal(run.player.hp, 100 - 12 * (1 - 0.15 - 0.25));
});

test('eight chore-task kills trigger a temporary damage and attack-speed buff', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const p = run.player;
  for (let id = 1; id <= 8; id++) {
    run.enemies.push({ id, x: p.x + p.attackRange - 4, y: p.y, hp: 1, maxHp: 1, speed: 0, radius: 8, kind: 'zombie' });
  }
  for (let i = 0; i < 130; i++) step(run, 0.05, {});
  assert.equal(run.kills, 8);
  assert.equal(p.taskKills, 0);
  assert.ok(p.permissionActive > 0);
  assert.ok(p.permissionNeeded > 0);
});

test('La Patrona holds Solago still, deals area damage, and nicks him when she leaves', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const p = run.player;
  const enemy = { id: 1, x: p.x + 100, y: p.y, hp: 1000, maxHp: 1000, speed: 0, radius: 12, kind: 'zombie' };
  run.enemies.push(enemy);
  assert.equal(activateSpecial(run, 'stand'), true);
  assert.ok(p.stand > 0);
  const startX = p.x;
  const startY = p.y;
  step(run, 0.05, { x: 1, y: 1 });
  assert.equal(p.x, startX);
  assert.equal(p.y, startY);
  assert.ok(enemy.hp < 1000);
  p.stand = 0.05;
  p.standCooldown = 10;
  step(run, 0.05, {});
  assert.equal(p.hp, 85);
  assert.equal(p.x, startX);
  assert.equal(p.y, startY);
  assert.equal(activateSpecial(run, 'stand'), false);
  assert.equal(activateSpecial(run, 'anime'), false);
});
