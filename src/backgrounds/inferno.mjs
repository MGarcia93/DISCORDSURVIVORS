import { pixel } from '../sprites.mjs';
import { glow, noise } from './paint.mjs';

// Act 3 — Diablo. A dungeon room seen from above: flagstones, four pillars
// with their shadows, a ritual ring on the floor, lava bleeding through the
// cracks and braziers against the walls. No sky and no facades, because the
// game is top-down and the whole canvas is floor.
export default {
  id: 'inferno',
  title: 'Act 3 — The Inferno',
  draw(ctx, { width: w, height: h }) {
    const px = (x, y, ww, hh, color) => pixel(ctx, x * w, y * h, ww * w, hh * h, color);

    // Flagstone floor over the whole canvas.
    pixel(ctx, 0, 0, w, h, '#241518');
    const rows = 13, cols = 17;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col + (row % 2) * 0.5) / cols, y = row / rows;
        const shade = noise(col, row, 5) < 40 ? '#2b1a1e' : noise(col, row, 7) < 70 ? '#28181c' : '#26171b';
        px(x + 0.002, y + 0.002, 1 / cols - 0.004, 1 / rows - 0.004, shade);
        px(x + 0.002, y + 0.002, 1 / cols - 0.004, 0.003, '#311e23');
        if (noise(col, row, 11) < 16) px(x + 0.008, y + 0.012, 0.018, 0.005, '#1b1013');
      }
    }

    // Lava cracks across the floor.
    const crack = (x0, y0, x1, y1, thickness, salt) => {
      const steps = 26;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = (x0 + (x1 - x0) * t) * w;
        const y = (y0 + (y1 - y0) * t) * h + ((noise(i, salt) % 7) - 3) * h * 0.0022;
        const wide = (Math.abs(x1 - x0) * w) / steps + w * 0.006;
        const thick = h * thickness * (0.70 + noise(i, salt + 1) / 180);
        pixel(ctx, x - w * 0.002, y - thick * 1.5, wide + w * 0.004, thick * 1.7, '#35130a');
        pixel(ctx, x, y - thick * 0.6, wide, thick * 1.1, '#93400f');
        pixel(ctx, x, y, wide, thick * 0.45, '#e8813a');
      }
    };
    crack(0.02, 0.90, 0.30, 0.76, 0.010, 3);
    crack(0.24, 0.84, 0.46, 0.94, 0.008, 7);
    crack(0.62, 0.90, 0.96, 0.80, 0.009, 11);
    crack(0.66, 0.12, 0.95, 0.22, 0.007, 13);
    crack(0.05, 0.14, 0.18, 0.30, 0.006, 17);

    // Ritual ring in the middle of the room.
    ctx.save();
    ctx.globalAlpha *= 0.85;
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const x = 0.5 + Math.cos(angle) * 0.115, y = 0.53 + Math.sin(angle) * 0.150;
      px(x - 0.004, y - 0.003, 0.010, 0.006, i % 2 ? '#6b2419' : '#8a3226');
    }
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      const x = 0.5 + Math.cos(angle) * 0.055, y = 0.53 + Math.sin(angle) * 0.072;
      px(x - 0.006, y - 0.005, 0.014, 0.010, '#a1402c');
    }
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      const x = 0.5 + Math.cos(angle) * 0.055, y = 0.53 + Math.sin(angle) * 0.072;
      px(x - 0.017, y - 0.012, 0.012, 0.004, '#c85a3a');
    }
    ctx.restore();

    // Four pillars: square base, top face and a shadow to the bottom-right.
    for (const [x, y] of [[0.14, 0.18], [0.86, 0.18], [0.14, 0.82], [0.86, 0.82]]) {
      px(x + 0.012, y + 0.015, 0.076, 0.086, '#120b0e');
      px(x, y, 0.076, 0.086, '#3a272e');
      px(x + 0.006, y + 0.006, 0.064, 0.074, '#4a343a');
      px(x + 0.020, y + 0.020, 0.036, 0.044, '#5a444a');
      px(x + 0.020, y + 0.020, 0.036, 0.008, '#6b5158');
      px(x + 0.032, y + 0.032, 0.012, 0.020, '#2c1b21');
    }

    // Braziers against the walls.
    for (const [x, y] of [[0.09, 0.10], [0.91, 0.10], [0.09, 0.90], [0.91, 0.90], [0.50, 0.06], [0.50, 0.94]]) {
      px(x - 0.010, y - 0.010, 0.028, 0.028, '#120b0e');
      px(x - 0.014, y - 0.014, 0.028, 0.028, '#3a2b30');
      px(x - 0.010, y - 0.010, 0.020, 0.020, '#4a363c');
      px(x - 0.005, y - 0.005, 0.010, 0.010, '#c85a1e');
      px(x - 0.003, y - 0.003, 0.006, 0.006, '#f0a24a');
    }

    // Bones and dried blood scattered on the flagstones.
    const skull = (x, y) => {
      px(x - 0.009, y - 0.007, 0.018, 0.014, '#c9bd9f');
      px(x - 0.006, y - 0.004, 0.005, 0.005, '#170f12');
      px(x + 0.001, y - 0.004, 0.005, 0.005, '#170f12');
      px(x - 0.002, y + 0.004, 0.004, 0.004, '#8f8672');
    };
    skull(0.30, 0.38); skull(0.72, 0.62); skull(0.44, 0.66); skull(0.58, 0.34);
    for (const [x, y, angle] of [[0.26, 0.44, 1], [0.52, 0.42, -1], [0.68, 0.70, 1], [0.38, 0.72, -1], [0.86, 0.48, -1]]) {
      px(x, y, 0.026, 0.005, angle > 0 ? '#b6ab91' : '#c9bd9f');
      px(x + 0.006, y - 0.004, 0.004, 0.004, '#8f8672');
    }
    px(0.36, 0.50, 0.075, 0.030, '#3a1216');
    px(0.38, 0.498, 0.050, 0.022, '#481519');

    // Stone walls framing the room, drawn last so they crop the floor.
    const wall = 0.040;
    px(0, 0, 1, wall, '#140c10');
    px(0, 1 - wall, 1, wall, '#140c10');
    px(0, 0, 0.020, 1, '#140c10');
    px(1 - 0.020, 0, 0.020, 1, '#140c10');
    px(0, wall - 0.006, 1, 0.006, '#2f1f25');
    px(0, 1 - wall, 1, 0.006, '#2f1f25');
    px(0.020, 0, 0.006, 1, '#2f1f25');
    px(1 - 0.026, 0, 0.006, 1, '#2f1f25');
    for (let i = 0; i < 20; i++) px(i / 20 + 0.01, 0, 0.002, wall, '#0d0709');
    for (let i = 0; i < 20; i++) px(i / 20 + 0.01, 1 - wall, 0.002, wall, '#0d0709');
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    const breathe = 0.5 + 0.5 * Math.sin(time * 1.4);
    ctx.save();
    ctx.globalAlpha *= 0.16 + breathe * 0.28;
    pixel(ctx, w * 0.26, h * 0.775, w * 0.20, h * 0.004, '#ffb45e');
    pixel(ctx, w * 0.62, h * 0.845, w * 0.30, h * 0.003, '#ffb45e');
    pixel(ctx, w * 0.66, h * 0.165, w * 0.27, h * 0.003, '#ffb45e');
    ctx.restore();
    for (const [index, [x, y]] of [[0.09, 0.10], [0.91, 0.10], [0.09, 0.90], [0.91, 0.90], [0.50, 0.06], [0.50, 0.94]].entries()) {
      const flicker = 0.6 + 0.4 * Math.sin(time * 9 + index * 2.1);
      glow(ctx, w * x, h * y, w * 0.030, '#f2a24a', { steps: 3, alpha: 0.06 * flicker });
    }
  },
};
