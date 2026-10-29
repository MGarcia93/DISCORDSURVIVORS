import { drawLootGoblin } from '../sprites.mjs';

// Act 3 — Diablo, the Goblin de las Señas' fodder. Small, fast, greedy and
// generic: the mini-boss brings them in packs, and their job is to be between
// the player and the big one.
const lootGoblin = {
  id: 'lootGoblin',
  stats: {
    life: wave => 14 + 3 * wave,
    defense: 0,
    attack: 70,                          // 70% -> 7 contact damage
    attackSpeed: 150,                    // 150% -> one swing every 0.67 s
    attackDistance: 0,
    moveSpeed: 1900,                     // 95 scaled px/s: it runs
  },
  radius: 9,
  bounty: 1,
  draw(ctx, x, y, options = {}) {
    drawLootGoblin(ctx, x, y + 26, { scale: 2, ...options });
  },
};

export default lootGoblin;
