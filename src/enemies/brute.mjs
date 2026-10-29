import { drawBrute } from '../sprites.mjs';

// Act 1 — Project Zomboid. The resistant half of "faster and more resistant":
// a wall that soaks, hits hard and walks at half a zombie's pace so it can be
// walked around. Big body, big bounty, no special rule of its own.
const brute = {
  id: 'brute',
  stats: {
    life: wave => 120 + 12 * wave,      // 120% + 12 pp per wave -> 156 in wave 3
    defense: 60,                        // 60% -> 6 points -> 30% mitigation
    attack: 300,                        // 300% -> 30 contact damage
    attackSpeed: 100,                   // 100% -> one swing per second
    attackDistance: 0,                  // melee: contact, measured from the edge
    moveSpeed: wave => 400 + 30 * wave, // 400% + 30 pp per wave -> 27 px/s in wave 3
  },
  radius: 22,
  bounty: 5,
  draw(ctx, x, y, options = {}) {
    drawBrute(ctx, x, y + 36, { scale: 2, ...options });
  },
};

export default brute;
