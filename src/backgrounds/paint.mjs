import { pixel } from '../sprites.mjs';

// Shared painting helpers for the world backgrounds. Everything stays on the
// same hard pixel grid: deterministic noise instead of Math.random (a baked
// world must look identical every run).
//
// One art pixel is UNIT canvas pixels, exactly like the cast: the sprites draw
// at scale 2, so their smallest detail is a 2x2 square with a 1-unit contour.
// A world that paints odd coordinates puts a coarser raster behind those
// sprites and the two do not read as the same game. Paint through `art()` and
// every rectangle lands on that unit.
export const UNIT = 2;

// Contour and ground shadow borrowed from the cast, so a prop and a character
// share one outline colour and one light direction.
export const CONTOUR = '#171526';
export const CAST_SHADOW = '#11141c';

// Deterministic 0..96 variation for per-cell detail.
export function noise(ix, iy, salt = 0) {
  return Math.abs((ix * 17 + iy * 13 + salt * 29) % 97);
}

// Nested translucent squares read as a pixel-art glow without a gradient.
export function glow(ctx, x, y, radius, color, { steps = 4, alpha = 0.1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let step = steps; step >= 1; step--) {
    // Square steps on the shared grid, so a glow never breaks the pixel unit.
    const size = Math.max(UNIT, Math.round((radius * step) / steps / UNIT) * UNIT * 2);
    pixel(ctx, snap(x - size / 2), snap(y - size / 2), size, size, color);
  }
  ctx.restore();
}

const snap = value => Math.round(value / UNIT) * UNIT;

// A stepped circle painted row by row: the pixel-art way to draw a round mass.
// A stack of nested squares never reads as a crown, a bowl or a tower base, and
// that is what the first pass of the tree worlds looked like.
export function disc(px, cx, cy, radius, tones, { edge = null } = {}) {
  const size = Math.max(2, radius * 2);
  const rows = [];
  for (let i = 0; i < size; i++) {
    const t = (i + 0.5) / size;
    const half = Math.round(radius * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)));
    rows.push({ y: cy - radius + i, half, t });
  }
  for (const { y, half, t } of rows) {
    if (half <= 0) continue;
    // A narrow light band at the top: a wide one turns every round mass into a
    // sphere lit from the front instead of ground seen from above.
    px(cx - half, y, half * 2, 1, t < 0.26 ? tones.light : t < 0.72 ? tones.mid : tones.dark);
  }
  // The contour goes on after the fill, replacing the outermost pixel of each
  // row. Rows are joined by their step, not just their two extremes: a disc
  // whose width grows two units per row would otherwise show a dashed ring.
  if (edge) {
    const solid = rows.filter(row => row.half > 0);
    solid.forEach((row, index) => {
      const left = cx - row.half;
      const right = cx + row.half - 1;
      const first = index === 0;
      const last = index === solid.length - 1;
      if (first || last) {
        px(left, row.y, right - left + 1, 1, edge);
      } else {
        px(left, row.y, 1, 1, edge);
        px(right, row.y, 1, 1, edge);
      }
      const previous = solid[index - 1];
      if (!previous) return;
      const previousLeft = cx - previous.half;
      const previousRight = cx + previous.half - 1;
      // Close the staircase between this row and the one above it.
      px(Math.min(left, previousLeft), row.y, Math.abs(left - previousLeft) + 1, 1, edge);
      px(Math.min(right, previousRight), row.y, Math.abs(right - previousRight) + 1, 1, edge);
    });
  }
}

// A painter that cannot leave the grid.
//
//   fill(x, y, w, h, color)  fractions of the canvas — the only layout that
//                            survives both the 1144x748 stage and the 480x270
//                            story page.
//   px(x, y, w, h, color)    art pixels, for props that keep their own
//                            proportions instead of stretching with the canvas.
//   solid(x, y, w, h, body)  art pixels with a 1-unit contour and a shadow cast
//                            to the bottom-right, the cast's prop language.
export function art(ctx, width, height) {
  const fx = f => snap(f * width);
  const fy = f => snap(f * height);
  const px = (x, y, w, h, color) => pixel(ctx, x * UNIT, y * UNIT, w * UNIT, h * UNIT, color);
  const fill = (x, y, w, h, color) => {
    const left = fx(x), top = fy(y);
    // Snap the far edge, never the size: two neighbours that share an edge stay
    // flush instead of opening a seam between them.
    const right = Math.max(left + UNIT, fx(x + w));
    const bottom = Math.max(top + UNIT, fy(y + h));
    pixel(ctx, left, top, right - left, bottom - top, color);
  };
  const solid = (x, y, w, h, body, { shadow = true, edge = CONTOUR } = {}) => {
    if (shadow) px(x + 1, y + 1, w, h, CAST_SHADOW);
    px(x, y, w, h, edge);
    px(x + 1, y + 1, w - 2, h - 2, body);
  };
  // Canvas size in art pixels, so a world can loop tiles without dividing by UNIT.
  return { fill, px, solid, disc: (cx, cy, radius, tones, options) => disc(px, cx, cy, radius, tones, options), fx, fy, w: fx(1) / UNIT, h: fy(1) / UNIT };
}
