import { drawSlaver } from '../sprites.mjs';

// Act 4 — Conan Exiles, wave 2. Slaver: the camp's crew. It hits like any other
// body, but its trade is the net: at a distance it throws one over the player
// and pins them where they stand, which is what makes the archers behind it
// dangerous. The net is its own action with a range, so it fires while the
// slaver is still walking.
const slaver = {
  id: 'slaver',
  stats: {
    life: wave => 34 + 7 * wave,
    defense: 15,                         // 15% -> 1.5 points -> 7.5% mitigation
    attack: 100,                         // 100% -> 10 contact damage
    attackSpeed: 120,                    // 120% -> one swing every 0.83 s
    attackDistance: 0,
    moveSpeed: 1000,                     // 50 scaled px/s: heavier than a raider
  },
  radius: 15,
  bounty: 3,
  actions: [
    { key: 'swipe', chance: 2, kind: 'melee' },
    {
      key: 'net',
      chance: 3,
      cooldown: 7,
      range: 340,
      // "Intentan capturarlos con redes": the net drops over the player and holds
      // them in place for a breath. It is a grapple, not a hit.
      run(run, enemy, ctx) {
        ctx.prison({ x: run.player.x, y: run.player.y, radius: 70, ttl: 1.3 });
        run.effects.push({ x: run.player.x, y: run.player.y - 84, text: 'RED', ttl: 0.9, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawSlaver(ctx, x, y + 32, { scale: 2, ...options });
  },
};

export default slaver;
