import { drawFireman } from '../sprites.mjs';

// Act 7 — the Jhony epilogue, wave 3 mini-boss. The fireman: the body that
// walks through the depot wall. It is slow on purpose, telegraphs a straight
// charge and, once it stops, stands exposed for a moment before it swings
// again — the script's "ventana vulnerable tras embestir".
//
// It carries `boss: true` (boss bar, no crowd control) without closing the run:
// the engine only closes a world with the act's own boss.
const firemanZombie = {
  id: 'firemanZombie',
  boss: true,
  stats: {
    life: 2200,
    defense: 35,                        // 35% -> 3.5 points -> 17.5% mitigation
    attack: 700,                        // 70 contact damage
    attackSpeed: 95,                    // 95% -> one swing every 1.05 s
    attackDistance: 0,
    moveSpeed: 620,                     // a wall that charges, not a chaser
  },
  radius: 27,
  bounty: 25,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'charge',
      chance: 2,
      cooldown: 8,
      range: 900,
      // The straight rush, only from a distance and only when it is not
      // already recovering: a charge from contact would be unreadable.
      when: (run, enemy) => !enemy.exposed
        && Math.hypot(run.player.x - enemy.x, run.player.y - enemy.y) > 200,
      run(run, enemy) {
        enemy.chargeBoost = 2.4;
        enemy.chargeTtl = 0.8;
        enemy.exposed = true;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 18, text: 'EMBESTIDA', ttl: 0.8, kind: 'summon' });
      },
    },
    {
      key: 'recover',
      chance: 4,
      cooldown: 0,
      range: 9999,
      // The opening: it stops moving and cannot swing for a beat.
      when: (run, enemy) => enemy.exposed === true && (enemy.chargeTtl ?? 0) <= 0,
      run(run, enemy) {
        enemy.exposed = false;
        enemy.stunTtl = 0.9;
        enemy.attackCd = 1.4;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 18, text: 'EXPUESTO', ttl: 0.9, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawFireman(ctx, x, y + 45, { scale: 2, ...options });
  },
};

export default firemanZombie;
