import { drawZombie } from '../sprites.mjs';

// Act 7 — the Jhony epilogue. The protected zombie: a padded jacket, shoulder
// pads and a bandana over the mouth. It soaks and it is slow; it walks in front
// of the others, which is the whole point of a body that takes less damage.
const protectedZombie = {
  id: 'protectedZombie',
  stats: {
    life: 250,
    defense: 40,                        // 40% -> 4 points -> 20% mitigation
    attack: 460,                        // 46 contact damage
    attackSpeed: 120,                   // 120% -> one swing every 0.83 s
    attackDistance: 0,
    moveSpeed: 900,
  },
  radius: 20,
  bounty: 4,
  draw(ctx, x, y, options = {}) {
    drawZombie(ctx, x, y + 31, { scale: 2, outfit: 'protected', ...options });
  },
};

export default protectedZombie;
