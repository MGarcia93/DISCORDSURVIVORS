import { drawLilith } from '../sprites.mjs';

// Act 3 — Diablo, wave 6. Lilith, the act's boss: the Mother of Sanctuary, and
// the reason the dungeon was never the point. Her three attacks are her own:
// claws, the blood nova that bursts out of her, and the dive across the room.
// Her second phase is the fourth beat.
//
// Nothing here is inherited from the boss the script used to have: the hook that
// dragged the player belonged to the Carnicero, and it is gone with him.
//
// She is slower than the player on purpose, so the tether, the dive and the
// enrage all fire while she is still walking: a boss that only claws never
// touches a player who kites.
const lilith = {
  id: 'lilith',
  boss: true,
  stats: {
    life: 2200,
    defense: 40,                         // 40% -> 4 points -> 20% mitigation
    attack: 340,                         // 340% -> 34 contact damage
    attackSpeed: 130,                    // 130% -> one swing every 0.77 s
    attackDistance: 0,
    moveSpeed: 1150,                     // 57.5 scaled px/s: she glides
  },
  radius: 34,
  bounty: 50,
  actions: [
    { key: 'swipe', chance: 2, kind: 'melee' },
    {
      // Her claws land where the swing lands and bite twice as hard. A melee
      // action may declare its own damage, so the ficha owns the number.
      key: 'claw',
      chance: 3,
      kind: 'melee',
      damage: 34,
    },
    {
      key: 'nova',
      chance: 2,
      cooldown: 7,
      range: 520,
      // "Oleada de sangre": blood bursts out of her in a ring. It reaches further
      // than the claws, so the answer is to move, not to trade hits.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 26, speed: 380, maxRadius: 380 });
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'OLEADA DE SANGRE', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'dive',
      chance: 2,
      cooldown: 10,
      range: 1200,
      // She dives across the room: a burst of speed the engine expires on its own.
      run(run, enemy) {
        enemy.chargeBoost = 2.2;
        enemy.chargeTtl = 1.6;
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'SE ABALANZA', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'enrage',
      chance: 1,
      cooldown: 999,
      range: 1400,
      // Her second phase: once, when she is half beaten. Faster, never again.
      when: (run, enemy) => !enemy.enraged && enemy.hp <= enemy.maxHp * 0.5,
      run(run, enemy) {
        enemy.enraged = true;
        enemy.speed *= 1.25;
        enemy.attackInterval *= 0.65;
        run.effects.push({ x: enemy.x, y: enemy.y - 160, text: 'LILITH DESPIERTA', ttl: 1.2, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawLilith(ctx, x, y + 86, { scale: 2, ...options });
  },
};

export default lilith;
