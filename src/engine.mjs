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
import { ENEMY_KINDS, enemyBounty, enemyCombatStats } from './enemies/index.mjs';
import { DEFENSE_MITIGATION_CAP } from './stats.mjs';
import { pickKind, spawnInterval, waveBudget, waveConfig } from './waves.mjs';
import { DEFAULT_ACT } from './campaign/acts.mjs';
import { emit } from './bus.mjs';
import { createStatState, applyLiveStats } from './stat-modifiers.mjs';
import { initializeRewards, awardXP, beginRewards, finishRewards, recordLegacyUpgrade } from './run-rewards.mjs';
export { chooseLevelReward, skipEmptyChoice, buyItem, nextLevelXP } from './run-rewards.mjs';

// Safety net: the per-wave budget is the real limiter, this only stops a wave
// from ever flooding the arena if its data asks for an absurd density.
const ALIVE_CAP = 120;
// Seconds of grace after a contact hit. Zero means every enemy lands its own
// swing: standing in a pack kills, which is how the genre behaves.
const CONTACT_IMMUNITY = 0;
// Seconds a body has to wait before the next shove lands on it.
const KNOCK_COOLDOWN = 1;

export function createRun(random = Math.random, character = 'negro', rewards = {}, act = DEFAULT_ACT) {
  const characterDef = getCharacter(character);
  const s = characterDef.stats;
  const run = {
    phase: 'playing', wave: 1, duration: act.duration, time: 0, elapsed: 0, coins: 0, kills: 0,
    worldCleared: false,
    act, random, character: characterDef.id, serial: 0, shotCount: 0, spawnIn: 0.8, shotIn: 0, shockwaves: [],
    player: {
      character: characterDef.id, characterDef,
       x: WIDTH / 2, y: HEIGHT / 2,
       lastMoveX: 0, lastMoveY: 0,
      hp: s.maxHp, maxHp: s.maxHp, defense: s.defense, damage: s.damage,
      hitRadius: s.hitRadius, attackRange: s.attackRange, shotInterval: s.shotInterval,
      speed: s.speed,
      regen: 0, still: 0, immune: 0, attackFlash: 0, hurtFlash: 0,
      swingFacing: 1,
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
  // The act owns the real wave length. The environment balance only shortens it
  // for local playtests, which is what `balanceFor` injects.
  run.duration = run.rewardBalance.waves?.duration ?? act.duration;
  run.spawnBudget = waveBudget(act, run.wave, run.duration);
  run.spawnIn = spawnInterval(run.duration, run.spawnBudget);
  return run;
}

export function activateSpecial(run, type) {
  // A muted player has no specials: the Administrator's `/mute` and the hotfix
  // waves both land here.
  if (run.phase !== 'playing' || (run.specialsLocked ?? 0) > 0) return false;
  const player = run.player;
  const spec = player.characterDef.specials.find(special => special.key === type);
  if (!spec) return false;
  // A cancellable special is a seat, not a sentence: the same key ends the
  // window early and the cooldown it already paid stays spent. The window keeps
  // a sliver of time instead of dropping to zero, so the next step still sees
  // it active and runs the special's own onExpire.
  if (spec.cancellable && (player[type] ?? 0) > 0) {
    player[type] = Math.min(player[type], Number.EPSILON);
    emit('specialCancelled', { run, player, special: type });
    return true;
  }
  if (player[`${type}Cooldown`] > 0) return false;
  player[type] = spec.duration + (player.rewardBonuses[spec.durationBonus] ?? 0);
  // A sheet may pay for the use at the moment it lands instead of at the press:
  // a merchant pays when something is sold, not when the counter is opened.
  if (!spec.cooldownOnSale) player[`${type}Cooldown`] = spec.cooldown;
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

export function salePrice(run, item) {
  return Math.floor(item.coins * (1 + (run.player.rewardBonuses?.saleBonus ?? 0)));
}

// «Liquido todo, me voy de putas»: the character-agnostic sale routine. The
// owned belongings and every number live in the sheet (special.items); this
// engine routine applies a sale's shape: coins now and a temporary stat source
// with the sheet's own signed modifiers. There is no sale-only ceiling: the
// system already resolves every statistic against the body's declared caps and
// refuses a combination that would make one impossible, the same way it refuses
// an item that would.
export function sellBelonging(run, key) {
  if (run.phase !== 'playing') return false;
  const p = run.player;
  const item = p.characterDef.specials?.find(s => s.key === 'sell')?.items?.[key];
  if (!item || p.soldItems?.[key]) return false;
  // «Penalizaciones de venta reducidas» softens what the sheet charges, never
  // what it pays: buffs keep their value, penalties shrink.
  const penalty = 1 - Math.min(0.4, p.rewardBonuses?.salePenalty ?? 0);
  const modifiers = (item.modifiers ?? []).map(modifier =>
    (modifier.value < 0 ? { ...modifier, value: modifier.value * penalty } : modifier));
  const sources = { ...(p.tempSources ?? {}), [key]: modifiers };
  // Resolve before touching the body: an impossible sale is refused, not clamped.
  try {
    applyLiveStats(p, run.statState, sources);
  } catch {
    return false;
  }
  p.soldItems = p.soldItems ?? {};
  p.soldItems[key] = true;
  p.tempSources = sources;
  p.tempTtls = { ...(p.tempTtls ?? {}), [key]: item.ttl };
  const proceeds = salePrice(run, item);
  run.coins += proceeds;
  // The sale, not the menu, is what spends the ability: opening the counter and
  // walking away costs nothing, and one sale closes it for the cooldown.
  const sale = p.characterDef.specials?.find(s => s.key === 'sell');
  if (sale?.cooldownOnSale) p[`${sale.key}Cooldown`] = sale.cooldown;
  p.characterDef.onSaleIncome?.(run, p, proceeds);
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
  // The sheet owns the six combat stats at the run's wave; the act only scales
  // them with the tier it declares for THIS kind, stat by stat.
  const stats = enemyCombatStats(kind, run.wave, run.act.statMultipliers?.[kind]);
  // A wave may declare a speed boost: the Administrator's hotfix makes the wave
  // it touches faster without any sheet knowing about it.
  const boost = waveConfig(run.act, run.wave)?.speedBoost ?? 1;
  return { id: ++run.serial, kind, x, y,
    hp: stats.hp, maxHp: stats.hp, defense: stats.defense,
    contactDamage: stats.contactDamage,
    radius: def.radius * WORLD_SCALE, speed: stats.speed * boost,
    attackRange: stats.attackRange, attackInterval: stats.attackInterval,
    projectile: def.projectile,
    actions: def.actions, boss: def.boss === true };
}

// Loads one wave into a run: clock, budget, locks, mini-boss line and boss. The
// engine uses it to advance; the balance lab uses it to start at any wave, so a
// jumped-to wave is the same wave the campaign would serve.
export function seedWave(run, wave) {
  run.wave = wave;
  run.duration = run.rewardBalance.waves?.duration ?? run.act.duration;
  run.time = 0;
  run.spawnBudget = waveBudget(run.act, wave, run.duration);
  run.spawnIn = spawnInterval(run.duration, run.spawnBudget);
  // A wave may declare a temporary lock: hotfix 1.0.5 cuts the cast's specials
  // for the first seconds of the wave that declares it.
  run.specialsLocked = waveConfig(run.act, wave)?.specialLock ?? 0;
  run.gauntletCleared = false;
  run.phase = 'playing';
  run.enemies = [];
  run.projectiles = [];
  delete run.minibossLine;
  // A wave boundary is a fresh start for the whole kit: nothing stays active
  // across it, and a clock that was still running opens the next wave at half
  // price so the ability comes back sooner instead of the same dead wait.
  const sheet = run.player.characterDef;
  for (const special of sheet.specials) {
    run.player[special.key] = 0;
    const clock = run.player[`${special.key}Cooldown`] ?? 0;
    if (clock > 0) run.player[`${special.key}Cooldown`] = clock / 2;
  }
  // The chango refills only once it was emptied: a belonging sold stays sold
  // across the waves, and the wave after the last one opens a fresh counter.
  const chango = sheet.specials.find(special => special.items);
  if (chango && Object.keys(chango.items).every(key => run.player.soldItems?.[key])) {
    run.player.soldItems = {};
  }
  run.player.characterDef.onStageStart?.(run, run.player);
  // The act may declare mini-bosses before the boss: they arrive on their own
  // wave, one at a time, and killing one never closes the run.
  // A line belongs to the wave it names: an act may hold one mini-boss on wave
  // three and another on wave five, and each opens its own line. Act 5's four
  // entries on one wave read as one line, exactly as before.
  const line = minibossLine(run.act).filter(entry => entry.wave === wave);
  if (line.length) {
    run.minibossLine = { list: line, index: 0 };
    run.enemies.push(gauntletEnemy(run, 0, line[0].kind));
  }
  if (wave === run.act.boss.wave) {
    run.enemies.push(createEnemy(run, run.act.boss.kind,
      WIDTH / 2, 80 * WORLD_SCALE));
  }
  return run;
}

export function startNextWave(run) {
  if (run.phase !== 'shop' || !finishRewards(run)) return false;
  seedWave(run, run.wave + 1);
  return true;
}

// One mini-boss or a line of them. The act decides which shape it uses; the
// engine only reads it as an ordered list.
function minibossLine(act) {
  const declared = act?.miniboss;
  if (!declared) return [];
  return Array.isArray(declared) ? declared : [declared];
}

function gauntletEnemy(run, index, kind) {
  const enemy = createEnemy(run, kind, WIDTH / 2, 90 * WORLD_SCALE);
  enemy.gauntlet = index;
  return enemy;
}

// An untimed wave holds its screen until its mini-boss line is cleared.
function waveOver(run) {
  // A boss owns the screen: no clock, flag or cleared line may close a wave
  // while one is still standing. Killing it is the only way out of the fight.
  if (run.enemies.some(enemy => enemy.hp > 0 && enemy.boss)) return false;
  const untimed = waveConfig(run.act, run.wave)?.untimed === true;
  if (untimed) return run.gauntletCleared === true;
  return run.time >= run.duration;
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
  const cap = enemy.boss ? 1 : 3;
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

// One reusable selector; the abilities themselves belong to each ficha. When an
// enemy's attack clock opens, the engine rolls among the actions that are off
// cooldown, weighted by their chance, and hands the winner to the sheet.
function pickAction(run, enemy, { inReach = false, distance: gap = Infinity } = {}) {
  const actions = enemy.actions;
  if (!actions?.length) return null;
  // An action with `range` is a ranged ability: it fires without contact. The
  // boss has to do something while it is still walking toward the player.
  const ready = actions.filter(action => (action.chance ?? 1) > 0
    && (enemy.actionCds?.[action.key] ?? 0) <= 0
    && (action.range === undefined ? inReach : gap <= action.range)
    // A phase-locked ability says when it is available; without this the boss
    // would spend a turn on an action whose condition is still false.
    && (!action.when || action.when(run, enemy)));
  if (!ready.length) return null;
  const share = ready.reduce((sum, action) => sum + (action.chance ?? 1), 0);
  let roll = run.random() * share;
  for (const action of ready) {
    roll -= action.chance ?? 1;
    if (roll < 0) return action;
  }
  return ready[ready.length - 1];
}

function nearest(run, origin, excluded = [], maxDistance = Infinity) {
  return run.enemies.filter(e => e.hp > 0 && !excluded.includes(e.id)
      && distance(e, origin) <= maxDistance)
    .sort((a, b) => distance(a, origin) - distance(b, origin))[0];
}

function fire(run, source, damage, kind, maxDistance = Infinity, attack = null) {
  const target = nearest(run, source, [], maxDistance);
  if (!target) return null;
  const device = kind === 'remote' ? ['remote', 'joystick', 'phone'][run.shotCount++ % 3]
    : kind === 'brick' ? 'brick'
    : kind === 'shroom' ? 'shroom'
    : kind === 'bottle' ? 'bottle'
    : kind === 'voice' ? 'voice' : 'magic';
  // A sheet may ask for a wave instead of a homing shot: it leaves in the
  // target's direction once, keeps that heading, and hits everything its own
  // width touches on the way. No re-targeting, no bouncing.
  if (attack?.straight) {
    // Aim and travel happen on the ground line, like every other shot; the
    // ficha lifts only the drawing so the wave reads as leaving the mouth.
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const speed = (attack.speed ?? 520) * WORLD_SCALE;
    const width = attack.width ?? 12;
    const wave = { x: source.x, y: source.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      damage, kind, device, hit: [], ttl: Math.max(0.5, maxDistance / speed + 0.25),
      angle, spin: false, through: true, lift: attack.lift ?? 0, lead: attack.lead ?? 0,
      radius: Math.max(4, width / 2) * WORLD_SCALE, width };
    run.projectiles.push(wave);
    emit('shot', { run, kind });
    return wave;
  }
  const shot = { x: source.x, y: source.y, target: target.id,
    damage, kind, device, hit: [], ttl: 3, attack,
    // A wave points where it was thrown and never tumbles; everything else
    // keeps the cast's spinning shot.
    angle: attack?.align ? Math.atan2(target.y - source.y, target.x - source.x) : 0,
    spin: attack?.spin ?? true,
    pierce: attack?.pierce, width: attack?.width };
  run.projectiles.push(shot);
  // One shot, one sound: the event fires where the projectile exists, so an
  // empty range stays silent instead of clicking at nothing.
  emit('shot', { run, kind });
  const extra = kind === 'shroom' ? (run.player.rewardBonuses.extraShroom ?? 0)
    : kind === 'brick' ? (run.player.rewardBonuses.brickFan ?? 0) : 0;
  // A second mushroom is a second mushroom: it lands exactly what the first one
  // lands, because the reward says "one more" and a weaker copy reads as a nerf.
  // The brick fan does spread, so each extra brick travels lighter.
  const spread = kind === 'shroom' ? 1 : 0.6;
  const used = [target.id];
  for (let index = 0; index < extra; index++) {
    const alt = nearest(run, source, used, maxDistance);
    if (!alt) break;
    used.push(alt.id);
    run.projectiles.push({ x: source.x, y: source.y, target: alt.id,
      damage: damage * spread, kind, device, hit: [], ttl: 3, angle: 0, attack });
  }
  return shot;
}

// A ring that grows out of a point and hurts the player once as it passes them.
// Offered to enemy abilities through ctx, so a boss can ring without new engine
// branches per enemy.
// A temporary ring of raised earth. Only the player is held by it: the dead walk
// through their own grave, so the prison is a trap and not a shelter.
function prison(run, { x, y, radius, ttl = 4 }) {
  run.prison = { x, y, radius, ttl };
}

function shockwave(run, { x, y, damage, speed = 320 * WORLD_SCALE, maxRadius = 340 * WORLD_SCALE }) {
  run.shockwaves = run.shockwaves ?? [];
  run.shockwaves.push({ x, y, damage, speed, maxRadius, radius: 0, hit: false });
}

// Untargeted rings keep their launch direction, even in an empty arena. A ring
// is a wall, not a bullet: every brick crosses the bodies in its path instead of
// dying on the first one, which is what made the ability look like it reached
// the screen edge while only the closest body took anything.
function fireRadial(run, source, damage, { count, speed, radius }) {
  for (let i = 0; i < count; i++) {
    const direction = i * Math.PI * 2 / count;
    const dx = Math.cos(direction), dy = Math.sin(direction);
    run.projectiles.push({ x: source.x + dx * radius, y: source.y + dy * radius,
      vx: dx * speed, vy: dy * speed, damage, kind: 'brick', device: 'brick',
      through: true, hit: [], ttl: 2.4, angle: direction, radius: 3 * WORLD_SCALE });
  }
}

// One place decides how much of an incoming hit reaches the player: defence,
// the sold-defence penalty, the character's situational bonus, the shield and
// the immunity floor. A swing and a projectile both go through it, so the two
// can never drift apart.
// A special may hand the body a window where nothing lands: La Patrona takes
// the hits while Solago cannot step out of them.
function invulnerable(p) {
  return (p.characterDef.specials ?? []).some(special => special.invulnerable === true && (p[special.key] ?? 0) > 0);
}

function hurtPlayer(run, enemy, damage, { defenseBonus = 0, contactFactor = 1 } = {}) {
  const p = run.player;
  if (invulnerable(p)) return 0;
  const defenseMult = p.characterDef.passiveDefenseMult?.(p) ?? 1;
  let incoming = damage
    * (1 - Math.min(0.75, p.defense * defenseMult + defenseBonus))
    * contactFactor;
  if ((p.shield ?? 0) > 0 && incoming > 0) {
    const absorbed = Math.min(p.shield, incoming);
    p.shield -= absorbed;
    incoming -= absorbed;
    run.effects.push({ x: p.x, y: p.y - 70 * WORLD_SCALE, text: 'BLOQUEO', ttl: 0.6, kind: 'shield' });
  }
  // A hit that reaches the body may feed the ficha's own mechanic (Jhony's
  // Tilt); every other sheet simply declares no hook.
  if (incoming > 0) p.characterDef.onDamaged?.(run, p, incoming,
    { hit, distance, nearest, fireRadial });
  p.hp = Math.max(0, p.hp - incoming);
  if (incoming > 0) p.hurtFlash = 0.3;
  // No grace window after a contact hit: every enemy swings on its own clock,
  // so a crowd lands a crowd's worth of damage. Only the boss rings still grant
  // immunity, because a ring is one attack, not a body.
  p.immune = CONTACT_IMMUNITY;
  const counter = p.rewardBonuses.smileCounter ?? 0;
  if (counter > 0 && (p.smile ?? 0) > 0 && enemy) hit(run, enemy, p.damage * counter, 'bite');
  return incoming;
}

// A body built by hand (tests, dev viewers) may skip the sheet lookup. When it
// does, the fallback still reads the sheet at the act's tier: an act-5 body
// cannot silently land with its act-1 damage.
function contactDamageOf(run, enemy) {
  return enemy.contactDamage ?? enemyCombatStats(enemy.kind, run.wave, run.act?.statMultipliers?.[enemy.kind]).contactDamage;
}

// A ranged enemy's shot is the player's projectile with another owner: it leaves
// the enemy toward where the player stands and flies straight, so stepping out
// of it works. The ficha only names the art and the damage it carries.
function fireEnemyShot(run, enemy) {
  const p = run.player;
  const dx = p.x - enemy.x;
  const dy = p.y - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  const speed = 300 * WORLD_SCALE;
  run.projectiles.push({
    x: enemy.x, y: enemy.y,
    vx: dx / length * speed, vy: dy / length * speed,
    team: 'enemy', device: enemy.projectile ?? 'bolt',
    damage: contactDamageOf(run, enemy),
    radius: 5 * WORLD_SCALE, ttl: 3, angle: Math.atan2(dy, dx), hit: [],
  });
}

// A sheet that spits asks for a shot, not for a heading: the engine aims it at
// the player and the ficha names the projectile shape, its damage and its speed.
// This is how a boss attacks at distance without making its whole sheet ranged,
// which would turn every claw into a projectile too.
function enemyShot(run, { x = 0, y = 0, device = 'bolt', damage = 0, speed = 300 } = {}) {
  const p = run.player;
  const dx = p.x - x;
  const dy = p.y - y;
  const length = Math.hypot(dx, dy) || 1;
  const travel = speed * WORLD_SCALE;
  run.projectiles.push({
    x, y,
    vx: dx / length * travel, vy: dy / length * travel,
    team: 'enemy', device, damage,
    radius: 6 * WORLD_SCALE, ttl: 4, angle: Math.atan2(dy, dx), hit: [],
  });
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
  const damage = p.damage * (p.permissionActive > 0 ? (combat.permissionDamageMult ?? 1) : 1)
    * (p.characterDef.passiveDamageMult?.(p) ?? 1);
  const extra = Math.min(inReach.length - 1, p.rewardBonuses.biteTargets ?? 0);
  hit(run, inReach[0], damage, 'bite');
  for (let index = 1; index <= extra; index++) hit(run, inReach[index], damage * 0.7, 'bite');
  const second = p.rewardBonuses.secondBite ?? 0;
  if (second > 0 && inReach[0].hp > 0) hit(run, inReach[0], damage * second, 'bite');
  // The push belongs to the ficha (a bite shoves, a remote does not) and the
  // upgrade adds to it instead of replacing it.
  const push = (p.rewardBonuses.knockback ?? 0) + (combat.knockback ?? 0);
  if (push > 0) {
    // A shove has a cooldown per body: without one, a fast bite pins a boss at
    // arm's length forever and it never gets to swing.
    const now = run.elapsed;
    for (const enemy of inReach.slice(0, 1 + extra)) {
      if ((enemy.shoveAt ?? -Infinity) + KNOCK_COOLDOWN > now) continue;
      enemy.shoveAt = now;
      const away = distance(enemy, p) || 1;
      enemy.x += (enemy.x - p.x) / away * push * WORLD_SCALE;
      enemy.y += (enemy.y - p.y) / away * push * WORLD_SCALE;
    }
  }
  p.attackFlash = 0.22;
  // Where the blow landed: the sprite turns to that side while the swing shows.
  p.swingFacing = inReach[0].x < p.x ? -1 : 1;
  run.effects.push({ x: inReach[0].x, y: inReach[0].y - inReach[0].radius - 12,
    text: combat.hitText ?? '✦', ttl: 0.35, kind: combat.hitKind ?? 'bite' });
  // The sheet may hang its own follow-ups on the swing (glass shards, a thrown
  // bottle); the engine only says that a botellazo landed.
  p.characterDef.onMeleeHit?.(run, p, inReach[0], { hit, distance, nearest, fireRadial });
}

export function step(run, seconds, input = {}) {
  if (run.phase !== 'playing') return;
  const dt = Math.min(0.05, Math.max(0, seconds));
  const p = run.player;
  const def = p.characterDef;
   const ctx = { hit, distance, nearest, fire, fireRadial, confuse: applyConfusion, movement: input,
     spawnEnemy: (kind, x, y) => { const enemy = createEnemy(run, kind, x, y); run.enemies.push(enemy); return enemy; },
     // A sheet that calls a crowd asks for walkers, not for positions: they walk
     // in from the same edges the wave spawner uses, never out of the boss's
     // body. It also keeps the arena cap, so no boss can flood past it.
     spawnAtEdge: kind => (run.enemies.length < ALIVE_CAP ? spawn(run, kind) : null),
     shockwave: options => shockwave(run, options),
     prison: options => prison(run, options),
     // A ranged ability: the ficha says what leaves its mouth and how hard it
     // lands, the engine owns the aim.
     enemyShot: options => enemyShot(run, options),
     // `/mute`: the ficha asks for the lock, the engine owns the clock.
     lockSpecials: seconds => { run.specialsLocked = Math.max(run.specialsLocked ?? 0, seconds); } };
  run.time += dt;
  run.elapsed += dt;
  run.specialsLocked = Math.max(0, (run.specialsLocked ?? 0) - dt);
  const decayKeys = [
    'immune', 'attackFlash', 'hurtFlash',
    ...def.specials.flatMap(special => [special.key, `${special.key}Cooldown`]),
    ...def.passives.flatMap(passive => [passive.key, `${passive.key}Cooldown`]),
    ...def.decays,
  ];
  const wasActive = def.specials.map(special => p[special.key] > 0);
  for (const key of decayKeys) p[key] = Math.max(0, p[key] - dt);
  // Temporary stat sources expire on the engine's clock. Dropping one reapplies
  // the permanent build plus whatever is still alive, so the body never keeps a
  // debuff whose window closed.
  if (p.tempTtls) {
    let expired = false;
    for (const key of Object.keys(p.tempTtls)) {
      p.tempTtls[key] = Math.max(0, p.tempTtls[key] - dt);
      if (p.tempTtls[key] <= 0) {
        delete p.tempSources[key];
        delete p.tempTtls[key];
        expired = true;
      }
    }
    if (expired) applyLiveStats(p, run.statState, p.tempSources);
  }
  for (const passive of def.passives) passive.tick?.(run, p, dt, ctx);
  // A sheet with its own per-frame mechanic (Jhony's Tilt) asks here; the
  // engine owns the clock, the ficha owns the rule.
  def.onTick?.(run, p, dt, ctx);
  def.specials.forEach((special, i) => {
    if (wasActive[i] && p[special.key] <= 0) special.onExpire?.(run, p, ctx);
  });
  let speedFactor = 1;
  let contactFactor = 1;
  let immobilized = false;
  let covering = false;
  for (const special of def.specials) {
    if (p[special.key] > 0) {
      speedFactor *= special.speedFactor ?? 1;
      contactFactor *= special.contactFactor ?? 1;
      immobilized ||= special.immobilize === true;
      // A sheet may hand its own attack to someone else for the window: La
      // Patrona fights while Solago covers up, so the body never swings.
      covering ||= special.noAttack === true;
    }
  }
  const mx = immobilized ? 0 : (input.x || 0);
  const my = immobilized ? 0 : (input.y || 0);
  const magnitude = Math.hypot(mx, my);
  if (magnitude) {
    p.lastMoveX = mx / magnitude;
    p.lastMoveY = my / magnitude;
    const speed = p.speed * speedFactor * (def.passiveSpeedMult?.(p) ?? 1);
    p.x = Math.max(24 * WORLD_SCALE, Math.min(WIDTH - 24 * WORLD_SCALE, p.x + mx / magnitude * speed * dt));
    p.y = Math.max(28 * WORLD_SCALE, Math.min(HEIGHT - 24 * WORLD_SCALE, p.y + my / magnitude * speed * dt));
    if (run.prison) {
      const dx = p.x - run.prison.x, dy = p.y - run.prison.y;
      const gap = Math.hypot(dx, dy);
      const limit = Math.max(0, run.prison.radius - p.hitRadius);
      if (gap > limit && gap > 0) {
        p.x = run.prison.x + dx / gap * limit;
        p.y = run.prison.y + dy / gap * limit;
      }
    }
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
  const spawnConfig = waveConfig(run.act, run.wave);
  if (spawnConfig && run.spawnBudget > 0 && run.spawnIn <= 0 && run.enemies.length < ALIVE_CAP) {
    const kind = pickKind(spawnConfig, run.random, run.duration ? run.time / run.duration : 0);
    if (kind) {
      spawn(run, kind);
      run.spawnBudget--;
      run.spawnIn = spawnInterval(run.duration - run.time, run.spawnBudget);
    }
  }
  run.shotIn -= dt;
  if (run.shotIn <= 0 && !covering) {
    if (def.attack.type === 'melee') attackMelee(run);
    else {
      const empowered = p.sellNextMult ?? 1;
      const fired = fire(run, p, p.damage * (def.attack.damageMultiplier ?? 1)
        * empowered
        * (def.passiveDamageMult?.(p) ?? 1),
        def.attack.device, p.attackRange, def.attack);
      // A sheet that hangs extra waves off its own cadence counts real shots
      // only: an empty arena never advances the collector's tally.
      if (fired) def.onShot?.(run, p, ctx, fired);
      p.sellNextMult = 1;
    }
    const combat = def.combat || {};
    run.shotIn = p.shotInterval * (p.permissionActive > 0 ? (combat.permissionRateMult ?? 1) : 1)
      * (def.passiveRateMult?.(p) ?? 1);
  }
  for (const special of def.specials) {
    if (p[special.key] > 0) special.onTick?.(run, p, dt, ctx);
  }

  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = distance(enemy, p) || 1;
    enemy.stunTtl = Math.max(0, (enemy.stunTtl ?? 0) - dt);
    enemy.chargeTtl = Math.max(0, (enemy.chargeTtl ?? 0) - dt);
    // A charge is a temporary speed multiplier the ficha starts; the engine only
    // expires it, so the boss never learns how to charge.
    const charge = (enemy.chargeTtl ?? 0) > 0 ? (enemy.chargeBoost ?? 1) : 1;
    const smoke = def.passives.find(passive => passive.kind === 'smoke');
    const zone = smoke && run.effects.find(effect => effect.kind === 'smoke' && distance(enemy, effect) <= effect.r);
    if (zone) enemy.smokeIn = Math.min(smoke.stackCap, (enemy.smokeIn ?? 0) + dt);
    else enemy.smokeIn = Math.max(0, (enemy.smokeIn ?? 0) - dt);
    // Smoke stacks on the mind: base slow plus what this enemy has inhaled.
    const smokeSlow = zone ? smoke.slow + enemy.smokeIn * smoke.stackSlow : 0;
    const confusedSlow = confusionSlowFactor(enemy) * (1 - smokeSlow);
    enemy.attackCd = Math.max(0, (enemy.attackCd ?? 0) - dt);
    if (enemy.actionCds) {
      for (const key of Object.keys(enemy.actionCds)) {
        enemy.actionCds[key] = Math.max(0, enemy.actionCds[key] - dt);
      }
    }
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
    } else if ((enemy.confusionStacks ?? 0) >= 3 && !enemy.boss) {
      const drift = disorientedDrift(enemy, run.elapsed);
      const stumble = enemy.speed * confusedSlow * 0.6;
      enemy.x += drift.x * stumble * dt;
      enemy.y += drift.y * stumble * dt;
    } else if (!inReach) {
      // The sprite faces the way it walks: a body crossing the arena to the left
      // must not keep looking right.
      if (Math.abs(p.x - enemy.x) > 1) enemy.facing = p.x < enemy.x ? -1 : 1;
      enemy.x += (p.x - enemy.x) / dist * enemy.speed * charge * confusedSlow * dt;
      enemy.y += (p.y - enemy.y) / dist * enemy.speed * charge * confusedSlow * dt;
    }
    const action = (enemy.attackCd ?? 0) <= 0
      ? (enemy.actions ? pickAction(run, enemy, { inReach, distance: dist }) : (inReach ? { key: 'swipe', kind: 'melee' } : null))
      : null;
    if (action && action.kind !== 'melee') {
      // The ficha owns the effect; the engine only pays the clock and cooldown.
      enemy.actionCds = enemy.actionCds ?? {};
      enemy.actionCds[action.key] = action.cooldown ?? 0;
      enemy.attackCd = enemy.attackInterval ?? 0.65;
      action.run?.(run, enemy, ctx);
    } else if (action) {
      if (zone && run.random() < smoke.missChance) {
        enemy.attackCd = smoke.missCd ?? 1; // the swing connects with smoke, not flesh
        continue;
      }
      // A kind with reach does not teleport its damage: it fires. Anything with
      // contact reach still lands the swing on the player's body.
      if ((enemy.attackRange ?? 0) > 0) fireEnemyShot(run, enemy);
      // A melee action may declare its own damage: the boss's cleave is not the
      // contact swing, and the ficha says so instead of the engine knowing it.
      else hurtPlayer(run, enemy, action.damage ?? contactDamageOf(run, enemy), {
        defenseBonus: def.contactDefenseBonus?.(p) ?? 0, contactFactor,
      });
      // A confused mind swings slower; otherwise the sheet owns the cadence.
      enemy.attackCd = (enemy.confusionStacks ?? 0) >= 2 ? 0.8 : (enemy.attackInterval ?? 0.65);
    }
  }
  for (const wave of run.shockwaves ?? []) {
    const before = wave.radius;
    wave.radius += wave.speed * dt;
    const gap = distance(wave, p);
    if (!wave.hit && p.immune <= 0 && !invulnerable(p) && gap + p.hitRadius >= before && gap - p.hitRadius <= wave.radius) {
      wave.hit = true;
      p.hp = Math.max(0, p.hp - wave.damage * (1 - Math.min(0.75, p.defense)) * contactFactor);
      p.hurtFlash = 0.3;
      p.immune = 0.65;
    }
  }
  if (run.prison) {
    run.prison.ttl -= dt;
    if (run.prison.ttl <= 0) run.prison = null;
  }
  if (run.shockwaves) run.shockwaves = run.shockwaves.filter(wave => wave.radius <= wave.maxRadius);
  for (const shot of run.projectiles) {
    shot.ttl -= dt;
    // The cast's devices spin in flight; a shot aimed by an enemy keeps its
    // heading, or it would read as tumbling instead of flying at you.
    if (shot.team !== 'enemy' && shot.spin !== false) shot.angle += dt * 12;
    if (shot.vx !== undefined && shot.vy !== undefined) {
      const dx = shot.vx * dt, dy = shot.vy * dt;
      const lengthSquared = dx * dx + dy * dy;
      if (shot.team === 'enemy') {
        // Enemy fire targets the player: swept point-to-circle, so a fast slug
        // cannot tunnel through the body between two frames.
        const t = lengthSquared ? Math.max(0, Math.min(1,
          ((p.x - shot.x) * dx + (p.y - shot.y) * dy) / lengthSquared)) : 0;
        const gap = Math.hypot(p.x - shot.x - dx * t, p.y - shot.y - dy * t);
        if (gap <= p.hitRadius + (shot.radius ?? 0)) {
          if (p.immune <= 0) hurtPlayer(run, null, shot.damage, {
            defenseBonus: def.contactDefenseBonus?.(p) ?? 0, contactFactor,
          });
          run.effects.push({ x: p.x, y: p.y - 34 * WORLD_SCALE, text: '✷', ttl: 0.3, kind: 'shot' });
          shot.ttl = 0;
        }
        shot.x += dx;
        shot.y += dy;
        continue;
      }
      // Swept collision avoids tunneling through an enemy between frames.
      const collisions = run.enemies.filter(enemy => enemy.hp > 0).map(enemy => {
        const t = lengthSquared ? Math.max(0, Math.min(1,
          ((enemy.x - shot.x) * dx + (enemy.y - shot.y) * dy) / lengthSquared)) : 0;
        return { enemy, t, distance: Math.hypot(enemy.x - shot.x - dx * t, enemy.y - shot.y - dy * t) };
      }).filter(collision => collision.distance <= collision.enemy.radius + shot.radius)
        .sort((a, b) => a.t - b.t);
      if (collisions.length) {
        // A wave passes through: every uncrossed body in reach takes it, and the
        // shot keeps its heading until the ficha's own budget runs out.
        if (shot.through) {
          for (const collision of collisions) {
            if (shot.hit.includes(collision.enemy.id)) continue;
            shot.hit.push(collision.enemy.id);
            hit(run, collision.enemy, shot.damage);
            p.characterDef.onProjectileHit?.(run, shot, collision.enemy,
              { hit, distance, nearest, fireRadial });
          }
        } else {
          hit(run, collisions[0].enemy, shot.damage);
          shot.ttl = 0;
        }
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
      // The ficha may reshape its own wave on impact (a voice that widens with
      // every listener); every other shot declares no hook.
      p.characterDef.onProjectileHit?.(run, shot, target,
        { hit, distance, nearest, fireRadial });
      if (shot.attack?.blast) {
        applyConfusion(target, (shot.attack.blast.stacks ?? 1) + (p.rewardBonuses.confusionStacks ?? 0),
          shot.attack.blast.ttl ?? 5.4);
        shroomBlast(run, shot, target);
      }
      // A thrown bottle may carry its own small blast: the ficha says how big
      // and how hard, the engine only applies it once, on impact.
      if (shot.blast) {
        for (const other of run.enemies) {
          if (other.hp <= 0 || other.id === target.id) continue;
          if (distance(other, target) > shot.blast.radius) continue;
          hit(run, other, shot.blast.damage, 'glass');
        }
        run.effects.push({ x: target.x, y: target.y, kind: 'glassBlast', r: shot.blast.radius, ttl: 0.4, duration: 0.4 });
      }
      if (shot.kind === 'brick') {
        const fragments = p.rewardBonuses.brickFragments ?? 0;
        if (fragments > 0) {
          fireRadial(run, target, shot.damage * 0.35, { count: fragments, speed: 260 * WORLD_SCALE, radius: 6 });
          run.effects.push({ x: target.x, y: target.y - target.radius, text: 'FRAGMENTOS', ttl: 0.7, kind: 'shard' });
        }
      }
      const next = nearest(run, shot, shot.hit);
      // A projectile may carry its own bounce budget (the ultimate's bottles);
      // otherwise the device kind owns it, as always.
      const pierce = shot.pierce ?? (shot.kind === 'remote' ? (p.rewardBonuses.bounce ?? 0)
        : shot.kind === 'magic' ? (p.rewardBonuses.waifuPierce ?? 0)
        : shot.kind === 'brick' ? (p.rewardBonuses.brickPierce ?? 0) : 0);
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
    // A line of mini-bosses keeps going: the next one walks in where the last
    // one fell, so the act can restore four bosses in one wave.
    if (enemy.gauntlet !== undefined && run.minibossLine) {
      const next = run.minibossLine.list[enemy.gauntlet + 1];
      if (next) {
        run.minibossLine.index = enemy.gauntlet + 1;
        run.enemies.push(gauntletEnemy(run, enemy.gauntlet + 1, next.kind));
      } else {
        // The last one fell: an untimed wave is allowed to close now.
        run.gauntletCleared = true;
      }
    }
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
  } else if (killed.some(enemy => enemy.boss && enemy.kind === run.act.boss?.kind)) {
    // The world boss closes its world the same way every wave closes: the shop
    // opens so the fight's coins buy something before the next server, and the
    // outcome only appears when there is no world left to continue to.
    run.phase = 'shop';
    run.worldCleared = true;
    awardCoins(run, run.rewardBalance.gold?.survival ?? 20);
    run.enemies = [];
    run.projectiles = [];
    beginRewards(run);
    emit('waveCleared', { run });
  // A wave ends on its clock, except one that declares itself untimed and holds
  // a line of mini-bosses: that one only closes when the last of them falls.
  } else if (run.wave < run.act.boss.wave && waveOver(run)) {
    run.phase = 'shop';
    awardCoins(run, run.rewardBalance.gold?.survival ?? 20);
    run.enemies = [];
    run.projectiles = [];
    beginRewards(run);
    emit('waveCleared', { run });
  }
}
