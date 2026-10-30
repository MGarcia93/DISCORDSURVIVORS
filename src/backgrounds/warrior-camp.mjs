import { art, CONTOUR, noise } from './paint.mjs';

// Act 4 — the slavers' camp where Warrior is held, painted as a wide top-down
// strip: stockade along both long edges, the Wheel of Pain and its prisoners on
// the way in, the cells deeper inside and a smoking building at the far end.
// Colours, wall, banners, cages and wheel follow the shipped `exiles` world, so
// the camp reads as the same place from the arrival to this rescue.
const EARTH = { base: '#bf8b4f', light: '#c8955a', dark: '#b5834a', deep: '#a2763f', shadow: '#87603a' };
const WOOD = { body: '#4a3524', light: '#5c422c', dark: '#3a2a1c', deep: '#2e2016', edge: '#1f150e' };
const IRON = { body: '#33332f', light: '#55554d', dark: '#22221f' };
const CANVAS = { body: '#8e2b2b', light: '#a83a35', dark: '#5e1a1a' };
const CLOTH = '#e8e0cc';
const BLOOD = { body: '#7a1d20', dark: '#571316' };
const FIRE = { core: '#ffe6a8', hot: '#ffb451', ember: '#ff7a1c', base: '#b8501a' };
const SMOKE = ['#6f6560', '#5d5550', '#7b716c'];

export default {
  id: 'warrior-camp',
  title: 'Act 4 — The slavers’ camp',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);
    const wall = Math.round((0.070 * ah) / 2) * 2;
    const bottom = ah - wall;

    // --- Packed-earth floor ----------------------------------------------
    fill(0, 0, 1, 1, EARTH.base);
    for (let i = 0; i < 520; i++) {
      const x = Math.round((noise(i, 3) / 97) * aw);
      const y = Math.round((noise(i, 7) / 97) * ah);
      px(x, y, 8, 4, i % 3 ? EARTH.light : EARTH.dark);
    }
    // Broad darker patches so the long floor is not one flat tone.
    for (let i = 0; i < 12; i++) {
      const x = Math.round((noise(i * 3 + 1, 131) / 97) * aw);
      const y = Math.round((noise(i * 5 + 2, 197) / 97) * ah);
      px(x, y, 60 + (noise(i, 41) % 5) * 20, 20 + (noise(i, 43) % 4) * 8, EARTH.dark);
    }
    for (let i = 0; i < 22; i++) {
      const fx = 0.03 + (noise(i, 17) / 97) * 0.92;
      const fy = 0.14 + (noise(i, 19) / 97) * 0.68;
      const x = Math.round(fx * aw), y = Math.round(fy * ah), s = 8 + (noise(i, 23) % 3) * 4;
      px(x + 3, y + 3, s, s, EARTH.shadow);
      px(x, y, s, s, '#6f6a62');
      px(x, y, s, 3, '#8a8478');
      px(x, y + s - 3, s, 3, '#57534b');
    }
    // Blood: a few old pools, the only saturated thing on the floor.
    const splat = (fx, fy, size, seed) => {
      const cx = Math.round(fx * aw), cy = Math.round(fy * ah);
      const pools = [[0, 0, 9, 5], [-6, 3, 7, 4], [5, -3, 6, 3], [-2, -5, 5, 3]];
      for (const [dx, dy, w, h] of pools) px(cx + dx * size, cy + dy * size, w * size, h * size, BLOOD.dark);
      for (const [dx, dy, w, h] of pools) {
        px(cx + dx * size + 2, cy + dy * size, Math.max(2, w * size - 4), Math.max(2, h * size - 2), BLOOD.body);
      }
      for (let i = 0; i < 7; i++) {
        px(cx + (noise(i, seed) % 13) * 2 * size - 6 * size, cy + (noise(i, seed + 7) % 11) * 2 * size - 5 * size, 2, 2, BLOOD.dark);
      }
    };
    splat(0.10, 0.30, 1, 3);
    splat(0.52, 0.62, 1, 9);
    splat(0.66, 0.28, 1, 15);
    splat(0.79, 0.60, 1, 21);

    // --- Stockade: top and bottom walls ----------------------------------
    const timber = (top, band) => {
      px(0, top, aw, band, WOOD.deep);
      for (let y = top + 4; y < top + band - 2; y += 9) {
        px(0, y, aw, 2, WOOD.dark);
        px(0, y + 2, aw, 2, WOOD.body);
        px(0, y + 2, aw, 1, WOOD.light);
      }
    };
    timber(0, wall);
    timber(bottom, wall + 3);
    for (let x = 10; x < aw - 12; x += 72) {
      px(x, 0, 14, wall + 6, WOOD.edge);
      px(x + 2, 0, 10, wall + 4, WOOD.body);
      px(x + 2, 0, 3, wall + 4, WOOD.light);
      px(x + 4, wall + 6, 18, 5, EARTH.shadow);
      px(x, bottom - 6, 14, wall + 6, WOOD.edge);
      px(x + 2, bottom - 4, 10, wall + 4, WOOD.body);
      px(x + 2, bottom - 4, 3, wall + 4, WOOD.light);
      px(x + 4, bottom - 11, 18, 5, EARTH.shadow);
    }
    // Contact shadow against both walls, so the floor starts where they end.
    px(0, wall, aw, 2, EARTH.deep);
    px(0, bottom - 2, aw, 2, EARTH.deep);
    for (let i = 0; i < 40; i++) {
      const x = Math.round((noise(i, 51) / 97) * (aw - 24));
      px(x, wall + 2, 12 + (noise(i, 53) % 4) * 6, 3, EARTH.shadow);
      const bx = Math.round((noise(i, 67) / 97) * (aw - 24));
      px(bx, bottom - 5, 12 + (noise(i, 69) % 4) * 6, 3, EARTH.shadow);
    }

    // --- Banners on the top wall -----------------------------------------
    const banner = (fx, w, h) => {
      const x = Math.round(fx * aw - w / 2), y = 2;
      px(x, y, w, h, CANVAS.body);
      px(x, y, 2, h, CANVAS.dark);
      px(x + w - 2, y, 2, h, CANVAS.dark);
      px(x, y + h - 3, w, 3, CANVAS.dark);
      px(x + 2, y, w - 4, 3, CANVAS.light);
      px(x + Math.round(w * 0.30), y + 3, 2, h - 6, CANVAS.dark);
      px(x + Math.round(w * 0.66), y + 3, 2, h - 6, CANVAS.dark);
      const cx = x + Math.round(w / 2), cy = y + Math.round(h / 2) - 1;
      px(cx - 6, cy - 4, 12, 9, CLOTH);
      px(cx - 10, cy - 8, 4, 6, CLOTH);
      px(cx + 6, cy - 8, 4, 6, CLOTH);
      px(cx - 4, cy - 1, 3, 3, CANVAS.dark);
      px(cx + 1, cy - 1, 3, 3, CANVAS.dark);
      px(cx - 2, cy + 5, 4, 5, CLOTH);
    };
    banner(0.075, 26, 62);
    banner(0.34, 44, 70);
    banner(0.545, 26, 62);
    banner(0.80, 34, 66);

    // --- Crates, braziers and hanging cages ------------------------------
    const crate = (fx, top, w, h) => {
      const x = Math.round(fx * aw - w / 2), y = Math.round(top);
      px(x + 4, y + 5, w, h, EARTH.shadow);
      px(x, y, w, h, WOOD.edge);
      px(x + 2, y + 2, w - 4, h - 4, WOOD.dark);
      px(x + 2, y + 2, w - 4, 3, WOOD.light);
      px(x + 2, y + h - 5, w - 4, 3, WOOD.deep);
      for (let i = 1; i < 3; i++) px(x + Math.round((w * i) / 3), y + 2, 2, h - 4, WOOD.edge);
    };
    const brazier = (fx, fy) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      px(x - 12, y - 4, 24, 12, WOOD.edge);
      px(x - 10, y - 6, 20, 6, WOOD.body);
      px(x - 8, y - 8, 16, 5, IRON.body);
      px(x - 6, y - 12, 12, 6, FIRE.base);
      px(x - 5, y - 14, 10, 5, FIRE.ember);
      px(x - 3, y - 17, 6, 5, FIRE.hot);
      px(x - 1, y - 19, 3, 4, FIRE.core);
    };
    for (const fx of [0.245, 0.42, 0.60, 0.86]) {
      brazier(fx, 0.145);
      brazier(fx, 0.855);
    }
    crate(0.29, wall - 2, 30, 20);
    crate(0.325, wall + 2, 26, 18);
    crate(0.93, wall - 2, 30, 20);
    crate(0.44, bottom - 24, 30, 20);

    const cage = (fx, fy, chainFrom, chainLength) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah), w = 38, h = 44;
      for (let i = 0; i < chainLength; i++) {
        if (chainFrom === 'top') px(x + Math.round(w / 2) - 2, y - i * 7 - 6, 4, 5, i % 2 ? IRON.light : IRON.body);
        else px(x + w + i * 7 + 2, y + Math.round(h / 2) - 2, 5, 4, i % 2 ? IRON.light : IRON.body);
      }
      px(x + 5, y + 7, w, h, EARTH.shadow);
      px(x, y, w, h, CONTOUR);
      px(x + 2, y + 2, w - 4, h - 4, IRON.dark);
      px(x + 2, y + 2, w - 4, 3, IRON.light);
      for (let i = 1; i < 5; i++) px(x + i * 8, y + 4, 3, h - 8, IRON.body);
      px(x + 3, y + Math.round(h * 0.46), w - 6, 3, IRON.light);
      const sx = x + Math.round(w / 2), sy = y + Math.round(h / 2);
      px(sx - 7, sy - 8, 14, 12, CLOTH);
      px(sx - 4, sy - 4, 3, 4, '#2a2620');
      px(sx + 2, sy - 4, 3, 4, '#2a2620');
      px(sx - 3, sy + 4, 6, 4, CLOTH);
      for (const [dx, dy] of [[0, 0], [w - 8, 0], [0, h - 8], [w - 8, h - 8]]) {
        px(x + dx + 1, y + dy + 1, 7, 7, IRON.body);
        px(x + dx + 1, y + dy + 1, 7, 2, IRON.light);
      }
      px(x + Math.round(w / 2) - 3, y - 6, 6, 7, IRON.body);
    };
    cage(0.055, 0.150, 'top', 5);
    cage(0.50, 0.150, 'top', 5);

    // --- Tents on the way in ---------------------------------------------
    const tent = (fx, fy, w, h) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      px(x + 6, y + 8, w, h, EARTH.shadow);
      // A ridge tent from above: two canvas slopes meeting on a lit ridge, with
      // a dark doorway at the near hem and pegs pulling the guy ropes out.
      px(x, y, w, h, CANVAS.dark);
      const ridge = Math.round(w * 0.48);
      px(x + 2, y + 2, ridge - 2, h - 4, CANVAS.body);
      px(x + ridge + 2, y + 2, w - ridge - 4, h - 4, CANVAS.dark);
      px(x + ridge, y + 2, 2, h - 4, CANVAS.light);
      for (let seam = 4; seam < w - 6; seam += 9) px(x + seam, y + 4, 1, h - 8, '#7d2323');
      px(x + Math.round(w / 2) - 7, y + h - 13, 14, 11, '#3b1414');
      px(x + Math.round(w / 2) - 6, y + h - 12, 12, 3, CANVAS.dark);
      for (let i = 0; i < 3; i++) {
        px(x - 4 + i * 3, y + h + 2 + i * 2, 3, 2, WOOD.dark);
        px(x + w + 1 - i * 3, y + h + 2 + i * 2, 3, 2, WOOD.dark);
      }
    };
    tent(0.015, 0.240, 62, 48);
    tent(0.022, 0.610, 56, 42);
    tent(0.105, 0.185, 52, 40);

    // --- The Wheel of Pain ------------------------------------------------
    const wheelX = Math.round(0.165 * aw), wheelY = Math.round(0.50 * ah), radius = Math.max(26, Math.round((0.105 * ah) / 2) * 2);
    disc(wheelX + 5, wheelY + 6, radius, { light: EARTH.shadow, mid: EARTH.shadow, dark: EARTH.shadow });
    disc(wheelX, wheelY, radius, { light: WOOD.light, mid: WOOD.body, dark: WOOD.edge }, { edge: CONTOUR });
    disc(wheelX, wheelY, radius - 8, { light: EARTH.deep, mid: EARTH.shadow, dark: EARTH.shadow });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      for (let step = 7; step < radius - 6; step += 3) {
        px(wheelX + Math.round(Math.cos(a) * step) - 2, wheelY + Math.round(Math.sin(a) * step) - 2, 4, 4, WOOD.light);
      }
    }
    disc(wheelX, wheelY, 9, { light: WOOD.light, mid: WOOD.body, dark: WOOD.edge }, { edge: CONTOUR });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      px(wheelX + Math.round(Math.cos(a) * radius) - 2, wheelY + Math.round(Math.sin(a) * radius) - 2, 4, 4, IRON.body);
    }
    // Push bars and the worn ring the prisoners walk in.
    px(wheelX + radius, wheelY - 3, 46, 6, WOOD.body);
    px(wheelX - radius - 46, wheelY - 3, 46, 6, WOOD.body);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      px(wheelX + Math.round(Math.cos(a) * (radius + 26)) - 3, wheelY + Math.round(Math.sin(a) * (radius + 26)) - 2, 7, 3, EARTH.deep);
    }
    // Bridle posts and their chains.
    for (const [bx, side] of [[0.093, -1], [0.238, 1]]) {
      const x = Math.round(bx * aw), y = wheelY;
      px(x + (side < 0 ? -14 : 4), y - 34, 12, 70, WOOD.edge);
      px(x + (side < 0 ? -12 : 6), y - 32, 8, 66, WOOD.body);
      px(x + (side < 0 ? -12 : 6), y - 32, 3, 66, WOOD.light);
      for (let i = 0; i < 6; i++) {
        px(x + (side < 0 ? 6 : -12) + side * i * 6, y - 24 + i * 5, 5, 4, i % 2 ? IRON.light : IRON.body);
      }
    }

    // --- Prisoner pen and its cells --------------------------------------
    const penLeft = Math.round(0.615 * aw), penRight = Math.round(0.845 * aw);
    const penTop = Math.round(0.215 * ah), penBottom = Math.round(0.785 * ah);
    px(penLeft, penTop, penRight - penLeft, penBottom - penTop, EARTH.deep);
    for (let i = 0; i < 90; i++) {
      // Different salts per axis: close salts correlate and lay the scatter out
      // along diagonal stripes instead of covering the pen.
      const x = penLeft + Math.round((noise(i * 7 + 3, 271) / 97) * (penRight - penLeft - 8));
      const y = penTop + Math.round((noise(i * 13 + 5, 419) / 97) * (penBottom - penTop - 6));
      px(x, y, 8, 3, i % 2 ? EARTH.dark : EARTH.shadow);
    }
    // Dirty straw in the corners: the pen is lived in, not a painted rectangle.
    for (let i = 0; i < 46; i++) {
      const x = penLeft + 6 + Math.round((noise(i * 3 + 11, 733) / 97) * (penRight - penLeft - 20));
      const y = penTop + 6 + Math.round((noise(i * 5 + 17, 887) / 97) * (penBottom - penTop - 16));
      px(x, y, 5 + (i % 3) * 3, 1, i % 2 ? '#b09a63' : '#9c874f');
    }
    // Ground shackles inside the pen: the prisoners' side of the trade.
    for (const fx of [0.645, 0.825]) {
      const x = Math.round(fx * aw), y = Math.round(0.42 * ah);
      px(x, y, 9, 4, IRON.body);
      px(x + 1, y - 1, 7, 2, IRON.light);
      px(x + 3, y + 4, 2, 12, IRON.dark);
      px(x + 2, y + 14, 6, 3, IRON.body);
    }
    const fence = (x0, y0, x1, y1) => {
      px(x0, y0, x1 - x0, 3, WOOD.edge);
      px(x0, y0 + 3, x1 - x0, 2, WOOD.body);
      for (let x = x0; x < x1 - 2; x += 26) {
        px(x, y0 - 6, 6, 15, WOOD.edge);
        px(x + 1, y0 - 5, 4, 13, WOOD.light);
        px(x + 1, y0 + 9, 6, 3, EARTH.shadow);
      }
      px(x1 - 6, y0 - 6, 6, 15, WOOD.edge);
    };
    fence(penLeft, penTop, penRight, penTop);
    fence(penLeft, penBottom, penRight, penBottom);
    // Side rails with the same posts as the long ones: a bare bar read as a
    // wall seam instead of the low fence the prisoners lean on.
    for (const x of [penLeft, penRight - 6]) {
      px(x, penTop, 6, penBottom - penTop, WOOD.edge);
      px(x + 1, penTop + 2, 4, penBottom - penTop - 4, WOOD.body);
      px(x + 1, penTop, 2, penBottom - penTop, WOOD.light);
      for (let y = penTop + 8; y < penBottom - 8; y += 26) {
        px(x - 2, y, 10, 12, WOOD.edge);
        px(x - 1, y + 1, 8, 10, WOOD.light);
        px(x - 1, y + 11, 10, 3, EARTH.shadow);
      }
    }
    // Two empty cells behind the one the scene draws around Warrior himself.
    // --- The smoking building Warrior points at --------------------------
    const hutX = Math.round(0.885 * aw), hutY = Math.round(0.30 * ah);
    const hutW = Math.round(0.085 * aw), hutH = Math.round(0.26 * ah);
    const half = Math.round(hutW / 2);
    px(hutX + 8, hutY + 10, hutW, hutH, EARTH.shadow);
    // A roof seen from above: two slopes, a lit ridge, eaves and a chimney.
    px(hutX, hutY, hutW, hutH, WOOD.edge);
    px(hutX + 1, hutY + 1, half - 1, hutH - 2, '#6a5238');
    px(hutX + half + 1, hutY + 1, hutW - half - 2, hutH - 2, '#3f2d1e');
    for (let y = hutY + 4; y < hutY + hutH - 4; y += 5) {
      px(hutX + 2, y, half - 3, 1, '#43301f');
      px(hutX + half + 2, y + 2, hutW - half - 4, 1, '#2b1e12');
    }
    px(hutX + half - 1, hutY + 1, 2, hutH - 2, '#6b5238');
    px(hutX + half - 1, hutY + 1, 1, hutH - 2, '#8a6b48');
    px(hutX + 1, hutY + 1, hutW - 2, 2, '#2a1d12');
    px(hutX + 1, hutY + hutH - 3, hutW - 2, 2, '#1a1209');
    // Chimney and its cap, sitting proud of the ridge.
    px(hutX + Math.round(hutW * 0.70), hutY + Math.round(hutH * 0.16), 10, 12, WOOD.edge);
    px(hutX + Math.round(hutW * 0.70) + 1, hutY + Math.round(hutH * 0.16) + 1, 8, 10, '#33302b');
    px(hutX + Math.round(hutW * 0.70), hutY + Math.round(hutH * 0.16), 10, 3, '#4a463f');
    // Smoke climbing off the chimney: a widening, drifting column that stops
    // under the stockade. Static, so the bake still costs nothing per frame.
    const chimneyX = hutX + Math.round(hutW * 0.70) + 5;
    for (let i = 0; i < 12; i++) {
      const y = hutY + Math.round(hutH * 0.16) - 8 - i * 7;
      if (y < wall + 12) break;
      const size = 7 + i * 2;
      const drift = Math.round(Math.sin(i * 0.85) * 3 + i * 0.8);
      px(chimneyX - Math.round(size / 2) + drift, y, size, Math.round(size * 0.6), SMOKE[i % 3]);
    }
    // The doorway, on the near eave where the cast walks past it.
    px(hutX + Math.round(hutW * 0.38), hutY + hutH - 4, 22, 14, WOOD.deep);
    px(hutX + Math.round(hutW * 0.38) + 3, hutY + hutH - 2, 16, 12, '#0d0906');
    px(hutX + 6, hutY + 6, 10, 5, FIRE.ember);

    // --- Scraps along the floor ------------------------------------------
    for (let i = 0; i < 26; i++) {
      const x = Math.round((noise(i, 83) / 97) * (aw - 8));
      const y = Math.round(wall + 12 + (noise(i, 89) / 97) * (bottom - wall - 24));
      px(x, y, 3 + (i % 3) * 2, 2, i % 2 ? '#8a8478' : EARTH.shadow);
    }
  },
};
