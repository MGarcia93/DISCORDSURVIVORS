import { drawMageMinion } from '../sprites.mjs';

// Act 2 — League of Legends, wave 2. The mage minion: robed artillery that keeps
// its distance and throws a bolt instead of touching the player. Its reach is
// its attack distance; the engine fires the straight shot when the ficha has one.
const mageMinion = {
  id: 'mageMinion',
  stats: {
    life: 52,
    defense: 0,
    attack: 140,                        // 140% -> 14 damage per bolt
    attackSpeed: 100,                   // 100% -> one bolt per second
    attackDistance: 170,                // 170% of 100 units -> 187 px of reach
    moveSpeed: 800,
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
