import { buyHeal, buyItem, chooseLevelReward, skipEmptyChoice } from '../engine.mjs';

// Shared by the real click handler and deterministic rendered-control tests.
export function handleRewardAction(run, dataset, refresh = () => {}) {
  if (!run) return null;
  let accepted;
  if (dataset.level) accepted = chooseLevelReward(run, dataset.level);
  else if (dataset.item) accepted = buyItem(run, dataset.item);
  else if (dataset.action === 'skip-level') accepted = skipEmptyChoice(run);
  // `data-heal` carries no value, so the mark is the key's presence: an empty
  // dataset value would read as false and the button would never do anything.
  else if ('heal' in dataset) accepted = buyHeal(run);
  else return null;
  refresh();
  return accepted;
}
