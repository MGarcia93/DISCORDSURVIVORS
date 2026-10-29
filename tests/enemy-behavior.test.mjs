import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, createRun, step, WORLD_SCALE } from '../src/engine.mjs';

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

test('an enemy with declared actions rolls one by weight and pays its cooldown', () => {
  const run = quietRun();
  const fired = [];
  const enemy = place(run, {
    attackRange: 60,
    actions: [
      { key: 'swipe', chance: 1, kind: 'melee' },
      { key: 'howl', chance: 3, cooldown: 5, run: () => fired.push('howl') },
    ],
  });
  run.random = () => 0.9; // the heavy side of the roll
  step(run, 0.05, {});
  assert.deepEqual(fired, ['howl'], 'the weighted action wins the roll');
  assert.equal(enemy.actionCds.howl, 5, 'and takes its own cooldown');
});

test('an action on cooldown is never rolled', () => {
  const run = quietRun();
  const fired = [];
  const enemy = place(run, {
    attackRange: 60,
    actions: [
      { key: 'swipe', chance: 1, kind: 'melee' },
      { key: 'howl', chance: 3, cooldown: 5, run: () => fired.push('howl') },
    ],
  });
  enemy.actionCds = { howl: 5 };
  run.random = () => 0.9;
  step(run, 0.05, {});
  assert.deepEqual(fired, [], 'the cooling action is out of the pool');
  assert.ok(run.player.hp < 1000, 'so the swipe lands instead');
});

test('an enemy with no actions of its own keeps the plain attack', () => {
  const run = quietRun();
  place(run, { attackRange: 0 });
  step(run, 0.05, {});
  assert.ok(run.player.hp < 1000, 'the basic hit still resolves');
});

test('the alarm boss pulls a horde in with its own summon action', () => {
  const run = quietRun();
  const boss = createEnemy(run, 'boss', run.player.x + 30, run.player.y);
  run.enemies.push(boss);
  run.random = () => 0.6; // lands on the summon band (swipe 3, summon 1, wave 2)
  step(run, 0.05, {});
  assert.equal(run.enemies.length, 3, 'the boss plus the two it dragged in');
  assert.ok(run.enemies.some(enemy => enemy.kind === 'zombie'), 'summoned zombies, not decorations');
  assert.equal(boss.actionCds.summon, 9, 'and the summon pays its cooldown');
});

test('the alarm boss rings a sound wave that has to be walked out of', () => {
  const run = quietRun();
  const boss = createEnemy(run, 'boss', run.player.x + 30, run.player.y);
  run.enemies.push(boss);
  run.random = () => 0.8; // lands on the wave band
  step(run, 0.05, {});
  assert.equal(run.shockwaves.length, 1, 'a ring left the alarm');
  const hpBefore = run.player.hp;
  for (let tick = 0; tick < 60; tick++) step(run, 0.05, {});
  assert.ok(run.player.hp < hpBefore, 'standing in the ring costs health');
  assert.equal(run.shockwaves.length, 0, 'and the ring dies once it is spent');
});
