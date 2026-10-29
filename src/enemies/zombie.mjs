import { drawZombie } from '../sprites.mjs';

// Act 1 — Project Zomboid. The baseline walker: slow, stooped, arms hanging.
// Every other kind is read against this one, so it stays the plainest body.
const zombie = {
  id: 'zombie',
  stats: {
    life: wave => 40 + 6 * wave,        // 40% + 6 pp per wave
    defense: 0,
    attack: 120,                        // 120% -> 12 contact damage
    attackSpeed: 154,                   // 154% -> one swing every 0.65 s
    attackDistance: 0,                  // melee: contact, measured from the edge
    moveSpeed: wave => 800 + 80 * wave, // 800% + 80 pp per wave
  },
  radius: 17,
  bounty: 2,
  draw(ctx, x, y, options = {}) {
    drawZombie(ctx, x, y + 31, { scale: 2, ...options });
  },
};

export default zombie;
