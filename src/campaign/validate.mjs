import { worldIds } from '../backgrounds/index.mjs';
import { ENEMY_KINDS } from '../enemies/index.mjs';

// The campaign contract. A world is authoring data, so the only thing that can
// go wrong is an incomplete descriptor; this module is the one place that knows
// what "complete" means and says exactly which field is missing.
const STATUSES = new Set(['playable', 'planned']);
const own = (object, key) => Object.hasOwn(object ?? {}, key);
const text = value => typeof value === 'string' && value.trim().length > 0;

function validateWaves(act) {
  const { id, waves } = act;
  if (!Array.isArray(waves) || waves.length === 0) throw Error(`${id}: waves are required`);
  waves.forEach((config, index) => {
    const wave = index + 1;
    if (!config || typeof config !== 'object') throw Error(`${id}: wave ${wave} must be an object`);
    if (config.wave !== wave) throw Error(`${id}: wave ${wave} must declare wave ${wave}`);
    if (!Number.isInteger(config.perMinute) || config.perMinute < 0) throw Error(`${id}: wave ${wave} invalid perMinute`);
    if (!config.mix || typeof config.mix !== 'object' || Array.isArray(config.mix)) throw Error(`${id}: wave ${wave} needs a mix`);
    const kinds = Object.keys(config.mix);
    if (config.perMinute > 0) {
      if (kinds.length === 0) throw Error(`${id}: wave ${wave} needs at least one enemy`);
      const share = kinds.reduce((sum, kind) => sum + config.mix[kind], 0);
      if (Math.abs(share - 1) > 1e-9) throw Error(`${id}: wave ${wave} mix must share one roll`);
    }
    for (const kind of kinds) {
      if (!own(ENEMY_KINDS, kind)) throw Error(`${id}: wave ${wave} unknown enemy: ${kind}`);
      if (typeof config.life?.[kind] !== 'number' || !Number.isFinite(config.life[kind])) {
        throw Error(`${id}: wave ${wave} must declare ${kind} life`);
      }
    }
  });
}

// An act may carry one mini-boss on an earlier wave. It is optional, it never
// closes the run, and it must sit before the boss.
function validateMiniboss(act) {
  const { id, miniboss, boss } = act;
  if (miniboss === undefined) return;
  if (!miniboss || typeof miniboss !== 'object' || Array.isArray(miniboss)) {
    throw Error(`${id}: miniboss must be an object`);
  }
  if (!Number.isInteger(miniboss.wave) || miniboss.wave < 1) throw Error(`${id}: invalid miniboss wave`);
  if (miniboss.wave >= boss.wave) throw Error(`${id}: miniboss must be before the boss wave`);
  if (!own(ENEMY_KINDS, miniboss.kind)) throw Error(`${id}: unknown miniboss kind: ${miniboss.kind}`);
  if (!text(miniboss.name)) throw Error(`${id}: miniboss name is required`);
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
