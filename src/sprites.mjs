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
  if (device === 'fireball') {
    // Rathalos' fire: a white-hot core inside a stepped flame, trailing embers.
    // It has to read as a ball of fire from across the arena, so the core is the
    // brightest thing on the field after the player.
    pixel(ctx, -13, -2, 8, 4, '#7a1f10');
    pixel(ctx, -11, -4, 7, 8, '#c23a12');
    roundedMass(ctx, -2, -7, 12, 14, '#5c160c');
    roundedMass(ctx, -1, -6, 10, 12, '#e8611e');
    pixel(ctx, 1, -5, 6, 5, '#ffb03a');
    pixel(ctx, 2, -4, 4, 3, '#ffe9a0');
    pixel(ctx, 2, 2, 4, 3, '#c23a12');
    pixel(ctx, -6, -5, 3, 2, '#ffb03a');
    return;
  }
  if (device === 'venom') {
    // Pukei-Pukei's spit: a bubbling purple glob with a dark rim and two drops
    // coming off it, so the poison is legible before it lands.
    pixel(ctx, -10, -1, 6, 2, '#4d2762');
    roundedMass(ctx, -3, -7, 12, 14, '#3a1c4c');
    roundedMass(ctx, -2, -6, 10, 12, '#9a62b8');
    pixel(ctx, -2, -6, 7, 3, '#c79ae0');
    pixel(ctx, 1, -1, 4, 4, '#723f8d');
    pixel(ctx, 3, 3, 3, 2, '#9a62b8');
    pixel(ctx, -7, -6, 3, 3, '#723f8d');
    return;
  }
  if (device === 'hex') {
    // Act 3 hex bolt: a green curse with a dark rim and a thin tail, so it is
    // never mistaken for the mage's violet dart in the middle of a wave.
    pixel(ctx, -9, -1, 6, 2, '#2c6b26');
    pixel(ctx, -6, -3, 9, 6, '#1c2118');
    pixel(ctx, -5, -2, 7, 4, '#8ade5a');
    pixel(ctx, -3, -2, 4, 2, '#d8ffb0');
    pixel(ctx, 2, -1, 2, 2, '#f2ffe0');
    return;
  }
  if (device === 'arrow') {
    // Act 4 arrow: a light shaft on a dark nock, with an iron head. Long and thin
    // so it reads as a projectile and not as a bar of light.
    pixel(ctx, -9, -1, 15, 2, '#3a2a18');
    pixel(ctx, -9, -1, 15, 1, '#e4d6b0');
    pixel(ctx, 5, -2, 4, 4, '#2c2a30');
    pixel(ctx, 6, -1, 2, 2, '#cfcbcd');
    pixel(ctx, -10, -2, 3, 4, '#a03225');
    return;
  }
  if (device === 'net') {
    // Act 4 net: a weighted rope square, open in the middle. It is thrown at the
    // player, so it has to read as mesh even at two pixels a strand.
    pixel(ctx, -7, -6, 14, 2, '#c9b383');
    pixel(ctx, -7, 4, 14, 2, '#c9b383');
    pixel(ctx, -7, -5, 2, 9, '#a9926a');
    pixel(ctx, 5, -5, 2, 9, '#a9926a');
    pixel(ctx, -3, -4, 2, 8, '#a9926a');
    pixel(ctx, 1, -4, 2, 8, '#a9926a');
    pixel(ctx, -6, -1, 12, 2, '#a9926a');
    return;
  }
  if (device === 'flask') {
    // Act 4 lotus flask: a spinning vial of yellow lotus with its stopper and a
    // drop of light at the neck.
    pixel(ctx, -4, -6, 8, 3, '#3a2a18');
    roundedMass(ctx, -5, -3, 10, 9, '#2c2010');
    roundedMass(ctx, -4, -2, 8, 7, '#f0c24e');
    pixel(ctx, -4, -2, 8, 2, '#ffe9a0');
    pixel(ctx, -3, 1, 3, 3, '#fff6cf');
    pixel(ctx, -6, -7, 3, 2, '#c4912a');
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

const YORICK_SKIN = { light: '#cddfab', base: '#a9c086', mid: '#89a069', dark: '#67794f' };
const YORICK_CLOAK = { light: '#5f3f78', base: '#452a5b', mid: '#33203f', dark: '#22152b' };
const YORICK_TUNIC = { light: '#3b3149', base: '#2c2438', mid: '#221c2c', dark: '#171320' };
const YORICK_BELT = { light: '#6d5236', base: '#4e3a24', dark: '#332413' };
const YORICK_WRAP = { light: '#d9cdb4', base: '#b3a588', dark: '#867a61' };
const YORICK_METAL = { light: '#b6a6c9', base: '#8a78a3', mid: '#655578', dark: '#453a54' };
const YORICK_RUNE = '#d9b6ff';
const YORICK_FLAME = { light: '#c79bff', base: '#8b4fe0', dark: '#5a2c9c' };
const YORICK_ROBE = { light: '#3c518c', base: '#26325e', mid: '#1b2547', dark: '#121a33' };
const YORICK_TRIM = { light: '#d45cbb', base: '#a83c96', mid: '#7f2b73', dark: '#54194d' };
const YORICK_BONE = '#e8e2d1';
const YORICK_GLOW = '#ffd75e';
const YORICK_STEEL = { light: '#aeb7c4', base: '#828c9a', mid: '#5d6775', dark: '#3b4451' };
const YORICK_WOOD = { light: '#6b4a2e', base: '#4e3520', dark: '#33220f' };
const YORICK_INK = '#0a0c17';

// Act 2 — League of Legends, wave 6. Yorick, the gravedigger: deep blue robe with
// magenta trim, a white skull for a face with two yellow eyes, a riveted steel
// pauldron, a lantern at the hip and a spade taller than he is. The pauldron, the
// lantern and the spade are what make him read as Yorick and not as a hooded zombie.
export function drawYorick(ctx, x, y, options = {}) {
  const { time = 0, scale = 2, kneeling = false } = options;
  const step = Math.floor(time * 2) % 2;
  const flicker = Math.floor(time * 7) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -17, 0, 35, 2, '#0a0c17');
  // Cinematic pose: he falls to his knees, so the legs fold onto the ground and
  // everything above the waist drops with them. The combat ficha never uses it.
  if (kneeling) {
    pixel(ctx, -14, -10, 12, 10, YORICK_INK);
    pixel(ctx, -13, -9, 10, 8, YORICK_TUNIC.base);
    pixel(ctx, 2, -10, 12, 10, YORICK_INK);
    pixel(ctx, 3, -9, 10, 8, YORICK_TUNIC.mid);
    pixel(ctx, -15, -2, 14, 2, '#2b2738');
    pixel(ctx, 1, -2, 14, 2, '#2b2738');
  }
  ctx.save();
  if (kneeling) ctx.translate(0, 13);
  // Tombstones and candles riding on his back, with violet flames.
  pixel(ctx, -12, -62, 9, 12, '#1b1a24');
  pixel(ctx, -11, -61, 7, 10, '#3b3a49');
  pixel(ctx, -9, -58, 2, 5, '#57566a');
  pixel(ctx, -8, -56, 3, 1, '#57566a');
  pixel(ctx, 2, -58, 7, 8, '#1b1a24');
  pixel(ctx, 3, -57, 5, 6, '#33323f');
  pixel(ctx, -3, -60, 3, 3, '#2a2933');
  pixel(ctx, -3, -64, 3, 4, YORICK_FLAME.dark);
  pixel(ctx, -2, -67 - flicker, 2, 4, YORICK_FLAME.base);
  pixel(ctx, -2, -70 - flicker, 1, 3, YORICK_FLAME.light);
  pixel(ctx, 5, -62, 2, 4, YORICK_FLAME.dark);
  pixel(ctx, 5, -65 - flicker, 1, 4, YORICK_FLAME.base);
  pixel(ctx, 7, -59, 2, 3, YORICK_FLAME.dark);
  pixel(ctx, 8, -62 + flicker, 1, 3, YORICK_FLAME.light);
  // Legs and heavy boots.
  if (!kneeling) {
  pixel(ctx, -10, -18, 8, 18, YORICK_INK);
  pixel(ctx, -9, -17, 6, 16, YORICK_TUNIC.base);
  pixel(ctx, 3, -18, 8, 18, YORICK_INK);
  pixel(ctx, 4, -17, 6, 16, YORICK_TUNIC.mid);
  pixel(ctx, -11, -5, 10, 5, YORICK_INK);
  pixel(ctx, -10, -4, 8, 3, '#2b2738');
  pixel(ctx, -11, -1, 10, 1, '#454058');
  pixel(ctx, 3, -5, 10, 5, YORICK_INK);
  pixel(ctx, 4, -4, 8, 3, '#2b2738');
  pixel(ctx, 3, -1, 10, 1, '#454058');
  }
  // Tunic and belt, with the skull charm on the hip.
  pixel(ctx, -11, -36, 23, 19, YORICK_INK);
  torsoBands(ctx, -10, -35, 21, 17, YORICK_TUNIC);
  pixel(ctx, -11, -27, 23, 4, YORICK_INK);
  pixel(ctx, -10, -27, 21, 2, YORICK_BELT.base);
  pixel(ctx, -10, -27, 21, 1, YORICK_BELT.light);
  pixel(ctx, 4, -24, 5, 6, YORICK_INK);
  pixel(ctx, 5, -23, 3, 4, YORICK_BONE);
  pixel(ctx, 5, -22, 1, 1, '#2a2b22');
  pixel(ctx, 7, -22, 1, 1, '#2a2b22');
  pixel(ctx, 5, -20, 3, 1, YORICK_BONE);
  // Cloak over the shoulders, heavy and hunched.
  pixel(ctx, -14, -44, 29, 9, YORICK_INK);
  torsoBands(ctx, -13, -43, 27, 7, YORICK_CLOAK);
  pixel(ctx, -14, -36, 7, 6, YORICK_INK);
  pixel(ctx, -13, -35, 5, 4, YORICK_CLOAK.mid);
  pixel(ctx, 8, -36, 7, 6, YORICK_INK);
  pixel(ctx, 9, -35, 5, 4, YORICK_CLOAK.dark);
  // Hood: a big pointed cowl with a pale green face inside.
  pixel(ctx, -10, -60, 21, 17, YORICK_INK);
  torsoBands(ctx, -9, -59, 19, 15, YORICK_CLOAK);
  pixel(ctx, -6, -65, 9, 5, YORICK_INK);
  pixel(ctx, -5, -64, 7, 4, YORICK_CLOAK.base);
  pixel(ctx, -8, -63, 3, 4, YORICK_CLOAK.mid);
  pixel(ctx, 6, -63, 3, 4, YORICK_CLOAK.dark);
  pixel(ctx, -4, -56, 9, 11, '#0b0a12');
  pixel(ctx, -3, -55, 7, 9, YORICK_SKIN.base);
  pixel(ctx, -3, -55, 7, 2, YORICK_SKIN.light);
  pixel(ctx, -3, -48, 7, 2, YORICK_SKIN.dark);
  pixel(ctx, -3, -52, 2, 2, '#12101a');
  pixel(ctx, 2, -52, 2, 2, '#12101a');
  pixel(ctx, -3, -51, 1, 1, YORICK_GLOW);
  pixel(ctx, 2, -51, 1, 1, YORICK_GLOW);
  pixel(ctx, -1, -49, 3, 1, '#2a2b22');
  // The huge pale-green arms: one braced on the ground, one on the shaft.
  pixel(ctx, -22, -42, 9, 22, YORICK_SKIN.dark);
  pixel(ctx, -21, -41, 7, 20, YORICK_SKIN.base);
  pixel(ctx, -21, -41, 2, 20, YORICK_SKIN.light);
  pixel(ctx, -22, -24, 9, 6, YORICK_INK);
  pixel(ctx, -21, -23, 7, 4, YORICK_WRAP.base);
  pixel(ctx, -21, -22, 7, 1, YORICK_WRAP.light);
  pixel(ctx, -21, -18, 7, 4, YORICK_SKIN.base);
  pixel(ctx, -22, -14, 8, 4, YORICK_SKIN.light);
  pixel(ctx, 13, -44, 8, 14, YORICK_SKIN.dark);
  pixel(ctx, 14, -43, 6, 12, YORICK_SKIN.base);
  pixel(ctx, 14, -43, 1, 12, YORICK_SKIN.light);
  pixel(ctx, 13, -32, 8, 7, YORICK_INK);
  pixel(ctx, 14, -31, 6, 5, YORICK_WRAP.base);
  pixel(ctx, 14, -30, 6, 1, YORICK_WRAP.light);
  // The shovel: a purple metal blade with a cross, held up and forward.
  pixel(ctx, 20, -52, 4, 46, YORICK_INK);
  pixel(ctx, 21, -51, 2, 44, YORICK_WOOD.base);
  pixel(ctx, 21, -51, 1, 44, YORICK_WOOD.light);
  // Head: a heavy hexagonal blade, stepped one pixel at a time so the sides are
  // straight instead of serrated.
  const headWidths = [7, 9, 11, 13, 15, 15, 15, 15, 13, 11, 9, 7];
  headWidths.forEach((width, index) => {
    const yy = -61 + index;
    const half = Math.floor(width / 2);
    pixel(ctx, 23 - half - 1, yy, width + 2, 1, YORICK_INK);
    pixel(ctx, 23 - half, yy, width, 1, index < 3 ? YORICK_METAL.light : YORICK_METAL.base);
    if (index > 8) pixel(ctx, 23 - half, yy, width, 1, YORICK_METAL.mid);
  });
  // Cross cut into the face of the blade.
  pixel(ctx, 22, -57, 2, 7, YORICK_METAL.dark);
  pixel(ctx, 20, -54, 6, 2, YORICK_METAL.dark);
  pixel(ctx, 22, -56, 1, 5, YORICK_METAL.mid);
  pixel(ctx, 21, -53, 4, 1, YORICK_METAL.mid);
  pixel(ctx, 20, -48, 7, 2, YORICK_INK);
  pixel(ctx, 21, -46, 5, 2, YORICK_METAL.mid);
  // Hand gripping the shaft, over it.
  pixel(ctx, 17, -33, 7, 6, YORICK_INK);
  pixel(ctx, 18, -32, 5, 4, YORICK_SKIN.base);
  pixel(ctx, 18, -32, 5, 1, YORICK_SKIN.light);
  ctx.restore();
  ctx.restore();
}

// Act 3 — Diablo. The dungeon's cast keeps the same grid and the same closed
// ink contour as the rest of the game: bone and fire instead of cloth and skin.
const BONE = { light: '#ece6d2', base: '#d2cab1', mid: '#aba28a', dark: '#7f7661' };
const BONE_INK = '#1b1b23';
const SOUL_FIRE = '#c8443a';

// Wave 1. Skeleton: bone over a closed contour, a rusted blade in one hand and
// two red pinpoints where the eyes used to be. It is the cheapest body of the
// act, so the read is the ribcage and the weapon, not the details.
export function drawSkeleton(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 5 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -8, 0, 17, 2, '#131a20');
  // Feet, then shins: the knee cap is the only wide bone.
  pixel(ctx, -6, -3, 6, 3, BONE.mid);
  pixel(ctx, 1, -3, 6, 3, BONE.dark);
  pixel(ctx, -5, -14 + stride, 3, 12 - stride, BONE.base);
  pixel(ctx, 2, -14 - stride, 3, 12 + stride, BONE.mid);
  pixel(ctx, -5, -14 + stride, 1, 12 - stride, BONE.light);
  pixel(ctx, -6, -15 + stride, 4, 2, BONE.base);
  pixel(ctx, 2, -15 - stride, 4, 2, BONE.mid);
  // Pelvis, spine and a ribcage of three bars over the ink contour.
  pixel(ctx, -6, -21, 13, 7, BONE_INK);
  pixel(ctx, -5, -20, 11, 5, BONE.base);
  pixel(ctx, -5, -20, 11, 1, BONE.light);
  pixel(ctx, -1, -28, 3, 7, BONE.mid);
  pixel(ctx, -1, -28, 1, 7, BONE.light);
  pixel(ctx, -7, -30, 15, 11, BONE_INK);
  pixel(ctx, -6, -29, 13, 9, BONE.base);
  for (let row = 0; row < 3; row++) pixel(ctx, -6, -28 + row * 3, 13, 1, BONE_INK);
  pixel(ctx, -6, -29, 13, 1, BONE.light);
  pixel(ctx, 3, -28, 4, 8, BONE.dark);
  // Shoulders and arms; the right one carries the blade.
  pixel(ctx, -10, -31, 21, 3, BONE_INK);
  pixel(ctx, -9, -30, 19, 2, BONE.base);
  pixel(ctx, -12, -29, 3, 12, BONE.mid);
  pixel(ctx, -12, -18, 4, 3, BONE.light);
  pixel(ctx, 9, -29, 3, 9, BONE.mid);
  pixel(ctx, 9, -21, 4, 3, BONE.base);
  pixel(ctx, 10, -37, 3, 16, '#3a3540');
  pixel(ctx, 11, -36, 2, 14, '#8d8c96');
  pixel(ctx, 11, -36, 1, 14, '#b9b8c2');
  pixel(ctx, 10, -34, 4, 2, '#6a4a2c');
  pixel(ctx, 12, -22, 2, 2, '#3a3540');
  // Skull: stepped contour, hollow sockets, a jaw of missing teeth.
  roundedMass(ctx, -6, -43, 13, 13, BONE_INK);
  roundedMass(ctx, -5, -42, 11, 11, BONE.base);
  pixel(ctx, -5, -42, 8, 2, BONE.light);
  pixel(ctx, -4, -37, 3, 2, SOUL_FIRE);
  pixel(ctx, 2, -37, 3, 2, SOUL_FIRE);
  pixel(ctx, -1, -34, 2, 2, BONE_INK);
  pixel(ctx, -4, -31, 9, 3, BONE.mid);
  pixel(ctx, -3, -31, 1, 3, BONE_INK);
  pixel(ctx, 0, -31, 1, 3, BONE_INK);
  pixel(ctx, 3, -31, 1, 3, BONE_INK);
  ctx.restore();
}

const DEMON = { light: '#d4644a', base: '#ad4130', mid: '#8a2f26', dark: '#64201d' };
const DEMON_HORN = '#2b2430';
const DEMON_EYE = '#ffdf8a';

// Wave 1. Lesser demon: a hunched imp, all shoulders and claws, with a tail it
// drags behind it. Shorter and lighter than the brute, so a swarm still reads.
export function drawLesserDemon(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 5 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -9, 0, 19, 2, '#131a20');
  // Hooves, shins, and a tail dragging out of the hips.
  pixel(ctx, -7, -3, 6, 3, DEMON_HORN);
  pixel(ctx, 2, -3, 6, 3, DEMON_HORN);
  pixel(ctx, -6, -13 + stride, 5, 10 - stride, DEMON.mid);
  pixel(ctx, 2, -13 - stride, 5, 10 + stride, DEMON.base);
  pixel(ctx, -6, -13 + stride, 2, 10 - stride, DEMON.base);
  pixel(ctx, -8, -10, 3, 3, DEMON.dark);
  pixel(ctx, -12, -8, 5, 2, DEMON.dark);
  pixel(ctx, -14, -10, 3, 3, DEMON_HORN);
  // Hips and torso: wide at the shoulders, narrow at the waist.
  pixel(ctx, -7, -19, 15, 7, DEMON_HORN);
  pixel(ctx, -6, -18, 13, 5, DEMON.mid);
  pixel(ctx, -8, -32, 17, 14, DEMON_HORN);
  torsoBands(ctx, -7, -31, 15, 12, DEMON);
  pixel(ctx, -7, -31, 15, 1, DEMON.light);
  pixel(ctx, -3, -24, 7, 3, DEMON.dark);
  // Shoulder spikes, then arms with four-fingered claws.
  pixel(ctx, -11, -34, 4, 4, DEMON_HORN);
  pixel(ctx, -10, -33, 2, 2, DEMON.light);
  pixel(ctx, 8, -34, 4, 4, DEMON_HORN);
  pixel(ctx, 9, -33, 2, 2, DEMON.base);
  pixel(ctx, -11, -31, 4, 12, DEMON.dark);
  pixel(ctx, -10, -30, 3, 10, DEMON.base);
  pixel(ctx, -12, -20, 6, 4, DEMON_HORN);
  pixel(ctx, -12, -19, 5, 2, DEMON.mid);
  pixel(ctx, 8, -31, 4, 12, DEMON_HORN);
  pixel(ctx, 9, -30, 3, 10, DEMON.mid);
  pixel(ctx, 7, -20, 6, 4, DEMON_HORN);
  pixel(ctx, 8, -19, 5, 2, DEMON.base);
  // Head sunk between the shoulders: a wide jaw full of teeth and two horns.
  roundedMass(ctx, -7, -42, 15, 13, DEMON_HORN);
  roundedMass(ctx, -6, -41, 13, 11, DEMON.base);
  pixel(ctx, -6, -41, 9, 2, DEMON.light);
  pixel(ctx, -6, -35, 5, 3, DEMON_EYE);
  pixel(ctx, 3, -35, 4, 3, DEMON_EYE);
  pixel(ctx, -2, -31, 5, 3, DEMON_HORN);
  pixel(ctx, -4, -32, 10, 1, DEMON.mid);
  pixel(ctx, -3, -31, 1, 2, '#efe3c0');
  pixel(ctx, 3, -31, 1, 2, '#efe3c0');
  pixel(ctx, -8, -45, 4, 4, DEMON_HORN);
  pixel(ctx, -7, -45, 2, 2, DEMON.mid);
  pixel(ctx, 5, -45, 4, 4, DEMON_HORN);
  pixel(ctx, 6, -45, 2, 2, DEMON.base);
  ctx.restore();
}

const ROBE = { light: '#4a3f66', base: '#332b4a', mid: '#262038', dark: '#191426' };
const ROBE_TRIM = '#a06a2c';
const HEX = { light: '#d8ffb0', base: '#8ade5a', mid: '#4fa838', dark: '#2c6b26' };

// Wave 2. Shaman: robed artillery. It keeps its distance and throws a hex bolt,
// so the silhouette has to read as a caster at a glance: hood, staff, orb, no
// weapon in hand.
export function drawShaman(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  pose(ctx, x, y, scale);
  pixel(ctx, -9, 0, 19, 2, '#131a20');
  // Robe: one stepped flare in six bands, lit on the left, shadowed on the
  // right, gold hem. Bands instead of one rect per row: a common enemy pays
  // for its silhouette, not for its detail.
  [4, 5, 6, 7, 8, 9].forEach((half, index) => {
    const yy = -18 + index * 3;
    pixel(ctx, -half - 1, yy, half * 2 + 2, 3, ROBE.dark);
    pixel(ctx, -half, yy, half * 2, 3, ROBE.base);
    pixel(ctx, -half, yy, 2, 3, ROBE.light);
    pixel(ctx, half - 2, yy, 2, 3, ROBE.mid);
  });
  pixel(ctx, -9, -2, 19, 2, ROBE_TRIM);
  pixel(ctx, -8, -1, 17, 1, ROBE.light);
  // Chest and shoulders under the cloak.
  pixel(ctx, -5, -28, 11, 9, ROBE.dark);
  pixel(ctx, -4, -27, 9, 7, ROBE.base);
  pixel(ctx, -4, -27, 9, 1, ROBE.light);
  // Sleeves: the left one hangs, the right one grips the staff.
  pixel(ctx, -8, -27, 4, 11, ROBE.mid);
  pixel(ctx, -8, -17, 4, 3, ROBE.dark);
  pixel(ctx, 5, -27, 4, 9, ROBE.base);
  pixel(ctx, 6, -19, 5, 4, ROBE.dark);
  // Staff: dark shaft, gold collar, a green orb that breathes. A caster needs
  // the orb to read from across the arena, so it gets its own dark contour.
  pixel(ctx, 9, -40, 4, 40, ROBE.dark);
  pixel(ctx, 10, -40, 2, 40, ROBE.mid);
  pixel(ctx, 8, -28, 6, 2, ROBE_TRIM);
  roundedMass(ctx, 7, -45, 9, 9, ROBE.dark);
  roundedMass(ctx, 8, -44, 7, 7, HEX.base);
  pixel(ctx, 8, -44, 4, 3, HEX.light);
  pixel(ctx, 12, -42, 2, 4, HEX.mid);
  if (pulse > 0.5) pixel(ctx, 9, -43, 4, 3, HEX.light);
  // Hood: a stepped point over a face that is shadow except two eyes.
  const hood = [11, 13, 15, 15, 15, 15, 13];
  hood.forEach((width, index) => {
    const yy = -39 + index;
    const half = Math.floor(width / 2);
    pixel(ctx, -half - 1, yy, width + 2, 1, ROBE.dark);
    pixel(ctx, -half, yy, width, 1, index < 2 ? ROBE.light : ROBE.base);
  });
  pixel(ctx, -5, -35, 11, 8, '#0f0b17');
  pixel(ctx, -5, -35, 11, 2, ROBE.mid);
  pixel(ctx, -4, -32, 3, 2, HEX.light);
  pixel(ctx, 2, -32, 3, 2, HEX.light);
  pixel(ctx, -3, -27, 7, 2, ROBE.base);
  ctx.restore();
}

const ELITE = { light: '#e07a3c', base: '#b4482c', mid: '#8a2f22', dark: '#5f1d19' };
const ELITE_FLAME = { core: '#ffe9a2', hot: '#f5a63e', ember: '#cf5a1e' };

// Wave 4. Burning elite: the lesser demon grown into a wall of shoulder and
// claw, with fire licking off its back. The flames are attached to the body on
// purpose: a floating fireball would read as scenery, not as the enemy.
export function drawBurningElite(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 4 + seed) % 2;
  const flicker = Math.floor(time * 10 + seed) % 3;
  pose(ctx, x, y, scale);
  pixel(ctx, -11, 0, 23, 2, '#131a20');
  // Heavy hooved legs.
  pixel(ctx, -9, -4, 8, 4, '#2b2430');
  pixel(ctx, 2, -4, 8, 4, '#2b2430');
  pixel(ctx, -8, -15 + stride, 6, 11 - stride, ELITE.mid);
  pixel(ctx, 3, -15 - stride, 6, 11 + stride, ELITE.base);
  pixel(ctx, -8, -15 + stride, 2, 11 - stride, ELITE.base);
  pixel(ctx, -9, -16 + stride, 8, 2, ELITE.dark);
  pixel(ctx, 3, -16 - stride, 8, 2, ELITE.dark);
  // Hips, then a torso that widens into the shoulders.
  pixel(ctx, -8, -22, 17, 8, '#2b2430');
  pixel(ctx, -7, -21, 15, 6, ELITE.mid);
  pixel(ctx, -10, -35, 21, 15, '#2b2430');
  torsoBands(ctx, -9, -34, 19, 13, ELITE);
  pixel(ctx, -9, -34, 19, 1, ELITE.light);
  pixel(ctx, -4, -28, 8, 3, ELITE.dark);
  pixel(ctx, -1, -25, 2, 4, '#f0d27a');
  // Shoulders: bone spikes plus fire that grows out of the body. Each flame is
  // a tapering stack of two-pixel steps: a rectangle would read as a torch.
  pixel(ctx, -13, -37, 4, 4, '#2b2430');
  pixel(ctx, 9, -37, 4, 4, '#2b2430');
  const flame = (bx, baseY, height) => {
    const steps = Math.ceil(height / 2);
    for (let step = 0; step < steps; step++) {
      const width = Math.max(1, Math.round(5 * (steps - step) / steps));
      const tone = step < steps * 0.4 ? ELITE_FLAME.ember
        : step < steps * 0.75 ? ELITE_FLAME.hot : ELITE_FLAME.core;
      pixel(ctx, bx - Math.floor(width / 2), baseY - (step + 1) * 2, width, 2, tone);
    }
  };
  const lick = 1 + flicker % 2;
  flame(-11, -37, 7 + lick);
  flame(-6, -36, 5 + lick);
  flame(11, -37, 7 + lick);
  flame(6, -36, 5 + lick);
  // Arms with three-fingered claws.
  pixel(ctx, -14, -34, 5, 14, ELITE.dark);
  pixel(ctx, -13, -33, 3, 12, ELITE.base);
  pixel(ctx, -15, -21, 7, 5, '#2b2430');
  pixel(ctx, -15, -20, 6, 3, ELITE.mid);
  pixel(ctx, 10, -34, 5, 14, ELITE.dark);
  pixel(ctx, 11, -33, 3, 12, ELITE.mid);
  pixel(ctx, 9, -21, 7, 5, '#2b2430');
  pixel(ctx, 10, -20, 6, 3, ELITE.base);
  // Head: broad, horned, jaw full of teeth.
  roundedMass(ctx, -7, -43, 15, 13, '#2b2430');
  roundedMass(ctx, -6, -42, 13, 11, ELITE.base);
  pixel(ctx, -6, -42, 9, 2, ELITE.light);
  pixel(ctx, -6, -37, 5, 2, ELITE_FLAME.core);
  pixel(ctx, 2, -37, 4, 2, ELITE_FLAME.core);
  pixel(ctx, -5, -33, 11, 3, '#2b2430');
  pixel(ctx, -4, -33, 2, 2, ELITE_FLAME.core);
  pixel(ctx, 0, -33, 2, 2, ELITE_FLAME.core);
  pixel(ctx, 3, -33, 2, 2, ELITE_FLAME.core);
  pixel(ctx, -9, -44, 3, 4, '#2b2430');
  pixel(ctx, 6, -44, 3, 4, '#2b2430');
  ctx.restore();
}

const BAT_FUR = { light: '#6b5a6e', base: '#4a3d4e', mid: '#332a38', dark: '#211b26' };
const BAT_WING = { light: '#5a2430', base: '#3d141d', mid: '#2a0c13' };

// Act 3 — Diablo, Lord Zir's court. The bat swarm: small, dark and fast, with
// the wings attached at the shoulders so the whole body flood-fills as one
// figure. The flap is two poses, not a smooth animation: at this size a swarm is
// read as movement, and two states are enough.
export function drawBatSwarm(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const flap = Math.floor(time * 10 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -7, 0, 15, 2, '#131a20');
  for (let row = 0; row < 3; row++) {
    const yy = -14 + row * 3 + (flap ? row : -row);
    const reach = 6 + row * 4;
    pixel(ctx, -5 - reach, yy, reach, 3, BAT_WING.base);
    pixel(ctx, -5 - reach, yy, 2, 3, BAT_WING.light);
    pixel(ctx, 5, yy, reach, 3, BAT_WING.base);
    pixel(ctx, 3 + reach, yy, 2, 3, BAT_WING.light);
  }
  // Body and head: one furry mass, ears, two red eyes and a pair of fangs.
  roundedMass(ctx, -5, -16, 11, 14, '#1a1620');
  roundedMass(ctx, -4, -15, 9, 12, BAT_FUR.base);
  pixel(ctx, -4, -15, 6, 2, BAT_FUR.light);
  pixel(ctx, -4, -8, 9, 2, BAT_FUR.dark);
  pixel(ctx, -7, -21, 3, 8, BAT_FUR.dark);
  pixel(ctx, 5, -21, 3, 8, BAT_FUR.dark);
  pixel(ctx, -6, -23, 2, 3, BAT_FUR.mid);
  pixel(ctx, 5, -23, 2, 3, BAT_FUR.mid);
  pixel(ctx, -3, -11, 2, 2, '#ff5a4a');
  pixel(ctx, 2, -11, 2, 2, '#ff5a4a');
  pixel(ctx, -2, -7, 5, 2, '#2a1014');
  pixel(ctx, -2, -6, 1, 2, '#e4e0d2');
  pixel(ctx, 2, -6, 1, 2, '#e4e0d2');
  pixel(ctx, -3, -3, 2, 3, BAT_FUR.dark);
  pixel(ctx, 1, -3, 2, 3, BAT_FUR.dark);
  ctx.restore();
}

const ZIR_SKIN = { light: '#d8c0b4', base: '#b58a7c', mid: '#8d5f52', dark: '#5f3a33' };
const ZIR_VEIN = '#7a1d22';
const ZIR_WING = { light: '#8e2f38', base: '#5e1820', mid: '#3d0d14', dark: '#26070c' };
const ZIR_METAL = { light: '#e8e2d2', base: '#b9b2a0', mid: '#8d8676', dark: '#5f5a4e' };
const ZIR_GEM = { light: '#ff8a7a', base: '#c41420', mid: '#8a0c16' };
const ZIR_EYE = '#ff5a4a';

// Act 3 — Diablo, wave 5. Lord Zir, the act's mini-boss: the vampire lord of the
// dungeon, on all fours. The reference is the Diablo IV lord: a crouched body
// with the arms planted forward, a cape of red membrane hanging off the
// shoulders, a long-jawed head with fangs, the three-spike crown with its red
// gem, the silver collar with the bloodstone, and veins running under the skin.
export function drawLordZir(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const breath = Math.floor(time * 2) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -30, 0, 61, 3, '#131a20');
  // The cape: red membrane falling off both shoulders to the floor, drawn first
  // so the body covers where it is stitched on. Each row reaches further out as
  // it falls, and the trailing edge is torn.
  for (let row = 0; row < 11; row++) {
    const yy = -40 + row * 3;
    const reach = 14 + row * 3 + (breath ? 1 : 0);
    pixel(ctx, -21 - reach, yy, reach, 3, ZIR_WING.base);
    pixel(ctx, -21 - reach, yy, 2, 3, ZIR_WING.light);
    pixel(ctx, -23 - reach, yy, 2, 3, ZIR_WING.dark);
    pixel(ctx, 21, yy, reach, 3, ZIR_WING.base);
    pixel(ctx, 19 + reach, yy, 2, 3, ZIR_WING.light);
    pixel(ctx, 21 + reach, yy, 2, 3, ZIR_WING.dark);
    if (row % 3 === 2) {
      pixel(ctx, -21 - reach, yy + 1, 3, 2, ZIR_WING.dark);
      pixel(ctx, 18 + reach, yy + 1, 3, 2, ZIR_WING.dark);
    }
  }
  // Haunches folded under the body, then the long torso between them.
  roundedMass(ctx, -27, -28, 15, 27, '#1a1013');
  roundedMass(ctx, -26, -27, 13, 25, ZIR_SKIN.mid);
  pixel(ctx, -26, -27, 5, 3, ZIR_SKIN.base);
  roundedMass(ctx, 11, -28, 15, 27, '#1a1013');
  roundedMass(ctx, 12, -27, 13, 25, ZIR_SKIN.mid);
  pixel(ctx, 12, -27, 5, 3, ZIR_SKIN.base);
  roundedMass(ctx, -21, -42, 43, 29, '#1a1013');
  roundedMass(ctx, -20, -41, 41, 27, ZIR_SKIN.base);
  pixel(ctx, -20, -41, 16, 3, ZIR_SKIN.light);
  pixel(ctx, -20, -16, 41, 3, ZIR_SKIN.dark);
  // Veins under the skin and the blood down the belly.
  for (let vein = 0; vein < 5; vein++) {
    pixel(ctx, -17 + vein * 8, -37 + (vein % 3) * 2, 2, 9 + (vein % 3) * 4, ZIR_VEIN);
  }
  pixel(ctx, -4, -30, 9, 12, ZIR_VEIN);
  pixel(ctx, 6, -36, 3, 10, ZIR_VEIN);
  // Arms planted forward: upper arm, forearm and a hand of four claws.
  for (const side of [-1, 1]) {
    const ax = side < 0 ? -34 : 25;
    pixel(ctx, ax, -40, 9, 22, '#1a1013');
    pixel(ctx, ax + 1, -39, 7, 20, side < 0 ? ZIR_SKIN.base : ZIR_SKIN.mid);
    pixel(ctx, ax + 1, -39, 2, 20, ZIR_SKIN.light);
    pixel(ctx, ax - 2, -20, 13, 18, '#1a1013');
    pixel(ctx, ax - 1, -19, 11, 16, side < 0 ? ZIR_SKIN.mid : ZIR_SKIN.base);
    pixel(ctx, ax - 3, -4, 15, 4, '#1a1013');
    pixel(ctx, ax - 2, -3, 13, 3, ZIR_SKIN.dark);
    for (let claw = 0; claw < 4; claw++) {
      pixel(ctx, ax - 2 + claw * 4, -1, 2, 3, ZIR_METAL.base);
      pixel(ctx, ax - 1 + claw * 4, -1, 1, 2, ZIR_METAL.light);
    }
  }
  // Silver collar with the bloodstone, sitting on the chest.
  pixel(ctx, -9, -38, 19, 3, ZIR_METAL.mid);
  pixel(ctx, -9, -38, 19, 1, ZIR_METAL.light);
  pixel(ctx, -10, -36, 3, 4, ZIR_METAL.base);
  pixel(ctx, 8, -36, 3, 4, ZIR_METAL.base);
  pixel(ctx, -4, -35, 9, 8, ZIR_METAL.mid);
  pixel(ctx, -3, -34, 7, 6, ZIR_GEM.base);
  pixel(ctx, -2, -33, 4, 3, ZIR_GEM.light);
  pixel(ctx, 2, -31, 2, 2, ZIR_GEM.mid);
  // Head: long jaw, red eyes, fangs, and the crown on top.
  roundedMass(ctx, -11, -57, 23, 22, '#1a1013');
  roundedMass(ctx, -10, -56, 21, 20, ZIR_SKIN.base);
  pixel(ctx, -10, -56, 14, 3, ZIR_SKIN.light);
  pixel(ctx, -10, -39, 21, 3, ZIR_SKIN.dark);
  pixel(ctx, -9, -51, 6, 3, ZIR_EYE);
  pixel(ctx, 3, -51, 6, 3, ZIR_EYE);
  pixel(ctx, -8, -50, 3, 2, '#2a0a0c');
  pixel(ctx, 4, -50, 3, 2, '#2a0a0c');
  pixel(ctx, -8, -47, 2, 4, ZIR_VEIN);
  pixel(ctx, 6, -47, 2, 4, ZIR_VEIN);
  // The grin: a wide mouth of fangs across the whole face.
  pixel(ctx, -9, -45, 19, 5, '#1a1013');
  pixel(ctx, -8, -45, 17, 3, '#3a1014');
  for (let fang = 0; fang < 6; fang++) pixel(ctx, -8 + fang * 3, -45, 2, 3, ZIR_METAL.light);
  for (let fang = 0; fang < 5; fang++) pixel(ctx, -7 + fang * 3, -42, 1, 2, ZIR_METAL.base);
  pixel(ctx, -8, -40, 17, 1, ZIR_SKIN.mid);
  // Ears: two long blades swept back and up from the temples.
  const blade = (bx, by, w, h, tone) => {
    const half = Math.ceil(w / 2);
    for (let i = 0; i < w; i++) {
      const column = Math.min(i, w - 1 - i);
      const height = Math.max(1, Math.round(h * (column + 1) / half));
      pixel(ctx, bx + i, by - height, 1, height, tone);
    }
  };
  blade(-24, -52, 11, 16, '#1a1013');
  blade(-23, -52, 9, 13, ZIR_SKIN.base);
  blade(13, -52, 11, 16, '#1a1013');
  blade(14, -52, 9, 13, ZIR_SKIN.mid);
  // Crown: a silver band across the brow carrying three spikes, with the red gem
  // set in the middle one. It sits in front of the ears on purpose: the ears are
  // skin, the crown is metal, and the two must not be confused at game scale.
  pixel(ctx, -13, -58, 27, 3, ZIR_METAL.dark);
  pixel(ctx, -12, -58, 25, 2, ZIR_METAL.base);
  pixel(ctx, -12, -58, 25, 1, ZIR_METAL.light);
  for (const [spikeX, spikeH, tilt] of [[-11, 14, -1], [-3, 19, 0], [6, 14, 1]]) {
    for (let step = 0; step < spikeH; step++) {
      const width = Math.max(2, 7 - Math.floor(step / 3));
      const xx = spikeX + (tilt === 0 ? 0 : Math.round((step / spikeH) * tilt * 3));
      pixel(ctx, xx, -59 - step, width, 1, ZIR_METAL.base);
      pixel(ctx, xx, -59 - step, Math.max(1, width - 3), 1, ZIR_METAL.light);
      pixel(ctx, xx + width - 2, -59 - step, 2, 1, ZIR_METAL.dark);
    }
  }
  pixel(ctx, -4, -57, 9, 6, ZIR_METAL.mid);
  pixel(ctx, -3, -56, 7, 4, ZIR_GEM.base);
  pixel(ctx, -2, -55, 3, 2, ZIR_GEM.light);
  // The red sash under the belly, torn, so the crouch is not one flat slab.
  pixel(ctx, -15, -16, 31, 9, '#1a1013');
  pixel(ctx, -14, -15, 29, 7, ZIR_WING.base);
  pixel(ctx, -14, -15, 29, 1, ZIR_WING.light);
  pixel(ctx, -9, -8, 5, 4, ZIR_WING.base);
  pixel(ctx, 2, -8, 7, 5, ZIR_WING.base);
  pixel(ctx, 10, -8, 3, 3, ZIR_WING.base);
  ctx.restore();
}

const LILITH_SKIN = { light: '#eef2f6', base: '#cdd5de', mid: '#a3adb9', dark: '#6d7885' };
const LILITH_HORN = { light: '#928aa0', base: '#5e5468', mid: '#3b3346', dark: '#221c2c' };
const LILITH_DRESS = { light: '#4a4553', base: '#2e2a36', mid: '#1d1a24', dark: '#100e15' };
const LILITH_WING = { light: '#6a4450', base: '#3e2733', mid: '#281722', dark: '#150c12' };
const LILITH_WING_IN = { light: '#8a4436', base: '#5e2a25', mid: '#3d1a18' };
const LILITH_METAL = { light: '#d8d4cc', base: '#a09a90', mid: '#736e66', dark: '#4a463f' };
const LILITH_RED = { light: '#c42436', base: '#8e1222', mid: '#5f0a15' };

// Act 3 — Diablo, wave 6. Lilith, the act's boss. The reference is her standing
// portrait: huge black wings spread behind her, a crown of horns over a pale
// face, a long dark gown with a steel bodice and a red sash down the front.
// The wings are the silhouette, so they reach the furthest and are drawn first.
export function drawLilith(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const sway = Math.floor(time * 2) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -28, 0, 57, 3, '#131a20');
  // Wings: black membrane over red-brown inner skin, each row reaching further
  // out as it falls, with the bone spars on top and a claw at the shoulder.
  for (let row = 0; row < 12; row++) {
    const yy = -68 + row * 4;
    const reach = 18 + row * 3 + (sway ? row % 2 : 0);
    pixel(ctx, -13 - reach, yy, reach, 4, LILITH_WING.base);
    pixel(ctx, -13 - reach, yy, 2, 4, LILITH_WING.light);
    pixel(ctx, -15 - reach, yy, 2, 4, LILITH_WING.dark);
    pixel(ctx, 13, yy, reach, 4, LILITH_WING.base);
    pixel(ctx, 11 + reach, yy, 2, 4, LILITH_WING.light);
    pixel(ctx, 13 + reach, yy, 2, 4, LILITH_WING.dark);
    // The inner membrane is the reddish one: two rows nearest the body.
    if (row < 7) {
      pixel(ctx, -13 - reach, yy + 1, 10, 2, LILITH_WING_IN.base);
      pixel(ctx, 3 + reach, yy + 1, 10, 2, LILITH_WING_IN.mid);
    }
    if (row % 3 === 2) {
      pixel(ctx, -13 - reach, yy + 3, 5, 1, LILITH_WING.dark);
      pixel(ctx, 8 + reach, yy + 3, 5, 1, LILITH_WING.dark);
    }
  }
  // Bone spars: three per wing, drawn over the membrane as diagonals.
  const spar = (bx, by, dx, dy, steps, tone) => {
    for (let step = 0; step < steps; step++) {
      // Steps overlap on both axes, so the spar is a continuous diagonal.
      pixel(ctx, bx + dx * step, by + dy * step, 4, 4, tone);
    }
  };
  for (const side of [-1, 1]) {
    const sx = side < 0 ? -12 : 8;
    spar(sx, -68, side * 3, 2, 14, LILITH_METAL.dark);
    spar(sx, -62, side * 3, 3, 10, LILITH_METAL.dark);
    spar(sx, -54, side * 3, 4, 7, LILITH_METAL.dark);
    // The shoulder claw that opens the wing.
    pixel(ctx, side < 0 ? -18 : 14, -70, 5, 6, LILITH_WING.dark);
    pixel(ctx, side < 0 ? -19 : 15, -73, 3, 4, LILITH_METAL.mid);
  }
  // Gown: a long flare, torn at the hem, with the red sash down the front.
  [7, 8, 9, 10, 11, 12, 13, 13, 14].forEach((half, index) => {
    const yy = -50 + index * 6;
    pixel(ctx, -half - 1, yy, half * 2 + 2, 6, LILITH_DRESS.dark);
    pixel(ctx, -half, yy, half * 2, 6, LILITH_DRESS.base);
    pixel(ctx, -half, yy, 4, 6, LILITH_DRESS.light);
    pixel(ctx, half - 5, yy, 5, 6, LILITH_DRESS.mid);
  });
  const tears = [-14, -9, -4, 1, 6, 11];
  tears.forEach((tear, index) => {
    pixel(ctx, tear, -3 - (index % 2), 4, 4 + (index % 3), LILITH_DRESS.base);
  });
  pixel(ctx, -4, -48, 8, 24, LILITH_RED.base);
  pixel(ctx, -4, -48, 3, 24, LILITH_RED.light);
  pixel(ctx, -4, -24, 8, 3, LILITH_RED.mid);
  pixel(ctx, -3, -8, 6, 5, LILITH_RED.base);
  // Steel bodice with the red stone, then the pale shoulders above it.
  [10, 9, 8].forEach((half, index) => {
    const yy = -62 + index * 4;
    pixel(ctx, -half - 1, yy, half * 2 + 2, 4, LILITH_METAL.dark);
    pixel(ctx, -half, yy, half * 2, 4, LILITH_METAL.base);
    pixel(ctx, -half, yy, 3, 4, LILITH_METAL.light);
    pixel(ctx, half - 3, yy, 3, 4, LILITH_METAL.mid);
  });
  pixel(ctx, -3, -60, 7, 7, LILITH_RED.mid);
  pixel(ctx, -2, -59, 5, 5, LILITH_RED.base);
  pixel(ctx, -1, -58, 2, 2, LILITH_RED.light);
  roundedMass(ctx, -11, -68, 23, 10, LILITH_DRESS.dark);
  roundedMass(ctx, -10, -67, 21, 8, LILITH_SKIN.base);
  pixel(ctx, -10, -67, 11, 2, LILITH_SKIN.light);
  // Arms: pale, folded in front, with the long dark sleeves.
  for (const side of [-1, 1]) {
    const ax = side < 0 ? -15 : 10;
    pixel(ctx, ax, -68, 5, 13, LILITH_DRESS.dark);
    pixel(ctx, ax + 1, -67, 3, 11, LILITH_SKIN.mid);
    pixel(ctx, ax + (side < 0 ? 2 : -2), -56, 6, 5, LILITH_SKIN.light);
  }
  // Face: pale, narrow, with white eyes and dark lips.
  const face = [13, 13, 12, 11, 10, 9, 8];
  face.forEach((width, index) => {
    const yy = -80 + index * 2;
    const half = Math.floor(width / 2);
    pixel(ctx, -half - 1, yy, width + 2, 2, LILITH_HORN.dark);
    pixel(ctx, -half, yy, width, 2, LILITH_SKIN.base);
    pixel(ctx, -half, yy, 2, 2, LILITH_SKIN.light);
    pixel(ctx, half - 2, yy, 2, 2, LILITH_SKIN.mid);
  });
  pixel(ctx, -4, -76, 3, 2, '#e8fbff');
  pixel(ctx, 2, -76, 3, 2, '#e8fbff');
  pixel(ctx, -3, -75, 1, 1, '#1c2a36');
  pixel(ctx, 3, -75, 1, 1, '#1c2a36');
  pixel(ctx, -3, -72, 6, 2, '#3a2630');
  // Horn crown: two big horns curving out and up, plus smaller spikes between,
  // over a dark band that ties the crown to the brow.
  pixel(ctx, -9, -82, 19, 3, LILITH_HORN.base);
  pixel(ctx, -9, -82, 19, 1, LILITH_HORN.light);
  const bigHorn = [[-9, -82], [-12, -84], [-14, -87], [-15, -90], [-15, -94], [-14, -98]];
  bigHorn.forEach(([hx, hy], index) => {
    const width = index < 3 ? 5 : 4;
    pixel(ctx, hx, hy, width, 3, LILITH_HORN.base);
    pixel(ctx, hx, hy, width, 1, index < 4 ? LILITH_HORN.light : LILITH_HORN.mid);
    const rx = 8 - hx;
    pixel(ctx, rx - width, hy, width, 3, LILITH_HORN.base);
    pixel(ctx, rx - width, hy, width, 1, index < 4 ? LILITH_HORN.light : LILITH_HORN.mid);
  });
  for (const [sx, height] of [[-5, 6], [0, 8], [3, 6]]) {
    for (let step = 0; step < height; step++) {
      const width = Math.max(1, 4 - Math.floor(step / 2));
      pixel(ctx, sx, -83 - step, width, 1, step < 2 ? LILITH_HORN.light : LILITH_HORN.base);
    }
  }
  ctx.restore();
}


// Act 4 — Conan Exiles. The desert cast: sun-bleached cloth, packed leather,
// bronze skin and the camp's iron. Same grid and same closed ink contour as the
// rest of the game, so a wave of them never competes with the player.
const DESERT_SKIN = { light: '#e6b07a', base: '#c0854e', mid: '#9c6636', dark: '#6d4524' };
const DESERT_LEATHER = { light: '#8a5a33', base: '#5e3a1f', mid: '#442a15', dark: '#2b1a0c' };
const DESERT_CLOTH = { light: '#e0d3ae', base: '#b7a678', mid: '#8d7f57', dark: '#62573a' };
const DESERT_IRON = { light: '#d8d4d6', base: '#9a969e', mid: '#6d6a72', dark: '#3f3d44' };
const DESERT_FUR = { light: '#efe3c4', base: '#c8b88f', dark: '#94845f' };
const DESERT_RED = { light: '#c94f3b', base: '#a03225', mid: '#762219', dark: '#4d130d' };
const DESERT_INK = '#171310';
const DESERT_WOOD = { light: '#7d5731', base: '#563a1a', dark: '#31200e' };
const ROPE = { light: '#e6d6ac', base: '#c9b383', dark: '#9c8459' };
const EXILE_INDIGO = { light: '#436875', base: '#2c4952', mid: '#1d343b', dark: '#112228' };
const EXILE_OLIVE = { light: '#7f8d4f', base: '#5d6b3a', mid: '#46512a', dark: '#2e3619' };
const LOTUS = { light: '#ffe9a0', base: '#f0c24e', mid: '#c4912a', dark: '#8a5f18' };
const SPORE = '#b6e06a';

// Wave 1. Barbarian: the desert raider, bare bronze chest, a harness across the
// ribs, a dark kilt and the stone axe resting on his shoulder. The read is the
// wide shoulders, the red band of war paint and the axe; material stays at one
// shade and one highlight so a crowd still reads.
export function drawBarbarian(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 4 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -10, 0, 20, 2, '#131a20');
  // Legs: ink contour, bronze thigh, leather wrap over the shin, strapped boot.
  pixel(ctx, -8, -15 + stride, 7, 15 - stride, DESERT_INK);
  pixel(ctx, -7, -14 + stride, 5, 13 - stride, DESERT_SKIN.base);
  pixel(ctx, -7, -14 + stride, 2, 12 - stride, DESERT_SKIN.light);
  pixel(ctx, -7, -7 + stride, 5, 3, DESERT_LEATHER.base);
  pixel(ctx, -8, -4 + stride, 7, 4, DESERT_INK);
  pixel(ctx, -7, -3 + stride, 5, 2, DESERT_LEATHER.dark);
  pixel(ctx, -7, -3 + stride, 5, 1, DESERT_LEATHER.mid);
  pixel(ctx, 1, -15 - stride, 7, 15 + stride, DESERT_INK);
  pixel(ctx, 2, -14 - stride, 5, 13 + stride, DESERT_SKIN.mid);
  pixel(ctx, 2, -14 - stride, 2, 12 + stride, DESERT_SKIN.base);
  pixel(ctx, 2, -7 - stride, 5, 3, DESERT_LEATHER.base);
  pixel(ctx, 1, -4 - stride, 7, 4, DESERT_INK);
  pixel(ctx, 2, -3 - stride, 5, 2, DESERT_LEATHER.base);
  pixel(ctx, 2, -3 - stride, 5, 1, DESERT_LEATHER.mid);
  // Kilt: dark leather with a red strip over the front leg.
  pixel(ctx, -9, -24, 19, 10, DESERT_INK);
  pixel(ctx, -8, -23, 17, 8, DESERT_LEATHER.base);
  pixel(ctx, -8, -23, 17, 1, DESERT_LEATHER.light);
  pixel(ctx, -8, -16, 17, 1, DESERT_LEATHER.dark);
  pixel(ctx, -2, -23, 5, 8, DESERT_RED.base);
  pixel(ctx, -1, -22, 3, 6, DESERT_RED.light);
  pixel(ctx, -8, -21, 17, 2, DESERT_LEATHER.dark);
  pixel(ctx, -1, -21, 3, 2, DESERT_IRON.base);
  // Torso: bronze chest under a diagonal harness, with the pecs in shadow.
  pixel(ctx, -10, -38, 21, 19, DESERT_INK);
  torsoBands(ctx, -8, -37, 17, 17, DESERT_SKIN);
  pixel(ctx, -8, -37, 17, 1, DESERT_SKIN.light);
  pixel(ctx, -8, -31, 17, 1, DESERT_SKIN.dark);
  pixel(ctx, -1, -30, 2, 9, DESERT_SKIN.mid);
  pixel(ctx, -7, -34, 5, 2, DESERT_SKIN.dark);
  pixel(ctx, 2, -34, 5, 2, DESERT_SKIN.dark);
  pixel(ctx, -8, -38, 4, 4, DESERT_LEATHER.base);
  pixel(ctx, -4, -35, 4, 4, DESERT_LEATHER.base);
  pixel(ctx, 0, -32, 4, 4, DESERT_LEATHER.base);
  pixel(ctx, 4, -29, 4, 4, DESERT_LEATHER.base);
  pixel(ctx, 1, -31, 2, 2, DESERT_IRON.base);
  pixel(ctx, 1, -31, 1, 1, DESERT_IRON.light);
  // Fur mantle over one shoulder only, so the silhouette is not symmetric.
  pixel(ctx, -15, -40, 8, 8, DESERT_INK);
  roundedMass(ctx, -14, -39, 6, 6, DESERT_FUR.base);
  pixel(ctx, -14, -39, 4, 2, DESERT_FUR.light);
  pixel(ctx, -14, -35, 5, 1, DESERT_FUR.dark);
  pixel(ctx, 9, -40, 6, 5, DESERT_INK);
  roundedMass(ctx, 10, -39, 4, 4, DESERT_FUR.dark);
  // Left arm hangs with a fist; the right hand grips the axe on the shoulder.
  pixel(ctx, -14, -36 + stride, 5, 13, DESERT_INK);
  pixel(ctx, -13, -35 + stride, 3, 12, DESERT_SKIN.base);
  pixel(ctx, -13, -35 + stride, 1, 11, DESERT_SKIN.light);
  pixel(ctx, -15, -24 + stride, 6, 5, DESERT_INK);
  pixel(ctx, -14, -23 + stride, 4, 3, DESERT_SKIN.light);
  pixel(ctx, 9, -36 - stride, 5, 11, DESERT_INK);
  pixel(ctx, 10, -35 - stride, 3, 10, DESERT_SKIN.mid);
  pixel(ctx, 8, -26 - stride, 6, 5, DESERT_INK);
  pixel(ctx, 9, -25 - stride, 4, 3, DESERT_SKIN.base);
  // Stone axe: dark haft, iron head by the shoulder, one lit edge.
  pixel(ctx, 10, -42, 2, 20, DESERT_WOOD.dark);
  pixel(ctx, 10, -42, 1, 19, DESERT_WOOD.base);
  pixel(ctx, 6, -44, 12, 7, DESERT_INK);
  pixel(ctx, 7, -43, 10, 5, DESERT_IRON.base);
  pixel(ctx, 7, -43, 8, 1, DESERT_IRON.light);
  pixel(ctx, 7, -40, 10, 2, DESERT_IRON.dark);
  pixel(ctx, 15, -43, 2, 5, DESERT_IRON.mid);
  // Head: shaved sides, short hair, beard and the red band of war paint.
  roundedMass(ctx, -8, -44, 17, 14, DESERT_INK);
  roundedMass(ctx, -7, -43, 15, 12, DESERT_SKIN.base);
  pixel(ctx, -7, -43, 11, 3, DESERT_SKIN.light);
  pixel(ctx, -8, -41, 2, 5, '#3a2c1c');
  pixel(ctx, 7, -41, 2, 5, '#3a2c1c');
  pixel(ctx, -7, -38, 15, 3, DESERT_RED.base);
  pixel(ctx, -7, -38, 15, 1, DESERT_RED.light);
  pixel(ctx, -3, -36, 3, 2, DESERT_INK);
  pixel(ctx, 3, -36, 3, 2, DESERT_INK);
  pixel(ctx, -1, -33, 3, 2, DESERT_SKIN.mid);
  pixel(ctx, -5, -31, 11, 2, DESERT_INK);
  pixel(ctx, -4, -31, 9, 1, '#4a3a26');
  pixel(ctx, -8, -34, 3, 4, DESERT_SKIN.dark);
  pixel(ctx, 7, -34, 3, 4, DESERT_SKIN.dark);
  ctx.restore();
}

// Wave 2. Archer: the guard on the wall. Olive tunic and a cream head wrap, so
// it reads as the camp's own against the sand; the bow is the largest shape on
// the body because a ranged kind has to be legible from across the pen.
export function drawArcher(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 5 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -9, 0, 18, 2, '#131a20');
  // Sandals, wrapped shins and the tunic hem.
  pixel(ctx, -7, -3, 6, 3, DESERT_WOOD.dark);
  pixel(ctx, 1, -3, 6, 3, DESERT_WOOD.base);
  pixel(ctx, -6, -13 + stride, 4, 10 - stride, DESERT_INK);
  pixel(ctx, -6, -12 + stride, 2, 9 - stride, DESERT_SKIN.base);
  pixel(ctx, -6, -8 + stride, 4, 2, DESERT_CLOTH.mid);
  pixel(ctx, 2, -13 - stride, 4, 10 + stride, DESERT_INK);
  pixel(ctx, 2, -12 - stride, 2, 9 + stride, DESERT_SKIN.mid);
  pixel(ctx, 2, -8 - stride, 4, 2, DESERT_CLOTH.mid);
  pixel(ctx, -8, -21, 17, 10, DESERT_INK);
  pixel(ctx, -7, -20, 15, 8, EXILE_OLIVE.base);
  pixel(ctx, -7, -20, 15, 1, EXILE_OLIVE.light);
  pixel(ctx, -7, -14, 15, 1, EXILE_OLIVE.dark);
  pixel(ctx, -2, -20, 4, 8, EXILE_OLIVE.mid);
  // Torso: olive tunic, leather belt, shoulder strap.
  pixel(ctx, -9, -34, 19, 14, DESERT_INK);
  torsoBands(ctx, -8, -33, 17, 12, EXILE_OLIVE);
  pixel(ctx, -8, -33, 17, 1, EXILE_OLIVE.light);
  pixel(ctx, -8, -22, 17, 2, DESERT_LEATHER.dark);
  pixel(ctx, -1, -22, 3, 2, DESERT_IRON.base);
  pixel(ctx, -3, -33, 3, 9, DESERT_LEATHER.base);
  pixel(ctx, 1, -26, 3, 3, DESERT_LEATHER.mid);
  // Arms: the left holds the bow out, the right draws the string.
  pixel(ctx, -12, -33 + stride, 5, 11, DESERT_INK);
  pixel(ctx, -11, -32 + stride, 3, 10, DESERT_SKIN.base);
  pixel(ctx, -11, -32 + stride, 1, 9, DESERT_SKIN.light);
  pixel(ctx, 8, -33 - stride, 4, 11, DESERT_INK);
  pixel(ctx, 9, -32 - stride, 2, 10, DESERT_SKIN.mid);
  // Quiver over the right shoulder with two red fletchings.
  pixel(ctx, 8, -35, 6, 13, DESERT_INK);
  pixel(ctx, 9, -34, 4, 11, DESERT_LEATHER.base);
  pixel(ctx, 9, -34, 1, 10, DESERT_LEATHER.light);
  pixel(ctx, 9, -38, 3, 3, DESERT_RED.base);
  pixel(ctx, 12, -38, 2, 3, DESERT_CLOTH.light);
  // Bow: a dark arc in front of the body, strung, with the arrow nocked.
  pixel(ctx, -18, -36, 4, 5, DESERT_INK);
  pixel(ctx, -17, -35, 2, 4, DESERT_WOOD.base);
  pixel(ctx, -20, -31, 6, 12, DESERT_INK);
  pixel(ctx, -19, -30, 4, 10, DESERT_WOOD.base);
  pixel(ctx, -19, -30, 1, 10, DESERT_WOOD.light);
  pixel(ctx, -18, -18, 5, 5, DESERT_INK);
  pixel(ctx, -17, -17, 3, 4, DESERT_WOOD.base);
  pixel(ctx, -16, -31, 1, 13, ROPE.light);
  pixel(ctx, -14, -26, 18, 2, DESERT_INK);
  pixel(ctx, -13, -26, 17, 1, DESERT_CLOTH.light);
  pixel(ctx, 4, -27, 3, 4, DESERT_IRON.base);
  pixel(ctx, 4, -27, 3, 1, DESERT_IRON.light);
  pixel(ctx, -13, -27, 3, 3, DESERT_RED.base);
  // Head: cream wrap, only the eyes and nose showing.
  roundedMass(ctx, -7, -45, 14, 13, DESERT_INK);
  roundedMass(ctx, -6, -44, 12, 11, DESERT_CLOTH.base);
  pixel(ctx, -6, -44, 12, 1, DESERT_CLOTH.light);
  pixel(ctx, -6, -45, 12, 2, DESERT_CLOTH.dark);
  pixel(ctx, -6, -39, 12, 3, DESERT_SKIN.base);
  pixel(ctx, -6, -39, 12, 1, DESERT_SKIN.light);
  pixel(ctx, -4, -38, 3, 1, DESERT_INK);
  pixel(ctx, 2, -38, 3, 1, DESERT_INK);
  pixel(ctx, -1, -36, 3, 2, DESERT_SKIN.mid);
  pixel(ctx, -6, -34, 12, 2, DESERT_CLOTH.mid);
  pixel(ctx, 5, -43, 4, 6, DESERT_CLOTH.dark);
  ctx.restore();
}

// Wave 2. Slaver: the camp's crew, heavier than a raider. Indigo vest open over
// the chest, a rope coil and the net he throws slung over one shoulder. The net
// is a handful of crossed strands, not a texture: at two pixels a strand a grid
// turns the body grey.
export function drawSlaver(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 4 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -10, 0, 20, 2, '#131a20');
  // Heavy boots and wrapped trousers.
  pixel(ctx, -8, -5, 7, 5, DESERT_INK);
  pixel(ctx, -7, -4, 5, 4, DESERT_LEATHER.dark);
  pixel(ctx, 1, -5, 7, 5, DESERT_INK);
  pixel(ctx, 2, -4, 5, 4, DESERT_LEATHER.base);
  pixel(ctx, -7, -1, 5, 1, DESERT_LEATHER.mid);
  pixel(ctx, 2, -1, 5, 1, DESERT_LEATHER.light);
  pixel(ctx, -7, -15 + stride, 6, 10 - stride, DESERT_INK);
  pixel(ctx, -6, -14 + stride, 4, 9 - stride, DESERT_CLOTH.base);
  pixel(ctx, -6, -14 + stride, 1, 8 - stride, DESERT_CLOTH.light);
  pixel(ctx, 2, -15 - stride, 6, 10 + stride, DESERT_INK);
  pixel(ctx, 3, -14 - stride, 4, 9 + stride, DESERT_CLOTH.mid);
  pixel(ctx, 3, -14 - stride, 1, 8 + stride, DESERT_CLOTH.base);
  pixel(ctx, -6, -8 + stride, 4, 1, DESERT_CLOTH.dark);
  pixel(ctx, 3, -8 - stride, 4, 1, DESERT_CLOTH.dark);
  // Hips: the trousers' waist closes the gap between the belt and both legs.
  pixel(ctx, -8, -23, 17, 10, DESERT_INK);
  pixel(ctx, -7, -22, 15, 9, DESERT_CLOTH.base);
  pixel(ctx, -7, -22, 15, 1, DESERT_CLOTH.light);
  pixel(ctx, -7, -14, 15, 1, DESERT_CLOTH.dark);
  pixel(ctx, -2, -22, 4, 8, DESERT_CLOTH.mid);
  // Torso: barrel chest under the open indigo vest.
  pixel(ctx, -11, -38, 23, 17, DESERT_INK);
  torsoBands(ctx, -8, -37, 17, 15, DESERT_SKIN);
  pixel(ctx, -8, -37, 17, 1, DESERT_SKIN.light);
  pixel(ctx, -1, -32, 2, 9, DESERT_SKIN.dark);
  pixel(ctx, -10, -38, 6, 17, EXILE_INDIGO.base);
  pixel(ctx, -10, -38, 2, 16, EXILE_INDIGO.light);
  pixel(ctx, -5, -38, 1, 17, EXILE_INDIGO.dark);
  pixel(ctx, 6, -38, 6, 17, EXILE_INDIGO.base);
  pixel(ctx, 10, -38, 2, 16, EXILE_INDIGO.dark);
  pixel(ctx, 6, -38, 1, 17, EXILE_INDIGO.mid);
  pixel(ctx, -4, -31, 2, 2, DESERT_LEATHER.mid);
  pixel(ctx, 4, -31, 2, 2, DESERT_LEATHER.mid);
  pixel(ctx, -8, -24, 17, 3, DESERT_LEATHER.dark);
  pixel(ctx, -1, -24, 3, 3, DESERT_IRON.base);
  pixel(ctx, -1, -24, 1, 1, DESERT_IRON.light);
  // Rope coil at the left hip.
  pixel(ctx, -14, -23, 6, 8, DESERT_INK);
  roundedMass(ctx, -13, -22, 4, 6, ROPE.base);
  pixel(ctx, -13, -22, 3, 1, ROPE.light);
  pixel(ctx, -13, -19, 3, 1, ROPE.dark);
  // Net over the right shoulder: crossed strands ending on the vest.
  pixel(ctx, 4, -41, 10, 3, DESERT_INK);
  pixel(ctx, 5, -40, 8, 1, ROPE.base);
  pixel(ctx, 5, -40, 8, 1, ROPE.light);
  pixel(ctx, 6, -39, 1, 14, ROPE.base);
  pixel(ctx, 11, -39, 1, 12, ROPE.light);
  pixel(ctx, 5, -33, 8, 1, ROPE.base);
  pixel(ctx, 5, -27, 8, 1, ROPE.dark);
  pixel(ctx, 8, -39, 1, 13, ROPE.dark);
  pixel(ctx, 3, -24, 1, 6, ROPE.base);
  // Left arm hangs; the right holds the short blade out.
  pixel(ctx, -15, -36 + stride, 5, 13, DESERT_INK);
  pixel(ctx, -14, -35 + stride, 3, 12, DESERT_SKIN.base);
  pixel(ctx, -14, -35 + stride, 1, 11, DESERT_SKIN.light);
  pixel(ctx, -16, -24 + stride, 6, 5, DESERT_INK);
  pixel(ctx, -15, -23 + stride, 4, 3, DESERT_SKIN.mid);
  pixel(ctx, 10, -36 - stride, 5, 12, DESERT_INK);
  pixel(ctx, 11, -35 - stride, 3, 11, DESERT_SKIN.base);
  pixel(ctx, 9, -25 - stride, 6, 5, DESERT_INK);
  pixel(ctx, 10, -24 - stride, 4, 3, DESERT_SKIN.light);
  // Short blade angled out of the fist: haft, guard, lit edge.
  pixel(ctx, 13, -24 - stride, 3, 12, DESERT_INK);
  pixel(ctx, 14, -23 - stride, 2, 10, DESERT_IRON.base);
  pixel(ctx, 14, -23 - stride, 1, 9, DESERT_IRON.light);
  pixel(ctx, 12, -27 - stride, 6, 3, DESERT_INK);
  pixel(ctx, 13, -26 - stride, 4, 1, DESERT_WOOD.base);
  // Head: shaved, leather band round the brow, short beard.
  roundedMass(ctx, -8, -44, 16, 14, DESERT_INK);
  roundedMass(ctx, -7, -43, 14, 12, DESERT_SKIN.base);
  pixel(ctx, -7, -43, 10, 2, DESERT_SKIN.light);
  pixel(ctx, -7, -39, 14, 2, DESERT_LEATHER.base);
  pixel(ctx, -7, -39, 14, 1, DESERT_LEATHER.light);
  pixel(ctx, -4, -36, 3, 2, DESERT_INK);
  pixel(ctx, 3, -36, 3, 2, DESERT_INK);
  pixel(ctx, -1, -33, 3, 2, DESERT_SKIN.mid);
  pixel(ctx, -6, -31, 12, 3, DESERT_INK);
  pixel(ctx, -5, -31, 10, 1, '#4a3418');
  ctx.restore();
}

// Wave 4. Alchemist: robed, hooded, a flask of Yellow Lotus in each hand and a
// belt of vials. The mustard robe and the lotus yellow are the act's own trade,
// and they keep it legible against sand and against the archer's olive.
export function drawAlchemist(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 5 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -9, 0, 18, 2, '#131a20');
  // Feet barely show under the robe; the hem moves instead.
  pixel(ctx, -6, -3, 5, 3, DESERT_LEATHER.dark);
  pixel(ctx, 1, -3, 5, 3, DESERT_LEATHER.base);
  pixel(ctx, -7, -5 + stride, 7, 3, DESERT_CLOTH.dark);
  pixel(ctx, 1, -5 - stride, 7, 3, DESERT_CLOTH.dark);
  // Robe: ink contour, layered skirt, dark front panel.
  pixel(ctx, -10, -32, 21, 29, DESERT_INK);
  roundedMass(ctx, -9, -31, 19, 28, DESERT_CLOTH.base);
  pixel(ctx, -9, -31, 19, 2, DESERT_CLOTH.light);
  pixel(ctx, -2, -30, 4, 26, DESERT_CLOTH.dark);
  pixel(ctx, -9, -9, 19, 2, DESERT_CLOTH.mid);
  pixel(ctx, -10, -7, 21, 2, DESERT_CLOTH.dark);
  pixel(ctx, -12, -10, 4, 5, DESERT_CLOTH.dark);
  pixel(ctx, 9, -10, 4, 5, DESERT_CLOTH.dark);
  // Apron with the lotus stain.
  pixel(ctx, -7, -28, 15, 17, DESERT_INK);
  pixel(ctx, -6, -27, 13, 15, '#9c8a5e');
  pixel(ctx, -6, -27, 13, 1, '#b8a674');
  pixel(ctx, -4, -20, 9, 5, LOTUS.dark);
  pixel(ctx, -3, -19, 7, 3, LOTUS.base);
  pixel(ctx, -2, -19, 5, 1, LOTUS.light);
  // Vial belt.
  pixel(ctx, -9, -13, 19, 2, DESERT_LEATHER.dark);
  pixel(ctx, -7, -12, 4, 5, DESERT_INK);
  pixel(ctx, -6, -11, 2, 3, SPORE);
  pixel(ctx, -1, -12, 4, 6, DESERT_INK);
  pixel(ctx, 0, -11, 2, 4, LOTUS.base);
  pixel(ctx, 5, -12, 3, 4, DESERT_INK);
  pixel(ctx, 6, -11, 1, 2, '#8ade5a');
  // Sleeves: one hangs, one raises the flask.
  pixel(ctx, -14, -30 + stride, 6, 13, DESERT_INK);
  pixel(ctx, -13, -29 + stride, 4, 12, DESERT_CLOTH.base);
  pixel(ctx, -13, -29 + stride, 1, 11, DESERT_CLOTH.light);
  pixel(ctx, 8, -32 - stride, 6, 11, DESERT_INK);
  pixel(ctx, 9, -31 - stride, 4, 10, DESERT_CLOTH.base);
  pixel(ctx, 9, -31 - stride, 1, 9, DESERT_CLOTH.light);
  // Raised flask, glowing.
  pixel(ctx, 9, -39 - stride, 6, 8, DESERT_INK);
  roundedMass(ctx, 10, -38 - stride, 4, 6, LOTUS.base);
  pixel(ctx, 10, -38 - stride, 3, 2, LOTUS.light);
  pixel(ctx, 10, -41 - stride, 3, 2, DESERT_WOOD.dark);
  // Lower flask.
  pixel(ctx, -14, -18 + stride, 5, 7, DESERT_INK);
  pixel(ctx, -13, -17 + stride, 3, 5, LOTUS.mid);
  pixel(ctx, -13, -17 + stride, 1, 3, LOTUS.light);
  // Hood over the head, face in shadow, two lit eyes.
  roundedMass(ctx, -8, -43, 17, 16, DESERT_INK);
  roundedMass(ctx, -7, -42, 15, 14, DESERT_CLOTH.base);
  pixel(ctx, -7, -42, 15, 2, DESERT_CLOTH.light);
  pixel(ctx, -7, -44, 15, 2, DESERT_CLOTH.dark);
  pixel(ctx, -6, -37, 13, 6, DESERT_INK);
  pixel(ctx, -4, -36, 3, 2, LOTUS.light);
  pixel(ctx, 3, -36, 3, 2, LOTUS.base);
  pixel(ctx, -7, -31, 15, 2, DESERT_CLOTH.mid);
  pixel(ctx, 6, -41, 3, 7, DESERT_CLOTH.dark);
  ctx.restore();
}

// Wave 5. El Alquimista del Loto, the act's mini-boss: tall, hooded, a lotus mask
// over the face and a censer on a staff. Bosses carry the cast's detail, so the
// robe gets layers, trim, a full belt of vials and smoke climbing off the censer
// — but the palette stays the act's yellow and cloth, never the dungeon's red.
export function drawLotusAlchemist(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const drift = Math.floor(time * 3) % 3;
  pose(ctx, x, y, scale);
  pixel(ctx, -19, 0, 39, 3, '#131a20');
  // Sandals under a long, layered robe.
  pixel(ctx, -11, -6, 10, 6, DESERT_LEATHER.dark);
  pixel(ctx, -10, -5, 8, 4, DESERT_LEATHER.base);
  pixel(ctx, -10, -2, 8, 1, DESERT_LEATHER.mid);
  pixel(ctx, 2, -6, 10, 6, DESERT_LEATHER.dark);
  pixel(ctx, 3, -5, 8, 4, DESERT_LEATHER.mid);
  pixel(ctx, 3, -2, 8, 1, DESERT_LEATHER.base);
  // Inner robe over the whole body, then the flared skirt over it.
  pixel(ctx, -15, -58, 31, 53, DESERT_INK);
  roundedMass(ctx, -14, -57, 29, 52, DESERT_CLOTH.base);
  pixel(ctx, -14, -57, 29, 3, DESERT_CLOTH.light);
  pixel(ctx, -3, -55, 7, 47, DESERT_CLOTH.dark);
  pixel(ctx, -14, -22, 29, 2, DESERT_CLOTH.mid);
  pixel(ctx, -16, -14, 34, 9, DESERT_INK);
  roundedMass(ctx, -15, -13, 33, 8, DESERT_CLOTH.base);
  pixel(ctx, -15, -13, 33, 1, DESERT_CLOTH.light);
  pixel(ctx, -15, -7, 33, 1, DESERT_CLOTH.dark);
  pixel(ctx, -21, -11, 6, 6, DESERT_CLOTH.dark);
  pixel(ctx, 15, -11, 6, 6, DESERT_CLOTH.dark);
  pixel(ctx, -19, -10, 4, 1, DESERT_CLOTH.mid);
  pixel(ctx, 15, -10, 4, 1, DESERT_CLOTH.mid);
  // Apron, lotus stain and embroidered hem.
  pixel(ctx, -11, -54, 23, 32, DESERT_INK);
  pixel(ctx, -10, -53, 21, 30, '#9c8a5e');
  pixel(ctx, -10, -53, 21, 2, '#b8a674');
  pixel(ctx, -10, -26, 21, 2, LOTUS.mid);
  pixel(ctx, -5, -44, 12, 9, LOTUS.dark);
  pixel(ctx, -4, -42, 10, 6, LOTUS.base);
  pixel(ctx, -3, -41, 8, 4, LOTUS.light);
  pixel(ctx, -1, -40, 4, 1, '#fff6cf');
  pixel(ctx, 6, -44, 4, 7, LOTUS.mid);
  pixel(ctx, -8, -37, 4, 4, LOTUS.mid);
  // Vial belt across the apron.
  pixel(ctx, -12, -26, 25, 3, DESERT_LEATHER.dark);
  for (let index = 0; index < 5; index++) {
    const bx = -11 + index * 5;
    pixel(ctx, bx, -24, 4, 7, DESERT_INK);
    pixel(ctx, bx + 1, -23, 2, 5, [SPORE, LOTUS.base, '#8ade5a', LOTUS.mid, SPORE][index]);
    pixel(ctx, bx + 1, -23, 1, 3, LOTUS.light);
  }
  // Shoulder mantle over both sleeves, wide enough to break the column read.
  pixel(ctx, -20, -63, 43, 6, DESERT_INK);
  roundedMass(ctx, -19, -62, 41, 4, DESERT_CLOTH.mid);
  pixel(ctx, -19, -62, 41, 1, DESERT_CLOTH.light);
  pixel(ctx, -22, -61, 5, 4, DESERT_CLOTH.dark);
  pixel(ctx, 17, -61, 5, 4, DESERT_CLOTH.dark);
  pixel(ctx, -21, -60, 3, 1, DESERT_CLOTH.mid);
  pixel(ctx, 18, -60, 3, 1, DESERT_CLOTH.mid);
  // Sleeves and hands: wide cuffs, thin wrists.
  pixel(ctx, -22, -56, 9, 22, DESERT_INK);
  roundedMass(ctx, -21, -55, 7, 20, DESERT_CLOTH.base);
  pixel(ctx, -21, -55, 1, 19, DESERT_CLOTH.light);
  pixel(ctx, -16, -37, 7, 5, DESERT_CLOTH.dark);
  pixel(ctx, 13, -56, 9, 20, DESERT_INK);
  roundedMass(ctx, 14, -55, 7, 18, DESERT_CLOTH.base);
  pixel(ctx, 20, -55, 1, 17, DESERT_CLOTH.dark);
  pixel(ctx, 13, -39, 7, 5, DESERT_CLOTH.dark);
  pixel(ctx, -22, -34, 7, 6, DESERT_INK);
  pixel(ctx, -21, -33, 5, 4, DESERT_SKIN.mid);
  pixel(ctx, -21, -33, 5, 1, DESERT_SKIN.base);
  pixel(ctx, 14, -37, 7, 6, DESERT_INK);
  pixel(ctx, 15, -36, 5, 4, DESERT_SKIN.base);
  pixel(ctx, 15, -36, 5, 1, DESERT_SKIN.light);
  // Censer staff in the right hand: haft, iron bowl, embers and smoke climbing.
  pixel(ctx, 20, -76, 3, 46, DESERT_WOOD.dark);
  pixel(ctx, 20, -76, 1, 45, DESERT_WOOD.light);
  pixel(ctx, 15, -78, 12, 4, DESERT_INK);
  pixel(ctx, 16, -77, 10, 2, DESERT_IRON.base);
  pixel(ctx, 17, -82, 8, 4, DESERT_IRON.dark);
  pixel(ctx, 18, -82, 6, 2, DESERT_IRON.base);
  pixel(ctx, 18, -82, 4, 1, DESERT_IRON.light);
  pixel(ctx, 19, -85, 4, 3, LOTUS.base);
  pixel(ctx, 20, -85, 2, 2, '#fff6cf');
  pixel(ctx, 23, -93 + drift, 3, 3, '#e0d5b0cc');
  pixel(ctx, 15, -99 + drift, 3, 3, '#e0d5b0aa');
  pixel(ctx, 25, -105 + drift, 2, 2, '#e0d5b0aa');
  // Head: cloth hood, the lotus mask of five petals and two burning eyes.
  roundedMass(ctx, -13, -70, 27, 17, DESERT_INK);
  roundedMass(ctx, -12, -69, 25, 15, DESERT_CLOTH.base);
  pixel(ctx, -12, -69, 25, 2, DESERT_CLOTH.light);
  pixel(ctx, -9, -76, 19, 5, DESERT_CLOTH.mid);
  pixel(ctx, -7, -78, 15, 3, DESERT_CLOTH.base);
  pixel(ctx, -6, -78, 13, 1, DESERT_CLOTH.light);
  pixel(ctx, -10, -63, 21, 9, DESERT_INK);
  pixel(ctx, -9, -62, 19, 7, LOTUS.dark);
  pixel(ctx, 3, -65, 5, 5, LOTUS.base);
  pixel(ctx, -6, -65, 5, 5, LOTUS.base);
  pixel(ctx, -2, -68, 5, 4, LOTUS.mid);
  pixel(ctx, -8, -58, 6, 5, LOTUS.mid);
  pixel(ctx, 3, -58, 6, 5, LOTUS.mid);
  pixel(ctx, -1, -58, 5, 4, LOTUS.base);
  pixel(ctx, -1, -56, 3, 2, LOTUS.light);
  pixel(ctx, -6, -63, 4, 2, LOTUS.light);
  pixel(ctx, 3, -63, 4, 2, LOTUS.light);
  pixel(ctx, -5, -62, 2, 1, '#fff6cf');
  pixel(ctx, 3, -62, 2, 1, '#fff6cf');
  pixel(ctx, -1, -54, 3, 3, LOTUS.mid);
  pixel(ctx, -2, -53, 5, 1, LOTUS.light);
  pixel(ctx, -18, -76, 5, 2, '#e0d5b066');
  ctx.restore();
}

// Wave 6. El Capataz de la Rueda del Dolor, the act's boss: a tower of iron over
// a red loincloth, chains coiled round both forearms and a whip trailing behind
// him. The silhouette is read from the shoulders down: horned helm, two spiked
// pauldrons, chains, and the wheel's iron on his belt.
export function drawTaskmaster(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const sway = Math.floor(time * 3) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -23, 0, 47, 3, '#131a20');
  // Armoured boots and greaves.
  pixel(ctx, -15, -9, 13, 9, DESERT_INK);
  pixel(ctx, -14, -8, 11, 7, DESERT_IRON.dark);
  pixel(ctx, -14, -8, 4, 6, DESERT_IRON.base);
  pixel(ctx, -14, -2, 11, 1, DESERT_IRON.mid);
  pixel(ctx, -11, -6, 7, 1, '#2c2a30');
  pixel(ctx, 2, -9, 13, 9, DESERT_INK);
  pixel(ctx, 3, -8, 11, 7, DESERT_IRON.dark);
  pixel(ctx, 3, -8, 4, 6, DESERT_IRON.base);
  pixel(ctx, 3, -2, 11, 1, DESERT_IRON.mid);
  pixel(ctx, 6, -6, 7, 1, '#2c2a30');
  // Thighs, knee plates.
  pixel(ctx, -14, -23 + sway, 12, 15, DESERT_INK);
  pixel(ctx, -13, -22 + sway, 10, 13, DESERT_SKIN.mid);
  pixel(ctx, -13, -22 + sway, 3, 12, DESERT_SKIN.base);
  pixel(ctx, -14, -15 + sway, 12, 4, DESERT_INK);
  pixel(ctx, -13, -14 + sway, 10, 2, DESERT_IRON.base);
  pixel(ctx, 2, -23 - sway, 12, 15, DESERT_INK);
  pixel(ctx, 3, -22 - sway, 10, 13, DESERT_SKIN.base);
  pixel(ctx, 3, -22 - sway, 3, 12, DESERT_SKIN.light);
  pixel(ctx, 2, -15 - sway, 12, 4, DESERT_INK);
  pixel(ctx, 3, -14 - sway, 10, 2, DESERT_IRON.base);
  // Belt with the wheel's iron ring, and the hang of the red loincloth.
  pixel(ctx, -17, -39, 35, 6, DESERT_INK);
  pixel(ctx, -16, -38, 33, 4, DESERT_LEATHER.dark);
  pixel(ctx, -16, -38, 33, 1, DESERT_LEATHER.base);
  pixel(ctx, -4, -38, 7, 5, DESERT_IRON.dark);
  pixel(ctx, -3, -37, 5, 4, DESERT_IRON.base);
  pixel(ctx, -2, -36, 3, 2, DESERT_IRON.dark);
  pixel(ctx, -10, -34, 21, 16, DESERT_INK);
  pixel(ctx, -9, -33, 19, 14, DESERT_RED.base);
  pixel(ctx, -9, -33, 19, 1, DESERT_RED.light);
  pixel(ctx, -9, -24, 19, 1, DESERT_RED.dark);
  pixel(ctx, -2, -33, 3, 14, DESERT_RED.dark);
  // Torso: armoured chest, plates, rivets and the scar across it.
  pixel(ctx, -20, -66, 41, 28, DESERT_INK);
  roundedMass(ctx, -19, -65, 39, 26, DESERT_IRON.base);
  pixel(ctx, -19, -65, 39, 2, DESERT_IRON.light);
  pixel(ctx, -19, -49, 39, 9, DESERT_IRON.dark);
  pixel(ctx, -14, -62, 14, 9, DESERT_IRON.mid);
  pixel(ctx, 2, -62, 14, 9, DESERT_IRON.mid);
  pixel(ctx, -13, -61, 12, 1, DESERT_IRON.light);
  pixel(ctx, 3, -61, 12, 1, DESERT_IRON.light);
  for (let index = 0; index < 5; index++) {
    pixel(ctx, -17 + index * 8, -57, 2, 2, '#26242a');
    pixel(ctx, -17 + index * 8, -45, 2, 2, '#26242a');
  }
  // An old whip scar crossing the chest plates, not a painted cross.
  pixel(ctx, -8, -58, 3, 2, DESERT_RED.dark);
  pixel(ctx, -6, -56, 3, 2, DESERT_RED.base);
  pixel(ctx, -4, -54, 4, 2, DESERT_RED.dark);
  pixel(ctx, -1, -52, 4, 2, DESERT_RED.base);
  pixel(ctx, 2, -50, 3, 2, DESERT_RED.dark);
  pixel(ctx, -7, -57, 2, 1, DESERT_RED.light);
  // Spiked pauldrons: rounded iron with short spikes, no antennae.
  pixel(ctx, -28, -68, 12, 13, DESERT_INK);
  roundedMass(ctx, -27, -67, 10, 11, DESERT_IRON.base);
  pixel(ctx, -27, -67, 10, 2, DESERT_IRON.light);
  pixel(ctx, -27, -60, 10, 1, DESERT_IRON.mid);
  pixel(ctx, -29, -72, 5, 5, DESERT_IRON.dark);
  pixel(ctx, -28, -72, 3, 3, DESERT_IRON.base);
  pixel(ctx, -30, -70, 3, 4, DESERT_IRON.dark);
  pixel(ctx, 17, -68, 12, 13, DESERT_INK);
  roundedMass(ctx, 18, -67, 10, 11, DESERT_IRON.base);
  pixel(ctx, 18, -67, 10, 2, DESERT_IRON.light);
  pixel(ctx, 18, -60, 10, 1, DESERT_IRON.mid);
  pixel(ctx, 25, -72, 5, 5, DESERT_IRON.dark);
  pixel(ctx, 26, -72, 3, 3, DESERT_IRON.base);
  pixel(ctx, 28, -70, 3, 4, DESERT_IRON.dark);
  // Arms wrapped in chains: rows of links over both forearms.
  pixel(ctx, -28, -56 + sway, 11, 26, DESERT_SKIN.mid);
  pixel(ctx, -27, -55 + sway, 9, 24, DESERT_SKIN.base);
  pixel(ctx, -27, -55 + sway, 2, 23, DESERT_SKIN.light);
  pixel(ctx, 18, -56 - sway, 11, 26, DESERT_SKIN.base);
  pixel(ctx, 19, -55 - sway, 9, 24, DESERT_SKIN.mid);
  pixel(ctx, 19, -55 - sway, 2, 23, DESERT_SKIN.light);
  for (let ring = 0; ring < 8; ring++) {
    const left = -54 + ring * 3 + sway;
    const right = -54 + ring * 3 - sway;
    pixel(ctx, -28, left, 11, 2, DESERT_INK);
    pixel(ctx, -27, left, 5, 1, DESERT_IRON.base);
    pixel(ctx, -21, left, 4, 1, DESERT_IRON.mid);
    pixel(ctx, -27, left + 1, 9, 1, DESERT_IRON.dark);
    pixel(ctx, 18, right, 11, 2, DESERT_INK);
    pixel(ctx, 19, right, 5, 1, DESERT_IRON.base);
    pixel(ctx, 25, right, 4, 1, DESERT_IRON.mid);
    pixel(ctx, 19, right + 1, 9, 1, DESERT_IRON.dark);
  }
  // Hands.
  pixel(ctx, -29, -32 + sway, 13, 9, DESERT_INK);
  pixel(ctx, -28, -31 + sway, 11, 7, DESERT_SKIN.mid);
  pixel(ctx, -28, -31 + sway, 11, 1, DESERT_SKIN.base);
  pixel(ctx, 17, -32 - sway, 13, 9, DESERT_INK);
  pixel(ctx, 18, -31 - sway, 11, 7, DESERT_SKIN.base);
  pixel(ctx, 18, -31 - sway, 11, 1, DESERT_SKIN.light);
  // Whip in the left hand: a slack line that reaches the ground behind him.
  pixel(ctx, -31, -26 + sway, 4, 4, DESERT_LEATHER.dark);
  pixel(ctx, -35, -25 + sway, 5, 2, DESERT_LEATHER.base);
  pixel(ctx, -40, -26 + sway, 6, 2, DESERT_LEATHER.base);
  pixel(ctx, -44, -23 + sway, 5, 2, DESERT_LEATHER.dark);
  pixel(ctx, -46, -19 + sway, 3, 5, DESERT_LEATHER.base);
  pixel(ctx, -45, -15 + sway, 2, 2, DESERT_LEATHER.dark);
  pixel(ctx, -25, -27 + sway, 4, 2, DESERT_RED.base);
  // Helm: horned iron over red cloth, the face in shadow, two lit eyes.
  roundedMass(ctx, -14, -84, 29, 19, DESERT_INK);
  roundedMass(ctx, -13, -83, 27, 17, DESERT_IRON.base);
  pixel(ctx, -13, -83, 27, 2, DESERT_IRON.light);
  pixel(ctx, -13, -71, 27, 5, DESERT_IRON.mid);
  pixel(ctx, -13, -71, 27, 1, DESERT_IRON.dark);
  pixel(ctx, -10, -78, 21, 7, DESERT_INK);
  pixel(ctx, -6, -76, 4, 2, '#ffd34e');
  pixel(ctx, 3, -76, 4, 2, '#ffd34e');
  pixel(ctx, -2, -68, 5, 2, DESERT_IRON.dark);
  // Horns: short, curved outward from the helm's sides.
  pixel(ctx, -16, -88, 5, 6, DESERT_IRON.dark);
  pixel(ctx, -17, -90, 5, 4, DESERT_IRON.dark);
  pixel(ctx, -20, -92, 5, 3, DESERT_IRON.base);
  pixel(ctx, -19, -92, 4, 1, DESERT_IRON.light);
  pixel(ctx, -18, -89, 3, 3, DESERT_IRON.base);
  pixel(ctx, 12, -88, 5, 6, DESERT_IRON.dark);
  pixel(ctx, 13, -90, 5, 4, DESERT_IRON.dark);
  pixel(ctx, 16, -92, 5, 3, DESERT_IRON.base);
  pixel(ctx, 16, -92, 4, 1, DESERT_IRON.light);
  pixel(ctx, 16, -89, 3, 3, DESERT_IRON.base);
  pixel(ctx, -14, -86, 29, 3, DESERT_RED.base);
  pixel(ctx, -14, -86, 29, 1, DESERT_RED.light);
  pixel(ctx, -15, -82, 3, 6, DESERT_RED.dark);
  pixel(ctx, 13, -82, 3, 6, DESERT_RED.dark);
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

// Jhony: the approved Act 1 stage sprite (black leather, ripped jeans, long
// hair, glasses, beard) with his playable accessory. `bottle` adds the beer
// bottle he swings as his basic attack, `attacking` thrusts it forward, `tilt`
// (0..1) knits the brows and grows the anger ticks, and `drink` is the drunk
// gag: flushed cheeks and the tie tied around his head while the whisky lasts.
// With every option off the rectangle sequence is byte-identical to the approved
// NPC sprite.
export function drawJhony(ctx, x, y, { scale = 2, facing = 1, moving = false, time = 0, bottle = false, attacking = false, tilt = 0, drink = false } = {}) {
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
  p(-14, 30, 3, 5, '#252b35');
  p(-14, 31, 1, 3, '#48505e');
  p(-14, 35, 3, 2, skin);
  p(-14, 35, 1, 2, light);
  p(-14, 28, 2, 1, '#8a8e97');
  p(-14, 29, 3, 2, skin);
  p(-13, 31, 2, 1, '#8a8e97');
  p(12, 26, 2, 2, '#972a38');
  p(13, 28, 2, 2, '#73202e');
  p(12, 26, 1, 1, '#c0444d');

  if (attacking) {
    // The botellazo: the bottle arm extends and the bottle is the point.
    p(11, 24, 5, 6, ink);
    p(12, 25, 3, 5, '#1b2029');
    p(15, 26, 11, 5, ink);
    p(16, 27, 9, 3, '#1b2029');
    p(24, 27, 4, 4, ink);
    p(24, 28, 3, 3, skin);
    p(24, 28, 1, 3, light);
    p(27, 24, 14, 7, ink);
    p(28, 25, 12, 5, '#6b3f1d');
    p(28, 25, 12, 1, '#9a6330');
    p(28, 29, 12, 1, '#4a2a12');
    p(31, 26, 4, 4, '#e6d9b4');
    p(31, 27, 4, 1, '#a8323c');
    p(40, 25, 3, 5, ink);
    p(41, 26, 1, 3, '#6b3f1d');
    p(43, 25, 2, 5, '#c9c6bf');
    p(43, 25, 2, 1, '#e8e5dd');
    p(24, 21, 2, 3, '#d8b06a');
    p(27, 19, 2, 3, '#e8c98a');
  } else {
    p(11, 30, 5, 8, ink);
    p(12, 30, 3, 5, '#1b2029');
    p(14, 31, 1, 3, '#363e4c');
    p(12, 35, 3, 2, skin);
    p(13, 35, 2, 1, '#a3333d');
    if (bottle) {
      // Beer bottle carried low in the right hand: glass body, paper label,
      // metal cap. It never leaves the hand, so no inventory, only art — and it
      // is the same hand that thrusts it forward on the attack pose.
      p(14, 32, 8, 11, ink);
      p(15, 33, 6, 9, '#6b3f1d');
      p(20, 33, 1, 9, '#9a6330');
      p(15, 33, 1, 9, '#4a2a12');
      p(16, 35, 4, 4, '#e6d9b4');
      p(16, 36, 4, 1, '#a8323c');
      p(16, 29, 4, 4, ink);
      p(17, 29, 2, 4, '#6b3f1d');
      p(18, 29, 1, 3, '#9a6330');
      p(16, 27, 4, 2, '#c9c6bf');
      p(16, 27, 4, 1, '#e8e5dd');
      p(13, 35, 2, 3, skin);
      p(14, 35, 1, 2, light);
    }
  }

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

  // Tilt reads in the face before it reads in the effects: knitted brows and
  // the anger ticks that grow towards Furia.
  if (tilt >= 0.5) {
    p(-7, 9, 6, 1, '#2a2028');
    p(2, 9, 6, 1, '#2a2028');
    p(-7, 10, 2, 1, '#2a2028');
    p(6, 10, 2, 1, '#2a2028');
  }
  if (tilt >= 0.25) {
    const ticks = tilt >= 0.9 ? 3 : tilt >= 0.55 ? 2 : 1;
    for (let i = 0; i < ticks; i++) {
      const dy = (i % 2) * 2;
      p(8 + i * 3, -4 - dy, 2, 1, '#c4404e');
      p(9 + i * 3, -3 - dy, 1, 2, '#c4404e');
    }
  }

  // «Un traguito más» is the drunk-salaryman gag: the face flushes and the tie
  // ends up around his head, knot at the temple and tail hanging over the hair.
  // It only shows while the whisky lasts, so the special has a tell on the body.
  if (drink) {
    // The tie itself: red with white stripes, the way a real tie reads. Solid
    // red is a Rambo bandana, so the stripes are what carry the joke.
    const tie = '#b2303e', tieLight = '#d4535c', tieShade = '#75202a', stripe = '#efe4cf';
    // Band across the forehead. The stripes are one continuous diagonal: each
    // row starts one pixel further left, the way a tie is woven.
    p(-9, 7, 19, 2, tie);
    for (let i = 0; i < 19; i++) {
      for (let row = 0; row < 2; row++) {
        if ((i + row) % 4 === 0) p(-9 + i, 7 + row, 1, 1, stripe);
      }
    }
    // Knot at the temple, bulky enough to read as a knot and not as a strap.
    p(-14, 4, 6, 6, ink);
    p(-13, 5, 4, 4, tie);
    p(-13, 5, 4, 1, tieLight);
    p(-13, 7, 4, 1, stripe);
    p(-13, 8, 4, 1, tieShade);
    // Wide end hanging down the side of the head: four pixels wide, with the
    // same diagonal running across its width, and a point over the shoulder.
    p(-15, 10, 6, 12, ink);
    p(-14, 10, 4, 11, tie);
    p(-14, 10, 1, 8, tieLight);
    p(-11, 11, 1, 9, tieShade);
    for (let y = 10; y < 21; y++) {
      for (let i = 0; i < 4; i++) {
        if ((i + y) % 4 === 0) p(-14 + i, y, 1, 1, stripe);
      }
    }
    p(-14, 20, 4, 1, tieShade);
    p(-15, 21, 6, 2, ink);
    p(-14, 21, 4, 1, tie);
    // The flush sits under the glasses: both cheeks and the tip of the nose.
    p(-7, 15, 4, 2, '#c4634a');
    p(4, 15, 4, 2, '#c4634a');
    p(0, 16, 3, 1, '#c4634a');
  }
  ctx.restore();
}

// Papafrita: the approved casual sprite (black tee, blue bermuda, ponytail,
// compact beard). `talking` opens the mouth and `voice` adds the sound ring
// that his attacks throw; with both off the rectangle sequence is exactly the
// approved NPC drawing.
export function drawPapafrita(ctx, x, y, { scale = 2, facing = 1, moving = false, time = 0, talking = false, voice = false, armor = false } = {}) {
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

  // The Monster Hunter cameo wears the insect armour the cinematic portrait
  // already uses: maroon carapace over the tee, pauldrons with spikes, forearm
  // guards, and the little kinsect hovering at his shoulder. Off by default so
  // the playable and roster art keep the approved casual outfit.
  if (armor) {
    const a = {
      ink: '#1b1923', dark: '#34313b', base: '#7d343b', light: '#a64b49',
      hi: '#c46959', shade: '#5e2b35', trim: '#ad9678',
    };
    // Carapace over the whole tee, plate seams and the central breastplate.
    p(-17, 19, 34, 16, a.ink);
    p(-16, 20, 32, 14, a.base);
    p(-16, 20, 10, 14, a.light);
    p(13, 20, 3, 14, a.shade);
    p(-16, 25, 32, 1, a.ink);
    p(-7, 20, 1, 14, a.shade);
    p(5, 20, 1, 14, a.shade);
    p(-6, 21, 13, 12, a.ink);
    p(-5, 22, 11, 10, a.light);
    p(-5, 22, 4, 10, a.hi);
    p(-1, 26, 4, 6, a.base);
    p(-5, 31, 11, 1, a.shade);
    // Waist band over the belt line.
    p(-17, 33, 34, 3, a.ink);
    p(-16, 34, 32, 2, a.dark);
    p(-16, 34, 32, 1, a.base);
    // Pauldrons with their spikes, then the forearm guards.
    p(-21, 18, 8, 6, a.ink);
    p(-20, 19, 6, 4, a.base);
    p(-20, 19, 3, 4, a.light);
    p(-20, 15, 3, 4, a.ink);
    p(-19, 15, 2, 3, a.trim);
    p(13, 18, 8, 6, a.ink);
    p(14, 19, 6, 4, a.shade);
    p(16, 15, 3, 4, a.ink);
    p(17, 15, 2, 3, a.trim);
    p(-20, 28, 6, 6, a.ink);
    p(-19, 29, 4, 4, a.base);
    p(14, 28, 6, 6, a.ink);
    p(15, 29, 4, 4, a.shade);
  }
  // The kinsect rides on his head, the way the cinematic portrait has it: a
  // small carapace with two teal eyes and a pair of side fins, gripping the hair.
  if (armor) {
    const bob = Math.round(Math.sin((time || 0) * 3));
    p(-7, -11 + bob, 14, 10, '#1b1923');
    p(-6, -10 + bob, 12, 8, '#7c7e87');
    p(-6, -10 + bob, 7, 3, '#a4a2a2');
    p(-6, -4 + bob, 12, 1, '#5c6976');
    p(-6, -8 + bob, 3, 3, '#35d1c8');
    p(3, -8 + bob, 3, 3, '#35d1c8');
    p(-5, -7 + bob, 2, 2, '#86f0d8');
    p(4, -7 + bob, 2, 2, '#86f0d8');
    p(-10, -9 + bob, 4, 2, '#bccbd0');
    p(6, -9 + bob, 4, 2, '#bccbd0');
    p(-10, -4 + bob, 4, 2, '#1b1923');
    p(6, -4 + bob, 4, 2, '#1b1923');
    p(-4, -1 + bob, 3, 2, '#242630');
    p(1, -1 + bob, 3, 2, '#242630');
  }

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
  // Playable extras: the mouth actually moves and the voice reads as a ring.
  // Both are opt-in, so the approved NPC sprite keeps its exact rectangles.
  if (talking || voice) {
    p(-4, 17, 8, 1, '#2a1d20');
    p(-3, 17, 6, 1, '#8d3b3f');
    p(-2, 18, 4, 1, '#5c2226');
  }
  if (voice) {
    p(11, 8, 3, 3, '#e6d9b4');
    p(15, 6, 3, 7, '#e6d9b4');
    p(19, 3, 3, 13, '#e6d9b4');
  }
  ctx.restore();
}

// «El único que me banca»: Papafrita's animal, one small mutt that fights for
// him. Readable at cast scale, and deliberately not a Monster Hunter palico.
export function drawCompanion(ctx, x, y, { scale = 2, facing = 1, flash = false } = {}) {
  const p = (px, py, w, h, fill) => pixel(ctx, px, py, w, h, fill);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale * facing, scale);
  p(-8, 0, 16, 2, '#11141c');
  ctx.translate(0, -15);
  // Brown mutt: body, tail, legs, head with one eye and a bright collar.
  p(-7, 7, 13, 7, '#171526');
  p(-6, 8, 11, 5, '#8a6242');
  p(-6, 8, 11, 1, '#a67a54');
  p(-9, 4, 3, 5, '#171526');
  p(-8, 5, 2, 4, '#8a6242');
  p(-6, 12, 3, 4, '#171526');
  p(2, 12, 3, 4, '#171526');
  p(-5, 13, 2, 2, '#5e4028');
  p(3, 13, 2, 2, '#5e4028');
  p(4, 1, 9, 9, '#171526');
  p(5, 2, 7, 7, '#8a6242');
  p(5, 2, 7, 1, '#a67a54');
  p(12, 4, 3, 3, '#171526');
  p(12, 5, 2, 2, '#5e4028');
  p(6, 4, 2, 2, '#171526');
  p(4, 8, 9, 1, '#c4404e');
  if (flash) {
    p(10, -3, 3, 3, '#f7efe2');
    p(14, -6, 3, 3, '#f7efe2');
  }
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

export function drawGamerProjectile(ctx, device, shot = {}) {
  if (device === 'voice') {
    // Papafrita's voice: the same three rising bars his portrait uses next to
    // his mouth, scaled up until they read mid-combat. They sit across the
    // travel direction, so the wave grows toward where the shout is going.
    const tall = Math.max(10, Math.min(30, Math.round((shot.width ?? 10) * 1.6) + 6));
    const bars = [[-9, 0.42], [-3, 0.72], [3, 1]];
    for (const [x, share] of bars) {
      const height = Math.max(4, Math.round(tall * share / 2) * 2);
      pixel(ctx, x, -height / 2, 4, height, '#f7efe2');
    }
    return;
  }
  if (device === 'shard') {
    // «BOTELLA ROTA»: a glass sliver, readable while it tumbles.
    pixel(ctx, -3, -4, 6, 8, '#171526');
    pixel(ctx, -2, -3, 4, 6, '#cfe9dd');
    pixel(ctx, -1, -2, 2, 4, '#f7fffb');
    return;
  }
  if (device === 'bottle') {
    // Jhony's beer bottle: brown glass, paper label, metal cap.
    pixel(ctx, -11, -5, 16, 10, '#171526');
    pixel(ctx, -10, -4, 14, 8, '#6b3f1d');
    pixel(ctx, -10, -4, 14, 1, '#9a6330');
    pixel(ctx, -10, 3, 14, 1, '#4a2a12');
    pixel(ctx, -7, -3, 5, 6, '#e6d9b4');
    pixel(ctx, -7, -1, 5, 1, '#a8323c');
    pixel(ctx, 4, -3, 4, 6, '#171526');
    pixel(ctx, 5, -2, 2, 4, '#6b3f1d');
    pixel(ctx, 8, -3, 3, 6, '#c9c6bf');
    pixel(ctx, 8, -3, 3, 1, '#e8e5dd');
    return;
  }
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

// Act 5 — El Administrador del Servidor. Not a body: a rack of screens, cable
// and hanging code that hovers, held together by a Discord frame. The eyes are
// the plate's two holes, so the only friendly shape it owns reads as a logo.
const ADMIN = Object.freeze({
  ink: '#100d1a', frame: '#2b2d31', frameLight: '#41444c',
  blurple: '#5865f2', screen: '#1a1726', glass: '#2a2540',
  glow: '#b9d884', glowDim: '#6d8a4c',
  error: '#ed4245', errorDark: '#a32c2f',
  cable: '#191624', cableLight: '#2b2740',
});

export function drawServerAdministrator(ctx, x, y, options = {}) {
  const { time = 0, scale = 2 } = options;
  const hover = Math.floor(Math.sin(time * 2.2) * 2);
  const flicker = Math.floor(time * 9) % 7 === 0;
  pose(ctx, x, y, scale);
  pixel(ctx, -32, 0, 64, 3, '#0c0914');
  ctx.translate(0, hover);
  // The cables that keep it tethered to the floor of the server.
  for (const side of [-1, 1]) {
    for (let step = 0; step < 6; step++) {
      const cx = side * (16 + step * 5);
      const cy = -4 - step * 4 + (step % 2);
      pixel(ctx, cx, cy, 7, 3, ADMIN.cable);
      pixel(ctx, cx, cy, 7, 1, ADMIN.cableLight);
    }
  }
  // Shoulder monitors, floating apart from the rack.
  for (const side of [-1, 1]) {
    const sx = side < 0 ? -44 : 24;
    pixel(ctx, sx, -74, 20, 26, ADMIN.ink);
    pixel(ctx, sx + 1, -73, 18, 24, ADMIN.frame);
    pixel(ctx, sx + 3, -71, 14, 16, ADMIN.screen);
    pixel(ctx, sx + 4, -70, 12, 3, ADMIN.blurple);
    pixel(ctx, sx + 4, -65, 9, 2, ADMIN.glowDim);
    pixel(ctx, sx + 4, -61, 11, 2, ADMIN.glowDim);
    pixel(ctx, sx + 4, -57, 7, 2, flicker ? ADMIN.error : ADMIN.errorDark);
    pixel(ctx, sx + 8, -48, 4, 10, ADMIN.cable);
  }
  // The rack: frame, glass, the blue title bar and lines of broken text.
  pixel(ctx, -20, -74, 40, 62, ADMIN.ink);
  pixel(ctx, -19, -73, 38, 60, ADMIN.frame);
  pixel(ctx, -19, -73, 38, 2, ADMIN.frameLight);
  pixel(ctx, -16, -70, 32, 44, ADMIN.screen);
  pixel(ctx, -15, -69, 30, 8, ADMIN.glass);
  pixel(ctx, -13, -67, 26, 3, ADMIN.blurple);
  pixel(ctx, -13, -62, 12, 2, ADMIN.glow);
  pixel(ctx, -13, -58, 20, 2, ADMIN.glowDim);
  pixel(ctx, -13, -54, 16, 2, ADMIN.glowDim);
  // The plate with the two eyes: the only familiar shape in the mass.
  pixel(ctx, -9, -46, 7, 6, ADMIN.blurple);
  pixel(ctx, -8, -45, 5, 4, ADMIN.ink);
  pixel(ctx, 2, -46, 7, 6, ADMIN.blurple);
  pixel(ctx, 3, -45, 5, 4, ADMIN.ink);
  pixel(ctx, -13, -34, 26, 2, ADMIN.frameLight);
  pixel(ctx, -13, -30, 8, 2, flicker ? ADMIN.error : ADMIN.errorDark);
  pixel(ctx, -3, -30, 16, 2, ADMIN.glowDim);
  // Head: one small monitor with the cursor eyes, crowned by hanging code.
  pixel(ctx, -13, -92, 26, 20, ADMIN.ink);
  pixel(ctx, -12, -91, 24, 18, ADMIN.frame);
  pixel(ctx, -10, -89, 20, 12, ADMIN.screen);
  pixel(ctx, -7, -85, 5, 4, ADMIN.glow);
  pixel(ctx, 2, -85, 5, 4, ADMIN.glow);
  pixel(ctx, -4, -78, 8, 2, ADMIN.error);
  for (let i = 0; i < 5; i++) {
    const cx = -12 + i * 5;
    const rise = 5 + (i % 3) * 3 + (flicker ? 1 : 0);
    pixel(ctx, cx, -92 - rise, 2, rise, i % 2 ? ADMIN.glowDim : ADMIN.glow);
  }
  // Two error windows hanging around it, the server's own noise.
  pixel(ctx, -56, -96, 18, 12, ADMIN.ink);
  pixel(ctx, -55, -95, 16, 10, ADMIN.errorDark);
  pixel(ctx, -53, -93, 12, 2, ADMIN.error);
  pixel(ctx, -53, -89, 8, 2, ADMIN.error);
  pixel(ctx, 38, -34, 16, 10, ADMIN.ink);
  pixel(ctx, 39, -33, 14, 8, ADMIN.errorDark);
  pixel(ctx, 41, -31, 10, 2, ADMIN.error);
  ctx.restore();
}

// ── Act 6 — Monster Hunter's Primordial Forest ───────────────────────────────
// The epilogue's bestiary is the first cast drawn from a world none of the
// others paint: a forest of giant ferns. Every body keeps the same ink contour
// and stepped shading as the rest of the cast, and the common kinds stay under
// the player's height so a pack of them never crowds the silhouette.

const JAGRAS_INK = '#16211a';
const JAGRAS_SKIN = { light: '#a9c46b', base: '#7d9a4a', mid: '#597335', dark: '#3a5123' };
const JAGRAS_BELLY = { light: '#e0e0b0', base: '#c2c28d', dark: '#92926a' };
const JAGRAS_MOUTH = '#a34f57';
const JAGRAS_FANG = '#efe9cf';

// Wave 1. Jagras: the small pack lizard. A low quadruped with a heavy jaw, a
// long tail that counterweights the head and a ridge of spines: it has to read
// as a living thing at a glance, because wave 1 puts six of them on screen.
export function drawJagras(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 5 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -16, 0, 33, 2, '#131a20');
  // Tail: a thick base tapering into a raised tip, with a spine on each segment.
  for (let i = 0; i < 4; i++) {
    const tx = -14 - i * 6;
    const ty = -18 - i * 2;
    const h = 8 - i;
    pixel(ctx, tx, ty, 9, h, JAGRAS_INK);
    pixel(ctx, tx + 1, ty + 1, 7, h - 2, i < 2 ? JAGRAS_SKIN.base : JAGRAS_SKIN.mid);
    pixel(ctx, tx + 1, ty + 1, 5, 1, JAGRAS_SKIN.light);
    pixel(ctx, tx + 2, ty - 2, 2, 3, JAGRAS_SKIN.dark);
  }
  // Hind legs: a folded thigh, a shin and a three-toed foot.
  pixel(ctx, -13, -14 + stride, 8, 14 - stride, JAGRAS_INK);
  pixel(ctx, -12, -13 + stride, 6, 12 - stride, JAGRAS_SKIN.mid);
  pixel(ctx, -12, -13 + stride, 2, 11 - stride, JAGRAS_SKIN.base);
  pixel(ctx, -15, -2 + stride, 11, 3, JAGRAS_INK);
  pixel(ctx, -14, -1 + stride, 9, 2, JAGRAS_SKIN.dark);
  for (let claw = 0; claw < 3; claw++) pixel(ctx, -13 + claw * 3, -1 + stride, 2, 2, JAGRAS_FANG);
  // Front legs, shorter: the lizard walks on four but grabs with the front pair.
  pixel(ctx, 6, -16 - stride, 8, 15 + stride, JAGRAS_INK);
  pixel(ctx, 7, -15 - stride, 6, 13 + stride, JAGRAS_SKIN.base);
  pixel(ctx, 7, -15 - stride, 2, 12 + stride, JAGRAS_SKIN.light);
  pixel(ctx, 4, -2 - stride, 11, 3, JAGRAS_INK);
  pixel(ctx, 5, -1 - stride, 9, 2, JAGRAS_SKIN.mid);
  for (let claw = 0; claw < 3; claw++) pixel(ctx, 6 + claw * 3, -1 - stride, 2, 2, JAGRAS_FANG);
  // Body: a low barrel, lit along the spine and banded under the ribs.
  roundedMass(ctx, -15, -31, 32, 20, JAGRAS_INK);
  roundedMass(ctx, -14, -30, 30, 18, JAGRAS_SKIN.base);
  torsoBands(ctx, -14, -30, 30, 18, JAGRAS_SKIN);
  pixel(ctx, -14, -30, 20, 2, JAGRAS_SKIN.light);
  pixel(ctx, -14, -15, 30, 3, JAGRAS_SKIN.dark);
  roundedMass(ctx, -9, -21, 19, 7, JAGRAS_INK);
  roundedMass(ctx, -8, -20, 17, 5, JAGRAS_BELLY.base);
  pixel(ctx, -8, -20, 12, 2, JAGRAS_BELLY.light);
  pixel(ctx, -8, -16, 17, 1, JAGRAS_BELLY.dark);
  // Dorsal ridge: spines from the neck to the hips.
  for (let i = 0; i < 5; i++) {
    const sx2 = -12 + i * 6;
    const rise = 3 + (i % 3);
    pixel(ctx, sx2, -31 - rise, 3, rise, JAGRAS_INK);
    pixel(ctx, sx2 + 1, -31 - rise, 1, rise - 1, JAGRAS_SKIN.mid);
  }
  // Neck: thick, carried forward, with the shoulder muscle under it.
  pixel(ctx, 10, -40, 9, 11, JAGRAS_INK);
  pixel(ctx, 11, -39, 7, 10, JAGRAS_SKIN.base);
  pixel(ctx, 11, -39, 2, 9, JAGRAS_SKIN.light);
  pixel(ctx, 15, -33, 4, 6, JAGRAS_SKIN.mid);
  // Head: a broad wedge with a heavy brow, an amber eye and the jaw open.
  roundedMass(ctx, 11, -44, 22, 13, JAGRAS_INK);
  roundedMass(ctx, 12, -43, 20, 11, JAGRAS_SKIN.base);
  pixel(ctx, 12, -43, 14, 3, JAGRAS_SKIN.light);
  pixel(ctx, 12, -36, 20, 2, JAGRAS_SKIN.dark);
  pixel(ctx, 18, -40, 6, 3, JAGRAS_SKIN.dark);
  pixel(ctx, 26, -40, 3, 3, '#f2c14e');
  pixel(ctx, 27, -39, 1, 1, JAGRAS_INK);
  // Upper jaw over a red mouth, lower jaw hanging with the teeth showing.
  pixel(ctx, 31, -42, 7, 5, JAGRAS_INK);
  pixel(ctx, 32, -41, 6, 3, JAGRAS_SKIN.mid);
  pixel(ctx, 32, -41, 4, 1, JAGRAS_SKIN.light);
  pixel(ctx, 15, -35, 21, 5, JAGRAS_INK);
  pixel(ctx, 17, -34, 18, 3, JAGRAS_MOUTH);
  for (let i = 0; i < 4; i++) pixel(ctx, 18 + i * 4, -35, 1, 2, JAGRAS_FANG);
  for (let i = 0; i < 4; i++) pixel(ctx, 20 + i * 4, -32, 1, 2, JAGRAS_FANG);
  pixel(ctx, 13, -31, 9, 3, JAGRAS_INK);
  pixel(ctx, 14, -30, 7, 2, JAGRAS_SKIN.mid);
  // Two horn nubs behind the eye.
  pixel(ctx, 14, -46, 3, 5, JAGRAS_INK);
  pixel(ctx, 15, -45, 1, 3, JAGRAS_SKIN.dark);
  pixel(ctx, 20, -45, 2, 4, JAGRAS_SKIN.dark);
  ctx.restore();
}

const VESPOID_INK = '#1a1710';
const VESPOID_SHELL = { light: '#f5d95f', base: '#d9ad2c', mid: '#a6801c', dark: '#6d5311' };
const VESPOID_WING = { light: '#dff1f6', base: '#b4d6e2', dark: '#7fa8b8' };

// Wave 1. Vespoid: the wasp that flanks. It hovers, so its body never touches
// the floor: the shadow below is the only thing on the ground.
export function drawVespoid(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const flap = Math.floor(time * 16 + seed) % 2;
  const hover = Math.floor(time * 2 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -9, 0, 19, 2, '#131a20');
  // Wings: a membrane hanging from a bone that climbs away from the thorax. Each
  // segment drops further than the last, which is what makes a fan instead of a
  // row of speed lines.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      const wx = side < 0 ? -4 - row * 5 : 4 + row * 5;
      const wy = -36 - row * 3 + (flap ? row : -row);
      const drop = 5 + row * 2;
      pixel(ctx, wx, wy, 5, 2, VESPOID_WING.dark);
      pixel(ctx, wx + (side < 0 ? 0 : 1), wy + 2, 4, drop, VESPOID_WING.base);
      pixel(ctx, wx + (side < 0 ? 0 : 1), wy + 2, 1, drop, VESPOID_WING.light);
      pixel(ctx, wx + (side < 0 ? 3 : 4), wy + 2, 1, drop, VESPOID_WING.dark);
    }
  }
  // Abdomen with the black bands and the stinger.
  roundedMass(ctx, -7, -26 - hover, 13, 15, VESPOID_INK);
  roundedMass(ctx, -6, -25 - hover, 11, 13, VESPOID_SHELL.base);
  pixel(ctx, -6, -25 - hover, 8, 2, VESPOID_SHELL.light);
  pixel(ctx, -6, -20 - hover, 11, 2, VESPOID_INK);
  pixel(ctx, -6, -16 - hover, 11, 2, VESPOID_INK);
  pixel(ctx, -3, -11 - hover, 5, 3, VESPOID_INK);
  pixel(ctx, -2, -9 - hover, 3, 2, VESPOID_SHELL.dark);
  // Thorax and head, with the antennae and the two black eyes.
  roundedMass(ctx, -6, -34 - hover, 11, 9, VESPOID_INK);
  roundedMass(ctx, -5, -33 - hover, 9, 7, VESPOID_SHELL.mid);
  pixel(ctx, -5, -33 - hover, 5, 2, VESPOID_SHELL.base);
  pixel(ctx, -3, -37 - hover, 2, 5, VESPOID_INK);
  pixel(ctx, -7, -39 - hover, 3, 2, VESPOID_SHELL.dark);
  pixel(ctx, 2, -39 - hover, 3, 2, VESPOID_SHELL.dark);
  pixel(ctx, -4, -32 - hover, 2, 2, '#2a1f12');
  pixel(ctx, 1, -32 - hover, 2, 2, '#2a1f12');
  // Legs tucked under, drawn as short hooks.
  pixel(ctx, -8, -22 - hover, 4, 2, VESPOID_INK);
  pixel(ctx, 4, -22 - hover, 4, 2, VESPOID_INK);
  pixel(ctx, -7, -18 - hover, 3, 2, VESPOID_INK);
  pixel(ctx, 4, -18 - hover, 3, 2, VESPOID_INK);
  ctx.restore();
}

const KESTODON_INK = '#20160f';
const KESTODON_HIDE = { light: '#dda25a', base: '#bb7c3c', mid: '#8e5926', dark: '#5f3a18' };
const KESTODON_CREST = { light: '#f0dca8', base: '#d3ba7c', mid: '#a08c58', dark: '#6c5c34' };

// Wave 1. Kestodon: the short telegraphed charge. A stocky four-legged herbivore
// whose head plate is the widest shape on the body, because the plate is what
// the player has to read before it charges.
export function drawKestodon(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 4 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -18, 0, 37, 2, '#131a20');
  // Tail: a short club of scales.
  pixel(ctx, -26, -18, 11, 4, KESTODON_INK);
  pixel(ctx, -25, -17, 9, 2, KESTODON_HIDE.mid);
  pixel(ctx, -28, -19, 4, 6, KESTODON_INK);
  pixel(ctx, -27, -18, 2, 4, KESTODON_HIDE.dark);
  // Four legs: the back pair plants, the front pair steps.
  for (const [lx, dir] of [[-14, stride], [-9, 1 - stride], [8, 1 - stride], [13, stride]]) {
    pixel(ctx, lx, -12 + dir, 6, 12 - dir, KESTODON_INK);
    pixel(ctx, lx + 1, -11 + dir, 4, 10 - dir, KESTODON_HIDE.mid);
    pixel(ctx, lx + 1, -11 + dir, 1, 9 - dir, KESTODON_HIDE.base);
    pixel(ctx, lx - 1, -2 + dir, 8, 3, KESTODON_INK);
    pixel(ctx, lx, -1 + dir, 6, 2, KESTODON_HIDE.dark);
  }
  // Barrel body with a lit back and a darker flank.
  roundedMass(ctx, -16, -32, 32, 21, KESTODON_INK);
  roundedMass(ctx, -15, -31, 30, 19, KESTODON_HIDE.base);
  torsoBands(ctx, -15, -31, 30, 19, KESTODON_HIDE);
  pixel(ctx, -15, -31, 22, 2, KESTODON_HIDE.light);
  pixel(ctx, -15, -15, 30, 3, KESTODON_HIDE.dark);
  pixel(ctx, -13, -24, 26, 2, KESTODON_HIDE.mid);
  for (let i = 0; i < 4; i++) pixel(ctx, -10 + i * 6, -33, 4, 3, KESTODON_HIDE.dark);
  // Neck and the head plate: a broad crested skull, the charge's telegraph. The
  // neck is visible so the crest does not read as a second body on top.
  pixel(ctx, 7, -38, 12, 13, KESTODON_INK);
  pixel(ctx, 8, -37, 10, 12, KESTODON_HIDE.base);
  pixel(ctx, 8, -37, 3, 10, KESTODON_HIDE.light);
  pixel(ctx, 15, -37, 3, 10, KESTODON_HIDE.mid);
  pixel(ctx, 6, -33, 5, 9, KESTODON_HIDE.dark);
  roundedMass(ctx, 7, -46, 23, 13, KESTODON_INK);
  roundedMass(ctx, 8, -45, 21, 11, KESTODON_CREST.base);
  torsoBands(ctx, 8, -45, 21, 11, KESTODON_CREST);
  pixel(ctx, 8, -45, 14, 3, KESTODON_CREST.light);
  pixel(ctx, 8, -36, 21, 2, KESTODON_CREST.dark);
  pixel(ctx, 26, -42, 8, 10, KESTODON_INK);
  pixel(ctx, 27, -41, 6, 8, KESTODON_CREST.mid);
  pixel(ctx, 27, -41, 2, 7, KESTODON_CREST.light);
  pixel(ctx, 28, -38, 5, 3, KESTODON_INK);
  pixel(ctx, 29, -37, 3, 1, KESTODON_HIDE.dark);
  pixel(ctx, 22, -41, 3, 3, '#f2c14e');
  pixel(ctx, 23, -40, 1, 1, KESTODON_INK);
  // Two horns off the crest, the itch that reads as the charge.
  pixel(ctx, 11, -44, 2, 4, KESTODON_CREST.light);
  pixel(ctx, 10, -45, 3, 3, KESTODON_CREST.base);
  pixel(ctx, 21, -44, 2, 4, KESTODON_CREST.light);
  pixel(ctx, 20, -45, 3, 3, KESTODON_CREST.base);
  ctx.restore();
}

const MERNOS_INK = '#10201f';
const MERNOS_HIDE = { light: '#9fe0d6', base: '#5fb2a6', mid: '#3d847c', dark: '#275853' };
const MERNOS_WING = { light: '#d3ede6', base: '#9ccbc2', mid: '#6d9a92', dark: '#426b64' };

// Wave 2. Mernos: the flyer that crosses the clearing and dives. Wings spread
// wide on purpose: it is the shape that warns the wave has a second angle.
export function drawMernos(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const flap = Math.floor(time * 8 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -10, 0, 21, 2, '#131a20');
  // Wings: one fan per side. The bone climbs outward and the membrane hangs
  // from it, so the silhouette is a bird with wings instead of a body over bars.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      const wx = side < 0 ? -4 - row * 6 : 4 + row * 6;
      const wy = -36 - row * 3 + (flap ? row : 0);
      const drop = 12 - row * 3;
      pixel(ctx, wx, wy, 7, 3, MERNOS_WING.dark);
      pixel(ctx, wx + (side < 0 ? 1 : 0), wy + 3, 6, drop, MERNOS_WING.base);
      pixel(ctx, wx + (side < 0 ? 1 : 0), wy + 3, 2, drop, MERNOS_WING.light);
      pixel(ctx, wx + (side < 0 ? 4 : 5), wy + 3, 2, drop, MERNOS_WING.mid);
      if (row === 3) pixel(ctx, wx + (side < 0 ? 1 : 0), wy + 3 + drop, 6, 2, MERNOS_WING.dark);
    }
  }
  // Body slung under the wings, with the throat in light.
  roundedMass(ctx, -8, -38, 17, 22, MERNOS_INK);
  roundedMass(ctx, -7, -37, 15, 20, MERNOS_HIDE.base);
  torsoBands(ctx, -7, -37, 15, 20, MERNOS_HIDE);
  pixel(ctx, -7, -37, 9, 2, MERNOS_HIDE.light);
  pixel(ctx, -7, -22, 15, 4, MERNOS_HIDE.mid);
  pixel(ctx, -2, -19, 7, 3, MERNOS_HIDE.dark);
  // Long tail streamer behind.
  pixel(ctx, -14, -24, 9, 3, MERNOS_INK);
  pixel(ctx, -13, -23, 8, 1, MERNOS_HIDE.mid);
  pixel(ctx, -22, -26, 9, 2, MERNOS_INK);
  pixel(ctx, -21, -25, 8, 1, MERNOS_HIDE.dark);
  // Head with the long beak and the crest.
  roundedMass(ctx, 3, -44, 15, 12, MERNOS_INK);
  roundedMass(ctx, 4, -43, 13, 10, MERNOS_HIDE.base);
  pixel(ctx, 4, -43, 8, 2, MERNOS_HIDE.light);
  pixel(ctx, 17, -42, 11, 4, MERNOS_INK);
  pixel(ctx, 18, -41, 10, 2, MERNOS_HIDE.mid);
  pixel(ctx, 19, -41, 8, 1, MERNOS_HIDE.light);
  pixel(ctx, 9, -45, 3, 3, '#f2c14e');
  pixel(ctx, 10, -44, 1, 1, MERNOS_INK);
  pixel(ctx, 6, -42, 3, 5, MERNOS_HIDE.mid);
  pixel(ctx, 5, -44, 3, 3, MERNOS_HIDE.dark);
  // Two tucked legs.
  pixel(ctx, -4, -20, 3, 6, MERNOS_INK);
  pixel(ctx, 2, -20, 3, 6, MERNOS_INK);
  ctx.restore();
}

const HORNETAUR_INK = '#14101c';
const HORNETAUR_SHELL = { light: '#a48fce', base: '#75619f', mid: '#514277', dark: '#352a54' };

// Wave 3. Hornetaur: the resistant insect. It is the wall of the wave: a low,
// wide carapace that walks into the group and takes hits instead of dodging.
export function drawHornetaur(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const step = Math.floor(time * 5 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -19, 0, 39, 2, '#131a20');
  // Six legs, three per side, alternating in two groups.
  for (let i = 0; i < 3; i++) {
    const lx = -16 + i * 13;
    const lift = (i + step) % 2 ? 2 : 0;
    pixel(ctx, lx, -10 + lift, 4, 11 - lift, HORNETAUR_INK);
    pixel(ctx, lx + 1, -9 + lift, 2, 9 - lift, HORNETAUR_SHELL.dark);
    pixel(ctx, lx + 3, -2 + lift, 4, 2, HORNETAUR_INK);
  }
  // Shell: a stepped dome, widest at the floor and narrowing row by row.
  for (let row = 0; row < 5; row++) {
    const inset = (4 - row) * 4;
    const yy = -28 + row * 3;
    pixel(ctx, -20 + inset, yy, 41 - inset * 2, 3, HORNETAUR_INK);
    pixel(ctx, -19 + inset, yy + 1, 39 - inset * 2, 2, row < 2 ? HORNETAUR_SHELL.light : HORNETAUR_SHELL.base);
    pixel(ctx, 10 - inset, yy + 1, 9, 2, HORNETAUR_SHELL.mid);
  }
  pixel(ctx, -4, -29, 9, 3, HORNETAUR_SHELL.light);
  pixel(ctx, -4, -26, 9, 2, HORNETAUR_SHELL.mid);
  pixel(ctx, -20, -9, 41, 3, HORNETAUR_SHELL.dark);
  pixel(ctx, -8, -24, 2, 15, HORNETAUR_SHELL.dark);
  pixel(ctx, 6, -24, 2, 15, HORNETAUR_SHELL.dark);
  // Head in front: a small armored plate with mandibles and a pair of antennae.
  roundedMass(ctx, 10, -24, 18, 13, HORNETAUR_INK);
  roundedMass(ctx, 11, -23, 16, 11, HORNETAUR_SHELL.mid);
  pixel(ctx, 11, -23, 11, 2, HORNETAUR_SHELL.base);
  pixel(ctx, 26, -19, 5, 4, HORNETAUR_INK);
  pixel(ctx, 27, -18, 3, 2, HORNETAUR_SHELL.light);
  pixel(ctx, 12, -12, 5, 3, HORNETAUR_INK);
  pixel(ctx, 20, -12, 5, 3, HORNETAUR_INK);
  pixel(ctx, 13, -11, 3, 1, HORNETAUR_SHELL.light);
  pixel(ctx, 21, -11, 3, 1, HORNETAUR_SHELL.light);
  pixel(ctx, 14, -27, 2, 5, HORNETAUR_INK);
  pixel(ctx, 13, -29, 3, 2, HORNETAUR_SHELL.dark);
  pixel(ctx, 22, -27, 2, 5, HORNETAUR_INK);
  pixel(ctx, 21, -29, 3, 2, HORNETAUR_SHELL.dark);
  pixel(ctx, 15, -20, 2, 2, '#e2c96a');
  pixel(ctx, 21, -20, 2, 2, '#e2c96a');
  ctx.restore();
}

const GREAT_HIDE = { light: '#8fae5a', base: '#67883c', mid: '#48652b', dark: '#2e441c' };
const GREAT_MANE = { light: '#f2df9a', base: '#d9be5f', mid: '#a98f38', dark: '#77631f' };

// Wave 2. Great Jagras: the elite of the forest and the one body in the act that
// is not a common. It is the same family as the pack lizard — heavy jaw, dorsal
// ridge, thick tail — but it carries a mane of long spines, a swallowed bulge
// and enough mass to be twice the little one on screen. The difference has to be
// obvious at a glance, because wave 2 fields both.
export function drawGreatJagras(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 3 + seed) % 2;
  const breath = Math.floor(time * 2) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -30, 0, 61, 3, '#131a20');
  // Tail: a heavy club sweeping back, each segment with its own spine.
  for (let i = 0; i < 4; i++) {
    const tx = -28 - i * 9;
    const ty = -24 - i * 3;
    const h = 11 - i * 2;
    pixel(ctx, tx, ty, 12, h, JAGRAS_INK);
    pixel(ctx, tx + 1, ty + 1, 10, h - 2, i < 2 ? GREAT_HIDE.base : GREAT_HIDE.mid);
    pixel(ctx, tx + 1, ty + 1, 7, 1, GREAT_HIDE.light);
    pixel(ctx, tx + 3, ty - 4, 3, 5, GREAT_MANE.base);
    pixel(ctx, tx + 4, ty - 4, 1, 3, GREAT_MANE.light);
  }
  // Hind legs: a heavy thigh, a shin and a clawed foot.
  for (const [lx, dir] of [[-22, stride], [18, 1 - stride]]) {
    pixel(ctx, lx, -22 + dir, 13, 22 - dir, JAGRAS_INK);
    pixel(ctx, lx + 1, -21 + dir, 11, 20 - dir, GREAT_HIDE.mid);
    pixel(ctx, lx + 1, -21 + dir, 4, 18 - dir, GREAT_HIDE.base);
    pixel(ctx, lx + 2, -10 + dir, 9, 9 - dir, JAGRAS_INK);
    pixel(ctx, lx + 3, -9 + dir, 7, 7 - dir, GREAT_HIDE.dark);
    pixel(ctx, lx - 3, -3 + dir, 18, 5, JAGRAS_INK);
    pixel(ctx, lx - 2, -2 + dir, 16, 3, GREAT_HIDE.dark);
    for (let claw = 0; claw < 3; claw++) pixel(ctx, lx - 2 + claw * 5, -1 + dir, 3, 2, JAGRAS_FANG);
  }
  // Body: a broad barrel, lit along the back, with the swallowed bulge below.
  roundedMass(ctx, -30, -46, 60, 32, JAGRAS_INK);
  roundedMass(ctx, -29, -45, 58, 30, GREAT_HIDE.base);
  torsoBands(ctx, -29, -45, 58, 30, GREAT_HIDE);
  pixel(ctx, -29, -45, 40, 4, GREAT_HIDE.light);
  pixel(ctx, -29, -18, 58, 4, GREAT_HIDE.dark);
  roundedMass(ctx, -22, -30, 44, 15, JAGRAS_INK);
  roundedMass(ctx, -21, -29, 42, 13, JAGRAS_BELLY.base);
  pixel(ctx, -21, -29, 30, 3, JAGRAS_BELLY.light);
  for (let i = 0; i < 4; i++) pixel(ctx, -17 + i * 10, -25, 3, 8, JAGRAS_BELLY.dark);
  // Mane: a ridge of long spines from the neck to the tail. This is what tells
  // the elite apart from the pack even before the size registers.
  for (let i = 0; i < 7; i++) {
    const sx2 = -24 + i * 8;
    const rise = 9 + (i % 3) * 3 + (breath ? 1 : 0);
    // A stepped plate: wide at the back, narrowing to the point.
    pixel(ctx, sx2, -40 - rise, 7, rise + 2, JAGRAS_INK);
    for (let step = 0; step < 4; step++) {
      const inset = Math.round(step * 1.5);
      pixel(ctx, sx2 + 1 + inset, -40 - rise + step * 3, 5 - inset * 2, 4, GREAT_MANE.base);
      pixel(ctx, sx2 + 1 + inset, -40 - rise + step * 3, 2, 2, GREAT_MANE.light);
    }
    pixel(ctx, sx2 + 3, -40 - rise, 1, 4, GREAT_MANE.dark);
  }
  // Front arms with three claws each.
  for (const [ax, dir] of [[8, 1 - stride], [26, stride]]) {
    pixel(ctx, ax, -36 + dir, 9, 20 - dir, JAGRAS_INK);
    pixel(ctx, ax + 1, -35 + dir, 7, 18 - dir, GREAT_HIDE.mid);
    pixel(ctx, ax + 1, -35 + dir, 3, 15 - dir, GREAT_HIDE.base);
    pixel(ctx, ax - 3, -19 + dir, 14, 6, JAGRAS_INK);
    pixel(ctx, ax - 2, -18 + dir, 12, 4, GREAT_HIDE.dark);
    for (let claw = 0; claw < 3; claw++) pixel(ctx, ax - 2 + claw * 4, -15 + dir, 2, 3, JAGRAS_FANG);
  }
  // Neck and head: a broad wedge over an open jaw, the eye under a heavy brow.
  pixel(ctx, 16, -60, 14, 16, JAGRAS_INK);
  pixel(ctx, 17, -59, 12, 15, GREAT_HIDE.base);
  pixel(ctx, 17, -59, 4, 13, GREAT_HIDE.light);
  pixel(ctx, 27, -58, 3, 12, GREAT_HIDE.mid);
  roundedMass(ctx, 14, -72, 32, 20, JAGRAS_INK);
  roundedMass(ctx, 15, -71, 30, 18, GREAT_HIDE.base);
  pixel(ctx, 15, -71, 20, 4, GREAT_HIDE.light);
  pixel(ctx, 15, -56, 30, 3, GREAT_HIDE.dark);
  pixel(ctx, 22, -64, 8, 4, GREAT_HIDE.dark);
  pixel(ctx, 34, -64, 5, 4, '#f2c14e');
  pixel(ctx, 36, -63, 2, 2, JAGRAS_INK);
  pixel(ctx, 42, -68, 10, 6, JAGRAS_INK);
  pixel(ctx, 43, -67, 9, 4, GREAT_HIDE.mid);
  pixel(ctx, 43, -67, 6, 1, GREAT_HIDE.light);
  pixel(ctx, 18, -57, 28, 7, JAGRAS_INK);
  pixel(ctx, 20, -56, 25, 5, JAGRAS_MOUTH);
  for (let i = 0; i < 5; i++) pixel(ctx, 21 + i * 5, -57, 2, 2, JAGRAS_FANG);
  for (let i = 0; i < 5; i++) pixel(ctx, 23 + i * 5, -53, 2, 2, JAGRAS_FANG);
  pixel(ctx, 16, -51, 12, 4, JAGRAS_INK);
  pixel(ctx, 17, -50, 10, 2, GREAT_HIDE.mid);
  // Two horn nubs behind the eye.
  pixel(ctx, 18, -77, 4, 6, JAGRAS_INK);
  pixel(ctx, 19, -76, 2, 4, GREAT_MANE.mid);
  pixel(ctx, 26, -76, 3, 5, GREAT_MANE.dark);
  ctx.restore();
}

const KULU_INK = '#241a12';
const KULU_FEATHER = { light: '#e8c877', base: '#c79f4b', mid: '#9a7530', dark: '#6b4f1e' };
const KULU_BEAK = { light: '#f0d9a8', base: '#c9a86e', mid: '#9a7a46', dark: '#6a512a' };
const KULU_ROCK = { light: '#b9b3ab', base: '#8d8880', mid: '#66625c', dark: '#45423e' };

// Wave 3 mini-boss. Kulu-Ya-Ku: the bird wyvern that fights behind a rock. The
// rock is a body part here, not a prop: it is the largest silhouette in the
// frame because the fight is about going around it.
export function drawKuluYaKu(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const stride = Math.floor(time * 3 + seed) % 2;
  const bob = Math.floor(time * 2) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -34, 0, 69, 3, '#131a20');
  // Tail feathers: three stepped plumes sweeping back.
  for (let i = 0; i < 4; i++) {
    pixel(ctx, -52 + i * 8, -34 + i * 3, 12, 9 - i, KULU_INK);
    pixel(ctx, -51 + i * 8, -33 + i * 3, 10, 7 - i, i < 2 ? KULU_FEATHER.mid : KULU_FEATHER.dark);
    pixel(ctx, -50 + i * 8, -32 + i * 3, 6, 2, KULU_FEATHER.base);
  }
  // Legs: a bird's thigh, a long shin and three forward talons.
  for (const [lx, dir] of [[-16, stride], [12, 1 - stride]]) {
    pixel(ctx, lx, -26 + dir, 12, 20 - dir, KULU_INK);
    pixel(ctx, lx + 1, -25 + dir, 10, 18 - dir, KULU_FEATHER.base);
    pixel(ctx, lx + 1, -25 + dir, 3, 16 - dir, KULU_FEATHER.light);
    pixel(ctx, lx + 2, -8 + dir, 8, 8 - dir, KULU_INK);
    pixel(ctx, lx + 3, -7 + dir, 6, 6 - dir, KULU_FEATHER.mid);
    pixel(ctx, lx - 2, -2 + dir, 15, 4, KULU_INK);
    for (let claw = 0; claw < 3; claw++) pixel(ctx, lx - 1 + claw * 5, -1 + dir, 3, 2, KULU_BEAK.light);
    pixel(ctx, lx + 9, -5 + dir, 4, 3, KULU_INK);
  }
  // Body: a round feathered mass, lighter at the breast.
  roundedMass(ctx, -26, -56 + bob, 51, 34, KULU_INK);
  roundedMass(ctx, -25, -55 + bob, 49, 32, KULU_FEATHER.base);
  torsoBands(ctx, -25, -55 + bob, 49, 32, KULU_FEATHER);
  pixel(ctx, -25, -55 + bob, 30, 4, KULU_FEATHER.light);
  pixel(ctx, -25, -27 + bob, 49, 4, KULU_FEATHER.dark);
  roundedMass(ctx, -16, -42 + bob, 26, 18, KULU_FEATHER.mid);
  pixel(ctx, -14, -40 + bob, 20, 3, KULU_FEATHER.light);
  for (let i = 0; i < 4; i++) pixel(ctx, -18 + i * 8, -30 + bob, 5, 4, KULU_FEATHER.dark);
  // Pearl-blue wing feathers folded along the flank.
  for (let i = 0; i < 3; i++) {
    pixel(ctx, -28 + i * 4, -50 + i * 7 + bob, 10, 5, KULU_INK);
    pixel(ctx, -27 + i * 4, -49 + i * 7 + bob, 8, 3, '#7f9fb8');
    pixel(ctx, -27 + i * 4, -49 + i * 7 + bob, 4, 1, '#b9d0de');
  }
  // Neck and head: long neck, sharp beak, crest feathers and a yellow eye.
  pixel(ctx, 2, -72 + bob, 12, 18, KULU_INK);
  pixel(ctx, 3, -71 + bob, 10, 16, KULU_FEATHER.base);
  pixel(ctx, 3, -71 + bob, 3, 14, KULU_FEATHER.light);
  roundedMass(ctx, 0, -86 + bob, 22, 16, KULU_INK);
  roundedMass(ctx, 1, -85 + bob, 20, 14, KULU_FEATHER.base);
  pixel(ctx, 1, -85 + bob, 12, 3, KULU_FEATHER.light);
  pixel(ctx, 20, -82 + bob, 13, 6, KULU_INK);
  pixel(ctx, 21, -81 + bob, 12, 4, KULU_BEAK.base);
  pixel(ctx, 21, -81 + bob, 8, 2, KULU_BEAK.light);
  pixel(ctx, 19, -77 + bob, 10, 4, KULU_INK);
  pixel(ctx, 20, -76 + bob, 8, 2, KULU_BEAK.mid);
  pixel(ctx, 21, -74 + bob, 6, 1, KULU_BEAK.dark);
  pixel(ctx, 13, -84 + bob, 4, 4, '#f2c14e');
  pixel(ctx, 14, -83 + bob, 2, 2, KULU_INK);
  pixel(ctx, 4, -88 + bob, 10, 4, KULU_INK);
  pixel(ctx, 5, -87 + bob, 8, 2, KULU_FEATHER.mid);
  for (let i = 0; i < 4; i++) pixel(ctx, 3 + i * 4, -92 + bob, 2, 6, KULU_INK);
  // The rock: a rounded boulder held in front, stepped in the cast's way.
  roundedMass(ctx, 26, -40, 30, 34, KULU_INK);
  roundedMass(ctx, 27, -39, 28, 32, KULU_ROCK.base);
  roundedMass(ctx, 29, -41, 24, 8, KULU_INK);
  roundedMass(ctx, 30, -40, 22, 7, KULU_ROCK.light);
  pixel(ctx, 27, -9, 28, 3, KULU_ROCK.dark);
  for (let i = 0; i < 4; i++) pixel(ctx, 31 + i * 5, -34 + (i % 2) * 8, 6, 5, KULU_ROCK.mid);
  pixel(ctx, 33, -30, 3, 9, KULU_ROCK.dark);
  // Arms gripping the boulder, so the rock belongs to the body.
  for (const ay of [-38, -20]) {
    pixel(ctx, 18, ay, 12, 7, KULU_INK);
    pixel(ctx, 19, ay + 1, 10, 5, KULU_FEATHER.mid);
    pixel(ctx, 19, ay + 1, 4, 1, KULU_FEATHER.light);
  }
  ctx.restore();
}

const PUKEI_INK = '#122018';
const PUKEI_SCALE = { light: '#9fd08a', base: '#6fa95d', mid: '#4c803f', dark: '#325a2a' };
const PUKEI_SAC = { light: '#c79ae0', base: '#9a62b8', mid: '#723f8d', dark: '#4d2762' };
const PUKEI_WING = { light: '#c8e6b8', base: '#8fbe7e', mid: '#6a9860', dark: '#456b42' };

// Wave 5 mini-boss. Pukei-Pukei: the poison bird wyvern. The venom sac under the
// throat is the one saturated mass in the body, and the tongue hangs out of the
// open beak because both of its attacks come out of the mouth.
export function drawPukeiPukei(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const breathe = Math.floor(time * 2 + seed) % 2;
  pose(ctx, x, y, scale);
  pixel(ctx, -36, 0, 73, 3, '#131a20');
  // Tail: a scaled whip curling behind with barbs on the top edge.
  for (let i = 0; i < 5; i++) {
    const tx = -58 + i * 10;
    const ty = -30 + i * 4;
    const h = 9 - i;
    pixel(ctx, tx, ty, 12, h, PUKEI_INK);
    pixel(ctx, tx + 1, ty + 1, 10, h - 2, i < 2 ? PUKEI_SCALE.mid : PUKEI_SCALE.dark);
    pixel(ctx, tx + 1, ty + 1, 6, 1, PUKEI_SCALE.base);
    pixel(ctx, tx + 3, ty - 3, 3, 4, PUKEI_SAC.mid);
  }
  // Legs: two bird legs with long toes.
  for (const [lx, dir] of [[-18, breathe], [14, 1 - breathe]]) {
    pixel(ctx, lx, -24 + dir, 11, 19 - dir, PUKEI_INK);
    pixel(ctx, lx + 1, -23 + dir, 9, 17 - dir, PUKEI_SCALE.base);
    pixel(ctx, lx + 1, -23 + dir, 3, 15 - dir, PUKEI_SCALE.light);
    pixel(ctx, lx + 2, -7 + dir, 8, 7 - dir, PUKEI_INK);
    pixel(ctx, lx + 3, -6 + dir, 6, 5 - dir, PUKEI_SCALE.mid);
    pixel(ctx, lx - 2, -2 + dir, 15, 4, PUKEI_INK);
    for (let toe = 0; toe < 3; toe++) pixel(ctx, lx - 1 + toe * 5, -1 + dir, 3, 2, PUKEI_SAC.light);
  }
  // Body: scaled barrel with a darker back and a lit flank.
  roundedMass(ctx, -24, -54, 48, 32, PUKEI_INK);
  roundedMass(ctx, -23, -53, 46, 30, PUKEI_SCALE.base);
  torsoBands(ctx, -23, -53, 46, 30, PUKEI_SCALE);
  pixel(ctx, -23, -53, 30, 4, PUKEI_SCALE.light);
  pixel(ctx, -23, -27, 46, 4, PUKEI_SCALE.dark);
  for (let i = 0; i < 5; i++) pixel(ctx, -20 + i * 9, -46 + (i % 3) * 5, 4, 3, PUKEI_SCALE.dark);
  // Folded wings with the membrane ribs.
  for (let i = 0; i < 4; i++) {
    const wx = -30 + i * 5;
    pixel(ctx, wx, -50 + i * 7, 12, 6, PUKEI_INK);
    pixel(ctx, wx + 1, -49 + i * 7, 10, 4, PUKEI_WING.base);
    pixel(ctx, wx + 1, -49 + i * 7, 4, 1, PUKEI_WING.light);
    pixel(ctx, wx + 7, -47 + i * 7, 3, 1, PUKEI_WING.dark);
  }
  // The venom sac under the throat, sagging with each breath.
  roundedMass(ctx, -6, -32 - breathe, 20, 15, PUKEI_INK);
  roundedMass(ctx, -5, -31 - breathe, 18, 13, PUKEI_SAC.base);
  pixel(ctx, -5, -31 - breathe, 11, 3, PUKEI_SAC.light);
  pixel(ctx, -5, -21 - breathe, 18, 2, PUKEI_SAC.dark);
  pixel(ctx, 0, -28 - breathe, 3, 8, PUKEI_SAC.mid);
  // Neck and head: hooked beak, huge round eye, three-way crest.
  pixel(ctx, 12, -70 + breathe, 12, 20, PUKEI_INK);
  pixel(ctx, 13, -69 + breathe, 10, 18, PUKEI_SCALE.base);
  pixel(ctx, 13, -69 + breathe, 3, 16, PUKEI_SCALE.light);
  roundedMass(ctx, 8, -84 + breathe, 24, 18, PUKEI_INK);
  roundedMass(ctx, 9, -83 + breathe, 22, 16, PUKEI_SCALE.base);
  pixel(ctx, 9, -83 + breathe, 13, 4, PUKEI_SCALE.light);
  pixel(ctx, 30, -78 + breathe, 11, 6, PUKEI_INK);
  pixel(ctx, 31, -77 + breathe, 10, 4, PUKEI_SAC.base);
  pixel(ctx, 31, -77 + breathe, 7, 2, PUKEI_SAC.light);
  pixel(ctx, 28, -72 + breathe, 11, 5, PUKEI_INK);
  pixel(ctx, 29, -71 + breathe, 9, 3, PUKEI_SAC.mid);
  // The tongue: a long purple strap hanging out of the beak.
  pixel(ctx, 30, -70 + breathe, 6, 4, PUKEI_INK);
  pixel(ctx, 31, -69 + breathe, 5, 3, PUKEI_SAC.mid);
  pixel(ctx, 31, -66 + breathe, 4, 6, PUKEI_INK);
  pixel(ctx, 32, -65 + breathe, 2, 6, PUKEI_SAC.base);
  pixel(ctx, 32, -59 + breathe, 3, 3, PUKEI_SAC.light);
  pixel(ctx, 20, -80 + breathe, 5, 5, '#f2e06a');
  pixel(ctx, 21, -79 + breathe, 3, 3, PUKEI_INK);
  pixel(ctx, 22, -78 + breathe, 1, 1, '#f2e06a');
  // Crest: three feather horns over the skull.
  for (let i = 0; i < 3; i++) {
    pixel(ctx, 9 + i * 6, -90 - i * 2 + breathe, 3, 8 + i * 2, PUKEI_INK);
    pixel(ctx, 10 + i * 6, -89 - i * 2 + breathe, 1, 6 + i * 2, PUKEI_SAC.mid);
  }
  ctx.restore();
}

const RATH_INK = '#21100e';
const RATH_SCALE = { light: '#e0764a', base: '#b5472a', mid: '#8a2f1c', dark: '#5c1d12' };
const RATH_MEMBRANE = { light: '#efe6cd', base: '#ded2b4', mid: '#bfb191', dark: '#8e8470' };
const RATH_BELLY = { light: '#f4ecd6', base: '#ded2b4', mid: '#bfb191', dark: '#94896f' };
const RATH_HORN = { light: '#5a3b38', base: '#41282a', mid: '#2e1b1d', dark: '#1c1012' };
const RATH_EYE = '#f2c94c';
const RATH_FIRE = { light: '#ffe9a0', base: '#ffb03a', mid: '#e8611e' };

// Wave 6 boss. Rathalos: the act's wyvern, drawn front-on and symmetric like the
// reference — a red horned head over a segmented cream chest, wings spread to
// both sides with the membrane striped, and the tail hanging between the feet.
// The three phases change what it does, never what it looks like, so the
// silhouette carries the whole fight.
export function drawRathalos(ctx, x, y, options = {}) {
  const { time = 0, seed = 0, scale = 2 } = options;
  const flap = Math.floor(time * 3 + seed) % 2;
  const roar = Math.floor(time * 2) % 3 === 0;
  const lift = flap ? 3 : 0;
  pose(ctx, x, y, scale);
  pixel(ctx, -36, 0, 73, 4, '#131a20');
  // Wings behind everything: two membranes spread from the shoulders, rising to
  // the tips. Striped, because the reference's membrane is a striped fan, and
  // with the red bone riding the leading edge.
  for (const side of [-1, 1]) {
    for (let step = 0; step < 12; step++) {
      const t = (step + 0.5) / 12;
      const outer = 14 + t * 62;
      const top = -84 - t * 72 - lift;
      const bottom = -80 - t * 66 + Math.sin(Math.PI * t) * 32 - lift;
      const height = Math.max(5, Math.round(bottom - top));
      const x0 = side < 0 ? -Math.round(outer) - 8 : Math.round(outer);
      pixel(ctx, x0, Math.round(top), 8, height, RATH_MEMBRANE.base);
      pixel(ctx, x0, Math.round(top), 8, 2, RATH_MEMBRANE.light);
      if (step % 2 === 0) {
        pixel(ctx, x0 + (side < 0 ? 1 : 4), Math.round(top) + 3, 3, Math.max(2, height - 6), RATH_MEMBRANE.mid);
      }
      if (step % 2 === 1) {
        pixel(ctx, x0 + (side < 0 ? 0 : 1), Math.round(top) + height, 7, 4, RATH_MEMBRANE.dark);
      }
      pixel(ctx, x0, Math.round(top) - 3, 8, 4, RATH_SCALE.base);
      pixel(ctx, x0, Math.round(top) - 3, 8, 1, RATH_SCALE.light);
    }
    // The claw at the wing tip.
    const tipX = side < 0 ? -84 : 76;
    pixel(ctx, tipX, -160 - lift, 9, 7, RATH_INK);
    pixel(ctx, tipX + 2, -164 - lift, 5, 6, RATH_HORN.base);
    pixel(ctx, tipX + 3, -164 - lift, 2, 3, RATH_HORN.light);
  }
  // Tail: hangs between the feet, red segments narrowing to a point.
  for (let i = 0; i < 6; i++) {
    const w = 21 - i * 3;
    const ty = -40 + i * 7;
    pixel(ctx, -Math.round(w / 2) - 1, ty, w + 2, 9, RATH_INK);
    pixel(ctx, -Math.round(w / 2), ty + 1, w, 7, i < 3 ? RATH_SCALE.base : RATH_SCALE.mid);
    pixel(ctx, -Math.round(w / 2), ty + 1, Math.max(2, w - 5), 1, RATH_SCALE.light);
    if (i < 4) {
      pixel(ctx, -Math.round(w / 2) - 3, ty + 3, 3, 3, RATH_HORN.base);
      pixel(ctx, Math.round(w / 2), ty + 3, 3, 3, RATH_HORN.base);
    }
  }
  // Legs behind the arms: red thighs and cream shins with grey talons.
  for (const side of [-1, 1]) {
    const lx = side < 0 ? -17 : 9;
    pixel(ctx, lx, -46 + lift, 9, 30, RATH_INK);
    pixel(ctx, lx + 1, -45 + lift, 7, 28, RATH_SCALE.mid);
    pixel(ctx, lx + 1, -45 + lift, 3, 26, RATH_SCALE.base);
    pixel(ctx, lx - 2, -18 + lift, 13, 14, RATH_INK);
    pixel(ctx, lx - 1, -17 + lift, 11, 12, RATH_BELLY.base);
    pixel(ctx, lx - 1, -17 + lift, 3, 10, RATH_BELLY.light);
    pixel(ctx, lx - 4, -6 + lift, 17, 6, RATH_INK);
    for (let claw = 0; claw < 3; claw++) {
      pixel(ctx, lx - 4 + claw * 5, -5 + lift, 4, 4, RATH_MEMBRANE.light);
      pixel(ctx, lx - 4 + claw * 5, -2 + lift, 4, 3, RATH_MEMBRANE.dark);
    }
  }
  // Body: red shoulders framing a segmented cream chest, the reference's read.
  roundedMass(ctx, -18, -84, 37, 46, RATH_INK);
  roundedMass(ctx, -17, -83, 35, 44, RATH_SCALE.base);
  torsoBands(ctx, -17, -83, 35, 44, RATH_SCALE);
  pixel(ctx, -17, -83, 23, 4, RATH_SCALE.light);
  pixel(ctx, -17, -41, 35, 4, RATH_SCALE.dark);
  roundedMass(ctx, -12, -76, 25, 38, RATH_INK);
  roundedMass(ctx, -11, -75, 23, 36, RATH_BELLY.base);
  pixel(ctx, -11, -75, 16, 3, RATH_BELLY.light);
  for (let i = 0; i < 5; i++) {
    pixel(ctx, -9, -68 + i * 7, 19, 3, RATH_BELLY.mid);
    pixel(ctx, -9, -65 + i * 7, 19, 1, RATH_BELLY.dark);
  }
  // Shoulders: a wyvern has no arms. The forelimbs are the wings, so the only
  // thing between the chest and the membrane is the red root of the wing.
  for (const side of [-1, 1]) {
    const sx2 = side < 0 ? -19 : 11;
    pixel(ctx, sx2, -82, 10, 14, RATH_INK);
    pixel(ctx, sx2 + 1, -81, 8, 12, RATH_SCALE.mid);
    pixel(ctx, sx2 + 1, -81, 3, 9, RATH_SCALE.base);
    pixel(ctx, sx2 + 1, -70, 8, 3, RATH_SCALE.dark);
  }
  // Neck and head: red skull with a cream face, two bent horns, the forehead
  // spine, the yellow eyes and the open jaw. The head is narrower than the body
  // and the mouth is a dark opening with a few fangs, never a grid of teeth:
  // that grid is what made the first pass read as a mask.
  pixel(ctx, -8, -100, 16, 18, RATH_INK);
  pixel(ctx, -7, -99, 14, 16, RATH_SCALE.base);
  pixel(ctx, -7, -99, 4, 13, RATH_SCALE.light);
  roundedMass(ctx, -20, -132, 41, 36, RATH_INK);
  roundedMass(ctx, -19, -131, 39, 34, RATH_SCALE.base);
  pixel(ctx, -19, -131, 26, 4, RATH_SCALE.light);
  pixel(ctx, -19, -99, 39, 3, RATH_SCALE.dark);
  // Cream face plates: two cheeks and the brow over each eye.
  pixel(ctx, -17, -121, 10, 10, RATH_BELLY.base);
  pixel(ctx, -17, -121, 7, 2, RATH_BELLY.light);
  pixel(ctx, 7, -121, 10, 10, RATH_BELLY.base);
  pixel(ctx, 7, -121, 7, 2, RATH_BELLY.light);
  pixel(ctx, -12, -127, 7, 4, RATH_BELLY.base);
  pixel(ctx, 5, -127, 7, 4, RATH_BELLY.base);
  // Eyes: yellow with a dark slit, set under the brow.
  pixel(ctx, -13, -118, 7, 4, RATH_EYE);
  pixel(ctx, -10, -117, 3, 2, RATH_INK);
  pixel(ctx, 6, -118, 7, 4, RATH_EYE);
  pixel(ctx, 8, -117, 3, 2, RATH_INK);
  // Mouth: a dark opening with three fangs above and two below.
  pixel(ctx, -8, -111, 17, 10, RATH_INK);
  pixel(ctx, -7, -110, 15, 8, roar ? RATH_FIRE.base : '#40161a');
  if (roar) {
    pixel(ctx, -6, -109, 13, 2, RATH_FIRE.light);
    pixel(ctx, -3, -106, 8, 1, RATH_FIRE.mid);
  }
  pixel(ctx, -6, -111, 2, 4, RATH_BELLY.light);
  pixel(ctx, -1, -111, 2, 4, RATH_BELLY.light);
  pixel(ctx, 4, -111, 2, 4, RATH_BELLY.light);
  pixel(ctx, -4, -104, 2, 3, RATH_BELLY.light);
  pixel(ctx, 2, -104, 2, 3, RATH_BELLY.light);
  // Lower jaw in cream.
  pixel(ctx, -9, -102, 19, 5, RATH_INK);
  pixel(ctx, -8, -101, 17, 3, RATH_BELLY.base);
  pixel(ctx, -8, -101, 11, 1, RATH_BELLY.light);
  // Forehead spine and the two horns: each horn bends outward in two steps.
  pixel(ctx, -4, -142, 8, 18, RATH_HORN.base);
  pixel(ctx, -2, -142, 3, 14, RATH_HORN.light);
  pixel(ctx, -13, -132, 6, 10, RATH_HORN.base);
  pixel(ctx, -17, -140, 6, 10, RATH_HORN.base);
  pixel(ctx, -16, -140, 3, 7, RATH_HORN.light);
  pixel(ctx, 7, -132, 6, 10, RATH_HORN.base);
  pixel(ctx, 11, -140, 6, 10, RATH_HORN.base);
  pixel(ctx, 13, -140, 3, 7, RATH_HORN.light);
  ctx.restore();
}
