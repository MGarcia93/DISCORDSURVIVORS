import { drawMeleeMinion } from '../sprites.mjs';

// Act 2 — League of Legends, wave 1. The melee minion: the smallest armoured
// soldier of the Rift, the same on both teams. Generic by design: it walks,
// reaches contact and swings on its own cadence.
const meleeMinion = {
  id: 'meleeMinion',
  stats: {
    life: wave => 26 + 5 * wave,
    defense: 20,                        // 20% -> 1 defence point -> 5% mitigation
    attack: 110,                        // 110% -> 11 contact damage
    attackSpeed: 154,                   // 154% -> one swing every 0.65 s
    attackDistance: 0,                  // melee: contact, measured from the edge
    moveSpeed: wave => 940 + 70 * wave,
  },
  radius: 13,
  bounty: 1,
  draw(ctx, x, y, options = {}) {
    drawMeleeMinion(ctx, x, y + 30, { scale: 2, ...options });
  },
};

export default meleeMinion;
