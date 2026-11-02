// Act 7 — the way in. Same distribution as the Act 1 street cinematic: a strip
// of houses with their fences along the top, the sidewalk, the wide road with
// its lane paint and wrecks, the far sidewalk and the dark ground below. At the
// far right the houses give way to a slice of Jhony's compound: the yard, the
// wall, the gate and the man standing in it.
export default {
  id: 'zomboid-approach',
  title: 'Acto 7 — La calle hasta la base',
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
    rect(0, 0, 1, 1, '#242e27');
    rect(0, 0.35, 1, 0.54, '#292e32');
    // Sidewalks and kerbs, viewed from directly above.
    for (const y of [0.30, 0.89]) {
      rect(0, y, 1, 0.055, '#55534a');
      rect(0, y, 1, 0.004, '#777365');
      rect(0, y + 0.052, 1, 0.004, '#181d20');
      for (let x = 0; x < width; x += 48 * unit) detail(x, y * height, 2, 40, '#373b36');
    }
    for (let x = 24 * unit; x < width; x += 130 * unit) {
      detail(x, height * 0.67, 54, 3, '#857c58');
      detail(x + 16 * unit, height * 0.42, 29, 2, '#34393a');
      detail(x - 10 * unit, height * 0.82, 34, 2, '#202629');
    }
    // Houses along the street, up to where the compound starts.
    const homes = 9;
    for (let i = 0; i < homes; i++) {
      const x = (i + 0.12) * width * 0.76 / homes;
      const y = (i % 2 ? 58 : 36) * unit;
      const roof = i % 2 ? '#4a4540' : '#3e4a4d';
      detail(x + 12 * unit, y + 12 * unit, 208, 142, '#151e1d');
      detail(x, y, 208, 142, '#171e22');
      detail(x + 3 * unit, y + 3 * unit, 100, 136, roof);
      detail(x + 105 * unit, y + 3 * unit, 100, 136, '#30383a');
      detail(x + 101 * unit, y + 2 * unit, 5, 138, '#687171');
      for (let sy = 14; sy < 132; sy += 12) {
        detail(x + 5 * unit, y + sy * unit, 94, 2, '#293235');
        detail(x + 108 * unit, y + (sy + 3) * unit, 94, 2, '#252c30');
      }
      detail(x + 150 * unit, y + 23 * unit, 20, 24, '#25282b');
      detail(x + 148 * unit, y + 20 * unit, 24, 5, '#787066');
      detail(x + 85 * unit, y + 146 * unit, 28, 52, '#55534b');
      detail(x - 8 * unit, height * 0.267, 228, 3, '#635c48');
      for (let post = 0; post < 220; post += 24) detail(x + post * unit, height * 0.26, 3, 14, '#756b53');
    }
    // The compound's slice at the far end: yard, wall, gate and sandbags.
    const baseX = 0.78;
    rect(baseX, 0.02, 1 - baseX, 0.28, '#3a352c');
    rect(baseX + 0.004, 0.024, 1 - baseX - 0.008, 0.272, '#3f3d34');
    for (let x = baseX + 0.008; x < 1; x += 0.016) rect(x, 0.024, 0.001, 0.272, '#38362e');
    for (let y = 0.024; y < 0.296; y += 0.03) rect(baseX + 0.004, y, 1 - baseX - 0.008, 0.002, '#38362e');
    for (let row = 0; row < 4; row++) {
      const y = 0.055 + row * 0.045;
      rect(baseX + 0.016, y, 0.08, 0.018, '#3a2f22');
      for (let col = 0; col < 5; col++) rect(baseX + 0.021 + col * 0.015, y - 0.004, 0.009, 0.012, '#4f6b33');
    }
    const wall = (x, y, w, h) => {
      rect(x, y, w, h, '#4a3b2c');
      rect(x, y, w, 0.004, '#6b563f');
      rect(x, y + h - 0.004, w, 0.004, '#2f2519');
    };
    const gateCx = 0.9, gateHalf = 0.016, wallY = 0.3;
    wall(baseX, wallY, gateCx - gateHalf - baseX, 0.03);
    wall(gateCx + gateHalf, wallY, 1 - (gateCx + gateHalf), 0.03);
    for (let x = baseX + 0.014; x < 0.99; x += 0.022) {
      if (x < gateCx - gateHalf || x > gateCx + gateHalf) rect(x, wallY - 0.006, 0.004, 0.042, '#5b4935');
    }
    rect(gateCx - gateHalf - 0.006, wallY - 0.008, 0.012, 0.046, '#3a2d20');
    rect(gateCx + gateHalf - 0.006, wallY - 0.008, 0.012, 0.046, '#3a2d20');
    for (let i = 0; i < 4; i++) {
      rect(gateCx - gateHalf + 0.002, wallY + i * 0.007, gateHalf * 2 - 0.004, 0.005, i % 2 ? '#6b563f' : '#57452f');
    }
    for (const bx of [baseX + 0.016, gateCx + 0.03]) {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const x = bx + col * 0.016 + (row ? 0.007 : 0);
          rect(x, wallY + 0.008 + row * 0.011, 0.014, 0.009, '#6b6144');
          rect(x, wallY + 0.008 + row * 0.011, 0.014, 0.003, '#877a56');
        }
      }
    }
    // Wrecks framing the run, like the Act 1 street.
    for (const [fx, fy, color] of [[0.14, 0.40, '#57423b'], [0.34, 0.62, '#414a50'], [0.58, 0.46, '#4a4440']]) {
      const x = width * fx, y = height * fy;
      detail(x + 6 * unit, y + 8 * unit, 102, 48, '#171d20');
      detail(x, y, 102, 48, '#151b20');
      detail(x + 3 * unit, y + 3 * unit, 96, 42, color);
      detail(x + 22 * unit, y + 5 * unit, 18, 38, '#19272d');
      detail(x + 43 * unit, y + 5 * unit, 29, 38, '#343b3d');
      detail(x + 74 * unit, y + 6 * unit, 13, 36, '#19272d');
      detail(x + 12 * unit, y - 3 * unit, 18, 5, '#11171b');
      detail(x + 70 * unit, y + 46 * unit, 18, 5, '#11171b');
    }
    // Debris along the road.
    for (let i = 0; i < 60; i++) {
      detail((i * 137 * unit) % width, height * (0.37 + ((i * 17) % 480) / 1000), 3, 2, '#3b4240');
    }
  },
};
