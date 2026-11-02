import { createRun } from '../engine.mjs';
import { nextPlayableAct } from '../campaign/acts.mjs';
import { postgameOpen } from '../progression.mjs';
import { applyStatState } from '../stat-modifiers.mjs';

// Continue the campaign with the acquired build, not the previous battlefield.
// Reuse the permanent stat snapshot rather than reapplying purchases: doing so
// would charge again, double-stack modifiers or reset acquisition limits.
export function createNextWorldRun(previous) {
  const act = previous?.worldCleared ? nextPlayableAct(previous.act.id, { postgame: postgameOpen() }) : null;
  if (!act) return null;
  const run = createRun(previous.random, previous.character, {
    catalog: previous.rewardCatalog, balance: previous.rewardBalance,
  }, act);
  for (const key of ['statState', 'effectSources', 'items', 'levelRanks', 'upgrades']) {
    run[key] = structuredClone(previous[key]);
  }
  run.player.rewardBonuses = structuredClone(previous.player.rewardBonuses);
  applyStatState(run.player, run.statState);
  run.player.hp = run.player.maxHp;
  run.player.regen = previous.player.regen;
  for (const key of ['level', 'xp', 'coins']) run[key] = previous[key];
  // Selling a possession is once per campaign, not once per world.
  if (previous.player.soldItems) run.player.soldItems = structuredClone(previous.player.soldItems);
  return run;
}
