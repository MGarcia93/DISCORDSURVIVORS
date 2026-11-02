// Act 7 — Jhony's base, second visit. The same county as Act 1, but the street
// is now a compound: a timber wall with a gated entrance, crops, a shed, a
// depot, the generator, the parked car and the boxes Jhony will not let anyone
// touch. Top-down like every act world: the whole canvas is ground, buildings
// are roofs and nothing here is a collision shape.
//
// The centre stays clear on purpose: the fight happens there, and the props
// only frame it.
export default {
  id: 'zomboid-base',
  title: 'Acto 7 — La base de Jhony',
  draw(ctx, { width, height }) {
    const snap = value => Math.round(value / 2) * 2;
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(snap(x * width), snap(y * height), Math.max(2, snap(w * width)), Math.max(2, snap(h * height)));
    };
    // The road outside the wall, where the horde comes from.
    rect(0, 0, 1, 1, '#2a2620');
    rect(0, 0.82, 1, 0.18, '#292e32');
    rect(0, 0.82, 1, 0.004, '#1b1f22');
    for (let x = 0.03; x < 1; x += 0.15) rect(x, 0.9, 0.06, 0.004, '#857c58');
    for (let i = 0; i < 40; i++) {
      rect(((i * 211) % 991) / 1000, 0.84 + ((i * 37) % 140) / 1000, 0.004, 0.004, i % 3 ? '#303638' : '#252b2f');
    }
    // The yard: packed earth, then the concrete apron Jhony poured himself.
    rect(0.05, 0.05, 0.9, 0.77, '#3a352c');
    rect(0.07, 0.07, 0.86, 0.73, '#3f3d34');
    for (let x = 0.07; x < 0.93; x += 0.06) rect(x, 0.07, 0.002, 0.73, '#38362e');
    for (let y = 0.07; y < 0.8; y += 0.06) rect(0.07, y, 0.86, 0.002, '#38362e');
    // The wall: four runs of timber, with posts and a shadow on the inside.
    const wall = (x, y, w, h) => {
      rect(x, y, w, h, '#4a3b2c');
      rect(x, y, w, 0.004, '#6b563f');
      rect(x, y + h - 0.004, w, 0.004, '#2f2519');
    };
    wall(0.05, 0.05, 0.9, 0.022);
    wall(0.05, 0.798, 0.38, 0.022);
    wall(0.57, 0.798, 0.38, 0.022);
    wall(0.05, 0.05, 0.022, 0.77);
    wall(0.928, 0.05, 0.022, 0.77);
    for (let x = 0.07; x < 0.93; x += 0.055) {
      rect(x, 0.046, 0.008, 0.03, '#5b4935');
      if (x < 0.42 || x > 0.55) rect(x, 0.794, 0.008, 0.03, '#5b4935');
    }
    for (let y = 0.07; y < 0.8; y += 0.055) {
      rect(0.046, y, 0.03, 0.008, '#5b4935');
      rect(0.924, y, 0.03, 0.008, '#5b4935');
    }
    // The gate: two heavy posts and the barricade across the gap.
    rect(0.415, 0.79, 0.03, 0.04, '#3a2d20');
    rect(0.555, 0.79, 0.03, 0.04, '#3a2d20');
    for (let i = 0; i < 4; i++) rect(0.44, 0.8 + i * 0.008, 0.12, 0.006, i % 2 ? '#6b563f' : '#57452f');
    // Crops: six soil rows with the plants that survived the first night.
    for (let row = 0; row < 6; row++) {
      const y = 0.575 + row * 0.032;
      rect(0.11, y, 0.17, 0.014, '#3a2f22');
      rect(0.11, y, 0.17, 0.004, '#2c2318');
      for (let col = 0; col < 7; col++) {
        rect(0.116 + col * 0.023, y - 0.004, 0.012, 0.01, '#4f6b33');
        rect(0.118 + col * 0.023, y - 0.004, 0.006, 0.004, '#6d8c45');
      }
    }
    // Shed: roof seen from above, ridge, shingles and a dark chimney.
    const roof = (x, y, w, h, light, dark) => {
      rect(x + 0.008, y + 0.01, w, h, '#151e1d');
      rect(x, y, w, h, '#171e22');
      rect(x + 0.003, y + 0.004, w * 0.48, h - 0.008, light);
      rect(x + w * 0.51, y + 0.004, w * 0.48 - 0.003, h - 0.008, dark);
      rect(x + w * 0.49, y + 0.002, w * 0.025, h - 0.004, '#687171');
      for (let line = 0.012; line < h - 0.006; line += 0.014) {
        rect(x + 0.005, y + line, w * 0.47, 0.003, '#293235');
        rect(x + w * 0.52, y + line + 0.003, w * 0.45, 0.003, '#252c30');
      }
    };
    roof(0.09, 0.095, 0.16, 0.115, '#4a4540', '#30383a');
    roof(0.7, 0.095, 0.2, 0.14, '#3e4a4d', '#2c3437');
    // The depot's roller door, facing the yard.
    rect(0.74, 0.2, 0.12, 0.028, '#262c2f');
    rect(0.74, 0.2, 0.12, 0.004, '#3d4448');
    for (let i = 0; i < 5; i++) rect(0.742 + i * 0.024, 0.204, 0.002, 0.022, '#1c2124');
    // Generator beside the shed, with its red fuel can.
    rect(0.27, 0.11, 0.05, 0.04, '#151a20');
    rect(0.272, 0.112, 0.046, 0.036, '#5b6066');
    rect(0.272, 0.112, 0.046, 0.006, '#787f86');
    rect(0.28, 0.12, 0.03, 0.02, '#3f444a');
    rect(0.325, 0.118, 0.018, 0.026, '#8f2b28');
    rect(0.325, 0.118, 0.018, 0.004, '#b23a36');
    // The boxes, stacked in the order only Jhony understands.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 0.335 + col * 0.038;
        const y = 0.315 + row * 0.045;
        rect(x + 0.002, y + 0.003, 0.034, 0.038, '#2a2118');
        rect(x, y, 0.034, 0.038, '#8a6a3f');
        rect(x, y, 0.034, 0.006, '#a88452');
        rect(x + 0.004, y + 0.016, 0.026, 0.004, '#6b4f2c');
        rect(x + 0.014, y + 0.008, 0.006, 0.022, '#c8b078');
      }
    }
    // The car, parked nose to the gate.
    const car = (x, y) => {
      rect(x + 0.006, y + 0.006, 0.062, 0.15, '#171d20');
      rect(x, y, 0.062, 0.15, '#151b20');
      rect(x + 0.003, y + 0.004, 0.056, 0.142, '#57423b');
      rect(x + 0.006, y + 0.03, 0.05, 0.026, '#19272d');
      rect(x + 0.006, y + 0.06, 0.05, 0.044, '#343b3d');
      rect(x + 0.008, y + 0.11, 0.046, 0.022, '#19272d');
      rect(x - 0.002, y + 0.022, 0.008, 0.022, '#20262a');
      rect(x + 0.058, y + 0.022, 0.008, 0.022, '#20262a');
      rect(x - 0.002, y + 0.104, 0.008, 0.022, '#20262a');
      rect(x + 0.058, y + 0.104, 0.008, 0.022, '#20262a');
    };
    car(0.62, 0.55);
    // Sandbags flanking the gate, stacked two high.
    for (const x0 of [0.33, 0.61]) {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const x = x0 + col * 0.032 + (row ? 0.014 : 0);
          rect(x, 0.735 + row * 0.022, 0.03, 0.02, '#6b6144');
          rect(x, 0.735 + row * 0.022, 0.03, 0.005, '#877a56');
        }
      }
    }
    // Traps on the approach: spikes laid where the wall has no cover.
    for (const [x, y] of [[0.13, 0.72], [0.79, 0.72], [0.47, 0.66]]) {
      rect(x, y, 0.04, 0.024, '#2c2318');
      for (let i = 0; i < 4; i++) rect(x + 0.004 + i * 0.009, y + 0.004, 0.004, 0.016, '#8a8f95');
    }
  },
};
