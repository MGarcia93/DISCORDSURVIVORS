import { drawAlarmZombie } from '../sprites.mjs';

// Act 1 — Project Zomboid, wave 6. The Alarm Zombie: a swollen infected that
// drags a screaming security alarm and pulls new hordes in with it.
//
// Its abilities live here, in its own ficha: the engine only owns the selector
// that rolls between them by weight and pays their cooldowns. The script asks
// for two things: it summons zombies, and the longer the fight runs the more it
// drags in; and it rings sound waves that force the player to keep moving.
const boss = {
  id: 'boss',
  stats: {
    life: 2200,       // 2200 points of damage
    defense: 0,
    attack: 300,      // 300% -> 30 contact damage
    attackSpeed: 154, // 154% -> one swing every 0.65 s
    attackDistance: 0,
    moveSpeed: 1040,  // 52 scaled px/s
  },
  radius: 38,
  bounty: 30,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'summon',
      chance: 1,
      cooldown: 9,
      // "Cuanto más dura el combate, más zombis aparecen": the count grows with
      // the run, not with the wave.
      run(run, enemy, ctx) {
        const count = 2 + Math.floor(run.elapsed / 25);
        for (let index = 0; index < count; index++) {
          const angle = index / count * Math.PI * 2;
          ctx.spawnEnemy('zombie', enemy.x + Math.cos(angle) * 80, enemy.y + Math.sin(angle) * 80);
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 90, text: 'HORDA', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'wave',
      chance: 2,
      cooldown: 6,
      // A ring that grows out of the alarm: get out of its way or take it.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 18 });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawAlarmZombie(ctx, x, y + 66, { scale: 3, ...options });
  },
};

export default boss;
