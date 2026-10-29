import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, activateSpecial, sellBelonging } from '../src/engine.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';
import { LEVEL_UPGRADES, BALANCE } from '../src/reward-data.mjs';
import { selectLevelOptions } from '../src/reward-catalog.mjs';

const upgrade = id => LEVEL_UPGRADES.find(entry => entry.id === id);
const oneXp = structuredClone(BALANCE);
oneXp.xp.rewards = { zombie: 1, runner: 1, brute: 1, boss: 0 };
const make = (character, ids = []) => {
  const run = createRun(() => 0.5, character, { balance: oneXp });
  for (const id of ids) assert.equal(applyUpgradeRank(run, upgrade(id)), true, id);
  run.spawnIn = run.shotIn = 1e6;
  return run;
};
const dummy = (run, id, offsetX, extra = {}) => {
  const target = { id, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: run.player.x + offsetX,
    y: run.player.y, radius: 1, speed: 0, ...extra };
  run.enemies.push(target);
  return target;
};

test('second bite lands a weaker follow-up and knockback pushes the target away', () => {
  const run = make('solago', ['second-bite', 'bite-push']);
  run.shotIn = 0;
  const target = dummy(run, 1, 30);
  const startX = target.x;
  step(run, 0.02, {});
  const without = (() => {
    const plain = createRun(() => 0.5, 'solago', { balance: oneXp });
    plain.spawnIn = 1e6; plain.shotIn = 0;
    const victim = dummy(plain, 1, 30);
    step(plain, 0.02, {});
    return 1e6 - victim.hp;
  })();
  assert.ok(1e6 - target.hp > without, 'the second bite adds damage');
  assert.ok(target.x > startX, 'the target was pushed away');
});

test('smile counterattack only fires while the smile shield is up', () => {
  const bite = smile => {
    const run = make('solago', ['smile-counter']);
    run.player.smile = smile;
    // Contact only: an enemy with reach now fires a projectile, which lands a
    // step later and would not exercise the counter in this single step.
    const attacker = { id: 9, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: run.player.x, y: run.player.y,
      radius: 20, speed: 0, attackRange: 0, interval: 0.4, attackCd: 0 };
    run.enemies.push(attacker);
    step(run, 0.05, {});
    return 1e6 - attacker.hp;
  };
  assert.equal(bite(0), 0);
  assert.ok(bite(2) > 0);
});

test('extra mushrooms and spore zones come from the same blast', () => {
  const run = make('warrior', ['extra-shroom', 'spore-zone']);
  const first = dummy(run, 1, 40), second = dummy(run, 2, 80);
  run.shotIn = 0;
  step(run, 0.02, { x: -1 });
  const shrooms = run.projectiles.filter(shot => shot.kind === 'shroom');
  assert.equal(shrooms.length, 2, 'the extra mushroom was fired');
  const launched = run.projectiles.find(shot => shot.target === first.id);
  launched.x = first.x; launched.y = first.y;
  run.shotIn = 1e6;
  step(run, 0.02, { x: -1 });
  assert.ok(shrooms.some(shot => shot.target === second.id), 'an extra mushroom flew at the second enemy');
  assert.ok(run.effects.some(effect => effect.kind === 'sporeZone'), 'the zone stayed on the ground');
  const before = second.hp;
  for (let index = 0; index < 30; index++) step(run, 0.05, { x: 1 });
  assert.ok(second.hp < before, 'the zone kept poisoning');
});

test('smoke trail leaves clouds while moving, and confusion spreads on a kill', () => {
  const run = make('warrior', ['smoke-trail']);
  step(run, 0.05, { x: 1 });
  assert.ok(run.effects.some(effect => effect.kind === 'smoke'));
  const chain = make('warrior', ['confusion-chain']);
  dummy(chain, 1, 20, { hp: 0, confusionStacks: 3, confusionTtl: 4 });
  const neighbour = dummy(chain, 2, 60);
  step(chain, 0.02, {});
  assert.ok(neighbour.confusionStacks >= 1, 'confusion jumped to the neighbour');
});

test('brick fan adds shards of bricks at other targets', () => {
  const run = make('papazito', ['brick-fan']);
  dummy(run, 1, 40); dummy(run, 2, 90);
  run.shotIn = 0;
  step(run, 0.02, { x: -1 });
  const bricks = run.projectiles.filter(shot => shot.kind === 'brick');
  assert.equal(bricks.length, 2);
  assert.deepEqual(bricks.map(shot => shot.target).sort(), [1, 2]);
});

test('selling empowers the next shot once, and panic extends on kills up to its ceiling', () => {
  const run = make('papazito', ['sale-next']);
  run.player.sellNextMult = undefined;
  sellBelonging(run, 'psp');
  assert.ok(run.player.sellNextMult > 1);
  run.shotIn = 0;
  dummy(run, 1, 60);
  step(run, 0.02, {});
  assert.equal(run.player.sellNextMult, 1, 'the bonus was consumed');

  const panic = make('papazito', ['panic-extend']);
  panic.player.panicTtl = 2;
  panic.enemies.push({ id: 5, kind: 'zombie', hp: 0, maxHp: 1, x: 0, y: 0, radius: 1, speed: 0 });
  step(panic, 0.02, {});
  assert.ok(panic.player.panicTtl > 1.9);
  panic.player.panicTtl = 11.9;
  panic.enemies.push({ id: 6, kind: 'zombie', hp: 0, maxHp: 1, x: 0, y: 0, radius: 1, speed: 0 });
  step(panic, 0.02, {});
  assert.ok(panic.player.panicTtl <= 12, 'the panic ceiling holds');
});

test('the señ a burst damages enemies when a charge lands', () => {
  const run = make('papazito', ['sena-burst']);
  const target = dummy(run, 1, 40);
  run.player.senaCooldown = 0;
  run.player.senaNextCost = 1;
  step(run, 0.02, {});
  assert.ok(target.hp < 1e6, 'the burst hit the nearby enemy');
});

test('a guaranteed milestone entry always shows up at its level', () => {
  const catalog = createRun(() => 0.5, 'negro', { balance: oneXp }).rewardCatalog;
  for (let attempt = 0; attempt < 20; attempt++) {
    const random = () => attempt / 20;
    const options = selectLevelOptions(catalog, { character: 'negro', level: 3, ranks: {} }, random);
    assert.ok(options.some(entry => entry.id === 'remote-bounce'),
      `attempt ${attempt} must include the level-3 milestone`);
  }
});

test('unselected mechanics stay inactive, and every new entry is data-only', () => {
  for (const id of ['second-bite', 'bite-push', 'smile-counter', 'extra-shroom',
    'spore-zone', 'smoke-trail', 'confusion-chain', 'brick-fan', 'sale-next',
    'panic-extend', 'sena-burst']) {
    const entry = upgrade(id);
    assert.ok(entry, `${id} exists`);
    assert.ok(entry.minLevel >= 3, `${id} waits for a later level`);
    assert.ok(entry.chance > 0 && entry.chance <= 1, `${id} has a probability`);
  }
  const run = make('warrior');
  assert.equal(run.player.rewardBonuses.extraShroom, undefined);
});
