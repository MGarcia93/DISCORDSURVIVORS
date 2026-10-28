import { pixel } from '../sprites.mjs';
import { glow, noise } from './paint.mjs';

// Act 2 — League of Legends. The Summoner's Rift lane seen from above: a stone
// road cut through the jungle, tree crowns around it, one tower base per team
// and runes on the slabs. The whole canvas is ground.
export default {
  id: 'rift',
  title: 'Act 2 — Summoner’s Rift',
  draw(ctx, { width: w, height: h }) {
    const px = (x, y, ww, hh, color) => pixel(ctx, x * w, y * h, ww * w, hh * h, color);

    // Jungle floor under everything.
    pixel(ctx, 0, 0, w, h, '#16352a');
    for (let i = 0; i < 240; i++) {
      const x = (noise(i, 3) / 97) * w, y = (noise(i, 7) / 97) * h;
      pixel(ctx, x, y, w * 0.006, h * 0.010, noise(i, 11) < 50 ? '#1b3d30' : '#1f4535');
    }

    // The lane: wide stone slabs across the full width.
    const laneTop = 0.28, laneBottom = 0.72;
    px(0, laneTop, 1, laneBottom - laneTop, '#2b3a52');
    for (let row = 0; row < 6; row++) {
      const y = laneTop + ((laneBottom - laneTop) * row) / 6;
      for (let col = 0; col < 15; col++) {
        const x = (col + (row % 2) * 0.5) / 15;
        const shade = noise(col, row, 3) < 45 ? '#29374e' : '#2f3f59';
        px(x + 0.003, y + 0.004, 1 / 15 - 0.006, (laneBottom - laneTop) / 6 - 0.008, shade);
        px(x + 0.003, y + 0.004, 1 / 15 - 0.006, 0.004, '#394e6b');
      }
      px(0, y, 1, 0.003, '#1a2740');
    }
    // Gold trim on both edges of the lane.
    px(0, laneTop - 0.008, 1, 0.008, '#c9a24a');
    px(0, laneBottom, 1, 0.008, '#c9a24a');
    px(0, laneTop - 0.004, 1, 0.004, '#7c6329');
    px(0, laneBottom + 0.008, 1, 0.004, '#7c6329');

    // Runes and scuff marks on the slabs.
    for (let i = 0; i < 24; i++) {
      const x = (0.03 + (noise(i, 17) / 97) * 0.94) * w;
      const y = (laneTop + 0.03 + (noise(i, 19) / 97) * (laneBottom - laneTop - 0.06)) * h;
      pixel(ctx, x, y, w * 0.012, h * 0.004, i % 3 ? '#4b7f96' : '#3f6b80');
    }

    // Tree crowns seen from above, with shadows to the bottom-right.
    const crown = (cx, cy, radius, tone) => {
      px(cx - radius + 0.008, cy - radius + 0.010, radius * 2, radius * 2, '#0e2019');
      px(cx - radius, cy - radius, radius * 2, radius * 2, tone);
      px(cx - radius * 0.72, cy - radius * 0.72, radius * 1.44, radius * 1.44, '#1e4a36');
      px(cx - radius * 0.42, cy - radius * 0.48, radius * 0.84, radius * 0.84, '#255a41');
      px(cx - radius * 0.16, cy - radius * 0.26, radius * 0.36, radius * 0.36, '#2d6a4a');
    };
    for (let i = 0; i < 22; i++) {
      const cx = 0.03 + (i / 22) * 0.94 + (noise(i, 5) - 48) / 900;
      const cy = (i % 2 ? 0.12 : 0.87) + (noise(i, 9) - 48) / 1400;
      crown(cx, cy, 0.042 + (noise(i, 13) % 20) / 1200, '#173b2c');
    }
    // Shrubs hugging the lane edges.
    for (let i = 0; i < 16; i++) {
      const x = 0.02 + (noise(i, 31) / 97) * 0.96;
      const y = (i % 2 ? laneTop - 0.015 : laneBottom + 0.015) + (noise(i, 37) - 48) / 1800;
      crown(x, y, 0.020, '#1b4331');
    }

    // Towers seen from above: a stone ring, crenellations, a dark roof and a
    // glowing gem at the centre.
    const tower = (cx, cy, gem, glowColor) => {
      const radius = 0.050;
      px(cx - radius + 0.008, cy - radius + 0.010, radius * 2, radius * 2, '#0f1c24');
      px(cx - radius, cy - radius, radius * 2, radius * 2, '#2e4059');
      px(cx - radius * 0.88, cy - radius * 0.88, radius * 1.76, radius * 1.76, '#3d5573');
      px(cx - radius * 0.74, cy - radius * 0.74, radius * 1.48, radius * 1.48, '#22304a');
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        px(cx + dx * radius * 0.74 - 0.009, cy + dy * radius * 0.74 - 0.009, 0.018, 0.018, '#4a648a');
      }
      px(cx - radius * 0.42, cy - radius * 0.42, radius * 0.84, radius * 0.84, '#1b2740');
      px(cx - 0.016, cy - 0.016, 0.032, 0.032, gem);
      px(cx - 0.008, cy - 0.008, 0.016, 0.016, '#ffffff');
      glow(ctx, cx * w, cy * h, 0.034 * w, glowColor, { steps: 3, alpha: 0.06 });
    };
    tower(0.13, 0.50, '#4fa8e8', '#7fe8ff');
    tower(0.87, 0.50, '#c0413f', '#ff9a86');

    // Team light soaking the lane from each side.
    ctx.save();
    ctx.globalAlpha *= 0.08;
    px(0, laneTop, 0.10, laneBottom - laneTop, '#4f9fe8');
    px(0.90, laneTop, 0.10, laneBottom - laneTop, '#e05a4f');
    ctx.restore();
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    glow(ctx, w * 0.13, h * 0.50, w * 0.020, '#7fe8ff', { steps: 3, alpha: 0.03 + pulse * 0.05 });
    glow(ctx, w * 0.87, h * 0.50, w * 0.020, '#ffb3a4', { steps: 3, alpha: 0.03 + (1 - pulse) * 0.05 });
    ctx.save();
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 7; i++) {
      const x = w * (0.20 + i * 0.09), y = h * (0.40 + (i % 3) * 0.09);
      const lit = Math.sin(time * 1.5 + i * 0.9) > 0;
      pixel(ctx, x, y, w * 0.010, h * 0.004, lit ? '#7fe8ff' : '#4b7f96');
    }
    ctx.restore();
  },
};
