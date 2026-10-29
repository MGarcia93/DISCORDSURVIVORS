import { drawYorick } from '../sprites.mjs';

// Cinematic actor for Yorick. It is the same body as the boss ficha but it can
// kneel, which is the pose the Act 2 defeat needs: he falls to his knees to ask
// why his "little walker" left him. Combat never uses this module.
export default {
  id: 'yorick',
  label: 'Yorick',
  draw(ctx, x, y, context = {}) {
    drawYorick(ctx, x, y + 70, {
      time: context.time,
      scale: 2,
      kneeling: context.kneeling === true,
    });
  },
};
