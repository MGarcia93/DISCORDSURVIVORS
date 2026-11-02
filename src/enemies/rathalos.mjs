import { drawRathalos } from '../sprites.mjs';

// Act 6 — Monster Hunter, wave 6. Rathalos: the wyvern the whole epilogue walks
// toward. The script gives it three phases — the hunt, the roar that cuts
// Papafrita's explanations, and the last monologue where the voice waves grow —
// so its actions are its own and it gains them in order.
//
// It is slower than the player on purpose: the fire, the roar and the dive all
// fire while it is still walking, so kiting never makes the boss harmless.
const rathalos = {
  id: 'rathalos',
  boss: true,
  stats: {
    life: 4400,
    defense: 70,                        // 70% -> 7 points -> 35% mitigation
    attack: 1040,                        // 104 damage
    attackSpeed: 120,                   // 120% -> one hit every 0.83 s
    attackDistance: 0,
    moveSpeed: 1020,                    // 51 scaled px/s
  },
  radius: 40,
  bounty: 120,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'flames',
      chance: 3,
      cooldown: 5,
      range: 900,
      // The breath at distance: a fireball leaves the mouth and travels at the
      // player. Kiting the wyvern is not a free win, which is the whole reason
      // the sheet keeps it slower than the player.
      run(run, enemy, ctx) {
        ctx.enemyShot({
          x: enemy.x, y: enemy.y - enemy.radius * 1.1,
          device: 'fireball', damage: 34, speed: 230,
        });
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 24, text: 'ESCUPE FUEGO', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'roar',
      chance: 2,
      cooldown: 12,
      range: 1100,
      // Phase two: the roar. It is the same shape as Papafrita's voice, which is
      // the joke of the wave, and it pushes everyone away from the head.
      when: (run, enemy) => enemy.hp <= enemy.maxHp * 0.66,
      run(run, enemy, ctx) {
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 22, speed: 380, maxRadius: 560 });
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 26, text: 'RUGIDO', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'dive',
      chance: 2,
      cooldown: 11,
      range: 1300,
      // It takes off and comes down on the group: a burst of speed the engine
      // expires on its own.
      run(run, enemy) {
        enemy.chargeBoost = 2.5;
        enemy.chargeTtl = 1.6;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 24, text: 'VUELA', ttl: 0.8, kind: 'summon' });
      },
    },
    {
      key: 'enrage',
      chance: 3,
      cooldown: 999,
      range: 1400,
      when: (run, enemy) => !enemy.enraged && enemy.hp <= enemy.maxHp * 0.66,
      run(run, enemy) {
        enemy.enraged = true;
        enemy.speed *= 1.15;
        enemy.attackInterval *= 0.85;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 26, text: 'SE ENOJA', ttl: 1.2, kind: 'summon' });
      },
    },
    {
      key: 'inferno',
      chance: 3,
      cooldown: 999,
      range: 1400,
      // Phase three: the last monologue. Faster, and one last wide burn.
      when: (run, enemy) => !enemy.inferno && enemy.hp <= enemy.maxHp * 0.33,
      run(run, enemy, ctx) {
        enemy.inferno = true;
        enemy.attackInterval *= 0.75;
        enemy.speed *= 1.1;
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 34, speed: 320, maxRadius: 620 });
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 26, text: 'FUEGO FINAL', ttl: 1.3, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawRathalos(ctx, x, y + 128, { scale: 2, ...options });
  },
};

export default rathalos;
