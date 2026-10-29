import { art, CONTOUR, noise } from './paint.mjs';

// Zomboid arena: the combat floor and the default narrative backdrop.
//
// A world is painted once into a baked canvas (see ./index.mjs), so this file
// can afford per-tile detail: it never runs inside the frame loop. Add a new
// world by copying this shape and registering it in ./index.mjs.
//
// Everything is painted through `art()`, in art pixels: one art pixel is two
// canvas pixels, the same unit the cast is drawn on. Values stay in a narrow
// dark band, because the sprites are bright and outlined and they own the
// contrast on this screen.
const FLOOR = {
  deep: '#1a2422',
  slab: '#27342f',
  slabAlt: '#2b3934',
  slabWorn: '#2f3e38',
  slabNew: '#32413b',
  seam: '#1d2825',
  grain: '#32413b',
  stain: '#222e2b',
  grate: '#2f3d38',
};
const WALL = {
  face: '#4b4a42',
  faceAlt: '#514f46',
  top: '#635f53',
  foot: '#2a2925',
  grout: '#2f2e29',
};
// Light comes from the top left, as on the cast: the walls throw their shadow
// into the floor to the bottom right, and the floor is banded, not gradient.
const SHADOW = ['#1f2a27', '#232f2b', '#26332e'];
const TILE = { w: 22, h: 16 }; // 44x32 canvas px: a yard slab, not a mosaic tile
const BORDER = 8; // art px of stone kerb around the floor

export default {
  id: 'arena',
  title: 'Zomboid arena',
  draw(ctx, { width, height }) {
    const { fill, px, w: aw, h: ah } = art(ctx, width, height);

    // Opaque base first: the bake has no alpha, so a hole would show the stage.
    fill(0, 0, 1, 1, FLOOR.deep);

    // --- Slab floor -------------------------------------------------------
    const cols = Math.ceil((aw - BORDER * 2) / TILE.w) + 1;
    const rows = Math.ceil((ah - BORDER * 2) / TILE.h);
    for (let row = 0; row < rows; row++) {
      // Running bond: every other row is shifted half a slab, so the floor
      // reads as paving instead of a squared graph.
      const offset = row % 2 ? -Math.floor(TILE.w / 2) : 0;
      for (let col = 0; col < cols; col++) {
        let x = BORDER + offset + col * TILE.w;
        let w = TILE.w;
        const y = BORDER + row * TILE.h;
        const h = Math.min(TILE.h, ah - BORDER - y);
        if (x < BORDER) { w -= BORDER - x; x = BORDER; }
        if (x + w > aw - BORDER) w = aw - BORDER - x;
        if (w <= 0 || h <= 0) continue;
        const seed = noise(col, row, 3);
        // A few slabs are a newer pour: a real value jump, not a tint.
        const body = seed < 8 ? FLOOR.slabNew : seed < 45 ? FLOOR.slab : seed < 78 ? FLOOR.slabAlt : FLOOR.slabWorn;
        px(x, y, w, h, body);
        // Grout on two sides only: shared edges must not double up, and a light
        // top edge on every slab turns the floor into a brick lattice.
        px(x, y, w, 1, FLOOR.seam);
        px(x, y, 1, h, FLOOR.seam);
        // Surface grain at the cast's grain size.
        for (let g = 0; g < 4; g++) {
          const gx = x + 1 + (noise(g, seed, 7) % Math.max(1, w - 2));
          const gy = y + 1 + (noise(g, seed, 13) % Math.max(1, h - 2));
          px(gx, gy, 1, 1, g % 2 ? FLOOR.grain : FLOOR.seam);
        }
        if (w >= 9 && h >= 7 && seed % 4 === 0) {
          // A scuff: two short strokes, never a straight line across the slab.
          px(x + 3, y + 4, 4, 1, FLOOR.grain);
          px(x + 5, y + 5, 3, 1, FLOOR.seam);
        }
        if (w >= 8 && h >= 6 && seed < 20) px(x + 4, y + h - 3, 4, 1, FLOOR.stain);
      }
    }

    // --- Wall shadow ------------------------------------------------------
    // Three stepped bands instead of a gradient: the walls read as standing on
    // the floor and the space gains depth without a third value family.
    const bands = [6, 6, 5];
    bands.forEach((depth, index) => {
      const tone = SHADOW[index];
      px(BORDER, BORDER, aw - BORDER * 2, depth, tone);
      px(BORDER, BORDER, depth, ah - BORDER * 2, tone);
    });

    // --- Long cracks and repairs ------------------------------------------
    const crack = (x0, y0, steps, salt) => {
      let x = x0, y = y0;
      for (let i = 0; i < steps; i++) {
        px(x, y, 3, 1, FLOOR.seam);
        px(x + 1, y + 1, 2, 1, FLOOR.grain);
        x += noise(i, salt, 5) < 45 ? 2 : 4;
        y += noise(i, salt, 9) < 50 ? 2 : noise(i, salt, 11) < 80 ? 0 : -2;
        if (x > aw - BORDER - 6 || y > ah - BORDER - 6) break;
      }
    };
    crack(BORDER + 22, BORDER + 34, 40, 3);
    crack(BORDER + 64, ah - BORDER - 30, 30, 31);
    crack(aw - BORDER - 46, ah - BORDER - 22, 26, 19);
    // Two patched areas: newer concrete with its own edge, so the field is not
    // one repeating tile.
    // Positioned as fractions of the floor so a small canvas cannot push them
    // off the edge and paint a negative rectangle.
    for (const [fractionX, fractionY] of [[0.22, 0.30], [0.74, 0.63]]) {
      const patchX = BORDER + Math.round(((aw - BORDER * 2) * fractionX) / 2) * 2;
      const patchY = BORDER + Math.round(((ah - BORDER * 2) * fractionY) / 2) * 2;
      px(patchX, patchY, TILE.w * 2 + 2, TILE.h + 2, FLOOR.seam);
      px(patchX + 1, patchY + 1, TILE.w * 2, TILE.h, FLOOR.slabNew);
      px(patchX + 2, patchY + 2, 7, 1, '#3d4e46');
      px(patchX + 5, patchY + 5, 3, 1, FLOOR.seam);
    }

    // --- Centre drain -----------------------------------------------------
    const drainX = Math.round((aw / 2 - 12) / TILE.w) * TILE.w;
    const drainY = Math.round((ah / 2 - 9) / TILE.h) * TILE.h;
    px(drainX, drainY, 26, 20, CONTOUR);
    px(drainX + 1, drainY + 1, 24, 18, WALL.foot);
    px(drainX + 2, drainY + 2, 22, 16, FLOOR.deep);
    for (let i = 0; i < 5; i++) px(drainX + 3 + i * 4, drainY + 3, 2, 14, FLOOR.grate);
    px(drainX + 1, drainY + 1, 24, 1, FLOOR.grain);

    // --- Stone kerb -------------------------------------------------------
    // Blocks with one art pixel of contour, a lit top edge and a foot shadow, so
    // the border reads as a low wall seen from above instead of a flat frame.
    const blockW = 12;
    const kerbRow = (y, top) => {
      for (let x = 0; x < aw; x += blockW) {
        const w = Math.min(blockW, aw - x);
        px(x, y, w, BORDER, (x / blockW) % 2 ? WALL.face : WALL.faceAlt);
        px(x, y, w, 1, WALL.grout);
        px(x, y + 1, w, 1, top ? WALL.top : WALL.faceAlt);
        px(x, y + BORDER - 1, w, 1, WALL.foot);
        px(x, y, 1, BORDER, WALL.grout);
      }
    };
    kerbRow(0, true);
    kerbRow(ah - BORDER, false);
    for (let y = BORDER; y < ah - BORDER; y += blockW) {
      const h = Math.min(blockW, ah - BORDER - y);
      for (const x of [0, aw - BORDER]) {
        px(x, y, BORDER, h, (y / blockW) % 2 ? WALL.faceAlt : WALL.face);
        px(x, y, BORDER, 1, WALL.grout);
        px(x + (x ? BORDER - 1 : 0), y, 1, h, WALL.grout);
      }
    }
    // Worn lip where the wall meets the floor.
    px(BORDER - 1, BORDER - 1, aw - BORDER * 2 + 2, 1, CONTOUR);
    px(BORDER - 1, ah - BORDER, aw - BORDER * 2 + 2, 1, CONTOUR);
    px(BORDER - 1, BORDER - 1, 1, ah - BORDER * 2 + 2, CONTOUR);
    px(aw - BORDER, BORDER - 1, 1, ah - BORDER * 2 + 2, CONTOUR);

    // --- Debris -----------------------------------------------------------
    // Hugging the kerb only: nothing in the walkable centre, so a rock never
    // reads as an obstacle the cast should bump into.
    for (let i = 0; i < 22; i++) {
      const along = (i * 53) % (aw - BORDER * 2 - 8);
      const inset = 2 + ((i * 7) % 5);
      const top = i % 2 === 0;
      const vertical = i % 4 === 3;
      const x = vertical ? (i % 8 === 3 ? BORDER + inset : aw - BORDER - inset - 3) : BORDER + 3 + along;
      const y = vertical ? BORDER + 3 + ((i * 31) % (ah - BORDER * 2 - 8)) : top ? BORDER + inset : ah - BORDER - inset - 2;
      px(x, y, 3, 2, FLOOR.slabNew);
      px(x + 1, y + 1, 2, 1, CONTOUR);
      if (i % 5 === 0) px(x + 1, y - 1, 2, 1, '#43554c');
    }
    // Tufts pushing through the kerb joint.
    for (let i = 0; i < 10; i++) {
      const x = BORDER + 6 + (noise(i, 21, 5) % 90) * 5;
      const y = i % 2 ? BORDER - 2 : ah - BORDER;
      px(x, y, 2, 3, '#38503c');
      px(x + 1, y - 1, 2, 2, '#45613f');
    }
  },
};
