import { previewReward } from '../run-rewards.mjs';
import { createStatState, resolveStatState } from '../stat-modifiers.mjs';
import { STAT_LABELS } from '../reward-catalog.mjs';
import { EFFECTS } from '../reward-data.mjs';

const number = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

// Read the same capped candidate that acquisition will apply. Display-only
// rounding never changes stored statistics or heals the player.
export function rewardPreviewLines(run, source, reward) {
  const preview = previewReward(run, source, reward);
  if (!preview) return null;
  const before = createStatState(resolveStatState(run.statState)).base;
  const after = createStatState(resolveStatState(preview.statState)).base;
  const lines = [...new Set((reward.modifiers ?? []).map(modifier => modifier.stat))]
    .map(stat => `${STAT_LABELS[stat]}: ${number.format(before[stat])} → ${number.format(after[stat])}`);
  for (const type of new Set((reward.effects ?? []).map(effect => effect.type))) {
    const increase = (preview.bonuses[type] ?? 0) - (run.player.rewardBonuses[type] ?? 0);
    lines.push(EFFECTS[type].describe(increase));
  }
  return lines;
}
