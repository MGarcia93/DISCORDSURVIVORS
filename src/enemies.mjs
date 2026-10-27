import { resolveDamagePercent, resolveDefensePercent, resolveLifePercent, resolveMoveSpeedPercent, statAt } from './stats.mjs';

// Enemy stat sheets, as percentages over BASE_STATS (src/stats.mjs).
// Wave-dependent stats are per-wave functions returning the percentage for
// that wave. `radius` is collision size in unscaled world pixels (not one of
// the six combat stats, scaled at spawn) and `bounty` is economy, so both
// stay as raw fields.
export const ENEMY_KINDS = {
  zombie: {
    stats: {
      life: wave => 40 + 6 * wave,        // 40% + 6 pp per wave
      defense: 0,
      attack: 120,                        // 120% -> 12 contact damage
      moveSpeed: wave => 800 + 80 * wave, // 800% + 80 pp per wave
    },
    radius: 17,
    bounty: 2,
  },
  runner: {
    stats: {
      life: wave => 28 + 5 * wave,          // 28% + 5 pp per wave
      defense: 0,
      attack: 120,                          // 120% -> 12 contact damage
      moveSpeed: wave => 1760 + 80 * wave,  // 1760% + 80 pp per wave
    },
    radius: 13,
    bounty: 2,
  },
  boss: {
    stats: {
      life: 2200,       // 2200 points of damage
      defense: 0,
      attack: 300,      // 300% -> 30 contact damage
      moveSpeed: 1040,  // 52 scaled px/s
    },
    radius: 38,
    bounty: 30,
  },
};

export function getEnemyKind(id) {
  return ENEMY_KINDS[id] ?? ENEMY_KINDS.zombie;
}

export function enemyHp(kind, wave = 1) {
  return resolveLifePercent(statAt(getEnemyKind(kind).stats, 'life', wave));
}

export function enemySpeed(kind, wave = 1) {
  return resolveMoveSpeedPercent(statAt(getEnemyKind(kind).stats, 'moveSpeed', wave));
}

export function enemyContactDamage(kind, wave = 1) {
  return resolveDamagePercent(statAt(getEnemyKind(kind).stats, 'attack', wave));
}

export function enemyDefense(kind, wave = 1) {
  return resolveDefensePercent(statAt(getEnemyKind(kind).stats, 'defense', wave));
}

export function enemyBounty(kind) {
  return getEnemyKind(kind).bounty;
}
