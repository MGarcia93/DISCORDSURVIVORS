import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, activateSpecial, sellBelonging } from '../src/engine.mjs';
import { WORLD_SCALE } from '../src/constants.mjs';
import { isCharacterUnlocked, recordMapVictory } from '../src/progression.mjs';
import { getCharacter } from '../src/characters/index.mjs';

// Regression probes written from the independent verification pass over the
// completed Papazito feature (odd/tasks/papazito-character.md).
const WS = WORLD_SCALE;

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

// Drops a static 1hp zombie inside Papazito's attackRange and steps until the
// shot kills it; returns the coins around the killing step.
function killZombie(run, coinsPreset) {
  if (coinsPreset !== undefined) run.coins = coinsPreset;
  const from = run.coins;
  const enemy = { id: ++run.serial, kind: 'zombie', x: run.player.x + 100, y: run.player.y, hp: 1, maxHp: 1,
    defense: 0, radius: 10 * WS, speed: 0 };
  run.enemies.push(enemy);
  let steps = 0;
  while (enemy.hp > 0 && steps < 200) { step(run, 0.05); steps++; }
  return { from, to: run.coins };
}

test('S1 probe: papazito resolves the ficha sheet into engine stats', () => {
  const p = createRun(Math.random, 'papazito').player;
  assert.equal(p.maxHp, 110);
  assert.equal(p.defense, 0.55);
  assert.equal(p.damage, 34);
  assert.equal(p.attackRange, 280 * WS);
  assert.ok(Math.abs(p.shotInterval - 100 / 90) < 1e-12);
  assert.equal(p.speed, 148.5 * WS);
});

test('S3 probe: La seña leaves early bounties alone until the timed charge', () => {
  const run = createRun(() => 0.5, 'papazito');
  // Papazito banks half again per bounty, carried between kills.
  const bounty = run.rewardBalance.gold.rewards.zombie;
  assert.deepEqual(killZombie(run, 100), { from: 100, to: 100 + bounty });
  const p = run.player;
  assert.equal(p.panicTtl, 0);
  assert.ok(p.senaCooldown > 9 && p.senaCooldown < 10);
  killZombie(run);
  // Two bounties plus the carried half: the bonus rounds up on the second kill.
  assert.equal(run.coins, 100 + 2 * run.rewardBalance.gold.rewards.zombie + 1, 'second award inside the cooldown keeps every coin');
  assert.equal(p.panicTtl, 0, 'earning coins does not activate panic');
});

test('S4 probe: the sale table, the once-per-run stock and the shared stat rules', () => {
  const table = {
    psp: [20, 10, -15], monitor: [35, 15, 0], keyboard: [25, 15, 0],
    chair: [30, 20, 0], pc: [100, 50, -30],
  };
  for (const [key, [coins, attack, moveSpeed]] of Object.entries(table)) {    const r = createRun(Math.random, 'papazito');
    const p = r.player;
    const baseDamage = p.damage, baseSpeed = p.speed;
    assert.equal(sellBelonging(r, key), true, key);
    assert.equal(r.coins, coins);
    assert.ok(Math.abs(p.damage - baseDamage * (1 + attack / 100)) < 1e-9, `${key} damage`);
    assert.ok(Math.abs(p.speed - baseSpeed * (1 + moveSpeed / 100)) < 1e-9, `${key} movement`);
    assert.equal(sellBelonging(r, key), false, `${key} sells exactly once`);
  }
  // Nothing is clamped: percent modifiers add up in points, the system's rule.
  const r = createRun(Math.random, 'papazito');
  const baseDamage = r.player.damage, baseSpeed = r.player.speed;
  for (const key of Object.keys(table)) sellBelonging(r, key);
  assert.ok(Math.abs(r.player.damage - baseDamage * 2.1) < 1e-9, 'every sale pays its damage: 10+15+15+20+50 points');
  assert.ok(Math.abs(r.player.speed - baseSpeed * 0.55) < 1e-9, 'every sale charges its movement');
  const next = createRun(Math.random, 'papazito');
  for (const key of Object.keys(table)) assert.ok(sellBelonging(next, key), 'inventory resets per run');
});

test('S5 probe: ANAMENCUÁ cooldown and three-ring activation', () => {
  const run = createRun(Math.random, 'papazito');
  assert.equal(activateSpecial(run, 'anamencua'), true);
  assert.equal(run.player.anamencua, 1.2);
  assert.equal(run.player.anamencuaCooldown, 25);
  run.spawnIn = run.shotIn = 100;
  const enemy = { id: ++run.serial, kind: 'zombie', x: run.player.x + 100 * WS, y: run.player.y, hp: 500, maxHp: 500,
    defense: 0, radius: 10 * WS, speed: 0 };
  run.enemies.push(enemy);
  let t = 0;
  while (t < 1.25) { step(run, 0.01); t += 0.01; }
  assert.ok(enemy.hp <= 500 - 23, 'both rings must land a brick in 1.25s');
});

test('S6 probe: warrior victory unlocks papazito without disturbing the old chain', () => {
  const storage = memoryStorage();
  assert.equal(isCharacterUnlocked('papazito', storage), false);
  assert.equal(recordMapVictory('warrior', storage), true);
  assert.equal(isCharacterUnlocked('papazito', storage), true);
  const second = memoryStorage();
  assert.equal(recordMapVictory('negro', second), true);
  assert.equal(isCharacterUnlocked('warrior', second), false);
  assert.equal(isCharacterUnlocked('solago', second), true);
  assert.equal(isCharacterUnlocked('papazito', second), false);
  assert.equal(getCharacter('nope').id, 'negro');
});
