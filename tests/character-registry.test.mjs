import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, activateSpecial, sellBelonging, step } from '../src/engine.mjs';
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
  // life +10% -> 110, damage matches El Negro (30), attackSpeed -10% -> 90
  // (interval ~1.11s), defense +10% -> 11 points (0.55 mitigation),
  // moveSpeed -10% -> 2970 (148.5 scaled px/s). Attack distance is
  // 280% (308px), slightly longer than El Negro's 260% (286px).
  assert.equal(p.maxHp, 110);
  assert.equal(p.defense, 0.55);
  assert.equal(p.damage, createRun(Math.random, 'negro').player.damage);
  assert.equal(p.damage, 30);
  assert.equal(p.attackRange, 280 * UNIT_PX);
  assert.ok(p.attackRange > createRun(Math.random, 'negro').player.attackRange);
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

test('La seña does not charge early when Papazito earns coins', () => {
  const run = createRun(() => 0.5, 'papazito');
  run.spawnIn = 100;
  run.coins = 100;
  run.shotIn = 0.001;
  run.enemies.push({ id: 1, x: run.player.x + 80, y: run.player.y, hp: 1, maxHp: 1, speed: 0, radius: 10, kind: 'zombie' });

  for (let i = 0; i < 6; i++) step(run, 0.05, {});

  assert.equal(run.coins, 102, 'the bounty stays intact before the timed bill');
  assert.equal(run.player.panicTtl, 0);
  assert.ok(run.player.senaCooldown > 9.6 && run.player.senaCooldown < 10);
});

test('the seña cooldown blocks a second tax in the same window', () => {
  const run = createRun(Math.random, 'papazito');
  const p = run.player;
  p.panicTtl = 3; // re-armable check starts from the def hook directly
  p.senaCooldown = 10;
  run.coins = 100;
  run.spawnIn = run.shotIn = 100;
  step(run, 0.05);
  assert.equal(run.coins, 100, 'no coins are cut while the seña is cooling down');
  assert.equal(p.panicTtl, 2.95, 'no panic refresh while the seña is cooling down');
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
  assert.equal(p.damage, 30, 'no extra damage from the panic');
});

test('penniless Papazito receives the panic buff with an unpaid bill', () => {
  const run = createRun(() => 0.5, 'papazito');
  const p = run.player;
  p.panicTtl = 0;
  p.senaCooldown = 0;
  run.spawnIn = run.shotIn = 100;
  step(run, 0.05);
  assert.equal(run.coins, 0);
  assert.equal(p.senaDebt, 10);
  assert.equal(p.panicTtl, 5);
});

test('ANAMENCUÁ is a 40s-cooldown r key unleashing three radial brick bursts', () => {
  assert.deepEqual(CHARACTERS.papazito.specials.map(s => [s.key, s.name, s.hotkey]),
    [['sell', 'Liquidó todo', 'q'], ['anamencua', '¡ANAMENCUÁ!', 'r']]);

  const run = createRun(Math.random, 'papazito');
  run.spawnIn = 100;
  assert.equal(activateSpecial(run, 'anamencua'), true);
  assert.equal(run.player.anamencua, 1.2);
  assert.equal(run.player.anamencuaCooldown, 40);
  assert.equal(activateSpecial(run, 'anamencua'), false, 'the cooldown blocks a second activation');

  // Mute the basic attack to isolate the three expanding rings.
  run.shotIn = 100;
  run.enemies.push({ id: 1, x: run.player.x + 260, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  for (let i = 0; i < 25; i++) step(run, 0.05, {});
  assert.ok(500 - run.enemies[0].hp >= 2 * 30, 'both circular bursts reach the enemy');
  assert.ok(run.effects.some(e => e.text === '¡ANAMENCUÁ!'), 'the fury shout is on screen');
});

test('the sell table lives in the sheet, once per belonging, reset by every new run', () => {
  const spec = CHARACTERS.papazito.specials.find(s => s.key === 'sell');
  assert.equal(spec.hotkey, 'q');
  const items = spec.items;
  assert.deepEqual(Object.keys(items), ['psp', 'monitor', 'keyboard', 'chair', 'pc']);
  assert.equal(items.psp.coins, 20);
  assert.equal(items.psp.damageFrac, 0.1);
  assert.equal(items.monitor.visionTtl, 10, 'the monitor sale blinds for its 10s');
  assert.equal(items.keyboard.atkSlowFrac, 0.2);
  assert.equal(items.chair.defFrac, 0.15);
  assert.equal(items.pc.coins, 100);
  assert.equal(items.pc.damageTtl, 15);
  assert.equal(items.psp.quote, 'Vendió la PSP');
  assert.equal(items.pc.quote, 'Vendió hasta la PC');
});

test('selling a belonging pays its coins, applies its buffs/debuffs and marks it sold once', () => {
  const run = createRun(() => 0.5, 'papazito');
  const p = run.player;
  assert.equal(sellBelonging(run, 'psp'), true);
  assert.equal(run.coins, 20);
  assert.equal(p.sellDamageFrac, 0.1, '+10% temporal de daño');
  assert.equal(p.sellDamageTtl, 10);
  assert.equal(p.sellMoveSlowFrac, 0.15, '-15% temporal de velocidad');
  assert.equal(p.sellMoveSlowTtl, 10);
  assert.equal(p.soldItems.psp, true, 'sold once');
  assert.ok(run.effects.some(e => e.text === 'Vendió la PSP'));

  assert.equal(sellBelonging(run, 'psp'), false, 'each belonging sells once per run');
  assert.equal(run.coins, 20, 'no double pay');
});

test('sell buffs and debuffs are capped and never touch the real build', () => {
  const run = createRun(() => 0.5, 'papazito');
  const p = run.player;
  sellBelonging(run, 'psp');
  sellBelonging(run, 'pc');
  const baselineUpgrades = { ...run.upgrades };
  assert.equal(p.sellDamageFrac, 0.5, 'stacked sale damage caps at +50%');
  assert.ok(Math.abs(p.sellMoveSlowFrac - 0.45) < 1e-9, 'the PC stacks 30% over the 15% pendiente');
  assert.equal(p.sellAtkSlowFrac, 0.3, 'the PC slows the attack rate 30%');
  assert.deepEqual(baselineUpgrades, run.upgrades, 'sales never remove real upgrades');
  assert.equal(sellBelonging(run, 'keyboard'), true, 'the other belongings remain sellable');
});

test('the sheet can relabel its ability HUD per state, so an empty change stays visible', () => {
  const run = createRun(() => 0.5, 'papazito');
  const def = run.player.characterDef;
  const sell = def.specials.find(s => s.key === 'sell');
  assert.equal(typeof def.specialHudLabel, 'function');
  assert.equal(def.specialHudLabel(sell, run.player), 'Liquidó todo');
  for (const key of ['psp', 'monitor', 'keyboard', 'chair', 'pc']) run.player.soldItems = { ...run.player.soldItems, [key]: true };
  assert.equal(def.specialHudLabel(sell, run.player), 'CHANGO VACÍO');
  const anamencua = def.specials.find(s => s.key === 'anamencua');
  assert.equal(def.specialHudLabel(anamencua, run.player), '¡ANAMENCUÁ!', 'other specials keep their own name');
});

test('sale buffs expire: after their ttl the damage and debuffs stop applying', () => {
  const run = createRun(() => 0.5, 'papazito');
  const p = run.player;
  sellBelonging(run, 'psp');
  for (let i = 0; i < 220; i++) run.time += 0; // no free stepping: we drive the arena
  run.spawnIn = 100;
  for (let i = 0; i < 202; i++) step(run, 0.05, { x: 1, y: 0 }); // ~10.1s > 10s ttls
  assert.equal(p.sellDamageTtl, 0, 'the damage window spent out');
  assert.equal(p.sellMoveSlowTtl, 0, 'the move debuff window spent out');
  run.enemies.push({ id: 1, x: p.x + p.speed, y: p.y, hp: 100, maxHp: 100, speed: 0, radius: 10, kind: 'zombie' });
  run.shotIn = 0.001;
  step(run, 0.05, {});
  assert.equal(run.projectiles[0]?.damage, 30, 'the expired buff no longer strengthens the brick');
  assert.equal(p.soldItems.psp, true, 'sold stays sold; only the buff expired');
  assert.equal(p.damage, 30, 'sheet damage never mutated');
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
