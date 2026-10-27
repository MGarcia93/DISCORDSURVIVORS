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
import { ENEMY_KINDS, enemyBounty, enemyContactDamage, enemyDefense, enemyHp, enemySpeed } from './enemies.mjs';
import { DEFENSE_MITIGATION_CAP } from './stats.mjs';
import { emit } from './bus.mjs';

export function createRun(random = Math.random, character = 'negro') {
  const characterDef = getCharacter(character);
  const s = characterDef.stats;
  const run = {
    phase: 'playing', wave: 1, duration: 60, time: 0, elapsed: 0, coins: 0, kills: 0,
    random, character: characterDef.id, serial: 0, shotCount: 0, spawnIn: 0.8, shotIn: 0,
    player: {
      character: characterDef.id, characterDef,
      x: WIDTH / 2, y: HEIGHT / 2,
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
  return run;
}

export function activateSpecial(run, type) {
  if (run.phase !== 'playing') return false;
  const player = run.player;
  const spec = player.characterDef.specials.find(special => special.key === type);
  if (!spec || player[`${type}Cooldown`] > 0) return false;
  player[type] = spec.duration;
  player[`${type}Cooldown`] = spec.cooldown;
  spec.onStart?.(run, player);
  emit('specialActivated', { run, player, special: type });
  return true;
}

export function chooseUpgrade(run, id) {
  const upgrade = UPGRADES.find(item => item.id === id);
  if (run.phase !== 'shop' || !upgrade) return false;
  const level = run.upgrades[id] || 0;
  if (level >= upgrade.costs.length) return false;
  const cost = upgrade.costs[level];
  if (run.coins < cost) return false;
  run.coins -= cost;
  run.upgrades[id] = level + 1;
  const p = run.player;
  upgrade.apply(p, level);
  return true;
}

export function buyHeal(run) {
  if (run.phase !== 'shop' || run.coins < HEAL_COST || run.player.hp >= run.player.maxHp) return false;
  run.coins -= HEAL_COST;
  run.player.hp = Math.min(run.player.maxHp, run.player.hp + HEAL_AMOUNT);
  return true;
}

function enemyFromKind(run, kind, x, y) {
  const def = ENEMY_KINDS[kind];
  const hp = enemyHp(kind, run.wave);
  return { id: ++run.serial, kind, x, y,
    hp, maxHp: hp, defense: enemyDefense(kind, run.wave),
    radius: def.radius * WORLD_SCALE, speed: enemySpeed(kind, run.wave) };
}

export function startNextWave(run) {
  if (run.phase !== 'shop') return false;
  run.wave++;
  run.duration = 60;
  run.time = 0;
  run.spawnIn = 0.5;
  run.phase = 'playing';
  run.enemies = [];
  run.projectiles = [];
  if (run.wave === 4) {
    run.enemies.push(enemyFromKind(run, 'boss', WIDTH / 2, 80 * WORLD_SCALE));
  }
  return true;
}

function spawn(run) {
  const edge = Math.floor(run.random() * 4);
  const kind = run.wave > 1 && run.random() < 0.3 ? 'runner' : 'zombie';
  const enemy = enemyFromKind(run, kind,
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
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0 || shot.hit.includes(enemy.id)) continue;
    if (distance(enemy, impact) > shot.attack.blast.radius) continue;
    hit(run, enemy, shot.damage, 'spore');
    applyConfusion(enemy, shot.attack.blast.stacks ?? 1, shot.attack.blast.ttl ?? 5.4);
  }
  run.effects.push({ x: impact.x, y: impact.y, text: '☁', ttl: 0.5, kind: 'spore' });
}

function nearest(run, origin, excluded = [], maxDistance = Infinity) {
  return run.enemies.filter(e => e.hp > 0 && !excluded.includes(e.id)
      && distance(e, origin) <= maxDistance)
    .sort((a, b) => distance(a, origin) - distance(b, origin))[0];
}

function fire(run, source, damage, kind, maxDistance = Infinity, attack = null) {
  const target = nearest(run, source, [], maxDistance);
  if (!target) return;
  const device = kind === 'remote' ? ['remote', 'joystick', 'phone'][run.shotCount++ % 3] : 'magic';
  run.projectiles.push({ x: source.x, y: source.y, target: target.id,
    damage, kind, device, hit: [], ttl: 3, angle: 0, attack });
}

function hit(run, enemy, damage, kind = 'damage') {
  const elemental = (enemy.confusionStacks ?? 0) >= 3 ? 1.5 : 1;
  enemy.hp -= damage * elemental * (1 - Math.min(DEFENSE_MITIGATION_CAP, enemy.defense ?? 0));
  run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius, text: `${Math.round(damage)}`, ttl: 0.65, kind });
}

function attackMelee(run) {
  const p = run.player;
  const target = nearest(run, p);
  if (!target || distance(target, p) > p.attackRange) return;
  const combat = p.characterDef.combat || {};
  const damage = p.damage * (p.permissionActive > 0 ? (combat.permissionDamageMult ?? 1) : 1);
  hit(run, target, damage, 'bite');
  p.attackFlash = 0.22;
  run.effects.push({ x: target.x, y: target.y - target.radius - 12, text: '✦', ttl: 0.35, kind: 'bite' });
}

export function step(run, seconds, input = {}) {
  if (run.phase !== 'playing') return;
  const dt = Math.min(0.05, Math.max(0, seconds));
  const p = run.player;
  const def = p.characterDef;
  const ctx = { hit, distance, nearest, fire };
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
    const speed = p.speed * speedFactor;
    p.x = Math.max(24 * WORLD_SCALE, Math.min(WIDTH - 24 * WORLD_SCALE, p.x + mx / magnitude * speed * dt));
    p.y = Math.max(28 * WORLD_SCALE, Math.min(HEIGHT - 24 * WORLD_SCALE, p.y + my / magnitude * speed * dt));
    p.still = 0;
  } else {
    p.still += dt;
    if (p.still >= 2) {
      p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
      def.onStill?.(run, p);
    }
  }

  run.spawnIn -= dt;
  if (run.wave < 4 && run.spawnIn <= 0 && run.enemies.length < 120) {
    spawn(run);
    run.spawnIn = Math.max(0.24, 0.85 - run.wave * 0.07 - run.time * 0.006);
  }
  run.shotIn -= dt;
  if (run.shotIn <= 0) {
    if (def.attack.type === 'melee') attackMelee(run);
    else fire(run, p, p.damage, def.attack.device, p.attackRange, def.attack);
    const combat = def.combat || {};
    run.shotIn = p.shotInterval * (p.permissionActive > 0 ? (combat.permissionRateMult ?? 1) : 1);
  }
  for (const special of def.specials) {
    if (p[special.key] > 0) special.onTick?.(run, p, dt, ctx);
  }

  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = distance(enemy, p) || 1;
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
    if ((enemy.confusionStacks ?? 0) >= 3 && enemy.kind !== 'boss') {
      const drift = disorientedDrift(enemy, run.elapsed);
      const stumble = enemy.speed * confusedSlow * 0.6;
      enemy.x += drift.x * stumble * dt;
      enemy.y += drift.y * stumble * dt;
    } else {
      enemy.x += (p.x - enemy.x) / dist * enemy.speed * confusedSlow * dt;
      enemy.y += (p.y - enemy.y) / dist * enemy.speed * confusedSlow * dt;
    }
    if (dist < enemy.radius + p.hitRadius && p.immune <= 0 && (enemy.attackCd ?? 0) <= 0) {
      if (zone && run.random() < smoke.missChance) {
        enemy.attackCd = smoke.missCd ?? 1; // the swing connects with smoke, not flesh
        continue;
      }
      const defenseBonus = def.contactDefenseBonus?.(p) ?? 0;
      const contactDamage = enemyContactDamage(enemy.kind);
      p.hp = Math.max(0, p.hp - contactDamage * (1 - Math.min(0.75, p.defense + defenseBonus)) * contactFactor);
      p.immune = 0.65;
      if ((enemy.confusionStacks ?? 0) >= 2) enemy.attackCd = 0.8; // slowed mind, slower swings
    }
  }
  for (const shot of run.projectiles) {
    shot.ttl -= dt;
    shot.angle += dt * 12;
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
        applyConfusion(target, shot.attack.blast.stacks ?? 1, shot.attack.blast.ttl ?? 5.4);
        shroomBlast(run, shot, target);
      }
      const next = nearest(run, shot, shot.hit);
      if (shot.kind === 'remote' && shot.hit.length < 3 && next && distance(next, shot) < 300 * WORLD_SCALE) {
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
    run.coins += enemyBounty(enemy.kind);
    run.effects.push({ x: enemy.x, y: enemy.y, text: '+2', ttl: 0.9, loot: true });
    if (def.onKill) def.onKill(run, p, enemy, ctx);
    emit('kill', { run, player: p, enemy });
  }
  run.enemies = run.enemies.filter(enemy => enemy.hp > 0);
  run.projectiles = run.projectiles.filter(shot => shot.ttl > 0);
  for (const effect of run.effects) { effect.ttl -= dt; effect.y -= dt * 20; }
  run.effects = run.effects.filter(effect => effect.ttl > 0);
  if (p.hp <= 0) {
    run.phase = 'dead';
    emit('playerDown', { run, player: p });
  } else if (killed.some(enemy => enemy.kind === 'boss')) {
    run.phase = 'won';
    emit('waveCleared', { run });
  } else if (run.wave < 4 && run.time >= run.duration) {
    run.phase = 'shop';
    run.coins += 20;
    run.enemies = [];
    run.projectiles = [];
    emit('waveCleared', { run });
  }
}
