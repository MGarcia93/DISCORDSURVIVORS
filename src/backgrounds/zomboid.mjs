import { pixel } from '../sprites.mjs';
import { noise } from './paint.mjs';

// Act 1 — Project Zomboid. Knox County from above: a street block, roofs seen
// from the sky, wrecked cars and blood on the asphalt. The whole canvas is
// ground, so a character can walk anywhere on it.
export default {
  id: 'zomboid',
  title: 'Act 1 — Knox County',
  draw(ctx, { width: w, height: h }) {
    const px = (x, y, ww, hh, color) => pixel(ctx, x * w, y * h, ww * w, hh * h, color);

    // Asphalt everywhere, then the street and its sidewalks on top of it.
    pixel(ctx, 0, 0, w, h, '#23272b');
    for (let i = 0; i < 220; i++) {
      const x = (noise(i, 3) / 97) * w, y = (noise(i, 7) / 97) * h;
      pixel(ctx, x, y, w * 0.012, h * 0.004, noise(i, 11) < 50 ? '#1f2327' : '#262b2f');
    }
    pixel(ctx, 0, h * 0.24, w, h * 0.52, '#2b3034');
    pixel(ctx, 0, h * 0.24, w, h * 0.006, '#3a4045');
    pixel(ctx, 0, h * 0.754, w, h * 0.006, '#171b1e');

    // Sidewalks with their kerbs.
    for (const [top, kerb] of [[0.185, 0.238], [0.762, 0.755]]) {
      pixel(ctx, 0, h * top, w, h * 0.055, '#4d4d45');
      for (let x = 0; x < w; x += w * 0.035) pixel(ctx, x, h * top, w * 0.002, h * 0.055, '#3d3d37');
      pixel(ctx, 0, h * kerb, w, h * 0.006, '#2c2c28');
    }

    // Road markings: a dashed centre line and a manhole.
    for (let i = 0; i < 11; i++) pixel(ctx, w * (0.03 + i * 0.095), h * 0.492, w * 0.045, h * 0.010, '#8a8468');
    pixel(ctx, w * 0.47, h * 0.60, w * 0.055, h * 0.048, '#1a1d20');
    pixel(ctx, w * 0.482, h * 0.608, w * 0.031, h * 0.032, '#282c30');

    // Rooftops seen from above, with a shadow cast to the bottom-right.
    const roof = (x, y, rw, rh, shingle, ridge) => {
      pixel(ctx, (x + 0.010) * w, (y + 0.012) * h, rw * w, rh * h, '#15181b');
      pixel(ctx, x * w, y * h, rw * w, rh * h, shingle);
      pixel(ctx, x * w, y * h, rw * w, h * 0.008, '#4a5054');
      pixel(ctx, x * w, (y + rh) * h - h * 0.008, rw * w, h * 0.008, '#14171a');
      for (let i = 1; i < 5; i++) {
        pixel(ctx, x * w, (y + (rh * i) / 5) * h, rw * w, h * 0.003, '#31373a');
      }
      if (ridge) pixel(ctx, (x + rw * 0.48) * w, y * h, w * 0.006, rh * h, '#454b4f');
      pixel(ctx, (x + rw * 0.72) * w, (y + rh * 0.18) * h, w * 0.018, h * 0.030, '#2c2f32');
      pixel(ctx, (x + rw * 0.72) * w, (y + rh * 0.18) * h, w * 0.018, h * 0.008, '#5a5f62');
    };
    roof(0.02, 0.02, 0.20, 0.15, '#3d4447', true);
    roof(0.24, 0.03, 0.14, 0.13, '#434a4b', true);
    roof(0.64, 0.02, 0.16, 0.14, '#3a4144', true);
    roof(0.82, 0.04, 0.16, 0.12, '#414849', true);
    roof(0.03, 0.84, 0.19, 0.13, '#3b4245', true);
    roof(0.25, 0.86, 0.13, 0.11, '#444b4c', true);
    roof(0.74, 0.85, 0.22, 0.12, '#3c4346', true);

    // Yards and fences between the houses.
    for (const [gx, gy, gw, gh] of [[0.15, 0.045, 0.09, 0.10], [0.42, 0.03, 0.20, 0.12], [0.17, 0.85, 0.08, 0.11], [0.42, 0.85, 0.30, 0.12]]) {
      pixel(ctx, gx * w, gy * h, gw * w, gh * h, '#2f3a30');
      for (let i = 0; i < 26; i++) {
        const x = (gx + (noise(i, Math.round(gx * 100), 5) / 97) * gw) * w;
        const y = (gy + (noise(i, Math.round(gy * 100), 9) / 97) * gh) * h;
        pixel(ctx, x, y, w * 0.004, h * 0.010, i % 3 ? '#3c4a38' : '#46543d');
      }
      pixel(ctx, gx * w, gy * h, gw * w, h * 0.004, '#5a5240');
    }
    // A tree seen from above: canopy with a shadow.
    const tree = (cx, cy, radius) => {
      pixel(ctx, (cx + 0.008) * w, (cy + 0.010) * h, radius * 2.2 * w, radius * 2.2 * h, '#1c2620');
      pixel(ctx, (cx - radius) * w, (cy - radius) * h, radius * 2 * w, radius * 2 * h, '#24352a');
      pixel(ctx, (cx - radius * 0.7) * w, (cy - radius * 0.7) * h, radius * 1.4 * w, radius * 1.4 * h, '#2d4332');
      pixel(ctx, (cx - radius * 0.35) * w, (cy - radius * 0.4) * h, radius * 0.7 * w, radius * 0.7 * h, '#37503a');
    };
    tree(0.185, 0.10, 0.045);
    tree(0.49, 0.075, 0.040);
    tree(0.30, 0.915, 0.038);

    // Wrecked cars from above: body, windscreen, roof, wheels.
    const car = (cx, cy, cw, ch, body, flip = 1) => {
      pixel(ctx, (cx + 0.008) * w, (cy + 0.008) * h, cw * w, ch * h, '#14171a');
      pixel(ctx, cx * w, cy * h, cw * w, ch * h, body);
      pixel(ctx, (cx + cw * 0.16) * w, (cy + ch * 0.10) * h, cw * 0.68 * w, ch * 0.20 * h, '#1b1d22');
      pixel(ctx, (cx + cw * 0.16) * w, (cy + ch * 0.70) * h, cw * 0.68 * w, ch * 0.18 * h, '#202329');
      pixel(ctx, (cx + cw * 0.20) * w, (cy + ch * 0.33) * h, cw * 0.60 * w, ch * 0.34 * h, '#2e3238');
      for (const [wx, wy] of [[0.06, 0.02], [0.06, 0.80], [0.86, 0.02], [0.86, 0.80]]) {
        pixel(ctx, (cx + cw * wx) * w, (cy + ch * wy) * h, cw * 0.09 * w, ch * 0.18 * h, '#111315');
      }
      pixel(ctx, (cx + cw * (flip > 0 ? 0.30 : 0.55)) * w, (cy + ch * 0.44) * h, cw * 0.15 * w, ch * 0.10 * h, '#6d3a33');
    };
    car(0.06, 0.30, 0.17, 0.13, '#46383a');
    car(0.735, 0.44, 0.16, 0.12, '#3d4242', -1);
    car(0.45, 0.80, 0.11, 0.09, '#3a3f3a');

    // Sandbag barricade across the sidewalk and a dumpster by the shop.
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 7; i++) {
        pixel(ctx, (0.55 + i * 0.030) * w, (0.19 + row * 0.026) * h, 0.028 * w, 0.022 * h, row % 2 ? '#5b5442' : '#4f4939');
        pixel(ctx, (0.552 + i * 0.030) * w, (0.19 + row * 0.026) * h, 0.024 * w, 0.006 * h, '#6d654e');
      }
    }
    pixel(ctx, 0.90 * w, 0.205 * h, 0.07 * w, 0.045 * h, '#2f4a3d');
    pixel(ctx, 0.90 * w, 0.205 * h, 0.07 * w, 0.008 * h, '#446354');

    // Blood, debris and cracks scattered on the road.
    for (const [bx, by, size] of [[0.34, 0.58, 1], [0.60, 0.36, 0.7], [0.22, 0.66, 0.6], [0.82, 0.66, 0.8], [0.50, 0.30, 0.5]]) {
      const cx = bx * w, cy = by * h;
      pixel(ctx, cx - w * 0.016 * size, cy - h * 0.010 * size, w * 0.032 * size, h * 0.020 * size, '#431a20');
      pixel(ctx, cx - w * 0.010 * size, cy - h * 0.006 * size, w * 0.020 * size, h * 0.012 * size, '#4d1c22');
      pixel(ctx, cx - w * 0.020 * size, cy + h * 0.004 * size, w * 0.007 * size, h * 0.006 * size, '#431a20');
      pixel(ctx, cx + w * 0.014 * size, cy - h * 0.002 * size, w * 0.006 * size, h * 0.005 * size, '#431a20');
    }
    for (let i = 0; i < 30; i++) {
      const x = (noise(i, 17) / 97) * w, y = (0.26 + (noise(i, 19) / 97) * 0.46) * h;
      pixel(ctx, x, y, w * 0.008, h * 0.005, i % 3 ? '#1c2023' : '#33383c');
    }
    for (let i = 0; i < 8; i++) {
      const x = (0.05 + (noise(i, 23) / 97) * 0.9) * w, y = (0.28 + (noise(i, 29) / 97) * 0.42) * h;
      pixel(ctx, x, y, w * 0.020, h * 0.003, '#15181b');
    }
  },
  animate(ctx, { width: w, height: h, time = 0 }) {
    // A shorted street lamp at the top kerb, still stuttering.
    if (Math.sin(time * 11) + Math.sin(time * 27) > 0.9) {
      ctx.save();
      ctx.globalAlpha *= 0.10;
      pixel(ctx, w * 0.30, h * 0.16, w * 0.10, h * 0.10, '#e7d9a4');
      ctx.restore();
    }
  },
};
