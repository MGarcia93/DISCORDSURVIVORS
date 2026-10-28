import { pixel, drawElNegro, drawZombie, drawAdministrator } from './sprites.mjs';
import { drawBackground } from './backgrounds/index.mjs';

// A tiny local bitmap alphabet keeps the title pixel-perfect and works offline.
const GLYPHS = {
  A: ['01110','11011','11011','11111','11011','11011','11011'],
  B: ['11110','11011','11011','11110','11011','11011','11110'],
  C: ['01111','11000','11000','11000','11000','11000','01111'],
  D: ['11110','11011','11011','11011','11011','11011','11110'],
  E: ['11111','11000','11000','11110','11000','11000','11111'],
  F: ['11111','11000','11000','11110','11000','11000','11000'],
  G: ['01111','11000','11000','11011','11011','11011','01111'],
  H: ['11011','11011','11011','11111','11011','11011','11011'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00011','00011','00011','11011','11011','01110'],
  K: ['11011','11011','11110','11100','11110','11011','11011'],
  L: ['11000','11000','11000','11000','11000','11000','11111'],
  M: ['10001','11011','11111','10101','10101','10101','10101'],
  N: ['11001','11001','11101','11111','11011','11011','11001'],
  O: ['01110','11011','11011','11011','11011','11011','01110'],
  P: ['11110','11011','11011','11110','11000','11000','11000'],
  Q: ['01110','11011','11011','11011','11111','00110','00011'],
  R: ['11110','11011','11011','11110','11100','11011','11011'],
  S: ['01111','11000','11000','01110','00011','00011','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['11011','11011','11011','11011','11011','11011','01110'],
  V: ['11011','11011','11011','11011','11011','01110','00100'],
  W: ['10101','10101','10101','10101','11111','11011','10001'],
  X: ['11011','11011','01110','00100','01110','11011','11011'],
  Y: ['11011','11011','01110','00100','00100','00100','00100'],
  Z: ['11111','00011','00110','01100','11000','11000','11111'],
};

export function pixelText(ctx, text, x, y, scale = 1, color = '#e9d6ac') {
  [...text].forEach((letter, index) => {
    const glyph = GLYPHS[letter];
    if (!glyph) return;
    glyph.forEach((row, gy) => [...row].forEach((bit, gx) => {
      if (bit === '1') pixel(ctx, x + (index * 6 + gx) * scale, y + gy * scale, scale, scale, color);
    }));
  });
}

export function drawTitle(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let depth = 5; depth >= 1; depth--) {
    pixelText(ctx, 'DISCORD', 12 + depth, 3 + depth, 3, '#3c293d');
    pixelText(ctx, 'SURVIVORS', 2 + depth, 31 + depth, 3, '#263f35');
  }
  pixelText(ctx, 'DISCORD', 12, 3, 3, '#f2dbad');
  pixelText(ctx, 'SURVIVORS', 2, 31, 3, '#bfd890');
}

// A story page owns its world (`background`) and its staging (`overlay`), so
// adding a world never means editing an index switch here.
export function drawStory(canvas, page, time = 0) {
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, page.background, { width: canvas.width, height: canvas.height, time });
  if (page.overlay === 'zombies') {
    drawElNegro(ctx, 240, 190, { scale: 2, time });
    [80, 133, 345, 410].forEach((x, i) => drawZombie(ctx, x, 180 + i % 2 * 30, { scale: 2, time, seed: i }));
  } else if (page.overlay === 'administrator') {
    pixel(ctx, 200, 57, 83, 145, '#302c40');
    pixel(ctx, 205, 62, 73, 135, '#493950');
    drawAdministrator(ctx, 240, 200, { time, scale: 3 });
  }
}
