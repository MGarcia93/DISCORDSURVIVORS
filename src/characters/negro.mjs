import { WORLD_SCALE } from '../constants.mjs';

const negro = {
  id: 'negro',
  name: 'EL NEGRO',
  stats: {
    hp: 150, maxHp: 150, defense: 0.2, damage: 30,
    hitRadius: 17 * WORLD_SCALE, attackRange: Infinity,
    shotInterval: 0.45, speed: 165 * WORLD_SCALE,
  },
  attack: { type: 'ranged', device: 'remote' },
  decays: [],
  passives: [],
  specials: [
    {
      key: 'anime', name: 'Modo Otaku', duration: 8, cooldown: 18,
      onTick(run, p, dt, ctx) {
        run.animeIn -= dt;
        if (run.animeIn > 0) return;
        ctx.fire(run, { x: p.x + 40 * WORLD_SCALE, y: p.y - 40 * WORLD_SCALE }, p.damage * 1.5, 'magic');
        run.animeIn = 0.3;
      },
    },
    {
      key: 'chair', name: 'La Silla', duration: 6, cooldown: 22,
      speedFactor: 0.12, contactFactor: 0.2,
      onTick(run, p, dt, ctx) {
        run.chairIn -= dt;
        if (run.chairIn > 0) return;
        for (const enemy of run.enemies) if (ctx.distance(enemy, p) < 145 * WORLD_SCALE) ctx.hit(run, enemy, p.damage * 0.8);
        run.chairIn = 0.5;
      },
    },
  ],
};

export default negro;
