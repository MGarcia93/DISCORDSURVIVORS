// Native-resolution pixel art. Rectangles land on integer pixels; no vector curves.
export const PALETTE = Object.freeze({
  ink: '#151320', hair: '#24202b', hairLight: '#49404a', skin: '#c88b67',
  skinLight: '#e3aa7e', skinShade: '#995e4f', hoodie: '#d8cf78',
  hoodieLight: '#eee6a0', hoodieShade: '#a79b56', metal: '#dad8dc',
  pants: '#373445', shoe: '#bdb8c5', purple: '#9670be', green: '#b8d97a',
});

export function pixel(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pose(ctx, x, y, scale, facing = 1) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Snap world coordinates to native canvas pixels, including the half-size arena.
  const transform = ctx.getTransform();
  const sx = Math.abs(transform.a) || 1;
  const sy = Math.abs(transform.d) || 1;
  ctx.translate(Math.round(x * sx) / sx, Math.round(y * sy) / sy);
  ctx.scale(scale * facing, scale);
}

export function drawElNegro(ctx, x, y, options = {}) {
  const { time = 0, moving = false, facing = 1, sitting = false, scale = 2 } = options;
  const p = PALETTE;
  const walkingFrame = moving ? Math.floor(time * 8) % 2 : 0;
  pose(ctx, x, y, scale, facing);
  pixel(ctx, -18, -1, 36, 3, '#11141c');
  ctx.translate(-18, -46 + walkingFrame);
  // Keep the earlier leg length and overall height.
  pixel(ctx, 8, 36, 18, 9, p.ink);
  pixel(ctx, 9, 37, 7, 6, p.pants);
  pixel(ctx, 19, 37, 6, 6, p.pants);
  pixel(ctx, 6, 43 - walkingFrame, 10, 3, p.shoe);
  pixel(ctx, 19, 43 + walkingFrame, 10, 3, p.shoe);
  // A modest stepped belly, without widening the shoulders or face.
  pixel(ctx, 5, 21, 26, 3, p.ink);
  pixel(ctx, 3, 24, 30, 8, p.ink);
  pixel(ctx, 1, 30, 34, 7, p.ink);
  pixel(ctx, 4, 36, 28, 3, p.ink);
  pixel(ctx, 5, 24, 26, 8, p.hoodieShade);
  pixel(ctx, 7, 25, 23, 7, p.hoodie);
  pixel(ctx, 3, 30, 30, 6, p.hoodie);
  pixel(ctx, 5, 36, 26, 2, p.hoodieShade);
  pixel(ctx, 7, 25, 3, 7, p.hoodieLight);
  pixel(ctx, 0, 26, 5, 11, p.ink);
  pixel(ctx, 1, 26, 4, 9, p.hoodieShade);
  pixel(ctx, 31, 26, 5, 11, p.ink);
  pixel(ctx, 31, 26, 4, 9, p.hoodie);
  pixel(ctx, 0, 36, 4, 3, p.skin);
  pixel(ctx, 32, 36, 4, 3, p.skinLight);
  pixel(ctx, 12, 32, 14, 4, p.hoodieShade);
  pixel(ctx, 13, 32, 12, 1, p.hoodieLight);
  pixel(ctx, 13, 24, 1, 9, p.metal);
  pixel(ctx, 24, 24, 1, 9, p.metal);
  // Restore the earlier hair, face, glasses and facial hair exactly.
  pixel(ctx, 4, 3, 28, 18, p.ink);
  pixel(ctx, 8, 1, 18, 3, p.hair);
  pixel(ctx, 3, 0, 7, 7, p.hair);
  pixel(ctx, 4, 1, 4, 1, p.hairLight);
  pixel(ctx, 6, 3, 24, 10, p.hair);
  pixel(ctx, 12, 3, 14, 2, p.hairLight);
  pixel(ctx, 8, 8, 20, 14, p.skin);
  pixel(ctx, 10, 7, 16, 2, p.skinLight);
  pixel(ctx, 10, 9, 17, 9, p.skinLight);
  pixel(ctx, 6, 13, 3, 8, p.skinShade);
  pixel(ctx, 6, 18, 2, 2, p.metal);
  pixel(ctx, 7, 18, 1, 1, p.ink);
  pixel(ctx, 27, 13, 3, 8, p.skinShade);
  pixel(ctx, 29, 18, 1, 1, p.metal);
  pixel(ctx, 10, 12, 7, 5, p.ink);
  pixel(ctx, 20, 12, 7, 5, p.ink);
  pixel(ctx, 11, 13, 5, 3, '#636075');
  pixel(ctx, 21, 13, 5, 3, '#636075');
  pixel(ctx, 11, 13, 3, 1, '#9b99a4');
  pixel(ctx, 21, 13, 3, 1, '#9b99a4');
  pixel(ctx, 17, 13, 3, 1, p.ink);
  pixel(ctx, 17, 16, 3, 3, p.skinShade);
  pixel(ctx, 18, 18, 2, 1, p.metal);
  pixel(ctx, 13, 20, 12, 2, p.hair);
  pixel(ctx, 17, 21, 4, 1, p.skin);
  pixel(ctx, 12, 22, 14, 2, p.skinShade);
  pixel(ctx, 11, 24, 14, 1, p.skinShade);
  pixel(ctx, 17, 23, 5, 2, p.hair);
  pixel(ctx, 23, 22, 1, 2, p.metal);
  if (sitting) {
    pixel(ctx, 6, 37, 25, 6, p.pants);
    pixel(ctx, 24, 39, 9, 4, p.shoe);
    pixel(ctx, 8, 29, 22, 5, p.hoodie);
    pixel(ctx, 13, 30, 13, 4, p.ink);
    pixel(ctx, 14, 30, 11, 3, p.metal);
    pixel(ctx, 15, 31, 2, 1, p.ink);
    pixel(ctx, 22, 31, 1, 1, '#b27082');
  } else {
    pixel(ctx, 33, 30, 4, 9, p.ink);
    pixel(ctx, 34, 31, 2, 3, '#c8747b');
    pixel(ctx, 34, 35, 1, 2, p.metal);
  }
  ctx.restore();
}

export function drawChair(ctx, x, y, options = {}) {
  pose(ctx, x, y, options.scale || 2);
  pixel(ctx, -21, -35, 42, 36, PALETTE.ink);
  pixel(ctx, -18, -37, 36, 30, '#4e3b60');
  pixel(ctx, -15, -34, 30, 24, '#725379');
  pixel(ctx, -14, -33, 28, 2, '#a57891');
  pixel(ctx, -22, -17, 9, 16, '#967087');
  pixel(ctx, 13, -17, 9, 16, '#967087');
  pixel(ctx, -13, -10, 26, 9, '#64475e');
  pixel(ctx, -20, 0, 5, 4, '#272332');
  pixel(ctx, 15, 0, 5, 4, '#272332');
  ctx.restore();
}

export function drawZombie(ctx, x, y, options = {}) {
  const { kind = 'zombie', time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * (kind === 'runner' ? 9 : 4) + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -10, 0, 21, 2, '#131a20');
  pixel(ctx, -7, -9, 6, 9 - stride, '#2c2b39');
  pixel(ctx, 2, -9, 6, 8 + stride, '#2c2b39');
  pixel(ctx, -9, -25, 19, 17, '#151a24');
  pixel(ctx, -8, -24, 17, 15, kind === 'runner' ? '#936052' : ['#667767', '#655b70', '#786850'][seed % 3]);
  pixel(ctx, -12, -24 + stride, 4, 13, '#718962');
  pixel(ctx, 9, -23 - stride, 4, 13, '#8b9e70');
  pixel(ctx, 2, -17, 5, 6, '#7d956c');
  pixel(ctx, -8, -36, 17, 14, '#19232b');
  pixel(ctx, -7, -34, 15, 11, '#8b9e70');
  pixel(ctx, -6, -35, 12, 3, '#424b41');
  pixel(ctx, -5, -30, 4, 2, '#d6df94');
  pixel(ctx, 4, -30, 3, 2, '#d6df94');
  pixel(ctx, -2, -26, 6, 2, '#2e3330');
  pixel(ctx, -1, -26, 2, 1, '#d5ceaa');
  ctx.restore();
}

export function drawAdministrator(ctx, x, y, options = {}) {
  pose(ctx, x, y, options.scale || 4);
  const hover = Math.floor(Math.sin((options.time || 0) * 2) * 2);
  pixel(ctx, -14, 0, 28, 3, '#14121d');
  ctx.translate(0, hover);
  pixel(ctx, -12, -27, 24, 26, '#252135');
  pixel(ctx, -10, -27, 20, 22, '#655080');
  pixel(ctx, -6, -28, 12, 9, '#a791af');
  pixel(ctx, -2, -26, 4, 15, '#b9d884');
  pixel(ctx, -16, -26, 5, 15, '#493859');
  pixel(ctx, 11, -26, 5, 15, '#493859');
  pixel(ctx, -11, -41, 22, 15, '#151724');
  pixel(ctx, -9, -39, 18, 12, '#ac9db9');
  pixel(ctx, -8, -35, 6, 2, '#d5ed96');
  pixel(ctx, 3, -35, 6, 2, '#d5ed96');
  pixel(ctx, -4, -29, 9, 1, '#584361');
  pixel(ctx, -10, -47, 4, 7, '#d6b065');
  pixel(ctx, -2, -49, 4, 9, '#ead38e');
  pixel(ctx, 6, -47, 4, 7, '#d6b065');
  pixel(ctx, -10, -43, 20, 3, '#d6b065');
  pixel(ctx, 17, -29, 3, 22, '#8b738b');
  pixel(ctx, 12, -36, 14, 8, '#b6a0cb');
  pixel(ctx, 12, -36, 14, 2, '#e6d5eb');
  ctx.restore();
}

export function drawAnime(ctx, x, y, options = {}) {
  pose(ctx, x, y + Math.floor(Math.sin((options.time || 0) * 4) * 3), options.scale || 2);
  pixel(ctx, -9, -26, 18, 24, '#725789');
  pixel(ctx, -6, -24, 12, 11, '#ecd2c4');
  pixel(ctx, -8, -28, 16, 6, '#bba2d6');
  pixel(ctx, -7, -23, 3, 6, '#bba2d6');
  pixel(ctx, -3, -20, 2, 2, '#42384f');
  pixel(ctx, 3, -20, 2, 2, '#42384f');
  pixel(ctx, -5, -12, 10, 10, '#c7b7d3');
  pixel(ctx, -6, -5, 12, 4, '#e7dae2');
  pixel(ctx, 10, -20, 2, 15, '#cebdc8');
  pixel(ctx, 8, -23, 6, 5, '#dbdf9b');
  ctx.restore();
}
