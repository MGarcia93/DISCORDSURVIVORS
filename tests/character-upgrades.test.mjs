import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, activateSpecial, sellBelonging } from '../src/engine.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';
import { LEVEL_UPGRADES } from '../src/reward-data.mjs';

const upgrade = id => LEVEL_UPGRADES.find(entry => entry.id === id);
const take = (run, id, rank = 1) => {
  for (let index = 0; index < rank; index++) {
    assert.equal(applyUpgradeRank(run, upgrade(id)), true, id);
  }
};

test('selected upgrades raise their accumulated bonus without exceeding the registry cap', () => {
  const run = createRun(() => 0.5, 'negro');
  take(run, 'rest-less');
  assert.equal(run.player.rewardBonuses.stillThreshold, 0.25);
  take(run, 'rest-less');
  assert.equal(run.player.rewardBonuses.stillThreshold, 0.5);
  const capped = createRun(() => 0.5, 'negro');
  take(capped, 'rest-less', upgrade('rest-less').ranks.length);
  assert.equal(capped.player.rewardBonuses.stillThreshold, 0.5);
});

test('Negro regeneration starts earlier after choosing the upgrade', () => {
  const base = createRun(() => 0.5, 'negro'), upgraded = createRun(() => 0.5, 'negro');
  take(upgraded, 'rest-less', 2);
  for (const run of [base, upgraded]) { run.spawnIn = run.shotIn = 1e6; run.player.hp = 80; }
  for (let index = 0; index < 39; index++) { step(base, 0.05, {}); step(upgraded, 0.05, {}); }
  assert.equal(base.player.hp, 80);
  assert.ok(upgraded.player.hp > 80);
});

test('Negro chair and waifu upgrades widen the real area and speed up real shots', () => {
  const base = createRun(() => 0.5, 'negro'), upgraded = createRun(() => 0.5, 'negro');
  take(upgraded, 'wider-chair', 2);
  take(upgraded, 'otaku-pace', 2);
  for (const run of [base, upgraded]) {
    run.spawnIn = run.shotIn = 1e6;
    run.enemies = [{ id: 1, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: run.player.x + 160, y: run.player.y, radius: 1, speed: 0 }];
    activateSpecial(run, 'chair');
    step(run, 0.01, {});
  }
  assert.equal(base.enemies[0].hp, 1e6);
  assert.ok(upgraded.enemies[0].hp < 1e6);
  for (const run of [base, upgraded]) {
    run.enemies = []; run.projectiles = []; run.animeIn = 0;
    activateSpecial(run, 'anime');
    step(run, 0.01, {});
  }
  assert.ok(base.animeIn > upgraded.animeIn);
});

test('Solago smile duration and Patrona radius change their real effects', () => {
  const run = createRun(() => 0.5, 'solago');
  take(run, 'longer-smile', 2);
  run.spawnIn = run.shotIn = 1e6;
  run.player.smileCooldown = 0;
  step(run, 0.01, {});
  assert.ok(Math.abs(run.player.smile - 3.5) < 1e-9);
  const wider = createRun(() => 0.5, 'solago');
  take(wider, 'wider-patrona', 2);
  for (const target of [run, wider]) {
    target.enemies = [{ id: 1, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: target.player.x + 190, y: target.player.y, radius: 1, speed: 0 }];
    target.standIn = 0;
    activateSpecial(target, 'stand');
    step(target, 0.01, {});
  }
  assert.equal(run.enemies[0].hp, 1e6);
  assert.ok(wider.enemies[0].hp < 1e6);
});

test('Warrior smoke and blast upgrades widen real clouds and mushroom splashes', () => {
  const run = createRun(() => 0.5, 'warrior');
  take(run, 'wider-smoke', 2);
  run.spawnIn = run.shotIn = 1e6;
  run.player.smokeCloudCooldown = 0;
  step(run, 0.01, {});
  const smoke = run.effects.findLast(effect => effect.kind === 'smoke');
  assert.ok(Math.abs(smoke.r - (90 * 1.1 + 40 * 1.1)) < 1e-9);
  const wide = createRun(() => 0.5, 'warrior');
  take(wide, 'wider-blast', 2);
  for (const target of [run, wide]) {
    const impact = { x: target.player.x, y: target.player.y };
    target.spawnIn = target.shotIn = 1e6;
    target.enemies = [
      { id: 1, kind: 'zombie', hp: 1e6, maxHp: 1e6, ...impact, radius: 1, speed: 0 },
      { id: 2, kind: 'zombie', hp: 1e6, maxHp: 1e6, x: impact.x + 95, y: impact.y, radius: 1, speed: 0 },
    ];
    target.projectiles.push({ x: impact.x, y: impact.y, target: 1, damage: 10, kind: 'shroom',
      hit: [], ttl: 3, angle: 0, attack: target.player.characterDef.attack });
    step(target, 0.05, {});
  }
  const splash = target => target.enemies.find(enemy => enemy.id === 2).hp;
  assert.equal(splash(run), 1e6);
  assert.ok(splash(wide) < 1e6);
});

test('Papazito sale-penalty upgrade softens real debuffs and stays capped', () => {
  const base = createRun(() => 0.5, 'papazito'), upgraded = createRun(() => 0.5, 'papazito');
  take(upgraded, 'softer-sale', 2);
  for (const run of [base, upgraded]) sellBelonging(run, 'psp');
  assert.ok(Math.abs(base.player.sellMoveSlowFrac - 0.15) < 1e-9);
  assert.ok(Math.abs(upgraded.player.sellMoveSlowFrac - 0.15 * 0.8) < 1e-9);
  const capped = createRun(() => 0.5, 'papazito');
  take(capped, 'softer-sale', upgrade('softer-sale').ranks.length);
  assert.equal(capped.player.rewardBonuses.salePenalty, 0.2);
});

test('every new entry is data-only, reachable and within its effect cap', () => {
  for (const entry of LEVEL_UPGRADES.filter(item => item.ranks[0].effects)) {
    for (const rank of entry.ranks) {
      for (const effect of rank.effects) {
        assert.equal(typeof effect.type, 'string');
        assert.ok(Number.isFinite(effect.value));
      }
    }
  }
  const ids = new Set(LEVEL_UPGRADES.map(entry => entry.id));
  assert.equal(ids.size, LEVEL_UPGRADES.length);
});
