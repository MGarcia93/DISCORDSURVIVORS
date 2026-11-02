import { drawPapafrita } from '../sprites.mjs';

export { drawPapafrita };
export default {
  id: 'papafrita',
  label: 'Papafrita',
  draw(ctx, x, y, context) {
    drawPapafrita(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2,
    });
  },
};
