import { drawBrute } from '../sprites.mjs';

// Act 1 — Project Zomboid. The resistant half of "faster and more resistant":
// a wall that soaks, hits hard and walks at half a zombie's pace so it can be
// walked around. Big body, big bounty, no special rule of its own.
const brute = {
  id: 'brute',
  stats: {
    life: 156,      // 120% + 12 pp per wave -> 156 in wave 3
    defense: 60,                        // 60% -> 6 points -> 30% mitigation
    attack: 420,                        // 420% -> 42 contact damage: a brute hit is a mistake you notice
    attackSpeed: 100,                   // 100% -> one swing per second
    attackDistance: 0,                  // melee: contact, measured from the edge
    moveSpeed: 430, // 430% -> 21.5 scaled px/s: a wall, not a chaser
  },
  radius: 22,
  bounty: 5,
  draw(ctx, x, y, options = {}) {
    drawBrute(ctx, x, y + 36, { scale: 2, ...options });
  },
};

export default brute;
