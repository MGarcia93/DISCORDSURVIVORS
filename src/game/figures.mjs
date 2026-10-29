import { drawChair, drawPatrona } from '../sprites.mjs';
import { WORLD_SCALE } from '../constants.mjs';
import { getEnemyKind } from '../enemies/index.mjs';

// Player-attached props keep their own drawer. Enemies do not: each ficha owns
// its drawing, exactly like the playable characters.
export const FIGURE_DRAWERS = {
  chair: (ctx, figure) => drawChair(ctx, figure.x, figure.y, { scale: 2 }),
  stand: (ctx, figure, time) => drawPatrona(ctx, figure.x, figure.y + 38 * WORLD_SCALE, { time, scale: 2 }),
};

// One enemy figure, exactly as the arena draws it, so a dev viewer cannot drift
// from the game. `figure.x/figure.y` is the enemy's ground point; the ficha
// places its own sprite from there.
export function drawEnemyFigure(ctx, figure, time) {
  const prop = FIGURE_DRAWERS[figure.kind];
  if (prop) { prop(ctx, figure, time); return; }
  getEnemyKind(figure.kind).draw(ctx, figure.x, figure.y, { time, seed: figure.id });
}
