import { BALANCE, DEFAULT_CATALOG, EFFECTS } from './reward-data.mjs';
import { selectLevelOptions, sampleEntries } from './reward-catalog.mjs';
import { createStatState, withStatSource, applyStatState } from './stat-modifiers.mjs';

const countOf = (entries, id) => Object.hasOwn(entries, id) ? entries[id] : 0;

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
  return Math.ceil(run.rewardBalance.xp.factor * level ** run.rewardBalance.xp.exponent);
}

export function awardXP(run, amount) {
  if (run.phase !== 'playing' || !Number.isSafeInteger(amount) || amount < 0) return false;
  let xp = run.xp + amount, level = run.level;
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

function applyReward(run, source, reward) {
  if (!canApply(run, source, reward)) return false;
  const state = withStatSource(run.statState, source, reward.modifiers ?? []);
  const sources = { ...run.effectSources, [source]: reward.effects ?? [] };
  const bonuses = {};
  for (const effects of Object.values(sources)) {
    for (const effect of effects) {
      const definition = EFFECTS[effect.type];
      if (!definition) return false;
      bonuses[effect.type] = Math.min(definition.max, (bonuses[effect.type] ?? 0) + effect.value);
    }
  }
  applyStatState(run.player, state);
  run.statState = state;
  run.effectSources = sources;
  run.player.rewardBonuses = bonuses;
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
  const rank = countOf(run.levelRanks, id);
  if (!entry.ranks[rank] || !applyReward(run, `level:${id}:${rank}`, entry.ranks[rank])) return false;
  run.levelRanks = { ...run.levelRanks, [id]: rank + 1 };
  run.pendingLevels.shift();
  run.levelChoices = null;
  beginRewards(run);
  return true;
}

export function skipEmptyChoice(run) {
  if (run.phase !== 'shop' || !run.pendingLevels.length || run.levelChoices?.length !== 0) return false;
  run.pendingLevels.shift();
  run.levelChoices = null;
  beginRewards(run);
  return true;
}

export function buyItem(run, id) {
  if (run.phase !== 'shop' || run.pendingLevels.length) return false;
  const offer = run.shopOffers?.find(entry => entry.id === id && !entry.bought);
  const item = run.rewardCatalog.items.find(entry => entry.id === id);
  const count = countOf(run.items, id);
  if (!offer || !item || count >= item.maxCopies || run.coins < item.price) return false;
  if (!applyReward(run, `item:${id}:${count}`, item)) return false;
  run.coins -= item.price;
  run.items = { ...run.items, [id]: count + 1 };
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
