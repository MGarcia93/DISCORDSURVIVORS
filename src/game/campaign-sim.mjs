import { activateSpecial, buyHeal, buyItem, chooseLevelReward, createRun, skipEmptyChoice, startNextWave, step } from '../engine.mjs';
import { BALANCE } from '../reward-data.mjs';
import { DEFAULT_ACT, nextPlayableAct } from '../campaign/acts.mjs';
import { beginRewards } from '../run-rewards.mjs';
import { createNextWorldRun } from './campaign-run.mjs';
import { ITEM_PRIORITY, botInput, botSpecialKeys, pickLevelReward, shouldUseSpecial } from './bot.mjs';

// Headless campaign runner: the same engine the browser runs, with the bot from
// ./bot.mjs on the controls. It exists so a balance question ("can Solago finish
// the game?") has an answer that is not a guess, and so every character is
// measured by the same hands.

const FRAME = 1 / 60;
const WAVE_LIMIT = 400;   // a wave that never closes is a stuck run, not a win
const SHOP_LIMIT = 400;

export function seededRandom(seed) {
  let state = (seed >>> 0) || 1;
  return () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
}

export function playWave(run) {
  const keys = botSpecialKeys(run);
  let elapsed = 0;
  while (elapsed < WAVE_LIMIT) {
    step(run, FRAME, botInput(run));
    elapsed += FRAME;
    if (run.phase !== 'playing') return run.phase;
    if (shouldUseSpecial(run)) for (const key of keys) activateSpecial(run, key);
  }
  return run.phase;
}

export function runShop(run, character) {
  beginRewards(run);
  let guard = 0;
  while (run.pendingLevels.length && guard++ < SHOP_LIMIT) {
    const pick = pickLevelReward(run, character);
    if (!pick || !chooseLevelReward(run, pick.id)) { if (!skipEmptyChoice(run)) break; }
  }
  // A person heals at the shop before spending on anything else. Without this
  // the bot bleeds out across a campaign and reports losses the game never
  // forces on a player.
  let healed = 0;
  while (run.player.hp < run.player.maxHp && buyHeal(run) && healed++ < 20) { /* keep healing */ }
  for (const id of ITEM_PRIORITY) {
    for (let copy = 0; copy < 4; copy++) {
      const offer = (run.shopOffers ?? []).find(entry => entry.id === id && !entry.bought);
      if (!offer || !buyItem(run, id)) break;
    }
  }
  return run.pendingLevels.length === 0;
}

export function runCampaign({ character = 'negro', seed = 1, act = DEFAULT_ACT, maxWaves = 300 } = {}) {
  let run = createRun(seededRandom(seed), character, { balance: BALANCE }, act);
  const waves = [];
  for (let guard = 0; guard < maxWaves; guard++) {
    const phase = playWave(run);
    waves.push({ act: run.act.id, order: run.act.order, wave: run.wave, phase, level: run.level });
    if (phase === 'dead') return { won: false, run, waves, reason: 'dead' };
    if (phase !== 'shop') return { won: false, run, waves, reason: phase };
    if (!runShop(run, character)) return { won: false, run, waves, reason: 'shop' };
    if (run.worldCleared) {
      if (!nextPlayableAct(run.act.id)) return { won: true, run, waves };
      run = createNextWorldRun(run);
      if (!run) return { won: false, run, waves, reason: 'chain' };
      continue;
    }
    if (!startNextWave(run)) return { won: false, run, waves, reason: 'nextWave' };
  }
  return { won: false, run, waves, reason: 'guard' };
}

const average = values => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

// One line per character: how often the campaign is finished, at what level, and
// where the rest died. `own` counts the signature ranks a run actually reached,
// which is how "the build that breaks the run" gets measured.
export function measureCharacter(character, { runs = 24, seed = 11, step = 7, ownIds = [] } = {}) {
  const results = Array.from({ length: runs }, (_, index) => runCampaign({ character, seed: seed + index * step }));
  const wins = results.filter(result => result.won).length;
  const deaths = {};
  for (const result of results) {
    if (result.won) continue;
    const last = result.waves.at(-1);
    const key = `A${last.order}W${last.wave}`;
    deaths[key] = (deaths[key] ?? 0) + 1;
  }
  const own = results.map(result => {
    const ranks = result.run.levelRanks ?? {};
    return Object.entries(ranks).filter(([id]) => ownIds.includes(id));
  });
  return {
    character,
    runs,
    wins,
    rate: runs ? wins / runs : 0,
    level: Math.round(average(results.map(result => result.run.level))),
    ownRanks: Number(average(own.map(entries => entries.reduce((sum, [, rank]) => sum + rank, 0))).toFixed(1)),
    ownEntries: Number(average(own.map(entries => entries.length)).toFixed(1)),
    deaths: Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}

export function measureRoster({ characters = ['negro', 'solago', 'warrior', 'papazito'], runs = 24, seed = 11, ownByCharacter = {} } = {}) {
  return characters.map(character => measureCharacter(character, { runs, seed, ownIds: ownByCharacter[character] ?? [] }));
}
