import negro from './negro.mjs';
import solago from './solago.mjs';
import warrior from './warrior.mjs';
import papazito from './papazito.mjs';
import jhony from './jhony.mjs';
import papafrita from './papafrita.mjs';

export const CHARACTERS = { negro, solago, warrior, papazito, jhony, papafrita };

// Card order for the selection roster.
export const ROSTER = [negro, solago, warrior, papazito, jhony, papafrita];

export function getCharacter(id) {
  return CHARACTERS[id] ?? CHARACTERS.negro;
}
