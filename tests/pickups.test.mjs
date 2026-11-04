import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { ROSTER } from '../src/characters/index.mjs';
import { DEFAULT_CATALOG } from '../src/reward-data.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';
import { getAct } from '../src/campaign/acts.mjs';
import {
  DROP_HEAL, PICKUP_TTL, PICKUPS, collectPickups, dropChance, dropHeal, pickupFor,
} from '../src/pickups.mjs';

// The run picture is a pure function of a run and a context, so the renderer
// only needs a document for the module graph, never a real canvas.
const realDocument = globalThis.document;
const realWindow = globalThis.window;
globalThis.document = { querySelector: () => null };
globalThis.window = { matchMedia: () => ({ matches: false }) };
const { drawRunScene } = await import('../src/game/renderer.mjs');
globalThis.document = realDocument;
globalThis.window = realWindow;

const act = order => getAct(`act-0${order}`);
// A quiet run: no spawns, no shots in flight, so the only thing on stage is
// whatever the test puts there.
function quietRun(random = () => 0.5, character = 'negro', order = 1) {
  const run = createRun(random, character, {}, act(order));
  run.spawnIn = 100;
  return run;
}

function dyingEnemy(run) {
  // Far enough that the corpse (and its drop) stays out of the player's reach:
  // these tests are about the roll, not about collection.
  run.enemies.push({ id: 1, x: 760, y: 340, hp: 1, maxHp: 10, speed: 0, radius: 15, kind: 'zombie', defense: 0 });
  for (let i = 0; i < 20 && run.kills === 0; i++) step(run, 0.05, {});
  return run;
}

test('every ficha leaves its own object and no two share one', () => {
  const objects = ROSTER.map(character => pickupFor(character.id));
  assert.equal(objects.length, 6);
  assert.equal(new Set(objects.map(object => object.id)).size, 6);
  for (const object of objects) {
    assert.equal(typeof object.label, 'string');
    assert.equal(typeof object.draw, 'function');
  }
  assert.equal(pickupFor('negro').id, 'kuromi');
  assert.equal(pickupFor('jhony').id, 'whisky');
  assert.equal(pickupFor('nobody'), PICKUPS.negro, 'an unknown ficha falls back instead of dropping nothing');
});

test('the first world drops almost nothing and later worlds pay more', () => {
  // The ceiling is only reached with a missing-health body: at full life every
  // world pays exactly zero.
  const chance = order => {
    const run = quietRun(() => 0.5, 'negro', order);
    run.player.hp = run.player.maxHp / 2;
    return dropChance(run);
  };
  assert.ok(chance(1) < 0.05, `act one is rare (${chance(1)})`);
  assert.ok(chance(1) < chance(2) && chance(2) < chance(3));
  assert.ok(chance(3) < chance(6));
});

test('a full bar never drops, and the chance grows as health falls', () => {
  const run = quietRun();
  const healthy = dropChance(run);
  run.player.hp = run.player.maxHp / 2;
  const hurt = dropChance(run);
  run.player.hp = 1;
  const dying = dropChance(run);
  assert.equal(healthy, 0, 'no rescue is written for a healthy body');
  assert.ok(healthy < hurt && hurt < dying);
  assert.ok(dying <= 0.25, `a dying body still misses most kills (${dying})`);
});

test('a kill that rolls the drop leaves the object on the floor', () => {
  const run = quietRun(() => 0.001);
  run.player.hp = run.player.maxHp / 2;
  dyingEnemy(run);
  assert.equal(run.kills, 1);
  assert.equal(run.pickups.length, 1);
  assert.equal(run.pickups[0].character, 'negro');
});

test('a kill that misses the roll leaves nothing', () => {
  const run = quietRun(() => 0.5);
  dyingEnemy(run);
  assert.equal(run.kills, 1);
  assert.equal(run.pickups.length, 0);
});

test('a fresh drop arms before it can be taken', () => {
  const run = quietRun(() => 0.001);
  run.player.hp = run.player.maxHp / 2;
  run.player.hp = run.player.maxHp - 40;
  dyingEnemy(run);
  const pickup = run.pickups[0];
  run.player.x = pickup.x;
  run.player.y = pickup.y;
  step(run, 0.05, {});
  assert.equal(run.pickups.length, 1, 'the drop is visible for a moment before it is swallowed');
  for (let i = 0; i < 8; i++) step(run, 0.05, {});
  assert.equal(run.pickups.length, 0, 'and then the body takes it');
});

test('the Administrator writes once per run, on the first drop', () => {
  const run = quietRun(() => 0.001);
  run.player.hp = run.player.maxHp / 2;
  const kill = id => {
    run.enemies.push({ id, x: 760, y: 340, hp: 1, maxHp: 10, speed: 0, radius: 15, kind: 'zombie', defense: 0 });
    for (let i = 0; i < 20; i++) step(run, 0.05, {});
  };
  kill(1);
  assert.deepEqual(run.lootNotice, { character: 'negro' });
  assert.equal(run.lootSeen, true, 'the first drop introduces the mechanic');
  delete run.lootNotice; // the shell consumed it
  kill(2);
  assert.equal(run.lootNotice, undefined, 'the second drop does not write again');
  assert.equal(run.lootSeen, true, 'the mechanic stays introduced');
  assert.equal(run.pickups.length, 2, 'both drops still fall');
});

test('walking over the object heals, caps at the top and consumes it', () => {
  const run = quietRun();
  run.player.hp = run.player.maxHp - 20;
  run.pickups.push({ character: 'negro', x: run.player.x, y: run.player.y, ttl: PICKUP_TTL });
  step(run, 0.05, {});
  assert.equal(run.player.hp, run.player.maxHp - 20 + DROP_HEAL);
  assert.equal(run.pickups.length, 0);
  const heal = run.effects.find(effect => effect.kind === 'pickup');
  assert.equal(heal.text, `+${DROP_HEAL}`);
});

test('the last sliver of life is never overhealed', () => {
  const run = quietRun();
  run.player.hp = run.player.maxHp - 3;
  run.pickups.push({ character: 'negro', x: run.player.x, y: run.player.y, ttl: PICKUP_TTL });
  collectPickups(run, 0.05);
  assert.equal(run.player.hp, run.player.maxHp);
});

test('at full health the object waits instead of being wasted', () => {
  const run = quietRun();
  run.pickups.push({ character: 'negro', x: run.player.x, y: run.player.y, ttl: PICKUP_TTL });
  step(run, 0.05, {});
  assert.equal(run.pickups.length, 1);
  run.player.hp -= 5;
  step(run, 0.05, {});
  assert.equal(run.pickups.length, 0);
  assert.equal(run.player.hp, run.player.maxHp);
});

test('an object nobody reaches expires', () => {
  const run = quietRun();
  run.pickups.push({ character: 'solago', x: 100, y: 100, ttl: PICKUP_TTL });
  for (let i = 0; i < Math.ceil(PICKUP_TTL / 0.05) + 2; i++) step(run, 0.05, {});
  assert.equal(run.pickups.length, 0);
});

test('the upgrade raises the chance and the heal', () => {
  const run = quietRun();
  run.player.hp = run.player.maxHp / 2;
  const entry = DEFAULT_CATALOG.upgrades.find(item => item.id === 'loot');
  assert.ok(entry, 'the drop upgrade ships in the catalog');
  assert.equal(entry.characters, 'all');
  const chance = dropChance(run);
  const heal = dropHeal(run);
  for (let rank = 0; rank < entry.ranks.length; rank++) {
    assert.equal(applyUpgradeRank(run, entry), true, `rank ${rank + 1} applies`);
  }
  assert.ok(dropChance(run) > chance);
  assert.ok(dropHeal(run) > heal);
  assert.equal(applyUpgradeRank(run, entry), false, 'the last rank is the cap');
});

test('the wave boundary clears the floor', () => {
  const run = quietRun();
  run.pickups.push({ character: 'negro', x: 200, y: 200, ttl: PICKUP_TTL });
  run.time = run.duration - 0.01;
  step(run, 0.05, {});
  assert.equal(run.phase, 'shop');
  assert.equal(run.pickups.length, 0);
});

test('every object carries the black and the light outline', () => {
  const INK = '#0d0b12';
  const LIGHT = '#f2ede0';
  for (const character of ROSTER) {
    const colors = [];
    const ctx = {
      save() {}, restore() {}, translate() {}, scale() {}, imageSmoothingEnabled: false, fillRect() {},
      set fillStyle(value) { colors.push(value); },
      get fillStyle() { return colors[colors.length - 1]; },
    };
    pickupFor(character.id).draw(ctx, 0, 0, { scale: 2, bob: 0 });
    assert.ok(colors.includes(LIGHT), `${character.id} needs the light ring for a dark floor`);
    assert.ok(colors.includes(INK), `${character.id} needs the black ring for a light floor`);
  }
});

test('the outline never closes the chipá hole', () => {
  const ring = [];
  const ctx = {
    save() {}, restore() {}, translate() {}, scale() {}, imageSmoothingEnabled: false,
    fillRect(x, y, w, h) { ring.push({ x, y, w, h, color: this.fillStyle }); },
    fillStyle: '#ffffff',
  };
  pickupFor('papazito').draw(ctx, 0, 0, { scale: 1, bob: 0 });
  const outlines = ring.filter(cell => cell.color === '#0d0b12' || cell.color === '#f2ede0');
  for (const cell of outlines) {
    const intersects = cell.x <= 1 && cell.x + cell.w > -2 && cell.y <= -8 && cell.y + cell.h > -9;
    assert.equal(intersects, false, 'the hole shows the floor, it never gets a frame');
  }
});

test('the object reaches the canvas', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'canvas' ? null : (...args) => { calls.push([key, ...args]); return 0; },
    set: () => true,
  });
  const run = quietRun();
  run.enemies.length = 0;
  run.effects.length = 0;
  run.projectiles.length = 0;
  drawRunScene(ctx, run);
  const baseline = calls.length;
  run.pickups = [{ character: 'papazito', x: 400, y: 300, ttl: 5 }];
  drawRunScene(ctx, run);
  assert.ok(calls.length > baseline, 'the drop has to be painted, not only collected');
});
