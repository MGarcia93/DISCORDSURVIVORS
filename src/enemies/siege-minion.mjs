import { drawSiegeMinion } from '../sprites.mjs';

// Act 2 — League of Legends, wave 2. The siege minion: a wheeled cannon with the
// longest reach of the act's infantry and a slow, heavy shot. It is still a
// common enemy: the sheet and its shot are the whole rule.
const siegeMinion = {
  id: 'siegeMinion',
  stats: {
    life: wave => 46 + 8 * wave,
    defense: 40,                        // 40% -> 4 defence points -> 20% mitigation
    attack: 160,                        // 160% -> 16 damage per shell
    attackSpeed: 60,                    // 60% -> one shell every 1.67 s
    attackDistance: 180,                // 180% -> 198 px of reach
    moveSpeed: wave => 640 + 25 * wave,
  },
  radius: 18,
  bounty: 3,
  projectile: 'shell',
  draw(ctx, x, y, options = {}) {
    drawSiegeMinion(ctx, x, y + 34, { scale: 2, ...options });
  },
};

export default siegeMinion;
