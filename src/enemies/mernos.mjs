import { drawMernos } from '../sprites.mjs';

// Act 6 — Monster Hunter, waves 2 and 4. Mernos: the flyer that crosses the
// clearing and dives. It gives the wave a second angle: the group has to watch
// the floor and the air at the same time.
const mernos = {
  id: 'mernos',
  stats: {
    life: 95,
    defense: 0,
    attack: 310,                        // 31 damage
    attackSpeed: 120,                   // 120% -> one hit every 0.83 s
    attackDistance: 0,
    moveSpeed: wave => 1100 + 60 * wave,
  },
  radius: 13,
  bounty: 2,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'dive',
      chance: 1,
      cooldown: 7,
      range: 900,
      run(run, enemy) {
        enemy.chargeBoost = 3;
        enemy.chargeTtl = 1.2;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 18, text: 'SE ABALANZA', ttl: 0.6, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawMernos(ctx, x, y + 36, { scale: 2, ...options });
  },
};

export default mernos;
