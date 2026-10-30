import { drawLilithEcho } from '../sprites.mjs';

// Act 3 — Diablo, wave 6. The Echo of Lilith: the copy she tears out of herself
// when the fight starts. It is not a second boss — it carries no boss flag, so
// it can be stunned and confused like any elite — but it claws as hard as she
// does and it is fast enough to punish a player who only runs from the mother.
const lilithEcho = {
  id: 'lilithEcho',
  stats: {
    life: 320,
    defense: 15,                         // 15% -> 1.5 points -> 7.5% mitigation
    attack: 220,                         // 220% -> 22 contact damage
    attackSpeed: 130,                    // 130% -> one swing every 0.77 s
    attackDistance: 0,
    moveSpeed: 1650,                     // 82.5 scaled px/s: faster than she is
  },
  radius: 20,
  bounty: 10,
  actions: [
    { key: 'claw', chance: 1, kind: 'melee', damage: 22 },
  ],
  draw(ctx, x, y, options = {}) {
    drawLilithEcho(ctx, x, y + 54, { scale: 1.5, ...options });
  },
};

export default lilithEcho;
