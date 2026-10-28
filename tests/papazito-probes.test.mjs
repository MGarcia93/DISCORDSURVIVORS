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
  assert.equal(p.damage, 30);
  assert.equal(p.attackRange, 280 * WS);
  assert.ok(Math.abs(p.shotInterval - 100 / 90) < 1e-12);
  assert.equal(p.speed, 148.5 * WS);
});

test('S3 probe: La seña leaves early bounties alone until the timed charge', () => {
  const run = createRun(() => 0.5, 'papazito');
  assert.deepEqual(killZombie(run, 100), { from: 100, to: 100 + run.rewardBalance.gold.rewards.zombie });
  const p = run.player;
  assert.equal(p.panicTtl, 0);
  assert.ok(p.senaCooldown > 9 && p.senaCooldown < 10);
  killZombie(run);
  assert.equal(run.coins, 100 + 2 * run.rewardBalance.gold.rewards.zombie, 'second award inside the cooldown keeps every coin');
  assert.equal(p.panicTtl, 0, 'earning coins does not activate panic');
});

test('S4 probe: the sale table, the once-per-run stock and the +50% damage ceiling', () => {
  const table = {
    psp: [20, 0.10, 0.15], monitor: [35, 0.15, 0], keyboard: [25, 0.15, 0],
    chair: [30, 0.20, 0], pc: [100, 0.50, 0.30],
  };
  for (const [key, [coins, damageFrac, moveSlowFrac]] of Object.entries(table)) {
    const r = createRun(Math.random, 'papazito');
    const p = r.player;
    assert.equal(sellBelonging(r, key), true, key);
    assert.equal(r.coins, coins);
    assert.ok(Math.abs((p.sellDamageFrac ?? 0) - damageFrac) < 1e-12);
    assert.ok(Math.abs((p.sellMoveSlowFrac ?? 0) - moveSlowFrac) < 1e-12);
    assert.equal(sellBelonging(r, key), false, `${key} sells exactly once`);
  }
  const r = createRun(Math.random, 'papazito');
  for (const key of Object.keys(table)) sellBelonging(r, key);
  assert.ok(Math.abs(r.player.sellDamageFrac - 0.5) < 1e-9, 'damage stack caps at +50%');
  const next = createRun(Math.random, 'papazito');
  for (const key of Object.keys(table)) assert.ok(sellBelonging(next, key), 'inventory resets per run');
});

test('S5 probe: ANAMENCUÁ cooldown and three-ring activation', () => {
  const run = createRun(Math.random, 'papazito');
  assert.equal(activateSpecial(run, 'anamencua'), true);
  assert.equal(run.player.anamencua, 1.2);
  assert.equal(run.player.anamencuaCooldown, 40);
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
