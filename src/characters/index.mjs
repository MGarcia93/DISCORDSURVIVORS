import negro from './negro.mjs';
import solago from './solago.mjs';
import warrior from './warrior.mjs';
import papazito from './papazito.mjs';
import jhony from './jhony.mjs';

export const CHARACTERS = { negro, solago, warrior, papazito, jhony };

// Card order for the selection roster.
export const ROSTER = [negro, solago, warrior, papazito, jhony];

export function getCharacter(id) {
  return CHARACTERS[id] ?? CHARACTERS.negro;
}
