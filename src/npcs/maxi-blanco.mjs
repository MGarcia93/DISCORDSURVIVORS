import { pixel } from '../sprites.mjs';

// Creator cameo: the outfit photograph supplies the clothes, not the glasses.
export function drawMaxiBlanco(ctx, x, y, { scale = 2, facing = 1, moving = false, time = 0 } = {}) {
  const step = moving ? Math.floor(time * 8) % 2 : 0;
  const ink = '#171526', skin = '#d6ae94', light = '#edc6a8', shade = '#b48d79';
  const p = (x, y, w, h, color) => pixel(ctx, x, y, w, h, color);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale * facing, scale);
  p(-15, 0, 30, 2, '#11141c');
  ctx.translate(0, -46 + step);

  // Loose straight gray joggers, folded cuffs and soft rounded slippers.
  p(-10, 32, 21, 12, ink);
  p(-9, 33, 8, 10 - step, '#aaaab0');
  p(2, 33, 8, 10 + step, '#91929b');
  p(-8, 34, 2, 7 - step, '#c3c1c4');
  p(7, 35, 2, 7 + step, '#767984');
  p(-1, 35, 3, 9, ink);
  p(-9, 41 - step, 8, 2, '#b6b4ba');
  p(2, 41 + step, 8, 2, '#a4a3ac');
  p(-12, 44 - step, 12, 2, ink);
  p(1, 44 + step, 12, 2, ink);
  p(-11, 43 - step, 10, 2, '#292a33');
  p(2, 43 + step, 10, 2, '#292a33');
  p(-10, 43 - step, 7, 1, '#4b4b55');
  p(3, 43 + step, 7, 1, '#41434c');

  // Navy hoodie body; gray raglan sleeves, ribbed hem and kangaroo pocket.
  p(-10, 20, 21, 3, ink);
  p(-12, 23, 25, 11, ink);
  p(-10, 33, 21, 2, ink);
  p(-10, 22, 21, 11, '#303d60');
  p(-9, 24, 2, 7, '#405075');
  p(8, 24, 2, 8, '#222c49');
  p(-10, 33, 21, 1, '#7f8492');
  p(-6, 29, 13, 3, '#273452');
  p(-5, 29, 11, 1, '#435171');
  p(-6, 30, 1, 2, '#718097');
  p(6, 30, 1, 2, '#718097');
  for (const side of [-1, 1]) {
    const arm = side < 0 ? -15 : 11;
    p(arm, 22, 5, 14, ink);
    p(arm + 1, 23, 3, 11, '#aaaab0');
    p(arm + 1, 24, 1, 8, '#c3c1c4');
    p(arm + 1, 33, 3, 2, '#858994');
    p(arm + 1, 35, 3, 2, skin);
    p(arm + 1, 35, 1, 2, light);
  }
  // Cream chest lettering is suggested at native resolution, not a new slogan.
  p(-6, 25, 3, 1, '#e1dac0');
  p(-4, 26, 7, 1, '#e1dac0');
  p(2, 25, 4, 1, '#e1dac0');
  p(-3, 27, 7, 1, '#c9c5b5');

  // Raised gray hood frames the exposed face without hiding its silhouette.
  p(-9, -1, 18, 1, ink);
  p(-12, 0, 24, 4, ink);
  p(-14, 4, 28, 14, ink);
  p(-10, 19, 20, 3, ink);
  p(-11, 1, 22, 3, '#aaaab0');
  p(-13, 4, 3, 14, '#aaaab0');
  p(10, 4, 3, 14, '#858994');
  p(-10, 18, 4, 3, '#c3c1c4');
  p(6, 18, 4, 3, '#aaaab0');
  p(-7, 21, 5, 2, '#aaaab0');
  p(3, 21, 5, 2, '#858994');
  p(-4, 23, 1, 2, '#d0ccd0');
  p(4, 23, 1, 2, '#d0ccd0');

  // Longer oval face: exposed forehead, tapered jaw and close-cropped temples.
  p(-8, 2, 16, 2, '#25262c');
  p(-9, 4, 18, 11, skin);
  p(-8, 15, 16, 3, skin);
  p(-6, 18, 12, 2, skin);
  p(-4, 20, 8, 1, shade);
  p(-7, 4, 13, 10, light);
  p(-5, 3, 10, 2, light);
  p(-9, 4, 2, 5, '#302c2e');
  p(7, 4, 2, 5, '#302c2e');
  p(-7, 2, 5, 1, '#454149');
  p(-3, 3, 2, 1, '#25262c');
  p(-10, 10, 2, 4, skin);
  p(8, 10, 2, 4, shade);
  p(7, 7, 1, 9, '#d0a98c');
  // Slightly arched brows and open eyes, with no glasses or scowling bar.
  p(-7, 9, 5, 1, '#43342f');
  p(-8, 10, 1, 1, '#624b3e');
  p(2, 9, 5, 1, '#43342f');
  p(7, 10, 1, 1, '#624b3e');
  p(-7, 11, 6, 2, '#e9d5bd');
  p(2, 11, 6, 2, '#e9d5bd');
  p(-4, 11, 2, 2, '#49352d');
  p(4, 11, 2, 2, '#49352d');
  p(-4, 11, 1, 1, '#201f26');
  p(4, 11, 1, 1, '#201f26');
  // Longer nose, fuller lips and sparse cheeks instead of a square full beard.
  p(0, 11, 1, 4, '#d6b093');
  p(-1, 14, 4, 1, '#d6b093');
  p(0, 15, 3, 1, shade);
  p(-7, 16, 1, 2, '#80604e');
  p(7, 16, 1, 2, '#80604e');
  p(-4, 16, 3, 1, '#684b3d');
  p(1, 16, 4, 1, '#684b3d');
  p(-4, 17, 9, 1, '#a56e5b');
  p(-3, 18, 7, 1, '#c58d75');
  p(-6, 18, 1, 1, '#695044');
  p(5, 18, 1, 1, '#695044');
  p(-6, 19, 3, 1, '#514039');
  p(3, 19, 3, 1, '#514039');
  p(-5, 20, 10, 1, '#393031');
  p(-4, 21, 8, 1, '#28272d');
  p(-1, 19, 2, 1, '#514039');
  ctx.restore();
}

export default {
  id: 'maxi-blanco',
  label: 'Maxi Blanco',
  draw(ctx, x, y, context = {}) {
    drawMaxiBlanco(ctx, x, y, context);
  },
};
