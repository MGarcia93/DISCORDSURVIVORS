import { drawZombie } from '../sprites.mjs';

// Act 7 — the Jhony epilogue. The police zombie: a duty vest and a peak cap.
// Medium resistance and the fastest of the variants, so it arrives with the
// runners and pushes the side access before the heavy bodies get there.
const policeZombie = {
  id: 'policeZombie',
  stats: {
    life: 220,
    defense: 15,                        // 15% -> 1.5 points -> 7.5% mitigation
    attack: 460,                        // 46 contact damage
    attackSpeed: 154,
    attackDistance: 0,
    moveSpeed: 1180,
  },
  radius: 18,
  bounty: 3,
  draw(ctx, x, y, options = {}) {
    drawZombie(ctx, x, y + 31, { scale: 2, outfit: 'police', ...options });
  },
};

export default policeZombie;
