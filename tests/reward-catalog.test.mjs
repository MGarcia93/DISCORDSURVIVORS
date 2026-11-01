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

test('every level offers four distinct upgrades, at most one of them own', () => {
  const data = catalog([own('bounce'), own('chair'), common('attack'), common('health'), common('speed'), common('reach')]);
  const choices = selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, () => 0);
  assert.equal(choices.length, 4);
  assert.equal(choices.filter(choice => choice.characters === 'negro').length, 1);
  assert.equal(choices.filter(choice => choice.characters === 'all').length, 3);
  assert.equal(new Set(choices.map(choice => choice.id)).size, 4);
  assert.ok(choices.every(choice => choice.characters !== 'solago'));
});

test('without an eligible own upgrade, the four slots come from the common pool', () => {
  const late = { ...own('bounce'), minLevel: 4 };
  const data = catalog([late, own('smile', 'solago'), common('attack'), common('health'), common('speed'), common('reach')]);
  const choices = selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, () => 0);
  assert.equal(choices.length, 4);
  assert.ok(choices.every(choice => choice.characters === 'all'));
  assert.deepEqual(choices.map(x => x.id), ['attack', 'health', 'speed', 'reach']);
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

test('the signature slot opens a quarter of the time, and its own probability picks which', () => {
  const data = catalog([{ ...own('rare'), chance: 0.2 }, own('certain'),
    common('attack'), common('health'), common('speed'), common('reach')]);
  // A spread of rolls across [0, 1): the slot opens on the first quarter only.
  const golden = () => { let index = 0; return () => ((index++ * 0.6180339887498949) % 1); };
  const roll = golden();
  let opened = 0;
  const samples = 400;
  for (let index = 0; index < samples; index++) {
    const options = selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, roll);
    assert.equal(options.length, 4, 'four choices at every level');
    assert.ok(options.every(entry => entry.id), 'no empty slot');
    if (options.some(entry => entry.characters === 'negro')) opened++;
  }
  const rate = opened / samples;
  assert.ok(rate > 0.17 && rate < 0.33, `signature slot opens about a quarter of the time (got ${rate})`);

  // Inside the open slot the entry is picked by its own weight, not by order.
  const withRolls = values => { let index = 0; return () => values[Math.min(index++, values.length - 1)]; };
  const pick = value => selectLevelOptions(data, { character: 'negro', level: 2, ranks: {} }, withRolls([0.1, value]))
    .find(entry => entry.characters === 'negro')?.id;
  // Weights: rare 0.2 against certain 1, so the rare one only owns the low
  // sixth of the roll.
  assert.deepEqual([pick(0), pick(0.5), pick(0.95)], ['rare', 'certain', 'certain'],
    'the rarer signature only wins in its own slice of the roll');
});


test('a milestone level forces its entry even when the slot roll fails', () => {
  const forced = { ...own('forced'), guaranteedAt: [3] };
  const data = catalog([forced, common('attack'), common('health'), common('speed'), common('reach')]);
  const closed = () => 0.99;
  const options = selectLevelOptions(data, { character: 'negro', level: 3, ranks: {} }, closed);
  assert.ok(options.some(entry => entry.id === 'forced'));
  assert.equal(options.length, 4);
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
