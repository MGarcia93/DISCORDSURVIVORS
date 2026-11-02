import { drawZombie } from '../sprites.mjs';

// Act 7 — the Jhony epilogue. The worker: overalls and a hi-vis vest, the kind
// that walks to the barricades instead of at the player. It is the plain body
// with a harder head and a slower pace, so a breach reads as effort, not speed.
//
// Sheet rung: act 7 is +25% over act 6, so the plain body is 175 life / 46
// damage. New fichas author that rung directly.
const workerZombie = {
  id: 'workerZombie',
  stats: {
    life: 200,
    defense: 0,
    attack: 460,                        // 46 contact damage
    attackSpeed: 154,                   // 154% -> one swing every 0.65 s
    attackDistance: 0,
    moveSpeed: 1080,
  },
  radius: 18,
  bounty: 3,
  draw(ctx, x, y, options = {}) {
    drawZombie(ctx, x, y + 31, { scale: 2, outfit: 'worker', ...options });
  },
};

export default workerZombie;
