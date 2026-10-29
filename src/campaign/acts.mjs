import act01 from './act-01-zomboid.mjs';
import { validateCampaign } from './validate.mjs';

// The campaign map. This is the ONLY module that knows how many worlds exist,
// in what order they run and which of them are playable: every other module
// reads the descriptor it is handed. Adding a world is a module plus one line
// here; removing one is deleting that line.
//
// Monster Hunter is deliberately absent: it is a rejected pitch in Act 4, not a
// world. It enters this list the day it becomes playable.
export const ACTS = [
  act01,
  { id: 'act-02', order: 2, title: 'League of Legends', status: 'planned', world: 'rift' },
  { id: 'act-03', order: 3, title: 'Diablo', status: 'planned', world: 'inferno' },
  { id: 'act-04', order: 4, title: 'Conan Exiles', status: 'planned', world: 'exiles' },
  { id: 'act-05', order: 5, title: 'Discord Corrupto', status: 'planned', world: 'discord' },
];

// Loading the module validates the whole map, so a half-authored act fails at
// boot and in the test suite instead of at wave six.
validateCampaign(ACTS);

export const PLAYABLE_ACTS = ACTS.filter(act => act.status === 'playable');
export const DEFAULT_ACT = PLAYABLE_ACTS[0];

export function getAct(id) {
  return ACTS.find(act => act.id === id) ?? DEFAULT_ACT;
}
