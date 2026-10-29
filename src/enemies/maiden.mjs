import { drawMaiden } from '../sprites.mjs';

// Act 2 — League of Legends, wave 5. La Doncella de la Niebla, Yorick's own
// summon and the act's mini-boss. She floats at the player, calls walkers in and
// wails an area ring, and she is slow: her threat comes from her abilities, not
// from closing the distance.
const maiden = {
  id: 'maiden',
  // A mini-boss carries the boss flags: cast-level art, her own health bar and
  // reduced crowd control, exactly like a world boss.
  boss: true,
  stats: {
    life: 900,
    defense: 60,                        // 60% -> 6 defence points -> 30% mitigation
    attack: 250,                        // 250% -> 25 contact damage
    attackSpeed: 100,                   // 100% -> one swing per second
    attackDistance: 0,
    moveSpeed: 900,                     // 45 scaled px/s: slow on purpose
  },
  radius: 26,
  bounty: 30,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'summon',
      chance: 1,
      cooldown: 9,
      range: 520,
      // "Invoca caminantes": the pack is what turns a slow duel into pressure.
      run(run, enemy, ctx) {
        for (let index = 0; index < 3; index++) {
          const angle = index / 3 * Math.PI * 2;
          ctx.spawnEnemy('mistWalker', enemy.x + Math.cos(angle) * 70, enemy.y + Math.sin(angle) * 70);
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 80, text: 'CAMINANTES', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'wail',
      chance: 2,
      cooldown: 6,
      range: 360,
      // An area attack she can throw without touching the player.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 20, maxRadius: 320 });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawMaiden(ctx, x, y + 46, { scale: 2, ...options });
  },
};

export default maiden;
