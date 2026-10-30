// Fixed combat counterpart to Jhony's street. Houses and wrecks frame the
// fighting area; none of these painted details introduces a collision shape.
export default {
  id: 'zomboid-combat',
  title: 'Act 1 — Knox County combat street',
  draw(ctx, { width, height }) {
    const snap = value => Math.round(value / 2) * 2;
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(snap(x * width), snap(y * height), Math.max(2, snap(w * width)), Math.max(2, snap(h * height)));
    };
    rect(0, 0, 1, 1, '#242e27');
    rect(0, 0.23, 1, 0.65, '#292e32');
    // Quiet asphalt texture and worn lane paint leave silhouettes readable.
    for (let i = 0; i < 80; i++) {
      rect(((i * 137) % 997) / 1000, 0.25 + ((i * 23) % 600) / 1000,
        0.003, 0.003, i % 3 ? '#303638' : '#252b2f');
    }
    for (let x = 0.025; x < 1; x += 0.14) {
      rect(x, 0.55, 0.055, 0.004, '#857c58');
    }
    // Sidewalks, slab seams and kerb shadows match the approved street palette.
    for (const y of [0.18, 0.88]) {
      rect(0, y, 1, 0.05, '#55534a');
      rect(0, y, 1, 0.003, '#777365');
      rect(0, y + 0.047, 1, 0.003, '#181d20');
      for (let x = 0; x < 1; x += 0.045) rect(x, y, 0.002, 0.05, '#373b36');
    }
    // Three roofs seen from above: two slopes, ridge, shingles and chimney.
    // They sit beyond the sidewalk instead of consuming the combat centre.
    for (const [x, y, w, h, color] of [
      [0.025, 0.016, 0.25, 0.13, '#3e4a4d'],
      [0.375, 0.008, 0.22, 0.138, '#4a4540'],
      [0.715, 0.016, 0.25, 0.13, '#3e4a4d'],
    ]) {
      rect(x + 0.008, y + 0.012, w, h, '#151e1d');
      rect(x, y, w, h, '#171e22');
      rect(x + 0.003, y + 0.004, w * 0.48, h - 0.008, color);
      rect(x + w * 0.51, y + 0.004, w * 0.48 - 0.003, h - 0.008, '#30383a');
      rect(x + w * 0.49, y + 0.002, w * 0.025, h - 0.004, '#687171');
      for (let line = 0.02; line < h - 0.01; line += 0.018) {
        rect(x + 0.006, y + line, w * 0.46, 0.003, '#293235');
        rect(x + w * 0.53, y + line + 0.004, w * 0.44, 0.003, '#252c30');
      }
      rect(x + w * 0.73, y + 0.025, w * 0.095, h * 0.23, '#25282b');
      rect(x + w * 0.72, y + 0.022, w * 0.12, 0.007, '#787066');
      rect(x + w * 0.43, y + h, w * 0.14, 0.18 - y - h, '#55534b');
    }
    // The approved car's windscreen, metal roof, rear window and tyres, with
    // a vertical footprint adapted to parking along the two street edges.
    for (const [x, y, color] of [
      [0.016, 0.31, '#57423b'],
      [0.926, 0.65, '#414a50'],
    ]) {
      rect(x + 0.006, y + 0.01, 0.062, 0.18, '#171d20');
      rect(x, y, 0.062, 0.18, '#151b20');
      rect(x + 0.003, y + 0.004, 0.056, 0.172, color);
      rect(x + 0.006, y + 0.036, 0.05, 0.03, '#19272d');
      rect(x + 0.006, y + 0.072, 0.05, 0.052, '#343b3d');
      rect(x + 0.008, y + 0.132, 0.046, 0.025, '#19272d');
      for (const wheelY of [0.025, 0.132]) {
        rect(x - 0.003, y + wheelY, 0.006, 0.025, '#11171b');
        rect(x + 0.059, y + wheelY, 0.006, 0.025, '#11171b');
      }
      rect(x + 0.006, y + 0.004, 0.012, 0.005, '#b5ab85');
      rect(x + 0.043, y + 0.004, 0.012, 0.005, '#b5ab85');
      rect(x + 0.006, y + 0.17, 0.012, 0.004, '#744444');
    }
    // A narrow verge at the bottom keeps the full arena opaque and top-down.
    for (let i = 0; i < 26; i++) {
      rect(((i * 73) % 970) / 1000, 0.95 + (i % 3) * 0.014, 0.012, 0.003, '#33422f');
    }
  },
};
