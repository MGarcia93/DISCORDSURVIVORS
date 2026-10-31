import { drawAlarmZombie } from '../sprites.mjs';

// Act 1 — Project Zomboid, wave 6. The Alarm Zombie: a swollen infected that
// drags a screaming security alarm and pulls new hordes in with it.
//
// Its abilities live here, in its own ficha: the engine only owns the selector
// that rolls between them by weight and pays their cooldowns. The script asks
// for two things: it summons zombies, and the longer the fight runs the more it
// drags in; and it rings sound waves that force the player to keep moving.
const alarmZombie = {
  id: 'alarmZombie',
  // Marks the kind as a world boss: only bosses get the simplified crowd
  // control, the boss health bar and the run-ending kill.
  boss: true,
  // The first boss is the softest one in the campaign, and that is a rule, not
  // a coincidence: it was the hardest hitter in the game (46 dps, more than the
  // Administrator's 34) while every later boss was slower. A first boss teaches
  // the fight; it does not out-damage the ending.
  stats: {
    life: 1500,       // 1500 points of damage
    defense: 0,
    attack: 200,      // 200% -> 20 contact damage
    attackSpeed: 120, // 120% -> one swing every 0.83 s
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
      cooldown: 10,
      range: 520,
      // "Cuanto más dura el combate, más zombis aparecen": the count grows with
      // the run, not with the wave.
      //
      // They walk in from the edge, like every other spawn, instead of appearing
      // around the alarm: the player gets the walk-in to thin the horde, and
      // every kill pays its XP and coins. A ring of bodies around the boss was a
      // wall, not a fight.
      run(run, enemy, ctx) {
        const count = 2 + Math.floor(run.elapsed / 25);
        for (let index = 0; index < count; index++) ctx.spawnAtEdge('zombie');
        run.effects.push({ x: enemy.x, y: enemy.y - 90, text: 'HORDA', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'wave',
      chance: 2,
      cooldown: 8,
      range: 330,
      // A ring that grows out of the alarm: get out of its way or take it. Melee
      // cannot outrun it from inside, so the first boss charges less for it.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 14 });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawAlarmZombie(ctx, x, y + 66, { scale: 3, ...options });
  },
};

export default alarmZombie;
