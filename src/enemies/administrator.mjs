import { drawServerAdministrator } from '../sprites.mjs';

// Act 5 — Discord Corrupto, wave 6. El Administrador del Servidor, the final
// boss: a digital entity made of code, screens and the four worlds it recycled.
// The script gives it three phases and every one of them lives here:
//
//   Moderación automática   `/mute` (specials cut), `/timeout` (pinned in place)
//                           and copies of earlier enemies.
//   No es un bug             dangerous ground plus one `rollback` that restores
//                           part of its own health.
//   Desconexión forzada      it breaks apart, the specials come back, and it
//                           attacks without pause until the last hit.
//
// It is slower than the player, so every mechanic carries a `range` and fires
// while it is still walking: a boss that only swings never touches someone who
// kites it around the void.
const administrator = {
  id: 'administrator',
  boss: true,
  stats: {
    life: 3000,
    defense: 55,                         // 55% -> 5.5 points -> 27.5% mitigation
    attack: 340,                         // 340% -> 34 contact damage
    attackSpeed: 100,                    // one swing every second
    attackDistance: 0,
    moveSpeed: 950,                      // 47.5 scaled px/s: a wall, never a chaser
  },
  radius: 40,
  bounty: 60,
  actions: [
    { key: 'swipe', chance: 2, kind: 'melee' },
    {
      key: 'mute',
      chance: 2,
      cooldown: 16,
      range: 900,
      // "Ejecutando comando: /mute. Las habilidades especiales de los personajes
      // quedan temporalmente bloqueadas." Phase three gives them back.
      when: (run, enemy) => !enemy.breaking,
      run(run, enemy, ctx) {
        ctx.lockSpecials(6);
        run.effects.push({ x: run.player.x, y: run.player.y - 120, text: '/mute', ttl: 1.2, kind: 'summon' });
      },
    },
    {
      key: 'timeout',
      chance: 2,
      cooldown: 11,
      range: 700,
      // "Ejecutando comando: /timeout": whoever stays inside is pinned briefly.
      run(run, enemy, ctx) {
        ctx.prison({ x: run.player.x, y: run.player.y, radius: 92, ttl: 1.6 });
        run.effects.push({ x: run.player.x, y: run.player.y - 96, text: '/timeout', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'copies',
      chance: 2,
      cooldown: 14,
      range: 1200,
      // "Durante esta fase, el Administrador también genera copias de enemigos
      // anteriores": it recycles the catalogue, two at a time.
      run(run, enemy, ctx) {
        const copies = ['zombie', 'meleeMinion', 'skeleton', 'barbarian', 'mistWalker', 'archer', 'slaver', 'alchemist'];
        for (const side of [-1, 1]) {
          const kind = copies[Math.floor(run.random() * copies.length)];
          ctx.spawnEnemy(kind, enemy.x + side * 70, enemy.y - 20);
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 170, text: 'COPIAS', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'hazard',
      chance: 2,
      cooldown: 13,
      range: 1200,
      // "El escenario cambia constantemente y aparecen sectores peligrosos."
      when: (run, enemy) => enemy.hp <= enemy.maxHp * 0.65,
      run(run, enemy, ctx) {
        for (let i = 0; i < 3; i++) {
          const x = run.player.x + (run.random() - 0.5) * 520;
          const y = run.player.y + (run.random() - 0.5) * 380;
          ctx.shockwave({ x, y, damage: 22, speed: 220, maxRadius: 300 });
        }
        run.effects.push({ x: enemy.x, y: enemy.y - 170, text: 'SECTORES PELIGROSOS', ttl: 1.2, kind: 'summon' });
      },
    },
    {
      key: 'rollback',
      chance: 2,
      cooldown: 999,
      range: 1400,
      // "Ejecutando rollback... Parte de la barra de vida del jefe se restaura."
      // Once per run: a cheat the player can see coming is a phase, not a wall.
      when: (run, enemy) => !enemy.rolledBack && enemy.hp <= enemy.maxHp * 0.45,
      run(run, enemy) {
        enemy.rolledBack = true;
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.12);
        run.effects.push({ x: enemy.x, y: enemy.y - 170, text: 'ROLLBACK', ttl: 1.4, kind: 'summon' });
      },
    },
    {
      key: 'breakdown',
      chance: 1,
      cooldown: 999,
      range: 1400,
      // "Cuando la vida del Administrador baja al último tramo, su cuerpo
      // comienza a romperse": it loses armour and gains cadence.
      when: (run, enemy) => !enemy.breaking && enemy.hp <= enemy.maxHp * 0.3,
      run(run, enemy) {
        enemy.breaking = true;
        enemy.speed *= 1.2;
        enemy.attackInterval *= 0.6;
        enemy.defense = Math.max(0, enemy.defense - 0.12);
        run.effects.push({ x: enemy.x, y: enemy.y - 170, text: 'ERROR CRÍTICO', ttl: 1.4, kind: 'summon' });
      },
    },
    {
      key: 'desperation',
      chance: 3,
      cooldown: 4,
      range: 1200,
      // "El Administrador comienza a lanzar ataques desesperadamente": two rings,
      // one from its body and one where the player is standing.
      when: (run, enemy) => enemy.breaking === true,
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 26, speed: 260, maxRadius: 520 });
        ctx.shockwave({ x: run.player.x, y: run.player.y, damage: 20, speed: 200, maxRadius: 260 });
        run.effects.push({ x: enemy.x, y: enemy.y - 190, text: 'DESCONEXIÓN FORZADA', ttl: 1.2, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawServerAdministrator(ctx, x, y + 104, { scale: 2, ...options });
  },
};

export default administrator;
