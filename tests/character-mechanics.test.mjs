import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, activateSpecial, startNextWave } from '../src/engine.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';
import { LEVEL_UPGRADES } from '../src/reward-data.mjs';

const upgrade = id => LEVEL_UPGRADES.find(entry => entry.id === id);
const take = (run, id, rank = 1) => {
  for (let index = 0; index < rank; index++) {
    assert.equal(applyUpgradeRank(run, upgrade(id)), true, `${id} rank ${index + 1}`);
  }
};
const enemy = (run, id, offsetX, extra = {}) => {
  const target = { id, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: run.player.x + offsetX,
    y: run.player.y, radius: 1, speed: 0, ...extra };
  run.enemies.push(target);
  return target;
};

test('standing still builds a shield that absorbs contact damage before health', () => {
  const run = createRun(() => 0.5, 'negro');
  take(run, 'standing-shield', 2);
  run.spawnIn = run.shotIn = 1e6;
  for (let index = 0; index < 80; index++) step(run, 0.05, {});
  assert.ok(run.player.shield > 30, `shield ${run.player.shield}`);
  const before = run.player.hp;
  run.enemies.push({ id: 99, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: run.player.x, y: run.player.y,
    radius: 20, speed: 0, attackRange: 40, attackInterval: 0.4 });
  step(run, 0.05, {});
  assert.ok(run.player.shield < 45);
  assert.equal(run.player.hp, before, 'the shield took the hit');
});

test('without the upgrade the player has no shield at all', () => {
  const run = createRun(() => 0.5, 'negro');
  run.spawnIn = run.shotIn = 1e6;
  for (let index = 0; index < 80; index++) step(run, 0.05, {});
  assert.equal(run.player.shield ?? 0, 0);
});

test('waifu shots pierce one extra enemy only after choosing it', () => {
  const hits = pierced => {
    const run = createRun(() => 0.5, 'negro');
    if (pierced) take(run, 'otaku-pierce', 2);
    run.spawnIn = run.shotIn = 1e6;
    const first = enemy(run, 1, 60), second = enemy(run, 2, 90);
    run.projectiles.push({ x: first.x, y: first.y, target: 1, damage: 10, kind: 'magic',
      hit: [], ttl: 3, angle: 0 });
    for (let index = 0; index < 6; index++) step(run, 0.02, { x: -1 });
    return { first: first.hp, second: second.hp };
  };
  const plain = hits(false), strong = hits(true);
  assert.equal(plain.first, 1e6 - 10);
  assert.equal(plain.second, 1e6);
  assert.equal(strong.first, 1e6 - 10);
  assert.ok(strong.second < 1e6, 'the second enemy is hit by the pierced shot');
});

test('bite arc reaches extra enemies in range with reduced damage', () => {
  const run = createRun(() => 0.5, 'solago');
  take(run, 'bite-arc', 2);
  run.spawnIn = 1e6; run.shotIn = 0;
  const first = enemy(run, 1, 20), second = enemy(run, 2, 40), third = enemy(run, 3, 60);
  step(run, 0.02, {});
  assert.ok(first.hp < 1e6);
  assert.ok(second.hp < 1e6);
  assert.ok(third.hp < 1e6);
  assert.ok(1e6 - first.hp > 1e6 - second.hp, 'the closest enemy takes full damage');
});

test('Patrona finisher deals a last burst when she leaves', () => {
  const run = createRun(() => 0.5, 'solago');
  take(run, 'patrona-final', 2);
  run.spawnIn = run.shotIn = 1e6;
  const target = enemy(run, 1, 120);
  activateSpecial(run, 'stand');
  let finisherText = false;
  for (let index = 0; index < 200; index++) {
    step(run, 0.05, {});
    if (run.effects.some(effect => effect.text === '¡TIJERETAZO FINAL!')) finisherText = true;
  }
  assert.equal(run.player.stand, 0);
  assert.ok(target.hp < 1e6, 'the finisher hit the enemy');
  assert.equal(finisherText, true);
});

test('mushroom blasts apply extra confusion and hit harder inside smoke', () => {
  const spray = upgraded => {
    const run = createRun(() => 0.5, 'warrior');
    if (upgraded) {
      take(run, 'deeper-confusion', 1);
      take(run, 'smoked-mushrooms', 2);
    }
    run.spawnIn = run.shotIn = 1e6;
    const direct = enemy(run, 1, 40);
    const smoked = enemy(run, 2, 60, { smokeIn: 1 });
    run.projectiles.push({ x: direct.x, y: direct.y, target: 1, damage: 10, kind: 'shroom',
      hit: [], ttl: 3, angle: 0, attack: { blast: { radius: 80 * 1.1, stacks: 1, ttl: 5.4 } } });
    step(run, 0.02, {});
    return { direct, smoked };
  };
  const plain = spray(false), strong = spray(true);
  assert.equal(plain.direct.confusionStacks, 1);
  assert.equal(strong.direct.confusionStacks, 2, 'extra stack applied');
  assert.ok(1e6 - strong.smoked.hp > 1e6 - plain.smoked.hp, 'smoke bonus increased the splash damage');
});

test('bricks pierce and shatter into fragments after their impact', () => {
  const run = createRun(() => 0.5, 'papazito');
  take(run, 'brick-pierce', 1);
  take(run, 'brick-shards', 1);
  run.spawnIn = run.shotIn = 1e6;
  const first = enemy(run, 1, 40);
  enemy(run, 2, 70);
  run.projectiles.push({ x: first.x, y: first.y, target: 1, damage: 10, kind: 'brick',
    hit: [], ttl: 3, angle: 0 });
  for (let index = 0; index < 8; index++) step(run, 0.02, { x: -1 });
  assert.ok(run.projectiles.some(shot => shot.vx !== undefined), 'fragments were spawned');
  const second = run.enemies.find(entry => entry.id === 2);
  assert.ok(second.hp < 1e6, 'the brick pierced to the next enemy');
});

test('every new mechanic is a data-only entry with its own rank cap', () => {
  for (const id of ['standing-shield', 'otaku-pierce', 'bite-arc', 'patrona-final',
    'deeper-confusion', 'smoked-mushrooms', 'brick-pierce', 'brick-shards']) {
    assert.ok(upgrade(id), `${id} exists`);
  }
  const run = createRun(() => 0.5, 'negro');
  take(run, 'standing-shield', 2);
  assert.equal(applyUpgradeRank(run, upgrade('standing-shield')), false, 'rank cap respected');
});

test('new mechanics survive the wave boundary and stay unselected without choices', () => {
  const run = createRun(() => 0.5, 'papazito');
  assert.equal(run.player.rewardBonuses.waifuPierce, undefined);
  run.time = run.duration;
  step(run, 0, {});
  assert.equal(run.phase, 'shop');
  while (run.pendingLevels.length) {
    const own = run.levelChoices.find(entry => entry.characters === 'papazito') ?? run.levelChoices[0];
    assert.equal(run.rewardCatalog.upgrades.some(entry => entry.id === own.id), true);
    assert.equal(applyUpgradeRank(run, own), true);
    run.pendingLevels.shift();
  }
  assert.equal(startNextWave(run), true);
  assert.equal(run.phase, 'playing');
});
