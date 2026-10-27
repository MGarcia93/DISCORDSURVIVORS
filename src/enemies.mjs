import { WORLD_SCALE } from './constants.mjs';

// Balance values used by tests and spawn logic. hp/speed are per-wave curves,
// radius is in unscaled world pixels (multiplied by WORLD_SCALE when spawned).
export const ENEMY_KINDS = {
  zombie: {
    hp: wave => 40 + wave * 6,
    radius: 17,
    speed: wave => 40 + wave * 4,
    contactDamage: 12,
    bounty: 2,
  },
  runner: {
    hp: wave => 28 + wave * 5,
    radius: 13,
    speed: wave => 88 + wave * 4,
    contactDamage: 12,
    bounty: 2,
  },
  boss: {
    hp: () => 2200,
    radius: 38,
    speed: wave => 52,
    contactDamage: 30,
    bounty: 30,
  },
};

export function getEnemyKind(id) {
  return ENEMY_KINDS[id] ?? ENEMY_KINDS.zombie;
}
