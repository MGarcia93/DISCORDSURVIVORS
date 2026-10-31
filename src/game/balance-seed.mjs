import { createRun, seedWave } from '../engine.mjs';
import { applyUpgradeRank, countOf, grantItem } from '../run-rewards.mjs';
import { BALANCE, playtestBalance } from '../reward-data.mjs';
import { waveEntryBudget } from './wave-budget.mjs';

// Builds the run a player would bring to a wave, so a single wave can be played
// in isolation. Everything it spends comes from `waveEntryBudget`: the levels
// are the ones the campaign already granted, the coins are the ones the waves
// before it paid. The lab only ever offers choices this module accepts.

const total = counts => Object.values(counts).reduce((sum, amount) => sum + amount, 0);

// Why a level entry cannot be taken right now, or null when it can. Mirrors the
// catalog's own gates: the character that owns it, its rank cap, its level
// requirement and the level choices left over.
export function pickBlocked(upgrade, { character, level, choices, picks = {} }) {
  if (!upgrade) return 'unknown';
  if (upgrade.characters !== 'all' && upgrade.characters !== character) return 'character';
  if (countOf(picks, upgrade.id) >= upgrade.ranks.length) return 'maxed';
  if ((upgrade.minLevel ?? 1) > level) return 'level';
  if (total(picks) >= choices) return 'budget';
  return null;
}

// Why one more copy cannot be bought right now, or null when it can.
export function itemBlocked(item, { coins, items = {} }) {
  if (!item) return 'unknown';
  if (item.enabled === false) return 'disabled';
  if (countOf(items, item.id) >= item.maxCopies) return 'maxed';
  if (coins < item.price) return 'coins';
  return null;
}

export function seedRun({
  character = 'negro', act, wave, balance = BALANCE,
  picks = {}, items = {}, random = Math.random,
} = {}) {
  const entry = waveEntryBudget(act, wave, balance);
  const run = createRun(random, character, { balance }, act);
  seedWave(run, wave);
  // The campaign reaches this wave with that much survival time behind it, and
  // some sheets read `elapsed` (the alarm zombie's horde grows with it), so the
  // seeded wave has to start on the same clock the campaign would.
  run.elapsed = (wave - 1) * entry.duration;
  run.level = entry.level;
  run.pendingLevels = [];
  run.levelChoices = null;
  run.coins = entry.coins;

  // Level entries are free: they are the choices the earned levels already paid
  // for. The catalogue caps the rank and the level gates the entry.
  let left = entry.choices;
  for (const [id, wanted] of Object.entries(picks)) {
    const upgrade = run.rewardCatalog.upgrades.find(candidate => candidate.id === id);
    if (!upgrade || (upgrade.characters !== 'all' && upgrade.characters !== character)) continue;
    if ((upgrade.minLevel ?? 1) > entry.level) continue;
    const rank = countOf(run.levelRanks, id);
    const allowed = Math.min(wanted, upgrade.ranks.length - rank, left);
    for (let taken = 0; taken < allowed; taken++) {
      if (!applyUpgradeRank(run, upgrade)) break;
      left--;
    }
  }

  // Coins buy the shop's items, which is the only thing the shop sells besides
  // the heal. The phase is borrowed because the shop is the only door the
  // engine's purchase rules open for.
  const playing = run.phase;
  run.phase = 'shop';
  for (const [id, wanted] of Object.entries(items)) {
    const item = run.rewardCatalog.items.find(candidate => candidate.id === id);
    for (let bought = 0; bought < wanted; bought++) {
      if (!item || run.coins < item.price || !grantItem(run, id)) break;
      run.coins -= item.price;
    }
  }
  run.phase = playing;

  // A prepared build arrives at full health: the lab tests the wave, not the
  // damage accumulated on the way here.
  run.player.hp = run.player.maxHp;
  return { run, entry, remaining: { choices: left, coins: run.coins } };
}

// The two balances the lab compares: the shipped one and the tuning one.
export function balanceForMode(mode) {
  return mode === 'playtest' ? playtestBalance() : BALANCE;
}
