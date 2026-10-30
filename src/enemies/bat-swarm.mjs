import { drawBatSwarm } from '../sprites.mjs';

// Act 3 — Diablo, Lord Zir's court. Bat swarm: the fodder the vampire lord calls
// out of the dark. Tiny, fast and fragile; its job is to be between the player
// and the lord, not to land a hit on its own.
const batSwarm = {
  id: 'batSwarm',
  stats: {
    life: wave => 10 + 2 * wave,
    defense: 0,
    attack: 60,                          // 60% -> 6 contact damage
    attackSpeed: 160,                    // 160% -> one bite every 0.63 s
    attackDistance: 0,
    moveSpeed: 2100,                     // 105 scaled px/s: it flies
  },
  radius: 8,
  bounty: 1,
  draw(ctx, x, y, options = {}) {
    drawBatSwarm(ctx, x, y + 20, { scale: 2, ...options });
  },
};

export default batSwarm;
