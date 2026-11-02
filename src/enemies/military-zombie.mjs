import { drawZombie } from '../sprites.mjs';

// Act 7 — the Jhony epilogue. The military zombie: steel pot, webbing and
// pouches. High resistance in a straight line: it does not flinch, it does not
// turn, it keeps coming at the same pace until it reaches the wall.
const militaryZombie = {
  id: 'militaryZombie',
  stats: {
    life: 300,
    defense: 25,                        // 25% -> 2.5 points -> 12.5% mitigation
    attack: 480,                        // 48 contact damage
    attackSpeed: 140,
    attackDistance: 0,
    moveSpeed: 1120,
  },
  radius: 19,
  bounty: 5,
  draw(ctx, x, y, options = {}) {
    drawZombie(ctx, x, y + 31, { scale: 2, outfit: 'military', ...options });
  },
};

export default militaryZombie;
