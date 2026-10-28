import { validateStatModifiers } from './stat-modifiers.mjs';

export const STAT_LABELS = {
  life: 'Vida', defense: 'Defensa', attack: 'Ataque',
  attackDistance: 'Distancia de ataque', attackSpeed: 'Velocidad de ataque', moveSpeed: 'Velocidad de movimiento',
};
const fail = (id, field, reason) => { throw new Error(`Reward "${id}", ${field}: ${reason}`); };
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;

function freezeData(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freezeData(child, seen);
  return Object.freeze(value);
}

function validateReward(id, reward, effects) {
  if (!reward || typeof reward !== 'object' || Array.isArray(reward)) fail(id, 'reward', 'expected an object');
  const modifiers = validateStatModifiers(id, reward.modifiers ?? []);
  const special = reward.effects ?? [];
  if (!Array.isArray(special)) fail(id, 'effects', 'expected an array');
  for (const [index, effect] of special.entries()) {
    const definition = effect && Object.hasOwn(effects, effect.type) ? effects[effect.type] : null;
    if (typeof definition?.validate !== 'function' || typeof definition?.describe !== 'function') {
      fail(id, `effects[${index}]`, 'unknown effect type');
    }
    if (definition.validate(effect.value) !== true) fail(id, `effects[${index}].value`, 'invalid effect parameter');
  }
  if (!modifiers.length && !special.length) fail(id, 'reward', 'at least one modifier or effect is required');
}

// Catalog entries are data, while effect implementations belong to a separate
// trusted registry. Adding a supported entry never adds executable callbacks.
export function createCatalog(input, { characters = [], effects = {} } = {}) {
  const data = structuredClone(input);
  if (!Array.isArray(data?.items) || !Array.isArray(data?.upgrades)) fail('catalog', 'entries', 'expected items and upgrades arrays');
  const identifiers = new Set();
  for (const entry of [...data.items, ...data.upgrades]) {
    if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) fail('catalog', 'id', 'expected a nonempty string');
    if (identifiers.has(entry.id)) fail(entry.id, 'id', 'duplicate identifier');
    identifiers.add(entry.id);
    if (typeof entry.name !== 'string' || !entry.name.trim()) fail(entry.id, 'name', 'expected a nonempty string');
  }
  for (const item of data.items) {
    if (!Number.isFinite(item.price) || item.price < 0) fail(item.id, 'price', 'expected a finite nonnegative price');
    if (!positiveInteger(item.maxCopies)) fail(item.id, 'maxCopies', 'expected a positive integer');
    if (typeof item.lore !== 'string') fail(item.id, 'lore', 'expected text');
    validateReward(item.id, item, effects);
  }
  const upgrades = new Map(data.upgrades.map(entry => [entry.id, entry]));
  for (const upgrade of data.upgrades) {
    if (upgrade.characters !== 'all' && !characters.includes(upgrade.characters)) fail(upgrade.id, 'characters', 'unknown character');
    if (!positiveInteger(upgrade.minLevel)) fail(upgrade.id, 'minLevel', 'expected a positive integer');
    if (!Array.isArray(upgrade.ranks) || !upgrade.ranks.length) fail(upgrade.id, 'ranks', 'expected at least one rank');
    for (const rank of upgrade.ranks) validateReward(upgrade.id, rank, effects);
    upgrade.requires ??= [];
    if (!Array.isArray(upgrade.requires)) fail(upgrade.id, 'requires', 'expected an array');
    for (const requirement of upgrade.requires) {
      const parent = requirement && upgrades.get(requirement.id);
      if (!parent || !positiveInteger(requirement.rank) || requirement.rank > parent.ranks?.length) {
        fail(upgrade.id, 'requires', 'unknown upgrade or invalid prerequisite rank');
      }
    }
  }
  const visited = new Set(), visiting = new Set();
  function visit(upgrade) {
    if (visiting.has(upgrade.id)) fail(upgrade.id, 'requires', 'prerequisite cycle');
    if (visited.has(upgrade.id)) return;
    visiting.add(upgrade.id);
    for (const requirement of upgrade.requires) visit(upgrades.get(requirement.id));
    visiting.delete(upgrade.id);
    visited.add(upgrade.id);
  }
  for (const upgrade of data.upgrades) visit(upgrade);
  return freezeData(data);
}

export function sampleEntries(entries, count, random) {
  const remaining = [...entries], result = [];
  while (result.length < count && remaining.length) {
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new Error('Random generator must return a value in [0, 1)');
    result.push(remaining.splice(Math.floor(roll * remaining.length), 1)[0]);
  }
  return result;
}

// The caller stores these choices. Rendering must never call this generator.
export function selectLevelOptions(catalog, { character, level, ranks }, random) {
  const rankOf = id => Object.hasOwn(ranks, id) ? ranks[id] : 0;
  const eligible = catalog.upgrades.filter(entry =>
    (entry.characters === 'all' || entry.characters === character)
    && level >= entry.minLevel && rankOf(entry.id) < entry.ranks.length
    && entry.requires.every(requirement => rankOf(requirement.id) >= requirement.rank));
  const own = eligible.filter(entry => entry.characters === character);
  const common = eligible.filter(entry => entry.characters === 'all');
  return [...sampleEntries(own, 1, random), ...sampleEntries(common, own.length ? 2 : 3, random)];
}

export function describeReward(reward, effects = {}) {
  const descriptions = (reward.modifiers ?? []).map(modifier =>
    `${STAT_LABELS[modifier.stat]} ${modifier.value >= 0 ? '+' : ''}${modifier.value}${modifier.operation === 'percent' ? '%' : ''}`);
  for (const effect of reward.effects ?? []) descriptions.push(effects[effect.type].describe(effect.value));
  return descriptions;
}
