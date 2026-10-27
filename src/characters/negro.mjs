import { WORLD_SCALE } from '../constants.mjs';
import { drawElNegro } from '../sprites.mjs';

const negro = {
  id: 'negro',
  name: 'EL NEGRO',
  gameNote: '4 OLEADAS DE 60 SEGUNDOS · MEJORAS ACUMULABLES · SOLAGO SE DESBLOQUEA AL GANAR',
  regenHud(p) { return { ringY: p.y + 31, radius: 37, textX: p.x - 31, textY: p.y - 77 }; },
  draw(ctx, x, y, context) {
    drawElNegro(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing,
      sitting: context.player.chair > 0, scale: 2 });
  },
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
      key: 'anime', name: 'Modo Otaku', hotkey: 'q', duration: 8, cooldown: 18,
      onTick(run, p, dt, ctx) {
        run.animeIn -= dt;
        if (run.animeIn > 0) return;
        ctx.fire(run, { x: p.x + 40 * WORLD_SCALE, y: p.y - 40 * WORLD_SCALE }, p.damage * 1.5, 'magic');
        run.animeIn = 0.3;
      },
    },
    {
      key: 'chair', name: 'Me da paja', hotkey: 'e', duration: 6, cooldown: 22,
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
