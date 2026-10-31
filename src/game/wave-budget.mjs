import { enemyBounty } from '../enemies/index.mjs';
import { nextLevelXPFor } from '../run-rewards.mjs';
import { waveBudget as spawnBudgetFor, waveConfig } from '../waves.mjs';

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

export function waveEntryBudget(act, wave, balance) {
  const duration = balance.waves?.duration ?? act.duration;
  const multiplier = balance.xp.multiplier ?? 1;
  const entry = { wave, duration, xp: 0, coins: 0, level: 1, choices: 0 };
  for (let w = 1; w < wave; w++) {
    const config = waveConfig(act, w);
    if (!config) continue;
    const spawns = spawnBudgetFor(act, w, duration);
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
  // A mini-boss is not part of any spawn mix: it walks in on its own wave and
  // pays once, so it is credited when its wave is already behind you.
  for (const boss of minibosses(act)) {
    if (!(boss.wave < wave)) continue;
    entry.xp += (balance.xp.rewards?.[boss.kind] ?? 0) * multiplier;
    entry.coins += balance.gold?.rewards?.[boss.kind] ?? enemyBounty(boss.kind);
  }
  entry.level = levelForXP(balance, entry.xp);
  // Level 1 is the character's own sheet: only the levels above it are choice.
  entry.choices = entry.level - 1;
  entry.coins = Math.floor(entry.coins);
  return entry;
}
