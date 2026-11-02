import { drawMeleeMinion } from '../sprites.mjs';

// Act 2 — League of Legends, wave 1. The melee minion: the smallest armoured
// soldier of the Rift, the same on both teams. Generic by design: it walks,
// reaches contact and swings on its own cadence.
const meleeMinion = {
  id: 'meleeMinion',
  stats: {
    life: 57,
    defense: 20,                        // 20% -> 2 defence points -> 10% mitigation
    attack: 160,                        // 160% -> 16 contact damage
    attackSpeed: 154,                   // 154% -> one swing every 0.65 s
    attackDistance: 0,                  // melee: contact, measured from the edge
    moveSpeed: 1311,   // +30%: it has to reach the body to matter
  },
  radius: 13,
  bounty: 1,
  draw(ctx, x, y, options = {}) {
    drawMeleeMinion(ctx, x, y + 30, { scale: 2, ...options });
  },
};

export default meleeMinion;
