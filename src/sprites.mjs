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
  pose(ctx, x, y + Math.floor(Math.sin((options.time || 0) * 4) * 2), options.scale || 1.5);
  // Long lilac hair, a signature bow, and a distinct, expressive face.
  pixel(ctx, -11, -25, 22, 25, '#49395d');
  pixel(ctx, -9, -29, 18, 12, '#aa82d4');
  pixel(ctx, -7, -28, 14, 8, '#d6a5ef');
  pixel(ctx, -10, -22, 4, 22, '#9870c4');
  pixel(ctx, 7, -22, 4, 22, '#9870c4');
  pixel(ctx, -12, -30, 6, 6, '#e7a3d1');
  pixel(ctx, -14, -33, 6, 5, '#be83d4');
  pixel(ctx, -10, -34, 5, 6, '#f2c1e5');
  pixel(ctx, -6, -23, 12, 11, '#f0c9b9');
  pixel(ctx, -4, -21, 2, 3, '#71517e');
  pixel(ctx, 3, -21, 2, 3, '#71517e');
  pixel(ctx, -3, -18, 6, 2, '#d681a2');
  pixel(ctx, -3, -23, 2, 1, '#fff2d4');
  pixel(ctx, 4, -23, 1, 1, '#fff2d4');
  // Fashionable crop top and short skirt with exposed midriff; fully dressed.
  pixel(ctx, -7, -11, 14, 7, '#261e36');
  pixel(ctx, -6, -10, 12, 5, '#db8bc0');
  pixel(ctx, -3, -9, 6, 2, '#f7c0dd');
  pixel(ctx, -5, -5, 10, 3, '#f0c9b9');
  pixel(ctx, -9, -3, 18, 6, '#302342');
  pixel(ctx, -10, -3, 20, 2, '#c873b0');
  pixel(ctx, -8, 3, 5, 5, '#f0c9b9');
  pixel(ctx, 3, 3, 5, 5, '#f0c9b9');
  pixel(ctx, -9, 8, 7, 3, '#342841');
  pixel(ctx, 3, 8, 7, 3, '#342841');
  pixel(ctx, 11, -23, 2, 16, '#cebdc8');
  pixel(ctx, 9, -26, 6, 5, '#d8e38c');
  pixel(ctx, 14, -28, 2, 2, '#fae8a1');
  pixel(ctx, -16, -19, 2, 2, '#d8e38c');
  ctx.restore();
}

export function drawSolago(ctx, x, y, options = {}) {
  const { time = 0, moving = false, facing = 1, attacking = false, crouching = false, scale = 2 } = options;
  const step = moving ? Math.floor(time * 8) % 2 : 0;
  const crouchShift = crouching ? 5 : 0;
  pose(ctx, x, y, scale, facing);
  pixel(ctx, -13, 0, 26, 3, '#11141c');
  ctx.translate(-1, -36 + step + crouchShift);
  if (attacking) ctx.translate(3, -1);
  // Short, thin legs with a visible gap: he is the light frame, not the tank.
  pixel(ctx, -6, 29 - crouchShift, 6, 4, '#292735');
  pixel(ctx, 0, 29 - crouchShift, 6, 4, '#292735');
  pixel(ctx, -7, 33 - step - crouchShift, 6, 3, '#d7d1c8');
  pixel(ctx, 1, 33 + step - crouchShift, 6, 3, '#d7d1c8');
  // Narrow dark tee over skinny bare forearms.
  pixel(ctx, -10, 20, 20, 3, '#101019');
  pixel(ctx, -9, 23, 18, 7, '#101019');
  pixel(ctx, -7, 24, 14, 5, '#33303a');
  pixel(ctx, -9, 24, 2, 5, '#171620');
  pixel(ctx, 7, 24, 2, 5, '#171620');
  pixel(ctx, -12, 22, 3, 8, '#c88b67');
  pixel(ctx, 9, 22, 3, 8, '#c88b67');
  // Chunky watch face from the supplied photo.
  pixel(ctx, 9, 24, 5, 5, '#1b1b25');
  pixel(ctx, 10, 25, 3, 3, '#d4d0c7');
  pixel(ctx, 11, 26, 2, 2, '#555878');
  // Cropped dark hair, broad smile, and oversized front teeth.
  pixel(ctx, -10, 0, 20, 21, '#171722');
  pixel(ctx, -8, 0, 16, 4, '#25232c');
  pixel(ctx, -11, 4, 2, 7, '#24232b');
  pixel(ctx, 9, 4, 2, 7, '#24232b');
  pixel(ctx, -7, 5, 15, 10, '#c88b67');
  pixel(ctx, -5, 4, 12, 3, '#e3aa7e');
  pixel(ctx, -6, 9, 5, 2, '#392e31');
  pixel(ctx, 2, 9, 5, 2, '#392e31');
  pixel(ctx, -5, 10, 2, 2, '#f0dfc6');
  pixel(ctx, 3, 10, 2, 2, '#f0dfc6');
  pixel(ctx, -1, 12, 3, 3, '#a76d57');
  pixel(ctx, -6, 15, 13, 2, '#492b31');
  pixel(ctx, -5, 16, 11, 4, '#fbebd4');
  pixel(ctx, 0, 16, 2, 4, '#a68478');
  pixel(ctx, -7, 20, 15, 2, '#874e48');
  if (attacking) {
    pixel(ctx, -6, 14, 15, 8, '#241821');
    pixel(ctx, -4, 15, 12, 3, '#fff0d8');
    pixel(ctx, -2, 19, 10, 2, '#fff0d8');
    pixel(ctx, 12, 12, 3, 3, '#f0cf8a');
    pixel(ctx, 15, 9, 3, 3, '#f0cf8a');
    pixel(ctx, 15, 16, 3, 3, '#f0cf8a');
  }
  ctx.restore();
}

export function drawPatrona(ctx, x, y, options = {}) {
  const { time = 0, scale = 1.8 } = options;
  pose(ctx, x, y, scale);
  ctx.globalAlpha *= 0.58;
  const sway = Math.floor(Math.sin(time * 2.4) * 2);
  ctx.translate(0, sway);
  // A tall, broad-shouldered spectral Stand, not a floating fairy companion.
  pixel(ctx, -34, -88, 68, 30, '#3b3855');
  pixel(ctx, -28, -94, 56, 20, '#605b7c');
  pixel(ctx, -24, -89, 48, 12, '#8885a0');
  // Long hair, swept behind the shoulders.
  pixel(ctx, -25, -79, 12, 57, '#403752');
  pixel(ctx, 13, -80, 12, 61, '#403752');
  pixel(ctx, -30, -65, 10, 43, '#5b4b70');
  pixel(ctx, 20, -68, 10, 48, '#5b4b70');
  pixel(ctx, -27, -69, 5, 47, '#88739e');
  pixel(ctx, 22, -72, 5, 49, '#9581aa');
  pixel(ctx, -31, -49, 5, 31, '#695779');
  pixel(ctx, 27, -52, 5, 32, '#756087');
  pixel(ctx, -17, -84, 34, 12, '#57466c');
  // Stern feminine face and luminous eyes.
  pixel(ctx, -16, -81, 32, 30, '#c5b5c6');
  pixel(ctx, -19, -76, 5, 16, '#80778f');
  pixel(ctx, 14, -76, 5, 16, '#80778f');
  pixel(ctx, -13, -72, 10, 3, '#40384e');
  pixel(ctx, 4, -72, 10, 3, '#40384e');
  pixel(ctx, -11, -67, 7, 4, '#d7ee9c');
  pixel(ctx, 5, -67, 7, 4, '#d7ee9c');
  pixel(ctx, -13, -69, 11, 2, '#40384e');
  pixel(ctx, 3, -69, 11, 2, '#40384e');
  pixel(ctx, -9, -66, 3, 3, '#302c42');
  pixel(ctx, 7, -66, 3, 3, '#302c42');
  pixel(ctx, -3, -60, 7, 5, '#8b7186');
  pixel(ctx, -8, -53, 16, 2, '#634b67');
  // Fitted spectral bodice, narrow waist, feminine hip silhouette and long coat tails.
  pixel(ctx, -23, -52, 46, 8, '#46425f');
  pixel(ctx, -29, -47, 58, 18, '#55516e');
  pixel(ctx, -21, -44, 42, 25, '#89869f');
  pixel(ctx, -14, -42, 28, 20, '#aaa6b7');
  pixel(ctx, -8, -42, 16, 29, '#51465f');
  pixel(ctx, -6, -40, 12, 19, '#c7a3b0');
  pixel(ctx, -12, -23, 24, 4, '#d5c1d4');
  pixel(ctx, -16, -19, 32, 7, '#40384f');
  pixel(ctx, -25, -14, 50, 10, '#625b79');
  pixel(ctx, -29, -9, 58, 10, '#514967');
  pixel(ctx, -32, -2, 24, 9, '#706985');
  pixel(ctx, 8, -2, 24, 9, '#706985');
  pixel(ctx, -29, -46, 10, 39, '#514a67');
  pixel(ctx, 19, -46, 10, 39, '#514a67');
  pixel(ctx, -34, -41, 11, 31, '#89869f');
  pixel(ctx, 23, -41, 11, 31, '#89869f');
  pixel(ctx, -22, -5, 16, 5, '#b7a7ba');
  pixel(ctx, 6, -5, 16, 5, '#b7a7ba');
  // Two separated finger loops and unmistakable crossed scissor blades.
  pixel(ctx, 29, -30, 14, 14, '#dfe4ed');
  pixel(ctx, 32, -27, 8, 8, '#302a3e');
  pixel(ctx, 40, -16, 14, 14, '#dfe4ed');
  pixel(ctx, 43, -13, 8, 8, '#302a3e');
  pixel(ctx, 34, -31, 8, 8, '#e5d8c2');
  // Upper blade runs up and out; lower blade crosses it toward the opposite side.
  pixel(ctx, 38, -38, 5, 9, '#dfe4ed');
  pixel(ctx, 42, -47, 5, 9, '#dfe4ed');
  pixel(ctx, 46, -56, 5, 9, '#dfe4ed');
  pixel(ctx, 50, -65, 5, 9, '#dfe4ed');
  pixel(ctx, 54, -74, 5, 9, '#f1e8d7');
  pixel(ctx, 33, -37, 5, 9, '#c1b2c9');
  pixel(ctx, 28, -46, 5, 9, '#c1b2c9');
  pixel(ctx, 23, -55, 5, 9, '#c1b2c9');
  pixel(ctx, 18, -64, 5, 9, '#c1b2c9');
  pixel(ctx, 13, -73, 5, 9, '#f1e8d7');
  // A few discrete aura sparks, still using hard pixel edges.
  pixel(ctx, -40, -79, 4, 8, '#c3a6d2');
  pixel(ctx, 36, -85, 4, 8, '#d5c2dc');
  pixel(ctx, -39, -31, 4, 8, '#9b8bb2');
  ctx.restore();
}

export function drawGamerProjectile(ctx, device) {
  if (device === 'remote') {
    pixel(ctx, -6, -14, 12, 28, '#171722');
    pixel(ctx, -4, -13, 8, 25, '#393747');
    pixel(ctx, -3, -11, 6, 4, '#c7df8c');
    pixel(ctx, -2, -5, 4, 2, '#dad3bc');
    pixel(ctx, -2, 0, 4, 2, '#d88aa9');
    pixel(ctx, -2, 5, 4, 2, '#dad3bc');
    pixel(ctx, -2, 11, 4, 2, '#888398');
    return;
  }
  if (device === 'joystick') {
    // A two-handle controller with a plus-shaped D-pad and coloured buttons.
    pixel(ctx, -14, -5, 5, 10, '#171722');
    pixel(ctx, 9, -5, 5, 10, '#171722');
    pixel(ctx, -11, -8, 22, 16, '#171722');
    pixel(ctx, -10, -7, 20, 12, '#4c405d');
    pixel(ctx, -8, -6, 16, 8, '#9381a6');
    pixel(ctx, -7, -2, 5, 2, '#e9e0d3');
    pixel(ctx, -5, -4, 2, 6, '#e9e0d3');
    pixel(ctx, 4, -4, 3, 3, '#cf7192');
    pixel(ctx, 7, 0, 3, 3, '#d9d77d');
    pixel(ctx, 2, 1, 3, 3, '#8cbdb2');
    pixel(ctx, 5, 4, 3, 2, '#e9e0d3');
    return;
  }
  if (device === 'phone') {
    pixel(ctx, -8, -15, 16, 30, '#171722');
    pixel(ctx, -6, -13, 12, 25, '#85808c');
    pixel(ctx, -5, -11, 10, 20, '#39585a');
    pixel(ctx, -4, -9, 3, 3, '#d5d582');
    pixel(ctx, 1, -9, 4, 3, '#cb7da2');
    pixel(ctx, -4, -4, 8, 2, '#bed09a');
    pixel(ctx, -4, 0, 6, 2, '#d0b596');
    pixel(ctx, -4, 5, 8, 2, '#82b2a4');
    pixel(ctx, -1, 11, 2, 1, '#eee5cc');
  }
}
