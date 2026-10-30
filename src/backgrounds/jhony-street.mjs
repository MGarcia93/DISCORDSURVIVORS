// Cinematic-only Knox County side street. Keep the centre clear for the cast;
// the bodies are scene actors so shooting and death remain narrative actions.
export default {
  id: 'jhony-street',
  title: 'Act 1 — Jhony’s last stand',
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
    // Separate houses, not one stretched building: their scale follows height.
    const homes = Math.max(3, Math.round(width / (280 * unit)));
    for (let i = 0; i < homes; i++) {
      const x = (i + 0.12) * width / homes;
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
    // A wreck at the approach and a second at the far end frame the encounter.
    for (const [fx, fy, color] of [[0.26, 0.40, '#57423b'], [0.88, 0.78, '#414a50']]) {
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
    // Blood, dropped shells and debris concentrate where Jhony holds the street.
    for (let i = 0; i < 46; i++) {
      const fx = 0.49 + ((i * 37) % 281) / 1000;
      const fy = 0.54 + ((i * 23) % 270) / 1000;
      detail(width * fx, height * fy, 9 + i % 14, 3 + i % 5, i % 3 ? '#492c2c' : '#332729');
    }
    for (let i = 0; i < 18; i++) {
      detail(width * (0.67 + ((i * 13) % 55) / 1000), height * (0.59 + ((i * 7) % 65) / 1000), 4, 2, '#ad9560');
    }
    for (let i = 0; i < 90; i++) {
      detail((i * 137 * unit) % width, height * (0.37 + ((i * 17) % 480) / 1000), 3, 2, '#3b4240');
    }
  },
};
