import test from 'node:test';
import assert from 'node:assert/strict';
import { pickKind, spawnInterval, waveBudget, waveConfig } from '../src/waves.mjs';
import { enemyHp } from '../src/enemies/index.mjs';
import { createRun, startNextWave, step } from '../src/engine.mjs';
import { BALANCE, balanceFor } from '../src/reward-data.mjs';
import act01 from '../src/campaign/act-01-zomboid.mjs';

// Deterministic draw queue: each call returns the next value and wraps around.
const sequence = (...values) => { let index = 0; return () => values[index++ % values.length]; };

test('every wave of the act declares its pool and its density, and no statistic of its own', () => {
  assert.equal(act01.waves.length, 6);
  act01.waves.forEach((config, index) => {
    assert.equal(config.wave, index + 1);
    assert.ok(Number.isInteger(config.perMinute) && config.perMinute >= 0);
    const share = Object.values(config.mix).reduce((sum, weight) => sum + weight, 0);
    if (config.perMinute > 0) assert.ok(Math.abs(share - 1) < 1e-9, `wave ${config.wave} mix shares one roll`);
    // The enemy sheet is the only owner of the six combat stats: a wave that
    // brought its own table is exactly the duplication this rule removed.
    assert.equal(config.life, undefined, `wave ${config.wave} authors no life table`);
    assert.equal(config.damage, undefined, `wave ${config.wave} authors no damage table`);
  });
  assert.equal(waveConfig(act01, 99), null);
});

test('each spawn rolls the wave pool instead of a hardcoded coin toss', () => {
  const wave2 = waveConfig(act01, 2);
  assert.equal(pickKind(wave2, () => 0), 'zombie');
  assert.equal(pickKind(wave2, () => 0.69), 'zombie');
  assert.equal(pickKind(wave2, () => 0.71), 'runner');
  assert.equal(pickKind(wave2, () => 0.999), 'runner');
  assert.equal(pickKind(waveConfig(act01, 1), () => 0.9), 'zombie');
  assert.equal(pickKind(waveConfig(act01, 6), () => 0.5), null);
});

test('wave three fields the resistant zombie the act script asks for', () => {
  const wave3 = waveConfig(act01, 3);
  assert.equal(wave3.mix.brute, 0.2);
  assert.equal(enemyHp('brute', 3), 156, 'the brute reads its life from its own sheet');
  assert.equal(pickKind(wave3, () => 0), 'zombie');
  assert.equal(pickKind(wave3, () => 0.999), 'brute');
});

test('a wave spawns its whole budget and then stops, however long it runs', () => {
  const run = createRun(() => 0.37);
  run.player.hp = run.player.maxHp = 1e9;
  const expected = Math.round(48 * run.duration / 60);
  assert.equal(run.spawnBudget, expected);
  let spawned = 0;
  let serial = run.serial;
  while (run.phase === 'playing' && run.time < run.duration - 0.2) {
    step(run, 0.05, {});
    spawned += run.serial - serial;
    serial = run.serial;
  }
  assert.equal(run.spawnBudget, 0);
  assert.equal(spawned, expected);
});

test('the budget follows the wave length so density does not collapse', () => {
  const long = createRun(() => 0.5, 'negro', {
    balance: { ...BALANCE, waves: { duration: 60 } },
  });
  assert.equal(long.duration, 60);
  assert.equal(long.spawnBudget, 48);
  assert.equal(waveBudget(act01, 1, 30), 24);
});

test('the cadence spreads the budget over the remaining time', () => {
  assert.equal(spawnInterval(60, 48), 60 / 49);
  assert.equal(spawnInterval(10, 1), 5);
  assert.equal(spawnInterval(10, 0), Infinity);
});

test('spawned enemies hang their life off their own sheet', () => {
  const run = createRun(() => 0.1);
  run.wave = 2;
  run.random = sequence(0.9, 0.1, 0.1, 0.1);
  run.spawnIn = 0;
  step(run, 0.016);
  const [runner] = run.enemies;
  assert.equal(runner.kind, 'runner');
  assert.equal(runner.hp, enemyHp('runner', 2), 'one life per world, authored by the sheet');
});

test('a wave three spawn rolls the brute and reads its life from its sheet', () => {
  const run = createRun(() => 0.1);
  run.wave = 3;
  run.random = sequence(0.9, 0.1, 0.1, 0.1);
  run.spawnIn = 0;
  step(run, 0.016);
  const [brute] = run.enemies;
  assert.equal(brute.kind, 'brute');
  assert.equal(brute.hp, enemyHp('brute', 3), 'the brute reads its life from its own sheet');
  assert.equal(brute.attackInterval, 1);
  assert.equal(brute.attackRange, 0);
});

test('the next wave loads its own budget from the table', () => {
  const run = createRun(() => 0.5);
  run.time = run.duration;
  step(run, 0.02);
  assert.equal(run.phase, 'shop');
  assert.equal(startNextWave(run), true);
  assert.equal(run.spawnBudget, Math.round(waveConfig(act01, 2).perMinute * run.duration / 60));
});

test('the shipped act plays full-minute waves and leaves the boss untimed', () => {
  const run = createRun(() => 0.5);
  run.player.hp = run.player.maxHp = 1e9;
  assert.equal(run.duration, 60, 'real-time waves last one minute');
  assert.equal(run.spawnBudget, 48, 'the wave keeps its per-minute density');
  const bossWave = run.act.boss.wave;
  while (run.wave < bossWave) {
    run.time = run.duration;
    step(run, 0, {});
    assert.equal(run.phase, 'shop');
    assert.equal(startNextWave(run), true);
  }
  assert.equal(run.wave, bossWave);
  const boss = run.enemies.find(enemy => enemy.boss);
  assert.ok(boss, 'the boss wave fields its boss');
  boss.hp = boss.maxHp = 1e9;
  boss.speed = 0;
  run.time = run.duration + 1;
  step(run, 0.05, {});
  assert.equal(run.phase, 'playing', 'the boss wave does not end on the wave clock');
  assert.ok(run.time > run.duration);
});

test('wave length belongs to the act and only an explicit test mode shortens it', () => {
  assert.equal(Object.hasOwn(BALANCE, 'waves'), false, 'the balance no longer owns wave data');
  assert.equal(balanceFor('').waves, undefined, 'the real pacing is the default');
  assert.equal(balanceFor(undefined).waves, undefined);
  assert.equal(balanceFor('?playtest').waves.duration, 15, 'the test mode is opt-in');
  assert.equal(balanceFor('?waves=45').waves.duration, 45, 'the length stays forceable');
  assert.equal(balanceFor('?waves=nope').waves, undefined);
  const real = createRun(() => 0.5, 'negro', { balance: balanceFor('') });
  assert.equal(real.duration, real.act.duration);
  assert.equal(real.spawnBudget, Math.round(48 * 60 / 60));
});
