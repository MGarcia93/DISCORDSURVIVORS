// Core combat stats: the structural contract shared by every entity
// (characters, enemies and bosses). This module owns the conversion between
// the percentage sheets each entity authors and the absolute values the
// engine consumes. Spec: context/discord_survivors_estadisticas_base.md.
//
// Entities never author absolute stats: they express each of the six stats as
// a percentage of BASE_STATS (100% = the neutral reference entity), and the
// resolvers below produce the absolute values. All balance tuning lives in
// the percentage sheets; all unit conversion lives here.

import { WORLD_SCALE } from './constants.mjs';

// Neutral reference entity. 100% of any stat equals these values.
export const BASE_STATS = {
  life: 100,          // points of damage the entity can absorb
  defense: 10,        // mitigation points: each point blocks 5% of incoming damage
  attack: 10,         // damage points of a reference attack
  attackSpeed: 1,     // attacks per second before modifiers
  attackDistance: 100,// reach in world units, measured from the collision edge
  moveSpeed: 5,       // world units per second
};

// Combat formula constants.
export const DEFENSE_MITIGATION_PER_POINT = 0.05; // fraction of damage blocked per defense point
export const DEFENSE_MITIGATION_CAP = 0.75;       // hard cap on the mitigation fraction
// 1 world unit of the stat table resolves to WORLD_SCALE engine pixels, so the
// calibrated pixel values already used by the game map cleanly onto percentages.
export const UNIT_PX = WORLD_SCALE;

// Resolves wave-dependent stat sheets: a stat may be authored as a plain
// percentage or as a function of the wave number returning a percentage.
export function statAt(sheet, key, wave) {
  const value = sheet[key];
  return typeof value === 'function' ? value(wave) : value;
}

// Float-exactness note: every resolver multiplies integers first and divides
// by 100 last, so authored percentages reproduce previously calibrated values
// without float drift.
function percentOf(percent, base) {
  return percent * base / 100;
}

// Defense percentage -> mitigation fraction the engine compares defensively.
// defense points = defense% x 10; each point blocks 5% of damage, capped.
export function resolveDefensePercent(percent) {
  const points = percentOf(percent, BASE_STATS.defense);
  // points * 5 / 100 (not points * 0.05) keeps binary-exact results.
  return Math.min(DEFENSE_MITIGATION_CAP, points * 5 / 100);
}

// Attack-distance percentage -> absolute reach, in scaled engine pixels.
// attackDistance: Infinity (or null) means unlimited reach (auto-aim ranged).
export function resolveAttackDistancePercent(percent) {
  if (percent === Infinity || percent === null) return Infinity;
  return percent * BASE_STATS.attackDistance / 100 * UNIT_PX;
}

// Move-speed percentage -> absolute speed in scaled engine px/s.
export function resolveMoveSpeedPercent(percent) {
  return percent * BASE_STATS.moveSpeed / 100 * UNIT_PX;
}

// Life percentage -> absolute hit points (attack% percentage of the base points).
export function resolveLifePercent(percent) {
  return percentOf(percent, BASE_STATS.life);
}

// Attack percentage -> absolute damage points of one hit of the reference weapon.
export function resolveDamagePercent(percent) {
  return percentOf(percent, BASE_STATS.attack);
}

// Resolves a full percentage sheet into the engine stat shape
// ({ hp, maxHp, defense, damage, attackRange, shotInterval, speed }).
export function resolveEntityStats(percents) {
  const hp = percentOf(percents.life, BASE_STATS.life);
  return {
    hp, maxHp: hp,
    defense: resolveDefensePercent(percents.defense),
    damage: percentOf(percents.attack, BASE_STATS.attack),
    attackRange: resolveAttackDistancePercent(percents.attackDistance),
    shotInterval: 100 / percents.attackSpeed,
    speed: resolveMoveSpeedPercent(percents.moveSpeed),
  };
}
