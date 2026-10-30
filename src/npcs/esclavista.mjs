import { drawSlaver } from '../sprites.mjs';

// Cinematic actor for the camp's slaver: the voice that guards the Wheel of
// Pain. Same body as the `slaver` ficha, so the guard who speaks and the one
// the wave spawns read as the same crew.
export default {
  id: 'esclavista',
  label: 'Esclavista',
  draw(ctx, x, y, context = {}) {
    drawSlaver(ctx, x, y + 32, { time: context.time, scale: 2 });
  },
};
