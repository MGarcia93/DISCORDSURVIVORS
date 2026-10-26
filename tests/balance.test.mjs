import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, chooseUpgrade, buyHeal, startNextWave, UPGRADES } from '../src/engine.mjs';

test('normal waves last 60 seconds', () => {
  const run = createRun(() => 0.5);
  assert.equal(run.duration, 60);
  run.time = 59.99;
  step(run, 0.02, {});
  assert.equal(run.phase, 'shop');
  startNextWave(run);
  assert.equal(run.duration, 60);
});

test('damage upgrades stack up to four levels and cost more each time', () => {
  const run = createRun(() => 0.5);
  run.phase = 'shop';
  run.coins = 200;
  const base = run.player.damage;
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(chooseUpgrade(run, 'damage'), true);
  assert.equal(chooseUpgrade(run, 'damage'), false);
  assert.equal(run.upgrades.damage, 4);
  assert.equal(run.coins, 60);
  assert.ok(run.player.damage > base * 1.9);
  assert.equal(UPGRADES.find(u => u.id === 'damage').costs.length, 4);
});

test('rate and armor upgrades improve fire cooldown and damage reduction', () => {
  const run = createRun(() => 0.5);
  run.phase = 'shop';
  run.coins = 100;
  assert.equal(chooseUpgrade(run, 'rate'), true);
  assert.ok(run.player.shotInterval < 0.45);
  assert.equal(chooseUpgrade(run, 'armor'), true);
  assert.equal(run.player.defense, 0.25);
});

test('upgrade levels persist between waves and are not reset by the shop', () => {
  const run = createRun(() => 0.5);
  run.phase = 'shop';
  run.coins = 40;
  assert.equal(chooseUpgrade(run, 'regen'), true);
  assert.equal(run.upgrades.regen, 1);
  startNextWave(run);
  assert.equal(run.upgrades.regen, 1);
  run.phase = 'shop';
  assert.equal(chooseUpgrade(run, 'regen'), true);
  assert.equal(run.upgrades.regen, 2);
});

test('delivery heals 60 HP, cannot overheal and costs twelve coins', () => {
  const run = createRun(() => 0.5);
  run.phase = 'shop';
  run.player.hp = 60;
  run.coins = 24;
  assert.equal(buyHeal(run), true);
  assert.equal(run.player.hp, 120);
  assert.equal(run.coins, 12);
  assert.equal(buyHeal(run), true);
  assert.equal(run.player.hp, run.player.maxHp);
  assert.equal(run.coins, 0);
  assert.equal(buyHeal(run), false);
});

test('the shop always gives a twenty-ficha survival bonus when a wave ends', () => {
  const run = createRun(() => 0.5);
  run.time = 59.99;
  run.coins = 0;
  step(run, 0.02, {});
  assert.equal(run.coins, 20);
  assert.equal(run.phase, 'shop');
});
