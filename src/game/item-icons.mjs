// Pixel-art item portraits for the shop. Each drawing works on a 32×32 grid
// and scales to the canvas size, so the same art works on desktop and mobile.
// No image assets: the shop stays dependency-free like the rest of the game.
const C = {
  outline: '#171c23', steel: '#c9d3dd', steelDark: '#8a97a5', red: '#c9556b',
  handleRed: '#a83c52', white: '#f2ead8', cream: '#e6d9b8', orange: '#e0954a',
  green: '#7fae6a', greenDark: '#4f7a45', blue: '#6f8fc7', blueDark: '#4d6a9c',
  yellow: '#e8cd7a', brown: '#8a6242', brownDark: '#5d4029', pink: '#d99aa8',
  shadow: '#00000033',
};

function makePainter(ctx, size) {
  const unit = size / 32;
  const r = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * unit), Math.round(y * unit), Math.round(w * unit), Math.round(h * unit));
  };
  return r;
}

const DRAWINGS = {
  scissors(r) {
    r(5, 24, 5, 5, C.handleRed); r(6, 25, 3, 3, C.outline);
    r(22, 24, 5, 5, C.handleRed); r(23, 25, 3, 3, C.outline);
    for (let step = 0; step < 9; step++) {
      r(8 + step, 6 + step, 3, 3, C.steel);
      r(21 - step, 6 + step, 3, 3, C.steelDark);
    }
    r(15, 4, 2, 3, C.outline); r(15, 14, 2, 2, C.white);
  },
  bleach(r) {
    r(13, 4, 6, 4, C.steelDark);
    r(10, 8, 12, 21, C.white);
    r(10, 8, 12, 3, C.cream);
    r(11, 16, 10, 9, C.blue);
    r(15, 18, 2, 5, C.white); r(13, 19, 6, 2, C.white);
    r(10, 27, 12, 2, C.blueDark);
  },
  slipper(r) {
    r(6, 14, 20, 9, C.blue);
    r(6, 21, 20, 3, C.blueDark);
    r(9, 10, 14, 4, C.yellow);
    r(15, 9, 3, 2, C.cream);
    r(7, 24, 3, 2, C.outline); r(22, 24, 3, 2, C.outline);
  },
  antidepressants(r) {
    r(9, 12, 8, 10, C.white);
    r(17, 12, 7, 10, C.orange);
    r(14, 12, 3, 10, C.cream);
    r(10, 14, 2, 6, C.cream);
    r(19, 13, 2, 3, C.white);
    r(10, 23, 14, 2, C.outline);
  },
  'extortion-phone': r => {
    r(9, 6, 14, 20, C.steelDark);
    r(11, 8, 10, 12, C.blue);
    r(12, 9, 8, 3, C.white);
    r(12, 13, 8, 1, C.blueDark);
    r(13, 20, 6, 2, C.steel);
    r(14, 24, 4, 2, C.outline);
    r(4, 4, 3, 6, C.yellow); r(25, 4, 3, 6, C.yellow);
  },
  'magic-mushrooms'(r) {
    r(13, 18, 5, 9, C.cream);
    r(9, 9, 13, 9, C.red);
    r(9, 9, 13, 2, C.handleRed);
    r(12, 12, 3, 3, C.white); r(18, 14, 3, 3, C.white);
    r(22, 22, 4, 5, C.cream);
    r(20, 16, 8, 6, C.orange);
    r(22, 18, 2, 2, C.white);
  },
  alcohol(r) {
    r(13, 4, 6, 7, C.greenDark);
    r(13, 3, 6, 2, C.brown);
    r(10, 11, 12, 18, C.green);
    r(10, 11, 3, 18, C.greenDark);
    r(12, 17, 8, 8, C.cream);
    r(14, 19, 4, 2, C.brownDark);
    r(15, 22, 2, 2, C.brownDark);
  },
  chicken(r) {
    r(8, 15, 14, 9, C.white);
    r(18, 9, 7, 6, C.white);
    r(18, 7, 3, 3, C.red); r(21, 6, 2, 2, C.red);
    r(25, 12, 3, 2, C.orange);
    r(19, 10, 2, 2, C.outline);
    r(10, 24, 2, 4, C.orange); r(17, 24, 2, 4, C.orange);
    r(6, 13, 4, 4, C.cream);
  },
};

const FALLBACK = r => {
  r(7, 9, 18, 16, C.brown);
  r(7, 9, 18, 2, C.brownDark);
  r(15, 9, 2, 16, C.brownDark);
  r(7, 16, 18, 2, C.brownDark);
};

// Unknown ids still render a neutral crate, so new catalog data never shows a
// blank card: authoring stays data-only until a drawing is added here.
export function drawItemIcon(ctx, id, size = 64) {
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  const r = makePainter(ctx, size);
  (Object.hasOwn(DRAWINGS, id) ? DRAWINGS[id] : FALLBACK)(r);
}

export const ILLUSTRATED_ITEMS = Object.freeze(Object.keys(DRAWINGS));
