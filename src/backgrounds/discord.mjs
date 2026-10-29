import { art, CONTOUR, glow, noise } from './paint.mjs';

// Act 5 — Corrupted Discord. The server as a floor seen from above: a broken
// grid, chunks of the four previous worlds lying on it, and Discord windows
// hanging overhead with their shadows on the ground. The whole canvas is the
// void's surface, so the cast can walk anywhere.
//
// Windows and chunks are painted as objects in the cast's language: a
// silhouette, one art pixel of contour and a shadow. A flat card with grey bars
// (the first pass) reads as UI pasted over the ground instead of something
// lying on it.
const VOID = { base: '#120d20', dark: '#0e0a1a', light: '#171128', seam: '#241a3c' };
const WINDOW = { body: '#2b2d31', bodyMuted: '#232531', chrome: '#5865f2', error: '#ed4245', text: '#6a6f7e', textDim: '#4b4f5c', avatar: '#4b4f5c' };

export default {
  id: 'discord',
  title: 'Act 5 — Corrupted Discord',
  draw(ctx, { width, height }) {
    const { fill, px, w: aw, h: ah } = art(ctx, width, height);

    // --- Void floor -------------------------------------------------------
    fill(0, 0, 1, 1, VOID.base);
    for (let i = 0; i < 160; i++) {
      const x = Math.round((noise(i, 3) / 97) * aw);
      const y = Math.round((noise(i, 7) / 97) * ah);
      px(x, y, 4, 2, i % 2 ? VOID.light : VOID.dark);
    }
    // Broken grid: some seams lit, some dead.
    for (let x = 0; x < aw; x += 40) px(x, 0, 2, ah, VOID.seam);
    for (let y = 0; y < ah; y += 28) px(0, y, aw, 2, VOID.seam);
    for (let i = 0; i < 14; i++) {
      const x = Math.round((noise(i, 17) / 97) * aw / 2) * 2;
      const y = Math.round((noise(i, 19) / 97) * ah / 2) * 2;
      px(x, y, 40, 2, i % 3 ? '#3b2c66' : WINDOW.chrome);
      px(x + 6, y + 28, 2, 28, i % 4 ? '#3b2c66' : WINDOW.error);
    }

    // --- Chunks of the previous worlds -----------------------------------
    // Each chunk is a slab lying on the grid: contour, face, a lit top edge and
    // a shadow to the bottom-right.
    const chunk = (fx, fy, fw, fh) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      const w = Math.round(fw * aw), h = Math.round(fh * ah);
      px(x + 8, y + 10, w, h, VOID.dark);
      px(x, y, w, h, CONTOUR);
      px(x + 2, y + 2, w - 4, h - 4, '#1b1430');
      px(x + 2, y + 2, w - 4, 2, '#4a3a78');
      // A chunk torn out of another world has a broken edge, not a clean cut.
      for (let i = 0; i < 6; i++) {
        const notchX = x + 6 + (noise(i, 71) % 17) * 6;
        const notchY = y + 6 + (noise(i, 73) % 11) * 6;
        if (notchX < x + w - 8 && notchY < y + h - 8) px(notchX, notchY, 6, 6, VOID.base);
      }
      return { x, y, w, h };
    };
    // Zomboid: a piece of roof with a shingle course.
    {
      const { x, y, w, h } = chunk(0.05, 0.10, 0.17, 0.16);
      px(x + 6, y + 6, w - 12, h - 12, '#3d4447');
      px(x + 6, y + 6, w - 12, 2, '#5a6165');
      for (let i = 1; i < 4; i++) px(x + 6, y + 6 + Math.round((i * (h - 12)) / 4 / 2) * 2, w - 12, 2, '#31373a');
      px(x + Math.round(w * 0.72), y + Math.round(h * 0.24), 8, 8, '#2c2f32');
    }
    // Diablo: cracked flagstones with lava in the seam.
    {
      const { x, y, w, h } = chunk(0.70, 0.08, 0.22, 0.18);
      px(x + 6, y + 6, w - 12, h - 12, '#2a1a1e');
      for (let i = 0; i < 3; i++) px(x + 6, y + 10 + i * 8, w - 12, 2, '#140c0f');
      px(x + 10, y + Math.round(h * 0.55), w - 24, 6, '#93400f');
      px(x + 14, y + Math.round(h * 0.55) + 2, w - 40, 2, '#e8813a');
    }
    // Rift: a slab with gold trim and a rune.
    {
      const { x, y, w, h } = chunk(0.10, 0.74, 0.20, 0.16);
      px(x + 6, y + 6, w - 12, h - 12, '#2f3f59');
      px(x + 6, y + 6, w - 12, 4, '#c9a24a');
      px(x + 6, y + h - 10, w - 12, 4, '#c9a24a');
      px(x + Math.round(w * 0.4), y + Math.round(h * 0.42), 8, 4, '#7fe8ff');
      px(x + Math.round(w * 0.4) + 2, y + Math.round(h * 0.42) - 4, 4, 4, '#4b7f96');
    }
    // Conan: sand with a sandstone block.
    {
      const { x, y, w, h } = chunk(0.66, 0.68, 0.24, 0.20);
      px(x + 6, y + 6, w - 12, h - 12, '#cf9b5e');
      px(x + Math.round(w * 0.2), y + Math.round(h * 0.3), 26, 20, CONTOUR);
      px(x + Math.round(w * 0.2) + 2, y + Math.round(h * 0.3) + 2, 22, 16, '#c99a62');
      px(x + Math.round(w * 0.2) + 2, y + Math.round(h * 0.3) + 2, 22, 4, '#d8ab74');
    }

    // --- Discord windows --------------------------------------------------
    // A window lying on the floor: shadow, chrome bar with its three dots, an
    // avatar block and message lines two units thick.
    const panel = (fx, fy, fw, fh, { error = false, muted = false } = {}) => {
      const x = Math.round(fx * aw), y = Math.round(fy * ah);
      const w = Math.round(fw * aw), h = Math.round(fh * ah);
      px(x + 10, y + 12, w, h, VOID.dark);
      px(x, y, w, h, CONTOUR);
      px(x + 2, y + 2, w - 4, h - 4, muted ? WINDOW.bodyMuted : WINDOW.body);
      // Chrome bar with the window dots.
      px(x + 2, y + 2, w - 4, 8, error ? WINDOW.error : WINDOW.chrome);
      px(x + 2, y + 2, w - 4, 2, error ? '#ff7b7d' : '#7b86ff');
      for (let i = 0; i < 3; i++) px(x + w - 22 + i * 6, y + 4, 4, 4, '#ffffff');
      // Avatar and message lines.
      px(x + 10, y + 16, 20, 20, WINDOW.avatar);
      px(x + 10, y + 16, 20, 4, '#5a5f6e');
      px(x + 36, y + 18, Math.round(w * 0.34), 4, WINDOW.text);
      px(x + 36, y + 26, Math.round(w * 0.52), 4, WINDOW.textDim);
      px(x + 36, y + 34, Math.round(w * 0.28), 4, WINDOW.textDim);
      if (h > 40) px(x + 10, y + h - 14, Math.round(w * 0.6), 4, WINDOW.textDim);
    };
    panel(0.36, 0.06, 0.26, 0.14, { error: true });
    panel(0.34, 0.80, 0.22, 0.13);
    panel(0.50, 0.44, 0.16, 0.11, { muted: true });

    // Error toasts on the floor, with a red edge and a shadow.
    for (const [fx, fy, fw] of [[0.06, 0.36, 0.18], [0.78, 0.40, 0.16]]) {
      const x = Math.round(fx * aw), y = Math.round(fy * ah), w = Math.round(fw * aw);
      px(x + 6, y + 8, w, 16, VOID.dark);
      px(x, y, w, 16, CONTOUR);
      px(x + 2, y + 2, w - 4, 12, WINDOW.body);
      px(x, y, 4, 16, WINDOW.error);
      px(x + 10, y + 5, Math.round(w * 0.6), 3, '#8a8f9c');
      px(x + 10, y + 10, Math.round(w * 0.36), 2, '#565b68');
    }

    // Corruption bleeding out of the grid.
    ctx.save();
    ctx.globalAlpha *= 0.22;
    for (let i = 0; i < 7; i++) {
      px(Math.round((0.06 + i * 0.13) * aw), Math.round(0.94 * ah), 26, 16, i % 2 ? WINDOW.chrome : WINDOW.error);
      px(Math.round((0.08 + i * 0.13) * aw), Math.round(0.02 * ah), 26, 12, i % 2 ? WINDOW.error : WINDOW.chrome);
    }
    ctx.restore();
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    // Scanlines drifting over the whole floor, two units at a time.
    ctx.save();
    ctx.globalAlpha *= 0.04;
    ctx.fillStyle = '#8ea1e1';
    for (let i = 0; i < 5; i++) {
      const y = Math.round((((time * h * 0.05 + i * h * 0.21) % h)) / 2) * 2;
      ctx.fillRect(0, y, Math.round(w / 2) * 2, 4);
    }
    ctx.restore();
    // A glitch tear every few seconds.
    if (Math.floor(time * 0.8) % 7 === 3) {
      const y = Math.round((h * (0.20 + (Math.floor(time * 3) % 4) * 0.16)) / 2) * 2;
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = '#5865f2';
      ctx.fillRect(Math.round((w * 0.14) / 2) * 2, y, Math.round((w * 0.14) / 2) * 2, 8);
      ctx.fillStyle = '#ed4245';
      ctx.fillRect(Math.round((w * 0.60) / 2) * 2, y + 6, Math.round((w * 0.10) / 2) * 2, 6);
      ctx.restore();
    }
    // The error windows blink.
    if (Math.sin(time * 3.4) > 0.2) {
      glow(ctx, w * 0.49, h * 0.125, w * 0.04, '#ed4245', { steps: 3, alpha: 0.04 });
    }
  },
};
