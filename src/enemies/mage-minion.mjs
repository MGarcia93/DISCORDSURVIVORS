import { drawMageMinion } from '../sprites.mjs';

// Act 2 — League of Legends, wave 2. The mage minion: robed artillery that keeps
// its distance and throws a bolt instead of touching the player. Its reach is
// its attack distance; the engine fires the straight shot when the ficha has one.
const mageMinion = {
  id: 'mageMinion',
  stats: {
    life: wave => 24 + 4 * wave,
    defense: 0,
    attack: 100,                        // 100% -> 10 damage per bolt
    attackSpeed: 100,                   // 100% -> one bolt per second
    attackDistance: 170,                // 170% of 100 units -> 187 px of reach
    moveSpeed: wave => 760 + 40 * wave,
  },
  radius: 12,
  bounty: 2,
  // Art key of the shot it throws. The projectile is the same object the player
  // uses; this only picks its drawing.
  projectile: 'bolt',
  draw(ctx, x, y, options = {}) {
    drawMageMinion(ctx, x, y + 34, { scale: 2, ...options });
  },
};

export default mageMinion;
