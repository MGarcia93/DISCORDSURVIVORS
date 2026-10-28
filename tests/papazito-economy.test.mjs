import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, sellBelonging, startNextWave } from '../src/engine.mjs';

function arena(random = () => 0.5) {
  const run = createRun(random, 'papazito');
  run.spawnIn = run.shotIn = 10000;
  return run;
}

function advance(run, seconds) {
  for (let i = 0; i < Math.round(seconds / 0.05); i++) step(run, 0.05);
}

test('timed extortion charges without coin awards and escalates within a 60-second stage', () => {
  const run = arena();
  run.coins = 100;
  assert.equal(run.player.senaNextCost, 10);
  assert.equal(run.player.senaCooldown, 10);
  advance(run, 10.05);
  assert.equal(run.coins, 90);
  assert.equal(run.player.senaCharges, 1);
  assert.equal(run.player.senaNextCost, 14);
  assert.equal(run.player.senaInterval, 9);
  assert.ok(run.player.panicTtl > 4.8);
  advance(run, 9.05);
  assert.equal(run.coins, 76);
  assert.equal(run.player.senaNextCost, 18);
  assert.equal(run.player.senaInterval, 8);
  advance(run, 35);
  assert.ok(run.player.senaCharges >= 6);
  assert.ok(run.player.senaDebt > 0, 'the buff keeps a real unpaid cost');
  assert.ok(run.player.senaInterval >= 4);
  assert.equal(run.player.damage, 30);
});

test('random charge and timer bounds remain finite, positive and visible before charging', () => {
  for (const [random, cost, interval] of [[() => 0, 8, 8], [() => 0.999999, 12, 12]]) {
    const run = arena(random);
    assert.equal(run.player.senaNextCost, cost);
    assert.equal(run.player.senaInterval, interval);
    assert.match(run.player.characterDef.taskHud(run.player).label, new RegExp(`${cost} ◈`));
    advance(run, interval + 0.05);
    assert.equal(run.player.senaDebt, cost);
    assert.equal(run.player.senaNextCost, cost + 4);
    assert.equal(run.player.senaInterval, interval - 1);
  }
});

test('unpaid charges accumulate debt and partial payment never makes the wallet negative', () => {
  const run = arena();
  run.coins = 3;
  advance(run, 10.05);
  assert.equal(run.coins, 0);
  assert.equal(run.player.senaDebt, 7);
  assert.match(run.effects.map(e => e.text).join('|'), /DEUDA/);
  advance(run, 9.05);
  assert.equal(run.player.senaDebt, 21);
  assert.equal(run.coins, 0);
});

test('random variation never lowers a bill or lengthens its interval within a stage', () => {
  let draws = 0;
  const run = arena(() => ++draws % 4 < 2 ? 0 : 0.999999);
  for (let i = 0; i < 7; i++) {
    const cost = run.player.senaNextCost;
    const interval = run.player.senaInterval;
    advance(run, run.player.senaCooldown + 0.05);
    assert.ok(run.player.senaNextCost >= cost + 4);
    assert.ok(run.player.senaInterval <= Math.max(4, interval - 1));
  }
});

test('sale income settles debt before crediting the wallet, preserving sale buffs and penalties', () => {
  for (const [debt, remainingDebt, coins] of [[0, 0, 20], [7, 0, 13], [19, 0, 1], [20, 0, 0], [21, 1, 0], [100, 80, 0]]) {
    const run = arena();
    run.player.senaDebt = debt;
    run.coins = 7;
    assert.equal(run.player.characterDef.saleHud(run, { coins: 20 }), `${Math.min(20, debt)} fichas a deuda · ${coins} fichas disponibles`);
    assert.equal(sellBelonging(run, 'psp'), true);
    assert.equal(run.player.senaDebt, remainingDebt);
    assert.equal(run.coins, coins + 7, 'previous wallet is not spent again to settle sale debt');
    assert.equal(run.player.sellMoveSlowFrac, 0.15);
    assert.equal(run.player.sellDamageFrac, 0.1);
    assert.match(run.player.characterDef.statusHud(run.player), /−15% VELOCIDAD/);
    const snapshot = JSON.stringify(run);
    assert.equal(sellBelonging(run, 'psp'), false);
    assert.equal(JSON.stringify(run), snapshot);
  }
});

test('each stage resets debt, escalation and panic without replenishing sold belongings', () => {
  const run = arena();
  sellBelonging(run, 'psp');
  advance(run, 59.95);
  assert.ok(run.player.senaDebt > 0);
  const snapshot = JSON.stringify(run);
  assert.equal(startNextWave(run), false, 'cannot reset debt during combat');
  assert.equal(JSON.stringify(run), snapshot);
  advance(run, 0.1);
  assert.equal(run.phase, 'shop');
  assert.equal(startNextWave(run), true);
  assert.equal(run.player.senaDebt, 0);
  assert.equal(run.player.senaCharges, 0);
  assert.equal(run.player.senaNextCost, 10);
  assert.equal(run.player.senaCooldown, 10);
  assert.equal(run.player.panicTtl, 0);
  assert.equal(run.player.soldItems.psp, true);
  assert.equal(sellBelonging(run, 'psp'), false);
  for (const wave of [3, 4]) {
    const coins = run.coins;
    run.player.senaDebt = 100;
    run.player.senaCharges = 5;
    run.player.panicTtl = 3;
    run.phase = 'shop';
    assert.equal(startNextWave(run), true);
    assert.deepEqual([run.wave, run.player.senaDebt, run.player.senaCharges, run.player.panicTtl, run.coins], [wave, 0, 0, 0, coins]);
    assert.equal(run.player.soldItems.psp, true);
  }
});

test('sale penalties have visible countdowns and disappear when expired', () => {
  const run = arena();
  for (const key of ['psp', 'keyboard', 'chair', 'monitor']) sellBelonging(run, key);
  const hud = () => run.player.characterDef.statusHud(run.player);
  for (const expected of [/−15% VELOCIDAD · 10s/, /INTERVALO DE TIRO · 10s/, /−15% DEFENSA · 10s/, /VISIÓN REDUCIDA · 10s/]) {
    assert.match(hud(), expected);
  }
  advance(run, 10.1);
  assert.doesNotMatch(hud(), /VELOCIDAD|INTERVALO DE TIRO|DEFENSA|VISIÓN REDUCIDA/);
});

test('paying debt with a sale still slows movement, slows firing and reduces defense', () => {
  const base = arena();
  const slow = arena();
  slow.player.senaDebt = 50;
  sellBelonging(slow, 'psp');
  const startX = base.player.x;
  step(base, 0.05, { x: 1 });
  step(slow, 0.05, { x: 1 });
  assert.ok(Math.abs((slow.player.x - startX) / (base.player.x - startX) - 0.85) < 1e-9);
  for (const [item, multiplier] of [['keyboard', 1.2], ['pc', 1.3]]) {
    const run = arena();
    run.player.senaDebt = 200;
    sellBelonging(run, item);
    run.shotIn = 0;
    step(run, 0.05);
    assert.ok(Math.abs(run.shotIn - run.player.shotInterval * multiplier) < 1e-9);
    assert.equal(run.coins, 0);
  }
  const run = arena();
  run.player.senaDebt = 50;
  sellBelonging(run, 'chair');
  run.enemies.push({ id: ++run.serial, kind: 'zombie', x: run.player.x, y: run.player.y,
    hp: 1000, maxHp: 1000, speed: 0, radius: 10 });
  step(run, 0.05);
  assert.ok(Math.abs((110 - run.player.hp) - 6.39) < 1e-9);
});

test('ordinary bounties stay spendable without automatically settling sale-only debt', () => {
  const run = arena();
  run.player.senaDebt = 21;
  run.enemies.push({ id: ++run.serial, kind: 'zombie', x: run.player.x + 100, y: run.player.y,
    hp: 0, maxHp: 10, radius: 10, speed: 0 });
  step(run, 0.05);
  assert.equal(run.coins, run.rewardBalance.gold.rewards.zombie);
  assert.equal(run.kills, 1);
  assert.equal(run.player.senaDebt, 21);
});
