import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, startNextWave, step } from '../src/engine.mjs';
import { ENEMY_KINDS, enemyAttackInterval, enemyAttackRange, enemyBounty, enemyContactDamage, enemyDefense, enemyHp, enemySpeed } from '../src/enemies/index.mjs';

test('every enemy kind authors all six combat stats plus its body and bounty', () => {
  const six = ['life', 'defense', 'attack', 'attackSpeed', 'attackDistance', 'moveSpeed'];
  for (const [kind, def] of Object.entries(ENEMY_KINDS)) {
    for (const stat of six) assert.ok(stat in def.stats, `${kind} authors ${stat}`);
    assert.ok(def.radius > 0, `${kind} declares its collision size outside the sheet`);
    assert.ok(def.bounty > 0, `${kind} declares its own bounty`);
  }
  // Melee kinds stop at contact and swing on the player's immunity floor.
  assert.equal(enemyAttackRange('zombie'), 0);
  assert.equal(enemyAttackInterval('zombie'), 100 / 154);
});

test('the act 3 roster authors its own sheets, reach and roles', () => {
  assert.equal(enemyHp('skeleton', 1), 36);
  assert.equal(enemyBounty('skeleton'), 2);
  assert.equal(enemyBounty('batSwarm'), 1);
  // The shaman is the act's artillery: it keeps its distance and throws a hex.
  assert.ok(enemyAttackRange('shaman', 2) > 100, 'the shaman fires from range');
  assert.equal(ENEMY_KINDS.shaman.projectile, 'hex');
  // The burning elite is the only common kind that carries an ability.
  assert.deepEqual(ENEMY_KINDS.burningElite.actions.map(action => action.key), ['swipe', 'flames']);
  // Lord Zir is the mini-boss and Lilith is the boss.
  assert.equal(ENEMY_KINDS.lordZir.boss, true);
  assert.equal(ENEMY_KINDS.lilith.boss, true);
  assert.deepEqual(ENEMY_KINDS.lilith.actions.map(action => action.key),
    ['swipe', 'claw', 'nova', 'dive', 'enrage']);
  assert.ok(enemyHp('lilith') > enemyHp('lordZir'), 'the boss outlasts the mini-boss');
});

test('the resistant zombie is a slow wall: more life, mitigation and punch, less speed', () => {
  assert.equal(ENEMY_KINDS.brute.radius, 22);
  assert.equal(enemyHp('brute', 3), 156);
  assert.equal(enemyDefense('brute', 3), 0.3);
  assert.equal(enemyContactDamage('brute', 3), 30);
  assert.equal(enemyAttackInterval('brute', 3), 1);
  assert.equal(enemyAttackRange('brute', 3), 0);
  assert.equal(enemySpeed('brute', 3), 490 * 5 / 100 * WORLD_SCALE);
  assert.equal(enemyBounty('brute'), 5);
});

test('enemy sheets are percentages over the base stats with per-wave curves', () => {
  assert.equal(enemyHp('zombie', 1), 46);
  assert.equal(enemyHp('zombie', 10), 100);
  assert.equal(enemyHp('runner', 2), 38);
  assert.equal(enemySpeed('zombie', 5), 60 * WORLD_SCALE);
  assert.equal(enemySpeed('runner', 5), 108 * WORLD_SCALE);
  assert.equal(enemyHp('alarmZombie', 4), 2200);
  assert.equal(ENEMY_KINDS.zombie.radius, 17);
  assert.equal(ENEMY_KINDS.runner.radius, 13);
  assert.equal(ENEMY_KINDS.alarmZombie.radius, 38);
  assert.equal(enemySpeed('alarmZombie', 4), 52 * WORLD_SCALE);
  for (const kind of ['zombie', 'runner']) {
    assert.equal(enemyContactDamage(kind), 12);
    assert.equal(enemyBounty(kind), 2);
  }
  assert.equal(enemyContactDamage('alarmZombie'), 30);
  assert.equal(enemyBounty('alarmZombie'), 30);
});

test('spawned zombies and runners read hp, radius and speed from the table', () => {
  const zombieRun = createRun(() => 0.1);
  zombieRun.spawnIn = 0;
  step(zombieRun, 0.016);
  const zombie = zombieRun.enemies[0];
  assert.equal(zombie.kind, 'zombie');
  assert.equal(zombie.hp, 46);
  assert.equal(zombie.radius, 17 * 1.1);
  assert.equal(zombie.speed, 45 * 1.1);

  const runnerRun = createRun(() => 0.1);
  runnerRun.wave = 2;
  // Wave 2 rolls its pool first: 0.9 lands on the runner share. The rest of the
  // queue keeps the position and speed draws identical to the zombie case.
  const draws = [0.9, 0.1, 0.1, 0.1];
  let draw = 0;
  runnerRun.random = () => draws[draw++ % draws.length];
  runnerRun.spawnIn = 0;
  step(runnerRun, 0.016);
  const runner = runnerRun.enemies[0];
  assert.equal(runner.kind, 'runner');
  assert.equal(runner.hp, 38);
  assert.equal(runner.radius, 13 * 1.1);
  assert.equal(runner.speed, 97 * 1.1);
});

test('the act boss takes its stats from the table on its own wave', () => {
  const run = createRun();
  run.wave = run.act.boss.wave - 1;
  run.phase = 'shop';
  assert.equal(startNextWave(run), true);
  const [boss] = run.enemies;
  assert.equal(boss.kind, 'alarmZombie');
  assert.equal(boss.hp, 2200);
  assert.equal(boss.radius, 38 * 1.1);
  assert.equal(boss.speed, 52 * 1.1);
});

test('contact damage and coin rewards read the table at runtime', () => {
  const run = createRun();
  run.enemies.push({ id: 1, kind: 'alarmZombie', boss: true, hp: 999, maxHp: 999, x: run.player.x, y: run.player.y,
    radius: 10 * 1.1, speed: 0 });
  const before = run.player.hp;
  step(run, 0.016);
  assert.equal(run.player.hp, before - 30 * (1 - 0.2));

  const killRun = createRun(() => 0.5);
  killRun.enemies.push({ id: 1, kind: 'alarmZombie', boss: true, hp: 1, maxHp: 1, x: killRun.player.x, y: killRun.player.y,
    radius: 10 * 1.1, speed: 0 });
  step(killRun, 0.05, {});
  for (let i = 0; i < 40; i++) step(killRun, 0.05, {});
  assert.equal(killRun.kills, 1);
  assert.equal(killRun.coins, 30);
  assert.equal(killRun.phase, 'won');
});

test('the Rift minions keep the same six-stat sheet, each with its own numbers', () => {
  assert.equal(enemyHp('meleeMinion', 1), 31);
  assert.equal(enemyDefense('meleeMinion'), 0.1);
  assert.equal(enemyContactDamage('meleeMinion'), 11);
  assert.equal(enemyAttackRange('meleeMinion'), 0, 'the soldier has to touch');
  assert.equal(enemyAttackInterval('meleeMinion'), 100 / 154);
  assert.equal(enemySpeed('meleeMinion', 1), 1010 * 5 / 100 * WORLD_SCALE);
  assert.equal(ENEMY_KINDS.meleeMinion.radius, 13);
  assert.equal(enemyBounty('meleeMinion'), 1);

  assert.equal(enemyHp('mageMinion', 2), 32);
  assert.equal(enemyContactDamage('mageMinion'), 10);
  assert.ok(Math.abs(enemyAttackRange('mageMinion') - 187) < 1e-9, 'the mage keeps its distance');
  assert.equal(enemyAttackInterval('mageMinion'), 1);
  assert.equal(ENEMY_KINDS.mageMinion.projectile, 'bolt');
  assert.equal(enemyBounty('mageMinion'), 2);

  assert.equal(enemyHp('siegeMinion', 2), 62);
  assert.equal(enemyDefense('siegeMinion'), 0.2);
  assert.equal(enemyContactDamage('siegeMinion'), 16);
  assert.ok(Math.abs(enemyAttackRange('siegeMinion') - 198) < 1e-9);
  assert.equal(enemyAttackInterval('siegeMinion'), 100 / 60);
  assert.equal(ENEMY_KINDS.siegeMinion.projectile, 'shell');
  assert.equal(enemyBounty('siegeMinion'), 3);
});

test('the act 4 roster authors its own sheets, reach and roles', () => {
  assert.equal(enemyHp('barbarian', 1), 39);
  assert.equal(enemyBounty('barbarian'), 2);
  assert.equal(enemyBounty('slaver'), 3);
  assert.equal(enemyBounty('archer'), 3);
  assert.equal(enemyBounty('alchemist'), 4);
  assert.deepEqual(ENEMY_KINDS.slaver.actions.map(action => action.key), ['swipe', 'net']);
  assert.ok(ENEMY_KINDS.slaver.actions[1].range > 0, 'the net is thrown from a distance');
  // The archer is the act's artillery: it keeps its distance and looses an arrow.
  assert.ok(enemyAttackRange('archer', 2) > 100, 'the archer fires from range');
  assert.equal(ENEMY_KINDS.archer.projectile, 'arrow');
  assert.equal(ENEMY_KINDS.alchemist.projectile, 'flask');
  assert.deepEqual(ENEMY_KINDS.alchemist.actions.map(action => action.key), ['throw', 'spores']);
  // The mini-boss and the boss are flagged, and the boss outlasts the mini-boss.
  assert.equal(ENEMY_KINDS.lotusAlchemist.boss, true);
  assert.equal(ENEMY_KINDS.taskmaster.boss, true);
  assert.deepEqual(ENEMY_KINDS.lotusAlchemist.actions.map(action => action.key),
    ['swipe', 'lotus', 'visions', 'spores', 'overdose']);
  assert.deepEqual(ENEMY_KINDS.taskmaster.actions.map(action => action.key),
    ['swipe', 'chains', 'whip', 'guards', 'wheel', 'rage']);
  assert.ok(enemyHp('taskmaster') > enemyHp('lotusAlchemist'), 'the boss outlasts the mini-boss');
  // The two phases are not the same mechanic: one speeds the hands, the other
  // trades armour for speed.
  assert.ok(ENEMY_KINDS.lotusAlchemist.actions.some(action => action.key === 'overdose' && action.when));
  assert.ok(ENEMY_KINDS.taskmaster.actions.some(action => action.key === 'rage' && action.when));
});
