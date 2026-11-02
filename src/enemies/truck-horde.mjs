import { drawTruck } from '../sprites.mjs';

// Act 7 — the Jhony epilogue, wave 6. «La Horda del Camión»: the boss is the
// event, and the body that carries it is the truck. It is stranded, its horn is
// stuck and it neither walks nor hits: the threat is the horde the horn keeps
// calling, which is the wave's own spawn budget. Breaking the truck is breaking
// the horn, and that closes the world.
const truckHorde = {
  id: 'truckHorde',
  boss: true,
  stats: {
    life: 5200,
    defense: 60,                        // 60% -> 6 points -> 30% mitigation
    attack: 0,                          // a stranded truck does not swing
    attackSpeed: 120,
    attackDistance: 0,
    moveSpeed: 0,                       // it never chases: the horde does
  },
  radius: 58,
  bounty: 120,
  actions: [
    {
      key: 'blare',
      chance: 1,
      cooldown: 4,
      range: 4000,
      // The horn is the only thing this body does: it calls, it does not hurt.
      run(run, enemy) {
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 26, text: 'BOCINA', ttl: 0.9, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawTruck(ctx, x, y + 34, { scale: 2, ...options });
  },
};

export default truckHorde;
