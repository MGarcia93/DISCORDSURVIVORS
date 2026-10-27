import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, WORLD_SCALE } from '../src/engine.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

// Deterministic chase arena. The engine RNG decides only the smoke miss roll,
// so a constant rng pins every roll to one outcome.
function chase(rng) {
  const run = createRun(rng, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 100;
  const p = run.player;
  // Slow walker: 60 frames of chase must not reach the player nor his own
  // small periodic cloud, so the slow comparison stays isolated.
  const enemy = { id: 1, x: p.x + 300, y: p.y, hp: 500, maxHp: 500, speed: 40 * WORLD_SCALE, radius: 10, kind: 'zombie' };
  run.enemies.push(enemy);
  return { run, p, enemy };
}

function smokeZone(run, radius = 600) {
  const p = run.player;
  run.effects.push({ x: p.x, y: p.y, kind: 'smoke', r: radius, ttl: 5 });
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

test('the smoke passive lives on the sheet with its periodic cloud config', () => {
  const smoke = CHARACTERS.warrior.passives[0];
  assert.equal(smoke.kind, 'smoke');
  assert.equal(smoke.interval, 6);
  assert.equal(smoke.r, 90 * WORLD_SCALE);
  assert.equal(smoke.ttl, 5.4);
  assert.equal(smoke.slow, 0.35);
  assert.equal(smoke.stackSlow, 0.1);
  assert.equal(smoke.stackCap, 3);
  assert.equal(smoke.missChance, 0.2);
});

test('the passive periodically drops a smoke cloud at the player', () => {
  const run = createRun(() => 0.5, 'warrior');
  run.spawnIn = 100;
  run.shotIn = 100;
  const p = run.player;
  step(run, 0.05, {});
  const zone = run.effects.find(effect => effect.kind === 'smoke');
  assert.ok(zone, 'the first cloud drops on the opening tick');
  assert.ok(distance(zone, p) <= 3, 'the cloud drops at the player position (y drifts 1px per frame)');
  assert.equal(zone.r, 90 * WORLD_SCALE);

  // and it cycles again once the interval washes out (dt is capped at 0.05s)
  run.effects = [];
  step(run, 0.05, {});
  assert.equal(run.effects.find(effect => effect.kind === 'smoke'), undefined, 'cooldown holds');
  for (let i = 0; i < 122; i++) step(run, 0.05, {});
  assert.ok(run.effects.find(effect => effect.kind === 'smoke'), 'the cloud cycles every interval');
});

test('smoke slows enemies inside the cloud and staying stacks the slow, capped', () => {
  const plain = chase(() => 0.5);
  const smoked = chase(() => 0.5);
  smokeZone(smoked.run);

  // one frame: smokeIn is still ~0.05, so the slow is barely stacked
  const plainBefore = distance(plain.p, plain.enemy);
  const smokedBefore = distance(smoked.p, smoked.enemy);
  step(plain.run, 0.05, {});
  step(smoked.run, 0.05, {});
  const plainFresh = plainBefore - distance(plain.p, plain.enemy);
  const smokedFresh = smokedBefore - distance(smoked.p, smoked.enemy);
  assert.ok(smokedFresh < plainFresh * 0.7, 'a fresh cloud already slows movement');
  assert.ok(smokedFresh > plainFresh * 0.6, 'but not deeper than the unstacked slow');

  // stand in the smoke: the slow stacks toward its cap
  for (let i = 0; i < 60; i++) { step(plain.run, 0.05, {}); step(smoked.run, 0.05, {}); }
  const beforePlain = distance(plain.p, plain.enemy);
  const beforeSmoked = distance(smoked.p, smoked.enemy);
  step(plain.run, 0.05, {});
  step(smoked.run, 0.05, {});
  const plainMoved = beforePlain - distance(plain.p, plain.enemy);
  const smokedMoved = beforeSmoked - distance(smoked.p, smoked.enemy);
  assert.ok(smokedMoved < plainMoved * 0.42, 'saturated stacks reach the 0.65 combined slow');
  assert.ok(smokedMoved > plainMoved * 0.28, 'the cap keeps the slow at 0.65');
});

test('enemies inside the smoke miss 20% of their attacks', () => {
  const misses = chase(() => 0.1);
  smokeZone(misses.run, 400);
  misses.enemy.x = misses.p.x + 20;
  misses.enemy.speed = 0;
  misses.p.immune = 0;
  const hpBefore = misses.p.hp;
  step(misses.run, 1, {});
  assert.equal(misses.p.hp, hpBefore, 'missing rolls never land');

  const hits = chase(() => 0.9);
  smokeZone(hits.run, 400);
  hits.enemy.x = hits.p.x + 20;
  hits.enemy.speed = 0;
  hits.p.immune = 0;
  step(hits.run, 1, {});
  assert.ok(hits.p.hp < hits.p.maxHp, 'attacks land once the roll says hit');
});
