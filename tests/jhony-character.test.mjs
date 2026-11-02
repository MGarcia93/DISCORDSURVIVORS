import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_SCALE, createRun, activateSpecial, step } from '../src/engine.mjs';
import { UNIT_PX } from '../src/stats.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';
import { DEFAULT_CATALOG, EFFECTS } from '../src/reward-data.mjs';
import { describeReward, selectLevelOptions } from '../src/reward-catalog.mjs';
import { applyUpgradeRank } from '../src/run-rewards.mjs';
import { rewardEffectTotals } from '../src/game/reward-view.mjs';

// `?playtest` style isolation: no spawner, no stray enemies, so every assertion
// is about the ficha and not about the wave.
function solo(random = () => 0.5) {
  const run = createRun(random, 'jhony');
  run.spawnIn = 100;
  run.shotIn = 100;
  return run;
}

function dummy(run, dx, hp = 200) {
  const p = run.player;
  const enemy = { id: run.enemies.length + 1, x: p.x + dx, y: p.y, hp, maxHp: hp, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(enemy);
  return enemy;
}

test('Jhony runs on the percentage core with the sheet from the character doc', () => {
  const p = createRun(Math.random, 'jhony').player;
  // context/personajes/Discord_Survivors_Jhony_El_Metalero_Tilteado.md §3:
  // Vida +10% -> 110, Defensa -10% -> 9 points (0.45 mitigation),
  // Distancia de ataque -15% -> 85, Atk/s +5% -> 1.05, movimiento normal
  // -> 3300% of the cast's calibrated scale. Attack is tuned up to 800 (80 per
  // botellazo) because the doc's "+15%" dies on the first wave; see the sheet's
  // comment and the balance table in odd/tasks/jhony-playable.md.
  assert.equal(p.maxHp, 110);
  assert.equal(p.defense, 0.45);
  assert.equal(p.damage, 80);
  assert.equal(p.attackRange, 85 * UNIT_PX);
  assert.ok(Math.abs(p.shotInterval - 100 / 105) < 1e-9);
  assert.equal(p.speed, 165 * WORLD_SCALE);
  assert.equal(CHARACTERS.jhony.attack.type, 'melee', 'the botellazo is a melee swing');
  assert.equal(CHARACTERS.jhony.specials.map(s => `${s.key},${s.hotkey},${s.duration},${s.cooldown}`).join('|'),
    'drink,e,6,16|guide,q,10,30');
});

test('the botellazo hits one enemy in reach, reads as glass and pushes', () => {
  const run = solo();
  const p = run.player;
  const near = dummy(run, 40);
  const far = dummy(run, 400);
  run.shotIn = 0.001;
  step(run, 0.016);
  assert.equal(near.hp, 200 - 80, 'sheet damage, one target');
  assert.equal(far.hp, 200, 'out of reach is out of reach');
  assert.ok(near.x > p.x + 40, 'the bottle shoves what it hits');
  assert.ok(run.effects.some(effect => effect.kind === 'glass'), 'the hit is drawn as the bottle, not a bite');
});

test('receiving damage fills the Tilt bar and 100 snaps into Furia', () => {
  const run = solo();
  const p = run.player;
  p.characterDef.onDamaged(run, p, 20);
  assert.equal(p.tilt, 30, 'damage feeds the bar');
  assert.equal(p.fury, 0);

  p.tilt = 99;
  p.characterDef.onDamaged(run, p, 1);
  assert.equal(p.fury, 6, 'Furia starts at 100');
  assert.equal(p.tilt, 0, 'and the bar restarts from zero');
  assert.ok(run.effects.some(effect => effect.text === '¡ME TIENEN LOS HUEVOS LLENOS!'));

  p.characterDef.onDamaged(run, p, 40);
  assert.equal(p.tilt, 0, 'the bar cannot refill while Furia lasts');
  assert.equal(p.fury, 6);
});

test('the horde alone fills the bar, so taking hits is not the only way in', () => {
  const run = solo();
  const p = run.player;
  assert.equal(p.characterDef.onTick, CHARACTERS.jhony.onTick);
  step(run, 0.05);
  assert.equal(p.tilt, 0, 'an empty room tilts nobody');

  dummy(run, 60);
  for (let i = 0; i < 20; i++) p.characterDef.onTick(run, p, 0.05);
  assert.ok(p.tilt > 8 && p.tilt < 10, `pressure fills the bar (${p.tilt})`);
});

test('Furia trades defence for +40% damage and +25% attack speed', () => {
  const run = solo();
  const p = run.player;
  const def = p.characterDef;
  assert.equal(def.passiveDamageMult(p), 1);
  assert.equal(def.passiveRateMult(p), 1);
  assert.equal(def.passiveDefenseMult(p), 1);

  p.fury = 5;
  assert.equal(def.passiveDamageMult(p), 1.4);
  assert.equal(def.passiveRateMult(p), 0.8);
  assert.equal(def.passiveDefenseMult(p), 0.7);

  const enemy = dummy(run, 40, 500);
  run.shotIn = 0.001;
  step(run, 0.016);
  assert.equal(enemy.hp, 500 - 80 * 1.4, 'the sheet damage never mutates; the multiplier applies on the hit');
  assert.equal(p.damage, 80);
});

test('«Un traguito más» quickens the botellazos and amplifies the Tilt gain', () => {
  const run = solo();
  const p = run.player;
  assert.equal(activateSpecial(run, 'drink'), true);
  assert.equal(p.drink, 6);
  assert.equal(p.drinkCooldown, 16);
  assert.equal(p.characterDef.passiveRateMult(p), 0.75);
  assert.equal(activateSpecial(run, 'drink'), false, 'the cooldown blocks a second sip');

  p.drink = 5;
  p.tilt = 0;
  p.characterDef.onDamaged(run, p, 20);
  assert.equal(p.tilt, 48, '30 points of Tilt become 48 while the whisky lasts');
});

test('«ME VI UNA GUÍA» throws bouncing bottles for ten seconds', () => {
  const run = solo();
  const p = run.player;
  dummy(run, 120);
  dummy(run, 220);
  assert.equal(activateSpecial(run, 'guide'), true);
  assert.equal(p.guide, 10);
  assert.equal(p.guideCooldown, 30);
  assert.equal(p.characterDef.passiveDamageMult(p), 1.3);
  assert.ok(Math.abs(p.characterDef.passiveRateMult(p) - 2 / 3) < 1e-9);

  p.characterDef.specials.find(s => s.key === 'guide').onTick(run, p, 0.016, {
    nearest: (run, source, excluded, maxDistance) => run.enemies
      .filter(e => e.hp > 0 && Math.hypot(e.x - source.x, e.y - source.y) <= maxDistance)
      .sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y))[0],
  });
  const bottle = run.projectiles.find(shot => shot.kind === 'bottle');
  assert.ok(bottle, 'a bottle leaves his hand');
  assert.equal(bottle.pierce, 3, 'three targets through bounces');
  assert.equal(bottle.device, 'bottle');
});

test('the Tilt bar is the HUD readout, with Furia as the boosted state', () => {
  const run = solo();
  const p = run.player;
  assert.equal(CHARACTERS.jhony.taskHudTitle, 'TILT');
  p.tilt = 50;
  assert.deepEqual(p.characterDef.taskHud(p), { percentage: 50, label: '50/100', active: false });
  p.fury = 3;
  assert.deepEqual(p.characterDef.taskHud(p), { percentage: 100, label: '¡TILT! · 3s', active: true });
});

test('the playable ficha draws the bottle, and the red cheeks belong to the whisky', () => {
  const drawFicha = player => {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 }) : (...args) => { calls.push([key, ...args]); },
      set: (_, key, value) => { calls.push(['set', key, value]); return true; },
    });
    CHARACTERS.jhony.draw(ctx, 100, 150, { time: 0, moving: false, facing: 1, player });
    return calls;
  };
  const painted = (calls, color) => calls.some(([kind, key, value]) => kind === 'set' && key === 'fillStyle' && value === color);

  const tilted = drawFicha({ attackFlash: 0, tilt: 60, fury: 0 });
  assert.equal(painted(tilted, '#c4634a'), false, '60 Tilt no longer reddens the cheeks');
  assert.ok(painted(tilted, '#e6d9b4'), 'the bottle label is drawn');

  assert.ok(painted(drawFicha({ attackFlash: 0, tilt: 0, fury: 0, drink: 4 }), '#c4634a'),
    '«Un traguito más» is what flushes his face');
});

// The engine hands the ficha a small toolbox; these fakes stand in for it when
// a test drives a single hook instead of a whole frame.
function toolbox(run) {
  const hit = (run, enemy, damage, kind = 'damage') => {
    enemy.hp -= damage;
    run.effects.push({ x: enemy.x, y: enemy.y, text: `${Math.round(damage)}`, ttl: 0.65, kind });
  };
  return {
    hit,
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    nearest: (run, source, excluded = [], maxDistance = Infinity) => run.enemies
      .filter(enemy => enemy.hp > 0 && !excluded.includes(enemy.id)
        && Math.hypot(enemy.x - source.x, enemy.y - source.y) <= maxDistance)
      .sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y))[0],
    fireRadial: () => {},
  };
}

test('«¡ERA UN CÍRCULO!» clears the area when Furia starts, and the evolution leaves the circle behind', () => {
  const run = solo();
  const p = run.player;
  const ctx = toolbox(run);
  const near = dummy(run, 80, 200);
  p.rewardBonuses = { tiltWave: 1 };
  p.tilt = 99;
  p.characterDef.onDamaged(run, p, 1, ctx);
  assert.equal(p.fury, 6);
  assert.ok(near.hp < 200, 'the wave hits everything around him');
  assert.ok(near.x > p.x + 80, 'and shoves it away');
  assert.equal(run.effects.some(effect => effect.kind === 'tiltZone'), false, 'rank 1 leaves nothing on the floor');

  const evolved = solo();
  const ep = evolved.player;
  const ectx = toolbox(evolved);
  const crowd = dummy(evolved, 70, 400);
  ep.rewardBonuses = { tiltWave: 2 };
  ep.tilt = 99;
  ep.characterDef.onDamaged(evolved, ep, 1, ectx);
  assert.ok(evolved.effects.some(effect => effect.kind === 'tiltZone'), 'the evolved circle stays');
  const before = crowd.hp;
  ep.characterDef.onTick(evolved, ep, 0.5, ectx);
  assert.ok(crowd.hp < before, 'and it keeps damaging whoever stands in it');
});

test('«¡CERRÁ EL ORTO!» shouts forward, and the evolution shouts in every direction', () => {
  const run = solo();
  const p = run.player;
  p.lastMoveX = 1;
  p.lastMoveY = 0;
  const ctx = toolbox(run);
  const front = dummy(run, 90, 300);
  const behind = { id: 99, x: p.x - 90, y: p.y, hp: 300, maxHp: 300, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(behind);
  p.rewardBonuses = { shout: 1 };
  p.shoutIn = 0;
  p.characterDef.onTick(run, p, 0.05, ctx);
  assert.ok(front.hp < 300, 'the cone reaches what he faces');
  assert.equal(behind.hp, 300, 'and leaves what is behind alone');

  p.rewardBonuses = { shout: 2 };
  p.shoutIn = 0;
  p.characterDef.onTick(run, p, 0.05, ctx);
  assert.ok(behind.hp < 300, 'the evolved shout is a 360 ring');
  assert.ok(run.effects.some(effect => effect.text === '¡CERRÁ EL ORTO!'));
});

test('«BOTELLA ROTA» sprays glass past the botellazo, in every direction when evolved', () => {
  const run = solo();
  const p = run.player;
  const enemy = dummy(run, 40, 500);
  p.rewardBonuses = { bottleShards: 1 };
  p.characterDef.onMeleeHit(run, p, enemy, toolbox(run));
  assert.equal(run.projectiles.filter(shot => shot.kind === 'shard').length, 1);
  assert.equal(run.projectiles[0].device, 'shard');

  const evolved = solo();
  const ep = evolved.player;
  ep.rewardBonuses = { bottleShards: 2 };
  ep.characterDef.onMeleeHit(evolved, ep, dummy(evolved, 40, 500), toolbox(evolved));
  assert.equal(evolved.projectiles.filter(shot => shot.kind === 'shard').length, 3, 'three directions');
});

test('«UNA BIRRA MÁS» throws a bottle every four swings; the evolution throws two', () => {
  const run = solo();
  const p = run.player;
  const ctx = toolbox(run);
  p.rewardBonuses = { extraBottle: 1 };
  dummy(run, 120, 900);
  for (let swing = 0; swing < 4; swing++) p.characterDef.onMeleeHit(run, p, run.enemies[0], ctx);
  const thrown = run.projectiles.filter(shot => shot.kind === 'bottle');
  assert.equal(thrown.length, 1, 'one extra bottle after four botellazos');
  assert.ok(thrown[0].blast, 'and it bursts on impact');

  const evolved = solo();
  const ep = evolved.player;
  ep.rewardBonuses = { extraBottle: 2 };
  dummy(evolved, 120, 900);
  dummy(evolved, 200, 900);
  for (let swing = 0; swing < 4; swing++) ep.characterDef.onMeleeHit(evolved, ep, evolved.enemies[0], toolbox(evolved));
  assert.equal(evolved.projectiles.filter(shot => shot.kind === 'bottle').length, 2, 'the round is two bottles');
});

test('«2.000 HORAS AL PEDO» finishes weak enemies, and the evolution shakes the neighbours', () => {
  const run = solo();
  const p = run.player;
  const ctx = toolbox(run);
  const weak = { id: 7, x: p.x + 60, y: p.y, hp: 20, maxHp: 200, speed: 0, radius: 10, kind: 'zombie' };
  const healthy = dummy(run, 70, 200);
  run.enemies.push(weak);
  p.rewardBonuses = { stomp: 1 };
  p.stompIn = 0;
  p.characterDef.onTick(run, p, 0.05, ctx);
  assert.equal(weak.hp, 20 - 80 * 1.8, 'the stomp lands on the weak one');
  assert.equal(healthy.hp, 200, 'and never on a healthy body');

  const evolved = solo();
  const ep = evolved.player;
  const ectx = toolbox(evolved);
  const target = { id: 8, x: ep.x + 40, y: ep.y, hp: 10, maxHp: 200, speed: 0, radius: 10, kind: 'zombie' };
  const neighbour = { id: 9, x: ep.x + 90, y: ep.y, hp: 300, maxHp: 300, speed: 0, radius: 10, kind: 'zombie' };
  evolved.enemies.push(target, neighbour);
  ep.rewardBonuses = { stomp: 2 };
  ep.stompIn = 0;
  ep.characterDef.onTick(evolved, ep, 0.05, ectx);
  assert.ok(neighbour.hp < 300, 'the evolved stomp shakes the crowd');
});

test('«LA BUILD ESTÁ ROTÍSIMA» speeds up the ultimate volley and the evolution adds a bounce', () => {
  const run = solo();
  const p = run.player;
  const ctx = toolbox(run);
  dummy(run, 100, 900);
  const guide = p.characterDef.specials.find(special => special.key === 'guide');
  p.rewardBonuses = { buildCombo: 2 };
  p.guide = 10;
  guide.onTick(run, p, 0.016, ctx);
  const bottle = run.projectiles.find(shot => shot.kind === 'bottle');
  assert.equal(bottle.pierce, 4, 'three base bounces plus one');
  assert.ok(Math.abs(run.guideIn - 0.45 * 0.6) < 1e-9, 'the volley comes faster');

  const plain = solo();
  plain.player.guide = 10;
  guide.onTick(plain, plain.player, 0.016, toolbox(plain));
  assert.ok(Math.abs(plain.guideIn - 0.45) < 1e-9, 'without the upgrade it keeps the base cadence');
});

test('the six signatures are six entries, each one carrying its evolution as a second rank', () => {
  const own = DEFAULT_CATALOG.upgrades.filter(entry => entry.characters === 'jhony');
  assert.deepEqual(own.map(entry => entry.id).sort(), [
    'broken-bottle', 'broken-build', 'closed-mouth', 'one-more-beer', 'tilt-circle', 'zomboid-stomp',
  ]);
  for (const entry of own) {
    assert.equal(entry.ranks.length, 2, `${entry.id} is the base form and its evolution`);
    assert.deepEqual(entry.requires, [], `${entry.id} evolves from its own first rank, not from another card`);
    assert.equal(entry.ranks[0].effects[0].type, entry.ranks[1].effects[0].type, `${entry.id} keeps its shape`);
  }
  const options = (level, ranks, random = () => 0) =>
    selectLevelOptions(DEFAULT_CATALOG, { character: 'jhony', level, ranks }, random).map(entry => entry.id);
  assert.equal(options(3, {})[0], 'tilt-circle', 'the circle is the level-3 milestone');
});

test('rank II names the evolution instead of repeating the first form', () => {
  const run = createRun(() => 0.5, 'jhony');
  const own = DEFAULT_CATALOG.upgrades.filter(entry => entry.characters === 'jhony');
  for (const entry of own) {
    const type = entry.ranks[0].effects[0].type;
    const first = describeReward(entry.ranks[0], EFFECTS,
      rewardEffectTotals(run, `level:${entry.id}:0`, entry.ranks[0]));
    assert.equal(applyUpgradeRank(run, entry), true, `${entry.id} takes its first rank`);
    assert.equal(run.player.rewardBonuses[type], 1, `${entry.id} starts as its first form`);
    const second = describeReward(entry.ranks[1], EFFECTS,
      rewardEffectTotals(run, `level:${entry.id}:1`, entry.ranks[1]));
    assert.notDeepEqual(second, first, `${entry.id} sells a different shape on rank II`);
    assert.equal(applyUpgradeRank(run, entry), true, `${entry.id} takes its evolution`);
    assert.equal(run.player.rewardBonuses[type], 2, `${entry.id} reaches its evolved form`);
  }
  const circle = DEFAULT_CATALOG.upgrades.find(entry => entry.id === 'tilt-circle');
  const fresh = createRun(() => 0.5, 'jhony');
  assert.deepEqual(describeReward(circle.ranks[0], EFFECTS, rewardEffectTotals(fresh, 'level:tilt-circle:0', circle.ranks[0])),
    ['Onda de Tilt al entrar en Furia']);
  assert.deepEqual(describeReward(circle.ranks[1], EFFECTS, { tiltWave: 2 }),
    ['Onda de Tilt y el círculo queda en el piso']);
});

test('a melee swing turns the body towards the enemy it hits', () => {
  for (const character of ['jhony', 'solago']) {
    const right = createRun(() => 0.5, character);
    right.spawnIn = 100;
    right.enemies.push({ id: 1, x: right.player.x + right.player.attackRange - 6, y: right.player.y,
      hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
    step(right, 0.05, {});
    assert.equal(right.player.swingFacing, 1, `${character} turns right`);

    const left = createRun(() => 0.5, character);
    left.spawnIn = 100;
    left.enemies.push({ id: 1, x: left.player.x - left.player.attackRange + 6, y: left.player.y,
      hp: 500, maxHp: 500, speed: 0, radius: 10, kind: 'zombie' });
    step(left, 0.05, {});
    assert.equal(left.player.swingFacing, -1, `${character} turns left`);
  }
});

test('standing still, the shout turns to the enemy instead of a fixed heading', () => {
  const run = solo();
  const p = run.player;
  const left = { id: 99, x: p.x - 90, y: p.y, hp: 300, maxHp: 300, speed: 0, radius: 10, kind: 'zombie' };
  run.enemies.push(left);
  p.rewardBonuses = { shout: 1 };
  p.shoutIn = 0;
  assert.equal(p.lastMoveX, 0, 'he has not walked anywhere yet');
  assert.equal(p.lastMoveY, 0);
  p.characterDef.onTick(run, p, 0.05, toolbox(run));
  assert.ok(left.hp < 300, 'the cone follows the body at his left');
});
