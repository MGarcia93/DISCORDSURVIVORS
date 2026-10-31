import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, createRun, startNextWave, step } from '../src/engine.mjs';
import act03 from '../src/campaign/act-03-inferno.mjs';

function zirFight() {
  const run = createRun(() => 0.5, 'negro', {}, act03);
  run.player.hp = run.player.maxHp = 1e9;
  while (run.wave < 5) {
    run.time = run.duration;
    step(run, 0);
    assert.equal(run.phase, 'shop');
    assert.equal(startNextWave(run), true);
  }
  return run;
}

test('Lord Zir death closes his wave before or after the timer, without clearing bats first', () => {
  for (const expired of [false, true]) {
    const run = zirFight();
    run.time = expired ? run.duration + 1 : 1;
    run.enemies.push(createEnemy(run, 'batSwarm', 0, 0));
    run.enemies.find(enemy => enemy.kind === 'lordZir').hp = 0;
    const kills = run.kills;
    step(run, 0);
    assert.equal(run.phase, 'shop', 'Zir dying immediately opens rewards');
    assert.equal(run.kills, kills + 1, 'leftover bats do not need to be killed');
    assert.deepEqual(run.enemies, []);
    assert.deepEqual(run.projectiles, []);
    const serial = run.serial;
    for (let i = 0; i < 100; i++) step(run, 0.05);
    assert.equal(run.serial, serial, 'no bats spawn after the fight');
  }
});

test('Lord Zir survives the timer and his living court still spawns bats', () => {
  const run = zirFight();
  run.time = run.duration + 1;
  run.spawnIn = 0;
  const budget = run.spawnBudget;
  step(run, 0);
  assert.equal(run.phase, 'playing', 'the timer cannot skip Lord Zir');
  assert.equal(run.spawnBudget, budget - 1);
  assert.ok(run.enemies.some(enemy => enemy.kind === 'batSwarm'));
  assert.ok(run.enemies.some(enemy => enemy.kind === 'lordZir' && enemy.hp > 0));
});
