import { drawVespoid } from '../sprites.mjs';

// Act 6 — Monster Hunter, waves 1 and 6. Vespoid: the wasp that flanks. Its
// body is airborne, so what makes it dangerous is the angle, not the bite: it
// comes in faster than the pack and keeps circling.
const vespoid = {
  id: 'vespoid',
  stats: {
    life: 70,
    defense: 0,
    attack: 260,                        // 26 damage
    attackSpeed: 150,                   // 150% -> one sting every 0.67 s
    attackDistance: 0,
    moveSpeed: wave => 1050 + 70 * wave,
  },
  radius: 12,
  bounty: 2,
  draw(ctx, x, y, options = {}) {
    drawVespoid(ctx, x, y + 34, { scale: 2, ...options });
  },
};

export default vespoid;
