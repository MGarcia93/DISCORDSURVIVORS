import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun as engineRun, step, buyItem, chooseLevelReward, skipEmptyChoice, chooseUpgrade, startNextWave, sellBelonging,
} from '../src/engine.mjs';
import { awardXP, beginRewards } from '../src/run-rewards.mjs';
import { createCatalog } from '../src/reward-catalog.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';
import { on } from '../src/bus.mjs';
import { BALANCE } from '../src/reward-data.mjs';

const rng = () => 0.5;
const oneXp = structuredClone(BALANCE);
oneXp.xp.rewards = { zombie: 1, runner: 1, brute: 1, alarmZombie: 0 };
const createRun = (random = rng, character = 'negro', options = {}) =>
  engineRun(random, character, { balance: oneXp, ...options });
const endWave = run => { run.spawnIn = run.shotIn = 1e6; run.time = run.duration; step(run, 0, {}); };
const shop = run => { run.phase = 'shop'; beginRewards(run); };
const catalogWith = (items, upgrades = []) => createCatalog({ items, upgrades });
const statItem = (id, stat, operation, value, maxCopies = 3) => ({
  id, name: id, lore: id, price: 0, maxCopies, modifiers: [{ stat, operation, value }],
});
const reject = (action, run, label) => {
  const before = JSON.stringify(run);
  assert.equal(action(), false, label);
  assert.equal(JSON.stringify(run), before, `${label} mutated state`);
};

test('S2: maximum-life examples apply once through real purchases', () => {
  for (const [delta, hp, expectedHp, expectedMax] of [[20, 60, 80, 120], [-20, 60, 60, 80], [-20, 90, 80, 80]]) {
    const run = createRun(rng, 'solago', { catalog: catalogWith([statItem('probe', 'life', 'flat', delta)]) });
    run.player.hp = hp;
    shop(run);
    assert.equal(buyItem(run, 'probe'), true);
    assert.deepEqual([run.player.hp, run.player.maxHp], [expectedHp, expectedMax]);
    run.player.hp = Math.min(run.player.maxHp, 10);
    assert.equal(beginRewards(run), true);
    assert.equal(run.player.hp, 10, 're-rendering must not heal again');
  }
});

test('S2: item and level modifiers compose in any acquisition order', () => {
  const catalog = catalogWith([statItem('flat2', 'attack', 'flat', 2, 1)], [{
    id: 'pct10', name: 'Pct', characters: 'all', minLevel: 2, requires: [],
    ranks: [{ modifiers: [{ stat: 'attack', operation: 'percent', value: 10 }] },
      { modifiers: [{ stat: 'attack', operation: 'percent', value: 10 }] }],
  }]);
  const results = [];
  for (const itemFirst of [true, false]) {
    const run = createRun(rng, 'negro', { catalog });
    const base = run.statState.base.attack;
    shop(run);
    if (itemFirst) assert.equal(buyItem(run, 'flat2'), true);
    run.pendingLevels = [2, 3]; run.levelChoices = null; beginRewards(run);
    while (run.pendingLevels.length) assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
    if (!itemFirst) assert.equal(buyItem(run, 'flat2'), true);
    assert.ok(Math.abs(run.player.damage - (base + 2) * 1.2) < 1e-9, `${run.player.damage}`);
    results.push(run.player.damage);
  }
  assert.equal(results[0], results[1]);
});

test('S2: a legacy purchase after an item keeps both sources', () => {
  const run = createRun(() => 0, 'negro', { catalog: catalogWith([statItem('atk10', 'attack', 'percent', 10, 2)]) });
  endWave(run); run.coins = 500;
  assert.equal(buyItem(run, 'atk10'), true);
  assert.ok(Math.abs(run.player.damage - 33) < 1e-9);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(run.coins, 480);
  assert.ok(Math.abs(run.player.damage - 42.9) < 1e-9, `${run.player.damage}`);
  assert.equal(startNextWave(run), true);
  endWave(run);
  assert.equal(buyItem(run, 'atk10'), true);
  assert.ok(Math.abs(run.player.damage - 46.8) < 1e-9, `${run.player.damage}`);
});

test('S4: exact XP examples; income and sales never award XP', () => {
  const settle = (run, count) => {
    run.spawnIn = run.shotIn = 1e6;
    run.enemies = Array.from({ length: count }, (_, i) => ({ id: ++run.serial, kind: i % 2 ? 'runner' : 'zombie', hp: 0, x: 0, y: 0 }));
    step(run, 0, {});
  };
  const run = createRun(rng);
  settle(run, 100);
  assert.deepEqual([run.level, run.xp], [3, 50]);
  settle(run, 50);
  assert.deepEqual([run.level, run.xp], [4, 10]);
  const pap = createRun(rng, 'papazito');
  const stock = Object.keys(pap.player.characterDef.specials.find(s => s.items).items);
  assert.equal(pap.xp, 0);
  assert.equal(sellBelonging(pap, stock[0]), true);
  assert.equal(pap.xp, 0);
  const survival = createRun(rng);
  survival.time = survival.duration; step(survival, 0, {});
  assert.deepEqual([survival.phase, survival.xp, survival.level], ['shop', 0, 1]);
});

test('S3/S5: stable offers, caps, empty pools and rejected actions', () => {
  const run = createRun(() => 0);
  endWave(run);
  const offers = run.shopOffers.map(offer => offer.id);
  assert.equal(offers.length, 4);
  assert.equal(new Set(offers).size, 4);
  run.coins = 1000;
  assert.equal(buyItem(run, offers[0]), true);
  assert.deepEqual(run.shopOffers.map(offer => offer.id), offers);
  assert.equal(beginRewards(run), true);
  assert.deepEqual(run.shopOffers.map(offer => offer.id), offers, 'render never rerolls');
  reject(() => buyItem(run, offers[0]), run, 'already bought');

  const single = catalogWith([statItem('solo', 'attack', 'flat', 1, 2)]);
  const capped = createRun(rng, 'negro', { catalog: single });
  capped.coins = 10;
  endWave(capped);
  assert.deepEqual(capped.shopOffers.map(offer => offer.id), ['solo']);
  assert.equal(buyItem(capped, 'solo'), true);
  assert.equal(startNextWave(capped), true);
  endWave(capped);
  assert.deepEqual(capped.shopOffers.map(offer => offer.id), ['solo']);
  assert.equal(buyItem(capped, 'solo'), true);
  assert.equal(startNextWave(capped), true);
  endWave(capped);
  assert.deepEqual(capped.shopOffers, []);
  assert.equal(startNextWave(capped), true, 'an empty shop cannot block the run');

  const empty = createRun(rng, 'negro', { catalog: catalogWith([]) });
  awardXP(empty, 10); endWave(empty);
  assert.deepEqual(empty.levelChoices, []);
  assert.equal(skipEmptyChoice(empty), true);
  assert.equal(empty.level, 2);
  reject(() => buyItem(empty, 'missing'), empty, 'unknown item');
});

test('S7: pending choices block the boundary; victory clears them and emits once', () => {
  let events = 0;
  const off = on('waveCleared', () => { events++; });
  try {
    const run = createRun(rng);
    awardXP(run, 50); endWave(run);
    assert.equal(events, 1);
    const characters = { negro: { name: 'Negro', expressions: { neutral: 'sample.svg' } } };
    const scene = { id: 'after', repeat: 'once', steps: [{ type: 'dialogue', lines: [{ speaker: 'negro', text: 'Hola' }] }], effects: [] };
    const director = new WaveDirector({ characters, sounds: {}, entries: [{ id: 'after', scene, actions: {} }],
      bindings: [{ when: 'after_wave', wave: 1, scene: 'after' }] });
    director.attach(run); director.observe();
    assert.ok(director.player?.active, 'after-wave scene still plays');
    director.skip();
    reject(() => director.nextWave(() => startNextWave(run)), run, 'pending choices block the wave');
    while (run.pendingLevels.length) assert.equal(chooseLevelReward(run, run.levelChoices[0].id), true);
    assert.equal(director.nextWave(() => startNextWave(run)), true);
    assert.equal(run.wave, 2);

    const victory = createRun(rng);
    awardXP(victory, 140);
    victory.wave = 4; victory.spawnIn = victory.shotIn = 1e6;
    victory.enemies.push({ id: ++victory.serial, kind: 'alarmZombie', boss: true, hp: 0, x: 0, y: 0, radius: 20 });
    step(victory, 0, {});
    assert.equal(victory.phase, 'won');
    assert.deepEqual(victory.pendingLevels, []);
    assert.equal(victory.levelChoices, null);
    assert.equal(victory.shopOffers, null);
    assert.equal(events, 2);
    assert.equal(startNextWave(victory), false);
  } finally {
    off?.();
  }
});
