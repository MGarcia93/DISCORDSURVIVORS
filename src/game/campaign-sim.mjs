import { activateSpecial, buyHeal, buyItem, chooseLevelReward, createRun, sellBelonging, skipEmptyChoice, startNextWave, step } from '../engine.mjs';
import { BALANCE } from '../reward-data.mjs';
import { DEFAULT_ACT, nextPlayableAct } from '../campaign/acts.mjs';
import { HEAL_COST } from '../engine.mjs';
import { beginRewards, countOf, itemPrice } from '../run-rewards.mjs';
import { createNextWorldRun } from './campaign-run.mjs';
import { postgameOpen } from '../progression.mjs';
import { ITEM_PRIORITY, POLICIES, SKILLS, SPENDING, botInput, botSpecialKeys, offerValue, shouldUseSpecial } from './bot.mjs';

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

// Papazito plays on the sale menu: his stock is coins now and damage for a
// while. A bot that never sells is a Papazito without a kit, so the seller goes
// first, cheapest first, once per wave while the buff is down.
function sellOne(run) {
  const stock = run.player.characterDef.specials?.find(special => special.items)?.items ?? {};
  const keys = Object.keys(stock).filter(key => !run.player.soldItems?.[key]);
  if (!keys.length) return false;
  keys.sort((a, b) => stock[a].coins - stock[b].coins);
  return sellBelonging(run, keys[0]);
}

export function playWave(run, { skill = 'perfect', random, sell = true } = {}) {
  const keys = botSpecialKeys(run);
  const profile = SKILLS[skill] ?? SKILLS.perfect;
  const dice = random ?? (() => 1);
  let input = { x: 0, y: 0 };
  let frame = 0;
  let elapsed = 0;
  if (sell) sellOne(run);
  while (elapsed < WAVE_LIMIT) {
    if (frame % profile.reactionFrames === 0) input = botInput(run, profile, dice, input);
    step(run, FRAME, input);
    frame++;
    elapsed += FRAME;
    if (run.phase !== 'playing') return run.phase;
    if (shouldUseSpecial(run)) for (const key of keys) activateSpecial(run, key);
  }
  return run.phase;
}

// Whose money is it anyway: `smart` only takes what helps and keeps a purse for
// the heal, `greedy` clears the shelf, `random` flips a coin, `none` saves.
const BUYERS = {
  smart: (run, item, price) => offerValue(item) > 0 && run.coins - price >= 3 * HEAL_COST,
  greedy: () => true,
  random: (run, item, price, random) => random() < 0.5,
  none: () => false,
};

export function runShop(run, character, { policy = 'optimal', spend = 'normal', buy = 'smart' } = {}) {
  beginRewards(run);
  const decide = POLICIES[policy] ?? POLICIES.optimal;
  let guard = 0;
  while (run.pendingLevels.length && guard++ < SHOP_LIMIT) {
    const pick = decide(run, character);
    if (!pick || !chooseLevelReward(run, pick.id)) { if (!skipEmptyChoice(run)) break; }
  }
  const beforeBoss = run.wave + 1 === run.act.boss.wave;
  const plan = (SPENDING[spend] ?? SPENDING.normal)(run, character, { beforeBoss });
  // A person heals at the shop before spending on anything else. Without this
  // the bot bleeds out across a campaign and reports losses the game never
  // forces on a player.
  let healed = 0;
  while (plan.heal && run.player.hp < run.player.maxHp && buyHeal(run) && healed++ < 20) { /* keep healing */ }
  if (plan.items) {
    const judge = BUYERS[buy] ?? BUYERS.smart;
    const ordered = buy === 'greedy' || buy === 'random'
      ? [...(run.shopOffers ?? [])]
      : ITEM_PRIORITY.flatMap(id => (run.shopOffers ?? []).filter(entry => entry.id === id));
    for (const offer of ordered) {
      if (!offer || offer.bought) continue;
      const item = run.rewardCatalog.items.find(candidate => candidate.id === offer.id);
      if (!item) continue;
      const price = itemPrice(item, countOf(run.items, item.id));
      if (!judge(run, item, price, run.random)) continue;
      buyItem(run, offer.id);
    }
  }
  return run.pendingLevels.length === 0;
}

export function runCampaign({ character = 'negro', seed = 1, act = DEFAULT_ACT, maxWaves = 300, policy = 'optimal', spend = 'normal', skill = 'perfect', buy = 'smart' } = {}) {
  let run = createRun(seededRandom(seed), character, { balance: BALANCE }, act);
  // The bot rolls its own dice so a sloppy hand plays the same campaign.
  const dice = seededRandom(seed * 31 + 7);
  const waves = [];
  for (let guard = 0; guard < maxWaves; guard++) {
    const phase = playWave(run, { skill, random: dice });
    waves.push({ act: run.act.id, order: run.act.order, wave: run.wave, phase, level: run.level });
    if (phase === 'dead') return { won: false, run, waves, reason: 'dead' };
    if (phase !== 'shop') return { won: false, run, waves, reason: phase };
    if (!runShop(run, character, { policy, spend, buy })) return { won: false, run, waves, reason: 'shop' };
    if (run.worldCleared) {
      // Same gate createNextWorldRun uses: an act that is not open cannot be
      // chained, and asking with `postgame: true` regardless made the sim claim
      // a next world, get `null` back and crash while measuring. Clearing the
      // last open act is the campaign, won.
      if (!nextPlayableAct(run.act.id, { postgame: postgameOpen() })) return { won: true, run, waves };
      run = createNextWorldRun(run);
      if (!run) return { won: false, run, waves, reason: 'chain' };
      continue;
    }
    if (!startNextWave(run)) return { won: false, run, waves, reason: 'nextWave' };
  }
  return { won: false, run, waves, reason: 'guard' };
}

const average = values => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

// Wilson interval: with a handful of runs a bare percentage lies. This is the
// range the true rate is likely in, so "3/6" reads as a coin toss, not as 50%.
export function confidence(wins, runs) {
  if (!runs) return { low: 0, high: 1 };
  const z = 1.96, p = wins / runs;
  const denom = 1 + (z * z) / runs;
  const centre = p + (z * z) / (2 * runs);
  const spread = z * Math.sqrt((p * (1 - p)) / runs + (z * z) / (4 * runs * runs));
  return { low: Math.max(0, (centre - spread) / denom), high: Math.min(1, (centre + spread) / denom) };
}

// One line per character: how often the campaign is finished, at what level, and
// where the rest died. `own` counts the signature ranks a run actually reached,
// which is how "the build that breaks the run" gets measured.
export function measureCharacter(character, { runs = 24, seed = 11, step = 7, ownIds = [], policy = 'optimal', spend = 'normal', skill = 'perfect', buy = 'smart' } = {}) {
  const results = Array.from({ length: runs }, (_, index) => runCampaign({ character, seed: seed + index * step, policy, spend, skill, buy }));
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
    spread: confidence(wins, runs),
    level: Math.round(average(results.map(result => result.run.level))),
    ownRanks: Number(average(own.map(entries => entries.reduce((sum, [, rank]) => sum + rank, 0))).toFixed(1)),
    ownEntries: Number(average(own.map(entries => entries.length)).toFixed(1)),
    outcomes: results.map(result => (result.won ? 'win' : `A${result.waves.at(-1).order}W${result.waves.at(-1).wave}`)),
    deaths: Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}

export function measureRoster({ characters = ['negro', 'solago', 'warrior', 'papazito', 'jhony'], runs = 24, seed = 11, ownByCharacter = {}, policy = 'optimal', spend = 'normal', skill = 'perfect', buy = 'smart' } = {}) {
  return characters.map(character => measureCharacter(character, { runs, seed, ownIds: ownByCharacter[character] ?? [], policy, spend, skill, buy }));
}
