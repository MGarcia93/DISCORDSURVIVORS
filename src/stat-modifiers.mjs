import {
  BASE_STATS, UNIT_PX, DEFENSE_MITIGATION_PER_POINT, resolveEntityStats,
} from './stats.mjs';

const STAT_KEYS = Object.keys(BASE_STATS);
const PLAYER_KEYS = ['maxHp', 'defense', 'damage', 'shotInterval', 'attackRange', 'speed'];

function invalid(source, field, message) {
  throw new Error(`Stat source "${source}", ${field}: ${message}`);
}

// Capture stat points once, before adding permanent item or level sources.
// Never use resolved mitigation, pixels or firing intervals as authored points.
export function createStatState(player) {
  const base = {
    life: player.maxHp,
    defense: player.defense / DEFENSE_MITIGATION_PER_POINT,
    attack: player.damage,
    attackSpeed: 1 / player.shotInterval,
    attackDistance: player.attackRange / UNIT_PX,
    moveSpeed: player.speed / UNIT_PX,
  };
  const state = Object.freeze({ base: Object.freeze(base), sources: Object.freeze({}) });
  resolveStatState(state);
  return state;
}

function copyModifiers(source, modifiers) {
  if (!Array.isArray(modifiers)) invalid(source, 'modifiers', 'expected an array');
  return Object.freeze(modifiers.map((modifier, index) => {
    const field = `modifiers[${index}]`;
    if (!modifier || !STAT_KEYS.includes(modifier.stat)) invalid(source, `${field}.stat`, 'unknown statistic');
    if (!['flat', 'percent'].includes(modifier.operation)) invalid(source, `${field}.operation`, 'unknown operation');
    if (!Number.isFinite(modifier.value)) invalid(source, `${field}.value`, 'expected a finite number');
    return Object.freeze({ stat: modifier.stat, operation: modifier.operation, value: modifier.value });
  }));
}

export { copyModifiers as validateStatModifiers };

// Replacing a source replaces its contribution, rather than stacking it again.
// null removes a source. Validation happens before returning a new snapshot.
export function withStatSource(state, source, modifiers) {
  if (typeof source !== 'string' || !source.trim()) invalid(String(source), 'id', 'expected a nonempty string');
  let sources = { ...state.sources };
  if (modifiers === null) delete sources[source];
  else sources = { ...sources, [source]: copyModifiers(source, modifiers) };
  const next = Object.freeze({ base: state.base, sources: Object.freeze(sources) });
  resolveStatState(next, source);
  return next;
}

export function resolveStatState(state, changedSource = 'base') {
  const flat = Object.fromEntries(STAT_KEYS.map(stat => [stat, 0]));
  const percent = { ...flat };
  for (const [source, modifiers] of Object.entries(state.sources)) {
    for (const modifier of modifiers) {
      if (!Number.isFinite(state.base[modifier.stat])) {
        invalid(source, modifier.stat, 'modifying unlimited reach requires an explicit rule');
      }
      (modifier.operation === 'flat' ? flat : percent)[modifier.stat] += modifier.value;
    }
  }
  const percentages = {};
  for (const stat of STAT_KEYS) {
    const base = state.base[stat];
    // Preserve existing unlimited reach only when it has no modifiers.
    if (stat === 'attackDistance' && base === Infinity) {
      percentages[stat] = Infinity;
      continue;
    }
    const value = (base + flat[stat]) * (100 + percent[stat]) / 100;
    const positive = stat === 'life' || stat === 'attackSpeed';
    if (!Number.isFinite(value) || value < 0 || (positive && value === 0)) {
      invalid(changedSource, stat, `result must be ${positive ? 'positive' : 'nonnegative'} and finite`);
    }
    percentages[stat] = value * 100 / BASE_STATS[stat];
  }
  // Keep the project's existing unit conversion and defense cap authoritative.
  return resolveEntityStats(percentages);
}

export function previewStatSource(state, source, modifiers) {
  return {
    before: resolveStatState(state),
    after: resolveStatState(withStatSource(state, source, modifiers)),
  };
}

// Permanent acquisitions only: temporary HP effects need their own lifecycle.
// Applying the same snapshot again never grants the maximum-life delta twice.
export function applyStatState(player, state) {
  const resolved = resolveStatState(state);
  const increase = Math.max(0, resolved.maxHp - player.maxHp);
  const hp = Math.max(0, Math.min(resolved.maxHp, player.hp + increase));
  for (const key of PLAYER_KEYS) player[key] = resolved[key];
  player.hp = hp;
  return player;
}
