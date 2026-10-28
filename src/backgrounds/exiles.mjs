import { pixel } from '../sprites.mjs';
import { glow, noise } from './paint.mjs';

// Act 4 — Conan Exiles. The Exiled Lands seen from above: open sand, wind
// ripples, broken columns, a collapsed wall, the slavers' cage camp and a dead
// tree. The whole canvas is ground, so the cast can walk anywhere.
export default {
  id: 'exiles',
  title: 'Act 4 — The Exiled Lands',
  draw(ctx, { width: w, height: h }) {
    const px = (x, y, ww, hh, color) => pixel(ctx, x * w, y * h, ww * w, hh * h, color);

    // Sand over the whole canvas, warm and slightly uneven.
    pixel(ctx, 0, 0, w, h, '#cf9b5e');
    for (let i = 0; i < 260; i++) {
      const x = (noise(i, 3) / 97) * w, y = (noise(i, 7) / 97) * h;
      pixel(ctx, x, y, w * 0.010, h * 0.006, noise(i, 11) < 50 ? '#d6a465' : '#c89455');
    }
    // Dune shading: broad bands with a soft, offset edge.
    ctx.save();
    ctx.globalAlpha *= 0.18;
    for (const [y, tall, tone] of [[0.10, 0.16, '#8a5f36'], [0.42, 0.20, '#a06c3e'], [0.74, 0.22, '#8a5f36']]) {
      px(0, y, 1, tall, tone);
    }
    ctx.restore();
    // Wind ripples.
    for (let i = 0; i < 34; i++) {
      const x = (noise(i, 17) / 97) * w, y = (noise(i, 19) / 97) * h;
      const wide = w * (0.04 + (noise(i, 23) % 30) / 500);
      pixel(ctx, x, y, wide, h * 0.004, '#e0b377');
      pixel(ctx, x + w * 0.008, y + h * 0.005, wide * 0.7, h * 0.003, '#b8834a');
    }

    // A dry riverbed crossing the lower left corner.
    ctx.save();
    ctx.globalAlpha *= 0.35;
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      px(0.02 + t * 0.55, 0.80 + Math.sin(t * 3.1) * 0.06, 0.030, 0.035, '#8a6035');
    }
    ctx.restore();
    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      px(0.03 + t * 0.53, 0.805 + Math.sin(t * 3.1) * 0.06, 0.012, 0.012, i % 2 ? '#96703f' : '#a37c48');
    }

    // Broken columns: a round base, a shadow and rubble.
    const column = (cx, cy, radius, tall) => {
      px(cx - radius + 0.006, cy - radius + 0.008, radius * 2, radius * 2 + tall, '#8a6035');
      px(cx - radius, cy - radius, radius * 2, radius * 2, '#c99a62');
      px(cx - radius * 0.72, cy - radius * 0.72, radius * 1.44, radius * 1.44, '#b98a55');
      px(cx - radius * 0.42, cy - radius * 0.42, radius * 0.84, radius * 0.84, '#d2a468');
      px(cx - radius * 0.16, cy - radius * 0.16, radius * 0.32, radius * 0.32, '#a87a4a');
      for (let i = 0; i < 5; i++) {
        px(cx + radius * 0.6 + (noise(i, 29) / 900), cy + radius * 0.2 + (noise(i, 31) / 1200), 0.010, 0.008, '#b98a55');
      }
    };
    column(0.13, 0.22, 0.026, 0.02);
    column(0.22, 0.38, 0.020, 0.01);
    column(0.88, 0.76, 0.028, 0.02);
    column(0.74, 0.20, 0.018, 0.01);

    // A collapsed wall running across the upper right.
    px(0.55, 0.09, 0.30, 0.035, '#8a6035');
    px(0.55, 0.085, 0.30, 0.035, '#c99a62');
    px(0.55, 0.085, 0.30, 0.008, '#d8ab74');
    for (let i = 0; i < 12; i++) {
      px(0.55 + i * 0.025, 0.085, 0.003, 0.035, '#a87a4a');
    }
    for (let i = 0; i < 10; i++) {
      px(0.56 + (noise(i, 37) / 97) * 0.28, 0.125 + (noise(i, 41) / 900), 0.012, 0.010, i % 2 ? '#b98a55' : '#a87a4a');
    }

    // The slavers' camp: two wooden cages and a fire pit.
    const cage = (cx, cy) => {
      px(cx + 0.008, cy + 0.010, 0.085, 0.085, '#3a2617');
      px(cx, cy, 0.085, 0.085, '#6b4a2a');
      px(cx + 0.008, cy + 0.008, 0.069, 0.069, '#241708');
      for (let i = 1; i < 4; i++) {
        px(cx + (0.085 * i) / 4, cy, 0.006, 0.085, '#7d5932');
      }
      px(cx, cy + 0.038, 0.085, 0.006, '#7d5932');
    };
    cage(0.38, 0.62);
    cage(0.47, 0.68);
    px(0.42, 0.53, 0.030, 0.030, '#4a3220');
    px(0.425, 0.535, 0.020, 0.020, '#c85a1e');
    px(0.430, 0.540, 0.010, 0.010, '#f0a24a');

    // Rocks and dry shrubs.
    for (let i = 0; i < 18; i++) {
      const x = (0.03 + (noise(i, 43) / 97) * 0.94) * w;
      const y = (0.05 + (noise(i, 47) / 97) * 0.90) * h;
      const wide = w * (0.014 + (noise(i, 53) % 20) / 2000);
      px(x / w + 0.004, y / h + 0.006, wide / w, 0.012, '#8a6035');
      px(x / w, y / h, wide / w, 0.010, '#a37c48');
      px(x / w + 0.002, y / h - 0.003, wide / w * 0.6, 0.006, '#b98a55');
    }
    const shrub = (cx, cy, radius) => {
      px(cx - radius + 0.006, cy - radius + 0.008, radius * 2, radius * 2, '#7a5a30');
      px(cx - radius, cy - radius, radius * 2, radius * 2, '#6d5731');
      px(cx - radius * 0.6, cy - radius * 0.6, radius * 1.2, radius * 1.2, '#7f6636');
      px(cx - radius * 0.2, cy - radius * 0.3, radius * 0.4, radius * 0.4, '#5c4a2a');
    };
    shrub(0.31, 0.16, 0.020);
    shrub(0.62, 0.44, 0.016);
    shrub(0.16, 0.66, 0.018);
    shrub(0.68, 0.86, 0.017);

    // A dead tree: bare branches over their own shadow.
    const deadTree = (cx, cy) => {
      px(cx - 0.008 + 0.010, cy - 0.010 + 0.012, 0.030, 0.030, '#6b4526');
      px(cx - 0.010, cy - 0.010, 0.030, 0.030, '#4a3220');
      px(cx - 0.004, cy - 0.040, 0.010, 0.036, '#4a3220');
      px(cx - 0.030, cy - 0.050, 0.030, 0.008, '#4a3220');
      px(cx + 0.010, cy - 0.058, 0.026, 0.007, '#4a3220');
      px(cx - 0.036, cy - 0.062, 0.014, 0.006, '#3d2a1b');
      px(cx + 0.026, cy - 0.070, 0.012, 0.006, '#3d2a1b');
    };
    deadTree(0.50, 0.30);

    // Dried blood and boot prints.
    px(0.42, 0.60, 0.060, 0.024, '#7a3a2a');
    px(0.44, 0.598, 0.040, 0.016, '#8f4632');
    for (let i = 0; i < 10; i++) {
      const x = 0.30 + i * 0.024, y = 0.70 + (i % 2) * 0.012;
      px(x, y, 0.010, 0.016, '#a8794a');
    }
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    // Heat shimmer sliding over the sand.
    ctx.save();
    ctx.globalAlpha *= 0.05;
    for (let i = 0; i < 3; i++) {
      const drift = Math.sin(time * 1.4 + i * 1.7) * w * 0.02;
      pixel(ctx, drift, h * (0.22 + i * 0.24), w, h * 0.020, '#fff0c8');
    }
    ctx.restore();
    // The camp fire breathes.
    glow(ctx, w * 0.435, h * 0.545, w * 0.030, '#f2a24a', { steps: 3, alpha: 0.05 + 0.04 * Math.sin(time * 4.2) });
  },
};
