import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE } from '../src/constants.mjs';
import {
  BASE_STATS, DEFENSE_MITIGATION_CAP, DEFENSE_MITIGATION_PER_POINT, UNIT_PX,
  resolveDefensePercent, resolveEntityStats, statAt,
} from '../src/stats.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

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
    life: 120, defense: 30, attack: 300, attackSpeed: 222.22,
    attackDistance: 260, moveSpeed: 2800,
  });
  assert.equal(negro.hp, 120);
  assert.equal(negro.maxHp, 120);
  assert.equal(negro.defense, 0.15);
  assert.equal(negro.damage, 30);
  assert.ok(Math.abs(negro.attackRange - 286) < 1e-9);
  assert.ok(Math.abs(negro.shotInterval - 0.45) < 0.001);
  assert.equal(negro.speed, 140 * WORLD_SCALE);
});

test('SOLAGO resolves its wider melee reach and heavier bite', () => {
  const solago = resolveEntityStats({
    life: 150, defense: 45, attack: 520, attackSpeed: 150,
    attackDistance: 78, moveSpeed: 3550,
  });
  assert.equal(solago.maxHp, 150);
  assert.equal(solago.defense, 0.225);
  assert.equal(solago.damage, 52);
  assert.ok(Math.abs(solago.attackRange - 78 * UNIT_PX) < 1e-9);
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

// The roster has one job each: the tank is Solago, the slowpoke is El Negro.
// His whole joke is not getting up, so he does not take hits for anyone.
test('the tank of the roster is Solago and the slowest body is El Negro', () => {
  const roster = Object.entries(CHARACTERS);
  const toughest = roster.reduce((best, entry) => (entry[1].stats.maxHp > best[1].stats.maxHp ? entry : best));
  const slowest = roster.reduce((last, entry) => (entry[1].stats.speed < last[1].stats.speed ? entry : last));
  assert.equal(toughest[0], 'solago', 'Solago carries the most health');
  assert.equal(slowest[0], 'negro', 'El Negro is the slowest character');
  assert.notEqual(toughest[0], slowest[0], 'and they are not the same character');
});
