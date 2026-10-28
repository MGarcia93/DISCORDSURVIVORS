import negro from './negro.mjs';
import solago from './solago.mjs';
import warrior from './warrior.mjs';
import papazito from './papazito.mjs';

export const CHARACTERS = { negro, solago, warrior, papazito };

export function getCharacter(id) {
  return CHARACTERS[id] ?? CHARACTERS.negro;
}
