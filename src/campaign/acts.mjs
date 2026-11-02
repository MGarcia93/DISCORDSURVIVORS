import act01 from './act-01-zomboid.mjs';
import act02 from './act-02-rift.mjs';
import act03 from './act-03-inferno.mjs';
import act04 from './act-04-exiles.mjs';
import act05 from './act-05-discord.mjs';
import act06 from './act-06-monster-hunter.mjs';
import act07 from './act-07-zomboid-base.mjs';
import { validateCampaign } from './validate.mjs';

// The campaign map. This is the ONLY module that knows how many worlds exist,
// in what order they run and which of them are playable: every other module
// reads the descriptor it is handed. Adding a world is a module plus one line
// here; removing one is deleting that line.
//
// Monster Hunter was a rejected pitch inside Act 4 and becomes playable here, as
// the Papafrita epilogue: the campaign's last world is the postgame.
export const ACTS = [
  act01,
  act02,
  act03,
  act04,
  act05,
  act06,
  act07,
];

// Loading the module validates the whole map, so a half-authored act fails at
// boot and in the test suite instead of at wave six.
validateCampaign(ACTS);

export const PLAYABLE_ACTS = ACTS.filter(act => act.status === 'playable');
export const DEFAULT_ACT = PLAYABLE_ACTS[0];

export function getAct(id) {
  return ACTS.find(act => act.id === id) ?? DEFAULT_ACT;
}

// The inverse lookup. A scene names the world it paints, not the act it belongs
// to, so this is what turns `stage.background` into the act that owns it — and
// therefore into the act's track. A shared world ('arena', 'room') belongs to no
// act and answers null; the caller falls back to the default track.
export function actForWorld(world) {
  return ACTS.find(act => act.world === world) ?? null;
}

export function nextPlayableAct(id) {
  const index = PLAYABLE_ACTS.findIndex(act => act.id === id);
  return index < 0 ? null : PLAYABLE_ACTS[index + 1] ?? null;
}
