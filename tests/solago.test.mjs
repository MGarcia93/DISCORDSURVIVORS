import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, step, activateSpecial } from '../src/engine.mjs';
import { UNIT_PX } from '../src/stats.mjs';
import { createStatState, resolveStatState, withStatSource, applyStatState } from '../src/stat-modifiers.mjs';
import { enemyAttackRange } from '../src/enemies/index.mjs';

test('Solago is the tanky melee: more health and defense than the baseline, a little faster, and no projectiles', () => {
  const run = createRun(() => 0.5, 'solago');
  const negro = createRun(() => 0.5, 'negro');
  const p = run.player;
  assert.equal(p.maxHp, 150);
  assert.ok(p.speed > negro.player.speed, 'she moves a little faster than the tank');
  assert.equal(p.defense, 0.225);
  assert.equal(p.damage, 44);
  assert.equal(p.attackRange, 83 * UNIT_PX);
  assert.equal(p.attackFlash, 0);
  assert.ok(p.hitRadius < negro.player.hitRadius, 'Solago has a narrower collision box than the tank');
  run.spawnIn = 100;
  run.enemies.push({ id: 1, x: p.x + p.attackRange - 4, y: p.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  step(run, 0.05, { x: 1, y: 1 });
  assert.equal(run.enemies[0].hp, 500 - p.damage);
  assert.equal(run.projectiles.length, 0);
  assert.ok(p.attackFlash > 0, 'A successful bite starts its attack animation');
});

test('every bite shoves its target out of reach, so she has to step after it', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const target = { id: 1, x: run.player.x + 40, y: run.player.y, hp: 5000, maxHp: 5000, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(target);
  const before = target.x;
  step(run, 0.05, {});
  assert.ok(target.x > before + 10, 'the bite pushes the body away');
  run.player.rewardBonuses.knockback = 25;
  const pushed = target.x;
  run.shotIn = 0;
  step(run, 0.05, {});
  assert.equal(target.x, pushed, 'a body has a shove cooldown: no pinning it at arm length');
  run.elapsed += 1.2;
  run.shotIn = 0;
  step(run, 0.05, {});
  assert.ok(target.x - pushed > 30, 'and once the cooldown passes the heavier shove lands');
});

test('Mordida de paleta cannot hit outside its reduced melee reach', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  run.enemies.push({ id: 1, x: run.player.x + run.player.attackRange + 20, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  step(run, 0.05, {});
  assert.equal(run.enemies[0].hp, 500);
});

test('Solago narrow hitbox avoids a graze that still reaches El Negro', () => {
  const negro = createRun(() => 0.5, 'negro');
  const solago = createRun(() => 0.5, 'solago');
  for (const run of [negro, solago]) {
    run.spawnIn = 100;
    run.shotIn = 100;
    run.enemies.push({ id: 1, x: run.player.x + 36, y: run.player.y, hp: 500, maxHp: 500, speed: 0, radius: 17 * WORLD_SCALE, kind: 'zombie' });
    step(run, 0.05, {});
  }
  assert.ok(negro.player.hp < negro.player.maxHp);
  assert.equal(solago.player.hp, solago.player.maxHp);
});

test('Sonrisa blindada blocks the hit instead of raising her defense', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const p = run.player;
  p.smileCooldown = 0;
  // The bite would shove the zombie out of contact: this case is about the hit.
  run.shotIn = 100;
  run.enemies.push({ id: 1, x: p.x + 25, y: p.y, hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
  step(run, 0.05, {});
  assert.ok(p.smile > 0, 'the smile is on');
  const block = 40;
  const absorbed = 12 * (1 - p.defense);
  assert.ok(Math.abs(p.shield - (block - absorbed)) < 1e-9, 'the shield pays what the body would have taken');
  assert.equal(p.hp, p.maxHp, 'and the body takes none of it');
  assert.equal(p.characterDef.contactDefenseBonus, undefined, 'no defense bonus is stacked on top');

  // The block ends with the smile: what nobody used is gone.
  run.enemies = [];
  p.smileCooldown = 10;
  for (let frame = 0; frame < 80; frame++) step(run, 0.05, {});
  assert.equal(p.smile, 0);
  assert.equal(p.shield, 0);
  assert.equal(p.hp, p.maxHp);
});

test('every kill feeds her a mouthful, never past her ceiling', () => {
  const run = createRun(() => 0.5, 'solago');
  const p = run.player;
  p.hp = 50;
  p.characterDef.onKill(run, p, {}, {});
  assert.equal(p.hp, 54, 'a bite that lands a kill gives 4 back');
  p.hp = p.maxHp - 1;
  p.characterDef.onKill(run, p, {}, {});
  assert.equal(p.hp, p.maxHp);
});

test('six chore-task kills trigger a temporary damage and attack-speed buff', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const p = run.player;
  for (let id = 1; id <= 6; id++) {
    run.enemies.push({ id, x: p.x + p.attackRange - 4, y: p.y, hp: 1, maxHp: 1, speed: 0, radius: 8, kind: 'zombie' });
  }
  for (let i = 0; i < 130; i++) step(run, 0.05, {});
  assert.equal(run.kills, 6);
  assert.equal(p.taskKills, 0);
  assert.ok(p.permissionActive > 0);
  assert.ok(p.permissionNeeded > 0);
});

test('the range build never outranges a ranged enemy: her reach has a ceiling', () => {
  const run = createRun(() => 0.5, 'solago');
  const p = run.player;
  const stacked = withStatSource(createStatState(p), 'probe',
    [{ stat: 'attackDistance', operation: 'percent', value: 500 }]);
  applyStatState(p, stacked);
  assert.ok(p.attackRange <= 155 * UNIT_PX + 1e-9, 'the stack cannot push her past her ceiling');
  assert.ok(p.attackRange < enemyAttackRange('alchemist'), 'the shortest ranged enemy still reaches her');
  assert.ok(p.attackRange < enemyAttackRange('archer'), 'and so does the longest one');

  // A character that declares no ceiling keeps the whole stack: this is hers,
  // not a global rule.
  const negro = createRun(() => 0.5, 'negro');
  const wide = resolveStatState(withStatSource(createStatState(negro.player), 'probe',
    [{ stat: 'attackDistance', operation: 'percent', value: 10 }]));
  assert.ok(wide.attackRange > negro.player.attackRange, 'El Negro still grows with the same item');
});

test('the woman covers her: Solago never bites while La Patrona is on stage', () => {
  const arena = () => {
    const run = createRun(() => 0.5, 'solago');
    run.spawnIn = 100;
    const p = run.player;
    p.hp = p.maxHp = 1e9;
    run.enemies.push({ id: 1, x: p.x + 40, y: p.y, hp: 5000, maxHp: 5000, speed: 0, radius: 12, kind: 'skeleton' });
    run.shotIn = 0;
    return run;
  };
  // On her own the bite lands...
  const alone = arena();
  step(alone, 0.05, {});
  assert.ok(alone.player.attackFlash > 0, 'she bites when she is the one fighting');

  // ...and while the patrona is out she just covers up.
  const covered = arena();
  assert.equal(activateSpecial(covered, 'stand'), true);
  step(covered, 0.05, {});
  assert.equal(covered.player.attackFlash, 0, 'she is crouched, not biting');
  assert.ok(covered.enemies[0].hp < 5000, 'the patrona is the one landing the hits');
});

test('the ring reaches past the longest ranged reach', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const p = run.player;
  p.hp = p.maxHp = 1e9;
  // An archer parked at its own reach: it never walks any closer than this.
  const archer = { id: 1, x: p.x + enemyAttackRange('archer'), y: p.y, hp: 500, maxHp: 500,
    speed: 0, radius: 12, kind: 'archer', attackRange: enemyAttackRange('archer') };
  run.enemies.push(archer);
  activateSpecial(run, 'stand');
  step(run, 0.05, {});
  assert.ok(archer.hp < 500, 'the scissors reach where the arrows come from');
});

test('one stand clears the trash and never the boss', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  run.shotIn = 1e9;
  const p = run.player;
  p.hp = p.maxHp = 1e9;
  const trash = { id: 1, x: p.x + 120, y: p.y, hp: 370, maxHp: 370, speed: 0, radius: 20, kind: 'burningElite' };
  const boss = { id: 2, x: p.x - 120, y: p.y, hp: 2200, maxHp: 2200, speed: 0, radius: 38, kind: 'alarmZombie', boss: true };
  run.enemies.push(trash, boss);
  assert.equal(activateSpecial(run, 'stand'), true);
  for (let i = 0; i < 150; i++) step(run, 0.05, {});
  assert.ok(trash.hp <= 0, 'the trash dies');
  assert.ok(boss.hp > 0, 'the boss is still standing');
});

test('La Patrona takes the hits: nothing reaches Solago while she is on stage', () => {
  const arena = () => {
    const run = createRun(() => 0.5, 'solago');
    run.spawnIn = 100;
    run.shotIn = 100;
    const p = run.player;
    run.enemies.push({ id: 1, x: p.x + 25, y: p.y, hp: 5000, maxHp: 5000, speed: 0, radius: 10, kind: 'zombie' });
    return run;
  };
  // The same body lands its swing when she is not on stage...
  const plain = arena();
  for (let i = 0; i < 20; i++) step(plain, 0.05, {});
  assert.ok(plain.player.hp < plain.player.maxHp, 'the walker reaches the body');

  // ...and nothing lands while she is on it.
  const guarded = arena();
  assert.equal(activateSpecial(guarded, 'stand'), true);
  const before = guarded.player.hp;
  for (let i = 0; i < 20; i++) step(guarded, 0.05, {});
  assert.equal(guarded.player.hp, before, 'La Patrona eats every hit while she is on stage');
  assert.ok(guarded.player.stand > 0, 'the window is still open');
});

test('La Patrona holds Solago still, deals area damage, and nicks him when she leaves', () => {
  const run = createRun(() => 0.5, 'solago');
  run.spawnIn = 100;
  const p = run.player;
  const enemy = { id: 1, x: p.x + 100, y: p.y, hp: 1000, maxHp: 1000, speed: 0, radius: 12, kind: 'zombie' };
  run.enemies.push(enemy);
  assert.equal(activateSpecial(run, 'stand'), true);
  assert.ok(p.stand > 0);
  const startX = p.x;
  const startY = p.y;
  step(run, 0.05, { x: 1, y: 1 });
  assert.equal(p.x, startX);
  assert.equal(p.y, startY);
  assert.ok(enemy.hp < 1000);
  p.stand = 0.05;
  p.standCooldown = 10;
  step(run, 0.05, {});
  assert.equal(p.hp, p.maxHp - 15, 'the exit costs her 15 health, whatever her sheet says');
  assert.equal(p.x, startX);
  assert.equal(p.y, startY);
  assert.equal(activateSpecial(run, 'stand'), false);
  assert.equal(activateSpecial(run, 'anime'), false);
});
