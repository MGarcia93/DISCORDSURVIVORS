import { drawLotusAlchemist } from '../sprites.mjs';

// Cinematic actor for El Alquimista del Loto. It is the same body as the
// mini-boss ficha, so the figure on the narrative stage never drifts from the
// one the player fights; the portrait set lives under assets/narrative.
export default {
  id: 'lotus-alchemist',
  label: 'El Alquimista del Loto',
  draw(ctx, x, y, context = {}) {
    drawLotusAlchemist(ctx, x, y + 74, { time: context.time, scale: 2 });
  },
};
