import { BALANCE, DEFAULT_CATALOG, EFFECTS } from './reward-data.mjs';
import { selectLevelOptions, sampleEntries } from './reward-catalog.mjs';
import { createStatState, withStatSource, applyStatState } from './stat-modifiers.mjs';

// Catalog IDs are author data: "constructor" or "toString" must not resolve to
// inherited object properties when counting owned copies or ranks.
export const countOf = (entries, id) => Object.hasOwn(entries, id) ? entries[id] : 0;

export function initializeRewards(run, { catalog = DEFAULT_CATALOG, balance = BALANCE } = {}) {
  const config = structuredClone(balance);
  if (!Number.isFinite(config.xp?.factor) || config.xp.factor <= 0
    || !Number.isFinite(config.xp?.exponent) || config.xp.exponent <= 0
    || !Number.isSafeInteger(config.shopSize) || config.shopSize < 0) {
    throw new Error('Invalid reward balance: positive XP curve and nonnegative integer shopSize required');
  }
  const state = createStatState(run.player);
  Object.assign(run, {
    rewardCatalog: catalog, rewardBalance: config, statState: state, effectSources: {},
    level: 1, xp: 0, pendingLevels: [], levelRanks: {}, items: {},
    levelChoices: null, shopOffers: null,
  });
  run.player.rewardBonuses = {};
}

export function nextLevelXP(run, level = run.level) {
  return nextLevelXPFor(run.rewardBalance, level);
}

// The curve alone, so tools (the balance lab's per-wave budget) can project how
// many levels a pile of XP buys without building a run first.
export function nextLevelXPFor(balance, level) {
  return Math.ceil(balance.xp.factor * level ** balance.xp.exponent);
}

export function awardXP(run, amount) {
  const scaled = amount * (run.rewardBalance.xp.multiplier ?? 1);
  if (run.phase !== 'playing' || !Number.isSafeInteger(scaled) || scaled < 0) return false;
  let xp = run.xp + scaled, level = run.level;
  if (!Number.isSafeInteger(xp)) return false;
  const pending = [];
  while (xp >= nextLevelXP(run, level)) {
    xp -= nextLevelXP(run, level);
    pending.push(++level);
  }
  run.xp = xp;
  run.level = level;
  run.pendingLevels.push(...pending);
  return true;
}

function canApply(run, source, reward) {
  try {
    withStatSource(run.statState, source, reward.modifiers ?? []);
    return true;
  } catch {
    return false;
  }
}

export function previewReward(run, source, reward) {
  if (!canApply(run, source, reward)) return null;
  const state = withStatSource(run.statState, source, reward.modifiers ?? []);
  const sources = { ...run.effectSources, [source]: reward.effects ?? [] };
  const bonuses = {};
  for (const effects of Object.values(sources)) {
    for (const effect of effects) {
      const definition = EFFECTS[effect.type];
      if (!definition) return null;
      bonuses[effect.type] = Math.min(definition.max, (bonuses[effect.type] ?? 0) + effect.value);
    }
  }
  return { statState: state, effectSources: sources, bonuses };
}

function applyReward(run, source, reward) {
  const preview = previewReward(run, source, reward);
  if (!preview) return false;
  applyStatState(run.player, preview.statState);
  run.statState = preview.statState;
  run.effectSources = preview.effectSources;
  run.player.rewardBonuses = preview.bonuses;
  return true;
}

function makeShopOffers(run) {
  const remaining = run.rewardCatalog.items.filter(item => item.enabled !== false
    && countOf(run.items, item.id) < item.maxCopies && canApply(run, `preview:${item.id}`, item));
  return sampleEntries(remaining, run.rewardBalance.shopSize, run.random)
    .map(item => ({ id: item.id, bought: false }));
}

// Retain the existing shop phase for narrative boundary compatibility.
// Level choices are an internal substate that must finish before shopping.
export function beginRewards(run) {
  if (run.phase !== 'shop') return false;
  if (run.pendingLevels.length) {
    if (run.levelChoices === null) {
      const upgrades = run.rewardCatalog.upgrades.filter(entry => {
        const rank = countOf(run.levelRanks, entry.id);
        return rank < entry.ranks.length && canApply(run, `preview:${entry.id}`, entry.ranks[rank]);
      });
      run.levelChoices = selectLevelOptions({ upgrades }, {
        character: run.character, level: run.pendingLevels[0], ranks: run.levelRanks,
      }, run.random);
    }
  } else {
    run.levelChoices = null;
    run.shopOffers ??= makeShopOffers(run);
  }
  return true;
}

export function chooseLevelReward(run, id) {
  if (run.phase !== 'shop' || !run.pendingLevels.length || !run.levelChoices?.some(entry => entry.id === id)) return false;
  const entry = run.levelChoices.find(choice => choice.id === id);
  if (!applyUpgradeRank(run, entry)) return false;
  run.pendingLevels.shift();
  run.levelChoices = null;
  beginRewards(run);
  return true;
}

// Applies the next rank of one catalog entry, validated against its cap.
export function applyUpgradeRank(run, entry) {
  if (!entry) return false;
  const rank = countOf(run.levelRanks, entry.id);
  if (!entry.ranks[rank] || !applyReward(run, `level:${entry.id}:${rank}`, entry.ranks[rank])) return false;
  run.levelRanks = { ...run.levelRanks, [entry.id]: rank + 1 };
  return true;
}

export function skipEmptyChoice(run) {
  if (run.phase !== 'shop' || !run.pendingLevels.length || run.levelChoices?.length !== 0) return false;
  run.pendingLevels.shift();
  run.levelChoices = null;
  beginRewards(run);
  return true;
}

// Every copy of an item costs more than the one before it: the shop stays a
// decision instead of a shopping spree once a boss pays. The base price is the
// first copy; each owned copy adds half of it again.
export function itemPrice(item, owned = 0) {
  return Math.round(item.price * (1 + 0.5 * Math.max(0, owned)));
}

// One item copy, with no shop around it: the balance lab grants the items a
// player would already own, and a purchase is the same grant plus its price.
export function grantItem(run, id) {
  const item = run.rewardCatalog.items.find(entry => entry.id === id);
  const count = countOf(run.items, id);
  if (!item || item.enabled === false || count >= item.maxCopies) return false;
  if (!applyReward(run, `item:${id}:${count}`, item)) return false;
  run.items = { ...run.items, [id]: count + 1 };
  return true;
}

export function buyItem(run, id) {
  if (run.phase !== 'shop' || run.pendingLevels.length) return false;
  const offer = run.shopOffers?.find(entry => entry.id === id && !entry.bought);
  const item = run.rewardCatalog.items.find(entry => entry.id === id);
  const count = countOf(run.items, id);
  if (!offer || !item || count >= item.maxCopies || run.coins < itemPrice(item, count)) return false;
  if (!grantItem(run, id)) return false;
  run.coins -= itemPrice(item, count);
  offer.bought = true;
  return true;
}

export function finishRewards(run) {
  if (run.phase !== 'shop' || run.pendingLevels.length) return false;
  run.levelChoices = null;
  run.shopOffers = null;
  return true;
}

// Keep the old exported purchase API composable during migration. Normalize
// its actual stat delta into points before existing percentage modifiers;
// do not reapply its callback or overwrite the captured character base.
export function recordLegacyUpgrade(run, before, source) {
  const after = createStatState(run.player).base;
  const modifiers = [];
  for (const stat of Object.keys(before)) {
    const delta = after[stat] - before[stat];
    if (!delta) continue;
    const existing = Object.values(run.statState.sources).flat();
    const percent = existing
      .filter(modifier => modifier.stat === stat && modifier.operation === 'percent')
      .reduce((sum, modifier) => sum + modifier.value, 0);
    const points = run.statState.base[stat] + existing
      .filter(modifier => modifier.stat === stat && modifier.operation === 'flat')
      .reduce((sum, modifier) => sum + modifier.value, 0);
    const factor = 1 + percent / 100;
    if (factor !== 0) {
      modifiers.push({ stat, operation: 'flat', value: after[stat] / factor - points });
    } else if (points !== 0) {
      // A zero multiplier cannot be inverted with a point contribution.
      modifiers.push({ stat, operation: 'percent', value: after[stat] * 100 / points });
    } else {
      modifiers.push({ stat, operation: 'flat', value: after[stat] });
      modifiers.push({ stat, operation: 'percent', value: 100 });
    }
  }
  run.statState = withStatSource(run.statState, source, modifiers);
}
