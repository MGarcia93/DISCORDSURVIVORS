import { drawArcher } from '../sprites.mjs';

// Act 4 — Conan Exiles, wave 2. Archer: the camp's guard on the wall. It keeps
// its distance and looses an arrow instead of touching the player; its reach is
// its attack distance and the engine fires the straight shot the ficha names.
// Cheap on its own, lethal behind a slaver's net.
const archer = {
  id: 'archer',
  stats: {
    life: wave => 24 + 5 * wave,
    defense: 0,
    attack: 90,                          // 90% -> 9 damage per arrow
    attackSpeed: 75,                     // 75% -> one arrow every 1.33 s
    attackDistance: 210,                 // 210% of 100 units -> 231 px of reach
    moveSpeed: 880,                      // 44 scaled px/s: it gives ground slowly
  },
  radius: 12,
  bounty: 3,
  // Art key of the shot it looses.
  projectile: 'arrow',
  draw(ctx, x, y, options = {}) {
    drawArcher(ctx, x, y + 33, { scale: 2, ...options });
  },
};

export default archer;
