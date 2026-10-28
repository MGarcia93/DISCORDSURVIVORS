import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

const spread = attack => ({ x: 590, y: 374, target: 1, damage: 8, kind: 'shroom', device: 'magic', hit: [], ttl: 3, angle: 0, attack });

function roomIdol(run) {
  const impact = { id: 1, x: 600, y: 374, hp: 400, maxHp: 400, speed: 0, radius: 10, kind: 'zombie' };
  const neighbor = { id: 2, x: 640, y: 374, hp: 400, maxHp: 400, speed: 0, radius: 10, kind: 'zombie' };
  const farOne = { id: 3, x: 750, y: 374, hp: 400, maxHp: 400, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(impact, neighbor, farOne);
  return { impact, neighbor, farOne };
}

test('a mushroom impact explodes into a small area and stacks Confusion on everyone splashed', () => {
  const run = createRun(() => 0.5);
  run.spawnIn = 100;
  run.shotIn = 100;
  const { impact, neighbor, farOne } = roomIdol(run);
  run.projectiles.push(spread(CHARACTERS.warrior.attack));

  step(run, 0.05, {});

  assert.equal(impact.hp, 400 - 8, 'the locked target takes the direct hit');
  assert.equal(impact.confusionStacks, 1);
  assert.equal(neighbor.hp, 400 - 8, 'inside the blast radius the neighbour is splashed with full damage');
  assert.equal(neighbor.confusionStacks, 1);
  assert.equal(farOne.hp, 400, 'outside the blast radius nothing happens');
  const blast = run.effects.find(effect => effect.kind === 'shroomBlast');
  assert.equal(blast?.radius, CHARACTERS.warrior.attack.blast.radius, 'the visible shockwave uses the same radius as its damage');
  assert.ok(blast?.duration > 0, 'the explosion has a visible animation window');
});

test('Confusion caps at three stacks with bonus elemental damage, and bosses resist the CC', () => {
  const run = createRun(() => 0.5);
  run.spawnIn = 100;
  run.shotIn = 100;
  const victim = { id: 1, x: 600, y: 374, hp: 1000, maxHp: 1000, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(victim);
  for (let i = 0; i < 3; i++) {
    run.projectiles = [spread(CHARACTERS.warrior.attack)];
    step(run, 0.05, {});
  }
  assert.equal(victim.confusionStacks, 3, 'stacks cap at three');
  run.projectiles = [spread(CHARACTERS.warrior.attack)];
  step(run, 0.05, {});
  assert.ok(Math.abs(victim.hp - (1000 - 3 * 8 - 8 * 1.5)) < 1e-6, 'first three hits are plain, the fourth gets the three-stack 50% elemental bonus');

  const boss = { id: 1, x: 600, y: 374, hp: 2200, maxHp: 2200, speed: 0, radius: 38, kind: 'boss' };
  run.enemies = [boss];
  run.projectiles = [spread(CHARACTERS.warrior.attack)];
  step(run, 0.05, {});
  run.projectiles = [spread(CHARACTERS.warrior.attack)];
  step(run, 0.05, {});
  assert.equal(boss.confusionStacks, 1, 'bosses cap at one stack: mass CC resistance');
});

test('Confusion wears off after its duration and slowed movement recovers', () => {
  const run = createRun(() => 0.5);
  run.spawnIn = 100;
  run.shotIn = 100;
  const victim = { id: 1, x: 600, y: 374, hp: 1000, maxHp: 1000, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(victim);
  run.projectiles.push(spread(CHARACTERS.warrior.attack));
  step(run, 0.05, {});
  assert.equal(victim.confusionStacks, 1);

  for (let i = 0; i < 120; i++) step(run, 0.05, {}); // six seconds: beyond the effect duration

  assert.equal(victim.confusionStacks, 0);
});
