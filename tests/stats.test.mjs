import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE } from '../src/constants.mjs';
import {
  BASE_STATS, DEFENSE_MITIGATION_CAP, DEFENSE_MITIGATION_PER_POINT, UNIT_PX,
  resolveDefensePercent, resolveEntityStats, statAt,
} from '../src/stats.mjs';

test('the base stats table matches the neutral reference entity of the stat md', () => {
  assert.deepEqual(BASE_STATS, {
    life: 100, defense: 10, attack: 10,
    attackSpeed: 1, attackDistance: 100, moveSpeed: 5,
  });
  assert.equal(UNIT_PX, WORLD_SCALE);
  assert.equal(DEFENSE_MITIGATION_CAP, 0.75);
});

test('a neutral entity at 100% in every stat resolves to the base table values', () => {
  const neutral = resolveEntityStats({
    life: 100, defense: 100, attack: 100, attackSpeed: 100,
    attackDistance: 100, moveSpeed: 100,
  });
  assert.equal(neutral.maxHp, BASE_STATS.life);
  assert.equal(neutral.defense, BASE_STATS.defense * DEFENSE_MITIGATION_PER_POINT);
  assert.equal(neutral.damage, BASE_STATS.attack);
  assert.equal(neutral.shotInterval, 1);
  assert.ok(Math.abs(neutral.attackRange - BASE_STATS.attackDistance * UNIT_PX) < 1e-9);
  assert.ok(Math.abs(neutral.speed - BASE_STATS.moveSpeed * UNIT_PX) < 1e-9);
});

test('percentage sheets resolve the six stats into the absolute engine values EL NEGRO uses', () => {
  const negro = resolveEntityStats({
    life: 150, defense: 40, attack: 300, attackSpeed: 222.22,
    attackDistance: Infinity, moveSpeed: 3300,
  });
  assert.equal(negro.hp, 150);
  assert.equal(negro.maxHp, 150);
  assert.equal(negro.defense, 0.2);
  assert.equal(negro.damage, 30);
  assert.equal(negro.attackRange, Infinity);
  assert.ok(Math.abs(negro.shotInterval - 0.45) < 0.001);
  assert.equal(negro.speed, 165 * WORLD_SCALE);
});

test('SOLAGO resolves its melee 68.4% reach at the same engine distance as before', () => {
  const solago = resolveEntityStats({
    life: 100, defense: 30, attack: 405, attackSpeed: 178.57,
    attackDistance: 68.4, moveSpeed: 3300,
  });
  assert.equal(solago.maxHp, 100);
  assert.equal(solago.defense, 0.15);
  assert.equal(solago.damage, 40.5);
  assert.ok(Math.abs(solago.attackRange - 75.24) < 1e-9);
});

test('defense resolves into 5% mitigation per point and caps at 75%', () => {
  assert.equal(resolveDefensePercent(30), 0.15);
  assert.equal(resolveDefensePercent(40), 0.2);
  assert.equal(resolveDefensePercent(120), 0.6);
  assert.equal(resolveDefensePercent(300), DEFENSE_MITIGATION_CAP);
});

test('wave-dependent stat sheets resolve at their wave via statAt', () => {
  assert.deepEqual(statAt({ life: 2200 }, 'life', 9), 2200);
  assert.equal(statAt({ life: wave => 40 + 6 * wave }, 'life', 1), 46);
  assert.equal(statAt({ moveSpeed: wave => 800 + 80 * wave }, 'moveSpeed', 5), 1200);
});
