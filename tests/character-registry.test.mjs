import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, activateSpecial, step } from '../src/engine.mjs';
import { CHARACTERS, getCharacter } from '../src/characters/index.mjs';
import { UNIT_PX } from '../src/stats.mjs';

test('characters are registered data objects with behavior, and the engine resolves unknown ids to negro', () => {
  assert.ok(CHARACTERS.negro && CHARACTERS.solago, 'both implemented characters must be registered');
  assert.equal(CHARACTERS.negro.id, 'negro');
  assert.equal(CHARACTERS.solago.id, 'solago');
  assert.equal(getCharacter('any-other-id'), CHARACTERS.negro, 'unknown ids fall back to negro');
  assert.equal(createRun().player.characterDef, CHARACTERS.negro);
  assert.equal(createRun(Math.random, 'solago').player.characterDef, CHARACTERS.solago);
});

test('Papazito is a registered heavy ranged bruiser running on the percentage core', () => {
  assert.ok(CHARACTERS.papazito, 'Papazito must be registered in the roster');
  assert.equal(CHARACTERS.papazito.id, 'papazito');
  const p = createRun(Math.random, 'papazito').player;
  // Stat sheet from context/personajes/papazito_el_paraguayo_trucho.md §3:
  // life +10% -> 110, ranged damage +15% -> 11.5, attackSpeed -10% -> 90
  // (interval ~1.11s), defense +10% -> 11 points (0.55 mitigation),
  // moveSpeed -10% -> 2970 (148.5 scaled px/s). attackDistance is a charged
  // balancing proposal: 150% (165px), tunable like Warrior's was.
  assert.equal(p.maxHp, 110);
  assert.equal(p.defense, 0.55);
  assert.equal(p.damage, 11.5);
  assert.equal(p.attackRange, 150 * UNIT_PX);
  assert.ok(Math.abs(p.shotInterval - 100 / 90) < 1e-9);
  assert.equal(p.speed, 148.5 * WORLD_SCALE);
  assert.equal(CHARACTERS.papazito.attack.type, 'ranged');
  assert.equal(CHARACTERS.papazito.attack.device, 'brick', 'his basic attack config lives in the sheet');
});

test('Warrior is a registered controller running on the percentage core', () => {
  assert.ok(CHARACTERS.warrior, 'Warrior must be registered in the roster');
  assert.equal(CHARACTERS.warrior.id, 'warrior');
  const w = createRun(Math.random, 'warrior').player;
  // Stat sheet from the character md, translated to percentages of BASE_STATS:
  // life 85%, defense 100% (10 standard points), attack 80%, attackSpeed 90%,
  // attack 150% base (15), bomb multiplier x3 (45 per mushroom),
  // attackSpeed 60% (0.6 bombs/s),
  // attackDistance 300%, moveSpeed 3300% (normal game mobility).
  assert.equal(w.maxHp, 85);
  assert.equal(w.defense, 0.5);
  assert.equal(w.damage, 15);
  assert.equal(w.attackRange, 300 * UNIT_PX);
  assert.ok(Math.abs(w.shotInterval - 100 / 60) < 1e-9);
  assert.equal(CHARACTERS.warrior.attack.damageMultiplier, 3);
  assert.equal(w.speed, 165 * WORLD_SCALE);
  assert.equal(CHARACTERS.warrior.attack.device, 'shroom', 'his basic attack config lives in the sheet');
});

test('specials come from the character definition with unchanged durations and cooldowns', () => {
  assert.deepEqual(CHARACTERS.solago.specials.map(s => [s.key, s.duration, s.cooldown]),
    [['stand', 7, 26]]);
  assert.deepEqual(CHARACTERS.negro.specials.map(s => [s.key, s.duration, s.cooldown]),
    [['anime', 8, 18], ['chair', 6, 22]]);
});

test('La seña taxes Papazito coin awards and drops him into a 5s panic', () => {
  const run = createRun(Math.random, 'papazito');
  run.spawnIn = 100;
  run.coins = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 80, y: run.player.y, hp: 1, maxHp: 1, speed: 0, radius: 10, kind: 'zombie' });

  for (let i = 0; i < 6; i++) step(run, 0.05, {});

  // bounty 2 lands first (100 + 2 = 102); the seña takes min(15, round(10%)) = 10
  assert.equal(run.coins, 102 - 10, 'the cariñosa cuts 10% capped at 15, never more');
  assert.ok(run.player.panicTtl > 4.8 && run.player.panicTtl <= 5, 'the panic window is exactly 5 seconds (decayed by the walk loop)');
  assert.ok(run.player.senaCooldown > 24.8 && run.player.senaCooldown <= 25, 'the seña frequency cooldown is 25s (decayed by the walk loop)');
  assert.ok(run.effects.some(e => e.kind === 'panic' && e.text === '¡ME RE CAGARON!'));
});

test('the seña cooldown blocks a second tax in the same window', () => {
  const run = createRun(Math.random, 'papazito');
  const p = run.player;
  p.panicTtl = 3; // re-armable check starts from the def hook directly
  p.senaCooldown = 10;
  run.coins = 100;
  p.characterDef.onCoinsGained?.(run, p, 10);
  assert.equal(run.coins, 100, 'no coins are cut while the seña is cooling down');
  assert.equal(p.panicTtl, 3, 'no panic refresh while the seña is cooling down');
});

test('panic from La seña gallops him exactly +30% movement and -40% shot interval, never damage', () => {
  const run = createRun(Math.random, 'papazito');
  const p = run.player;
  const x0 = p.x;
  p.panicTtl = 5;
  step(run, 0.05, { x: 1, y: 0 });
  assert.ok(Math.abs(p.x - x0 - 148.5 * WORLD_SCALE * 0.05 * 1.3) < 1e-6, '+30% move speed only');

  run.shotIn = 0;
  step(run, 0.05, {});
  assert.ok(Math.abs(run.shotIn - (100 / 90) * 0.6) < 1e-9, '+40% attack speed only');
  assert.equal(p.damage, 11.5, 'no extra damage from the panic');
});

test('penniless Papazito does not trigger the seña tax twice in a row for nothing', () => {
  const run = createRun(Math.random, 'papazito');
  const p = run.player;
  p.panicTtl = 0;
  p.senaCooldown = 0;
  run.coins = 4; // round(10%) = 0: nothing to extort yet
  p.characterDef.onCoinsGained?.(run, p, 4);
  assert.equal(run.coins, 4);
  assert.equal(p.panicTtl, 0, 'no panic when there is nothing to lose');
});

test('activateSpecial drives timers from the definition', () => {
  const base = createRun();
  assert.equal(activateSpecial(base, 'anime'), true);
  assert.equal(base.player.anime, 8);
  assert.equal(base.player.animeCooldown, 18);
  assert.equal(activateSpecial(base, 'anime'), false, 'cooldown blocks reactivation');

  const sol = createRun(Math.random, 'solago');
  assert.equal(activateSpecial(sol, 'chair'), false, 'solago has no chair special');
  assert.equal(activateSpecial(sol, 'stand'), true);
  assert.equal(sol.player.stand, 7);
  assert.equal(sol.player.standCooldown, 26);
  assert.equal(activateSpecial(sol, 'stand'), false);
});

test('solago smile passive ticks from the definition and stand expiry applies its penalty', () => {
  const sol = createRun(Math.random, 'solago');
  sol.player.smileCooldown = 0;
  step(sol, 0.016);
  assert.equal(sol.player.smile, 2.5);
  assert.equal(sol.player.smileCooldown, 12);

  assert.equal(activateSpecial(sol, 'stand'), true);
  sol.player.stand = 0.02;
  sol.player.hp = 90;
  step(sol, 0.05);
  assert.equal(sol.player.hp, 75);
  assert.ok(sol.effects.some(e => e.kind === 'panic' && e.text === '¡YA VOY!'));
});

test('solago onKill accumulates the task kills and grants the permission buff', () => {
  const sol = createRun(Math.random, 'solago');
  const p = sol.player;
  p.taskKills = 7;
  p.characterDef.onKill(sol, p, {}, {});
  assert.equal(p.taskKills, 0);
  assert.equal(p.permissionActive, 8);
  assert.ok(sol.effects.some(e => e.text === '¡PERMISO!'));
});
