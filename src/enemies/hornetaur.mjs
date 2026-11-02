import { drawHornetaur } from '../sprites.mjs';

// Act 6 — Monster Hunter, waves 3 and 5. Hornetaur: the resistant insect. It is
// the wall of its wave: a low carapace that walks into the group and soaks the
// hits the pack lizards would have eaten. No ability of its own; its rule is
// the sheet, with the highest mitigation of the act's common kinds.
const hornetaur = {
  id: 'hornetaur',
  stats: {
    life: 330,
    defense: 80,                        // 80% -> 8 points -> 40% mitigation
    attack: 220,                        // 22 damage
    attackSpeed: 70,                    // 70% -> one bite every 1.43 s
    attackDistance: 0,
    moveSpeed: wave => 650 + 30 * wave,
  },
  radius: 17,
  bounty: 4,
  draw(ctx, x, y, options = {}) {
    drawHornetaur(ctx, x, y + 30, { scale: 2, ...options });
  },
};

export default hornetaur;
