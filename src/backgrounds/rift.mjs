import { art, CONTOUR, CAST_SHADOW, disc, glow, noise } from './paint.mjs';

// Act 2 — League of Legends. The Summoner's Rift lane seen from above: a stone
// road cut through the jungle, tree crowns around it, one tower base per team
// and runes on the slabs. The whole canvas is ground.
//
// Painted through `art()` in art pixels (one art pixel is two canvas pixels,
// the cast's unit). Round masses go through `disc()`: a crown built from nested
// squares reads as a target, not a tree.
const JUNGLE = { base: '#14302a', dark: '#17372e', clump: '#1d4234', lit: '#255240' };
const STONE = { base: '#2c3c55', alt: '#31425d', joint: '#1a2440', grain: '#3a4c6a' };
const CROWN = { dark: '#173a2c', mid: '#1e4a36', light: '#255a41', rim: '#2f6b4b' };
const SHRUB = { dark: '#173a2c', mid: '#1c4534', light: '#21503c', rim: '#2b6044' };
const JUNGLE_MASS = { dark: '#12271f', mid: '#163327', light: '#1a3b2d' };

export default {
  id: 'rift',
  title: 'Act 2 — Summoner’s Rift',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);

    // --- Jungle floor -----------------------------------------------------
    fill(0, 0, 1, 1, JUNGLE.base);
    for (let i = 0; i < 200; i++) {
      const x = Math.round((noise(i, 3) / 97) * aw);
      const y = Math.round((noise(i, 7) / 97) * ah);
      px(x, y, 3, 2, i % 2 ? JUNGLE.dark : JUNGLE.clump);
    }
    // Grass clumps in threes, the density the cast's grain implies.
    for (let i = 0; i < 70; i++) {
      const x = Math.round((noise(i, 23) / 97) * aw);
      const y = Math.round((noise(i, 29) / 97) * ah);
      px(x, y, 2, 3, JUNGLE.clump);
      px(x + 2, y + 1, 2, 2, JUNGLE.lit);
      px(x + 1, y - 2, 1, 2, JUNGLE.clump);
    }

    // --- The lane ---------------------------------------------------------
    const laneTop = Math.round(ah * 0.28);
    const laneBottom = Math.round(ah * 0.72);
    const laneH = laneBottom - laneTop;
    px(0, laneTop, aw, laneH, STONE.base);
    // Big slabs in running bond with one unit of joint. A lit top edge on every
    // slab turns the lane into a brick wall; the joints carry the pattern.
    const slabW = 52, slabH = 24;
    for (let row = 0; row * slabH < laneH; row++) {
      const y = laneTop + row * slabH;
      const rowH = Math.min(slabH, laneBottom - y);
      if (rowH <= 0) break;
      const offset = row % 2 ? -Math.floor(slabW / 2) : 0;
      for (let col = -1; col * slabW + offset < aw; col++) {
        let x = offset + col * slabW;
        let w = slabW;
        if (x < 0) { w += x; x = 0; }
        if (x + w > aw) w = aw - x;
        if (w <= 0) continue;
        const seed = noise(col, row, 3);
        px(x, y, w, rowH, seed < 45 ? STONE.base : STONE.alt);
        // One unit of joint on two sides only: drawing all four doubles the
        // seam between neighbours and turns the lane into a brick wall.
        px(x, y, w, 1, STONE.joint);
        px(x, y, 1, rowH, STONE.joint);
        if (w >= 14) {
          px(x + 4, y + 5, 6, 1, STONE.grain);
          px(x + 6, y + 6, 3, 1, STONE.joint);
        }
        if (seed < 22 && rowH >= 10) px(x + 9, y + rowH - 7, 5, 2, JUNGLE.clump);
        if (seed > 76) px(x + w - 16, y + 4, 7, 1, STONE.grain);
      }
    }
    // Gold trim along both edges of the lane.
    for (const edgeY of [laneTop - 6, laneBottom + 1]) {
      px(0, edgeY, aw, 5, '#c9a24a');
      px(0, edgeY + 1, aw, 2, '#a5813a');
      px(0, edgeY + 4, aw, 1, '#7c6329');
    }

    // Runes and scuff marks on the slabs.
    for (let i = 0; i < 26; i++) {
      const x = Math.round(((0.03 + (noise(i, 17) / 97) * 0.94) * aw) / 2) * 2;
      const y = Math.round((laneTop + 8 + (noise(i, 19) / 97) * (laneH - 16)) / 2) * 2;
      px(x, y, 8, 2, i % 3 ? '#4b7f96' : '#3f6b80');
      if (i % 4 === 0) {
        px(x + 2, y - 3, 2, 3, '#4b7f96');
        px(x + 2, y + 2, 2, 3, '#3f6b80');
      }
    }

    // --- Jungle canopy ----------------------------------------------------
    // A canopy seen from above is a mass of overlapping crowns, not a row of
    // separate balls: the back layer is flat and the front layer carries the
    // contour where the mass meets the lane.
    const crownTone = (cx, cy, radius, tones, edge) => {
      disc(cx, cy, radius, tones, edge ? { edge: CONTOUR } : undefined);
      px(cx - Math.round(radius * 0.62), cy - Math.round(radius * 0.45), Math.round(radius * 0.7), Math.round(radius * 0.55), tones.light);
      px(cx + Math.round(radius * 0.08), cy + Math.round(radius * 0.10), Math.round(radius * 0.75), Math.round(radius * 0.55), tones.dark);
    };
    const band = (frontFraction, backFraction, salt) => {
      const front = Math.round(frontFraction * (ah / 2)) * 2;
      const back = Math.round(backFraction * (ah / 2)) * 2;
      // Back layer: larger, darker, no contour, overlapping so no gaps show.
      for (let i = 0; i < 16; i++) {
        const cx = Math.round(((i + 0.5) / 16) * aw + ((noise(i, salt) % 7) - 3) * 4) / 2 * 2;
        const cy = back + ((noise(i, salt + 3) % 5) - 2) * 4;
        crownTone(cx, cy, 12 + (noise(i, salt + 7) % 5) * 2, JUNGLE_MASS, false);
      }
      // Front layer: the silhouette the light hits.
      for (let i = 0; i < 13; i++) {
        const cx = Math.round(((i + 0.5) / 13) * aw + ((noise(i, salt + 11) % 7) - 3) * 4) / 2 * 2;
        const cy = front + ((noise(i, salt + 13) % 5) - 2) * 4;
        crownTone(cx, cy, 9 + (noise(i, salt + 17) % 4) * 2, CROWN, true);
      }
    };
    // Top band sits between the canvas edge and the lane, bottom band mirrors it.
    band(0.200, 0.070, 3);
    band(0.785, 0.935, 41);
    // Shrubs on the grass beside the gold trim, never on the trim itself.
    for (let i = 0; i < 12; i++) {
      const cx = Math.round(((i + 0.5) / 12) * aw / 2) * 2;
      const cy = Math.round((i % 2 ? 0.235 : 0.775) * (ah / 2)) * 2 + ((noise(i, 37) % 3) - 1) * 2;
      disc(cx, cy, 5 + (noise(i, 39) % 2) * 2, SHRUB, { edge: CONTOUR });
    }

    // --- Towers -----------------------------------------------------------
    // A stone ring seen from above: stepped circular base, dark roof sunk into
    // the middle, four buttresses and the team gem on top.
    const tower = (cx, cy, gem, halo) => {
      const r = Math.max(14, Math.round((0.052 * ah) / 2) * 2);
      disc(cx + 3, cy + 4, r, { light: CAST_SHADOW, mid: CAST_SHADOW, dark: CAST_SHADOW });
      disc(cx, cy, r, { light: '#3d5573', mid: '#334963', dark: '#2a3b52' }, { edge: CONTOUR });
      disc(cx, cy, r - 8, { light: '#22304a', mid: '#1b2740', dark: '#161f33' });
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        px(cx + dx * (r - 9) - 4, cy + dy * (r - 9) - 4, 8, 8, CONTOUR);
        px(cx + dx * (r - 9) - 3, cy + dy * (r - 9) - 3, 6, 6, '#44608a');
      }
      // Gem: a stepped diamond, brightest at the top-left.
      for (let row = -5; row < 5; row++) {
        const half = 10 - Math.abs(row) * 2;
        if (half <= 0) continue;
        px(cx - half, cy + row * 2, half * 2, 2, row < -1 ? '#eafcff' : row < 2 ? gem : '#1d3f66');
      }
      px(cx - 6, cy - 4, 4, 2, '#ffffff');
      glow(ctx, cx * 2, cy * 2, 34, halo, { steps: 3, alpha: 0.06 });
    };
    const towerY = Math.round((0.5 * ah) / 2) * 2;
    const towerOffset = Math.max(40, Math.round(0.13 * aw));
    tower(towerOffset, towerY, '#4fa8e8', '#7fe8ff');
    tower(aw - towerOffset, towerY, '#c0413f', '#ff9a86');

    // Team light soaking the lane from each side.
    ctx.save();
    ctx.globalAlpha *= 0.08;
    px(0, laneTop, 56, laneH, '#4f9fe8');
    px(aw - 56, laneTop, 56, laneH, '#e05a4f');
    ctx.restore();
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    glow(ctx, w * 0.129, h * 0.5, w * 0.020, '#7fe8ff', { steps: 3, alpha: 0.03 + pulse * 0.05 });
    glow(ctx, w * 0.871, h * 0.5, w * 0.020, '#ffb3a4', { steps: 3, alpha: 0.03 + (1 - pulse) * 0.05 });
    ctx.save();
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 7; i++) {
      const x = w * (0.20 + i * 0.09), y = h * (0.40 + (i % 3) * 0.09);
      const lit = Math.sin(time * 1.5 + i * 0.9) > 0;
      ctx.fillStyle = lit ? '#7fe8ff' : '#4b7f96';
      ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 10, 4);
    }
    ctx.restore();
  },
};
