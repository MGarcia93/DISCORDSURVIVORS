import { art, CONTOUR, glow, noise } from './paint.mjs';

// Act 5 epilogue — the room where Maxi is. It is not the real world: this is the
// last layer of the game, the one the group never saw, and they walk into it
// believing they are back in Discord. Top-down like every act world, wide on
// purpose so the walk from the void to the desk can be seen.
const FLOOR = { base: '#2b2533', light: '#342d3d', dark: '#251f2c', seam: '#1d1825' };
const RUG = { body: '#3d2f4a', light: '#4a3857', dark: '#332742', edge: '#241b30' };
const WALL = { body: '#211c29', top: '#2c2535', trim: '#171320' };
const DESK = { body: '#4a3a2c', light: '#5a4635', dark: '#3a2d22', edge: '#241c15' };
const SCREEN = { body: '#15131d', glow: '#5865f2', hot: '#8f9bf8', code: '#b9d884' };
const IRON = { body: '#22202b', light: '#33303e', dark: '#181620' };

export default {
  id: 'creator-desk',
  title: 'Act 5 — The room behind the server',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);
    const wall = Math.round((0.145 * ah) / 2) * 2;
    const deskLeft = Math.round(0.6 * aw);
    const deskRight = Math.round(0.93 * aw);
    const deskTop = Math.round(0.26 * ah);
    const deskBottom = Math.round(0.55 * ah);

    // --- Floor -------------------------------------------------------------
    fill(0, 0, 1, 1, FLOOR.base);
    for (let y = 0; y < ah; y += 8) {
      px(0, y, aw, 1, FLOOR.seam);
      px(0, y + 1, aw, 1, FLOOR.light);
    }
    for (let i = 0; i < 260; i++) {
      const x = Math.round((noise(i, 3) / 97) * aw);
      const y = Math.round((noise(i, 7) / 97) * ah);
      px(x, y, 6, 2, i % 3 ? FLOOR.dark : FLOOR.light);
    }
    const rugLeft = Math.round(0.06 * aw);
    const rugRight = Math.round(0.52 * aw);
    const rugTop = Math.round(0.2 * ah);
    const rugBottom = Math.round(0.82 * ah);
    px(rugLeft + 2, rugTop + 2, rugRight - rugLeft, rugBottom - rugTop, RUG.edge);
    px(rugLeft, rugTop, rugRight - rugLeft, rugBottom - rugTop, RUG.body);
    px(rugLeft + 4, rugTop + 4, rugRight - rugLeft - 8, rugBottom - rugTop - 8, RUG.light);
    for (let band = rugTop + 10; band < rugBottom - 8; band += 14) {
      px(rugLeft + 6, band, rugRight - rugLeft - 12, 3, RUG.dark);
    }

    // --- Wall ---------------------------------------------------------------
    fill(0, 0, 1, wall / ah, WALL.body);
    px(0, 0, aw, 2, WALL.trim);
    px(0, wall - 3, aw, 3, WALL.top);
    for (let i = 0; i < 9; i++) {
      const x = Math.round((0.06 + i * 0.1) * aw);
      px(x, Math.round(wall * 0.25), 14, 8, i % 2 ? IRON.light : IRON.body);
      px(x + 2, Math.round(wall * 0.25) + 2, 10, 4, i % 3 ? SCREEN.glow : SCREEN.code);
    }

    // --- Desk ---------------------------------------------------------------
    px(deskLeft + 3, deskTop + 3, deskRight - deskLeft, deskBottom - deskTop, WALL.trim);
    px(deskLeft, deskTop, deskRight - deskLeft, deskBottom - deskTop, DESK.edge);
    px(deskLeft + 2, deskTop + 2, deskRight - deskLeft - 4, deskBottom - deskTop - 4, DESK.body);
    px(deskLeft + 2, deskTop + 2, deskRight - deskLeft - 4, 3, DESK.light);
    px(deskLeft + 2, deskBottom - 5, deskRight - deskLeft - 4, 3, DESK.dark);
    for (let x = deskLeft + 10; x < deskRight - 10; x += 18) px(x, deskTop + 6, 12, 1, DESK.dark);

    // Two monitors lying flat on the desk, light spilling onto the wood.
    for (const [index, screenX] of [0.66, 0.755].entries()) {
      const x = Math.round(screenX * aw);
      const y = Math.round(deskTop + 8);
      const w = Math.round(0.075 * aw);
      const h = Math.round((deskBottom - deskTop) * 0.46);
      glow(ctx, (x + w / 2) * 2, (y + h / 2) * 2, w * 2.2, index ? SCREEN.glow : SCREEN.code, { alpha: 0.09, steps: 4 });
      px(x - 1, y - 1, w + 2, h + 2, SCREEN.body);
      px(x, y, w, h, '#0d0b14');
      if (index === 0) {
        px(x + 2, y + 2, w - 4, 4, SCREEN.code);
        for (let row = y + 8; row < y + h - 3; row += 4) {
          const length = 4 + (Math.abs(noise(row, 11)) % (w - 8));
          px(x + 3, row, length, 1, SCREEN.code);
        }
      } else {
        px(x + 2, y + 2, w - 4, 5, SCREEN.glow);
        px(x + 2, y + 9, w - 14, 3, SCREEN.hot);
        for (let row = y + 15; row < y + h - 3; row += 5) px(x + 3, row, w - 10, 2, '#3b3560');
      }
    }
    // Keyboard, mouse and the cup that never leaves a developer's desk.
    px(Math.round(0.665 * aw), Math.round(deskTop + (deskBottom - deskTop) * 0.62), 46, 14, IRON.dark);
    px(Math.round(0.665 * aw) + 2, Math.round(deskTop + (deskBottom - deskTop) * 0.62) + 2, 42, 10, IRON.light);
    for (let key = 0; key < 8; key++) px(Math.round(0.665 * aw) + 4 + key * 5, Math.round(deskTop + (deskBottom - deskTop) * 0.62) + 4, 3, 2, IRON.body);
    px(Math.round(0.735 * aw), Math.round(deskTop + (deskBottom - deskTop) * 0.66), 8, 12, IRON.light);
    disc(Math.round(0.79 * aw), Math.round(deskTop + (deskBottom - deskTop) * 0.7), 4, ['#e8e0cc', '#c9c0a8', '#8f8878']);

    // The tower, with its one green light, and the cables running to the floor.
    px(Math.round(0.88 * aw), Math.round(deskTop + 6), 28, 44, IRON.dark);
    px(Math.round(0.88 * aw) + 2, Math.round(deskTop + 8), 24, 40, IRON.body);
    px(Math.round(0.88 * aw) + 6, Math.round(deskTop + 14), 16, 6, SCREEN.glow);
    px(Math.round(0.88 * aw) + 6, Math.round(deskTop + 24), 16, 2, IRON.light);
    px(Math.round(0.88 * aw) + 18, Math.round(deskTop + 40), 4, 3, SCREEN.code);
    for (const [dx, wobble] of [[0.86, 4], [0.9, -3], [0.84, 2]]) {
      let cx = Math.round(dx * aw);
      let cy = deskBottom;
      for (let step = 0; step < 10; step++) {
        cx += wobble + (step % 2 ? 2 : 0);
        cy += 5;
        px(cx, cy, 2, 5, IRON.dark);
      }
    }

    // Chair pushed back from the desk.
    const chairX = Math.round(0.74 * aw);
    const chairY = Math.round(deskBottom + 22);
    disc(chairX, chairY, 20, [IRON.light, IRON.body, IRON.dark], { edge: CONTOUR });
    disc(chairX, chairY - 16, 12, [IRON.body, IRON.dark], { edge: CONTOUR });
    px(chairX - 2, chairY + 18, 5, 10, IRON.dark);
    px(chairX + 10, chairY + 18, 5, 10, IRON.dark);

    // Scattered papers and the plant at the near end of the rug.
    for (const [pxFrac, pyFrac, tone] of [[0.42, 0.72, '#d9d2c0'], [0.45, 0.61, '#c7bfae'], [0.36, 0.66, '#d9d2c0']]) {
      px(Math.round(pxFrac * aw), Math.round(pyFrac * ah), 16, 11, tone);
      px(Math.round(pxFrac * aw) + 2, Math.round(pyFrac * ah) + 2, 12, 1, '#8f8878');
    }
    const plantX = Math.round(0.55 * aw);
    const plantY = Math.round(0.75 * ah);
    px(plantX - 8, plantY, 20, 16, '#5a3a2a');
    px(plantX - 6, plantY - 14, 16, 16, '#2f5a34');
    px(plantX - 12, plantY - 22, 12, 14, '#3b6b3f');
    px(plantX + 2, plantY - 24, 12, 14, '#3b6b3f');
  },
};
