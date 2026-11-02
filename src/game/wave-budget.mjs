import { enemyBounty } from '../enemies/index.mjs';
import { nextLevelXPFor } from '../run-rewards.mjs';
import { waveBudget as spawnBudgetFor, waveConfig } from '../waves.mjs';
import { PLAYABLE_ACTS } from '../campaign/acts.mjs';

// A wave's entry budget: what a player who survived the waves before it already
// earned. The lab needs it to be honest — a level-5 build at wave 5 is a claim
// about the campaign, not a number someone typed.
//
// It reads the act's own rows (density, mix, life is irrelevant here) and the
// balance's economy, so switching between the real pacing and the playtest one
// moves the budget with it. Pure: no run, no DOM, no storage.

export function levelForXP(balance, xp) {
  let level = 1, pool = Math.max(0, Math.floor(xp));
  // A bounded loop: every step consumes a strictly growing requirement, so a
  // finite pool always terminates, and a broken balance cannot hang the page.
  while (level < 99) {
    const requirement = nextLevelXPFor(balance, level);
    if (!(pool >= requirement)) break;
    pool -= requirement;
    level++;
  }
  return level;
}

function minibosses(act) {
  const declared = act?.miniboss;
  if (!declared) return [];
  return Array.isArray(declared) ? declared : [declared];
}

// The campaign arrives at a wave with everything the previous worlds paid, not
// just this act's own waves: picking Act 2 wave 1 must carry Act 1's haul.
function previousActs(act) {
  const index = PLAYABLE_ACTS.findIndex(candidate => candidate.id === act.id);
  return index <= 0 ? [] : PLAYABLE_ACTS.slice(0, index);
}

export function waveEntryBudget(act, wave, balance) {
  const duration = balance.waves?.duration ?? act.duration;
  const multiplier = balance.xp.multiplier ?? 1;
  const entry = { wave, duration, xp: 0, coins: 0, level: 1, choices: 0 };
  const campaign = [
    ...previousActs(act).flatMap(earlier => Array.from({ length: earlier.waves.length }, (_, index) => ({ act: earlier, wave: index + 1 }))),
    ...Array.from({ length: wave - 1 }, (_, index) => ({ act, wave: index + 1 })),
  ];
  for (const { act: row, wave: w } of campaign) {
    const config = waveConfig(row, w);
    if (!config) continue;
    const spawns = spawnBudgetFor(row, w, duration);
    const mix = Object.entries(config.mix ?? {}).filter(([, weight]) => weight > 0);
    const share = mix.reduce((sum, [, weight]) => sum + weight, 0);
    if (!mix.length || !spawns) {
      // An untimed wave spends its own coin: the survival payout still lands.
      entry.coins += balance.gold?.survival ?? 20;
      continue;
    }
    for (const [kind, weight] of mix) {
      const kills = spawns * weight / share;
      entry.xp += kills * (balance.xp.rewards?.[kind] ?? 0) * multiplier;
      entry.coins += kills * (balance.gold?.rewards?.[kind] ?? enemyBounty(kind));
    }
    entry.coins += balance.gold?.survival ?? 20;
  }
  // A mini-boss and an act boss are not part of any spawn mix: they walk in on
  // their own wave and pay once, so they count when their world is already
  // behind you — every world before this one, and this one up to this wave.
  const visited = [
    ...previousActs(act).map(earlier => ({ act: earlier, upTo: earlier.waves.length })),
    { act, upTo: wave - 1 },
  ];
  for (const { act: row, upTo } of visited) {
    for (const boss of minibosses(row)) {
      if (boss.wave > upTo) continue;
      entry.xp += (balance.xp.rewards?.[boss.kind] ?? 0) * multiplier;
      entry.coins += balance.gold?.rewards?.[boss.kind] ?? enemyBounty(boss.kind);
    }
    if (upTo >= row.waves.length) {
      entry.xp += (balance.xp.rewards?.[row.boss.kind] ?? 0) * multiplier;
      entry.coins += balance.gold?.rewards?.[row.boss.kind] ?? enemyBounty(row.boss.kind);
    }
  }
  entry.level = levelForXP(balance, entry.xp);
  // Level 1 is the character's own sheet: only the levels above it are choice.
  entry.choices = entry.level - 1;
  entry.coins = Math.floor(entry.coins);
  return entry;
}
