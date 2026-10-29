import { drawSkeleton } from '../sprites.mjs';

// Act 3 — Diablo, wave 1. Skeleton: the dungeon's cheapest body. Nothing of its
// own: it walks, it reaches and it swings the rusted blade. The act's pressure
// comes from how many of them stand up.
const skeleton = {
  id: 'skeleton',
  stats: {
    life: wave => 30 + 6 * wave,
    defense: 5,                          // 5% -> 0.5 points -> 2.5% mitigation
    attack: 90,                          // 90% -> 9 contact damage
    attackSpeed: 140,                    // 140% -> one swing every 0.71 s
    attackDistance: 0,
    moveSpeed: 1250,                     // 62.5 scaled px/s: light on its feet
  },
  radius: 13,
  bounty: 2,
  draw(ctx, x, y, options = {}) {
    drawSkeleton(ctx, x, y + 30, { scale: 2, ...options });
  },
};

export default skeleton;
