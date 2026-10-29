import { drawYorick } from '../sprites.mjs';

// Act 2 — League of Legends, wave 6. Yorick, the gravedigger: the act's boss and
// the owner of the Maiden. The script gives him three mechanics, and all three
// live here, in his own ficha: he calls walkers in, raises an earth wall that
// holds the player for a moment, and once he is half beaten he calls the Maiden.
//
// He is slower than the player on purpose, so everything he does has a range and
// fires while he is still walking: a boss that only swings never touches a
// player who kites.
const yorick = {
  id: 'yorick',
  boss: true,
  stats: {
    life: 1800,
    defense: 80,                        // 80% -> 8 defence points -> 40% mitigation
    attack: 280,                        // 280% -> 28 contact damage
    attackSpeed: 154,                   // 154% -> one swing every 0.65 s
    attackDistance: 0,
    moveSpeed: 820,                     // 41 scaled px/s: he never catches you
  },
  radius: 32,
  bounty: 50,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'summon',
      chance: 1,
      cooldown: 10,
      range: 620,
      // "Caminantes de la niebla": the pack is his pressure at any distance.
      run(run, enemy, ctx) {
        for (let index = 0; index < 3; index++) {
          const angle = index / 3 * Math.PI * 2;
          ctx.spawnEnemy('mistWalker', enemy.x + Math.cos(angle) * 80, enemy.y + Math.sin(angle) * 80);
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 96, text: 'CAMINANTES', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'wall',
      chance: 2,
      cooldown: 14,
      range: 620,
      // "Muro de tierra": a ring of raised ground round the player. Only the
      // player is held by it, so it is a trap, not a shelter.
      run(run, enemy, ctx) {
        ctx.prison({ x: run.player.x, y: run.player.y, radius: 120, ttl: 4 });
        run.effects.push({ x: run.player.x, y: run.player.y - 90, text: 'MURO DE TIERRA', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'maiden',
      chance: 1,
      cooldown: 999,
      range: 900,
      // She only comes back once, and only when he is losing.
      when: (run, enemy) => !enemy.maidenSummoned && enemy.hp <= enemy.maxHp * 0.5,
      run(run, enemy, ctx) {
        enemy.maidenSummoned = true;
        ctx.spawnEnemy('maiden', enemy.x + 70, enemy.y - 40);
        run.effects.push({ x: enemy.x, y: enemy.y - 110, text: 'LA DONCELLA', ttl: 1.2, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawYorick(ctx, x, y + 70, { scale: 2, ...options });
  },
};

export default yorick;
