import { drawBurningElite } from '../sprites.mjs';

// Act 3 — Diablo, wave 4. Burning elite: the script's "enemigos élite rodeados
// de fuego". It swings like any other body, but the fire on its back is not
// decoration: it throws a ring of flame without closing the distance.
const burningElite = {
  id: 'burningElite',
  stats: {
    life: wave => 110 + 16 * wave,
    defense: 30,                         // 30% -> 3 points -> 15% mitigation
    attack: 170,                         // 170% -> 17 contact damage
    attackSpeed: 105,                    // 105% -> one swing every 0.95 s
    attackDistance: 0,
    moveSpeed: 1050,                     // 52.5 scaled px/s
  },
  radius: 19,
  bounty: 7,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'flames',
      chance: 1,
      cooldown: 7,
      range: 300,
      // The fire it carries bursts outward: step out of the ring or take it.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 24, maxRadius: 300 });
        run.effects.push({ x: enemy.x, y: enemy.y - 96, text: 'FUEGO', ttl: 0.8, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawBurningElite(ctx, x, y + 36, { scale: 2, ...options });
  },
};

export default burningElite;
