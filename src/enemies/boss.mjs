import { drawAdministrator } from '../sprites.mjs';

// Act 1 — Project Zomboid, wave 6. The world boss sheet exists; its art is still
// the Administrator's, which belongs to act 5 and has to be replaced with its
// own alarm-dragging zombie. Its special attacks (summoning and sound waves,
// declared in the act 1 script) are still pending too.
const boss = {
  id: 'boss',
  stats: {
    life: 2200,       // 2200 points of damage
    defense: 0,
    attack: 300,      // 300% -> 30 contact damage
    attackSpeed: 154, // 154% -> one swing every 0.65 s
    attackDistance: 0,
    moveSpeed: 1040,  // 52 scaled px/s
  },
  radius: 38,
  bounty: 30,
  draw(ctx, x, y, options = {}) {
    drawAdministrator(ctx, x, y + 77, { scale: 4, ...options });
  },
};

export default boss;
