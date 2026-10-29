import { art, CONTOUR, disc, glow, noise } from './paint.mjs';

// Act 4 — Conan Exiles. The slavers' camp seen from above, following the
// reference sheet: a timber stockade around a packed-earth pen, red banners
// with the horned sigil hanging off the wall, braziers on square pedestals
// along the wall line, iron cages on chains, the wheel on the right, and a
// stone quay with the river behind it.
//
// The pen is deliberately empty. The floor is the brightest large surface and
// everything else is dark timber, iron or cloth: that contrast is what makes
// the reference read, not the amount of props.
const EARTH = { base: '#bf8b4f', light: '#c8955a', dark: '#b5834a', deep: '#a2763f', shadow: '#87603a' };
const WOOD = { body: '#4a3524', light: '#5c422c', dark: '#3a2a1c', deep: '#2e2016', edge: '#1f150e' };
const IRON = { body: '#33332f', light: '#55554d', dark: '#22221f' };
const CANVAS = { body: '#8e2b2b', light: '#a83a35', dark: '#5e1a1a' };
const CLOTH = '#e8e0cc';
const BLOOD = { body: '#7a1d20', dark: '#571316' };
const FIRE = { core: '#ffe6a8', hot: '#ffb451', ember: '#ff7a1c', base: '#b8501a' };

// Fire sockets, as fractions: braziers sit on the wall line, never in the pen.
const FIRES = Object.freeze([
  [0.055, 0.107], [0.375, 0.107], [0.625, 0.107], [0.945, 0.107],
  [0.055, 0.888], [0.375, 0.888], [0.625, 0.888], [0.945, 0.888],
  [0.066, 0.300], [0.066, 0.620], [0.934, 0.300], [0.934, 0.620],
]);

export default {
  id: 'exiles',
  title: 'Act 4 — The Exiled Lands',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);

    const wallTop = Math.round((0.076 * ah) / 2) * 2;
    const wallSide = Math.round((0.046 * aw) / 2) * 2;
    const bottomWall = ah - wallTop;
    const left = wallSide;
    const right = aw - wallSide;
    const midX = Math.round(aw / 2);

    const banner = (fx, top, w, h) => {
      const x = Math.round(fx * aw - w / 2);
      const y = Math.round(top);
      // No dark frame along the top: the cloth leaves the wall, it does not
      // float beside it. Sides and hem still get their edge.
      px(x, y, w, h, CANVAS.body);
      px(x, y, 2, h, CANVAS.dark);
      px(x + w - 2, y, 2, h, CANVAS.dark);
      px(x, y + h - 3, w, 3, CANVAS.dark);
      px(x + 2, y, w - 4, 3, CANVAS.light);
      px(x + Math.round(w * 0.30), y + 3, 2, h - 6, CANVAS.dark);
      px(x + Math.round(w * 0.66), y + 3, 2, h - 6, CANVAS.dark);
      const cx2 = x + Math.round(w / 2), cy2 = y + Math.round(h / 2) - 1;
      // Horned skull: brow, two horns, sockets, jaw.
      px(cx2 - 6, cy2 - 4, 12, 9, CLOTH);
      px(cx2 - 10, cy2 - 8, 4, 6, CLOTH);
      px(cx2 + 6, cy2 - 8, 4, 6, CLOTH);
      px(cx2 - 4, cy2 - 1, 3, 3, CANVAS.dark);
      px(cx2 + 1, cy2 - 1, 3, 3, CANVAS.dark);
      px(cx2 - 2, cy2 + 5, 4, 5, CLOTH);
      // Ragged hem.
      px(x + 2, y + h - 5, 5, 5, CANVAS.dark);
      px(x + w - 7, y + h - 5, 5, 5, CANVAS.dark);
    };

    // --- Packed-earth pen -------------------------------------------------
    fill(0, 0, 1, 1, EARTH.base);
    for (let i = 0; i < 320; i++) {
      const x = Math.round((noise(i, 3) / 97) * aw);
      const y = Math.round((noise(i, 7) / 97) * ah);
      px(x, y, 8, 4, i % 3 ? EARTH.light : EARTH.dark);
    }
    // A few broad darker patches so the ground is not a flat fill.
    // Stones: a dark top face with a lit edge, scattered sparsely.
    for (let i = 0; i < 14; i++) {
      const x = Math.round((0.08 + (noise(i, 17) / 97) * 0.84) * aw);
      const y = Math.round((0.14 + (noise(i, 19) / 97) * 0.56) * ah);
      const s = 8 + (noise(i, 23) % 3) * 4;
      px(x + 3, y + 3, s, s, EARTH.shadow);
      px(x, y, s, s, '#6f6a62');
      px(x, y, s, 3, '#8a8478');
      px(x, y + s - 3, s, 3, '#57534b');
    }
    // Blood: irregular pools with droplets, the only saturated thing on the floor.
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
    splat(0.21, 0.24, 1, 3);
    splat(0.72, 0.30, 1, 9);
    splat(0.40, 0.55, 1, 15);
    splat(0.60, 0.66, 1, 21);
    splat(0.30, 0.70, 1, 27);

    // --- Timber wall: top ------------------------------------------------
    // Horizontal boards between vertical posts. The wall is the darkest thing
    // on the canvas and the posts step into the pen with their own shadow.
    px(0, 0, aw, wallTop, WOOD.deep);
    for (let y = 4; y < wallTop - 2; y += 9) {
      px(0, y, aw, 2, WOOD.dark);
      px(0, y + 2, aw, 2, WOOD.body);
      px(0, y + 2, aw, 1, WOOD.light);
    }
    px(0, 0, aw, 3, '#15100a');

    // Posts, with a stepped cap and a shadow on the ground.
    for (let x = 10; x < aw - 12; x += 72) {
      px(x, 0, 14, wallTop + 6, WOOD.edge);
      px(x + 2, 0, 10, wallTop + 4, WOOD.body);
      px(x + 2, 0, 3, wallTop + 4, WOOD.light);
      px(x + 5, 0, 4, 3, WOOD.edge);
      px(x + 7, 0, 2, 2, WOOD.deep);
      px(x + 4, wallTop + 6, 18, 5, EARTH.shadow);
    }

    // --- Timber wall: sides ----------------------------------------------
        for (const sideX of [0, aw - wallSide]) {
      px(sideX, wallTop, wallSide, bottomWall - wallTop, WOOD.deep);
      for (let y = wallTop; y < bottomWall; y += 9) px(sideX + 3, y, wallSide - 6, 2, WOOD.dark);
      px(sideX + (sideX ? 0 : 3), wallTop, wallSide - 3, bottomWall - wallTop, WOOD.body);
      px(sideX + (sideX ? wallSide - 4 : 3), wallTop, 2, bottomWall - wallTop, sideX ? WOOD.dark : WOOD.light);
      for (let y = wallTop + 24; y < bottomWall - 24; y += 78) {
        px(sideX + (sideX ? -4 : 3), y, wallSide + 2, 14, WOOD.edge);
        px(sideX + (sideX ? -2 : 5), y + 2, wallSide - 2, 10, WOOD.body);
        px(sideX + (sideX ? -2 : 5), y + 2, 3, 10, WOOD.light);
        px(sideX + (sideX ? 4 : wallSide + 2), y + 12, 14, 5, EARTH.shadow);
      }
    }
    // Banners last, overlapping the wall's inner face: the cloth starts on the
    // --- Contact shadow on the pen floor ----------------------------------
    // Two units of contact plus a ragged edge. A hard full-width band was
    // reading as a drawn stripe, and painting it after the banners cut across
    // their cloth.
    px(left, wallTop, right - left, 2, EARTH.deep);
    px(left, bottomWall - 2, right - left, 2, EARTH.deep);
    for (let i = 0; i < 30; i++) {
      const x = left + Math.round((noise(i, 51) / 97) * (right - left - 24));
      px(x, wallTop + 2, 12 + (noise(i, 53) % 4) * 6, 3, EARTH.shadow);
      px(x + 8, wallTop + 5, 8 + (noise(i, 55) % 3) * 4, 2, EARTH.deep);
      const bx = left + Math.round((noise(i, 67) / 97) * (right - left - 24));
      px(bx, bottomWall - 5, 12 + (noise(i, 69) % 4) * 6, 3, EARTH.shadow);
    }
    px(left, wallTop, 2, bottomWall - wallTop, EARTH.deep);
    px(right - 2, wallTop, 2, bottomWall - wallTop, EARTH.deep);
    for (let i = 0; i < 16; i++) {
      const y = wallTop + 16 + Math.round((noise(i, 57) / 97) * (bottomWall - wallTop - 48));
      px(left + 2, y, 3, 10 + (noise(i, 59) % 3) * 6, EARTH.shadow);
      px(right - 5, y, 3, 10 + (noise(i, 61) % 3) * 6, EARTH.shadow);
    }

    // --- Banners ----------------------------------------------------------
    // Painted after the shadow, from the top edge of the wall: the cloth covers
    // the timber behind it, the way a nailed banner does, and nothing is drawn
    // over it afterwards.
    banner(0.245, 2, 26, 62);
    banner(0.500, 2, 44, 70);
    banner(0.755, 2, 26, 62);

    // --- Crates and blocks along the wall ---------------------------------
    const crate = (fx, top, w, h) => {
      const x = Math.round(fx * aw - w / 2);
      const y = Math.round(top);
      px(x + 4, y + 5, w, h, EARTH.shadow);
      px(x, y, w, h, WOOD.edge);
      px(x + 2, y + 2, w - 4, h - 4, WOOD.dark);
      px(x + 2, y + 2, w - 4, 3, WOOD.light);
      px(x + 2, y + h - 5, w - 4, 3, WOOD.deep);
      for (let i = 1; i < 3; i++) px(x + Math.round((w * i) / 3), y + 2, 2, h - 4, WOOD.edge);
    };
    crate(0.305, wallTop - 2, 30, 20);
    crate(0.345, wallTop + 2, 26, 18);
    crate(0.415, wallTop - 2, 34, 22);
    crate(0.585, wallTop - 2, 34, 22);
    crate(0.655, wallTop + 2, 26, 18);
    crate(0.695, wallTop - 2, 30, 20);

    // --- Hanging cages ----------------------------------------------------
    // Iron cage on a chain, hung from the wall it belongs to, skull inside.
    const cage = (fx, fy, chainFrom, chainLength) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      const w = 38, h = 44;
      // Chain from an anchor above (or beside) the cage.
      for (let i = 0; i < chainLength; i++) {
        if (chainFrom === 'top') px(x + Math.round(w / 2) - 2, y - i * 7 - 6, 4, 5, i % 2 ? IRON.light : IRON.body);
        else if (chainFrom === 'left') px(x - i * 7 - 6, y + Math.round(h / 2) - 2, 5, 4, i % 2 ? IRON.light : IRON.body);
        else px(x + w + i * 7 + 2, y + Math.round(h / 2) - 2, 5, 4, i % 2 ? IRON.light : IRON.body);
      }
      px(x + 5, y + 7, w, h, EARTH.shadow);
      px(x, y, w, h, CONTOUR);
      px(x + 2, y + 2, w - 4, h - 4, IRON.dark);
      px(x + 2, y + 2, w - 4, 3, IRON.light);
      for (let i = 1; i < 5; i++) px(x + i * 8, y + 4, 3, h - 8, IRON.body);
      px(x + 3, y + Math.round(h * 0.46), w - 6, 3, IRON.light);
      // Skull.
      const sx = x + Math.round(w / 2), sy = y + Math.round(h / 2);
      px(sx - 7, sy - 8, 14, 12, CLOTH);
      px(sx - 4, sy - 4, 3, 4, '#2a2620');
      px(sx + 2, sy - 4, 3, 4, '#2a2620');
      px(sx - 3, sy + 4, 6, 4, CLOTH);
      // Brackets and hook.
      for (const [cx0, cy0] of [[0, 0], [w - 8, 0], [0, h - 8], [w - 8, h - 8]]) {
        px(x + cx0 + 1, y + cy0 + 1, 7, 7, IRON.body);
        px(x + cx0 + 1, y + cy0 + 1, 7, 2, IRON.light);
      }
      px(x + Math.round(w / 2) - 3, y - 6, 6, 7, IRON.body);
    };
    cage(0.135, 0.115, 'top', 5);
    cage(0.860, 0.115, 'top', 5);
    cage(0.115, 0.400, 'left', 8);
    cage(0.115, 0.610, 'left', 11);
    cage(0.855, 0.640, 'right', 9);

    // --- Wheel of the camp ------------------------------------------------
    const wheel = (fx, fy, radius) => {
      const cx = Math.round(fx * aw), cy = Math.round(fy * ah);
      disc(cx + 5, cy + 6, radius, { light: EARTH.shadow, mid: EARTH.shadow, dark: EARTH.shadow });
      disc(cx, cy, radius, { light: WOOD.light, mid: WOOD.body, dark: WOOD.edge }, { edge: CONTOUR });
      disc(cx, cy, radius - 8, { light: EARTH.deep, mid: EARTH.shadow, dark: EARTH.shadow });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        for (let step = 7; step < radius - 6; step += 3) {
          px(cx + Math.round(Math.cos(a) * step) - 2, cy + Math.round(Math.sin(a) * step) - 2, 4, 4, WOOD.light);
        }
      }
      disc(cx, cy, 9, { light: WOOD.light, mid: WOOD.body, dark: WOOD.edge }, { edge: CONTOUR });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        px(cx + Math.round(Math.cos(a) * radius) - 2, cy + Math.round(Math.sin(a) * radius) - 2, 4, 4, IRON.body);
      }
    };
    wheel(0.905, 0.470, 32);
    // Posts and chains bridling the wheel.
    for (const [px0, side] of [[0.815, -1], [0.985, 1]]) {
      const x = Math.round(px0 * aw);
      const y = Math.round(0.470 * ah);
      px(x + (side < 0 ? -14 : 4), y - 34, 12, 70, WOOD.edge);
      px(x + (side < 0 ? -12 : 6), y - 32, 8, 66, WOOD.body);
      px(x + (side < 0 ? -12 : 6), y - 32, 3, 66, WOOD.light);
      for (let i = 0; i < 5; i++) px(x + (side < 0 ? -10 : 8), y - 26 + i * 5, 4, 3, IRON.light);
      for (let i = 0; i < 6; i++) {
        px(x + (side < 0 ? 6 : -12) + side * i * 6, y - 24 + i * 5, 5, 4, i % 2 ? IRON.light : IRON.body);
      }
    }

    // --- Tents cut by the side walls -------------------------------------
    const tent = (fx, fy, w, h) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      px(x + 6, y + 8, w, h, EARTH.shadow);
      for (let row = 0; row < h; row++) {
        const inset = Math.round((row / h) * 8);
        px(x + inset, y + row, w - inset, 1, row < h * 0.35 ? CANVAS.dark : CANVAS.body);
      }
      px(x + Math.round(w * 0.72), y, 2, h, CANVAS.light);
      px(x + 2, y + h - 4, w - 2, 2, CANVAS.dark);
    };
    tent(-0.012, 0.170, 52, 44);
    tent(-0.012, 0.575, 52, 40);
    tent(0.945, 0.150, 46, 40);

    // --- Timber wall: bottom ---------------------------------------------
    // The pen is closed on all four sides. A river here would be ground the
    // cast walks on, so the bottom is stockade like the rest and the camp reads
    // as one continuous floor.
    px(0, bottomWall, aw, wallTop, WOOD.deep);
    for (let y = bottomWall + 4; y < ah - 3; y += 9) {
      px(0, y, aw, 2, WOOD.dark);
      px(0, y + 2, aw, 2, WOOD.body);
      px(0, y + 2, aw, 1, WOOD.light);
    }
    px(0, bottomWall, aw, 4, WOOD.deep);
    px(0, ah - 3, aw, 3, '#15100a');
    for (let x = 10; x < aw - 12; x += 72) {
      px(x, bottomWall - 6, 14, wallTop + 6, WOOD.edge);
      px(x + 2, bottomWall - 4, 10, wallTop + 4, WOOD.body);
      px(x + 2, bottomWall - 4, 3, wallTop + 4, WOOD.light);
      px(x + 5, ah - 4, 4, 3, WOOD.edge);
      px(x + 4, bottomWall - 11, 18, 5, EARTH.shadow);
    }

    // --- Gate in the bottom wall -----------------------------------------
    // A timber gate with a lintel and a banner, so the closed pen still has the
    // one opening the camp is built around.
    const gateW = Math.round((0.16 * aw) / 2) * 2;
    px(midX - gateW / 2 - 8, bottomWall - 6, gateW + 16, wallTop + 6, WOOD.edge);
    px(midX - gateW / 2 - 6, bottomWall - 4, gateW + 12, wallTop + 4, WOOD.dark);
    // Two leaves with planks and iron bands.
    for (let leaf = 0; leaf < 2; leaf++) {
      const lx = midX - gateW / 2 + leaf * Math.round(gateW / 2);
      const lw = Math.round(gateW / 2) - 2;
      px(lx, bottomWall - 2, lw, wallTop, WOOD.edge);
      px(lx + 2, bottomWall, lw - 4, wallTop - 4, WOOD.body);
      for (let i = 1; i < 4; i++) px(lx + Math.round((lw * i) / 4), bottomWall, 2, wallTop - 4, WOOD.dark);
      px(lx + 2, bottomWall + 6, lw - 4, 4, IRON.body);
      px(lx + 2, bottomWall + 16, lw - 4, 4, IRON.body);
      px(lx + 2, bottomWall, lw - 4, 2, WOOD.light);
    }
    px(midX - 3, bottomWall + 8, 6, 10, IRON.light);

    // --- Crates and a second row along the bottom wall --------------------
    crate(0.33, bottomWall - 22, 30, 20);
    crate(0.67, bottomWall - 22, 30, 20);

    // Small stones and scraps, so the bottom of the pen is not bare.
    for (let i = 0; i < 10; i++) {
      const x = Math.round((0.08 + (noise(i, 101) / 97) * 0.84) * aw);
      const y = Math.round(bottomWall - 26 - (noise(i, 103) % 5) * 10);
      const s = 6 + (noise(i, 105) % 3) * 2;
      px(x + 2, y + 2, s, s, EARTH.shadow);
      px(x, y, s, s, '#6f6a62');
      px(x, y, s, 2, '#8a8478');
    }
    // --- Braziers on square pedestals -------------------------------------
    // Drawn last so a brazier is never buried by the wall behind it, and big
    // enough to read: a pedestal, an iron ring and the fire inside.
    for (const [fx, fy] of FIRES) {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      px(x - 12, y + 5, 30, 14, EARTH.shadow);
      px(x - 17, y - 3, 34, 28, WOOD.edge);
      px(x - 15, y - 1, 30, 24, WOOD.body);
      px(x - 15, y - 1, 30, 4, WOOD.light);
      px(x - 15, y + 19, 30, 4, WOOD.deep);
      px(x - 13, y + 3, 3, 16, WOOD.light);
      // Fire box.
      px(x - 9, y - 5, 20, 13, CONTOUR);
      px(x - 8, y - 4, 18, 11, IRON.body);
      px(x - 8, y - 4, 18, 3, IRON.light);
      px(x - 6, y - 2, 14, 8, FIRE.base);
      px(x - 5, y - 3, 10, 7, FIRE.ember);
      px(x - 4, y - 4, 7, 6, FIRE.hot);
      px(x - 2, y - 5, 4, 4, FIRE.core);
    }
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    FIRES.forEach(([fx, fy], index) => {
      const flicker = 0.55 + 0.45 * Math.sin(time * 7.5 + index * 1.7);
      glow(ctx, fx * w, fy * h, w * 0.020, FIRE.hot, { steps: 3, alpha: 0.07 * flicker });
    });
  },
};
