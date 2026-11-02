import { drawPukeiPukei } from '../sprites.mjs';

// Act 6 — Monster Hunter, wave 5 mini-boss. Pukei-Pukei: the poison bird wyvern
// of the venomous stretch. Its three attacks are its own: the tongue that
// reaches past the beak, the spit that bursts into a toxic ring, and the flush
// it lets out when it is cornered. It is a mini-boss, so `boss: true`.
const pukeiPukei = {
  id: 'pukeiPukei',
  boss: true,
  stats: {
    life: 1700,
    defense: 45,                        // 45% -> 4.5 points -> 22.5% mitigation
    attack: 480,                        // 48 damage
    attackSpeed: 100,                   // 100% -> one hit every 1 s
    attackDistance: 0,
    moveSpeed: 1000,                    // 50 scaled px/s
  },
  radius: 25,
  bounty: 25,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'tongue',
      chance: 2,
      cooldown: 5,
      range: 210,
      // The tongue reaches further than the body: a melee action with its own
      // reach and its own number.
      kind: 'melee',
      damage: 26,
      run(run, enemy) {
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 16, text: 'LENGUAZO', ttl: 0.7, kind: 'summon' });
      },
    },
    {
      key: 'venom',
      chance: 2,
      cooldown: 6,
      range: 560,
      // It spits a glob of venom that travels: the poison reaches across the
      // clearing instead of only where the bird happens to stand.
      run(run, enemy, ctx) {
        ctx.enemyShot({
          x: enemy.x, y: enemy.y - enemy.radius * 1.1,
          device: 'venom', damage: 20, speed: 290,
        });
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 20, text: 'VENENO', ttl: 0.9, kind: 'summon' });
      },
    },
    {
      key: 'flush',
      chance: 1,
      cooldown: 999,
      range: 1100,
      // Cornered, it empties the sac: faster cadence and one wide toxic wave.
      when: (run, enemy) => !enemy.flushed && enemy.hp <= enemy.maxHp * 0.5,
      run(run, enemy, ctx) {
        enemy.flushed = true;
        enemy.attackInterval *= 0.8;
        ctx.shockwave({ x: enemy.x, y: enemy.y, damage: 24, speed: 300, maxRadius: 460 });
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 22, text: 'VACÍA EL SACO', ttl: 1.1, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawPukeiPukei(ctx, x, y + 62, { scale: 2, ...options });
  },
};

export default pukeiPukei;
