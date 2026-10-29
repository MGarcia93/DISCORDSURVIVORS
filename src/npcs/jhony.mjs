import { pixel } from '../sprites.mjs';

// Approved stage sprite. NPCs stay separate from playable fichas and unlocks.
export function drawJhony(ctx, x, y, { scale = 2, facing = 1, moving = false, time = 0 } = {}) {
  const step = moving ? Math.floor(time * 8) % 2 : 0;
  const ink = '#171526';
  const hair = '#181c26';
  const skin = '#bd8764';
  const light = '#d9a47b';
  const shade = '#915c49';
  const p = (x, y, w, h, color) => pixel(ctx, x, y, w, h, color);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale * facing, scale);
  p(-15, 0, 30, 2, '#11141c');
  ctx.translate(0, -46 + step);

  // Dark torn jeans and black boots; no brown survival-gear overlay.
  p(-9, 33, 19, 11, ink);
  p(-8, 34, 7, 9 - step, '#303c52');
  p(2, 34, 7, 9 + step, '#263145');
  p(-7, 35, 2, 7 - step, '#435169');
  p(3, 36, 2, 6 + step, '#35435b');
  p(-1, 36, 3, 9, ink);
  p(-7, 38, 4, 1, '#788398');
  p(-6, 39, 3, 1, skin);
  p(3, 39, 3, 1, '#a63840');
  p(4, 40, 2, 2, '#6d2531');
  p(3, 38, 2, 1, '#748095');
  p(6, 41, 2, 1, '#748095');
  p(-10, 43 - step, 10, 3, ink);
  p(1, 43 + step, 10, 3, ink);
  p(-9, 43 - step, 7, 1, '#3d414b');
  p(2, 43 + step, 7, 1, '#323742');
  p(-8, 42 - step, 6, 1, '#30343e');
  p(3, 42 + step, 5, 1, '#30343e');
  p(-7, 43 - step, 1, 1, '#838593');
  p(4, 43 + step, 1, 1, '#838593');

  // Hair falls behind the shoulders, separate from the open shirt.
  p(-12, 8, 24, 20, ink);
  p(-12, 12, 3, 12, hair);
  p(10, 11, 3, 14, hair);
  p(-14, 20, 4, 5, hair);
  p(11, 21, 4, 5, hair);
  p(-11, 14, 1, 8, '#343747');
  p(11, 15, 1, 7, '#292e3c');

  // Black leather jacket: broad lapels, cool specular edges and silver zip.
  p(-12, 21, 25, 14, ink);
  p(-10, 22, 21, 12, '#161920');
  p(-6, 23, 13, 11, '#c8c9c4');
  p(-4, 24, 9, 8, '#ede9dd');
  p(-4, 29, 8, 1, '#b6b9b7');
  p(-5, 32, 11, 1, '#9ba2a5');
  p(-11, 23, 5, 11, '#222630');
  p(7, 23, 5, 11, '#14171e');
  p(-11, 24, 1, 7, '#4c5362');
  p(10, 26, 1, 7, '#3e4654');
  p(-7, 21, 4, 5, '#862e3d');
  p(-6, 22, 2, 3, '#bd4950');
  p(4, 21, 4, 5, '#762735');
  p(5, 22, 2, 2, '#a83b45');
  p(-8, 26, 1, 6, '#983744');
  p(-10, 23, 4, 2, '#434a58');
  p(-9, 25, 4, 2, '#343b47');
  p(-7, 27, 2, 2, '#434a58');
  p(7, 23, 4, 2, '#353d49');
  p(6, 25, 3, 2, '#282e39');
  p(-6, 29, 1, 5, '#8c929d');
  p(-9, 24, 1, 1, '#b3b6be');
  p(8, 24, 1, 1, '#a0a5af');
  // Distinct diagonal tears with bright raw edges and dark red splashes.
  p(0, 28, 3, 1, '#61605a');
  p(1, 29, 3, 1, skin);
  p(3, 30, 2, 1, '#61605a');
  p(-3, 26, 2, 2, '#a72f3c');
  p(-2, 28, 2, 2, '#802330');
  p(-4, 27, 1, 1, '#c34b50');
  p(4, 31, 2, 2, '#992b38');
  p(3, 32, 2, 1, '#b43a43');
  p(8, 28, 2, 1, '#878c96');
  p(7, 29, 2, 1, '#c8c9c4');
  p(8, 30, 2, 1, '#878c96');
  p(-11, 30, 2, 2, '#8f2634');
  p(-10, 32, 1, 1, '#c1494e');
  p(-7, 34, 15, 1, '#151924');
  p(0, 34, 2, 1, '#8d877b');

  // Full black leather sleeves, one ripped open; hands remain visible.
  p(-15, 22, 5, 8, ink);
  p(11, 22, 5, 8, ink);
  p(-14, 23, 3, 7, '#252b35');
  p(12, 23, 3, 7, '#1b2029');
  p(-14, 23, 1, 6, '#515968');
  p(13, 23, 2, 1, '#434b59');
  p(-15, 30, 5, 8, ink);
  p(11, 30, 5, 8, ink);
  p(-14, 30, 3, 5, '#252b35');
  p(12, 30, 3, 5, '#1b2029');
  p(-14, 31, 1, 3, '#48505e');
  p(14, 31, 1, 3, '#363e4c');
  p(-14, 35, 3, 2, skin);
  p(12, 35, 3, 2, skin);
  p(-14, 35, 1, 2, light);
  p(-14, 28, 2, 1, '#8a8e97');
  p(-14, 29, 3, 2, skin);
  p(-13, 31, 2, 1, '#8a8e97');
  p(12, 26, 2, 2, '#972a38');
  p(13, 28, 2, 2, '#73202e');
  p(12, 26, 1, 1, '#c0444d');
  p(13, 35, 2, 1, '#a3333d');

  // Swept-back long hair, higher forehead and an elongated face.
  p(-9, 0, 17, 2, ink);
  p(-11, 2, 22, 6, ink);
  p(-10, 3, 21, 7, hair);
  p(-8, 2, 15, 2, '#303542');
  p(-6, 1, 10, 1, '#414855');
  p(-8, 4, 6, 1, '#414855');
  p(0, 3, 7, 1, '#393f4e');
  p(-7, 6, 15, 14, skin);
  p(-5, 5, 11, 4, light);
  p(-6, 9, 12, 7, light);
  p(6, 8, 2, 10, shade);
  p(-9, 11, 2, 6, shade);
  p(9, 11, 2, 6, shade);
  p(-8, 7, 2, 5, hair);
  p(8, 6, 2, 7, hair);

  // Clear rectangular glasses: visible warm skin and eyes, not sunglasses.
  p(-8, 10, 7, 5, ink);
  p(1, 10, 7, 5, ink);
  p(-7, 11, 5, 3, '#ccad8d');
  p(2, 11, 5, 3, '#c4a486');
  p(-6, 12, 3, 1, '#3c302e');
  p(3, 12, 3, 1, '#3c302e');
  p(-7, 11, 2, 1, '#e1c8ac');
  p(2, 11, 2, 1, '#e1c8ac');
  p(-1, 11, 2, 1, ink);
  p(0, 14, 2, 3, shade);

  // Thin moustache and a longer pointed beard distinguish him from El Negro.
  p(-5, 17, 5, 1, '#43352f');
  p(2, 17, 4, 1, '#43352f');
  p(-4, 18, 9, 1, '#794c40');
  p(-6, 19, 2, 2, '#302b2c');
  p(5, 18, 2, 3, '#302b2c');
  p(-5, 21, 11, 2, '#302b2c');
  p(-3, 23, 7, 2, '#26272d');
  p(-1, 25, 3, 1, ink);
  p(-3, 21, 2, 1, '#55504b');
  p(3, 21, 1, 2, '#46413e');
  ctx.restore();
}

export default {
  id: 'jhony',
  label: 'Jhony',
  draw(ctx, x, y, context) {
    drawJhony(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2,
    });
  },
};
