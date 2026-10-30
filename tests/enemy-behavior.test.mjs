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
  const boss = createEnemy(run, 'alarmZombie', run.player.x + 30, run.player.y);
  run.enemies.push(boss);
  run.random = () => 0.6; // lands on the summon band (swipe 3, summon 1, wave 2)
  step(run, 0.05, {});
  assert.equal(run.enemies.length, 3, 'the boss plus the two it dragged in');
  assert.ok(run.enemies.some(enemy => enemy.kind === 'zombie'), 'summoned zombies, not decorations');
  assert.equal(boss.actionCds.summon, 9, 'and the summon pays its cooldown');
});

test('the alarm boss uses its abilities while it is still walking toward the player', () => {
  const run = quietRun();
  run.random = () => 0.8; // the wave band
  const boss = createEnemy(run, 'alarmZombie', run.player.x + 250, run.player.y);
  run.enemies.push(boss);
  assert.ok(!((boss.attackRange ?? 0) + boss.radius + run.player.hitRadius > 250), 'the player is out of contact');
  step(run, 0.05, {});
  assert.equal(run.shockwaves.length, 1, 'the ring leaves the alarm from a distance');
  assert.equal(boss.actionCds.wave, 6, 'and pays its cooldown');

  const summoning = quietRun();
  summoning.random = () => 0.1; // the summon band
  summoning.enemies.push(createEnemy(summoning, 'alarmZombie', summoning.player.x + 400, summoning.player.y));
  step(summoning, 0.05, {});
  assert.ok(summoning.enemies.length > 1, 'and it drags a horde in from a distance too');
});

test('a plain zombie only swings when it touches', () => {
  const run = quietRun();
  const far = createEnemy(run, 'zombie', run.player.x + 250, run.player.y);
  run.enemies.push(far);
  const hp = run.player.hp;
  for (let i = 0; i < 20; i++) step(run, 0.05, {});
  assert.equal(run.player.hp, hp, 'no damage at range');
});

test('the alarm boss rings a sound wave that has to be walked out of', () => {
  const run = quietRun();
  const boss = createEnemy(run, 'alarmZombie', run.player.x + 30, run.player.y);
  run.enemies.push(boss);
  run.random = () => 0.8; // lands on the wave band
  step(run, 0.05, {});
  assert.equal(run.shockwaves.length, 1, 'a ring left the alarm');
  const hpBefore = run.player.hp;
  for (let tick = 0; tick < 60; tick++) step(run, 0.05, {});
  assert.ok(run.player.hp < hpBefore, 'standing in the ring costs health');
  assert.equal(run.shockwaves.length, 0, 'and the ring dies once it is spent');
});

test('a ranged kind fires a straight shot instead of landing an instant hit', () => {
  const run = quietRun();
  run.enemies.push(createEnemy(run, 'mageMinion', run.player.x + 150, run.player.y));
  step(run, 0.02, {});
  const shot = run.projectiles.find(entry => entry.team === 'enemy');
  assert.ok(shot, 'it reaches the player without touching');
  assert.equal(run.player.hp, 1000, 'the damage is still in the air');
  assert.equal(shot.device, 'bolt', 'and carries the art of its own shooter');
  assert.ok(shot.vx < 0, 'flying toward the player');
});

test('the enemy shot lands on the player after its travel time', () => {
  const run = quietRun();
  run.enemies.push(createEnemy(run, 'mageMinion', run.player.x + 150, run.player.y));
  for (let tick = 0; tick < 60; tick++) step(run, 0.02, {});
  assert.ok(run.player.hp < 1000, 'the bolt arrives and hits');
});

test('a shot that is stepped out of never lands', () => {
  const run = quietRun();
  const mage = createEnemy(run, 'mageMinion', run.player.x + 150, run.player.y);
  run.enemies.push(mage);
  step(run, 0.02, {});
  mage.attackCd = 999; // one shot only: this is about that shot, not the next one
  run.player.y -= 260; // out of the line it was fired along
  for (let tick = 0; tick < 60; tick++) step(run, 0.02, {});
  assert.equal(run.player.hp, 1000, 'it flies where the player was, not where they went');
});

test('enemy fire crosses other enemies without hurting them', () => {
  const run = quietRun();
  // The player's own weapon would also hurt the blocker; this is about the bolt.
  run.shotIn = Infinity;
  run.enemies.push(createEnemy(run, 'mageMinion', run.player.x + 200, run.player.y));
  const blocker = createEnemy(run, 'zombie', run.player.x + 90, run.player.y);
  blocker.speed = 0;
  run.enemies.push(blocker);
  const blockerHp = blocker.hp;
  for (let tick = 0; tick < 60; tick++) step(run, 0.02, {});
  assert.equal(blocker.hp, blockerHp, 'the bolt belongs to the other team');
  assert.ok(run.player.hp < 1000, 'and still reaches the player');
});

test('a contact kind still lands its hit on the same step', () => {
  const run = quietRun();
  run.enemies.push(createEnemy(run, 'meleeMinion', run.player.x + 10, run.player.y));
  step(run, 0.02, {});
  assert.equal(run.projectiles.length, 0, 'no shot for a body that has to touch');
  assert.ok(run.player.hp < 1000);
});

// Act 3 — Diablo. The dungeon's bosses are both slower than the player, so the
// things that reach them at range are the ones worth pinning down.
test('a melee action may carry its own damage instead of the contact swing', () => {
  const run = quietRun();
  const enemy = place(run, { x: run.player.x + 10, attackInterval: 2,
    actions: [{ key: 'claw', chance: 1, kind: 'melee', damage: 40 }] });
  step(run, 0.05, {});
  // The player's own defence still applies; what changed is the number the
  // ficha carried, not the mitigation in front of it.
  const mitigation = Math.min(0.75, run.player.defense);
  assert.equal(run.player.hp, 1000 - 40 * (1 - mitigation), 'the ficha owns the number, not the sheet');
  assert.ok(1000 - run.player.hp > 12 * (1 - mitigation), 'a cleave is not a contact swing');
  assert.equal(enemy.attackCd, 2, 'and it still waits its own interval');
});

test("Lilith's tether drags the player toward her", () => {
  const run = quietRun();
  run.random = () => 0; // the first ready action wins: at range that is the tether
  const lilith = place(run, { kind: 'lilith', x: run.player.x + 320, attackRange: 0,
    actions: [{ key: 'tether', chance: 1, cooldown: 9, range: 640,
      run: (r, enemy, ctx) => ctx.pull({ x: enemy.x, y: enemy.y, fromX: enemy.x, fromY: enemy.y, ttl: 0.7 }) }] });
  const before = Math.abs(lilith.x - run.player.x);
  step(run, 0.05, {});
  assert.ok(Math.abs(lilith.x - run.player.x) < before, 'the player was pulled in');
  assert.equal(run.pull.ttl > 0, true, 'the chain lasts a moment, not a frame');
});

test('the hook releases the player instead of holding them for good', () => {
  const run = quietRun();
  run.random = () => 0;
  const lilith = place(run, { kind: 'lilith', x: run.player.x + 320, attackRange: 0,
    actions: [{ key: 'tether', chance: 1, cooldown: 9, range: 640,
      run: (r, enemy, ctx) => ctx.pull({ x: enemy.x, y: enemy.y, fromX: enemy.x, fromY: enemy.y, ttl: 0.3 }) }] });
  for (let tick = 0; tick < 30; tick++) step(run, 0.05, {});
  assert.equal(run.pull, null, 'the pull expires on its own');
  assert.ok(run.player.hp > 0, 'and never drags the player into the floor');
});

test('a charge is a temporary burst, not a permanent speed change', () => {
  const run = quietRun();
  const enemy = place(run, { x: run.player.x + 600, speed: 10, chargeBoost: 4, chargeTtl: 0.1 });
  const start = enemy.x;
  step(run, 0.05, {});
  const charged = start - enemy.x;
  enemy.chargeTtl = 0;
  const middle = enemy.x;
  step(run, 0.05, {});
  const normal = middle - enemy.x;
  assert.ok(charged > normal * 3, 'the burst really moves');
  assert.equal(enemy.chargeTtl, 0, 'and the engine expires it');
});

test('Lilith summons one echo at a time', async () => {
  const { default: lilith } = await import('../src/enemies/lilith.mjs');
  const echo = lilith.actions.find(action => action.key === 'echo');
  const empty = { enemies: [] };
  assert.equal(echo.when(empty), true);
  assert.equal(echo.when({ enemies: [{ kind: 'lilithEcho', hp: 10 }] }), false);
});

test("Lilith's second phase fires once, when she is half beaten", async () => {
  const { default: lilith } = await import('../src/enemies/lilith.mjs');
  const enrage = lilith.actions.find(action => action.key === 'enrage');
  const enemy = { hp: 2000, maxHp: 2200, speed: 100, attackInterval: 1, enraged: false };
  const run = { effects: [] };
  assert.equal(enrage.when(run, enemy), false, 'not while she is healthy');
  enemy.hp = 1000;
  assert.equal(enrage.when(run, enemy), true);
  enrage.run(run, enemy);
  assert.equal(enemy.speed, 125);
  assert.equal(enemy.attackInterval, 0.65);
  assert.equal(enrage.when(run, enemy), false, 'the phase never repeats');
});

test('Lord Zir calls bats, never skeletons', async () => {
  const { default: zir } = await import('../src/enemies/lord-zir.mjs');
  const rise = zir.actions.find(action => action.key === 'rise');
  const spawned = [];
  rise.run({ effects: [] }, { x: 0, y: 0 }, {
    spawnEnemy: (kind, x, y) => { spawned.push(kind); return { kind, x, y }; },
  });
  assert.deepEqual(spawned, ['batSwarm', 'batSwarm', 'batSwarm', 'batSwarm']);
});
