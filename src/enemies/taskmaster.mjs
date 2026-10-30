import { drawTaskmaster } from '../sprites.mjs';

// Act 4 — Conan Exiles, wave 6. El Capataz de la Rueda del Dolor, the act's boss:
// the man the slavers answer to, and the owner of Warrior's chains. The script
// gives him five mechanics and all five live here: the chains that catch the
// player, the whip that sweeps an arc, his slaver guards, the Wheel of Pain
// itself and one final rage.
//
// He is slower than the player on purpose, so every mechanic carries a range and
// fires while he is still walking: a boss that only swings never touches a
// player who kites him around the pen.
const taskmaster = {
  id: 'taskmaster',
  boss: true,
  stats: {
    life: 2400,
    defense: 60,                         // 60% -> 6 points -> 30% mitigation
    attack: 320,                         // 320% -> 32 contact damage
    attackSpeed: 120,                    // 120% -> one swing every 0.83 s
    attackDistance: 0,
    moveSpeed: 1100,                     // 55 scaled px/s: heavy, never a chaser
  },
  radius: 34,
  bounty: 50,
  actions: [
    { key: 'swipe', chance: 2, kind: 'melee' },
    {
      key: 'chains',
      chance: 2,
      cooldown: 8,
      range: 520,
      // "Cadenas: atrapa a los jugadores y los arrastra hacia él": the chain drops
      // over the player and pins them long enough for him to close in.
      run(run, enemy, ctx) {
        ctx.prison({ x: run.player.x, y: run.player.y, radius: 96, ttl: 1.8 });
        run.effects.push({ x: run.player.x, y: run.player.y - 96, text: 'CADENAS', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'whip',
      chance: 3,
      cooldown: 5,
      range: 340,
      // "Látigo: ataque en arco que cubre una gran zona." The ring is the arc.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 26, maxRadius: 340 });
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'LÁTIGO', ttl: 0.8, kind: 'summon' });
      },
    },
    {
      key: 'guards',
      chance: 2,
      cooldown: 12,
      range: 720,
      // "Guardianes esclavistas: convoca arqueros y guerreros." One of each, so
      // the wave answers with a net and a bow behind it.
      run(run, enemy, ctx) {
        ctx.spawnEnemy('archer', enemy.x + 80, enemy.y - 40);
        ctx.spawnEnemy('slaver', enemy.x - 80, enemy.y - 40);
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'GUARDIANES', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'wheel',
      chance: 2,
      cooldown: 14,
      range: 900,
      // "Rueda del Dolor: una enorme rueda giratoria que se convierte en un
      // peligro del escenario." It rolls across the pen: huge, slow, unavoidable
      // only if you stand still.
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 30, speed: 150, maxRadius: 700 });
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'RUEDA DEL DOLOR', ttl: 1.2, kind: 'summon' });
      },
    },
    {
      key: 'rage',
      chance: 1,
      cooldown: 999,
      range: 1400,
      // "Furia del capataz: rompe parte de su armadura y aumenta su velocidad."
      // He trades armour for speed, which is the opposite of the alchemist's
      // overdose: no two bosses of the act share a phase.
      when: (run, enemy) => !enemy.enraged && enemy.hp <= enemy.maxHp * 0.5,
      run(run, enemy) {
        enemy.enraged = true;
        enemy.speed *= 1.3;
        enemy.attackInterval *= 0.75;
        enemy.defense = Math.max(0, enemy.defense - 0.15);
        run.effects.push({ x: enemy.x, y: enemy.y - 160, text: 'FURIA DEL CAPATAZ', ttl: 1.2, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawTaskmaster(ctx, x, y + 86, { scale: 2, ...options });
  },
};

export default taskmaster;
