import test from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE, DEFAULT_CATALOG, playtestBalance } from '../src/reward-data.mjs';
import { getAct } from '../src/campaign/acts.mjs';
import { itemBlocked, pickBlocked, seedRun } from '../src/game/balance-seed.mjs';
import { waveEntryBudget } from '../src/game/wave-budget.mjs';

const act1 = getAct('act-01');
const act2 = getAct('act-02');
const upgrade = id => DEFAULT_CATALOG.upgrades.find(entry => entry.id === id);
const item = id => DEFAULT_CATALOG.items.find(entry => entry.id === id);

test('a seeded run is the wave the campaign would serve', () => {
  const { run, entry } = seedRun({ character: 'negro', act: act1, wave: 3 });
  assert.equal(run.wave, 3);
  assert.equal(run.phase, 'playing');
  assert.equal(run.duration, act1.duration);
  assert.equal(run.spawnBudget, 72, 'wave three keeps its own density');
  assert.equal(run.level, entry.level);
  assert.equal(run.coins, entry.coins);
  assert.deepEqual(run.pendingLevels, []);
  assert.equal(run.player.hp, run.player.maxHp);
  assert.equal(run.elapsed, 2 * act1.duration, 'the wave starts on the campaign clock');
});

test('the first wave is a character sheet with no rewards behind it', () => {
  const { run, entry } = seedRun({ character: 'solago', act: act1, wave: 1 });
  assert.equal(run.level, 1);
  assert.equal(run.coins, 0);
  assert.equal(entry.choices, 0);
  assert.deepEqual(run.levelRanks, {});
  assert.equal(run.enemies.length, 0, 'wave one starts empty, the spawner fills it');
});

test('level picks apply inside the wave budget and stop at the cap', () => {
  const entry = waveEntryBudget(act1, 3, BALANCE);
  const attack = upgrade('stat-attack');
  const { run } = seedRun({ character: 'negro', act: act1, wave: 3, picks: { [attack.id]: 99 } });
  assert.equal(run.levelRanks[attack.id], Math.min(attack.ranks.length, entry.choices));
  assert.ok(run.player.damage > 30, 'the attack ranks landed on the sheet');
});

test('a pick the level has not unlocked is ignored', () => {
  const late = upgrade('brick-pierce');
  assert.equal(late.minLevel, 3);
  const { run } = seedRun({ character: 'papazito', act: act1, wave: 1, picks: { [late.id]: 1 } });
  assert.deepEqual(run.levelRanks, {});
});

test('coins buy items and never go negative', () => {
  const entry = waveEntryBudget(act1, 4, BALANCE);
  const { run } = seedRun({
    character: 'negro', act: act1, wave: 4,
    items: { bleach: 3, slipper: 3 },
  });
  assert.ok(run.coins >= 0);
  assert.ok(run.coins < entry.coins, 'something was spent');
  assert.ok(run.items.bleach >= 1);
  assert.ok(run.player.maxHp > 120, 'the bleach raised the ceiling');
});

test('an item is capped by its copies', () => {
  const { run } = seedRun({ character: 'negro', act: act1, wave: 6, items: { bleach: 99 } });
  assert.ok(run.items.bleach >= 1, 'it buys what the purse allows');
  assert.ok(run.items.bleach <= item('bleach').maxCopies, 'and never past the cap');
});

test('the boss wave seeds its boss, and a mini-boss wave its mini-boss', () => {
  const boss = seedRun({ character: 'negro', act: act1, wave: act1.boss.wave });
  assert.ok(boss.run.enemies.some(enemy => enemy.boss), 'the boss is standing');
  const mini = seedRun({ character: 'negro', act: act2, wave: act2.miniboss.wave });
  assert.ok(mini.run.enemies.some(enemy => enemy.kind === act2.miniboss.kind));
});

test('the playtest balance seeds a cheaper, faster run', () => {
  const real = seedRun({ character: 'negro', act: act1, wave: 4 });
  const fast = seedRun({ character: 'negro', act: act1, wave: 4, balance: playtestBalance() });
  assert.equal(fast.run.duration, 15);
  assert.ok(fast.run.coins < real.run.coins);
  assert.ok(fast.run.level >= real.run.level);
});

test('the gates explain why a choice is refused', () => {
  const attack = upgrade('stat-attack');
  assert.equal(pickBlocked(attack, { character: 'negro', level: 1, choices: 0 }), 'level');
  assert.equal(pickBlocked(attack, { character: 'negro', level: 2, choices: 0 }), 'budget');
  assert.equal(pickBlocked(upgrade('brick-pierce'), { character: 'papazito', level: 2, choices: 1 }), 'level');
  assert.equal(pickBlocked(upgrade('brick-pierce'), { character: 'negro', level: 5, choices: 3 }), 'character');
  assert.equal(pickBlocked(attack, { character: 'negro', level: 5, choices: 3, picks: { [attack.id]: 5 } }), 'maxed');
  assert.equal(pickBlocked(attack, { character: 'negro', level: 2, choices: 1 }), null);

  assert.equal(itemBlocked(item('bleach'), { coins: 0 }), 'coins');
  assert.equal(itemBlocked(item('bleach'), { coins: 60, items: { bleach: 3 } }), 'maxed');
  assert.equal(itemBlocked(item('chicken'), { coins: 999 }), 'disabled');
  assert.equal(itemBlocked(item('bleach'), { coins: 60 }), null);

});
