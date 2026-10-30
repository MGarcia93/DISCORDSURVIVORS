import { drawAlchemist } from '../sprites.mjs';

// Act 4 — Conan Exiles, wave 4. Alchemist: the lotus keeper. It lobs a flask of
// Yellow Lotus and, once the player closes in, cracks a spore pod at its feet.
// Both are its own actions; nothing is inherited from the act's mini-boss, who
// keeps the visions.
const alchemist = {
  id: 'alchemist',
  stats: {
    life: wave => 30 + 6 * wave,
    defense: 5,                          // 5% -> 0.5 points -> 2.5% mitigation
    attack: 95,                          // 95% -> 9.5 damage per flask
    attackSpeed: 80,                     // 80% -> one throw every 1.25 s
    attackDistance: 160,                 // 160% of 100 units -> 176 px of reach
    moveSpeed: 860,                      // 43 scaled px/s
  },
  radius: 13,
  bounty: 4,
  projectile: 'flask',
  actions: [
    // A melee action on a kind with reach still fires its shot: this is the
    // flask, and the engine pays the clock.
    { key: 'throw', chance: 3, kind: 'melee' },
    {
      key: 'spores',
      chance: 1,
      cooldown: 8,
      range: 300,
      // "Hongos que liberan esporas": the pod bursts outward. Step out of the
      // cloud or breathe it.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 18, speed: 380, maxRadius: 300 });
        run.effects.push({ x: enemy.x, y: enemy.y - 74, text: 'ESPORAS', ttl: 0.8, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawAlchemist(ctx, x, y + 33, { scale: 2, ...options });
  },
};

export default alchemist;
