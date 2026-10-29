import { art, CONTOUR, disc, glow, noise } from './paint.mjs';

// Act 3 — Diablo. A dungeon chamber seen from above: grey flagstones, a thick
// stone wall with pillars stepping into the floor, braziers and banners on that
// wall, and a pentagram painted on the ground in dark red.
//
// Layout is symmetric around both axes like the reference rooms: doors top and
// bottom, pillars in pairs, braziers flanking each door, banners between them.
// Everything is painted through `art()` in art pixels; wall thickness, slab
// size and the circle radius come from fractions of the canvas so the room
// keeps its proportions on the 480x270 story page.
const FLOOR = {
  deep: '#191920',
  slab: '#2f2f37',
  slabAlt: '#33333b',
  slabWorn: '#2a2a31',
  joint: '#1b1b22',
  grain: '#3a3a43',
  stain: '#232329',
};
const WALL = {
  core: '#121217',
  face: '#23232b',
  faceAlt: '#1d1d24',
  top: '#3a3a46',
  foot: '#0e0e12',
  joint: '#191920',
};
const BLOOD = '#5e1219';
const BONE = { light: '#d6ccb2', mid: '#bdb298', dark: '#8f8672' };
const FIRE = { core: '#ffe08a', hot: '#f2a24a', ember: '#c85a1e' };
const BANNER = { dark: '#5e1219', light: '#7d1b22', rune: '#c9a24a' };
// Brazier anchors as fractions of the canvas, so draw() and animate() agree on
// where the light comes from at every size.
const BRAZIERS = Object.freeze([
  [0.354, 0.035], [0.646, 0.035], [0.354, 0.965], [0.646, 0.965],
  [0.023, 0.209], [0.023, 0.791], [0.977, 0.209], [0.977, 0.791],
]);

export default {
  id: 'inferno',
  title: 'Act 3 — The Inferno',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);

    // Proportional layout, snapped to the art unit.
    const wall = Math.round((0.045 * aw) / 2) * 2;
    const left = wall;
    const right = aw - wall;
    const top = wall;
    const bottom = ah - wall;
    const slabW = Math.round((0.077 * aw) / 2) * 2;
    const slabH = Math.round((0.059 * ah) / 2) * 2;
    const midX = Math.round(aw / 2);
    const midY = Math.round(ah / 2);

    // Opaque base: the bake has no alpha, a hole would show the stage through it.
    fill(0, 0, 1, 1, FLOOR.deep);

    // --- Flagstones -------------------------------------------------------
    for (let row = 0; row * slabH < bottom - top; row++) {
      const y = top + row * slabH;
      const rowH = Math.min(slabH, bottom - y);
      if (rowH <= 0) break;
      // Long courses in running bond: the pattern the reference rooms use.
      const offset = (row % 2 ? -Math.floor(slabW / 2) : 0) + left;
      for (let col = -1; col * slabW + offset < right; col++) {
        let x = offset + col * slabW;
        let w = slabW;
        if (x < left) { w -= left - x; x = left; }
        if (x + w > right) w = right - x;
        if (w <= 0) continue;
        const seed = noise(col, row, 3);
        px(x, y, w, rowH, seed < 40 ? FLOOR.slab : seed < 75 ? FLOOR.slabAlt : FLOOR.slabWorn);
        // Joints on two sides only: drawing all four doubles every seam.
        px(x, y, w, 2, FLOOR.joint);
        px(x, y, 2, rowH, FLOOR.joint);
        if (w >= 20) {
          px(x + 8, y + 8, 6, 2, FLOOR.grain);
          if (seed > 62) px(x + 12, y + 10, 8, 2, FLOOR.joint);
        }
        if (seed < 16 && w >= 24) px(x + 10, y + rowH - 8, 8, 2, FLOOR.stain);
      }
    }
    // Hairline cracks running across a few courses.
    const crack = (startX, startY, steps, salt) => {
      let x = startX, y = startY;
      for (let i = 0; i < steps; i++) {
        px(x, y, 4, 2, FLOOR.joint);
        x += 4;
        y += (noise(i, salt) % 3) * 2 - 2;
        if (x > right - 4 || y < top || y > bottom) break;
      }
    };
    crack(left + Math.round((right - left) * 0.18), top + Math.round((bottom - top) * 0.62), 16, 5);
    crack(left + Math.round((right - left) * 0.72), top + Math.round((bottom - top) * 0.30), 14, 11);

    // --- Pentagram --------------------------------------------------------
    // Painted on the stone, not carved: thin dark red lines with cross marks at
    // the cardinal points, the way the reference room marks its floor.
    const radiusX = Math.round((0.17 * aw) / 2) * 2;
    const radiusY = Math.round((0.24 * ah) / 2) * 2;
    const line = (x0, y0, x1, y1, thick, color) => {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      if (steps === 0) return;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        px(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), thick, thick, color);
      }
    };
    // Steps sized to the circumference: a fixed count leaves a dotted ring.
    const circleSteps = Math.round((Math.PI * (radiusX + radiusY)) / 3);
    for (let i = 0; i < circleSteps; i++) {
      const a = (i / circleSteps) * Math.PI * 2;
      px(midX + Math.round(Math.cos(a) * radiusX) - 2, midY + Math.round(Math.sin(a) * radiusY) - 2, 4, 4, BLOOD);
    }
    const points = [];
    for (let i = 0; i < 5; i++) {
      const a = (-Math.PI / 2) + (i / 5) * Math.PI * 2;
      points.push([midX + Math.round(Math.cos(a) * radiusX * 0.94), midY + Math.round(Math.sin(a) * radiusY * 0.94)]);
    }
    for (let i = 0; i < 5; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 2) % 5];
      line(x0, y0, x1, y1, 2, BLOOD);
    }
    // Cross marks outside the circle at the four cardinal points.
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cx = midX + dx * (radiusX + 10);
      const cy = midY + dy * (radiusY + 10);
      px(cx - 6, cy - 2, 12, 4, BLOOD);
      px(cx - 2, cy - 6, 4, 12, BLOOD);
    }
    px(midX - 10, midY - 10, 20, 20, CONTOUR);
    px(midX - 8, midY - 8, 16, 16, '#241a1e');
    px(midX - 4, midY - 4, 8, 8, BLOOD);

    // --- Blood and debris on the floor ------------------------------------
    // Off-centre blobs: three overlapping pools with droplets, never one
    // rectangle, or the blood reads as a painted sign.
    const splat = (fx, fy, size, seed) => {
      const cx = Math.round(left + (right - left) * fx);
      const cy = Math.round(top + (bottom - top) * fy);
      const pools = [[0, 0, 10, 6], [-6, 4, 8, 5], [5, -3, 7, 4]];
      for (const [dx, dy, w, h] of pools) {
        px(cx + dx * size - 2, cy + dy * size - 2, (w + 4) * size, (h + 4) * size, '#4a0f15');
      }
      for (const [dx, dy, w, h] of pools) {
        px(cx + dx * size, cy + dy * size, w * size, h * size, BLOOD);
      }
      px(cx - 2 * size, cy - 1 * size, 4 * size, 3 * size, '#7d1b22');
      for (let i = 0; i < 5; i++) {
        px(cx + (noise(i, seed) % 11) * 2 * size - 8 * size, cy + (noise(i, seed + 3) % 9) * 2 * size - 8 * size, 2, 2, '#4a0f15');
      }
    };
    splat(0.14, 0.20, 2, 7);
    splat(0.82, 0.34, 1, 13);
    splat(0.24, 0.78, 1, 19);
    splat(0.78, 0.74, 2, 23);
    splat(0.50, 0.12, 1, 29);

    // Skulls and bones, bleached against the grey.
    const skull = (fx, fy) => {
      const x = Math.round(left + (right - left) * fx);
      const y = Math.round(top + (bottom - top) * fy);
      px(x - 8, y - 6, 16, 12, CONTOUR);
      px(x - 7, y - 5, 14, 10, BONE.mid);
      px(x - 5, y - 4, 10, 3, BONE.light);
      px(x - 5, y - 1, 4, 4, '#141419');
      px(x + 1, y - 1, 4, 4, '#141419');
      px(x - 2, y + 4, 4, 2, BONE.dark);
    };
    skull(0.22, 0.34);
    skull(0.68, 0.62);
    skull(0.44, 0.70);
    const bone = (fx, fy, flip) => {
      const x = Math.round(left + (right - left) * fx);
      const y = Math.round(top + (bottom - top) * fy);
      px(x, y, 14, 4, CONTOUR);
      px(x + 1, y + 1, 12, 2, BONE.light);
      px(x + (flip ? 0 : 11), y - 2, 5, 8, CONTOUR);
      px(x + (flip ? 1 : 12), y - 1, 3, 6, BONE.mid);
    };
    bone(0.30, 0.46, false);
    bone(0.58, 0.36, true);
    bone(0.74, 0.56, false);
    bone(0.36, 0.62, true);

    // --- Walls ------------------------------------------------------------
    // Outer slab, stone face with its courses, lit inner edge and a foot line.
    // Only the four bands: filling the whole canvas here would bury the floor.
    for (const [x, y, w, h] of [
      [0, 0, aw, wall], [0, bottom, aw, wall],
      [0, wall, wall, ah - wall * 2], [aw - wall, wall, wall, ah - wall * 2],
    ]) {
      px(x, y, w, h, WALL.core);
      px(x, y, w, h, WALL.face);
      // Block courses along each wall run.
      const horizontal = w > h;
      const length = horizontal ? w : h;
      for (let i = 16; i < length - 4; i += 34) {
        if (horizontal) px(x + i, y, 2, h, WALL.joint);
        else px(x, y + i, w, 2, WALL.joint);
      }
      // Alternating block tone so the wall is not one flat band.
      for (let i = 0; i < length; i += 34) {
        const blockX = horizontal ? x + i : x;
        const blockY = horizontal ? y : y + i;
        const blockW = horizontal ? Math.min(34, length - i) : w;
        const blockH = horizontal ? h : Math.min(34, length - i);
        if ((i / 34) % 2 === 0) px(blockX, blockY, blockW, blockH, WALL.faceAlt);
      }
    }
    // Dark core around the outer edge and a lit lip on the inner edge.
    px(0, 0, aw, 4, WALL.core);
    px(0, ah - 4, aw, 4, WALL.core);
    px(0, 0, 4, ah, WALL.core);
    px(aw - 4, 0, 4, ah, WALL.core);
    px(left - 2, wall, 2, ah - wall * 2, WALL.top);
    px(right, wall, 2, ah - wall * 2, WALL.top);
    px(wall, top - 2, aw - wall * 2, 2, WALL.top);
    px(wall, bottom, aw - wall * 2, 2, WALL.top);
    // Shadow the walls throw onto the floor, to the bottom-right.
    px(left, top, right - left, 6, '#1e1e25');
    px(left, top, 6, bottom - top, '#1e1e25');
    px(left, bottom - 4, right - left, 4, WALL.foot);
    px(right - 4, top, 4, bottom - top, WALL.foot);

    // --- Doors ------------------------------------------------------------
    // A stair leading out, top and bottom, with a lintel and a blood trail.
    for (const dir of [1, -1]) {
      const w = Math.round((0.14 * aw) / 2) * 2;
      const x = midX - Math.round(w / 2);
      // The opening cuts through the whole wall; the treads step down into the
      // room, each a course of its own with a shadow under its nose.
      const outerY = dir > 0 ? 0 : ah - wall;
      px(x - 4, outerY, w + 8, wall, CONTOUR);
      px(x, outerY + 2, w, wall - 4, '#22222a');
      px(x - 4, outerY, 4, wall, WALL.top);
      px(x + w, outerY, 4, wall, WALL.top);
      for (let tread = 0; tread < 3; tread++) {
        const treadH = 6;
        const ty = dir > 0
          ? wall - 6 - tread * treadH
          : ah - wall + 2 + tread * treadH;
        const inset = tread * 4;
        px(x + inset, ty, w - inset * 2, treadH, tread % 2 ? '#2e2e38' : '#35353f');
        px(x + inset, ty, w - inset * 2, 2, '#454551');
        px(x + inset, dir > 0 ? ty + treadH : ty - 2, w - inset * 2, 2, WALL.core);
      }
      // Red carpet down the middle of the stair.
      px(midX - 10, dir > 0 ? wall - 20 : ah - wall + 4, 20, 18, BANNER.dark);
      px(midX - 8, dir > 0 ? wall - 20 : ah - wall + 4, 16, 18, BANNER.light);
      // Blood running out of the room and pooling on the floor.
      for (let i = 0; i < 7; i++) {
        px(midX - 8 + i * 2, dir > 0 ? wall + i * 4 : bottom - 8 - i * 4, 16 - i * 2, 4, i % 2 ? BLOOD : '#4a0f15');
      }
    }

    // --- Pillars ----------------------------------------------------------
    // Stone piers stepping into the room, in pairs, with a cap and a shadow.
    const pillar = (cx, cy) => {
      const w = Math.round((0.045 * aw) / 2) * 2;
      const h = Math.round((0.085 * ah) / 2) * 2;
      const x = cx - Math.round(w / 2);
      const y = cy - Math.round(h / 2);
      px(x + 6, y + 8, w, h, '#1b1b21');
      px(x, y, w, h, CONTOUR);
      px(x + 2, y + 2, w - 4, h - 4, WALL.faceAlt);
      px(x + 2, y + 2, w - 4, 4, WALL.top);
      // The inner pier only exists while there is room for it: at story size the
      // pillar is a few units wide and the inset would go negative.
      if (w >= 18 && h >= 24) {
        px(x + 6, y + 8, w - 12, h - 16, WALL.face);
        px(x + 6, y + 8, w - 12, 2, '#4a4a56');
      }
    };
    // Centred on the inner face of the wall: half the pier is stone, half steps
    // into the room, which is what makes the wall read as solid.
    for (const fx of [0.22, 0.78]) {
      pillar(Math.round(left + (right - left) * fx), top);
      pillar(Math.round(left + (right - left) * fx), bottom);
    }
    for (const fy of [0.28, 0.72]) {
      pillar(left, Math.round(top + (bottom - top) * fy));
      pillar(right, Math.round(top + (bottom - top) * fy));
    }
    // Floor shadow under each pillar, thrown to the bottom-right.
    for (const [pxx, pyy] of [[0.22, 0], [0.78, 0], [0.22, 1], [0.78, 1]]) {
      const x = Math.round(left + (right - left) * pxx);
      px(x - 12, pyy ? bottom - wall : top + wall, 30, 8, '#1b1b21');
    }

    // --- Banners on the wall ---------------------------------------------
    const banner = (cx, cy, horizontal) => {
      const w = 16, h = 28;
      const x = Math.round(cx - w / 2);
      const y = Math.round(cy - h / 2);
      px(x, y, w, h, BANNER.dark);
      px(x + 2, y + 2, w - 4, h - 6, BANNER.light);
      px(x + 2, y + 2, w - 4, 2, '#a82c2c');
      // Cross sigil.
      px(x + 6, y + 7, 4, 12, BANNER.dark);
      px(x + 3, y + 11, 10, 4, BANNER.dark);
      if (horizontal) px(x + 2, y + h - 6, w - 4, 4, '#3a0b10');
    };
    banner(left + (right - left) * 0.12, wall / 2 + 2, false);
    banner(left + (right - left) * 0.88, wall / 2 + 2, false);
    banner(left + (right - left) * 0.12, ah - wall / 2 - 2, false);
    banner(left + (right - left) * 0.88, ah - wall / 2 - 2, false);
    banner(wall / 2 + 2, Math.round(top + (bottom - top) * 0.5), true);
    banner(aw - wall / 2 - 2, Math.round(top + (bottom - top) * 0.5), true);

    // --- Braziers on the wall --------------------------------------------
    // Mounted on the stone, so the floor stays walkable. `animate` lights them.
    for (const [fx, fy] of BRAZIERS) {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      px(x - 12, y - 8, 24, 20, CONTOUR);
      px(x - 10, y - 6, 20, 16, WALL.core);
      px(x - 8, y - 4, 16, 12, '#3b2721');
      px(x - 6, y - 2, 12, 8, '#1d1310');
      px(x - 4, y - 1, 8, 5, FIRE.ember);
      px(x - 2, y - 2, 4, 4, FIRE.hot);
      px(x - 1, y - 2, 2, 2, FIRE.core);
    }

    // --- Iron grate and chains on the wall --------------------------------
    for (const [fx, topSide] of [[0.06, true], [0.94, true], [0.06, false], [0.94, false]]) {
      const x = Math.round(left + (right - left) * fx) - 10;
      const y = topSide ? wall / 2 - 2 : ah - wall / 2 - 10;
      px(x - 2, y - 2, 24, 20, CONTOUR);
      px(x, y, 20, 16, '#26262e');
      for (let i = 1; i < 4; i++) px(x + i * 5, y + 2, 2, 12, '#3a3a44');
    }
    // Chains hanging from the corner walls.
    for (const [fx, fy, vertical] of [[0.055, 0.14, true], [0.945, 0.14, true], [0.055, 0.86, true], [0.945, 0.86, true]]) {
      const x = Math.round(left + (right - left) * fx);
      const y = Math.round(top + (bottom - top) * fy);
      for (let i = 0; i < 6; i++) {
        if (vertical) px(x, y + i * 6, 4, 4, i % 2 ? '#4a4a55' : '#33333d');
        else px(x + i * 6, y, 4, 4, i % 2 ? '#4a4a55' : '#33333d');
      }
    }

    // --- Urns, candles and rubble ----------------------------------------
    for (const [fx, fy] of [[0.10, 0.10], [0.90, 0.10], [0.10, 0.90], [0.90, 0.90]]) {
      const x = Math.round(left + (right - left) * fx);
      const y = Math.round(top + (bottom - top) * fy);
      disc(x + 2, y + 3, 8, { light: '#1b1b21', mid: '#1b1b21', dark: '#1b1b21' });
      disc(x, y, 8, { light: '#4a3a33', mid: '#3b2c27', dark: '#2a1f1b' }, { edge: CONTOUR });
      px(x - 4, y - 6, 8, 4, '#3b2c27');
      px(x - 3, y - 6, 6, 2, '#5a463c');
    }
    for (const [fx, fy] of [[0.18, 0.14], [0.82, 0.14], [0.18, 0.86], [0.82, 0.86], [0.44, 0.16], [0.56, 0.84]]) {
      const x = Math.round(left + (right - left) * fx);
      const y = Math.round(top + (bottom - top) * fy);
      for (let i = 0; i < 3; i++) {
        const cx = x + i * 8 - 8;
        px(cx, y + (i % 2) * 4, 3, 8, '#c9bfa4');
        px(cx, y + (i % 2) * 4 - 3, 3, 3, FIRE.hot);
      }
    }
    for (let i = 0; i < 14; i++) {
      const x = Math.round(left + ((noise(i, 43) / 97) * (right - left - 20)));
      const y = Math.round(top + ((noise(i, 47) / 97) * (bottom - top - 20)));
      px(x, y, 6, 4, '#26262e');
      px(x, y, 3, 2, '#3a3a44');
    }
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    // Braziers pulse with their own phase; the glow is what sells the room.
    BRAZIERS.forEach(([fx, fy], index) => {
      const flicker = 0.55 + 0.45 * Math.sin(time * 7 + index * 1.7);
      glow(ctx, fx * w, fy * h, w * 0.026, FIRE.hot, { steps: 3, alpha: 0.05 * flicker });
    });
    // A slow ember wash from the corners.
    ctx.save();
    ctx.globalAlpha *= 0.05 + 0.03 * Math.sin(time * 0.9);
    ctx.fillStyle = FIRE.ember;
    ctx.fillRect(0, 0, Math.round(w / 2) * 2, 8);
    ctx.fillRect(0, Math.round((h - 8) / 2) * 2, Math.round(w / 2) * 2, 8);
    ctx.restore();
  },
};
