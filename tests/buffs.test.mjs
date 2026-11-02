import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine.mjs';
import { activeBuffs } from '../src/game/buffs.mjs';

const named = buffs => buffs.map(buff => buff.name);

test('a timed special is a buff while it lasts, with its remaining seconds', () => {
  const run = createRun(() => 0.5, 'negro');
  assert.deepEqual(activeBuffs(run.player, run), [], 'nothing is active before the first key');
  run.player.anime = 5.2;
  run.player.chair = 0;
  const buffs = activeBuffs(run.player, run);
  assert.deepEqual(named(buffs), ['Modo Otaku']);
  assert.equal(Math.ceil(buffs[0].seconds), 6);
  assert.equal(buffs[0].detail, 'waifu que dispara sola');
  run.player.anime = 0;
  assert.deepEqual(activeBuffs(run.player, run), [], 'an expired special stops being a buff');
});

test('El Negro shows the shield his still passive builds', () => {
  const run = createRun(() => 0.5, 'negro');
  assert.deepEqual(activeBuffs(run.player, run), []);
  run.player.shield = 12.4;
  const [shield] = activeBuffs(run.player, run);
  assert.equal(shield.name, 'ESCUDO');
  assert.equal(shield.detail, 'absorbe 12');
});

test('Solago names the permission and the laugh with what they give', () => {
  const run = createRun(() => 0.5, 'solago');
  run.player.permissionActive = 5;
  run.player.smile = 2;
  run.player.smileBlock = 30;
  const buffs = activeBuffs(run.player, run);
  const permission = buffs.find(buff => buff.id === 'permission');
  const smile = buffs.find(buff => buff.id === 'smile');
  assert.equal(permission.name, 'PERMISO');
  assert.equal(Math.ceil(permission.seconds), 5);
  assert.match(permission.detail, /\+30% DAÑO/);
  assert.match(permission.detail, /−28% INTERVALO/);
  assert.equal(smile.name, 'RISA');
  assert.equal(smile.detail, 'bloquea 30');
});

test('Warrior reports the smoke cloud while one is on the floor', () => {
  const run = createRun(() => 0.5, 'warrior');
  assert.deepEqual(activeBuffs(run.player, run), []);
  run.effects.push({ x: 0, y: 0, kind: 'smoke', r: 90, ttl: 3.2 });
  const [smoke] = activeBuffs(run.player, run);
  assert.equal(smoke.name, 'HUMO');
  assert.equal(Math.ceil(smoke.seconds), 4);
  assert.match(smoke.detail, /35%/);
  assert.match(smoke.detail, /20%/);
});

test('Papazito moves panic and the sale penalties into the buff list', () => {
  const run = createRun(() => 0.5, 'papazito');
  run.player.panicTtl = 5;
  run.player.sellMoveSlowTtl = 10;
  run.player.sellMoveSlowFrac = 0.15;
  const buffs = activeBuffs(run.player, run);
  const panic = buffs.find(buff => buff.id === 'panic');
  const slow = buffs.find(buff => buff.id === 'sellMoveSlowTtl');
  assert.equal(panic.name, 'PÁNICO');
  assert.match(panic.detail, /\+30% MOVIMIENTO/);
  assert.equal(slow.name, '−15% VELOCIDAD');
  assert.equal(Math.ceil(slow.seconds), 10);
  assert.doesNotMatch(run.player.characterDef.statusHud(run.player), /PÁNICO|VELOCIDAD/, 'the status panel keeps only the debt ledger');
});

test('Jhony reports Furia with its three multipliers', () => {
  const run = createRun(() => 0.5, 'jhony');
  run.player.fury = 4;
  run.player.guide = 8;
  const buffs = activeBuffs(run.player, run);
  const fury = buffs.find(buff => buff.id === 'fury');
  const guide = buffs.find(buff => buff.id === 'guide');
  assert.equal(fury.name, 'FURIA');
  assert.equal(Math.ceil(fury.seconds), 4);
  assert.match(fury.detail, /\+40% DAÑO/);
  assert.match(fury.detail, /\+25% CADENCIA/);
  assert.match(fury.detail, /−30% DEFENSA/);
  assert.equal(guide.detail, '+50% cadencia · 3 rebotes');
});

test('a ficha without buffs and no active special shows an empty list', () => {
  const run = createRun(() => 0.5, 'negro');
  assert.deepEqual(activeBuffs(run.player, run), []);
});

test('the HUD paints the buff list and hides the panel when nothing is active', async () => {
  const previousDocument = globalThis.document;
  const nodes = new Map();
  const getNode = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { style: {}, classList: { toggle() {} }, querySelector: () => ({ focus() {} }) });
    return nodes.get(selector);
  };
  globalThis.document = { querySelector: getNode };
  globalThis.window = globalThis.window ?? { matchMedia: () => ({ matches: false }) };
  const { state } = await import('../src/app/state.mjs');
  const { updateHUD } = await import('../src/game/hud.mjs');
  const previousRun = state.run;
  try {
    state.run = createRun(() => 0.5, 'solago');
    updateHUD();
    assert.equal(getNode('#buff-panel').hidden, true, 'no buffs, no panel');
    state.run.player.permissionActive = 5;
    updateHUD();
    assert.equal(getNode('#buff-panel').hidden, false);
    assert.match(getNode('#buff-panel').innerHTML, /PERMISO/);
    assert.match(getNode('#buff-panel').innerHTML, /5s/);
    assert.match(getNode('#buff-panel').innerHTML, /DAÑO/);
    state.run.player.permissionActive = 0;
    updateHUD();
    assert.equal(getNode('#buff-panel').hidden, true, 'an expired buff closes the panel');
    assert.equal(getNode('#buff-panel').innerHTML, '');
  } finally {
    state.run = previousRun;
    globalThis.document = previousDocument;
  }
});
