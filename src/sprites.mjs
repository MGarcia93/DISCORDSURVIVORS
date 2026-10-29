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

// The cast never draws a hard-cornered box: every mass steps in by a couple of
// units at the corners. This paints one rounded rectangle out of five strips, so
// a body reads as flesh and cloth instead of a rectangle.
function roundedMass(ctx, x, y, width, height, color) {
  if (height < 6 || width < 6) { pixel(ctx, x, y, width, height, color); return; }
  pixel(ctx, x + 2, y, width - 4, 1, color);
  pixel(ctx, x + 1, y + 1, width - 2, 1, color);
  pixel(ctx, x, y + 2, width, height - 4, color);
  pixel(ctx, x + 1, y + height - 2, width - 2, 1, color);
  pixel(ctx, x + 2, y + height - 1, width - 4, 1, color);
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

// Act 1 boss: the Alarm Zombie. Built like the bloated infected that explode on
// you: an enormous sagging belly over short legs, thick arms that cannot reach
// past it, and a small head sunk between the shoulders, centred on the body.
// It drags a security alarm that never stops screaming. A boss stands alone on
// stage, so it carries the cast's detail and its rounded masses: a built face,
// seams, a chest pocket, buttons, folds, fingers, laces, screws and bile.
export function drawAlarmZombie(ctx, x, y, options = {}) {
  const { time = 0, scale = 3 } = options;
  const step = Math.floor(time * 2) % 2;
  const shirt = { light: '#5d637a', base: '#4a4f63', mid: '#3f4457', dark: '#343849' };
  const seam = '#2e3142';
  const skin = { light: '#bcc59c', base: '#a3b08c', shade: '#879472', dark: '#6b7758' };
  const bile = { light: '#c2d05a', base: '#a8b94a', dark: '#8f9f3d' };
  // One rounded cloth mass: ink ring, base fill, then the light falling across it.
  const clothMass = (x, y, w, h) => {
    roundedMass(ctx, x, y, w, h, '#151a24');
    roundedMass(ctx, x + 1, y + 1, w - 2, h - 2, shirt.base);
    const inset = h - 4;
    pixel(ctx, x + 2, y + 2, Math.max(1, Math.round(w * 0.16)), inset, shirt.light);
    pixel(ctx, x + w - 4, y + 2, 2, inset, shirt.dark);
    pixel(ctx, x + w - 7, y + 2, 3, inset, shirt.mid);
  };
  const skinMass = (x, y, w, h) => {
    roundedMass(ctx, x, y, w, h, '#151a24');
    roundedMass(ctx, x + 1, y + 1, w - 2, h - 2, skin.base);
    pixel(ctx, x + 2, y + 2, Math.max(1, Math.round(w * 0.25)), Math.max(1, h - 4), skin.light);
    pixel(ctx, x + w - 3, y + 2, 1, Math.max(1, h - 4), skin.shade);
  };
  pose(ctx, x, y, scale);
  pixel(ctx, -34, 0, 60, 3, '#131a20');
  // Short thick legs: the belly carries the boss, not the legs.
  pixel(ctx, -11, -12, 9, 12 - step, '#151a24');
  pixel(ctx, -10, -11, 7, 10 - step, '#4a5a7a');
  pixel(ctx, -10, -11, 2, 10 - step, '#3b4863');
  pixel(ctx, -9, -8, 3, 1, '#3b4863');
  pixel(ctx, 2, -12, 9, 11 + step, '#151a24');
  pixel(ctx, 3, -11, 7, 9 + step, '#4a5a7a');
  pixel(ctx, 8, -11, 2, 9 + step, '#3b4863');
  pixel(ctx, 4, -7, 3, 1, '#3b4863');
  // Boots with a sole line and two laces.
  roundedMass(ctx, -12, 0, 11, 3, '#151a24');
  roundedMass(ctx, -11, 0, 9, 2, '#57505f');
  pixel(ctx, -11, 1, 9, 1, '#3f3a48');
  pixel(ctx, -9, 0, 1, 1, '#8a8496');
  pixel(ctx, -7, 0, 1, 1, '#8a8496');
  roundedMass(ctx, 2, -1 + step, 11, 3, '#151a24');
  roundedMass(ctx, 3, -1 + step, 9, 2, '#57505f');
  pixel(ctx, 3, step, 9, 1, '#3f3a48');
  pixel(ctx, 5, -1 + step, 1, 1, '#8a8496');
  pixel(ctx, 7, -1 + step, 1, 1, '#8a8496');
  // Pear-shaped body, bare and bloated: hips, belly wider than the chest, then
  // shoulders, all in stretched skin instead of a uniform.
  skinMass(-19, -22, 38, 12);
  skinMass(-17, -34, 34, 13);
  skinMass(-14, -41, 28, 8);
  // Sick blotches: the infection shows as raw patches, not more green.
  pixel(ctx, 7, -30, 6, 5, '#8f6f6a');
  pixel(ctx, 10, -27, 4, 3, '#7a5a56');
  pixel(ctx, -12, -23, 5, 4, '#8f6f6a');
  pixel(ctx, 12, -37, 4, 3, '#7a5a56');
  pixel(ctx, -4, -31, 3, 3, '#8f6f6a');
  // Veins and stretch marks running across the belly.
  pixel(ctx, -14, -30, 7, 1, skin.shade);
  pixel(ctx, -9, -29, 4, 1, skin.shade);
  pixel(ctx, 1, -33, 9, 1, skin.shade);
  pixel(ctx, -12, -18, 6, 1, skin.shade);
  pixel(ctx, 3, -17, 8, 1, skin.dark);
  pixel(ctx, -6, -26, 1, 5, skin.shade);
  pixel(ctx, 2, -23, 1, 4, skin.shade);
  pixel(ctx, -16, -38, 5, 1, skin.light);
  pixel(ctx, 6, -38, 6, 1, skin.light);
  // A torn rag hanging off one shoulder: the only cloth left up here.
  pixel(ctx, -14, -41, 9, 5, '#151a24');
  pixel(ctx, -13, -40, 7, 4, '#4a4f63');
  pixel(ctx, -13, -40, 7, 1, '#5d637a');
  pixel(ctx, -7, -37, 2, 2, '#3f4457');
  // Bile: a run that starts at the collar and drips down the belly, plus splashes.
  pixel(ctx, 3, -35, 3, 1, bile.light);
  pixel(ctx, 4, -34, 2, 3, bile.base);
  pixel(ctx, 3, -31, 4, 4, bile.base);
  pixel(ctx, 5, -27, 3, 4, bile.dark);
  pixel(ctx, 6, -23, 2, 3, bile.base);
  pixel(ctx, 7, -20, 2, 2, bile.dark);
  pixel(ctx, 11, -28, 2, 2, bile.base);
  pixel(ctx, -10, -25, 2, 3, bile.dark);
  pixel(ctx, -3, -19, 3, 2, bile.base);
  pixel(ctx, -13, -17, 2, 2, bile.dark);
  // Thick short arms: shoulder, elbow, forearm, knuckles and three fingers.
  skinMass(-22, -38, 8, 14);
  pixel(ctx, -21, -30, 2, 2, skin.shade);
  skinMass(-21, -27, 8, 11);
  pixel(ctx, -20, -19, 6, 1, skin.shade);
  roundedMass(ctx, -21, -18, 8, 5, '#151a24');
  pixel(ctx, -20, -17, 6, 3, skin.shade);
  pixel(ctx, -19, -15, 1, 2, skin.base);
  pixel(ctx, -17, -15, 1, 2, skin.base);
  pixel(ctx, -15, -15, 1, 2, skin.base);
  skinMass(14, -38, 8, 13);
  pixel(ctx, 19, -30, 2, 2, skin.shade);
  skinMass(14, -27, 8, 10);
  pixel(ctx, 15, -19, 6, 1, skin.shade);
  roundedMass(ctx, 14, -18, 8, 5, '#151a24');
  pixel(ctx, 15, -17, 6, 3, skin.shade);
  pixel(ctx, 16, -15, 1, 2, skin.base);
  pixel(ctx, 18, -15, 1, 2, skin.base);
  pixel(ctx, 20, -15, 1, 2, skin.base);
  // Small head sunk between the shoulders, centred on the body.
  roundedMass(ctx, -7, -50, 15, 12, '#151a24');
  roundedMass(ctx, -6, -49, 13, 10, skin.base);
  pixel(ctx, -6, -47, 13, 2, skin.light);
  pixel(ctx, -6, -49, 12, 2, '#3a3a2c');
  pixel(ctx, -6, -49, 12, 1, '#4f4f3a');
  pixel(ctx, -5, -46, 3, 2, '#3a3a2c');
  pixel(ctx, -5, -45, 5, 1, skin.shade);
  pixel(ctx, 1, -45, 4, 1, skin.shade);
  pixel(ctx, -5, -44, 4, 3, skin.dark);
  pixel(ctx, 2, -44, 4, 3, skin.dark);
  pixel(ctx, -4, -43, 2, 2, '#f2f0a2');
  pixel(ctx, 3, -43, 2, 2, '#f2f0a2');
  pixel(ctx, -4, -43, 1, 1, '#fdfbe0');
  pixel(ctx, 3, -43, 1, 1, '#fdfbe0');
  pixel(ctx, -1, -42, 3, 2, skin.shade);
  pixel(ctx, -6, -42, 2, 3, skin.shade);
  pixel(ctx, 5, -42, 2, 3, skin.shade);
  pixel(ctx, -8, -45, 2, 3, skin.shade);
  pixel(ctx, 4, -47, 3, 1, '#6d1f1e');
  pixel(ctx, -6, -40, 12, 1, skin.shade);
  pixel(ctx, -4, -39, 9, 4, '#2a2320');
  pixel(ctx, -3, -39, 1, 1, '#d5ceaa');
  pixel(ctx, -1, -39, 1, 1, '#d5ceaa');
  pixel(ctx, 1, -39, 1, 1, '#d5ceaa');
  pixel(ctx, 3, -39, 1, 1, '#d5ceaa');
  pixel(ctx, -2, -36, 5, 1, '#6d1f1e');
  // Bile dripping from the jaw.
  pixel(ctx, -3, -35, 3, 3, bile.base);
  pixel(ctx, -2, -32, 2, 2, bile.dark);
  // The alarm it refuses to drop: handle, rounded box, grille, screws, dent, cable.
  pixel(ctx, -30, -17, 7, 1, '#2a2320');
  pixel(ctx, -23, -16, 3, 2, '#2a2320');
  pixel(ctx, -26, -15, 3, 2, '#2a2320');
  roundedMass(ctx, -33, -14, 16, 14, '#151a24');
  roundedMass(ctx, -32, -13, 14, 12, '#7a2f2f');
  pixel(ctx, -32, -12, 14, 2, '#96403f');
  pixel(ctx, -32, -4, 14, 2, '#5a2121');
  pixel(ctx, -30, -9, 2, 5, '#5a2121');
  pixel(ctx, -26, -9, 2, 5, '#5a2121');
  pixel(ctx, -22, -9, 2, 5, '#5a2121');
  pixel(ctx, -31, -12, 1, 1, '#b0585a');
  pixel(ctx, -20, -12, 1, 1, '#b0585a');
  pixel(ctx, -20, -3, 1, 1, '#b0585a');
  pixel(ctx, -25, -6, 2, 2, '#4a1a1a');
  // Siren on its post, blinking on the beat, clear of the box.
  pixel(ctx, -29, -17, 3, 4, '#2a2320');
  roundedMass(ctx, -31, -21, 7, 4, '#151a24');
  pixel(ctx, -30, -20, 5, 2, time % 1 < 0.5 ? '#e85c79' : '#ffb3c4');
  pixel(ctx, -30, -20, 1, 1, '#ffe0e8');
  // Sound leaving the alarm: two rings that travel out and fade.
  const pulse = (time * 1.6) % 1;
  for (let ring = 0; ring < 2; ring++) {
    const phase = (pulse + ring * 0.5) % 1;
    const radius = 4 + phase * 10;
    ctx.save();
    ctx.globalAlpha *= 1 - phase;
    for (let i = 0; i < 12; i++) {
      const angle = -2.6 + i * 0.15;
      pixel(ctx, -27 + Math.cos(angle) * radius, -24 + Math.sin(angle) * radius * 0.8, 2, 1, '#ffb3c4');
    }
    ctx.restore();
  }
  ctx.restore();
}

// Act 2 — League of Legends. Both teams march on Maxi Negro, so the minion
// bodies are one recipe and the team colour is what changes: the blue and the
// red wave read as two factions without a second sprite.
const MINION_TEAMS = [
  { light: '#6f9fd0', base: '#47749f', mid: '#3a6086', dark: '#2f4d6c' },
  { light: '#cf6a58', base: '#a64a3c', mid: '#8b3c31', dark: '#713028' },
];
const MINION_METAL = { light: '#c7d0dd', base: '#9fa9bb', mid: '#828da2', dark: '#6a748c' };

// Wave 1 melee minion. A small armoured soldier: helmet with a visor slit and a
// plume, breastplate, a round shield on one arm and an axe on the other. It is
// the plainest of the act and never taller than the walker.
export function drawMeleeMinion(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 5 + seed) % 2;
  const team = MINION_TEAMS[seed % 2];
  pose(ctx, x, y, scale);
  pixel(ctx, -8, 0, 17, 2, '#131a20');
  // Legs and metal-capped boots.
  pixel(ctx, -6, -9, 5, 9 - stride, '#2c2b39');
  pixel(ctx, 1, -9, 5, 8 + stride, '#2c2b39');
  pixel(ctx, -7, 0, 6, 2, '#4a4658');
  pixel(ctx, 1, -1, 6, 2, '#4a4658');
  pixel(ctx, -7, 0, 6, 1, '#8a8496');
  pixel(ctx, 1, -1, 6, 1, '#8a8496');
  // Breastplate, then the team sash across the waist.
  pixel(ctx, -8, -21, 17, 13, '#151a24');
  torsoBands(ctx, -7, -20, 15, 11, MINION_METAL);
  pixel(ctx, -7, -10, 15, 2, team.dark);
  pixel(ctx, -7, -10, 15, 1, team.base);
  // Pauldrons over a slim arm.
  pixel(ctx, -11, -22, 5, 5, '#151a24');
  pixel(ctx, -10, -21, 3, 3, team.base);
  pixel(ctx, -10, -21, 3, 1, team.light);
  pixel(ctx, 7, -22, 5, 5, '#151a24');
  pixel(ctx, 8, -21, 3, 3, team.mid);
  pixel(ctx, -11, -17, 3, 6, '#151a24');
  pixel(ctx, -10, -16, 2, 5, team.mid);
  // Helm with visor slit, nose guard, brow band and plume.
  pixel(ctx, -7, -31, 15, 10, '#19232b');
  pixel(ctx, -6, -30, 13, 7, MINION_METAL.base);
  pixel(ctx, -6, -30, 13, 2, MINION_METAL.light);
  pixel(ctx, -6, -24, 13, 2, MINION_METAL.dark);
  pixel(ctx, -5, -27, 11, 2, '#20262f');
  pixel(ctx, -4, -27, 2, 1, team.light);
  pixel(ctx, 4, -27, 2, 1, team.light);
  pixel(ctx, -1, -27, 2, 4, MINION_METAL.dark);
  pixel(ctx, -1, -34, 3, 3, '#151a24');
  pixel(ctx, -1, -33, 3, 2, team.base);
  pixel(ctx, 2, -32, 3, 2, team.dark);
  // Round shield on the near arm, touching the plate.
  roundedMass(ctx, -15, -19, 8, 13, '#151a24');
  roundedMass(ctx, -14, -18, 6, 11, team.dark);
  pixel(ctx, -14, -18, 6, 2, team.base);
  pixel(ctx, -14, -18, 1, 9, team.light);
  pixel(ctx, -12, -15, 3, 4, MINION_METAL.light);
  pixel(ctx, -11, -14, 1, 2, team.dark);
  // Axe: long handle in the far hand, stepped crescent head clear of the helmet.
  pixel(ctx, 8, -23, 2, 19, '#3b2a20');
  pixel(ctx, 8, -23, 1, 19, '#5a3f2e');
  pixel(ctx, 7, -17, 3, 3, MINION_METAL.dark);
  pixel(ctx, 10, -27, 4, 1, '#151a24');
  pixel(ctx, 10, -26, 6, 1, '#151a24');
  pixel(ctx, 10, -25, 8, 6, '#151a24');
  pixel(ctx, 10, -19, 6, 1, '#151a24');
  pixel(ctx, 10, -18, 3, 1, '#151a24');
  pixel(ctx, 11, -25, 6, 4, MINION_METAL.base);
  pixel(ctx, 11, -25, 6, 1, MINION_METAL.light);
  pixel(ctx, 11, -22, 4, 1, MINION_METAL.dark);
  pixel(ctx, 16, -24, 1, 2, MINION_METAL.light);
  ctx.restore();
}

// Wave 2 mage minion. Robed and hooded, a staff taller than its body with a
// violet orb, and glowing eyes in the hood's shadow. The robe is the team's
// colour so the two factions still read at a glance.
export function drawMageMinion(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const sway = Math.floor(time * 3 + seed) % 2;
  const team = MINION_TEAMS[seed % 2];
  pose(ctx, x, y, scale);
  pixel(ctx, -8, 0, 17, 2, '#131a20');
  // Robe: a narrow chest that flares into a skirt, with a shaded side and hem.
  pixel(ctx, -7, -25, 15, 15, '#151a24');
  torsoBands(ctx, -6, -24, 13, 13, team);
  pixel(ctx, -9, -12, 19, 12, '#151a24');
  pixel(ctx, -8, -12, 17, 10, team.base);
  pixel(ctx, -8, -12, 3, 10, team.light);
  pixel(ctx, 6, -12, 2, 10, team.dark);
  pixel(ctx, -8, -3, 17, 2, team.mid);
  pixel(ctx, -6, -2 + sway, 4, 2, team.dark);
  pixel(ctx, 3, -2 - sway, 4, 2, team.dark);
  // Sash and hem trim, so the robe is not one flat field of colour.
  pixel(ctx, -7, -13, 15, 2, team.dark);
  pixel(ctx, -7, -13, 15, 1, team.light);
  pixel(ctx, -8, -5, 17, 1, team.dark);
  // Hood, then the dark face with two lit eyes.
  pixel(ctx, -2, -37, 4, 3, '#19232b');
  pixel(ctx, -1, -37, 2, 2, team.mid);
  pixel(ctx, -6, -34, 13, 10, '#19232b');
  pixel(ctx, -5, -33, 11, 8, team.mid);
  pixel(ctx, -5, -33, 3, 8, team.base);
  pixel(ctx, -4, -30, 9, 5, '#20263a');
  pixel(ctx, -3, -29, 2, 2, '#c9b6ff');
  pixel(ctx, 3, -29, 2, 2, '#c9b6ff');
  // Sleeves and hands.
  pixel(ctx, -10, -24, 4, 9, '#151a24');
  pixel(ctx, -10, -23, 3, 7, team.mid);
  pixel(ctx, -10, -15, 3, 3, '#a8b98a');
  pixel(ctx, 7, -24, 4, 9, '#151a24');
  pixel(ctx, 8, -23, 3, 7, team.base);
  pixel(ctx, 8, -15, 3, 3, '#a8b98a');
  // Staff: shaft touching the hand, orb crowning it above the hood.
  pixel(ctx, 9, -32, 2, 33, '#3b2a20');
  pixel(ctx, 9, -32, 1, 33, '#5a3f2e');
  pixel(ctx, 9, -14, 2, 2, '#8a8496');
  pixel(ctx, 7, -37, 6, 6, '#151a24');
  pixel(ctx, 8, -36, 4, 4, '#b48cf0');
  pixel(ctx, 9, -36, 2, 2, '#e6d9ff');
  ctx.restore();
}

// Wave 2 siege minion. A wheeled cannon carriage: two big wheels, a wide
// chassis, a barrel longer than the body and a tiny operator behind a banner.
// Wide before tall, so it reads as artillery next to the infantry.
export function drawSiegeMinion(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const rock = Math.floor(time * 4 + seed) % 2;
  const team = MINION_TEAMS[seed % 2];
  pose(ctx, x, y, scale);
  pixel(ctx, -13, 0, 31, 2, '#131a20');
  // Wheels: rounded masses with a hub, one lifted a pixel as it rolls.
  roundedMass(ctx, -13, -8, 10, 9, '#151a24');
  roundedMass(ctx, -12, -7, 8, 7, '#4a4658');
  pixel(ctx, -9, -5, 3, 3, '#8a8496');
  roundedMass(ctx, 3, -8 - rock, 10, 9, '#151a24');
  roundedMass(ctx, 4, -7 - rock, 8, 7, '#4a4658');
  pixel(ctx, 7, -5 - rock, 3, 3, '#8a8496');
  // Chassis and the carriage body it carries.
  pixel(ctx, -12, -13, 27, 6, '#151a24');
  pixel(ctx, -11, -12, 25, 4, '#3a3f4d');
  pixel(ctx, -11, -12, 25, 1, '#4c5262');
  pixel(ctx, -11, -20, 16, 9, '#151a24');
  torsoBands(ctx, -10, -19, 14, 7, team);
  pixel(ctx, -10, -19, 14, 1, team.light);
  // Barrel: breech, tube, muzzle ring, all pointing to the same side.
  pixel(ctx, 4, -21, 15, 6, '#151a24');
  pixel(ctx, 5, -20, 13, 4, '#5b6274');
  pixel(ctx, 5, -20, 13, 1, '#7d8496');
  pixel(ctx, 16, -22, 4, 8, '#151a24');
  pixel(ctx, 17, -21, 2, 6, '#3a3f4d');
  pixel(ctx, 17, -21, 2, 1, '#8a8496');
  pixel(ctx, 6, -22, 3, 2, '#8a8496');
  // Operator: a small head over the breech with a team cap.
  pixel(ctx, -5, -28, 8, 8, '#19232b');
  pixel(ctx, -4, -27, 6, 5, '#8b9e70');
  pixel(ctx, -5, -29, 8, 2, team.dark);
  pixel(ctx, -4, -29, 6, 1, team.base);
  pixel(ctx, -3, -25, 2, 1, '#2e3330');
  pixel(ctx, 1, -25, 2, 1, '#2e3330');
  // Banner on the cast side: pole from the chassis, cloth with its bright edge.
  pixel(ctx, -15, -28, 2, 16, '#3b2a20');
  pixel(ctx, -15, -28, 1, 16, '#5a3f2e');
  pixel(ctx, -14, -27, 8, 7, '#151a24');
  pixel(ctx, -13, -26, 6, 5, team.base);
  pixel(ctx, -13, -26, 6, 1, team.light);
  pixel(ctx, -13, -22, 6, 1, team.dark);
  ctx.restore();
}

// Enemy projectiles. They are the same object as the cast's shots; only the art
// changes with the shooter, exactly like remote/joystick/phone/shroom/brick.
export function drawEnemyShot(ctx, device = 'bolt') {
  if (device === 'shell') {
    // Siege shell: a heavy iron ball with a lit rim, a dark bore and the smoke
    // it drags behind. It has to read as artillery from across the lane.
    pixel(ctx, -12, -2, 6, 4, '#2a2320');
    pixel(ctx, -15, -1, 4, 2, '#4a4658');
    roundedMass(ctx, -6, -7, 14, 14, '#2a2320');
    roundedMass(ctx, -5, -6, 12, 12, '#4a4658');
    pixel(ctx, -5, -6, 5, 5, '#8a8496');
    pixel(ctx, 1, -3, 5, 5, '#2a2320');
    pixel(ctx, 2, 2, 3, 2, '#6a748c');
    return;
  }
  if (device === 'shot') {
    // Turret slug: a hot tracer, not a spell.
    pixel(ctx, -7, -1, 14, 2, '#f2c86a');
    pixel(ctx, -7, -1, 14, 1, '#ffe9b0');
    pixel(ctx, 5, -2, 3, 4, '#fff4cf');
    return;
  }
  // Mage bolt: a violet dart with a white-hot core.
  pixel(ctx, -6, -1, 12, 2, '#7a5bb8');
  pixel(ctx, -4, -2, 8, 4, '#a98bf0');
  pixel(ctx, -2, -1, 5, 2, '#e6d9ff');
  pixel(ctx, 4, -1, 2, 2, '#f7f2ff');
}

const MIST = { light: '#cfd8e8', base: '#a7b4c9', mid: '#8b98ad', dark: '#6d788c' };

// Act 2 — League of Legends, waves 3 and 4. Yorick's mist walker, drawn from
// the Rift's own ghoul: teal, hunched, wrapped forearms and shins, clawed hands.
// It is small on purpose. The act's joke is that Yorick mistakes Solago for one
// of these, so the walker has to be short and buck-toothed like him: that is
// what makes "este pelotudo piensa que soy uno de sus bichos" land.
const GHOUL_SKIN = { light: '#8fd0e0', base: '#5fa8bd', mid: '#4b8da3', dark: '#3a6f83' };
const GHOUL_WRAP = { light: '#dfcfb6', base: '#bda98c', dark: '#8e7c63' };
const GHOUL_TEETH = '#f1edda';
const GHOUL_MAW = '#3a1a24';

export function drawMistWalker(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 6 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -8, 0, 17, 2, '#131a20');
  // Stubby bent legs, wrapped shins, clawed feet.
  pixel(ctx, -6, -8, 5, 7 - stride, GHOUL_SKIN.dark);
  pixel(ctx, 1, -8, 5, 6 + stride, GHOUL_SKIN.mid);
  pixel(ctx, -6, -5, 5, 4, GHOUL_WRAP.base);
  pixel(ctx, -6, -4, 5, 1, GHOUL_WRAP.light);
  pixel(ctx, 1, -5, 5, 4, GHOUL_WRAP.base);
  pixel(ctx, 1, -4, 5, 1, GHOUL_WRAP.light);
  pixel(ctx, -7, -1, 6, 2, '#151a24');
  pixel(ctx, -6, -1, 4, 1, GHOUL_SKIN.mid);
  pixel(ctx, 1, -1, 6, 2, '#151a24');
  pixel(ctx, 2, -1, 4, 1, GHOUL_SKIN.dark);
  pixel(ctx, -6, 0, 1, 1, GHOUL_TEETH);
  pixel(ctx, -4, 0, 1, 1, GHOUL_TEETH);
  pixel(ctx, 3, 0, 1, 1, GHOUL_TEETH);
  pixel(ctx, 5, 0, 1, 1, GHOUL_TEETH);
  // Round little belly, no neck to speak of.
  pixel(ctx, -6, -18, 13, 11, '#151a24');
  torsoBands(ctx, -5, -17, 11, 9, GHOUL_SKIN);
  pixel(ctx, -5, -12, 11, 1, GHOUL_SKIN.dark);
  // Short arms: bare shoulder, wrapped forearm, two claws.
  pixel(ctx, -9, -17, 3, 7, '#151a24');
  pixel(ctx, -8, -16, 2, 5, GHOUL_SKIN.base);
  pixel(ctx, -9, -12, 4, 5, '#151a24');
  pixel(ctx, -8, -11, 3, 3, GHOUL_WRAP.base);
  pixel(ctx, -8, -10, 3, 1, GHOUL_WRAP.light);
  pixel(ctx, -8, -8, 3, 2, GHOUL_SKIN.mid);
  pixel(ctx, -9, -7, 2, 3, GHOUL_TEETH);
  pixel(ctx, -6, -7, 2, 3, GHOUL_TEETH);
  pixel(ctx, 6, -17, 3, 7, '#151a24');
  pixel(ctx, 7, -16, 2, 5, GHOUL_SKIN.mid);
  pixel(ctx, 6, -12, 4, 5, '#151a24');
  pixel(ctx, 7, -11, 3, 3, GHOUL_WRAP.base);
  pixel(ctx, 7, -10, 3, 1, GHOUL_WRAP.light);
  pixel(ctx, 7, -8, 3, 2, GHOUL_SKIN.mid);
  pixel(ctx, 6, -7, 2, 3, GHOUL_TEETH);
  pixel(ctx, 9, -7, 2, 3, GHOUL_TEETH);
  // The head is almost half the body: a maw with two big front teeth.
  roundedMass(ctx, -8, -30, 17, 13, '#151a24');
  roundedMass(ctx, -7, -29, 15, 11, GHOUL_SKIN.base);
  pixel(ctx, -7, -29, 6, 2, GHOUL_SKIN.light);
  pixel(ctx, -7, -20, 15, 1, GHOUL_SKIN.dark);
  pixel(ctx, -7, -26, 15, 7, '#151a24');
  pixel(ctx, -6, -25, 13, 5, GHOUL_MAW);
  pixel(ctx, -6, -25, 13, 2, '#241019');
  pixel(ctx, -4, -22, 9, 2, '#7d3147');
  // The two front teeth are the joke: wide, long and together, like Solago's.
  pixel(ctx, -3, -26, 3, 5, GHOUL_TEETH);
  pixel(ctx, 1, -26, 3, 5, GHOUL_TEETH);
  pixel(ctx, -6, -26, 2, 2, GHOUL_TEETH);
  pixel(ctx, 5, -26, 2, 2, GHOUL_TEETH);
  ctx.restore();
}

const MAIDEN_GOWN = { light: '#3a3158', base: '#241f3f', mid: '#1a1630', dark: '#100d20' };
const MAIDEN_HAIR = { light: '#2f2a52', base: '#1c1838', mid: '#141128', dark: '#0b0918' };
const MAIDEN_GLOW = { light: '#c6feff', base: '#67f4f7', mid: '#2fd4e2', dark: '#178e9f' };
const MAIDEN_ARM = { light: '#b8f0e9', base: '#7fd9d6', mid: '#4fa8ae', dark: '#2b6b74' };
const MAIDEN_CLAW = '#120e1e';
const MAIDEN_INK = '#08060f';

// Act 2 — League of Legends, wave 5. The Maiden of the Mist, Yorick's own
// summon: a tall, nearly black figure crowned with spiky hair, a cyan fire
// burning behind the head and through the chest, pale glowing arms with long
// dark claws, and a torn gown that ravels into mist instead of reaching feet.
export function drawMaiden(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  pose(ctx, x, y, scale);
  // A pointed crown needs diagonals, and a diagonal in pixel art is a staircase
  // of one-pixel columns. Drawn as a triangle per spike, never as a row of blocks.
  const spike = (bx, by, w, h, color) => {
    const half = Math.ceil(w / 2);
    for (let i = 0; i < w; i++) {
      const column = Math.min(i, w - 1 - i);
      const height = Math.max(1, Math.round(h * (column + 1) / half));
      pixel(ctx, bx + i, by - height, 1, height, color);
    }
  };
  pixel(ctx, -14, 0, 29, 2, '#131a20');
  // Gown: one continuous flare stepped a pixel at a time, never a stack of
  // tiers. The lit edge and the shadow run down it, so it reads as cloth.
  for (let row = 0; row < 27; row++) {
    const yy = -27 + row;
    const half = 5 + Math.round(row * 0.42);
    pixel(ctx, -half - 1, yy, half * 2 + 2, 1, MAIDEN_INK);
    pixel(ctx, -half, yy, half * 2, 1, MAIDEN_GOWN.base);
    pixel(ctx, half - 2, yy, 2, 1, MAIDEN_GOWN.dark);
    if (row > 1 && row % 4 === 0) pixel(ctx, -half, yy, 2, 1, MAIDEN_GOWN.light);
  }
  // Torn hem: columns of different lengths with gaps below the flare.
  pixel(ctx, -13, -1, 2, 3, MAIDEN_GOWN.mid);
  pixel(ctx, -9, 0, 3, 3, MAIDEN_GOWN.base);
  pixel(ctx, -4, -1, 2, 4, MAIDEN_GOWN.dark);
  pixel(ctx, 0, 0, 3, 3, MAIDEN_GOWN.mid);
  pixel(ctx, 5, -1, 2, 3, MAIDEN_GOWN.base);
  pixel(ctx, 9, 0, 3, 3, MAIDEN_GOWN.dark);
  // Chest above the flare, narrow, with sloped shoulders.
  pixel(ctx, -6, -38, 13, 12, MAIDEN_INK);
  torsoBands(ctx, -5, -37, 11, 10, MAIDEN_GOWN);
  pixel(ctx, -12, -38, 25, 3, MAIDEN_INK);
  torsoBands(ctx, -11, -37, 23, 2, MAIDEN_GOWN);
  // Chest core: an irregular flame, not a screen.
  pixel(ctx, -2, -36, 4, 2, MAIDEN_GLOW.dark);
  pixel(ctx, -3, -34, 6, 4, MAIDEN_GLOW.mid);
  pixel(ctx, -4, -30, 8, 5, MAIDEN_GLOW.base);
  pixel(ctx, -2, -29, 4, 3, MAIDEN_GLOW.light);
  pixel(ctx, -3, -25, 6, 3, MAIDEN_GLOW.mid);
  pixel(ctx, -2, -22, 4, 2, MAIDEN_GLOW.dark);
  pixel(ctx, -5, -33, 1, 4, MAIDEN_GLOW.dark);
  pixel(ctx, 4, -32, 1, 3, MAIDEN_GLOW.dark);
  // Cyan fire leaking behind the shoulders.
  pixel(ctx, -12, -44, 3, 9, MAIDEN_GLOW.dark);
  pixel(ctx, 9, -44, 3, 9, MAIDEN_GLOW.dark);
  pixel(ctx, -11, -42, 1, 5, MAIDEN_GLOW.mid);
  pixel(ctx, 10, -42, 1, 5, MAIDEN_GLOW.mid);
  // Crown: five triangular spikes over the head.
  spike(-12, -47, 5, 6, MAIDEN_INK);
  spike(-7, -47, 6, 11, MAIDEN_INK);
  spike(-1, -47, 7, 14, MAIDEN_INK);
  spike(6, -47, 6, 10, MAIDEN_INK);
  spike(11, -47, 4, 5, MAIDEN_INK);
  spike(-6, -47, 4, 9, MAIDEN_HAIR.mid);
  spike(0, -47, 5, 12, MAIDEN_HAIR.base);
  spike(6, -47, 4, 8, MAIDEN_HAIR.mid);
  // Head under the crown, with two long falls of hair beside the face.
  pixel(ctx, -6, -48, 13, 12, MAIDEN_INK);
  torsoBands(ctx, -5, -47, 11, 10, MAIDEN_HAIR);
  pixel(ctx, -9, -44, 4, 11, MAIDEN_INK);
  pixel(ctx, -8, -43, 2, 9, MAIDEN_HAIR.mid);
  pixel(ctx, 5, -44, 4, 11, MAIDEN_INK);
  pixel(ctx, 6, -43, 2, 9, MAIDEN_HAIR.base);
  pixel(ctx, -4, -43, 9, 8, '#05030a');
  pixel(ctx, -3, -42, 7, 6, '#120d20');
  pixel(ctx, -2, -40, 2, 2, MAIDEN_GLOW.base);
  pixel(ctx, 2, -40, 2, 2, MAIDEN_GLOW.base);
  pixel(ctx, -1, -37, 3, 1, MAIDEN_GLOW.dark);
  // Arms: one continuous stepped limb each, so the pale forearm never breaks
  // into floating dashes; the hand ends in three dark claws.
  const arm = (dir) => {
    for (let i = 0; i < 22; i++) {
      const yy = -37 + i;
      const xx = (dir > 0 ? 12 : -14) + dir * Math.floor(i / 6);
      pixel(ctx, xx, yy, 3, 1, MAIDEN_INK);
      pixel(ctx, xx + (dir > 0 ? 0 : 1), yy, 2, 1, i < 11 ? MAIDEN_ARM.mid : MAIDEN_ARM.base);
      if (i % 4 === 0) pixel(ctx, xx + (dir > 0 ? 0 : 1), yy, 1, 1, MAIDEN_ARM.light);
    }
    const handX = (dir > 0 ? 12 : -14) + dir * 3;
    pixel(ctx, handX, -15, 3, 2, MAIDEN_INK);
    pixel(ctx, handX, -13, 1, 4, MAIDEN_CLAW);
    pixel(ctx, handX + 2, -13, 1, 3, MAIDEN_CLAW);
    pixel(ctx, handX - 1, -12, 1, 3, MAIDEN_CLAW);
  };
  arm(-1);
  arm(1);
  // Mist: a faint scatter of cyan under the hem, never a line across the gown.
  ctx.save();
  ctx.globalAlpha *= 0.22 + pulse * 0.18;
  pixel(ctx, -11, 1, 4, 1, MAIDEN_GLOW.mid);
  pixel(ctx, -4, 2, 5, 1, MAIDEN_GLOW.mid);
  pixel(ctx, 4, 1, 5, 1, MAIDEN_GLOW.dark);
  ctx.restore();
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
