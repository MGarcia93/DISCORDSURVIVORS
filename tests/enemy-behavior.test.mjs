import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, createRun, step, WIDTH, HEIGHT, WORLD_SCALE } from '../src/engine.mjs';

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

test('there is no global grace: each enemy lands its own swing', () => {
  const run = quietRun();
  place(run, { attackRange: 0, attackInterval: 0 });
  step(run, 0.05, {});
  const afterFirst = run.player.hp;
  assert.ok(afterFirst < 1000, 'the first swing lands');
  step(run, 0.05, {});
  assert.ok(run.player.hp < afterFirst, 'and the next one lands too: a crowd is a crowd');
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

test('the alarm boss calls its horde in from the edge, not from its own body', () => {
  const run = quietRun();
  run.elapsed = 300;
  // The summon band, and the first edge for every walker it calls.
  run.random = () => 0;
  const boss = createEnemy(run, 'alarmZombie', run.player.x, run.player.y - 200);
  run.enemies.push(boss);
  step(run, 0.05, {});
  const horde = run.enemies.filter(enemy => enemy.kind === 'zombie');
  assert.equal(horde.length, 9, 'the horde never fields more than nine walkers');
  for (const walker of horde) {
    const outside = walker.x < 0 || walker.x > WIDTH || walker.y < 0 || walker.y > HEIGHT;
    assert.ok(outside, 'every walker enters from outside the arena, like any wave spawn');
  }
});

test('the horde respects the arena population cap', () => {
  const run = quietRun();
  run.elapsed = 300;
  run.random = () => 0;
  const boss = createEnemy(run, 'alarmZombie', run.player.x, run.player.y - 200);
  run.enemies.push(boss);
  while (run.enemies.length < 118) place(run, { x: -500, y: -500, hp: 1 });
  step(run, 0.05, {});
  assert.ok(run.enemies.length <= 120, 'the boss cannot flood past the cap the wave spawner keeps');
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

test("Lilith's blood nova bursts out of her as a ring", async () => {
  const { default: lilith } = await import('../src/enemies/lilith.mjs');
  const nova = lilith.actions.find(action => action.key === 'nova');
  const cast = [];
  nova.run({ effects: [] }, { x: 10, y: 20 }, { shockwave: options => cast.push(options) });
  assert.equal(cast.length, 1);
  assert.equal(cast[0].damage, 26);
  assert.ok(cast[0].maxRadius > 300, 'it reaches past the claws');
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

test('the slaver throws a net that pins the player where they stand', () => {
  const run = quietRun();
  const slaver = createEnemy(run, 'slaver', run.player.x + 260, run.player.y);
  run.enemies.push(slaver);
  run.random = () => 0.9; // the net side of the roll
  step(run, 0.05, {});
  assert.ok(run.prison, 'the net drops over the player');
  assert.equal(Number(run.prison.radius.toFixed(2)), 70, 'and holds them in a small ring');
  assert.equal(slaver.actionCds.net, 7, 'the throw pays its cooldown');
});

test('the archer looses an arrow that travels before it hurts', () => {
  const run = quietRun();
  run.enemies.push(createEnemy(run, 'archer', run.player.x + 150, run.player.y));
  step(run, 0.02, {});
  const shot = run.projectiles.find(entry => entry.team === 'enemy');
  assert.ok(shot, 'it reaches the player without touching');
  assert.equal(shot.device, 'arrow', 'and carries its own arrow art');
  assert.equal(run.player.hp, 1000, 'the damage is still in the air');
});

test('the alchemist throws a lotus flask and bursts spores up close', () => {
  const throwing = quietRun();
  const thrower = createEnemy(throwing, 'alchemist', throwing.player.x + 150, throwing.player.y);
  throwing.enemies.push(thrower);
  throwing.random = () => 0.1; // the throw band
  step(throwing, 0.02, {});
  const shot = throwing.projectiles.find(entry => entry.team === 'enemy');
  assert.ok(shot, 'the flask leaves the hand');
  assert.equal(shot.device, 'flask');

  const bursting = quietRun();
  const burster = createEnemy(bursting, 'alchemist', bursting.player.x + 150, bursting.player.y);
  bursting.enemies.push(burster);
  bursting.random = () => 0.9; // the spore band
  step(bursting, 0.05, {});
  assert.equal(bursting.shockwaves.length, 1, 'the pod bursts in a ring');
  assert.equal(burster.actionCds.spores, 8);
});

test('the lotus alchemist fills the room with visions of his own alchemists', () => {
  const run = quietRun();
  const boss = createEnemy(run, 'lotusAlchemist', run.player.x + 300, run.player.y);
  run.enemies.push(boss);
  run.random = () => 0.6; // swipe, lotus, visions
  step(run, 0.05, {});
  assert.equal(run.enemies.filter(enemy => enemy.kind === 'alchemist').length, 2, 'two copies walk out');
  assert.equal(boss.actionCds.visions, 11);
});

test('the taskmaster calls one archer and one slaver from his camp', () => {
  const run = quietRun();
  const boss = createEnemy(run, 'taskmaster', run.player.x + 300, run.player.y);
  run.enemies.push(boss);
  run.random = () => 0.65; // swipe, chains, whip, guards
  step(run, 0.05, {});
  assert.ok(run.enemies.some(enemy => enemy.kind === 'archer'), 'an archer answers');
  assert.ok(run.enemies.some(enemy => enemy.kind === 'slaver'), 'and a slaver with the net');
});

test('the taskmaster trades armour for speed once, when he is losing', () => {
  const run = quietRun();
  const boss = createEnemy(run, 'taskmaster', run.player.x + 300, run.player.y);
  boss.hp = boss.maxHp * 0.4;
  run.enemies.push(boss);
  const speed = boss.speed, defense = boss.defense;
  run.random = () => 0.99; // the rage slot
  step(run, 0.05, {});
  assert.equal(boss.enraged, true);
  assert.ok(boss.speed > speed, 'he gets faster');
  assert.ok(boss.defense < defense, 'and pays for it with armour');
  assert.equal(boss.actionCds.rage, 999, 'never again');
});

test('the kestodon charges to reach, it never throws anything', () => {
  const run = quietRun();
  const lizard = createEnemy(run, 'kestodon', run.player.x + 400, run.player.y);
  run.enemies.push(lizard);
  run.random = () => 0.9; // the charge quarter of the roll
  step(run, 0.05, {});
  assert.equal(lizard.chargeBoost, 2.6, 'it accelerates');
  assert.ok(lizard.chargeTtl > 0, 'for a short burst');
  assert.equal(run.projectiles.length, 0, 'and nothing leaves its body');
});

test('the jagras lunges: a burst of speed, not a wave', () => {
  const run = quietRun();
  const lizard = createEnemy(run, 'jagras', run.player.x + 400, run.player.y);
  run.enemies.push(lizard);
  run.random = () => 0.9; // the lunge quarter of the roll
  step(run, 0.05, {});
  assert.equal(lizard.chargeBoost, 2.4);
  assert.ok(lizard.chargeTtl > 0);
  assert.equal(run.shockwaves.length, 0, 'no ring of damage');
  assert.equal(run.projectiles.length, 0, 'no shot either');
});

test('the great jagras swallows once and then rolls into the group', () => {
  const run = quietRun();
  const great = createEnemy(run, 'greatJagras', run.player.x + 400, run.player.y);
  run.enemies.push(great);
  run.random = () => 0.9;
  step(run, 0.05, {});
  assert.equal(great.fed, true, 'it eats first');
  great.attackCd = 0;
  step(run, 0.05, {});
  assert.ok(great.chargeTtl > 0, 'and then it rolls at the player');
  assert.equal(run.shockwaves.length, 0, 'the roll is the body, never a wave');
});

test('the kulu-ya-ku raises the rock, and the rock is its defence', () => {
  const run = quietRun();
  const bird = createEnemy(run, 'kuluYaKu', run.player.x + 300, run.player.y);
  run.enemies.push(bird);
  run.random = () => 0.9;
  step(run, 0.05, {});
  assert.equal(bird.raised, true);
  assert.equal(bird.defense, 0.75, 'frontal damage almost does not land');
  // Three quarters down, the rock breaks and it never gets it back.
  bird.hp = bird.maxHp * 0.7;
  bird.attackCd = 0;
  step(run, 0.05, {});
  assert.equal(bird.raised, false);
  assert.equal(bird.exposed, true);
  assert.ok(bird.defense < 0.75);
  bird.attackCd = 0;
  step(run, 0.05, {});
  assert.notEqual(bird.raised, true, 'the rock is gone for good');
});

test('the pukei-pukei spits venom across the clearing', () => {
  const run = quietRun();
  const bird = createEnemy(run, 'pukeiPukei', run.player.x + 400, run.player.y);
  run.enemies.push(bird);
  run.random = () => 0.9; // the venom slot
  step(run, 0.05, {});
  assert.equal(run.projectiles.length, 1);
  assert.equal(run.projectiles[0].device, 'venom');
  assert.equal(run.projectiles[0].team, 'enemy');
});

test('the rathalos spits fire at distance and it travels', () => {
  const run = quietRun();
  const wyvern = createEnemy(run, 'rathalos', run.player.x + 500, run.player.y);
  run.enemies.push(wyvern);
  run.random = () => 0.5; // the fire slot
  step(run, 0.05, {});
  const fireball = run.projectiles.find(shot => shot.device === 'fireball');
  assert.ok(fireball, 'a fireball leaves the mouth');
  const before = run.player.hp;
  for (let i = 0; i < 300; i++) step(run, 1 / 60, {});
  assert.ok(run.player.hp < before, 'and the player has to move or eat it');
});

test('the rathalos gains its phases as it loses life', () => {
  const run = quietRun();
  const wyvern = createEnemy(run, 'rathalos', run.player.x + 300, run.player.y);
  run.enemies.push(wyvern);
  const speed = wyvern.speed;
  wyvern.hp = wyvern.maxHp * 0.6;
  run.random = () => 0.99; // the enrage slot
  step(run, 0.05, {});
  assert.equal(wyvern.enraged, true);
  assert.ok(wyvern.speed > speed, 'it gets faster');
  wyvern.hp = wyvern.maxHp * 0.3;
  wyvern.attackCd = 0;
  step(run, 0.05, {});
  assert.equal(wyvern.inferno, true, 'and the last phase burns once');
});

test('the fireman telegraphs a straight charge and stands exposed after it', () => {
  const run = quietRun();
  const fireman = createEnemy(run, 'firemanZombie', run.player.x + 400, run.player.y);
  run.enemies.push(fireman);
  run.random = () => 0.9; // swipe first, then the charge quarter of the roll
  step(run, 0.05, {});
  assert.equal(fireman.chargeBoost, 2.4, 'it accelerates');
  assert.ok(fireman.chargeTtl > 0, 'for a short burst');
  assert.equal(fireman.exposed, true, 'and the rush leaves it open');
  // The burst is over: the opening the script asks for.
  fireman.chargeTtl = 0;
  fireman.attackCd = 0;
  step(run, 0.05, {});
  assert.equal(fireman.exposed, false);
  assert.ok(fireman.stunTtl > 0, 'it stands still');
  assert.ok(fireman.attackCd >= 1.3, 'and its next swing is late');
  assert.equal(run.projectiles.length, 0, 'it never throws anything');
});

test('the fireman does not charge from contact', () => {
  const run = quietRun();
  const fireman = createEnemy(run, 'firemanZombie', run.player.x + 60, run.player.y);
  run.enemies.push(fireman);
  run.random = () => 0.9;
  step(run, 0.05, {});
  assert.equal(fireman.chargeBoost, undefined, 'a charge from contact would be unreadable');
});

test('the truck never walks and never hurts: it only calls', () => {
  const run = quietRun();
  const truck = createEnemy(run, 'truckHorde', run.player.x + 300, run.player.y);
  run.enemies.push(truck);
  step(run, 0.05, {});
  assert.ok(run.effects.some(effect => effect.text === 'BOCINA'), 'the horn calls the horde');
  const startX = truck.x;
  const hp = run.player.hp;
  for (let i = 0; i < 20; i++) step(run, 0.05, {});
  assert.equal(truck.x, startX, 'it does not chase');
  assert.equal(run.player.hp, hp, 'it does not hit');
});
