import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createEnemy, createRun, startNextWave, step } from '../src/engine.mjs';
import { getAct } from '../src/campaign/acts.mjs';
import act05 from '../src/campaign/act-05-discord.mjs';
import { ENEMY_KINDS, enemyAttackInterval, enemyAttackRange, enemyBounty, enemyCombatStats, enemyContactDamage, enemyDefense, enemyHp, enemySpeed } from '../src/enemies/index.mjs';

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
  assert.equal(enemyHp('skeleton', 1), 72);
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
  assert.equal(enemyContactDamage('brute', 3), 42);
  assert.equal(enemyAttackInterval('brute', 3), 1);
  assert.equal(enemyAttackRange('brute', 3), 0);
  assert.equal(enemySpeed('brute', 3), 490 * 5 / 100 * WORLD_SCALE);
  assert.equal(enemyBounty('brute'), 5);
});

test('enemy sheets are percentages over the base stats, with life as one number', () => {
  assert.equal(enemyHp('zombie', 1), 46);
  assert.equal(enemyHp('zombie', 10), 46, 'life is one value: the wave never re-authors it');
  assert.equal(enemyHp('runner', 2), 38);
  assert.equal(enemySpeed('zombie', 5), 60 * WORLD_SCALE);
  assert.equal(enemySpeed('runner', 5), 108 * WORLD_SCALE);
  assert.equal(enemyHp('alarmZombie', 4), 2200);
  assert.equal(ENEMY_KINDS.zombie.radius, 17);
  assert.equal(ENEMY_KINDS.runner.radius, 13);
  assert.equal(ENEMY_KINDS.alarmZombie.radius, 38);
  assert.equal(enemySpeed('alarmZombie', 4), 52 * WORLD_SCALE);
  for (const [kind, contact] of [['zombie', 12], ['runner', 11]]) {
    assert.equal(enemyContactDamage(kind), contact);
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
  assert.equal(zombie.hp, enemyHp('zombie', 1));
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
  assert.equal(runner.hp, enemyHp('runner', 2));
  assert.equal(runner.radius, 13 * 1.1);
  assert.equal(runner.speed, 97 * 1.1);
});

test('an act without multipliers takes every stat from the sheet, untouched', () => {
  const run = createRun(() => 0.5);
  run.wave = 3;
  const enemy = createEnemy(run, 'zombie', 0, 0);
  assert.equal(run.act.statMultipliers, undefined, 'act 1 declares no tier of its own');
  assert.equal(enemy.maxHp, enemyHp('zombie', 3));
  assert.equal(enemy.defense, enemyDefense('zombie', 3));
  assert.equal(enemy.contactDamage, enemyContactDamage('zombie', 3));
  assert.equal(enemy.attackInterval, enemyAttackInterval('zombie', 3));
  assert.equal(enemy.attackRange, enemyAttackRange('zombie', 3));
  assert.equal(enemy.speed, enemySpeed('zombie', 3));
  // The same six values the aggregate helper resolves with no multiplier at all.
  assert.deepEqual(enemyCombatStats('zombie', 3), {
    hp: enemyHp('zombie', 3),
    defense: enemyDefense('zombie', 3),
    contactDamage: enemyContactDamage('zombie', 3),
    attackRange: enemyAttackRange('zombie', 3),
    attackInterval: enemyAttackInterval('zombie', 3),
    speed: enemySpeed('zombie', 3),
  });
});

test('a multiplier scales the authored sheet, and only the statistics it names', () => {
  const run = createRun(() => 0.5, 'negro', {}, act05);
  run.wave = 3;
  const enemy = createEnemy(run, 'zombie', 0, 0);
  // The tier is per kind: this act's zombie and its archer do not have to grow
  // at the same rate, and a kind without an entry keeps its sheet untouched.
  const tier = run.act.statMultipliers.zombie;
  assert.ok(tier.life > 1 && tier.attack > 1);
  assert.equal(enemy.maxHp, enemyHp('zombie', 3, tier.life), 'life is the sheet scaled, not a new table');
  assert.equal(enemy.contactDamage, enemyContactDamage('zombie', 3, tier.attack));
  assert.equal(enemy.speed, enemySpeed('zombie', 3), 'an unnamed statistic keeps its authored value');
  assert.equal(enemy.attackInterval, enemyAttackInterval('zombie', 3));
  const untiered = createEnemy(run, 'taskmaster', 0, 0);
  assert.equal(untiered.maxHp, enemyHp('taskmaster', 3), 'a kind outside the tier reads its sheet whole');
  // Scaling happens on percentages, before the resolvers: the defense cap and
  // every unit conversion stay exactly where they were.
  assert.equal(enemyCombatStats('zombie', 3, { attackSpeed: 2 }).attackInterval,
    enemyAttackInterval('zombie', 3) / 2, 'a faster sheet means a shorter interval');
  assert.equal(enemyCombatStats('brute', 3, { defense: 8 }).defense, 0.75, 'the cap still wins');
  assert.equal(enemyCombatStats('zombie', 3, { life: 1 }).hp, enemyHp('zombie', 3), '1 is the neutral tier');
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
  assert.equal(run.player.hp, before - 30 * (1 - 0.15));

  const killRun = createRun(() => 0.5);
  killRun.enemies.push({ id: 1, kind: 'alarmZombie', boss: true, hp: 1, maxHp: 1, x: killRun.player.x, y: killRun.player.y,
    radius: 10 * 1.1, speed: 0 });
  step(killRun, 0.05, {});
  for (let i = 0; i < 40; i++) step(killRun, 0.05, {});
  assert.equal(killRun.kills, 1);
  assert.equal(killRun.coins, 30 + (killRun.rewardBalance.gold?.survival ?? 20));
  assert.equal(killRun.phase, 'shop');
  assert.equal(killRun.worldCleared, true);
});

test('the Rift minions keep the same six-stat sheet, each with its own numbers', () => {
  assert.equal(enemyHp('meleeMinion', 1), 57);
  assert.equal(enemyDefense('meleeMinion'), 0.1);
  assert.equal(enemyContactDamage('meleeMinion'), 16);
  assert.equal(enemyAttackRange('meleeMinion'), 0, 'the soldier has to touch');
  assert.equal(enemyAttackInterval('meleeMinion'), 100 / 154);
  assert.equal(enemySpeed('meleeMinion', 1), 1010 * 5 / 100 * WORLD_SCALE);
  assert.equal(ENEMY_KINDS.meleeMinion.radius, 13);
  assert.equal(enemyBounty('meleeMinion'), 1);

  assert.equal(enemyHp('mageMinion', 2), 52);
  assert.equal(enemyContactDamage('mageMinion'), 14);
  assert.ok(Math.abs(enemyAttackRange('mageMinion') - 187) < 1e-9, 'the mage keeps its distance');
  assert.equal(enemyAttackInterval('mageMinion'), 1);
  assert.equal(ENEMY_KINDS.mageMinion.projectile, 'bolt');
  assert.equal(enemyBounty('mageMinion'), 2);

  assert.equal(enemyHp('siegeMinion', 2), 103);
  assert.equal(enemyDefense('siegeMinion'), 0.2);
  assert.equal(enemyContactDamage('siegeMinion'), 23);
  assert.ok(Math.abs(enemyAttackRange('siegeMinion') - 198) < 1e-9);
  assert.equal(enemyAttackInterval('siegeMinion'), 100 / 60);
  assert.equal(ENEMY_KINDS.siegeMinion.projectile, 'shell');
  assert.equal(enemyBounty('siegeMinion'), 3);
});

test('the act 4 roster authors its own sheets, reach and roles', () => {
  assert.equal(enemyHp('barbarian', 1), 90);
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

test('the act 6 roster authors its own sheets, reach and roles', () => {
  // Rung six: +25% over act 5, so the plain body is 140 life and 37 damage.
  assert.equal(enemyHp('jagras', 1), 140);
  assert.equal(enemyHp('jagras', 6), 140, 'life is one value per sheet');
  assert.equal(enemyContactDamage('jagras'), 37);
  // The wasp is the fast flank; the beetle is the wall of its wave.
  assert.ok(enemySpeed('vespoid', 6) > enemySpeed('jagras', 6));
  assert.equal(enemyDefense('hornetaur'), 0.4);
  // The pack lizard lunges; it never throws anything.
  assert.deepEqual(ENEMY_KINDS.jagras.actions.map(action => action.key), ['swipe', 'lunge']);
  assert.equal(ENEMY_KINDS.jagras.projectile, undefined);
  // The elite is the same family at four times the life, and it is not a boss.
  assert.equal(ENEMY_KINDS.greatJagras.boss, undefined);
  assert.ok(enemyHp('greatJagras') > enemyHp('jagras') * 4);
  assert.deepEqual(ENEMY_KINDS.kestodon.actions.map(action => action.key), ['swipe', 'charge']);
  assert.deepEqual(ENEMY_KINDS.mernos.actions.map(action => action.key), ['swipe', 'dive']);
  // Two mini-bosses and the act boss carry the flag that gives them the bar.
  assert.equal(ENEMY_KINDS.kuluYaKu.boss, true);
  assert.equal(ENEMY_KINDS.pukeiPukei.boss, true);
  assert.equal(ENEMY_KINDS.rathalos.boss, true);
  assert.ok(enemyHp('rathalos') > enemyHp('pukeiPukei'), 'the boss outlasts the mini-boss');
  assert.deepEqual(ENEMY_KINDS.kuluYaKu.actions.map(action => action.key),
    ['swipe', 'raise', 'slam', 'expose']);
  assert.deepEqual(ENEMY_KINDS.rathalos.actions.map(action => action.key),
    ['swipe', 'flames', 'roar', 'dive', 'enrage', 'inferno']);
  // The fire and the venom are projectiles: the sheet's reach is still contact.
  assert.equal(enemyAttackRange('rathalos'), 0);
  assert.equal(enemyAttackRange('pukeiPukei'), 0);
});
