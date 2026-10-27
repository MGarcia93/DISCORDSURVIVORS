import negro from './negro.mjs';
import solago from './solago.mjs';

export const CHARACTERS = { negro, solago };

export function getCharacter(id) {
  return CHARACTERS[id] ?? CHARACTERS.negro;
}
