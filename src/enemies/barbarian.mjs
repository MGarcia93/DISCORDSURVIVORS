import { drawBarbarian } from '../sprites.mjs';

// Act 4 — Conan Exiles, wave 1. Barbarian: the act's cheapest body, the desert
// raider the script calls "bárbaros y guerreros". Nothing of its own: it walks,
// it reaches and it swings the stone axe. The act's pressure is how many of them
// come out of the dunes at once.
const barbarian = {
  id: 'barbarian',
  stats: {
    life: wave => 32 + 7 * wave,
    defense: 10,                         // 10% -> 1 point -> 5% mitigation
    attack: 110,                         // 110% -> 11 contact damage
    attackSpeed: 130,                    // 130% -> one swing every 0.77 s
    attackDistance: 0,
    moveSpeed: wave => 900 + 60 * wave,
  },
  radius: 14,
  bounty: 2,
  draw(ctx, x, y, options = {}) {
    drawBarbarian(ctx, x, y + 31, { scale: 2, ...options });
  },
};

export default barbarian;
