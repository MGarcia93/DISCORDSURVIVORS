import { drawRunner } from '../sprites.mjs';

// Act 1 — Project Zomboid. The fast half of "faster and more resistant": a lean,
// forward-leaning frame with long legs and arms swept back, so it reads as fast
// even standing still. It reaches you, but it cannot take a hit.
const runner = {
  id: 'runner',
  stats: {
    life: wave => 28 + 5 * wave,          // 28% + 5 pp per wave
    defense: 0,
    attack: 120,                          // 120% -> 12 contact damage
    attackSpeed: 154,                     // 154% -> one swing every 0.65 s
    attackDistance: 0,                    // melee: contact, measured from the edge
    moveSpeed: wave => 1760 + 80 * wave,  // 1760% + 80 pp per wave
  },
  radius: 13,
  bounty: 2,
  draw(ctx, x, y, options = {}) {
    drawRunner(ctx, x, y + 31, { scale: 2, ...options });
  },
};

export default runner;
