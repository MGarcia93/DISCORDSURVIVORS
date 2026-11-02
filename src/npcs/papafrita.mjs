import { drawPapafrita } from '../sprites.mjs';

export { drawPapafrita };
export default {
  id: 'papafrita',
  label: 'Papafrita',
  draw(ctx, x, y, context) {
    // The cameo only appears in Monster Hunter, so the stage wears the insect
    // armour the cinematic portrait already shows.
    drawPapafrita(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2,
      // The cameo wears the insect armour while he is inside Monster Hunter; a
      // scene that needs him back in Discord asks for the casual outfit.
      armor: context.outfit !== 'casual',
    });
  },
};
