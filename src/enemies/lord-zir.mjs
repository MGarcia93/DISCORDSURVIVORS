import { drawLordZir } from '../sprites.mjs';

// Act 3 — Diablo, wave 5. Lord Zir, the act's mini-boss: the vampire lord of the
// dungeon. Two tricks of his own, and neither is borrowed: he calls his court of
// bats out of the dark and sweeps the arena with his wings. The act's boss has
// her own kit, so this ficha never drags the player.
//
// He is slower than the player, so both tricks have a range and fire while he is
// still walking: a lord that only claws never touches a player who kites.
const lordZir = {
  id: 'lordZir',
  // A mini-boss carries the boss flags: cast-level art, his own health bar and
  // reduced crowd control, exactly like a world boss.
  boss: true,
  stats: {
    life: 1100,
    defense: 45,                         // 45% -> 4.5 points -> 22.5% mitigation
    attack: 210,                         // 210% -> 21 contact damage
    attackSpeed: 115,                    // 115% -> one swing every 0.87 s
    attackDistance: 0,
    moveSpeed: 1350,                     // 67.5 scaled px/s: slower than the player
  },
  radius: 30,
  bounty: 40,
  actions: [
    { key: 'swipe', chance: 2, kind: 'melee' },
    {
      key: 'rise',
      chance: 2,
      cooldown: 9,
      range: 900,
      // His court: a swarm of bats, four at a time. A vampire lord calls his own
      // animals; raising the dead is the necromancer's trade, not his.
      run(run, enemy, ctx) {
        for (let index = 0; index < 4; index++) {
          const angle = index / 4 * Math.PI * 2;
          ctx.spawnEnemy('batSwarm', enemy.x + Math.cos(angle) * 70, enemy.y + Math.sin(angle) * 70);
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 120, text: 'MURCIÉLAGOS', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'wings',
      chance: 2,
      cooldown: 6,
      range: 420,
      // "Un golpe de alas": a ring of cold air pushed out from the body.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 22, maxRadius: 360 });
        run.effects.push({ x: enemy.x, y: enemy.y - 120, text: 'ALAS', ttl: 0.8, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawLordZir(ctx, x, y + 72, { scale: 2, ...options });
  },
};

export default lordZir;
