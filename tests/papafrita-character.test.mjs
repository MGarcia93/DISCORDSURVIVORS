import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, activateSpecial, step } from '../src/engine.mjs';
import { UNIT_PX } from '../src/stats.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';
import papafrita, { collectionOf } from '../src/characters/papafrita.mjs';
import { DEFAULT_CATALOG, EFFECTS } from '../src/reward-data.mjs';
import { describeReward } from '../src/reward-catalog.mjs';
import { isCharacterUnlocked } from '../src/progression.mjs';

function solo(random = () => 0.5) {
  const run = createRun(random, 'papafrita');
  run.spawnIn = 100;
  run.shotIn = 100;
  return run;
}

function dummy(run, dx, hp = 400, dy = 0) {
  const p = run.player;
  const enemy = { id: run.enemies.length + 1, x: p.x + dx, y: p.y + dy, hp, maxHp: hp, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(enemy);
  return enemy;
}

function toolbox(run) {
  const hit = (run, enemy, damage, kind = 'damage') => {
    enemy.hp -= damage;
    run.effects.push({ x: enemy.x, y: enemy.y, text: `${Math.round(damage)}`, ttl: 0.65, kind });
  };
  return {
    hit,
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    nearest: (run, source, excluded = [], maxDistance = Infinity) => run.enemies
      .filter(enemy => enemy.hp > 0 && !excluded.includes(enemy.id)
        && Math.hypot(enemy.x - source.x, enemy.y - source.y) <= maxDistance)
      .sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y))[0],
    fireRadial: () => {},
  };
}

// The passive reads the run's own record of what was taken, so a test can hand
// it a build without walking the whole level-up menu.
function own(run, ...ids) {
  run.levelRanks = { ...run.levelRanks };
  for (const id of ids) run.levelRanks[id] = (run.levelRanks[id] ?? 0) + 1;
}

test('Papafrita runs on the percentage core and throws voice waves, not weapons', () => {
  const p = createRun(Math.random, 'papafrita').player;
  // §3: a little under the average on body, above it on reach and cadence.
  assert.equal(p.maxHp, 90);
  assert.equal(p.defense, 0.425);
  assert.equal(p.damage, 30);
  assert.equal(p.attackRange, 320 * UNIT_PX);
  assert.ok(Math.abs(p.shotInterval - 100 / 240) < 1e-9);
  assert.equal(p.speed, 165 * WORLD_SCALE);
  assert.equal(CHARACTERS.papafrita.attack.device, 'voice', 'his voice is the weapon');
  assert.equal(CHARACTERS.papafrita.attack.pierce, 2, 'a wave crosses several bodies');
  assert.equal(CHARACTERS.papafrita.attack.spin, false, 'a wave points, it does not tumble');
});

test('the wave pierces the row in front of him', () => {
  const run = solo();
  const p = run.player;
  const first = dummy(run, 120);
  const second = dummy(run, 180);
  const third = dummy(run, 240);
  run.shotIn = 0.001;
  step(run, 0.016);
  const shot = run.projectiles[0];
  assert.equal(shot.kind, 'voice');
  assert.equal(shot.pierce, 2);
  for (let frame = 0; frame < 60 && run.projectiles.length; frame++) step(run, 0.05);
  assert.ok(first.hp < 400, 'the first body takes it');
  assert.ok(second.hp < 400, 'and the wave keeps going');
  assert.ok(third.hp < 400, 'three bodies for pierce 2');
});

test('the collection counts different upgrades, never copies', () => {
  const run = solo();
  assert.equal(collectionOf(run), 0);
  own(run, 'and-what-else', 'and-what-else', 'and-what-else');
  assert.equal(collectionOf(run), 1, 'three copies of one signature are still 1/6');
  own(run, 'fishing');
  assert.equal(collectionOf(run), 2);
  own(run, 'other-console', 'not-done-yet', 'only-one', 'definitive-edition');
  assert.equal(collectionOf(run), 6);
});

test('2/6 adds a body to every wave, 4/6 sends a secondary wave and 6/6 doubles the echoes', () => {
  const two = solo();
  own(two, 'and-what-else', 'fishing');
  two.shotIn = 0.001;
  dummy(two, 120);
  step(two, 0.016);
  const blessed = two.projectiles[0];
  blessed.hit.push(99);
  papafrita.onProjectileHit(two, blessed);
  assert.equal(blessed.pierce, 3, '2/6 crosses one more');

  const four = solo();
  own(four, 'and-what-else', 'fishing', 'other-console', 'not-done-yet');
  four.player.rewardBonuses = { copyWave: 1 };
  four.player.waves = 4;
  dummy(four, 120);
  dummy(four, 220);
  papafrita.onShot(four, four.player, toolbox(four), { target: 1 });
  assert.equal(four.projectiles.filter(shot => shot.kind === 'voice').length, 1, 'every fifth attack');

  const six = solo();
  own(six, 'and-what-else', 'fishing', 'other-console', 'not-done-yet', 'only-one', 'definitive-edition');
  six.player.waves = 2;
  dummy(six, 120);
  dummy(six, 220);
  dummy(six, 320);
  papafrita.onShot(six, six.player, toolbox(six), { target: 1 });
  assert.equal(six.projectiles.filter(shot => shot.kind === 'voice').length, 2, 'two collection echoes');
});

test('«¿Y sabés qué más?» widens the same wave with every listener', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = { waveGrowth: 3 };
  const shot = { kind: 'voice', width: 10, pierce: 1, hit: [1], echo: false };
  papafrita.onProjectileHit(run, shot);
  assert.ok(shot.width > 10, 'the wave grows');
  assert.equal(shot.pierce, 2, 'and crosses one more body per rank, capped');
  for (let hit = 0; hit < 6; hit++) {
    shot.hit.push(100 + hit);
    papafrita.onProjectileHit(run, shot);
  }
  assert.ok(shot.pierce <= 1 + 3, 'the growth is capped by the rank');
});

test('«Lo compré en otra consola» copies the wave to another target', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = { copyWave: 2 };
  p.waves = 4; // next shot is the fifth
  dummy(run, 120);
  dummy(run, 220);
  papafrita.onShot(run, p, toolbox(run), { target: 1 });
  assert.equal(run.projectiles.length, 1, 'a copy went to a second enemy');
  assert.notEqual(run.projectiles[0].target, 1, 'never the body the main wave is on');
});

test('«Todavía no terminé» bursts the bubble when the monologue ends', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = { bubbleBurst: 3 };
  const ctx = toolbox(run);
  const victim = dummy(run, 30);
  activateSpecial(run, 'monologo');
  run.monologue.ttl = 0.01;
  papafrita.onTick(run, p, 0.05, ctx);
  assert.equal(run.monologue, null, 'the bubble is gone');
  assert.ok(victim.hp < 400, 'and it burst on the way out');
  assert.ok(run.effects.some(effect => effect.kind === 'voiceRing'));
});

test('«Me salió pesca» blinks out of a crowd and leaves a decoy', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = { escape: 2 };
  for (let i = 0; i < 6; i++) dummy(run, 40 + i * 10, 400, i * 8);
  const before = { x: p.x, y: p.y };
  p.fishingIn = 0;
  papafrita.onTick(run, p, 0.05, toolbox(run));
  assert.ok(Math.hypot(p.x - before.x, p.y - before.y) > 100 * WORLD_SCALE, 'he left the ring');
  assert.ok(run.decoy, 'the decoy stayed behind talking');
  assert.ok(p.fishingIn > 0, 'and the escape is on cooldown');
});

test('«El único que me banca» sends the animal at secondary targets', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = { companion: 3 };
  const first = dummy(run, 80);
  const second = dummy(run, 160);
  run.companion = { biteIn: 0 };
  papafrita.onTick(run, p, 0.05, toolbox(run));
  assert.ok(run.companion, 'the animal exists');
  assert.ok(first.hp < 400 && second.hp < 400, 'and bites two different targets');
});

test('«Edición definitiva» sends a delayed echo on the same heading', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = { echo: 3 };
  dummy(run, 200);
  p.waves = 3; // every fourth attack at rank III
  papafrita.onShot(run, p, toolbox(run));
  assert.equal(p.echoQueue.length, 1, 'an echo was queued');
  run.elapsed += 1;
  papafrita.onTick(run, p, 0.05, toolbox(run));
  assert.equal(p.echoQueue.length, 0);
  assert.ok(run.projectiles.some(shot => shot.vx !== undefined && shot.echo === true), 'the echo travels straight');
});

test('the monologue is a zone: it ticks, it pulls the ordinary walkers, never the boss', () => {
  const run = solo();
  const p = run.player;
  passivate(run, p);
  assert.equal(activateSpecial(run, 'monologo'), true);
  assert.ok(run.monologue, 'the bubble exists');
  const walker = { id: 1, x: p.x + 100, y: p.y, hp: 400, maxHp: 400, speed: 0, radius: 10, kind: 'zombie' };
  const boss = { id: 2, x: p.x + 100, y: p.y + 40, hp: 400, maxHp: 400, speed: 0, radius: 20, kind: 'boss', boss: true };
  run.enemies.push(walker, boss);
  const walkerX = walker.x, bossX = boss.x;
  for (let i = 0; i < 6; i++) papafrita.onTick(run, p, 0.1, toolbox(run));
  assert.ok(walker.x < walkerX, 'the walker drifts toward the talk');
  assert.equal(boss.x, bossX, 'the boss does not lose control');
  assert.ok(walker.hp < 400, 'and the zone burns');
});

function passivate(run, p) {
  run.phase = 'playing';
  p.characterDef = papafrita;
}

test('«AHORA SÍ COMPLETÉ LA BUILD» shoots several directions and drops an extra bubble', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = {};
  own(run, 'and-what-else', 'fishing');
  p.collected = collectionOf(run);
  for (let i = 0; i < 4; i++) dummy(run, 100 + i * 40, 400, i * 30);
  activateSpecial(run, 'build');
  assert.equal(p.build, 6);
  assert.equal(p.characterDef.passiveDamageMult(p), 1.25);
  run.buildIn = 0;
  run.buildBubbleIn = 0;
  papafrita.specials[1].onTick(run, p, 0.05, toolbox(run));
  assert.equal(run.projectiles.filter(shot => shot.kind === 'voice').length, 4, 'one wave per target');
  assert.ok(run.monologue, 'the ultimate drops an extra bubble');
});

test('the HUD reads the collection, and Act 5 is the unlock', () => {
  const run = solo();
  const p = run.player;
  own(run, 'and-what-else', 'fishing');
  p.collected = 2;
  assert.deepEqual(p.characterDef.taskHud(p), { percentage: 2 / 6 * 100, label: '2/6 tipos', active: false });
  p.collected = 6;
  assert.equal(p.characterDef.taskHud(p).label, '¡COLECCIÓN COMPLETA!');
  assert.equal(CHARACTERS.papafrita.unlock.scene, 'act-05-final');
  const store = value => ({ getItem: () => value, setItem: () => {} });
  assert.equal(isCharacterUnlocked('papafrita', store(null)), false);
  assert.equal(isCharacterUnlocked('papafrita', store(JSON.stringify({ version: 1, seenScenes: ['act-05-final'] }))), true);
  assert.equal(isCharacterUnlocked('papafrita', store(JSON.stringify({ version: 1, seenScenes: ['act-05-administrator'] }))), false,
    'the Administrator monologue is not the unlock');
});

test('the six signatures live in the level catalogue with three levels each', () => {
  const own = DEFAULT_CATALOG.upgrades.filter(entry => entry.characters === 'papafrita');
  assert.deepEqual(own.map(entry => `${entry.id}:${entry.ranks.length}`).sort(),
    ['and-what-else:3', 'definitive-edition:3', 'fishing:3', 'not-done-yet:3', 'only-one:3', 'other-console:3']);
});

test('every rank card states the cadence that rank will actually leave', () => {
  const card = (id, totals) => describeReward(
    DEFAULT_CATALOG.upgrades.find(entry => entry.id === id).ranks[totals[0] - 1], EFFECTS, totals[1]).join(' · ');
  assert.match(card('other-console', [1, { copyWave: 1 }]), /cada 6 ataques/);
  assert.match(card('other-console', [2, { copyWave: 2 }]), /cada 5 ataques/);
  assert.match(card('other-console', [3, { copyWave: 3 }]), /cada 4 ataques/);
  assert.match(card('definitive-edition', [3, { echo: 3 }]), /cada 4 ataques/);
});

test('6/6 keeps the 4/6 wave and sends the two echoes to different bodies', () => {
  const run = solo();
  const p = run.player;
  for (const id of ['and-what-else', 'fishing', 'other-console', 'not-done-yet', 'only-one', 'definitive-edition']) {
    run.levelRanks[id] = 1;
  }
  p.waves = 14; // the fifteenth attack is a multiple of 3 and of 5
  for (let i = 0; i < 4; i++) dummy(run, 100 + i * 60);
  papafrita.onShot(run, p, toolbox(run), { target: 1 });
  const targets = run.projectiles.map(shot => shot.target);
  assert.equal(targets.length, 3, 'the secondary wave still fires at 6/6, plus the two echoes');
  assert.equal(new Set(targets).size, 3, 'and every one goes to a different body');
});

test('the bubble clears itself even when the burst upgrade is not owned', () => {
  const run = solo();
  const p = run.player;
  p.rewardBonuses = {};
  run.monologue = { x: p.x, y: p.y, r: 132 * WORLD_SCALE, ttl: 0.01, tick: 0 };
  papafrita.onTick(run, p, 0.05, toolbox(run));
  assert.equal(run.monologue, null, 'no ghost bubble left on the run');
});
