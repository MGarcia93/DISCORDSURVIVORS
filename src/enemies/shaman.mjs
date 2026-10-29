import { drawShaman } from '../sprites.mjs';

// Act 3 — Diablo, wave 2. Shaman: the act's artillery. It keeps its distance and
// throws a curse instead of touching the player; its reach is its attack
// distance and the engine fires the straight shot the ficha names.
const shaman = {
  id: 'shaman',
  stats: {
    life: wave => 26 + 5 * wave,
    defense: 0,
    attack: 100,                         // 100% -> 10 damage per hex
    attackSpeed: 90,                     // 90% -> one bolt every 1.11 s
    attackDistance: 170,                 // 170% of 100 units -> 187 px of reach
    moveSpeed: 900,                      // 45 scaled px/s: it stays behind
  },
  radius: 12,
  bounty: 3,
  // Art key of the shot it throws; the projectile is the player's object with
  // another owner.
  projectile: 'hex',
  draw(ctx, x, y, options = {}) {
    drawShaman(ctx, x, y + 34, { scale: 2, ...options });
  },
};

export default shaman;
