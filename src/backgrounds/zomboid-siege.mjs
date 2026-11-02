// Act 7 — the siege. The strip in front of Jhony's base where the waves are
// fought: the compound is cut by the top edge of the frame — its crops, its
// sandbags and the wall with the gate — and the street owns everything below,
// between the two sidewalks. Same distribution as the Act 1 street.
export default {
  id: 'zomboid-siege',
  title: 'Acto 7 — El asedio a la base',
  draw(ctx, { width, height }) {
    const unit = height / 748;
    const snap = value => Math.round(value / 2) * 2;
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(snap(x * width), snap(y * height), Math.max(2, snap(w * width)), Math.max(2, snap(h * height)));
    };
    const detail = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(snap(x), snap(y), Math.max(2, snap(w * unit)), Math.max(2, snap(h * unit)));
    };
    // Dark ground, then the street between the two sidewalks.
    rect(0, 0, 1, 1, '#242e27');
    rect(0, 0.19, 1, 0.68, '#292e32');
    for (const y of [0.13, 0.87]) {
      rect(0, y, 1, 0.06, '#55534a');
      rect(0, y, 1, 0.004, '#777365');
      rect(0, y + 0.056, 1, 0.004, '#181d20');
      for (let x = 0; x < width; x += 48 * unit) detail(x, y * height, 2, 44, '#373b36');
    }
    // The lane and the debris on the asphalt.
    for (let x = 24 * unit; x < width; x += 130 * unit) {
      detail(x, height * 0.55, 54, 4, '#857c58');
      detail(x + 20 * unit, height * 0.34, 29, 2, '#34393a');
      detail(x - 10 * unit, height * 0.76, 34, 2, '#202629');
    }
    for (let i = 0; i < 90; i++) {
      detail((i * 137 * unit) % width, height * (0.22 + ((i * 17) % 620) / 1000), 3, 2, '#3b4240');
    }
    // The compound, cut by the frame: we only see its bottom edge.
    rect(0, 0, 1, 0.13, '#3a352c');
    rect(0.01, 0, 0.98, 0.11, '#3f3d34');
    for (let x = 0.01; x < 0.99; x += 0.05) rect(x, 0, 0.002, 0.11, '#38362e');
    for (let row = 0; row < 3; row++) {
      const y = 0.012 + row * 0.026;
      rect(0.03, y, 0.2, 0.014, '#3a2f22');
      for (let col = 0; col < 8; col++) rect(0.036 + col * 0.024, y - 0.003, 0.011, 0.009, '#4f6b33');
    }
    // Sandbags by the gate, then the wall and its barricade.
    for (const bx of [0.3, 0.58]) {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const x = bx + col * 0.03 + (row ? 0.013 : 0);
          rect(x, 0.07 + row * 0.018, 0.028, 0.015, '#6b6144');
          rect(x, 0.07 + row * 0.018, 0.028, 0.004, '#877a56');
        }
      }
    }
    const gateCx = 0.5, gateHalf = 0.055;
    const wall = (x, y, w, h) => {
      rect(x, y, w, h, '#4a3b2c');
      rect(x, y, w, 0.004, '#6b563f');
      rect(x, y + h - 0.004, w, 0.004, '#2f2519');
    };
    wall(0, 0.104, gateCx - gateHalf, 0.026);
    wall(gateCx + gateHalf, 0.104, 1 - (gateCx + gateHalf), 0.026);
    for (let x = 0.02; x < 0.98; x += 0.05) {
      if (x < gateCx - gateHalf || x > gateCx + gateHalf) rect(x, 0.098, 0.008, 0.038, '#5b4935');
    }
    rect(gateCx - gateHalf - 0.012, 0.096, 0.024, 0.042, '#3a2d20');
    rect(gateCx + gateHalf - 0.012, 0.096, 0.024, 0.042, '#3a2d20');
    for (let i = 0; i < 4; i++) {
      rect(gateCx - gateHalf + 0.006, 0.1 + i * 0.007, gateHalf * 2 - 0.012, 0.005, i % 2 ? '#6b563f' : '#57452f');
    }
    // Spikes on the approach, where the wall has no cover.
    for (const [sx, sy] of [[0.12, 0.42], [0.72, 0.42], [0.42, 0.66]]) {
      rect(sx, sy, 0.035, 0.02, '#2c2318');
      for (let i = 0; i < 4; i++) rect(sx + 0.003 + i * 0.008, sy + 0.003, 0.003, 0.013, '#8a8f95');
    }
  },
};
