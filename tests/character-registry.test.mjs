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

test('Warrior is a registered controller running on the percentage core', () => {
  assert.ok(CHARACTERS.warrior, 'Warrior must be registered in the roster');
  assert.equal(CHARACTERS.warrior.id, 'warrior');
  const w = createRun(Math.random, 'warrior').player;
  // Stat sheet from the character md, translated to percentages of BASE_STATS:
  // life 85%, defense 100% (10 standard points), attack 80%, attackSpeed 90%,
  // attackDistance 120%, moveSpeed 3300% (normal game mobility).
  assert.equal(w.maxHp, 85);
  assert.equal(w.defense, 0.5);
  assert.equal(w.damage, 8);
  assert.equal(w.attackRange, 120 * UNIT_PX);
  assert.ok(Math.abs(w.shotInterval - 100 / 90) < 1e-9);
  assert.equal(w.speed, 165 * WORLD_SCALE);
  assert.equal(CHARACTERS.warrior.attack.device, 'shroom', 'his basic attack config lives in the sheet');
});

test('specials come from the character definition with unchanged durations and cooldowns', () => {
  assert.deepEqual(CHARACTERS.solago.specials.map(s => [s.key, s.duration, s.cooldown]),
    [['stand', 7, 26]]);
  assert.deepEqual(CHARACTERS.negro.specials.map(s => [s.key, s.duration, s.cooldown]),
    [['anime', 8, 18], ['chair', 6, 22]]);
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
