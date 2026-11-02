import { worldIds } from '../backgrounds/index.mjs';
import { ENEMY_KINDS } from '../enemies/index.mjs';
import { BASE_STATS } from '../stats.mjs';

// The campaign contract. A world is authoring data, so the only thing that can
// go wrong is an incomplete descriptor; this module is the one place that knows
// what "complete" means and says exactly which field is missing.
const STATUSES = new Set(['playable', 'planned']);
const STAT_KEYS = Object.keys(BASE_STATS);
const own = (object, key) => Object.hasOwn(object ?? {}, key);
const text = value => typeof value === 'string' && value.trim().length > 0;

function validateWaves(act) {
  const { id, waves } = act;
  if (!Array.isArray(waves) || waves.length === 0) throw Error(`${id}: waves are required`);
  waves.forEach((config, index) => {
    const wave = index + 1;
    if (!config || typeof config !== 'object') throw Error(`${id}: wave ${wave} must be an object`);
    if (config.wave !== wave) throw Error(`${id}: wave ${wave} must declare wave ${wave}`);
    if (config.world !== undefined && !worldIds.includes(config.world)) {
      throw Error(`${id}: wave ${wave} unknown world: ${config.world}`);
    }
    if (!Number.isInteger(config.perMinute) || config.perMinute < 0) throw Error(`${id}: wave ${wave} invalid perMinute`);
    if (!config.mix || typeof config.mix !== 'object' || Array.isArray(config.mix)) throw Error(`${id}: wave ${wave} needs a mix`);
    const kinds = Object.keys(config.mix);
    if (config.perMinute > 0) {
      if (kinds.length === 0) throw Error(`${id}: wave ${wave} needs at least one enemy`);
      const share = kinds.reduce((sum, kind) => sum + config.mix[kind], 0);
      // A ramp distributes the wave's own mix over time: the stages, weighted by
      // how long each lasts, must average exactly the declared percentages. The
      // wave keeps saying what the wave spawns; the ramp only decides when.
      if (config.ramp !== undefined) {
        if (!Array.isArray(config.ramp) || !config.ramp.length) throw Error(`${id}: wave ${wave} ramp must be a nonempty array`);
        let previous = 0;
        const average = {};
        for (const stage of config.ramp) {
          if (!(stage.until > previous && stage.until <= 1)) throw Error(`${id}: wave ${wave} ramp stages must close in order`);
          const length = stage.until - previous;
          previous = stage.until;
          const total = Object.values(stage.mix ?? {}).reduce((sum, weight) => sum + weight, 0);
          if (Math.abs(total - 1) > 1e-9) throw Error(`${id}: wave ${wave} ramp stage must share one roll`);
          for (const [kind, weight] of Object.entries(stage.mix ?? {})) {
            if (!(kind in config.mix)) throw Error(`${id}: wave ${wave} ramp stage names ${kind}, not in the wave mix`);
            average[kind] = (average[kind] ?? 0) + weight * length;
          }
        }
        for (const kind of kinds) {
          if (Math.abs((average[kind] ?? 0) - config.mix[kind]) > 1e-6) {
            throw Error(`${id}: wave ${wave} ramp must average the declared ${kind} share`);
          }
        }
      }
      if (Math.abs(share - 1) > 1e-9) throw Error(`${id}: wave ${wave} mix must share one roll`);
    }
    for (const kind of kinds) {
      if (!own(ENEMY_KINDS, kind)) throw Error(`${id}: wave ${wave} unknown enemy: ${kind}`);
      // A wave never re-authors a statistic: the sheet owns all six and the act
      // owns its tier. A leftover table here is the duplication that was removed,
      // so it fails loudly instead of quietly winning over the sheet.
      for (const field of ['life', 'damage']) {
        if (own(config, field)) {
          throw Error(`${id}: wave ${wave} must not declare ${field}: the enemy sheet owns every statistic`);
        }
      }
    }
    // An untimed wave waits for something that is not the clock: only a wave
    // that holds a line of mini-bosses can close when that line is cleared.
    if (config.untimed === true) {
      const declared = Array.isArray(act.miniboss) ? act.miniboss : act.miniboss ? [act.miniboss] : [];
      if (!declared.some(entry => entry?.wave === wave)) {
        throw Error(`${id}: wave ${wave} is untimed but holds no mini-boss`);
      }
    }
  });
}

// An act may field a kind at its own tier: `statMultipliers[kind][stat]` is the
// multiplier for that one statistic of that one body. It lands on the authored
// percentage, never on an already resolved value, so 1 and a missing entry mean
// the same thing: the sheet speaks untouched.
function validateStatMultipliers(act) {
  const { id, statMultipliers } = act;
  if (statMultipliers === undefined) return;
  if (!statMultipliers || typeof statMultipliers !== 'object' || Array.isArray(statMultipliers)) {
    throw Error(`${id}: statMultipliers must be an object keyed by enemy kind`);
  }
  for (const [kind, tier] of Object.entries(statMultipliers)) {
    if (!own(ENEMY_KINDS, kind)) throw Error(`${id}: statMultipliers names an unknown enemy: ${kind}`);
    if (!tier || typeof tier !== 'object' || Array.isArray(tier)) {
      throw Error(`${id}: statMultipliers.${kind} must be an object keyed by statistic`);
    }
    for (const [stat, value] of Object.entries(tier)) {
      if (!STAT_KEYS.includes(stat)) throw Error(`${id}: statMultipliers.${kind}: unknown statistic: ${stat}`);
      if (!Number.isFinite(value) || value <= 0) {
        throw Error(`${id}: statMultipliers.${kind}.${stat} must be a positive number`);
      }
    }
  }
}

// An act may carry one mini-boss, or a line of them, on an earlier wave. They
// are optional, they never close the run, and they must sit before the boss.
function validateMiniboss(act) {
  const { id, miniboss, boss } = act;
  if (miniboss === undefined) return;
  const line = Array.isArray(miniboss) ? miniboss : [miniboss];
  if (line.length === 0) throw Error(`${id}: miniboss line is empty`);
  for (const entry of line) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw Error(`${id}: miniboss must be an object`);
    }
    if (!Number.isInteger(entry.wave) || entry.wave < 1) throw Error(`${id}: invalid miniboss wave`);
    if (entry.wave >= boss.wave) throw Error(`${id}: miniboss must be before the boss wave`);
    if (!own(ENEMY_KINDS, entry.kind)) throw Error(`${id}: unknown miniboss kind: ${entry.kind}`);
    if (!text(entry.name)) throw Error(`${id}: miniboss name is required`);
    // A mini-boss owns its wave: if the clock could end it, a slow fight would
    // close the wave with the boss still standing.
    if (act.waves?.[entry.wave - 1]?.untimed !== true) {
      throw Error(`${id}: wave ${entry.wave} holds a mini-boss and must be untimed`);
    }
  }
}

function validateBoss(act) {
  const { id, boss, waves } = act;
  if (!boss || typeof boss !== 'object') throw Error(`${id}: boss is required`);
  if (!Number.isInteger(boss.wave) || boss.wave !== waves.length) throw Error(`${id}: boss must be on the last wave`);
  if (!own(ENEMY_KINDS, boss.kind)) throw Error(`${id}: unknown boss kind: ${boss.kind}`);
  if (!text(boss.name)) throw Error(`${id}: boss name is required`);
}

export function validateAct(act, { expectedOrder } = {}) {
  if (!act || typeof act !== 'object' || Array.isArray(act)) throw Error('Act must be an object');
  if (!text(act.id)) throw Error('Act id is required');
  if (!Number.isInteger(act.order) || act.order < 1) throw Error(`${act.id}: invalid order`);
  if (expectedOrder !== undefined && act.order !== expectedOrder) throw Error(`${act.id}: order must be ${expectedOrder}`);
  if (!text(act.title)) throw Error(`${act.id}: title is required`);
  if (!STATUSES.has(act.status)) throw Error(`${act.id}: invalid status`);
  if (!worldIds.includes(act.world)) throw Error(`${act.id}: unknown world: ${act.world}`);
  // A planned world is a slot in the campaign map, not a descriptor: it has no
  // waves or boss yet, and must not claim any.
  if (act.status === 'planned') return act;
  if (!Number.isFinite(act.duration) || act.duration <= 0) throw Error(`${act.id}: invalid duration`);
  validateWaves(act);
  validateBoss(act);
  validateMiniboss(act);
  validateStatMultipliers(act);
  return act;
}

export function validateCampaign(acts) {
  if (!Array.isArray(acts) || acts.length === 0) throw Error('Campaign needs at least one act');
  const ids = new Set();
  for (const [index, act] of acts.entries()) {
    validateAct(act, { expectedOrder: index + 1 });
    if (ids.has(act.id)) throw Error(`Duplicate act id: ${act.id}`);
    ids.add(act.id);
  }
  if (!acts.some(act => act.status === 'playable')) throw Error('Campaign needs one playable act');
  return acts;
}
