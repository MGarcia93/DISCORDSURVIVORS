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
  // One mirror for every ficha: an enemy walking left is the same body flipped
  // about its own x, so no sheet needs its own facing code.
  const facing = figure.facing ?? 1;
  ctx.save();
  if (facing < 0) { ctx.translate(figure.x * 2, 0); ctx.scale(-1, 1); }
  getEnemyKind(figure.kind).draw(ctx, figure.x, figure.y, { time, seed: figure.id, variant: figure.variant });
  ctx.restore();
}
