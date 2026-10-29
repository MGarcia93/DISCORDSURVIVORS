import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, WORLD_SCALE } from '../src/engine.mjs';

// A run that never spawns on its own: every test places exactly the enemies it
// wants to reason about, so nothing else moves.
function quietRun() {
  const run = createRun(() => 0.5);
  run.spawnBudget = 0;
  run.spawnIn = Infinity;
  run.enemies = [];
  run.player.hp = 1000;
  run.player.maxHp = 1000;
  return run;
}

function place(run, overrides = {}) {
  const p = run.player;
  const enemy = {
    id: ++run.serial, kind: 'zombie', x: p.x, y: p.y, hp: 100, maxHp: 100, defense: 0,
    radius: 17 * WORLD_SCALE, speed: 44 * WORLD_SCALE, attackRange: 0, attackInterval: 1,
    ...overrides,
  };
  run.enemies.push(enemy);
  return enemy;
}

test('an enemy walks toward the player while it is outside its attack distance', () => {
  const run = quietRun();
  const enemy = place(run, { x: run.player.x + 400 });
  const before = enemy.x;
  step(run, 0.1, {});
  assert.ok(enemy.x < before, 'closes the distance');
});

test('an enemy inside its attack distance stops instead of walking into the player', () => {
  const run = quietRun();
  const enemy = place(run, { x: run.player.x + 40, attackRange: 60 });
  step(run, 0.1, {});
  assert.equal(enemy.x, run.player.x + 40);
});

test('melee enemies still have to touch the player to land a hit', () => {
  const run = quietRun();
  place(run, { x: run.player.x + 60 });
  step(run, 0.05, {});
  assert.equal(run.player.hp, 1000);
});

test('an enemy attacks from its own reach and goes on its own cooldown', () => {
  const run = quietRun();
  const enemy = place(run, { x: run.player.x + 40, attackRange: 60, attackInterval: 2 });
  step(run, 0.05, {});
  assert.ok(run.player.hp < 1000, 'hits without touching');
  assert.equal(enemy.attackCd, 2, 'waits its own interval, not the contact floor');
});

test('the player immunity stays a floor between two hits of the same enemy', () => {
  const run = quietRun();
  const enemy = place(run, { attackRange: 0, attackInterval: 0 });
  step(run, 0.05, {});
  const afterFirst = run.player.hp;
  step(run, 0.05, {});
  assert.equal(run.player.hp, afterFirst, 'the second swing lands after the immunity, not before');
});
