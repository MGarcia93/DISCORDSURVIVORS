import { pixel } from '../sprites.mjs';

// Zomboid arena: the combat floor and the default narrative backdrop.
//
// A world is painted once into a baked canvas (see ./index.mjs), so this file
// can afford per-tile detail: it never runs inside the frame loop. Add a new
// world by copying this shape and registering it in ./index.mjs.
export default {
  id: 'arena',
  title: 'Zomboid arena',
  draw(ctx, { width, height }) {
    pixel(ctx, 0, 0, width, height, '#222d2c');
    for (let y = 0; y < height; y += 20) {
      for (let x = 0; x < width; x += 26) {
        const seed = (x * 17 + y * 13) % 97;
        pixel(ctx, x + 1, y + 1, 24, 18, seed < 45 ? '#293330' : '#26302e');
        if (seed < 25) pixel(ctx, x + 4, y + 13, 8, 1, '#3a4439');
        if (seed > 65) {
          pixel(ctx, x + 16, y + 4, 1, 5, '#1b2526');
          pixel(ctx, x + 17, y + 8, 3, 1, '#1b2526');
        }
      }
    }
    for (let x = 0; x < width; x += 16) {
      pixel(ctx, x, 0, 15, 9, '#4e4b47');
      pixel(ctx, x, height - 8, 15, 8, '#4e4b47');
      pixel(ctx, x + 1, 1, 13, 2, '#696153');
    }
    for (let y = 10; y < height - 10; y += 16) {
      pixel(ctx, 0, y, 6, 15, '#4e4b47');
      pixel(ctx, width - 6, y, 6, 15, '#4e4b47');
    }
    // Decorative debris stays outside the walkable centre; no fake obstacles.
    for (let i = 0; i < 18; i++) {
      const x = 13 + (i * 113) % (width - 26);
      const y = 18 + (i * 77) % (height - 36);
      pixel(ctx, x, y, 2, 4, '#52604a');
      pixel(ctx, x - 2, y + 2, 2, 1, '#52604a');
    }
  },
};
