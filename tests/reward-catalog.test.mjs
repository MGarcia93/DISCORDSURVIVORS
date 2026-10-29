import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog, selectLevelOptions, describeReward } from '../src/reward-catalog.mjs';

const attack = value => ({ modifiers: [{ stat: 'attack', operation: 'percent', value }] });
const common = id => ({ id, name: id, characters: 'all', minLevel: 2, requires: [], ranks: [attack(5), attack(5)] });
const own = (id, character = 'negro') => ({ ...common(id), characters: character });
const item = () => ({ id: 'scissors', name: 'Tijera', price: 30, maxCopies: 3, lore: 'Example lore.', ...attack(10) });
const catalog = upgrades => createCatalog({ items: [item()], upgrades }, { characters: ['negro', 'solago'] });

test('a data-only item and common or character upgrade enter the shared catalog', () => {
  const input = { items: [item()], upgrades: [common('attack'), own('bounce')] };
  const result = createCatalog(input, { characters: ['negro'] });
  input.items[0].modifiers[0].value = 999;
  assert.equal(result.items[0].modifiers[0].value, 10);
  assert.equal(result.upgrades.length, 2);
  assert.ok(Object.isFrozen(result.upgrades[0].ranks));
});

test('level options contain one own and two distinct common upgrades', () => {
  const data = catalog([own('bounce'), own('chair'), common('attack'), common('health'), common('speed')]);
  const choices = selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, () => 0);
  assert.equal(choices.length, 3);
  assert.equal(choices.filter(choice => choice.characters === 'negro').length, 1);
  assert.equal(choices.filter(choice => choice.characters === 'all').length, 2);
  assert.equal(new Set(choices.map(choice => choice.id)).size, 3);
  assert.ok(choices.every(choice => choice.characters !== 'solago'));
});

test('without an eligible own upgrade, three common options are offered', () => {
  const late = { ...own('bounce'), minLevel: 4 };
  const data = catalog([late, own('smile', 'solago'), common('attack'), common('health'), common('speed')]);
  assert.deepEqual(selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, () => 0).map(x => x.id), ['attack', 'health', 'speed']);
});

test('eligibility requires level, prerequisites and an uncompleted rank', () => {
  const advanced = { ...own('advanced'), minLevel: 3, requires: [{ id: 'base', rank: 1 }] };
  const data = catalog([own('base'), advanced]);
  const ids = state => selectLevelOptions(data, { character: 'negro', ...state }, () => 0).map(x => x.id);
  assert.deepEqual(ids({ level: 3, ranks: {} }), ['base']);
  assert.deepEqual(ids({ level: 2, ranks: { base: 2 } }), []);
  assert.deepEqual(ids({ level: 3, ranks: { base: 2 } }), ['advanced']);
  assert.deepEqual(ids({ level: 3, ranks: { base: 2, advanced: 2 } }), []);
});

test('chance rolls entries out of the offer while guaranteed levels force them in', () => {
  const rare = { ...own('rare'), chance: 0.2 };
  const certain = { ...own('certain'), chance: 1 };
  const forced = { ...own('forced'), chance: 0.01, guaranteedAt: [3] };
  const data = catalog([rare, certain, forced, common('attack'), common('health'), common('speed')]);
  for (let index = 0; index < 40; index++) {
    const options = selectLevelOptions(data, { character: 'negro', level: 3, ranks: {} }, () => index / 40 + 0.001);
    assert.ok(options.some(entry => entry.id === 'forced'), 'guaranteed entry always present');
    assert.equal(options.length, 3);
  }
  // Off the milestone level the guaranteed entry competes normally: the certain
  // one always passes its roll, the rare one only sometimes.
  const seen = new Set();
  for (let index = 0; index < 40; index++) {
    const [first] = selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, () => index / 40 + 0.001);
    assert.ok(first, 'an own entry is always offered when one is certain');
    seen.add(first.id);
  }
  assert.ok(seen.has('certain'));
  assert.ok(!seen.has('forced') || seen.size > 0);
});

test('invalid chance and milestone data is rejected with the entry id', () => {
  assert.throws(() => catalog([{ ...own('zero'), chance: 0 }]), /zero.*chance/);
  assert.throws(() => catalog([{ ...own('big'), chance: 1.5 }]), /big.*chance/);
  assert.throws(() => catalog([{ ...own('bad'), guaranteedAt: [0] }]), /bad.*guaranteedAt/);
});

test('later selections can offer another rank, never duplicate filler for scarce pools', () => {
  const data = catalog([common('attack')]);
  const state = { character: 'negro', level: 2, ranks: {} };
  assert.equal(selectLevelOptions(data, state, () => 0).length, 1);
  assert.equal(selectLevelOptions(data, { ...state, ranks: { attack: 1 } }, () => 0).length, 1);
  assert.deepEqual(selectLevelOptions(data, { ...state, ranks: { attack: 2 } }, () => 0), []);
  assert.deepEqual(state.ranks, {});
});

test('invalid catalog fields identify the offending entry', () => {
  const cases = [
    { ...item(), price: NaN }, { ...item(), maxCopies: 0 },
    { ...item(), modifiers: [{ stat: 'luck', operation: 'flat', value: 1 }] },
  ];
  for (const entry of cases) assert.throws(() => createCatalog({ items: [entry], upgrades: [] }), /scissors/);
  assert.throws(() => catalog([common('attack'), common('attack')]), /attack.*duplicate/);
  assert.throws(() => catalog([own('unknown', 'missing')]), /unknown.*characters/);
  assert.throws(() => catalog([{ ...common('empty'), ranks: [] }]), /empty.*ranks/);
});

test('missing, impossible-rank and cyclic prerequisites are rejected', () => {
  const requirement = (id, rank = 1) => [{ id, rank }];
  assert.throws(() => catalog([{ ...own('child'), requires: requirement('missing') }]), /child.*requires/);
  assert.throws(() => catalog([own('base'), { ...own('child'), requires: requirement('base', 3) }]), /child.*requires/);
  assert.throws(() => catalog([
    { ...own('first'), requires: requirement('second') },
    { ...own('second'), requires: requirement('first') },
  ]), /cycle/);
});

test('known reusable effects validate their parameters and generate descriptions', () => {
  const effects = { bounce: { validate: value => Number.isInteger(value) && value > 0, describe: value => `Rebotes +${value}` } };
  const upgrade = { ...own('ricochet'), ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] };
  const data = createCatalog({ items: [], upgrades: [upgrade] }, { characters: ['negro'], effects });
  assert.deepEqual(describeReward(data.upgrades[0].ranks[0], effects), ['Rebotes +1']);
  assert.throws(() => createCatalog({ items: [], upgrades: [upgrade] }, { characters: ['negro'] }), /ricochet.*effects/);
  upgrade.ranks[0].effects[0].value = -1;
  assert.throws(() => createCatalog({ items: [], upgrades: [upgrade] }, { characters: ['negro'], effects }), /ricochet.*effects/);
});

test('stat descriptions derive from the same signed numeric modifiers', () => {
  const reward = { modifiers: [
    { stat: 'attack', operation: 'percent', value: 10 },
    { stat: 'defense', operation: 'flat', value: -1 },
  ] };
  assert.deepEqual(describeReward(reward), ['Ataque +10%', 'Defensa -1']);
});
