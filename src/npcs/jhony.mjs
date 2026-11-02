import { drawJhony } from '../sprites.mjs';

// Approved Act 1 stage sprite, shared with the playable ficha. The NPC passes no
// weapon options, so it keeps drawing the exact approved rectangles; NPCs stay
// separate from playable fichas and unlocks.
export { drawJhony };

export default {
  id: 'jhony',
  label: 'Jhony',
  draw(ctx, x, y, context) {
    drawJhony(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2,
    });
  },
};
