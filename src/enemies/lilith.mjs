import { drawLilith } from '../sprites.mjs';

// Act 3 — Diablo, wave 6. Lilith, the act's boss: the Mother of Sanctuary, and
// the reason the dungeon was never the point. Her four mechanics are her own and
// none of them is Zir's: claws, a blood tether that drags the player to her, the
// echo she tears out of herself, and her second phase.
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
      key: 'tether',
      chance: 2,
      cooldown: 9,
      range: 640,
      // Blood tether: the chain drags the player to her before the claws land.
      run(run, enemy, ctx) {
        ctx.pull({ x: enemy.x, y: enemy.y, fromX: enemy.x, fromY: enemy.y - 40, ttl: 0.7 });
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'LIGADURA', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'echo',
      chance: 2,
      cooldown: 14,
      range: 1200,
      // "Eco de Lilith": she tears a copy out of herself. One alive at a time,
      // so the fight never turns into a wall of copies.
      when: run => !run.enemies.some(other => other.kind === 'lilithEcho' && other.hp > 0),
      run(run, enemy, ctx) {
        ctx.spawnEnemy('lilithEcho', enemy.x + 80, enemy.y - 20);
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'ECO DE LILITH', ttl: 1.2, kind: 'summon' });
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
