import { drawTaskmaster } from '../sprites.mjs';

// Cinematic actor for El Capataz de la Rueda del Dolor. Same body as the boss
// ficha, so the cinematic and the fight use one silhouette.
export default {
  id: 'taskmaster',
  label: 'El Capataz de la Rueda del Dolor',
  draw(ctx, x, y, context = {}) {
    drawTaskmaster(ctx, x, y + 86, { time: context.time, scale: 2 });
  },
};
