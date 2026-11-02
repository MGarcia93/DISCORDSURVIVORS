import { art, CONTOUR, noise } from './paint.mjs';

// Act 6 — Monster Hunter's Primordial Forest, the epilogue's world. A top-down
// forest floor: moss, giant ferns, tree trunks, fallen logs, a stream down one
// side and mushrooms in the shade. The middle stays open on purpose — six waves
// fight there, so the props frame the clearing instead of crowding it.
const GROUND = {
  deep: '#1d2e1f',
  soil: '#26351f',
  moss: '#2d4028',
  light: '#35492f',
  patch: '#22301e',
};
const FERN = { light: '#7cae52', base: '#5a8b3a', mid: '#41692a', dark: '#2c4a1d', stem: '#3a4a24' };
const WOOD = { body: '#463525', light: '#5a452e', mid: '#38291c', dark: '#241a10' };
const BARK = { light: '#5c4830', mid: '#3f3020', dark: '#241a10' };
const WATER = { deep: '#16282c', base: '#1e3a40', light: '#2a5058', foam: '#5d8a90' };
const ROCK = { light: '#5d6158', base: '#464b43', dark: '#2f3430', moss: '#3d5a30' };
const MUSH = { cap: '#a84b33', light: '#c96a4a', dark: '#7a3222', stem: '#d9cfae' };

// A fern seen from above: a fan of fronds around one heart. `size` is the
// radius in art pixels, so the same helper paints a giant fern at the border
// and a young one between the roots.
// Deterministic 0..1 scatter. Two salts give two independent sequences; using
// the same one for x and y lays every point on a diagonal.
function scatter(i, salt) {
  const value = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function fern(px, cx, cy, size, tones = FERN) {
  px(cx - 2, cy - 2, 5, 5, tones.dark);
  for (let leaf = 0; leaf < 11; leaf++) {
    const angle = -Math.PI + (leaf / 10) * Math.PI * 2;
    const length = size * (0.72 + ((leaf * 7) % 5) * 0.06);
    for (let step = 2; step < length; step += 2) {
      const t = step / length;
      const x = Math.round(cx + Math.cos(angle) * step);
      const y = Math.round(cy + Math.sin(angle) * step * 0.72);
      const color = t < 0.5 ? tones.light : t < 0.8 ? tones.base : tones.mid;
      px(x, y, t < 0.35 ? 3 : 2, t < 0.35 ? 2 : 1, color);
      // The leaflet pair, so a frond reads as a frond and not as a spoke.
      if (step % 6 === 0) px(x + 1, y + 1, 2, 1, tones.mid);
    }
  }
}

// A fallen log: contour, bark, a lit top edge and the rings on the cut end.
function log(px, x, y, length, thickness, tones = WOOD) {
  px(x + 1, y + 2, length, thickness, '#11141c');
  px(x, y, length, thickness, CONTOUR);
  px(x + 1, y + 1, length - 2, thickness - 2, tones.body);
  px(x + 1, y + 1, length - 4, 2, tones.light);
  px(x + 1, y + thickness - 3, length - 2, 1, tones.dark);
  for (let step = 6; step < length - 8; step += 9) {
    px(x + step, y + 3, 1, thickness - 5, tones.mid);
  }
  px(x + length - 5, y + 1, 4, thickness - 2, tones.mid);
  px(x + length - 4, y + 2, 2, thickness - 4, tones.light);
}

function rock(px, cx, cy, radius, tones = ROCK) {
  px(cx - radius, cy, radius * 2, radius, CONTOUR);
  px(cx - radius + 1, cy + 1, radius * 2 - 2, radius - 2, tones.base);
  px(cx - radius + 2, cy + 1, Math.max(2, radius - 1), 2, tones.light);
  px(cx + radius - 3, cy + 2, 2, radius - 3, tones.dark);
  px(cx - radius + 2, cy, Math.max(2, radius - 2), 2, tones.moss);
}

function mushroom(px, cx, cy, size) {
  px(cx - 1, cy, 3, size, MUSH.stem);
  px(cx - 1, cy, 1, size, '#efe6c8');
  px(cx - 4, cy - 4, 9, 4, CONTOUR);
  px(cx - 3, cy - 3, 7, 3, MUSH.cap);
  px(cx - 3, cy - 3, 5, 1, MUSH.light);
  px(cx + 1, cy - 2, 2, 1, MUSH.dark);
}

// A tree seen from above: the trunk is a crown of bark rings, and the shadow
// under it is the only thing that gives the clearing depth.
const TRUNKS = Object.freeze([
  [0.06, 0.09, 30], [0.30, 0.035, 17], [0.60, 0.05, 14],
  [0.87, 0.07, 23], [0.07, 0.90, 26], [0.31, 0.965, 15],
  [0.72, 0.93, 19], [0.90, 0.57, 15],
]);
const FERNS = Object.freeze([
  [0.155, 0.16, 20], [0.245, 0.10, 13], [0.40, 0.10, 11],
  [0.72, 0.13, 14], [0.80, 0.20, 16], [0.055, 0.30, 14],
  [0.045, 0.62, 12], [0.13, 0.76, 15], [0.10, 0.95, 12],
  [0.24, 0.88, 13], [0.46, 0.94, 11], [0.60, 0.90, 12],
  [0.83, 0.86, 16], [0.94, 0.80, 10], [0.52, 0.06, 9],
  [0.19, 0.42, 8], [0.90, 0.32, 8], [0.34, 0.70, 7],
]);
const ROCKS = Object.freeze([
  [0.055, 0.22, 7], [0.91, 0.44, 6], [0.08, 0.78, 6],
  [0.86, 0.78, 8], [0.30, 0.13, 5], [0.66, 0.86, 5],
]);
const MUSHROOMS = Object.freeze([
  [0.20, 0.22, 5], [0.24, 0.25, 4], [0.845, 0.16, 5],
  [0.878, 0.19, 4], [0.10, 0.66, 4], [0.90, 0.66, 5],
]);

export default {
  id: 'monster-hunter',
  title: 'Act 6 — Primordial Forest',
  draw(ctx, { width, height }) {
    const { fill, px, w, h, fx, fy, disc } = art(ctx, width, height);

    // Opaque base first: a transparent pixel would show the stage through the
    // bake, so the whole canvas is ground before any prop is painted.
    fill(0, 0, 1, 1, GROUND.moss);

    // --- Forest floor ------------------------------------------------------
    // Mottling instead of a tile grid: a checkerboard of ground tones reads as
    // a chessboard behind a crowd, which is exactly what the fight cannot have.
    // The scatter uses two independent hashes; `noise(i, ...)` for both axes
    // correlates them and paints diagonal bands across the floor.
    for (let i = 0; i < 1500; i++) {
      const x = Math.round(scatter(i, 1) * w);
      const y = Math.round(scatter(i, 2) * h);
      const n = Math.round(scatter(i, 3) * 60);
      const size = 2 + (i % 5);
      const color = n < 16 ? GROUND.soil : n < 34 ? GROUND.light
        : n < 46 ? GROUND.patch : GROUND.deep;
      px(x, y, size, size - (i % 2), color);
    }
    // Larger soft patches, so the floor has areas instead of only specks.
    for (let i = 0; i < 110; i++) {
      const x = Math.round(scatter(i, 4) * w);
      const y = Math.round(scatter(i, 5) * h);
      const n = Math.round(scatter(i, 6) * 60);
      px(x, y, 8 + (i % 10), 5 + (i % 6), n < 24 ? GROUND.patch : GROUND.light);
    }

    // --- The stream --------------------------------------------------------
    // It runs down the right edge so the clearing stays whole. Rows, not a
    // curve: the water is painted row by row on the same pixel unit.
    for (let y = 0; y < h; y++) {
      const center = Math.round(w * 0.962 - Math.sin((y / h) * Math.PI) * w * 0.03);
      const half = Math.round(11 + Math.sin((y / h) * Math.PI * 1.3) * 4);
      // Bank: a darker lip on both sides, so the water is cut into the ground.
      px(center - half - 2, y, half * 2 + 4, 1, GROUND.deep);
      px(center - half, y, half * 2, 1, WATER.base);
      px(center - half, y, 2, 1, WATER.light);
      px(center + half - 2, y, 2, 1, WATER.deep);
      if (noise(0, y, 3) % 17 === 0) px(center - 4, y, 8, 1, WATER.foam);
    }

    // --- Tree trunks -------------------------------------------------------
    for (const [fx2, fy2, radius] of TRUNKS) {
      const cx = Math.round(w * fx2);
      const cy = Math.round(h * fy2);
      // The crown's shadow falls to the bottom right, like every prop.
      disc(cx + 5, cy + 6, radius + 3, { light: '#11141c', mid: '#11141c', dark: '#11141c' });
      disc(cx, cy, radius, BARK, { edge: CONTOUR });
      disc(cx, cy, Math.max(3, radius - 9), BARK, { edge: null });
      px(cx - 3, cy - 1, 6, 3, BARK.mid);
      // Roots, four stubs that break the circle.
      px(cx - radius - 4, cy + 1, 6, 4, CONTOUR);
      px(cx + radius - 2, cy + 1, 6, 4, CONTOUR);
      px(cx - 2, cy - radius - 4, 4, 6, CONTOUR);
      px(cx - 2, cy + radius - 2, 4, 6, CONTOUR);
    }

    // --- Fallen logs -------------------------------------------------------
    log(px, Math.round(w * 0.17), Math.round(h * 0.33), Math.round(w * 0.15), 10);
    log(px, Math.round(w * 0.62), Math.round(h * 0.80), Math.round(w * 0.14), 9);

    // --- Rocks and mushrooms ----------------------------------------------
    for (const [fx2, fy2, radius] of ROCKS) {
      rock(px, Math.round(w * fx2), Math.round(h * fy2), radius);
    }
    for (const [fx2, fy2, size] of MUSHROOMS) {
      mushroom(px, Math.round(w * fx2), Math.round(h * fy2), size);
    }

    // --- Giant ferns -------------------------------------------------------
    // Painted last so their fronds lie over the floor and frame the clearing.
    for (const [fx2, fy2, size] of FERNS) {
      fern(px, Math.round(w * fx2), Math.round(h * fy2), size);
    }
  },
  // Spores drifting in the light: the one thing that moves in this world. Kept
  // to a handful of dots because this runs every frame.
  animate(ctx, { width, height, time }) {
    const { px, w, h } = art(ctx, width, height);
    for (let i = 0; i < 14; i++) {
      const drift = (time * (6 + (i % 4) * 3) + i * 37) % 120;
      const x = Math.round(w * (0.1 + (i * 0.061) % 0.8) + Math.sin(time * 0.6 + i) * 5);
      const y = Math.round(h * (0.9 - ((i * 0.137 + drift / 400) % 0.85)));
      px(x, y, 2, 2, i % 3 ? '#cfe3a0' : '#e8f2c4');
    }
  },
};
