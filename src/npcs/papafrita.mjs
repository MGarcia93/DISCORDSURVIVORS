import { pixel } from '../sprites.mjs';

// Approved casual NPC sprite. The cinematic portraits use a different costume.
export function drawPapafrita(ctx, x, y, { scale = 2, facing = 1, moving = false, time = 0 } = {}) {
  const step = moving ? Math.floor(time * 8) % 2 : 0;
  const ink = '#171526';
  const skin = '#c58f68';
  const skinLight = '#e0aa7b';
  const skinShade = '#97644e';
  const hair = '#29252c';
  const p = (x, y, w, h, fill) => pixel(ctx, x, y, w, h, fill);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale * facing, scale);
  p(-19, 0, 38, 2, '#11141c');
  ctx.translate(0, -46 + step);

  // Bare calves and black trainers with the white sole from the photographs.
  p(-11, 37, 9, 7 - step, ink);
  p(3, 37, 9, 7 + step, ink);
  p(-10, 38, 7, 5 - step, skin);
  p(4, 38, 7, 5 + step, skin);
  p(-10, 38, 2, 5 - step, skinLight);
  p(9, 39, 2, 4 + step, skinShade);
  p(-14, 43 - step, 13, 3, ink);
  p(2, 43 + step, 13, 3, ink);
  p(-12, 43 - step, 9, 1, '#383844');
  p(4, 43 + step, 8, 1, '#383844');
  p(-13, 45 - step, 11, 1, '#deded6');
  p(3, 45 + step, 11, 1, '#deded6');

  // Light blue denim bermuda shorts, ending above the bare calves.
  p(-14, 31, 28, 8, ink);
  p(-13, 32, 12, 6, '#8095a5');
  p(2, 32, 11, 6, '#708596');
  p(-12, 33, 3, 4, '#a1b2bb');
  p(10, 33, 2, 4, '#5c7285');
  p(-2, 34, 4, 5, ink);
  p(-13, 37, 12, 1, '#a1b2bb');
  p(2, 37, 11, 1, '#91a4b0');
  p(-11, 33, 4, 1, '#5c7285');
  p(6, 33, 4, 1, '#5c7285');

  // Plain black tee over a broad, stepped chest and belly like El Negro's.
  p(-13, 19, 26, 3, ink);
  p(-15, 22, 30, 6, ink);
  p(-17, 28, 34, 6, ink);
  p(-14, 33, 28, 2, ink);
  p(-12, 20, 24, 3, '#1e1e27');
  p(-14, 23, 28, 5, '#20212a');
  p(-16, 28, 32, 5, '#20212a');
  p(-13, 24, 3, 5, '#343440');
  p(-15, 29, 3, 3, '#30313b');
  p(12, 26, 2, 6, '#151720');
  p(-7, 32, 18, 1, '#343440');
  p(-13, 33, 26, 1, '#14151e');
  p(-4, 20, 8, 2, '#14151e');
  // Small muted chest mark, not a new readable slogan or invented brand.
  p(6, 23, 2, 1, '#77767d');
  p(7, 24, 1, 1, '#55565e');

  // Short sleeves, exposed forearms and relaxed hands.
  p(-18, 21, 5, 7, ink);
  p(13, 21, 5, 7, ink);
  p(-17, 22, 3, 5, '#292a34');
  p(14, 22, 3, 5, '#20212a');
  p(-19, 27, 5, 10, ink);
  p(14, 27, 5, 10, ink);
  p(-18, 27, 3, 9, skin);
  p(15, 27, 3, 9, skin);
  p(-18, 28, 1, 7, skinLight);
  p(17, 28, 1, 7, skinShade);

  // Same full cheeks, compact beard and ponytail as the approved identity.
  p(-12, 0, 24, 4, ink);
  p(-13, 3, 26, 14, ink);
  p(-11, 16, 23, 5, ink);
  p(-9, 20, 18, 3, ink);
  p(-13, 0, 24, 4, hair);
  p(-9, 0, 17, 1, '#56413b');
  p(-12, 2, 3, 7, hair);
  p(10, 2, 3, 7, hair);
  p(-10, 4, 21, 13, skin);
  p(-8, 3, 17, 4, skinLight);
  p(-8, 7, 17, 8, skinLight);
  p(-12, 10, 3, 5, skinShade);
  p(10, 10, 3, 5, skinShade);
  p(-10, 16, 21, 3, skinShade);
  p(-16, 0, 5, 5, ink);
  p(-17, -1, 5, 4, hair);
  p(-16, 0, 3, 1, '#56413b');
  p(-16, 4, 3, 7, hair);
  p(-15, 4, 3, 1, '#a49a90');
  p(-15, 7, 1, 3, '#56413b');
  p(-8, 7, 6, 1, '#34282b');
  p(3, 7, 6, 1, '#34282b');
  p(-8, 9, 6, 3, '#f0dfc1');
  p(3, 9, 6, 3, '#f0dfc1');
  p(-5, 9, 2, 3, '#34282b');
  p(6, 9, 2, 3, '#34282b');
  p(0, 12, 3, 3, skinShade);
  p(-8, 15, 3, 4, '#3b3031');
  p(8, 15, 3, 4, '#3b3031');
  p(-6, 15, 5, 1, '#34282b');
  p(2, 15, 6, 1, '#34282b');
  p(-5, 17, 13, 1, '#422c30');
  p(-3, 17, 8, 1, '#eddbba');
  p(-7, 19, 16, 2, '#3b3031');
  p(-4, 21, 10, 1, '#29252c');
  p(-3, 22, 8, 1, skinShade);
  p(-2, 22, 5, 1, skin);
  ctx.restore();
}

export default {
  id: 'papafrita',
  label: 'Papafrita',
  draw(ctx, x, y, context) {
    drawPapafrita(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2,
    });
  },
};
