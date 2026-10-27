import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawWarrior } from '../sprites.mjs';

// Warrior — El Chamán del Norte. Stat sheet: percentual values over BASE_STATS
// (src/stats.mjs) per his character sheet (context/personajes) and the stat
// table the user defined: life 85, defense 10 pts (standard), attack 8,
// attack speed 0.9/s, attack distance 120, normal mobility.
const warrior = {
  id: 'warrior',
  name: 'WARRIOR',
  gameNote: 'CHAMÁN DEL NORTE · CONTROL DE MASAS · SE CREE ARGENTINO',
  draw(ctx, x, y, context) {
    drawWarrior(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2 });
  },
  stats: {
    hitRadius: 15 * WORLD_SCALE, // lean frame from the photo: not one of the six stats
    ...resolveEntityStats({
      life: 85,              // 85 hp: frágil, sobrevive controlando
      defense: 100,          // defensa estándar: 10 puntos -> 50% de mitigación
      attack: 80,            // 8 de daño directo; los hongos compensan con estados
      attackSpeed: 90,       // 0.9 ataques/s: lanza hongos un poco más lento
      attackDistance: 120,   // 132px: mantiene a los enemigos a distancia
      moveSpeed: 3300,       // movilidad normal del juego (165 scaled px/s)
    }),
  },
  // Mushroom bombs: direct impact plus a small blast area. The ttl already
  // includes his +35% effect duration (4s base -> 5.4s); the radius keeps his
  // +25% area proposal (70px base -> 77 unscaled).
  attack: {
    type: 'ranged', device: 'shroom',
    blast: { radius: 77 * WORLD_SCALE, stacks: 1, ttl: 5.4 },
  },
  decays: [],
  passives: [],   // T3: humo de procedencia dudosa
  specials: [],   // T4: viaje astral + me desaparezco
};

export default warrior;
