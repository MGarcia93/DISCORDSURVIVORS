import { drawLordZir } from '../sprites.mjs';

// Cinematic actor for Lord Zir. It is the same body as the boss ficha, so the
// figure on the narrative stage never drifts from the one the player fights.
export default {
  id: 'lord-zir',
  label: 'Lord Zir',
  draw(ctx, x, y, context = {}) {
    drawLordZir(ctx, x, y + 72, { time: context.time, scale: 2 });
  },
};
