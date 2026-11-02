import { drawLesserDemon } from '../sprites.mjs';

// Act 3 — Diablo, wave 1. Lesser demon: the skeleton's heavier companion. More
// body, more punch, a little slower. It carries no rule of its own; the horns
// and the claws are the whole ficha.
const lesserDemon = {
  id: 'lesserDemon',
  stats: {
    life: 103,
    defense: 15,                         // 15% -> 1.5 points -> 7.5% mitigation
    attack: 290,                         // 290% -> 29 contact damage
    attackSpeed: 115,                    // 115% -> one swing every 0.87 s
    attackDistance: 0,
    moveSpeed: 1150,                     // 57.5 scaled px/s
  },
  radius: 15,
  bounty: 3,
  draw(ctx, x, y, options = {}) {
    drawLesserDemon(ctx, x, y + 32, { scale: 2, ...options });
  },
};

export default lesserDemon;
