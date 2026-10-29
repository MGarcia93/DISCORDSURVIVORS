import test from 'node:test';
import assert from 'node:assert/strict';
import { activateSpecial, createRun, step, WORLD_SCALE } from '../src/engine.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

function actors() {
  const run = createRun(() => 0.5, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 100;
  const p = run.player;
  const weak = { id: 1, x: p.x + 100, y: p.y, hp: 50, maxHp: 50, speed: 44, radius: 10, kind: 'zombie' };
  const strong = { id: 2, x: p.x - 180, y: p.y, hp: 400, maxHp: 400, speed: 44, radius: 10, kind: 'zombie' };
  const faraway = { id: 3, x: p.x + 300, y: p.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(weak, strong, faraway);
  return { run, p, weak, strong, faraway };
}

test('Viaje Astral config lives on the sheet', () => {
  const astral = CHARACTERS.warrior.specials[0];
  assert.equal(astral.key, 'astral');
  assert.equal(astral.hotkey, 'q');
  assert.equal(astral.cooldown, 20);
  assert.equal(astral.duration, 6);
  assert.equal(astral.radius, 170 * WORLD_SCALE);
  const vanish = CHARACTERS.warrior.specials[1];
  assert.equal(vanish.key, 'vanish');
  assert.equal(vanish.hotkey, 'e');
  assert.equal(vanish.cooldown, 30);
  assert.equal(vanish.duration, 2);
  assert.equal(vanish.contactFactor, 0);
});

test('Warrior owns his own game-over line', () => {
  assert.equal(CHARACTERS.warrior.deathLine, 'WARRIOR SE DESCONECTÓ DE LA REALIDAD.');
  assert.equal(CHARACTERS.negro.deathLine, undefined, 'the others keep the generic line');
});

test('Viaje Astral deals continuous area damage, disorients normal enemies and briefly immobilizes the weak', () => {
  const { run, p, weak, strong, faraway } = actors();
  assert.equal(activateSpecial(run, 'astral'), true);
  const strongBefore = strong.x;
  const weakBefore = weak.x;
  for (let i = 0; i < 20; i++) step(run, 0.05, {}); // three 0.4s-spaced ticks

  assert.equal(strong.confusionStacks, 3, 'normal enemies inside the circle get disoriented');
  // 3 staggered ticks: the confusion reaches 3 stacks on tick 2, so hits are
  // 0-stacks, 2-stacks (no bonus) and 3-stacks (x1.5 bonus).
  assert.ok(Math.abs(weak.hp - (50 - 9 * (1 + 1 + 1.5))) < 1e-6,
    'the astral special continues to scale from Warrior base damage');
  assert.equal(weak.x, weakBefore, 'the weak one is briefly immobilized: too dazed to walk');
  assert.ok(weak.stunTtl > 0, 'the stun keeps refreshing while the circle lasts');
  assert.ok(strong.x !== strongBefore, 'strong enemies keep walking, only slowed');

  // outside the circle nothing happens; the special is on cooldown
  assert.equal(faraway.hp, 500);
  assert.equal(faraway.confusionStacks ?? 0, 0);
  assert.equal(activateSpecial(run, 'astral'), false, 'the 20s reload holds');
});

test('Strong enemies take the drop instead of the floor: bosses are only slowed', () => {
  const run = createRun(() => 0.5, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 100;
  const p = run.player;
  const boss = { id: 1, x: p.x + 150, y: p.y, hp: 2200, maxHp: 2200, speed: 88, radius: 38, kind: 'alarmZombie', boss: true };
  run.enemies.push(boss);
  activateSpecial(run, 'astral');
  step(run, 0.05, {});
  assert.equal(boss.confusionStacks, 1, 'bosses cap at one stack: slow, never stunned');
  assert.equal(boss.stunTtl ?? 0, 0, 'no immobilization for a boss');
  assert.ok(Math.abs(boss.hp - (2200 - 9)) < 1e-6, 'the circle still deals its tick damage');
});

test('Me Desaparezco is total invulnerability and reappears away from the danger', () => {
  const { run, p, weak, strong, faraway } = actors();
  assert.equal(activateSpecial(run, 'vanish'), true);
  assert.ok(run.effects.some(effect => effect.text === '¡YA VUELVO!'), 'he announces the vanish');
  // one enemy glued to him while everyone closes in
  weak.x = p.x + 20;
  p.immune = 0;
  const hpBefore = p.hp;
  for (let i = 0; i < 20; i++) step(run, 0.05, {});
  assert.equal(p.hp, hpBefore, 'contact damage never lands while vanished');
  assert.equal(activateSpecial(run, 'vanish'), false, 'the 30s reload holds');

  const { run: run2, p: p2, bruiser } = single();
  activateSpecial(run2, 'vanish');
  bruiser.x = p2.x + 20;
  bruiser.speed = 0;
  const yBefore = p2.y;
  const xBefore = p2.x;
  for (let i = 0; i < 44; i++) step(run2, 0.05, {}); // the brief vanish window ends
  assert.ok(p2.x < xBefore - 80 * WORLD_SCALE, 'he reappears on the far side from the enemy');  assert.equal(p2.y, yBefore, 'the straight-line blink keeps his lane');
  assert.ok(run2.effects.some(effect => effect.text === '¿QUÉ PASÓ?'), 'he answers himself on coming back');
  const burst = p.damage * 1.5;
  assert.ok(Math.abs(bruiser.hp - (bruiser.maxHp - burst)) < 1e-6, 'the reappearance explosion hits close enemies');
  assert.equal(bruiser.confusionStacks, 2, 'and stacks Confusion on them');
});

test('the vanish explosion leaves far enemies untouched', () => {
  const { run: run2, p: p2, faraway } = actors();
  activateSpecial(run2, 'vanish');
  for (let i = 0; i < 44; i++) step(run2, 0.05, {});
  assert.equal(faraway.hp, 500, 'out of the burst radius nothing happens');
});

test('Me Desaparezco reappears in a straight line along the held movement direction', () => {
  const { run, p, bruiser } = single();
  bruiser.x = p.x - 180; // the old safest-point scan chose right, opposite the requested movement
  activateSpecial(run, 'vanish');
  for (let i = 0; i < 38; i++) step(run, 0.05, {});
  step(run, 0.05, { x: 1, y: 0 }); // stale horizontal input must not leak into the next direction
  const before = { x: p.x, y: p.y };
  step(run, 0.05, { x: 0, y: -1 });

  assert.ok(p.y < before.y - 90 * WORLD_SCALE, 'the blink follows the held upward direction');
  assert.ok(Math.abs(p.x - before.x) < 2, 'the blink stays on one straight axis');
});

function single() {
  const run = createRun(() => 0.5, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 100;
  const p = run.player;
  // One enemy glued to Warrior's right: the safe reappearing spot is the
  // 90*WORLD_SCALE diamond point straight to the left.
  const bruiser = { id: 1, x: p.x + 20, y: p.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(bruiser);
  return { run, p, bruiser };
}
