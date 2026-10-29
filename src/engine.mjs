const applyDamage = player => { player.damage *= 1.3; };
const applyRate = player => { player.shotInterval *= 0.92; };
const applyHealth = player => {
  player.maxHp += 25;
  player.hp = Math.min(player.maxHp, player.hp + 50);
};
const applyArmor = player => { player.defense = Math.min(0.6, player.defense + 0.05); };
const applyRegen = player => { player.regen += 2.5; };
const applySpeed = player => { player.speed *= 1.08; };
export const UPGRADES = [
  { id: 'damage', name: 'Pilas nuevas', description: '+30% de daño del control. Se puede comprar varias veces.', costs: [20, 30, 40, 50], icon: 'ϟ', apply: applyDamage },
  { id: 'rate', name: 'Menos paja, más clics', description: '-8% de recarga del control remoto.', costs: [20, 30, 40, 50], icon: '↻', apply: applyRate },
  { id: 'health', name: 'Delivery de emergencia', description: '+25 de vida máxima y recuperás 50 de vida.', costs: [20, 30, 40], icon: '✚', apply: applyHealth },
  { id: 'armor', name: 'Modo avión', description: '+5% de defensa. Que te peguen menos.', costs: [18, 26, 34], icon: '⛨', apply: applyArmor },
  { id: 'regen', name: 'Cinco minutitos más', description: '+2,5 de regeneración por segundo al estar quieto.', costs: [15, 22, 30], icon: '☾', apply: applyRegen },
  { id: 'speed', name: 'Hay comida en la cocina', description: '+8% de velocidad. Una causa noble.', costs: [15, 25], icon: '»', apply: applySpeed },
];
export const HEAL_COST = 12;
export const HEAL_AMOUNT = 60;
import { WORLD_SCALE, WIDTH, HEIGHT } from './constants.mjs';
export { WORLD_SCALE, WIDTH, HEIGHT } from './constants.mjs';
import { getCharacter } from './characters/index.mjs';
import { ENEMY_KINDS, enemyAttackInterval, enemyAttackRange, enemyBounty, enemyContactDamage, enemyDefense, enemyHp, enemySpeed } from './enemies/index.mjs';
import { DEFENSE_MITIGATION_CAP, resolveLifePercent } from './stats.mjs';
import { pickKind, spawnInterval, waveBudget, waveConfig, waveLife } from './waves.mjs';
import { emit } from './bus.mjs';
import { createStatState } from './stat-modifiers.mjs';
import { initializeRewards, awardXP, beginRewards, finishRewards, recordLegacyUpgrade } from './run-rewards.mjs';
export { chooseLevelReward, skipEmptyChoice, buyItem, nextLevelXP } from './run-rewards.mjs';

// Safety net: the per-wave budget is the real limiter, this only stops a wave
// from ever flooding the arena if its data asks for an absurd density.
const ALIVE_CAP = 120;

export function createRun(random = Math.random, character = 'negro', rewards = {}) {
  const characterDef = getCharacter(character);
  const s = characterDef.stats;
  const run = {
    phase: 'playing', wave: 1, duration: 60, time: 0, elapsed: 0, coins: 0, kills: 0,
    random, character: characterDef.id, serial: 0, shotCount: 0, spawnIn: 0.8, shotIn: 0,
    player: {
      character: characterDef.id, characterDef,
       x: WIDTH / 2, y: HEIGHT / 2,
       lastMoveX: 0, lastMoveY: 0,
      hp: s.maxHp, maxHp: s.maxHp, defense: s.defense, damage: s.damage,
      hitRadius: s.hitRadius, attackRange: s.attackRange, shotInterval: s.shotInterval,
      speed: s.speed,
      regen: 4, still: 0, immune: 0, attackFlash: 0,
      smile: 0, smileCooldown: 0,
    },
    enemies: [], projectiles: [], effects: [],
    upgrades: { damage: 0, rate: 0, health: 0, armor: 0, regen: 0, speed: 0 },
  };
  for (const special of characterDef.specials) {
    run[`${special.key}In`] = 0;
    run.player[special.key] = 0;
    run.player[`${special.key}Cooldown`] = 0;
  }
  characterDef.initPlayer?.(run.player);
  characterDef.onStageStart?.(run, run.player);
  initializeRewards(run, rewards);
  run.duration = run.rewardBalance.waves.duration;
  run.spawnBudget = waveBudget(run.wave, run.duration);
  run.spawnIn = spawnInterval(run.duration, run.spawnBudget);
  return run;
}

export function activateSpecial(run, type) {
  if (run.phase !== 'playing') return false;
  const player = run.player;
  const spec = player.characterDef.specials.find(special => special.key === type);
  if (!spec || player[`${type}Cooldown`] > 0) return false;
  player[type] = spec.duration + (player.rewardBonuses[spec.durationBonus] ?? 0);
  player[`${type}Cooldown`] = spec.cooldown;
  spec.onStart?.(run, player);
  emit('specialActivated', { run, player, special: type });
  return true;
}

export function chooseUpgrade(run, id) {
  const upgrade = UPGRADES.find(item => item.id === id);
  if (run.phase !== 'shop' || run.pendingLevels.length || !upgrade) return false;
  const level = run.upgrades[id] || 0;
  if (level >= upgrade.costs.length) return false;
  const cost = upgrade.costs[level];
  if (run.coins < cost) return false;
  const p = run.player;
  const before = createStatState(p).base;
  const candidate = { ...run, player: { ...p } };
  try {
    upgrade.apply(candidate.player, level);
    recordLegacyUpgrade(candidate, before, `legacy:${id}:${level}`);
  } catch {
    return false;
  }
  Object.assign(p, candidate.player);
  run.statState = candidate.statState;
  run.coins -= cost;
  run.upgrades[id] = level + 1;
  return true;
}

// Cap lines for the stacked sale economy (ficha §4.3: the balance asks for
// sensibleness; the engine holds the generically safe maximums).
const SELL_DAMAGE_BUFF_CAP = 0.5;  // +50% daño total por liquidación
const SELL_MOVE_SLOW_CAP = 0.5;   // hasta -50% de velocidad por ventas apiladas
const SELL_ATK_SLOW_CAP = 0.6;    // hasta -60% de cadencia
const SELL_DEF_LOSS_CAP = 0.4;    // hasta -40% de defensa base

export function salePrice(run, item) {
  return Math.floor(item.coins * (1 + (run.player.rewardBonuses?.saleBonus ?? 0)));
}

// «Liquido todo, me voy de putas»: the character-agnostic sale routine. The
// owned belongings and every number live in the sheet (special.items); this
// engine routine applies a sale's shape: coins now, a temp damage buff and
// the item's temp debuff, each sold exactly once per run.
export function sellBelonging(run, key) {
  if (run.phase !== 'playing') return false;
  const p = run.player;
  const item = p.characterDef.specials?.find(s => s.key === 'sell')?.items?.[key];
  if (!item || p.soldItems?.[key]) return false;
  p.soldItems = p.soldItems ?? {};
  p.soldItems[key] = true;
  const proceeds = salePrice(run, item);
  run.coins += proceeds;
  p.characterDef.onSaleIncome?.(run, p, proceeds);
  const penaltyScale = 1 - Math.min(0.4, p.rewardBonuses?.salePenalty ?? 0);
  if (item.damageFrac) {
    p.sellDamageFrac = Math.min(SELL_DAMAGE_BUFF_CAP, (p.sellDamageFrac ?? 0) + item.damageFrac);
    p.sellDamageTtl = Math.max(p.sellDamageTtl ?? 0, item.damageTtl);
  }
  if (item.moveSlowFrac) {
    p.sellMoveSlowFrac = Math.min(SELL_MOVE_SLOW_CAP, (p.sellMoveSlowFrac ?? 0) + item.moveSlowFrac * penaltyScale);
    p.sellMoveSlowTtl = Math.max(p.sellMoveSlowTtl ?? 0, item.moveSlowTtl);
  }
  if (item.atkSlowFrac) {
    p.sellAtkSlowFrac = Math.min(SELL_ATK_SLOW_CAP, (p.sellAtkSlowFrac ?? 0) + item.atkSlowFrac * penaltyScale);
    p.sellAtkSlowTtl = Math.max(p.sellAtkSlowTtl ?? 0, item.atkSlowTtl);
  }
  if (item.defFrac) {
    p.sellDefLossFrac = Math.min(SELL_DEF_LOSS_CAP, (p.sellDefLossFrac ?? 0) + item.defFrac * penaltyScale);
    p.sellDefLossTtl = Math.max(p.sellDefLossTtl ?? 0, item.defTtl);
  }
  if (item.visionTtl) p.sellVisionTtl = Math.max(p.sellVisionTtl ?? 0, item.visionTtl);
  if ((p.rewardBonuses?.saleNext ?? 0) > 0) p.sellNextMult = 1 + p.rewardBonuses.saleNext;
  run.effects.push({ x: p.x, y: p.y - 66 * WORLD_SCALE, text: item.quote, ttl: 1.5, kind: 'sale' });
  return true;
}

export function buyHeal(run) {
  if (run.phase !== 'shop' || run.pendingLevels.length || run.coins < HEAL_COST || run.player.hp >= run.player.maxHp) return false;
  run.coins -= HEAL_COST;
  run.player.hp = Math.min(run.player.maxHp, run.player.hp + HEAL_AMOUNT);
  return true;
}

// One enemy built from its sheet. Exported because dev viewers and tests need
// to place a named kind without running a whole wave.
export function createEnemy(run, kind, x, y) {
  const def = ENEMY_KINDS[kind];
  const percent = waveLife(run.wave, kind);
  const hp = percent === undefined ? enemyHp(kind, run.wave) : resolveLifePercent(percent);
  return { id: ++run.serial, kind, x, y,
    hp, maxHp: hp, defense: enemyDefense(kind, run.wave),
    radius: def.radius * WORLD_SCALE, speed: enemySpeed(kind, run.wave),
    attackRange: enemyAttackRange(kind, run.wave),
    attackInterval: enemyAttackInterval(kind, run.wave) };
}

export function startNextWave(run) {
  if (run.phase !== 'shop' || !finishRewards(run)) return false;
  run.wave++;
  run.duration = run.rewardBalance.waves.duration;
  run.time = 0;
  run.spawnBudget = waveBudget(run.wave, run.duration);
  run.spawnIn = spawnInterval(run.duration, run.spawnBudget);
  run.phase = 'playing';
  run.enemies = [];
  run.projectiles = [];
  run.player.characterDef.onStageStart?.(run, run.player);
  if (run.wave === run.rewardBalance.waves.bossWave) {
    run.enemies.push(createEnemy(run, 'boss', WIDTH / 2, 80 * WORLD_SCALE));
  }
  return true;
}

function spawn(run, kind) {
  const edge = Math.floor(run.random() * 4);
  const enemy = createEnemy(run, kind,
    edge === 0 ? -20 * WORLD_SCALE : edge === 1 ? WIDTH + 20 * WORLD_SCALE : run.random() * WIDTH,
    edge === 2 ? -20 * WORLD_SCALE : edge === 3 ? HEIGHT + 20 * WORLD_SCALE : run.random() * HEIGHT);
  enemy.speed += run.random() * 10 * WORLD_SCALE;
  run.enemies.push(enemy);
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Confusion: Warrior's controlled state. Stacks 1-2 slow length movement,
// stack 3 adds disorientation and the +50% elemental damage bonus in hit().
// Bosses resist mass CC: they cap at one stack and keep chasing.
const CONFUSION_SLOW = [0, 0.25, 0.4, 0.55];

function applyConfusion(enemy, stacks, ttl) {
  const cap = enemy.kind === 'boss' ? 1 : 3;
  enemy.confusionStacks = Math.min(cap, (enemy.confusionStacks ?? 0) + stacks);
  enemy.confusionTtl = Math.max(enemy.confusionTtl ?? 0, ttl);
}

function confusionSlowFactor(enemy) {
  return 1 - (CONFUSION_SLOW[enemy.confusionStacks ?? 0] ?? 0);
}

// A confused mind does not chase: it stumbles on a slow, deterministic drift.
function disorientedDrift(enemy, elapsed) {
  const angle = (elapsed * 2.2 + enemy.id * 1.7) % (Math.PI * 2);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function shroomBlast(run, shot, impact) {
  const radius = shot.attack.blast.radius + (run.player.rewardBonuses.blastRadius ?? 0) * WORLD_SCALE;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0 || shot.hit.includes(enemy.id)) continue;
    if (distance(enemy, impact) > radius) continue;
    hit(run, enemy, shot.damage, 'spore');
    applyConfusion(enemy, shot.attack.blast.stacks ?? 1, shot.attack.blast.ttl ?? 5.4);
  }
  run.effects.push({ x: impact.x, y: impact.y, radius,
    ttl: 0.55, duration: 0.55, kind: 'shroomBlast' });
  const zone = run.player.rewardBonuses.sporeZone ?? 0;
  if (zone > 0) {
    run.effects.push({ x: impact.x, y: impact.y, r: radius * 0.8, radius: radius * 0.8,
      kind: 'sporeZone', damage: 4 + zone * 4, ttl: 3 + zone, tick: 0 });
  }
}

function nearest(run, origin, excluded = [], maxDistance = Infinity) {
  return run.enemies.filter(e => e.hp > 0 && !excluded.includes(e.id)
      && distance(e, origin) <= maxDistance)
    .sort((a, b) => distance(a, origin) - distance(b, origin))[0];
}

function fire(run, source, damage, kind, maxDistance = Infinity, attack = null) {
  const target = nearest(run, source, [], maxDistance);
  if (!target) return;
  const device = kind === 'remote' ? ['remote', 'joystick', 'phone'][run.shotCount++ % 3]
    : kind === 'brick' ? 'brick'
    : kind === 'shroom' ? 'shroom' : 'magic';
  run.projectiles.push({ x: source.x, y: source.y, target: target.id,
    damage, kind, device, hit: [], ttl: 3, angle: 0, attack });
  const extra = kind === 'shroom' ? (run.player.rewardBonuses.extraShroom ?? 0)
    : kind === 'brick' ? (run.player.rewardBonuses.brickFan ?? 0) : 0;
  const used = [target.id];
  for (let index = 0; index < extra; index++) {
    const alt = nearest(run, source, used, maxDistance);
    if (!alt) break;
    used.push(alt.id);
    run.projectiles.push({ x: source.x, y: source.y, target: alt.id,
      damage: damage * 0.6, kind, device, hit: [], ttl: 3, angle: 0, attack });
  }
}

// Untargeted rings keep their launch direction, even in an empty arena.
function fireRadial(run, source, damage, { count, speed, radius }) {
  for (let i = 0; i < count; i++) {
    const direction = i * Math.PI * 2 / count;
    const dx = Math.cos(direction), dy = Math.sin(direction);
    run.projectiles.push({ x: source.x + dx * radius, y: source.y + dy * radius,
      vx: dx * speed, vy: dy * speed, damage, kind: 'brick', device: 'brick',
      hit: [], ttl: 2.4, angle: direction, radius: 3 * WORLD_SCALE });
  }
}

function hit(run, enemy, damage, kind = 'damage') {
  const elemental = (enemy.confusionStacks ?? 0) >= 3 ? 1.5 : 1;
  // Warrior's smoke bonus: mushrooms bite harder on enemies breathing his cloud.
  const smoked = kind === 'spore' && (enemy.smokeIn ?? 0) > 0
    ? 1 + (run.player.rewardBonuses.smokeBonus ?? 0) : 1;
  enemy.hp -= damage * elemental * smoked * (1 - Math.min(DEFENSE_MITIGATION_CAP, enemy.defense ?? 0));
  run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius, text: `${Math.round(damage)}`, ttl: 0.65, kind });
}

// Every coin award funnels through here (kill bounty and survival bonus) so
// a character can react to gaining money without the engine knowing its lore.
function awardCoins(run, amount) {
  run.coins += amount;
  run.player.characterDef.onCoinsGained?.(run, run.player, amount);
}

function attackMelee(run) {
  const p = run.player;
  const inReach = run.enemies
    .filter(enemy => enemy.hp > 0 && distance(enemy, p) <= p.attackRange)
    .sort((a, b) => distance(a, p) - distance(b, p));
  if (!inReach.length) return;
  const combat = p.characterDef.combat || {};
  const damage = p.damage * (p.permissionActive > 0 ? (combat.permissionDamageMult ?? 1) : 1);
  const extra = Math.min(inReach.length - 1, p.rewardBonuses.biteTargets ?? 0);
  hit(run, inReach[0], damage, 'bite');
  for (let index = 1; index <= extra; index++) hit(run, inReach[index], damage * 0.7, 'bite');
  const second = p.rewardBonuses.secondBite ?? 0;
  if (second > 0 && inReach[0].hp > 0) hit(run, inReach[0], damage * second, 'bite');
  const push = p.rewardBonuses.knockback ?? 0;
  if (push > 0) {
    for (const enemy of inReach.slice(0, 1 + extra)) {
      const away = distance(enemy, p) || 1;
      enemy.x += (enemy.x - p.x) / away * push * WORLD_SCALE;
      enemy.y += (enemy.y - p.y) / away * push * WORLD_SCALE;
    }
  }
  p.attackFlash = 0.22;
  run.effects.push({ x: inReach[0].x, y: inReach[0].y - inReach[0].radius - 12, text: '✦', ttl: 0.35, kind: 'bite' });
}

export function step(run, seconds, input = {}) {
  if (run.phase !== 'playing') return;
  const dt = Math.min(0.05, Math.max(0, seconds));
  const p = run.player;
  const def = p.characterDef;
   const ctx = { hit, distance, nearest, fire, fireRadial, confuse: applyConfusion, movement: input };
  run.time += dt;
  run.elapsed += dt;
  const decayKeys = [
    'immune', 'attackFlash',
    ...def.specials.flatMap(special => [special.key, `${special.key}Cooldown`]),
    ...def.passives.flatMap(passive => [passive.key, `${passive.key}Cooldown`]),
    ...def.decays,
  ];
  const wasActive = def.specials.map(special => p[special.key] > 0);
  for (const key of decayKeys) p[key] = Math.max(0, p[key] - dt);
  for (const passive of def.passives) passive.tick?.(run, p, dt, ctx);
  def.specials.forEach((special, i) => {
    if (wasActive[i] && p[special.key] <= 0) special.onExpire?.(run, p, ctx);
  });
  let speedFactor = 1;
  let contactFactor = 1;
  let immobilized = false;
  for (const special of def.specials) {
    if (p[special.key] > 0) {
      speedFactor *= special.speedFactor ?? 1;
      contactFactor *= special.contactFactor ?? 1;
      immobilized ||= special.immobilize === true;
    }
  }
  const mx = immobilized ? 0 : (input.x || 0);
  const my = immobilized ? 0 : (input.y || 0);
  const magnitude = Math.hypot(mx, my);
  if (magnitude) {
    p.lastMoveX = mx / magnitude;
    p.lastMoveY = my / magnitude;
    const speed = p.speed * speedFactor * (def.passiveSpeedMult?.(p) ?? 1)
      * (p.sellMoveSlowTtl > 0 ? 1 - (p.sellMoveSlowFrac ?? 0) : 1);
    p.x = Math.max(24 * WORLD_SCALE, Math.min(WIDTH - 24 * WORLD_SCALE, p.x + mx / magnitude * speed * dt));
    p.y = Math.max(28 * WORLD_SCALE, Math.min(HEIGHT - 24 * WORLD_SCALE, p.y + my / magnitude * speed * dt));
    p.still = 0;
    const trail = p.rewardBonuses.smokeTrail ?? 0;
    if (trail > 0) {
      p.trailIn = (p.trailIn ?? 0) - dt;
      if (p.trailIn <= 0) {
        p.trailIn = 1.4;
        run.effects.push({ x: p.x, y: p.y, kind: 'smoke', r: (60 + trail * 10) * WORLD_SCALE, ttl: 2.4 });
      }
    }
  } else {
    p.still += dt;
    if (p.still >= Math.max(0.5, 2 - (p.rewardBonuses.stillThreshold ?? 0))) {
      p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
      const shieldMax = p.rewardBonuses.stillShield ?? 0;
      if (shieldMax > 0) p.shield = Math.min(shieldMax, (p.shield ?? 0) + shieldMax * dt / 2);
      def.onStill?.(run, p);
    }
  }

  run.spawnIn -= dt;
  const spawnConfig = waveConfig(run.wave);
  if (spawnConfig && run.spawnBudget > 0 && run.spawnIn <= 0 && run.enemies.length < ALIVE_CAP) {
    const kind = pickKind(spawnConfig, run.random);
    if (kind) {
      spawn(run, kind);
      run.spawnBudget--;
      run.spawnIn = spawnInterval(run.duration - run.time, run.spawnBudget);
    }
  }
  run.shotIn -= dt;
  if (run.shotIn <= 0) {
    if (def.attack.type === 'melee') attackMelee(run);
    else {
      const empowered = p.sellNextMult ?? 1;
      fire(run, p, p.damage * (def.attack.damageMultiplier ?? 1)
        * (p.sellDamageTtl > 0 ? 1 + (p.sellDamageFrac ?? 0) : 1) * empowered,
        def.attack.device, p.attackRange, def.attack);
      p.sellNextMult = 1;
    }
    const combat = def.combat || {};
    run.shotIn = p.shotInterval * (p.permissionActive > 0 ? (combat.permissionRateMult ?? 1) : 1)
      * (def.passiveRateMult?.(p) ?? 1)
      * (p.sellAtkSlowTtl > 0 ? 1 + (p.sellAtkSlowFrac ?? 0) : 1);
  }
  for (const special of def.specials) {
    if (p[special.key] > 0) special.onTick?.(run, p, dt, ctx);
  }

  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = distance(enemy, p) || 1;
    enemy.stunTtl = Math.max(0, (enemy.stunTtl ?? 0) - dt);
    const smoke = def.passives.find(passive => passive.kind === 'smoke');
    const zone = smoke && run.effects.find(effect => effect.kind === 'smoke' && distance(enemy, effect) <= effect.r);
    if (zone) enemy.smokeIn = Math.min(smoke.stackCap, (enemy.smokeIn ?? 0) + dt);
    else enemy.smokeIn = Math.max(0, (enemy.smokeIn ?? 0) - dt);
    // Smoke stacks on the mind: base slow plus what this enemy has inhaled.
    const smokeSlow = zone ? smoke.slow + enemy.smokeIn * smoke.stackSlow : 0;
    const confusedSlow = confusionSlowFactor(enemy) * (1 - smokeSlow);
    enemy.attackCd = Math.max(0, (enemy.attackCd ?? 0) - dt);
    enemy.confusionTtl = Math.max(0, (enemy.confusionTtl ?? 0) - dt);
    if ((enemy.confusionTtl ?? 0) <= 0) enemy.confusionStacks = 0;
    // Generic enemy rule, shared by every kind: close the distance, stop when
    // the attack distance is reached, then swing on the sheet's own cadence.
    // Reach is measured from the collision edges, so a bigger body stops sooner.
    // A hand-built enemy without a sheet has contact reach and the player's
    // immunity floor as its cadence, which is how partial fixtures behaved.
    const reach = (enemy.attackRange ?? 0) + enemy.radius + p.hitRadius;
    const inReach = dist < reach;
    if ((enemy.stunTtl ?? 0) > 0) {
      // too dazed to walk: spored enemies stand still
    } else if ((enemy.confusionStacks ?? 0) >= 3 && enemy.kind !== 'boss') {
      const drift = disorientedDrift(enemy, run.elapsed);
      const stumble = enemy.speed * confusedSlow * 0.6;
      enemy.x += drift.x * stumble * dt;
      enemy.y += drift.y * stumble * dt;
    } else if (!inReach) {
      enemy.x += (p.x - enemy.x) / dist * enemy.speed * confusedSlow * dt;
      enemy.y += (p.y - enemy.y) / dist * enemy.speed * confusedSlow * dt;
    }
    if (inReach && p.immune <= 0 && (enemy.attackCd ?? 0) <= 0) {
      if (zone && run.random() < smoke.missChance) {
        enemy.attackCd = smoke.missCd ?? 1; // the swing connects with smoke, not flesh
        continue;
      }
      const defenseBonus = def.contactDefenseBonus?.(p) ?? 0;
      const contactDamage = enemyContactDamage(enemy.kind, run.wave);
      let incoming = contactDamage
        * (1 - Math.min(0.75, p.defense * (p.sellDefLossTtl > 0 ? 1 - (p.sellDefLossFrac ?? 0) : 1) + defenseBonus))
        * contactFactor;
      if ((p.shield ?? 0) > 0 && incoming > 0) {
        const absorbed = Math.min(p.shield, incoming);
        p.shield -= absorbed;
        incoming -= absorbed;
        run.effects.push({ x: p.x, y: p.y - 70 * WORLD_SCALE, text: 'BLOQUEO', ttl: 0.6, kind: 'shield' });
      }
      p.hp = Math.max(0, p.hp - incoming);
      p.immune = 0.65;
      const counter = p.rewardBonuses.smileCounter ?? 0;
      if (counter > 0 && (p.smile ?? 0) > 0) hit(run, enemy, p.damage * counter, 'bite');
      // A confused mind swings slower; otherwise the sheet owns the cadence.
      enemy.attackCd = (enemy.confusionStacks ?? 0) >= 2 ? 0.8 : (enemy.attackInterval ?? 0.65);
    }
  }
  for (const shot of run.projectiles) {
    shot.ttl -= dt;
    shot.angle += dt * 12;
    if (shot.vx !== undefined && shot.vy !== undefined) {
      const dx = shot.vx * dt, dy = shot.vy * dt;
      const lengthSquared = dx * dx + dy * dy;
      // Swept collision avoids tunneling through an enemy between frames.
      const collisions = run.enemies.filter(enemy => enemy.hp > 0).map(enemy => {
        const t = lengthSquared ? Math.max(0, Math.min(1,
          ((enemy.x - shot.x) * dx + (enemy.y - shot.y) * dy) / lengthSquared)) : 0;
        return { enemy, t, distance: Math.hypot(enemy.x - shot.x - dx * t, enemy.y - shot.y - dy * t) };
      }).filter(collision => collision.distance <= collision.enemy.radius + shot.radius)
        .sort((a, b) => a.t - b.t);
      if (collisions.length) {
        hit(run, collisions[0].enemy, shot.damage);
        shot.ttl = 0;
      }
      shot.x += dx;
      shot.y += dy;
      continue;
    }
    let target = run.enemies.find(e => e.id === shot.target && e.hp > 0);
    if (!target) {
      shot.ttl = 0;
      continue;
    }
    const dist = distance(shot, target);
    const movement = 530 * WORLD_SCALE * dt;
    if (dist < movement + target.radius) {
      shot.x = target.x;
      shot.y = target.y;
      hit(run, target, shot.damage);
      shot.hit.push(target.id);
      if (shot.attack?.blast) {
        applyConfusion(target, (shot.attack.blast.stacks ?? 1) + (p.rewardBonuses.confusionStacks ?? 0),
          shot.attack.blast.ttl ?? 5.4);
        shroomBlast(run, shot, target);
      }
      if (shot.kind === 'brick') {
        const fragments = p.rewardBonuses.brickFragments ?? 0;
        if (fragments > 0) {
          fireRadial(run, target, shot.damage * 0.35, { count: fragments, speed: 260 * WORLD_SCALE, radius: 6 });
          run.effects.push({ x: target.x, y: target.y - target.radius, text: 'FRAGMENTOS', ttl: 0.7, kind: 'shard' });
        }
      }
      const next = nearest(run, shot, shot.hit);
      const pierce = shot.kind === 'remote' ? (p.rewardBonuses.bounce ?? 0)
        : shot.kind === 'magic' ? (p.rewardBonuses.waifuPierce ?? 0)
        : shot.kind === 'brick' ? (p.rewardBonuses.brickPierce ?? 0) : 0;
      if (shot.hit.length <= pierce && next && distance(next, shot) < 300 * WORLD_SCALE) {
        shot.target = next.id;
        shot.damage *= 0.85;
      } else shot.ttl = 0;
    } else {
      shot.x += (target.x - shot.x) / dist * movement;
      shot.y += (target.y - shot.y) / dist * movement;
    }
  }
  const killed = run.enemies.filter(enemy => enemy.hp <= 0);
  for (const enemy of killed) {
    run.kills++;
    const bounty = run.rewardBalance.gold?.rewards?.[enemy.kind] ?? enemyBounty(enemy.kind);
    awardCoins(run, bounty);
    awardXP(run, run.rewardBalance.xp.rewards[enemy.kind] ?? 0);
    run.effects.push({ x: enemy.x, y: enemy.y, text: `+${bounty}`, ttl: 0.9, loot: true });
    const spread = p.rewardBonuses.confusionChain ?? 0;
    if (spread > 0 && (enemy.confusionStacks ?? 0) >= 3) {
      for (const other of run.enemies) {
        if (other === enemy || other.hp <= 0 || distance(other, enemy) > 130 * WORLD_SCALE) continue;
        applyConfusion(other, 1, 4);
      }
      run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius, text: 'CONTAGIO', ttl: 0.8, kind: 'confusion' });
    }
    if (def.onKill) def.onKill(run, p, enemy, ctx);
    emit('kill', { run, player: p, enemy });
  }
  run.enemies = run.enemies.filter(enemy => enemy.hp > 0);
  run.projectiles = run.projectiles.filter(shot => shot.ttl > 0);
  for (const effect of run.effects) {
    effect.ttl -= dt;
    if (typeof effect.text === 'string') effect.y -= dt * 20;
    // Warrior's spore zone: a lingering patch that keeps poisoning its area.
    if (effect.kind === 'sporeZone') {
      effect.tick = (effect.tick ?? 0) - dt;
      if (effect.tick <= 0) {
        effect.tick = 0.45;
        for (const enemy of run.enemies) {
          if (enemy.hp > 0 && distance(enemy, effect) <= effect.r) {
            hit(run, enemy, effect.damage, 'spore');
            applyConfusion(enemy, 1, 3);
          }
        }
      }
    }
  }
  run.effects = run.effects.filter(effect => effect.ttl > 0);
  if (p.hp <= 0) {
    run.phase = 'dead';
    emit('playerDown', { run, player: p });
  } else if (killed.some(enemy => enemy.kind === 'boss')) {
    run.phase = 'won';
    run.pendingLevels = [];
    run.levelChoices = run.shopOffers = null;
    emit('waveCleared', { run });
  } else if (run.wave < run.rewardBalance.waves.bossWave && run.time >= run.duration) {
    run.phase = 'shop';
    awardCoins(run, run.rewardBalance.gold?.survival ?? 20);
    run.enemies = [];
    run.projectiles = [];
    beginRewards(run);
    emit('waveCleared', { run });
  }
}
