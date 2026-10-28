import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawPapazito } from '../sprites.mjs';

// Papazito — El Paraguayo Trucho. Stat sheet: percentual values over
// BASE_STATS (src/stats.mjs) per context/personajes/papazito_el_paraguayo_trucho.md §3
// and the playtesting balance so far: life 110, ranged damage 11.5 (+15%),
// attack speed 90 (0.9 bricks/s, interval ~1.11s), attackDistance 150 (165px,
// charged proposal: the sheet has no reach value), defense 110 (11 points,
// 55% mitigation), moveSpeed 2970 (148.5 scaled px/s, -10%).
const papazito = {
  id: 'papazito',
  name: 'PAPAZITO',
  gameNote: 'EL PARAGUAYO TRUCHO · LADRILLOS, LA SEÑA Y LIQUIDACIÓN DE PERTENENCIAS',
  deathLine: 'VENDIÓ TODO Y NI LA PUSO.',
  draw(ctx, x, y, context) {
    drawPapazito(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2 });
  },
  stats: {
    hitRadius: 18 * WORLD_SCALE, // the bulk frame from the photo: not one of the six stats
    ...resolveEntityStats({
      life: 110,             // +10% vida
      defense: 110,          // 11 points -> 55% mitigation
      attack: 115,           // 11.5 damage per brick (+15% daño a distancia)
      attackSpeed: 90,       // 0.9 bricks/s: the slow heavy cadence of §4.1
      attackDistance: 150,   // 165px reach proposal: ladrillos a media cancha
      moveSpeed: 2970,       // -10% mobility
    }),
  },
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  attack: { type: 'ranged', device: 'brick' },
  decays: [],
  passives: [],
  specials: [],
};

export default papazito;
