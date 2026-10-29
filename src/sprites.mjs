// Native-resolution pixel art. Rectangles land on integer pixels; no vector curves.
export const PALETTE = Object.freeze({
  ink: '#151320', hair: '#24202b', hairLight: '#49404a', skin: '#c88b67',
  skinLight: '#e3aa7e', skinShade: '#995e4f', hoodie: '#d8cf78',
  hoodieLight: '#eee6a0', hoodieShade: '#a79b56', metal: '#dad8dc',
  pants: '#373445', shoe: '#bdb8c5', purple: '#9670be', green: '#b8d97a',
});

// Closed 1px contour shared by the sprites drawn on the 46px cast grid.
const OUTLINE = '#171526';

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

// Enemy sprites follow one written budget: closed ink contour, one shade tone per
// material and a highlight only where it earns its place (sneakers, hands, the
// top of the head). That is the cast's language at lower density, so a crowd of
// them never competes with the player on screen.

// The walker's shirt is the only per-instance colour: three rotten tones, each
// with its own shade and light so the volume survives at 2x.
const ZOMBIE_SHIRTS = [
  { light: '#7f9180', base: '#667767', mid: '#5a6b5c', dark: '#4f5c51' },
  { light: '#7d7289', base: '#655b70', mid: '#584f62', dark: '#4b4253' },
  { light: '#8f7d60', base: '#786850', mid: '#6a5c47', dark: '#5d5140' },
];

// A body reads as a cylinder, not as a stripe, when the light falls in steps.
// Paints the lit edge, the base and two progressively darker bands across a
// torso of `width` at `x`, so no single hard line cuts the volume in half.
function torsoBands(ctx, x, y, width, height, tones) {
  const lit = Math.max(1, Math.round(width * 0.15));
  const dark = Math.max(1, Math.round(width * 0.2));
  const mid = Math.max(1, Math.round(width * 0.22));
  pixel(ctx, x, y, lit, height, tones.light);
  pixel(ctx, x + width - dark, y, dark, height, tones.dark);
  pixel(ctx, x + width - dark - mid, y, mid, height, tones.mid);
  pixel(ctx, x + lit, y, width - lit - mid - dark, height, tones.base);
}

// Act 1 walker. Slow, stooped, arms hanging: the plainest body of the cast.
export function drawZombie(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 4 + seed) % 2;
  const shirt = ZOMBIE_SHIRTS[seed % 3];
  pose(ctx, x, y, scale);
  pixel(ctx, -10, 0, 21, 2, '#131a20');
  pixel(ctx, -7, -9, 6, 9 - stride, '#2c2b39');
  pixel(ctx, 2, -9, 6, 8 + stride, '#2c2b39');
  pixel(ctx, -7, -9, 2, 9 - stride, '#211f2c');
  pixel(ctx, -8, 0, 6, 2, '#4a4658');
  pixel(ctx, 2, -1, 6, 2, '#4a4658');
  pixel(ctx, -8, 0, 6, 1, '#8a8496');
  pixel(ctx, 2, -1, 6, 1, '#8a8496');
  // Torso: contour, base, shaded flank, lit shoulder and a torn hem.
  pixel(ctx, -9, -25, 19, 17, '#151a24');
  torsoBands(ctx, -8, -24, 17, 15, {
    light: shirt.light, base: shirt.base, mid: shirt.mid, dark: shirt.dark,
  });
  // Shadow the head casts on the chest, and a torn hem instead of a band.
  pixel(ctx, -8, -24, 17, 2, shirt.mid);
  pixel(ctx, -7, -12, 4, 2, shirt.dark);
  pixel(ctx, 2, -12, 3, 2, shirt.dark);
  // Arms: skin with its shade on the back arm and a hand at each end.
  pixel(ctx, -12, -24 + stride, 4, 13, '#718962');
  pixel(ctx, -12, -13 + stride, 4, 3, '#a8b98a');
  pixel(ctx, 9, -23 - stride, 4, 13, '#8b9e70');
  pixel(ctx, 9, -12 - stride, 4, 3, '#a8b98a');
  pixel(ctx, 2, -17, 5, 6, '#718962');
  // Head: contour, face, shaded jaw, hair with a lit edge and dead eyes.
  pixel(ctx, -8, -36, 17, 14, '#19232b');
  pixel(ctx, -7, -34, 15, 11, '#8b9e70');
  pixel(ctx, -7, -27, 15, 3, '#718962');
  pixel(ctx, -6, -35, 12, 3, '#424b41');
  pixel(ctx, -6, -35, 12, 1, '#55604f');
  pixel(ctx, -5, -30, 4, 2, '#d6df94');
  pixel(ctx, 4, -30, 3, 2, '#d6df94');
  pixel(ctx, -2, -26, 6, 2, '#2e3330');
  pixel(ctx, -1, -26, 2, 1, '#d5ceaa');
  ctx.restore();
}

// Act 1 runner. All speed, read as a mid-stride runner: the legs break at the
// knee and scissor between the open stride and the passing pose, the arms bend
// at the elbow with one swinging back, and the bright sneakers keep the lower
// half readable on a dark stage. The head stays centred on a short neck, over a
// narrow torso, so nothing looks pasted on.
export function drawRunner(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const open = Math.floor(time * 9 + seed) % 2 === 0;
  pose(ctx, x, y, scale);
  pixel(ctx, -8, 0, 17, 2, '#131a20');
  pixel(ctx, -4, -14, 5, 7, '#4a4566');
  pixel(ctx, open ? -6 : -4, -8, 4, 7, '#4a4566');
  pixel(ctx, open ? -6 : -4, -8, 1, 7, '#332f45');
  pixel(ctx, open ? -7 : -5, open ? -2 : -1, 6, 2, '#b9b3c4');
  pixel(ctx, open ? -7 : -5, open ? -2 : -1, 6, 1, '#d6d2dd');
  pixel(ctx, 1, -14, 5, 7, '#4a4566');
  pixel(ctx, open ? 3 : 2, -8, 4, 8, '#4a4566');
  pixel(ctx, open ? 6 : 5, -8, 1, 8, '#332f45');
  pixel(ctx, open ? 3 : 2, 0, 6, 2, '#b9b3c4');
  pixel(ctx, open ? 3 : 2, 0, 6, 1, '#d6d2dd');
  // Narrow torso, with the hips showing under a torn hem.
  pixel(ctx, -5, -31, 13, 17, '#151a24');
  torsoBands(ctx, -4, -30, 11, 15, {
    light: '#a87666', base: '#936052', mid: '#84544a', dark: '#74463e',
  });
  pixel(ctx, -4, -30, 11, 2, '#84544a');
  pixel(ctx, -4, -17, 4, 2, '#74463e');
  pixel(ctx, 2, -17, 3, 2, '#74463e');
  // Bent arms: one swung back, one forward, both joined at the shoulder.
  pixel(ctx, -7, -29, 3, 8, '#6d8560');
  pixel(ctx, -9, -22, 6, 3, '#9fae86');
  pixel(ctx, 6, -29, 3, 8, '#7d956c');
  pixel(ctx, 5, -22, 7, 3, '#9fae86');
  // Short neck, then a head centred over the shoulders.
  pixel(ctx, -1, -35, 4, 4, '#718962');
  pixel(ctx, -5, -46, 12, 13, '#19232b');
  pixel(ctx, -4, -44, 10, 10, '#9fae86');
  pixel(ctx, -4, -37, 10, 3, '#8b9e70');
  pixel(ctx, -4, -45, 9, 3, '#3d4a37');
  pixel(ctx, -4, -45, 9, 1, '#4e5c48');
  pixel(ctx, -2, -40, 4, 2, '#f2f0a2');
  pixel(ctx, 3, -40, 3, 2, '#f2f0a2');
  pixel(ctx, -1, -36, 6, 3, '#2a2320');
  ctx.restore();
}

// Act 1 brute. Mass before detail: shoulders wider than the torso, no neck, a
// head sunk between them, thick arms hanging forward and blood down the front.
// It shares the cast grid, so it reads about a head taller than the walker and
// just under the player instead of towering over the arena.
export function drawBrute(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 3 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -13, 0, 27, 2, '#131a20');
  pixel(ctx, -9, -12, 7, 12 - stride, '#2c2b39');
  pixel(ctx, 2, -12, 7, 11 + stride, '#2c2b39');
  pixel(ctx, -9, -12, 2, 12 - stride, '#211f2c');
  pixel(ctx, -10, 0, 8, 2, '#4a4658');
  pixel(ctx, 2, -1, 8, 2, '#4a4658');
  pixel(ctx, -10, 0, 8, 1, '#8a8496');
  pixel(ctx, 2, -1, 8, 1, '#8a8496');
  // Shoulders as a slab with real contour, then the belly under it.
  pixel(ctx, -13, -31, 27, 8, '#151a24');
  pixel(ctx, -12, -29, 25, 6, '#5d6b52');
  pixel(ctx, -12, -29, 25, 2, '#6b7a5d');
  pixel(ctx, -11, -25, 23, 15, '#151a24');
  pixel(ctx, -10, -24, 21, 13, '#6a4a44');
  torsoBands(ctx, -10, -24, 21, 13, {
    light: '#7d5a52', base: '#6a4a44', mid: '#5f403a', dark: '#543833',
  });
  pixel(ctx, -4, -20, 9, 3, '#8f2b28');
  pixel(ctx, -2, -17, 4, 2, '#6d1f1e');
  // Thick arms in two segments, each with contour so they are not loose slabs.
  pixel(ctx, -16, -28 + stride, 6, 9, '#151a24');
  pixel(ctx, -15, -27 + stride, 4, 7, '#718962');
  pixel(ctx, -15, -20 + stride, 6, 9, '#151a24');
  pixel(ctx, -14, -19 + stride, 4, 7, '#5f7752');
  pixel(ctx, 10, -27 - stride, 6, 8, '#151a24');
  pixel(ctx, 11, -26 - stride, 4, 6, '#8b9e70');
  pixel(ctx, 9, -20 - stride, 6, 8, '#151a24');
  pixel(ctx, 10, -19 - stride, 4, 6, '#6d8560');
  // Head sunk between the shoulders, with a shaded jaw.
  pixel(ctx, -8, -42, 17, 12, '#19232b');
  pixel(ctx, -7, -40, 15, 10, '#8b9e70');
  pixel(ctx, -7, -32, 15, 2, '#718962');
  pixel(ctx, -6, -41, 13, 2, '#424b41');
  pixel(ctx, -6, -41, 13, 1, '#55604f');
  pixel(ctx, -5, -36, 4, 2, '#d6df94');
  pixel(ctx, 3, -36, 4, 2, '#d6df94');
  pixel(ctx, -2, -32, 6, 2, '#2e3330');
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

// Papazito: the photo build — heavyset frame, plain black tee, light blue
// jeans with rolled cuffs, white low sneakers, and an oversized comedy brick.
// Drawn on the 46px cast grid with a closed ink contour and three tones per
// material, the same construction as El Negro and Solago.
export function drawPapazito(ctx, x, y, options = {}) {
  const { time = 0, moving = false, facing = 1, scale = 2 } = options;
  const step = moving ? Math.floor(time * 8) % 2 : 0;
  pose(ctx, x, y, scale, facing);
  pixel(ctx, -16, 0, 32, 3, '#11141c');
  ctx.translate(0, -46 + step);

  // White low sneakers and rolled cuffs under the jeans.
  pixel(ctx, -15, 43, 14, 3, OUTLINE);
  pixel(ctx, 1, 43, 14, 3, OUTLINE);
  pixel(ctx, -14, 43, 12, 2, '#efe9dc');
  pixel(ctx, 2, 43, 12, 2, '#efe9dc');
  pixel(ctx, -14, 45, 12, 1, '#cfc9bb');
  pixel(ctx, 2, 45, 12, 1, '#cfc9bb');
  pixel(ctx, -15, 41, 14, 2, OUTLINE);
  pixel(ctx, 1, 41, 14, 2, OUTLINE);
  pixel(ctx, -14, 41, 12, 2, '#f2eee1');
  pixel(ctx, 2, 41, 12, 2, '#f2eee1');
  pixel(ctx, -14, 42, 12, 1, '#cfc9bb');
  pixel(ctx, 2, 42, 12, 1, '#cfc9bb');

  // Light jeans: eight rows behind the hem so both legs stay readable.
  pixel(ctx, -15, 33, 31, 9, OUTLINE);
  pixel(ctx, -14, 33, 12, 8, '#7d9ab8');
  pixel(ctx, 2, 33, 12, 8, '#8faecc');
  pixel(ctx, -14, 33, 2, 8, '#b6cddd');
  pixel(ctx, 2, 33, 2, 8, '#b6cddd');

  // Black tee over a stepped heavy frame: shoulders, chest, belly, hem.
  pixel(ctx, -15, 18, 30, 3, OUTLINE);
  pixel(ctx, -16, 21, 32, 7, OUTLINE);
  pixel(ctx, -17, 28, 34, 6, OUTLINE);
  pixel(ctx, -14, 19, 28, 2, '#1d1c26');
  pixel(ctx, -15, 21, 30, 7, '#1d1c26');
  pixel(ctx, -16, 28, 32, 5, '#1d1c26');
  pixel(ctx, -15, 22, 3, 10, '#2b2938');
  pixel(ctx, -16, 31, 32, 2, '#15141d');
  pixel(ctx, -5, 18, 10, 2, '#101019');
  pixel(ctx, -7, 21, 14, 1, '#2b2938');

  // Orange hi-vis vest from his portrait: sleeveless, open at the front so the
  // black tee still shows, with one reflective strip down each panel.
  pixel(ctx, -14, 19, 10, 2, '#e8942f');
  pixel(ctx, 4, 19, 10, 2, '#e8942f');
  pixel(ctx, -15, 21, 11, 7, '#e8942f');
  pixel(ctx, -16, 28, 12, 5, '#e8942f');
  pixel(ctx, 4, 21, 11, 7, '#e8942f');
  pixel(ctx, 4, 28, 12, 5, '#e8942f');
  pixel(ctx, -15, 21, 1, 7, '#ffb854');
  pixel(ctx, 15, 21, 1, 7, '#ffb854');
  pixel(ctx, -12, 22, 3, 9, '#eef2dc');
  pixel(ctx, 9, 22, 3, 9, '#eef2dc');
  pixel(ctx, -12, 22, 3, 1, '#f7fae8');
  pixel(ctx, 9, 22, 3, 1, '#f7fae8');
  pixel(ctx, -12, 30, 3, 1, '#b9bda8');
  pixel(ctx, 9, 30, 3, 1, '#b9bda8');
  pixel(ctx, -5, 21, 1, 12, '#8a4a1a');
  pixel(ctx, 4, 21, 1, 12, '#8a4a1a');
  pixel(ctx, -16, 32, 12, 1, '#b8691c');
  pixel(ctx, 4, 32, 12, 1, '#b8691c');

  // Short sleeves, bare arms; the left hand carries the oversized brick.
  pixel(ctx, -19, 19, 4, 7, OUTLINE);
  pixel(ctx, 15, 19, 4, 7, OUTLINE);
  pixel(ctx, -18, 20, 2, 5, '#1d1c26');
  pixel(ctx, 16, 20, 2, 5, '#1d1c26');
  pixel(ctx, -20, 25, 5, 8, OUTLINE);
  pixel(ctx, 15, 25, 5, 8, OUTLINE);
  pixel(ctx, -19, 26, 3, 6, '#c88b67');
  pixel(ctx, 16, 26, 3, 6, '#c88b67');
  pixel(ctx, -19, 26, 1, 5, '#e3aa7e');
  pixel(ctx, 16, 26, 1, 5, '#e3aa7e');
  // Brick: terracotta, heavy rim, two mortar holes.
  pixel(ctx, -29, 25, 18, 10, OUTLINE);
  pixel(ctx, -28, 26, 16, 8, '#b4543c');
  pixel(ctx, -28, 26, 16, 2, '#cd6c4e');
  pixel(ctx, -28, 32, 16, 2, '#934029');
  pixel(ctx, -26, 28, 4, 3, '#8f3f2e');
  pixel(ctx, -19, 28, 4, 3, '#8f3f2e');
  pixel(ctx, -22, 33, 8, 4, OUTLINE);
  pixel(ctx, -21, 34, 6, 2, '#e3aa7e');

  // Round head, short hair, heavy jaw.
  pixel(ctx, -13, 0, 26, 20, OUTLINE);
  pixel(ctx, -12, 0, 24, 3, '#221f29');
  pixel(ctx, -10, 0, 16, 1, '#49404a');
  pixel(ctx, -12, 3, 3, 5, '#221f29');
  pixel(ctx, 9, 3, 3, 5, '#221f29');
  pixel(ctx, -11, 3, 22, 15, '#c88b67');
  pixel(ctx, -10, 3, 17, 4, '#e3aa7e');
  pixel(ctx, -11, 16, 22, 2, '#995e4f');
  pixel(ctx, -13, 7, 2, 4, OUTLINE);
  pixel(ctx, -12, 7, 1, 4, '#c88b67');
  pixel(ctx, 11, 7, 2, 4, OUTLINE);
  pixel(ctx, 11, 7, 1, 4, '#c88b67');
  pixel(ctx, -8, 6, 5, 1, '#221f29');
  pixel(ctx, 3, 6, 5, 1, '#221f29');
  pixel(ctx, -6, 8, 2, 2, '#15141d');
  pixel(ctx, 4, 8, 2, 2, '#15141d');
  pixel(ctx, -1, 10, 2, 2, '#c88b67');
  pixel(ctx, -1, 10, 1, 1, '#e3aa7e');
  pixel(ctx, -5, 13, 10, 1, '#995e4f');
  pixel(ctx, -4, 14, 7, 1, '#8a5a4a');
  pixel(ctx, -11, 16, 22, 1, '#a8705a');
  pixel(ctx, -4, 18, 8, 2, '#995e4f');
  ctx.restore();
}

// Warrior: the gym physique from his photo (red headband, white print tank,
// open 80s windbreaker, salmon shorts), rolling shaman smoke as idle detail.
// Same cast grid and closed ink contour as El Negro, so he no longer reads as
// a smaller, flatter sprite next to the rest of the roster.
export function drawWarrior(ctx, x, y, options = {}) {
  const { time = 0, moving = false, facing = 1, scale = 2 } = options;
  const step = moving ? Math.floor(time * 8) % 2 : 0;
  const puff = Math.floor(time * 3) % 3;
  pose(ctx, x, y, scale, facing);
  pixel(ctx, -13, 0, 26, 3, '#11141c');
  pixel(ctx, -17, -41 + puff * 2, 3, 3, '#8d86a866');
  pixel(ctx, 14, -44 + puff * 2, 3, 3, '#8d86a866');
  pixel(ctx, -19, -35 + puff, 2, 2, '#8d86a866');
  ctx.translate(0, -46 + step);

  // Shins and white gym sneakers on the shared baseline.
  pixel(ctx, -9, 41, 8, 5, OUTLINE);
  pixel(ctx, 1, 41, 8, 5, OUTLINE);
  pixel(ctx, -8, 42, 6, 3, '#f2eee1');
  pixel(ctx, 2, 42, 6, 3, '#f2eee1');
  pixel(ctx, -8, 45, 6, 1, '#cfc9bb');
  pixel(ctx, 2, 45, 6, 1, '#cfc9bb');
  pixel(ctx, -7, 36, 5, 6, OUTLINE);
  pixel(ctx, 2, 36, 5, 6, OUTLINE);
  pixel(ctx, -6, 37, 4, 5, '#d99e6d');
  pixel(ctx, 3, 37, 4, 5, '#d99e6d');
  pixel(ctx, -6, 37, 1, 4, '#e8b483');
  pixel(ctx, 3, 37, 1, 4, '#e8b483');

  // Salmon shorts worn high, with a visible leg break.
  pixel(ctx, -11, 31, 22, 6, OUTLINE);
  pixel(ctx, -10, 31, 20, 5, '#e2627d');
  pixel(ctx, -10, 31, 20, 1, '#ef8aa4');
  pixel(ctx, -10, 35, 20, 1, '#a84d61');
  pixel(ctx, -1, 33, 2, 3, OUTLINE);

  // Open 80s windbreaker: purple side, pink side, white print tank between.
  pixel(ctx, -13, 19, 26, 2, OUTLINE);
  pixel(ctx, -13, 21, 26, 11, OUTLINE);
  pixel(ctx, -11, 19, 10, 2, '#7d60c4');
  pixel(ctx, 1, 19, 10, 2, '#cd6a8c');
  pixel(ctx, -13, 21, 6, 10, '#7d60c4');
  pixel(ctx, -13, 21, 1, 10, '#a48de8');
  pixel(ctx, -9, 21, 1, 10, '#5b3fa0');
  pixel(ctx, 7, 21, 6, 10, '#cd6a8c');
  pixel(ctx, 7, 21, 1, 10, '#e78fab');
  pixel(ctx, 12, 21, 1, 10, '#a84d61');
  pixel(ctx, -8, 21, 1, 10, OUTLINE);
  pixel(ctx, 7, 21, 1, 10, OUTLINE);
  pixel(ctx, -7, 21, 14, 10, '#f2eee1');
  pixel(ctx, -7, 21, 2, 10, '#fbf8ee');
  pixel(ctx, 5, 21, 2, 10, '#d8d2c0');
  pixel(ctx, -6, 23, 6, 2, '#4b93a0');
  pixel(ctx, 0, 26, 5, 2, '#cd6a8c');
  pixel(ctx, -6, 29, 4, 2, '#4b93a0');
  pixel(ctx, -9, 29, 1, 2, '#dad8dc');
  pixel(ctx, -13, 30, 6, 1, '#5b3fa0');
  pixel(ctx, 7, 30, 6, 1, '#a84d61');

  // Jacket sleeves, bare tan forearms, hands.
  pixel(ctx, -16, 20, 5, 8, OUTLINE);
  pixel(ctx, 11, 20, 5, 8, OUTLINE);
  pixel(ctx, -15, 21, 3, 6, '#7d60c4');
  pixel(ctx, 12, 21, 3, 6, '#cd6a8c');
  pixel(ctx, -15, 21, 1, 6, '#a48de8');
  pixel(ctx, 12, 21, 1, 6, '#e78fab');
  pixel(ctx, -17, 27, 5, 8, OUTLINE);
  pixel(ctx, 12, 27, 5, 8, OUTLINE);
  pixel(ctx, -16, 28, 3, 6, '#d99e6d');
  pixel(ctx, 13, 28, 3, 6, '#d99e6d');
  pixel(ctx, -16, 28, 1, 5, '#e8b483');
  pixel(ctx, 13, 28, 1, 5, '#e8b483');
  pixel(ctx, -18, 34, 5, 4, OUTLINE);
  pixel(ctx, 13, 34, 5, 4, OUTLINE);
  pixel(ctx, -17, 34, 3, 3, '#e8b483');
  pixel(ctx, 14, 34, 3, 3, '#e8b483');

  // Head: dark hair, red headband over the brow, red eyes.
  pixel(ctx, -11, 0, 22, 20, OUTLINE);
  pixel(ctx, -10, 1, 20, 2, '#232028');
  pixel(ctx, -8, 1, 12, 1, '#3b3542');
  pixel(ctx, -10, 2, 2, 4, '#232028');
  pixel(ctx, 8, 2, 2, 4, '#232028');
  pixel(ctx, -11, 3, 22, 3, '#c4404e');
  pixel(ctx, -10, 3, 20, 1, '#e0656f');
  pixel(ctx, -10, 5, 20, 1, '#8a2b33');
  pixel(ctx, -14, 4, 3, 7, OUTLINE);
  pixel(ctx, -13, 5, 2, 5, '#c4404e');
  pixel(ctx, -10, 6, 2, 2, '#232028');
  pixel(ctx, 9, 6, 2, 2, '#232028');
  pixel(ctx, -8, 6, 16, 12, '#d99e6d');
  pixel(ctx, -7, 6, 13, 3, '#e8b483');
  pixel(ctx, -8, 16, 16, 2, '#a96c48');
  pixel(ctx, -11, 10, 2, 3, OUTLINE);
  pixel(ctx, -10, 10, 1, 3, '#a96c48');
  pixel(ctx, 10, 10, 2, 3, OUTLINE);
  pixel(ctx, 10, 10, 1, 3, '#a96c48');
  pixel(ctx, -7, 8, 4, 1, '#232028');
  pixel(ctx, 3, 8, 4, 1, '#232028');
  pixel(ctx, -6, 9, 3, 2, '#b3384a');
  pixel(ctx, 3, 9, 3, 2, '#b3384a');
  pixel(ctx, -5, 9, 1, 1, '#e07a86');
  pixel(ctx, 4, 9, 1, 1, '#e07a86');
  pixel(ctx, -1, 11, 2, 2, '#a96c48');
  pixel(ctx, -3, 14, 7, 1, '#7d4a35');
  pixel(ctx, -3, 15, 2, 1, '#5f3427');
  pixel(ctx, -4, 18, 8, 2, '#a96c48');
  ctx.restore();
}

export function drawSmokeCloud(ctx, x, y, radius, time = 0, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const puffs = 40;
  for (let i = 0; i < puffs; i++) {
    const angle = i / puffs * Math.PI * 2 + time * 0.12;
    const wobble = Math.sin(time * 2 + i * 1.9) * 5;
    const r = radius * (0.72 + (i % 4) * 0.055) + wobble;
    const px = Math.round((x + Math.cos(angle) * r) / 4) * 4;
    const py = Math.round((y + Math.sin(angle) * r * 0.72) / 4) * 4;
    ctx.fillStyle = i % 3 === 0 ? '#b7a7ce' : '#817793';
    ctx.fillRect(px - 5, py - 5, 10, 10);
  }
  for (let i = 0; i < 7; i++) {
    const angle = time * 0.7 + i * Math.PI * 2 / 7;
    const r = radius * (0.2 + (i % 3) * 0.09);
    ctx.fillStyle = i % 2 ? '#a79bbb' : '#d1c4d9';
    ctx.fillRect(Math.round(x + Math.cos(angle) * r) - 6, Math.round(y + Math.sin(angle) * r * 0.6) - 6, 12, 12);
  }
  ctx.restore();
}

export function drawShroomBlast(ctx, x, y, radius, progress = 0) {
  const t = Math.max(0, Math.min(1, progress));
  const wave = radius * (0.28 + t * 0.72);
  ctx.save();
  ctx.globalAlpha *= 1 - t * 0.72;
  for (let ring = 0; ring < 2; ring++) {
    const r = wave * (ring ? 0.72 : 1);
    const count = ring ? 32 : 48;
    ctx.fillStyle = ring ? '#f5c66b' : '#e85c79';
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + (ring ? 0.08 : 0);
      const px = Math.round((x + Math.cos(angle) * r) / 4) * 4;
      const py = Math.round((y + Math.sin(angle) * r * 0.8) / 4) * 4;
      ctx.fillRect(px - 4, py - 4, 8, 8);
    }
  }
  ctx.fillStyle = '#f1a05f';
  ctx.fillRect(Math.round(x) - 10, Math.round(y) - 6, 20, 12);
  ctx.fillStyle = '#ffe3a6';
  ctx.fillRect(Math.round(x) - 4, Math.round(y) - 3, 8, 6);
  ctx.restore();
}

export function drawAstralAura(ctx, x, y, radius, time = 0, intensity = 1) {
  ctx.save();
  ctx.globalAlpha *= intensity;
  for (let ring = 0; ring < 2; ring++) {
    const count = ring ? 28 : 44;
    const base = radius * (ring ? 0.76 : 1);
    ctx.fillStyle = ring ? '#9de3d3' : '#bc8be8';
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + time * (ring ? -0.8 : 0.55);
      const r = base + Math.sin(time * 3 + i * 0.8) * 5;
      const px = Math.round((x + Math.cos(angle) * r) / 4) * 4;
      const py = Math.round((y + Math.sin(angle) * r * 0.8) / 4) * 4;
      ctx.fillRect(px - 3, py - 3, 6, 6);
    }
  }
  for (let i = 0; i < 5; i++) {
    const angle = time * 1.8 + i * Math.PI * 2 / 5;
    const r = radius * (0.36 + (i % 2) * 0.16);
    const px = Math.round(x + Math.cos(angle) * r);
    const py = Math.round(y + Math.sin(angle) * r * 0.7);
    ctx.fillStyle = i % 2 ? '#f4c9ec' : '#c5f5da';
    ctx.fillRect(px - 2, py - 8, 4, 16);
    ctx.fillRect(px - 8, py - 2, 16, 4);
  }
  ctx.restore();
}

export function drawGamerProjectile(ctx, device) {
  if (device === 'brick') {
    // Papazito's ladrillo: a red brick with mortar holes, readable mid-tumble.
    pixel(ctx, -9, -6, 18, 12, '#b4543c');
    pixel(ctx, -11, -4, 22, 8, '#a3482f');
    pixel(ctx, -9, -6, 18, 3, '#cd6c4e');
    pixel(ctx, -7, -2, 4, 3, '#8f3f2e');
    pixel(ctx, 3, -2, 4, 3, '#8f3f2e');
    pixel(ctx, -7, 3, 14, 2, '#934029');
  }
  if (device === 'shroom') {
    // Oversized bomb mushroom: its silhouette stays readable while tumbling.
    pixel(ctx, -6, -2, 12, 15, '#e9dfc8');
    pixel(ctx, -5, 11, 10, 3, '#c9a97c');
    pixel(ctx, -12, -11, 24, 8, '#c9556b');
    pixel(ctx, -15, -7, 30, 5, '#a83c56');
    pixel(ctx, -13, -4, 26, 4, '#c9556b');
    pixel(ctx, -9, -10, 5, 3, '#f2e9d8');
    pixel(ctx, 5, -11, 5, 3, '#f2e9d8');
    pixel(ctx, -2, -7, 4, 3, '#f2e9d8');
    return;
  }
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
