import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chooseUpgrade, UPGRADES } from '../src/engine.mjs';

test('every upgrade carries its own apply function', () => {
  for (const upgrade of UPGRADES) {
    assert.equal(typeof upgrade.apply, 'function', `${upgrade.id} needs apply(player, level)`);
  }
});

test('chooseUpgrade delegates to apply and preserves exact stat effects', () => {
  const buy = id => {
    const run = createRun();
    run.phase = 'shop';
    run.coins = 20;
    assert.equal(chooseUpgrade(run, id), true);
    return run.player;
  };

  assert.equal(buy('damage').damage, 30 * 1.3);
  assert.equal(buy('rate').shotInterval, 0.45 * 0.92);
  const health = buy('health');
  assert.equal(health.maxHp, 175);
  assert.equal(health.hp, 175);
  assert.equal(buy('armor').defense, 0.25);
  assert.equal(buy('regen').regen, 6.5);
  assert.equal(buy('speed').speed, 165 * 1.1 * 1.08);
});

test('an upgrade can carry a custom apply without touching engine logic', () => {
  const originals = [...UPGRADES];
  try {
    UPGRADES.length = 0;
    UPGRADES.push({ id: 'damage', name: 'x', description: 'x', costs: [5], icon: 'x',
      apply(player) { player.damage += 99; } });
    const run = createRun();
    run.phase = 'shop';
    run.coins = 5;
    assert.equal(chooseUpgrade(run, 'damage'), true);
    assert.equal(run.player.damage, 129);
    assert.equal(run.upgrades.damage, 1);
  } finally {
    UPGRADES.length = 0;
    UPGRADES.push(...originals);
  }
});
