import { drawLilith } from '../sprites.mjs';

// Cinematic actor for Lilith. It is the same body as the boss ficha, so the
// figure on the narrative stage never drifts from the one the player fights.
export default {
  id: 'lilith',
  label: 'Lilith',
  draw(ctx, x, y, context = {}) {
    drawLilith(ctx, x, y + 86, { time: context.time, scale: 2 });
  },
};
