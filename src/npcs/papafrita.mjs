import { drawPapafrita } from '../sprites.mjs';

export { drawPapafrita };
export default {
  id: 'papafrita',
  label: 'Papafrita',
  draw(ctx, x, y, context) {
    // The cameo only appears in Monster Hunter, so the stage wears the insect
    // armour the cinematic portrait already shows.
    drawPapafrita(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2, armor: true,
    });
  },
};
