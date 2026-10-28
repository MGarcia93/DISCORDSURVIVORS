import { pixel } from '../sprites.mjs';
import { glow, noise } from './paint.mjs';

// Act 5 — Corrupted Discord. The server as a floor seen from above: a broken
// grid, chunks of the four previous worlds lying on it, and Discord windows
// hanging overhead with their shadows on the ground. The whole canvas is the
// void's surface, so the cast can walk anywhere.
export default {
  id: 'discord',
  title: 'Act 5 — Corrupted Discord',
  draw(ctx, { width: w, height: h }) {
    const px = (x, y, ww, hh, color) => pixel(ctx, x * w, y * h, ww * w, hh * h, color);

    // Void floor over the whole canvas.
    pixel(ctx, 0, 0, w, h, '#120d20');
    for (let i = 0; i < 180; i++) {
      const x = (noise(i, 3) / 97) * w, y = (noise(i, 7) / 97) * h;
      pixel(ctx, x, y, w * 0.010, h * 0.006, noise(i, 11) < 50 ? '#171128' : '#0e0a1a');
    }
    // Broken grid: some seams lit, some dead.
    for (let x = 0; x < w; x += w * 0.070) {
      pixel(ctx, x, 0, w * 0.002, h, '#241a3c');
    }
    for (let y = 0; y < h; y += h * 0.075) {
      pixel(ctx, 0, y, w, h * 0.002, '#241a3c');
    }
    for (let i = 0; i < 14; i++) {
      const x = (noise(i, 17) / 97) * w, y = (noise(i, 19) / 97) * h;
      pixel(ctx, x, y, w * 0.070, h * 0.002, i % 3 ? '#3b2c66' : '#5865f2');
      pixel(ctx, x + w * 0.010, y + h * 0.075, w * 0.002, h * 0.075, i % 4 ? '#3b2c66' : '#ed4245');
    }

    // Chunks of the previous worlds lying on the grid, each with a shadow.
    const chunk = (x, y, cw, ch) => {
      px(x + 0.008, y + 0.010, cw, ch, '#0b0814');
      px(x, y, cw, ch, '#1b1430');
      px(x, y, cw, 0.006, '#4a3a78');
    };
    // Zomboid: a piece of roof.
    chunk(0.05, 0.10, 0.17, 0.16);
    px(0.06, 0.11, 0.15, 0.14, '#3d4447');
    for (let i = 1; i < 4; i++) px(0.06, 0.11 + (0.14 * i) / 4, 0.15, 0.003, '#31373a');
    px(0.175, 0.12, 0.012, 0.020, '#2c2f32');
    // Diablo: cracked flagstones with lava.
    chunk(0.70, 0.08, 0.22, 0.18);
    px(0.72, 0.10, 0.18, 0.14, '#2a1a1e');
    for (let i = 0; i < 3; i++) px(0.72, 0.12 + i * 0.04, 0.18, 0.003, '#140c0f');
    px(0.74, 0.145, 0.13, 0.006, '#93400f');
    px(0.76, 0.147, 0.09, 0.003, '#e8813a');
    // Rift: a slab with gold trim and a rune.
    chunk(0.10, 0.74, 0.20, 0.16);
    px(0.12, 0.76, 0.16, 0.12, '#2f3f59');
    px(0.12, 0.755, 0.16, 0.006, '#c9a24a');
    px(0.12, 0.878, 0.16, 0.006, '#c9a24a');
    px(0.165, 0.80, 0.010, 0.005, '#7fe8ff');
    // Conan: sand with a sandstone block.
    chunk(0.66, 0.68, 0.24, 0.20);
    px(0.68, 0.70, 0.20, 0.16, '#cf9b5e');
    px(0.70, 0.74, 0.09, 0.06, '#c99a62');
    px(0.70, 0.735, 0.09, 0.008, '#d8ab74');
    px(0.70, 0.80, 0.09, 0.006, '#8a6035');

    // Discord windows hanging overhead, with their shadows on the floor.
    const panel = (x, y, cw, ch, { error = false, muted = false } = {}) => {
      ctx.save();
      ctx.globalAlpha *= 0.35;
      px(x + 0.012, y + 0.014, cw, ch, '#08060f');
      ctx.restore();
      px(x, y, cw, ch, muted ? '#232531' : '#2b2d31');
      px(x, y, cw, 0.014, error ? '#ed4245' : '#5865f2');
      px(x + cw * 0.035, y + 0.010, cw * 0.40, 0.004, '#ffffff');
      if (error) px(x + cw - cw * 0.07, y + 0.004, 0.008, 0.007, '#ffb3b5');
      px(x + cw * 0.05, y + ch * 0.32, cw * 0.10, ch * 0.28, '#4b4f5c');
      px(x + cw * 0.20, y + ch * 0.34, cw * 0.46, ch * 0.08, '#6a6f7e');
      px(x + cw * 0.20, y + ch * 0.50, cw * 0.60, ch * 0.06, '#4b4f5c');
      px(x + cw * 0.20, y + ch * 0.62, cw * 0.34, ch * 0.06, '#4b4f5c');
    };
    panel(0.36, 0.06, 0.26, 0.13, { error: true });
    panel(0.34, 0.80, 0.22, 0.12);
    panel(0.50, 0.44, 0.16, 0.10, { muted: true });

    // Error toasts on the floor, with a red edge.
    for (const [x, y, cw] of [[0.06, 0.36, 0.18], [0.78, 0.40, 0.16]]) {
      px(x, y, cw, 0.040, '#2b2d31');
      px(x, y, 0.006, 0.040, '#ed4245');
      px(x + cw * 0.10, y + 0.012, cw * 0.60, 0.007, '#8a8f9c');
      px(x + cw * 0.10, y + 0.026, cw * 0.36, 0.005, '#565b68');
    }

    // Corruption bleeding out of the grid.
    ctx.save();
    ctx.globalAlpha *= 0.22;
    for (let i = 0; i < 7; i++) {
      const x = 0.06 + i * 0.13;
      px(x, 0.94, 0.05, 0.06, i % 2 ? '#5865f2' : '#ed4245');
      px(x + 0.02, 0.02, 0.05, 0.05, i % 2 ? '#ed4245' : '#5865f2');
    }
    ctx.restore();
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    // Scanlines drifting over the whole floor.
    ctx.save();
    ctx.globalAlpha *= 0.04;
    for (let i = 0; i < 5; i++) {
      const y = ((time * h * 0.05 + i * h * 0.21) % h);
      pixel(ctx, 0, y, w, h * 0.010, '#8ea1e1');
    }
    ctx.restore();
    // A glitch tear every few seconds.
    if (Math.floor(time * 0.8) % 7 === 3) {
      const y = h * (0.20 + (Math.floor(time * 3) % 4) * 0.16);
      ctx.save();
      ctx.globalAlpha *= 0.5;
      pixel(ctx, w * 0.14, y, w * 0.14, h * 0.016, '#5865f2');
      pixel(ctx, w * 0.60, y + h * 0.006, w * 0.10, h * 0.012, '#ed4245');
      ctx.restore();
    }
    // The error panels blink.
    if (Math.sin(time * 3.4) > 0.2) {
      glow(ctx, w * 0.49, h * 0.125, w * 0.04, '#ed4245', { steps: 3, alpha: 0.04 });
    }
  },
};
