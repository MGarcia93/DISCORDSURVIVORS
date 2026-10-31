import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, startNextWave, step } from '../src/engine.mjs';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';
import act02 from '../src/campaign/act-02-rift.mjs';
const { validateAct } = await import('../src/campaign/validate.mjs');

function arrive(run, wave) {
  run.player.hp = run.player.maxHp = 1e9;
  while (run.wave < wave) {
    run.time = run.duration;
    step(run, 0);
    assert.equal(run.phase, 'shop', `wave ${run.wave} closes normally`);
    assert.equal(startNextWave(run), true);
  }
  return run;
}

const lines = act => (Array.isArray(act.miniboss) ? act.miniboss : [act.miniboss])
  .filter(Boolean).map(entry => entry.wave);

test('every mini-boss wave waits for its boss instead of the clock', () => {
  for (const act of PLAYABLE_ACTS.filter(act => act.miniboss)) {
    const run = arrive(createRun(() => 0.5, 'negro', {}, act), Math.min(...lines(act)));
    const boss = run.enemies.find(enemy => enemy.gauntlet !== undefined);
    assert.ok(boss, `${act.id} fields its mini-boss`);
    run.time = run.duration + 30;
    step(run, 0);
    assert.equal(run.phase, 'playing', `${act.id}: an expired clock cannot end the boss fight`);
    // A line of bosses is cleared one at a time; the last one closes the wave.
    for (let guard = 0; run.phase === 'playing' && guard < 8; guard++) {
      for (const enemy of run.enemies.filter(enemy => enemy.gauntlet !== undefined)) enemy.hp = 0;
      step(run, 0.016);
    }
    assert.equal(run.phase, 'shop', `${act.id}: killing the boss closes the wave`);
  }
});

test('ordinary waves still end on their clock', () => {
  const run = createRun(() => 0.5, 'negro', {}, act02);
  run.player.hp = run.player.maxHp = 1e9;
  run.time = run.duration;
  step(run, 0);
  assert.equal(run.phase, 'shop');
});

test('a mini-boss wave that forgets to wait is rejected at validation', () => {
  const broken = structuredClone(act02);
  delete broken.waves[broken.miniboss.wave - 1].untimed;
  assert.throws(() => validateAct(broken), /must be untimed/);
  assert.equal(validateAct(act02).id, 'act-02');
});

test('no wave closes while a boss is still standing, whatever closed it', () => {
  for (const act of PLAYABLE_ACTS.filter(act => act.miniboss)) {
    const run = arrive(createRun(() => 0.5, 'negro', {}, act), Math.min(...lines(act)));
    // Force the two things that can close a wave: the clock and the line flag.
    run.time = run.duration + 60;
    run.gauntletCleared = true;
    step(run, 0.016);
    assert.equal(run.phase, 'playing', `${act.id}: a live boss holds the wave open`);
    for (let guard = 0; run.phase === 'playing' && guard < 8; guard++) {
      for (const enemy of run.enemies.filter(enemy => enemy.gauntlet !== undefined)) enemy.hp = 0;
      run.time = run.duration + 60;
      step(run, 0.016);
    }
    assert.equal(run.phase, 'shop', `${act.id}: the wave closes once the last boss falls`);
  }
});
