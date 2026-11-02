import { HEIGHT, WIDTH } from '../constants.mjs';

// A headless player, used by tools/balance.mjs to measure a character without a
// human. It does not know "melee" or "ranged": the game has one attack and a
// distance to land it, so the bot keeps the body at that distance and steps out
// of the way of everything else.
//
// Pure: it reads a run and returns an input vector or an action, exactly what
// the shell would produce from a keyboard.

const LOOKAHEAD = 95;
const WALL_MARGIN = 80;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function directions(count) {
  const list = [];
  for (let index = 0; index < count; index++) {
    const angle = index / count * Math.PI * 2;
    list.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }
  return list;
}
const DIRECTIONS = new Map([[16, directions(16)], [8, directions(8)], [4, directions(4)]]);

// Two ways to hold the controls. `perfect` re-plans every frame and never eats
// a ring on purpose; `average` reacts four times a second, picks from a coarser
// wheel and sometimes misjudges a ring, which is exactly how a person takes
// damage that was avoidable.
export const SKILLS = {
  perfect: { reactionFrames: 1, candidates: 16, ringIgnore: 0, lookahead: LOOKAHEAD },
  average: { reactionFrames: 12, candidates: 8, ringIgnore: 0.35, lookahead: LOOKAHEAD },
};

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// How good it is to stand at (x, y): stay just inside the distance the attack
// lands, away from bodies that are too close, away from the walls, out of rings.
export function scoreSpot(run, x, y, { dodgeRings = true } = {}) {
  const p = run.player;
  const reach = p.attackRange || 1;
  let score = 0;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const gap = Math.hypot(x - enemy.x, y - enemy.y);
    const weight = enemy.boss ? 3 : 1.4;
    if (gap < reach * 0.75) {
      // Inside the body: the worst place to be, and worse with a boss.
      score -= (1 - gap / (reach * 0.75)) * weight;
    } else if (gap <= reach * 1.05) {
      // The pocket: in range for the attack. The far edge is worth more, so a
      // tie never resolves by walking through a body.
      score += 0.2 + 0.6 * Math.min(1, Math.max(0, (gap - reach * 0.75) / (reach * 0.3)));
    } else {
      // Out of range: no damage, so it is only mildly wrong.
      score -= Math.min(2, (gap - reach) / reach) * 0.15;
    }
  }
  if (dodgeRings) {
    for (const wave of run.shockwaves ?? []) {
      const gap = Math.hypot(x - wave.x, y - wave.y);
      if (gap < wave.maxRadius + p.hitRadius) score -= 4;
    }
  }
  if (x < WALL_MARGIN || x > WIDTH - WALL_MARGIN) score -= 1.6;
  if (y < WALL_MARGIN || y > HEIGHT - WALL_MARGIN) score -= 1.6;
  return score;
}

// The best of sixteen headings, plus staying put when it is already good.
export function botInput(run, profile = SKILLS.perfect, random = () => 1) {
  const p = run.player;
  // The bot's own dice: a sloppy hand must not shift the game's spawns, or the
  // two runs stop being the same campaign.
  const dodgeRings = !(profile.ringIgnore > 0 && random() < profile.ringIgnore);
  const options = { dodgeRings };
  const stand = scoreSpot(run, p.x, p.y, options);
  let best = { x: 0, y: 0 };
  let bestScore = stand;
  for (const direction of DIRECTIONS.get(profile.candidates) ?? DIRECTIONS.get(16)) {
    const x = clamp(p.x + direction.x * profile.lookahead, 30, WIDTH - 30);
    const y = clamp(p.y + direction.y * profile.lookahead, 30, HEIGHT - 30);
    const score = scoreSpot(run, x, y, options);
    if (score > bestScore) { bestScore = score; best = direction; }
  }
  return best;
}

// Which specials a bot presses. A menu special is not a combat button, so it is
// never pressed here.
export function botSpecialKeys(run) {
  return run.player.characterDef.specials
    .filter(special => special.key !== 'sell')
    .map(special => special.key);
}

export function shouldUseSpecial(run) {
  const p = run.player;
  let crowd = 0;
  for (const enemy of run.enemies) {
    if (enemy.hp > 0 && distance(enemy, p) < 260) crowd++;
  }
  return crowd >= 3 || run.enemies.some(enemy => enemy.boss && enemy.hp > 0);
}

// --- Shopping -------------------------------------------------------------

// Own upgrades first: every character is supposed to reach a build that breaks
// the run, and that is what their own entries are for. The shared stats carry
// the rest.
export const OWN_PRIORITY = {
  negro: ['otaku-time', 'remote-bounce', 'remote-chain', 'waifu-pierce', 'otaku-pace', 'standing-shield', 'rest-less', 'wider-chair'],
  solago: ['paleta-growth', 'second-bite', 'bite-arc', 'patrona-final', 'wider-patrona', 'patrona-time', 'shorter-smile', 'longer-smile', 'smile-counter', 'bite-push'],
  warrior: ['extra-shroom', 'wider-blast', 'deeper-confusion', 'spore-zone', 'smoke-trail', 'confusion-chain', 'smoked-mushrooms', 'wider-smoke', 'smoke-time'],
  papazito: ['brick-fan', 'brick-shards', 'brick-pierce', 'sena-burst', 'sale-next', 'panic-extend', 'sale-value', 'softer-sale'],
};

export const STAT_PRIORITY = ['stat-life', 'stat-attack', 'stat-defense', 'stat-attackSpeed', 'stat-moveSpeed', 'stat-attackDistance'];
export const ITEM_PRIORITY = ['bleach', 'slipper', 'alcohol', 'magic-mushrooms', 'antidepressants', 'scissors', 'extortion-phone'];

// Two ways to decide, because a balance question has two ends: what the game
// actually hands a player at random, and what a player who knows the run would
// take. Everything else in between is noise.
export const POLICIES = {
  optimal: (run, character) => {
    const offered = run.levelChoices ?? [];
    const priority = [...(OWN_PRIORITY[character] ?? []), ...STAT_PRIORITY];
    return priority.map(id => offered.find(entry => entry.id === id)).find(Boolean) ?? offered[0] ?? null;
  },
  random: run => {
    const offered = run.levelChoices ?? [];
    if (!offered.length) return null;
    return offered[Math.floor(run.random() * offered.length) % offered.length];
  },
};

export const pickLevelReward = (run, character) => POLICIES.optimal(run, character);

// How a player spends. `min` is the survival floor (heals only), `max` takes
// every offer it can pay for, and `adaptive` saves through ordinary waves and
// opens the wallet before a boss.
// Is this offer worth a purchase? A player looks at what it does, not at a
// priority list: a bad item stays on the shelf.
export function offerValue(item) {
  let value = 0;
  for (const modifier of item.modifiers ?? []) {
    const weight = modifier.operation === 'percent' ? modifier.value / 10 : modifier.value / 5;
    value += modifier.value > 0 ? weight : weight * 2;
  }
  for (const effect of item.effects ?? []) value += 0.6;
  return value;
}

// Keeps a purse for heals: buying the shelf empty is how a run dies in the next
// wave with no coins to patch itself.
export const HEAL_RESERVE = 3;

export const SPENDING = {
  min: () => ({ heal: true, items: false }),
  normal: (run, character, { beforeBoss }) => ({ heal: true, items: true, beforeBoss }),
  max: () => ({ heal: true, items: true, every: true }),
  adaptive: (run, character, { beforeBoss }) => ({
    heal: true,
    items: beforeBoss || run.coins > 250,
    beforeBoss,
  }),
};
