import { pixel } from '../sprites.mjs';

// Shared painting helpers for the world backgrounds. Everything stays on the
// same hard pixel grid: deterministic noise instead of Math.random (a baked
// world must look identical every run).
// Deterministic 0..96 variation for per-cell detail.
export function noise(ix, iy, salt = 0) {
  return Math.abs((ix * 17 + iy * 13 + salt * 29) % 97);
}

// Nested translucent squares read as a pixel-art glow without a gradient.
export function glow(ctx, x, y, radius, color, { steps = 4, alpha = 0.1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let step = steps; step >= 1; step--) {
    const size = Math.round((radius * step) / steps) * 2;
    pixel(ctx, x - size / 2, y - size / 2, size, size, color);
  }
  ctx.restore();
}
