import test from 'node:test';
import assert from 'node:assert/strict';
import { activateSpecial, createEnemy, createRun, startNextWave, step } from '../src/engine.mjs';
import { ENEMY_KINDS, enemySpeed } from '../src/enemies/index.mjs';
import act05 from '../src/campaign/act-05-discord.mjs';

// Walk the run to a wave through the shop gate, exactly like the player does.
function reachWave(run, wave) {
  while (run.wave < wave) {
    run.time = run.duration;
    step(run, 0, {});
    assert.equal(run.phase, 'shop');
    assert.equal(startNextWave(run), true);
  }
  return run;
}

function runAt(wave) {
  const run = createRun(() => 0.5, 'negro', {}, act05);
  run.player.hp = run.player.maxHp = 1e9;
  return reachWave(run, wave);
}

// A hit that kills without waiting for the weapon: the engine pays the death.
function slay(run, enemy) {
  enemy.hp = 0;
  step(run, 0.016, {});
}

test('wave five restores the four bosses one at a time, in script order', () => {
  const run = runAt(5);
  const order = act05.miniboss.map(entry => entry.kind);
  assert.equal(run.enemies.length, 1, 'the first corrupted boss arrives alone');
  for (const [index, kind] of order.entries()) {
    const boss = run.enemies.find(enemy => enemy.gauntlet === index);
    assert.ok(boss, `${kind} is on the field`);
    assert.equal(boss.kind, kind);
    assert.equal(run.phase, 'playing', 'a corrupted boss dying never closes the run');
    slay(run, boss);
    if (index < order.length - 1) {
      assert.equal(run.enemies.length, 1, 'the next one walks in where the last one fell');
    }
  }
  assert.equal(run.phase, 'playing', 'the gauntlet leaves the run open for wave six');
});

test('the boss wave fields the administrator and only the administrator closes the run', () => {
  const run = runAt(6);
  const [boss] = run.enemies;
  assert.equal(boss.kind, 'administrator');
  assert.equal(boss.boss, true);
  slay(run, boss);
  assert.equal(run.phase, 'won');
});

test('the hotfix wave makes its enemies faster and mutes the cast for a moment', () => {
  const run = createRun(() => 0.5, 'negro', {}, act05);
  const plain = createEnemy(run, 'zombie', 0, 0);
  run.wave = 4;
  const hotfixed = createEnemy(run, 'zombie', 0, 0);
  assert.equal(hotfixed.speed, enemySpeed('zombie', 4) * act05.waves[3].speedBoost);
  assert.ok(hotfixed.speed > plain.speed, 'hotfix 1.0.4 speeds the wave up');

  const locked = runAt(4);
  const key = locked.player.characterDef.specials[0].key;
  assert.ok(locked.specialsLocked > 0, 'hotfix 1.0.5 cuts the specials');
  assert.equal(activateSpecial(locked, key), false, 'a muted special never fires');
  for (let i = 0; i < 400; i++) step(locked, 0.05, {});
  assert.equal(locked.specialsLocked, 0, 'the cut expires on its own');
});

test('the administrator mutes the players through its own action', () => {
  const run = createRun(() => 0.5, 'negro', {}, act05);
  const mute = ENEMY_KINDS.administrator.actions.find(action => action.key === 'mute');
  const locks = [];
  mute.run(run, { x: 0, y: 0 }, { lockSpecials: seconds => locks.push(seconds) });
  assert.deepEqual(locks, [6], 'the ficha asks for the lock; the engine owns the clock');
  const key = run.player.characterDef.specials[0].key;
  run.specialsLocked = locks[0];
  assert.equal(activateSpecial(run, key), false);
});

test('the administrator keeps its phases: rollback once, then it breaks apart', () => {
  const run = createRun(() => 0.5, 'negro', {}, act05);
  const actions = ENEMY_KINDS.administrator.actions;
  const rollback = actions.find(action => action.key === 'rollback');
  const breakdown = actions.find(action => action.key === 'breakdown');
  const boss = createEnemy(run, 'administrator', 0, 0);
  assert.equal(rollback.when(run, boss), false, 'the rollback waits for its phase');
  boss.hp = boss.maxHp * 0.4;
  assert.equal(rollback.when(run, boss), true);
  rollback.run(run, boss);
  assert.equal(boss.rolledBack, true);
  assert.ok(boss.hp > boss.maxHp * 0.4, 'the rollback restores part of its health');
  assert.equal(rollback.when(run, boss), false, 'it only cheats once');
  assert.equal(breakdown.when(run, boss), false);
  boss.hp = boss.maxHp * 0.2;
  assert.equal(breakdown.when(run, boss), true);
  const cadence = boss.attackInterval;
  breakdown.run(run, boss);
  assert.ok(boss.attackInterval < cadence, 'the last third attacks faster');
});
