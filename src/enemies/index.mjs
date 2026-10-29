import {
  resolveAttackDistancePercent, resolveDamagePercent, resolveDefensePercent,
  resolveLifePercent, resolveMoveSpeedPercent, statAt,
} from '../stats.mjs';
import zombie from './zombie.mjs';
import runner from './runner.mjs';
import brute from './brute.mjs';
import alarmZombie from './alarm-zombie.mjs';
import meleeMinion from './melee-minion.mjs';
import mageMinion from './mage-minion.mjs';
import siegeMinion from './siege-minion.mjs';
import turret from './turret.mjs';

// Enemy registry, built from one module per kind exactly like src/characters/.
// Each ficha owns its sheet and its drawing; this file only resolves percentages
// into the absolute values the engine consumes. Contract:
// context/discord_survivors_enemigos.md.
//
// Every kind authors the same six combat stats (life, defense, attack,
// attackSpeed, attackDistance, moveSpeed). `radius` and `bounty` are body and
// economy, so they stay as raw fields outside the sheet.
export const ENEMY_KINDS = { zombie, runner, brute, alarmZombie, meleeMinion, mageMinion, siegeMinion, turret };

// Spawn and select order. Kept explicit so a new module is added once, here.
export const ENEMY_IDS = [zombie.id, runner.id, brute.id, alarmZombie.id,
  meleeMinion.id, mageMinion.id, siegeMinion.id, turret.id];

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

// Reach in scaled pixels, measured from the collision edge. 0 means the enemy
// has to touch: the engine adds both collision radii when it decides whether it
// is close enough to stop and swing.
export function enemyAttackRange(kind, wave = 1) {
  return resolveAttackDistancePercent(statAt(getEnemyKind(kind).stats, 'attackDistance', wave));
}

// Seconds between two swings of this kind. The sheet names attacks per second
// as a percentage, so the interval is the same 100 / P the core uses.
export function enemyAttackInterval(kind, wave = 1) {
  return 100 / statAt(getEnemyKind(kind).stats, 'attackSpeed', wave);
}

export function enemyBounty(kind) {
  return getEnemyKind(kind).bounty;
}
