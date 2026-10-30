import { drawLotusAlchemist } from '../sprites.mjs';

// Act 4 — Conan Exiles, wave 5. El Alquimista del Loto, the act's mini-boss: the
// dealer Warrior found on his first day in the Exiled Lands. Four tricks of his
// own, all from the script: lotus smoke, false visions, poisonous spores and a
// single overdose. The visions are copies of his own alchemists, so the arena
// fills with bodies that are not him.
//
// He is slower than the player, so every trick carries a range and fires while
// he is still walking: an alchemist that only swings never touches a kiter.
const lotusAlchemist = {
  id: 'lotusAlchemist',
  // A mini-boss carries the boss flags: cast-level art, his own health bar and
  // reduced crowd control, exactly like a world boss.
  boss: true,
  stats: {
    life: 1050,
    defense: 40,                         // 40% -> 4 points -> 20% mitigation
    attack: 200,                         // 200% -> 20 contact damage
    attackSpeed: 110,                    // 110% -> one swing every 0.91 s
    attackDistance: 0,
    moveSpeed: 940,                      // 47 scaled px/s: slower than the player
  },
  radius: 28,
  bounty: 40,
  actions: [
    { key: 'swipe', chance: 2, kind: 'melee' },
    {
      key: 'lotus',
      chance: 2,
      cooldown: 9,
      range: 640,
      // "Nubes de loto": a cloud that rolls out of him, slow and wide, so the
      // arena loses its edges instead of its floor.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 12, speed: 150, maxRadius: 380 });
        run.effects.push({ x: enemy.x, y: enemy.y - 130, text: 'NUBE DE LOTO', ttl: 1.1, kind: 'summon' });
      },
    },
    {
      key: 'visions',
      chance: 2,
      cooldown: 11,
      range: 760,
      // "Visiones falsas": copies of his own alchemists walk out of the smoke.
      // They are real bodies, because a copy that cannot hit you is scenery.
      run(run, enemy, ctx) {
        for (let index = 0; index < 2; index++) {
          const angle = index / 2 * Math.PI * 2;
          ctx.spawnEnemy('alchemist', enemy.x + Math.cos(angle) * 80, enemy.y + Math.sin(angle) * 80);
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 130, text: 'VISIONES', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'spores',
      chance: 2,
      cooldown: 7,
      range: 360,
      // "Esporas venenosas": the pods at his feet burst into a ring.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 20, speed: 400, maxRadius: 320 });
        run.effects.push({ x: enemy.x, y: enemy.y - 120, text: 'ESPORAS', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'overdose',
      chance: 1,
      cooldown: 999,
      range: 1400,
      // "Sobredosis alquímica": once, when he is half beaten, he drinks and his
      // hands speed up. The boss's rage trades defence for speed instead, so no
      // two bosses of the act share a phase.
      when: (run, enemy) => !enemy.overdosed && enemy.hp <= enemy.maxHp * 0.5,
      run(run, enemy) {
        enemy.overdosed = true;
        enemy.attackInterval *= 0.55;
        run.effects.push({ x: enemy.x, y: enemy.y - 140, text: 'SOBREDOSIS', ttl: 1.2, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawLotusAlchemist(ctx, x, y + 74, { scale: 2, ...options });
  },
};

export default lotusAlchemist;
