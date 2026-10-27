import negro from './negro.mjs';
import solago from './solago.mjs';
import warrior from './warrior.mjs';

export const CHARACTERS = { negro, solago, warrior };

export function getCharacter(id) {
  return CHARACTERS[id] ?? CHARACTERS.negro;
}
