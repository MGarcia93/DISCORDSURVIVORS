import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine.mjs';
import {
  createStatState, withStatSource, resolveStatState, applyStatState, previewStatSource,
} from '../src/stat-modifiers.mjs';
import { UNIT_PX } from '../src/stats.mjs';

const modifier = (stat, operation, value) => ({ stat, operation, value });
const player = () => ({
  maxHp: 100, hp: 60, damage: 10, defense: 0.1,
  shotInterval: 1, attackRange: 100 * UNIT_PX, speed: 5 * UNIT_PX,
});

test('flat points precede summed percentages regardless of source acquisition order', () => {
  const p = player();
  const initial = createStatState(p);
  const sources = [
    ['item', [modifier('attack', 'flat', 2)]],
    ['level:1', [modifier('attack', 'percent', 10)]],
    ['level:2', [modifier('attack', 'percent', 10)]],
  ];
  const build = entries => entries.reduce((state, [id, effects]) => withStatSource(state, id, effects), initial);
  assert.equal(resolveStatState(build(sources)).damage, 14.4);
  assert.deepEqual(resolveStatState(build(sources)), resolveStatState(build(sources.toReversed())));
  assert.deepEqual(initial.sources, {});
  assert.equal(p.damage, 10);
});

test('all six modifiers use stat units rather than engine mitigation, pixels or intervals', () => {
  const state = withStatSource(createStatState(player()), 'item', [
    modifier('life', 'flat', 20), modifier('defense', 'flat', 1),
    modifier('attack', 'percent', 10), modifier('attackSpeed', 'percent', 25),
    modifier('attackDistance', 'flat', 10), modifier('moveSpeed', 'percent', 20),
  ]);
  const result = resolveStatState(state);
  assert.equal(result.maxHp, 120);
  assert.ok(Math.abs(result.defense - 0.15) < 1e-12);
  assert.equal(result.damage, 11);
  assert.equal(result.shotInterval, 0.8);
  assert.equal(result.attackRange, 110 * UNIT_PX);
  assert.equal(result.speed, 6 * UNIT_PX);
});

test('maximum-life gains heal only the effective increase once; previews never heal', () => {
  const p = player();
  const initial = createStatState(p);
  const effects = [modifier('life', 'flat', 20)];
  const preview = previewStatSource(initial, 'health', effects);
  assert.equal(preview.before.maxHp, 100);
  assert.equal(preview.after.maxHp, 120);
  assert.equal(p.hp, 60);
  assert.deepEqual(initial.sources, {});
  const state = withStatSource(initial, 'health', effects);
  applyStatState(p, state);
  assert.equal(p.hp, 80);
  assert.equal(p.maxHp, 120);
  p.hp -= 10;
  applyStatState(p, state);
  assert.equal(p.hp, 70);
});

test('maximum-life reductions clamp only excess current HP', () => {
  for (const [hp, expected] of [[60, 60], [90, 80]]) {
    const p = { ...player(), hp };
    applyStatState(p, withStatSource(createStatState(p), 'penalty', [modifier('life', 'flat', -20)]));
    assert.equal(p.maxHp, 80);
    assert.equal(p.hp, expected);
  }
});

test('replacing or removing a source recalculates without losing other sources', () => {
  const initial = createStatState(player());
  const item = withStatSource(initial, 'item', [modifier('attack', 'flat', 2)]);
  const level = withStatSource(item, 'level', [modifier('attack', 'percent', 10)]);
  const replaced = withStatSource(level, 'item', [modifier('attack', 'flat', 4)]);
  assert.ok(Math.abs(resolveStatState(replaced).damage - 15.4) < 1e-12);
  assert.equal(resolveStatState(withStatSource(replaced, 'item', null)).damage, 11);
  assert.equal(resolveStatState(item).damage, 12);
});

test('input data and separate runs cannot mutate captured stat sources', () => {
  const first = createRun(() => 0.5, 'negro').player;
  const second = createRun(() => 0.5, 'negro').player;
  const effects = [modifier('attack', 'flat', 2)];
  const state = withStatSource(createStatState(first), 'item', effects);
  effects[0].value = 999;
  applyStatState(first, state);
  assert.equal(first.damage, second.damage + 2);
  assert.equal(second.damage, second.characterDef.stats.damage);
});

test('invalid modifiers fail with source and field evidence without changing state', () => {
  const state = createStatState(player());
  const snapshot = JSON.stringify(state);
  for (const effect of [
    modifier('luck', 'flat', 1), modifier('attack', 'multiply', 2),
    modifier('attack', 'flat', NaN), modifier('life', 'flat', -100),
    modifier('attackSpeed', 'percent', -100),
  ]) {
    assert.throws(() => withStatSource(state, 'bad-item', [effect]), /bad-item/);
    assert.equal(JSON.stringify(state), snapshot);
  }
});

test('existing defense mitigation cap is reflected by the same resolved preview and application', () => {
  const p = player();
  const state = createStatState(p);
  const effects = [modifier('defense', 'flat', 100)];
  const preview = previewStatSource(state, 'armor', effects);
  assert.equal(preview.after.defense, 0.75);
  applyStatState(p, withStatSource(state, 'armor', effects));
  assert.equal(p.defense, preview.after.defense);
});

test('capturing existing character stats preserves every effective base stat', () => {
  for (const character of ['negro', 'solago', 'warrior', 'papazito']) {
    const p = createRun(() => 0.5, character).player;
    const resolved = resolveStatState(createStatState(p));
    for (const key of ['maxHp', 'damage', 'defense', 'shotInterval', 'attackRange', 'speed']) {
      assert.ok(Math.abs(p[key] - resolved[key]) < 1e-9, `${character}.${key}`);
    }
  }
});
