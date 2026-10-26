import { pixel, drawElNegro, drawChair, drawZombie, drawAdministrator } from './sprites.mjs';

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

export function drawRoom(ctx, time = 0) {
  pixel(ctx, 0, 0, 480, 270, '#1e1b2c');
  // Wallpaper, moulding and panelled floor, built on the same low-resolution grid.
  for (let x = 0; x < 480; x += 12) pixel(ctx, x, 0, 1, 179, '#262235');
  pixel(ctx, 0, 170, 480, 7, '#4e3c4c');
  pixel(ctx, 0, 177, 480, 4, '#110f1b');
  pixel(ctx, 0, 181, 480, 89, '#302332');
  for (let y = 184; y < 270; y += 14) {
    pixel(ctx, 0, y, 480, 1, '#171521');
    pixel(ctx, 0, y + 1, 480, 1, '#413044');
    for (let x = (y % 3) * 24; x < 480; x += 68) pixel(ctx, x, y + 1, 1, 13, '#201a27');
  }
  // Broken window and distant city.
  pixel(ctx, 291, 23, 151, 118, '#100f1d');
  pixel(ctx, 296, 28, 141, 108, '#363148');
  pixel(ctx, 300, 32, 133, 99, '#252a40');
  pixel(ctx, 390, 40, 21, 21, '#9e98b1');
  pixel(ctx, 387, 44, 27, 13, '#9e98b1');
  pixel(ctx, 389, 41, 13, 17, '#252a40');
  for (let i = 0; i < 10; i++) {
    const height = 15 + (i * 19) % 40;
    pixel(ctx, 301 + i * 13, 131 - height, 12, height, '#191d2d');
    pixel(ctx, 304 + i * 13, 135 - height, 2, 3, i % 3 ? '#7a665f' : '#cdb386');
  }
  pixel(ctx, 363, 30, 4, 103, '#4c4356');
  pixel(ctx, 297, 80, 139, 4, '#4c4356');
  pixel(ctx, 288, 135, 158, 6, '#675267');
  // Curtains, a poster, and a warm lamp.
  pixel(ctx, 283, 21, 13, 114, '#5d3b57');
  pixel(ctx, 285, 23, 4, 107, '#825368');
  pixel(ctx, 433, 21, 13, 114, '#5d3b57');
  pixel(ctx, 438, 24, 4, 107, '#825368');
  pixel(ctx, 230, 49, 34, 48, '#100f1c');
  pixel(ctx, 232, 51, 30, 44, '#6a5666');
  pixel(ctx, 234, 53, 26, 39, '#363249');
  pixel(ctx, 243, 61, 9, 17, '#af8eb8');
  pixel(ctx, 239, 77, 17, 10, '#86749f');
  pixel(ctx, 249, 61, 3, 3, '#e5d5b0');
  pixel(ctx, 453, 77, 3, 108, '#a08068');
  pixel(ctx, 443, 76, 23, 5, '#d8aa78');
  pixel(ctx, 447, 63, 15, 13, '#c59569');
  pixel(ctx, 449, 64, 9, 11, '#f0c78b');
  // Desk and CRT monitor.
  pixel(ctx, 218, 163, 91, 9, '#6d4b4f');
  pixel(ctx, 221, 172, 6, 41, '#3f2e3a');
  pixel(ctx, 299, 172, 6, 41, '#3f2e3a');
  pixel(ctx, 234, 126, 53, 31, '#100f1a');
  pixel(ctx, 237, 129, 47, 25, '#4d455d');
  pixel(ctx, 241, 132, 39, 18, '#476f64');
  for (let i = 0; i < 4; i++) pixel(ctx, 244, 135 + i * 3, 9 + (i * 7) % 23, 1, '#a0c995');
  pixel(ctx, 257, 157, 7, 4, '#444053');
  pixel(ctx, 248, 161, 26, 2, '#646072');
  pixel(ctx, 285, 154, 7, 9, '#cab89b');
  // Rug and character in the foreground.
  pixel(ctx, 289, 205, 142, 39, '#51354a');
  pixel(ctx, 293, 208, 134, 33, '#755062');
  pixel(ctx, 297, 211, 126, 27, '#342638');
  drawChair(ctx, 355, 221, { scale: 2 });
  drawElNegro(ctx, 355, 222, { time, sitting: true, scale: 2 });
  // Pizza box and abandoned controller cable.
  pixel(ctx, 271, 227, 26, 13, '#a87c5a');
  pixel(ctx, 273, 225, 22, 11, '#d3aa7b');
  pixel(ctx, 281, 227, 7, 6, '#a86556');
  pixel(ctx, 421, 215, 5, 13, '#9dba83');
  pixel(ctx, 422, 214, 3, 2, '#d3d7ac');
  // Dust motes move in discrete steps rather than smooth vector particles.
  for (let i = 0; i < 14; i++) {
    const x = 200 + (i * 47) % 267;
    const y = 35 + (i * 31 + Math.floor(time * 3)) % 180;
    pixel(ctx, x, y, 1, 1, i % 2 ? '#8c7182' : '#ad976f');
  }
}

export function drawArena(ctx, width = 520, height = 340) {
  pixel(ctx, 0, 0, width, height, '#222d2c');
  for (let y = 0; y < height; y += 20) {
    for (let x = 0; x < width; x += 26) {
      const seed = (x * 17 + y * 13) % 97;
      pixel(ctx, x + 1, y + 1, 24, 18, seed < 45 ? '#293330' : '#26302e');
      if (seed < 25) pixel(ctx, x + 4, y + 13, 8, 1, '#3a4439');
      if (seed > 65) {
        pixel(ctx, x + 16, y + 4, 1, 5, '#1b2526');
        pixel(ctx, x + 17, y + 8, 3, 1, '#1b2526');
      }
    }
  }
  for (let x = 0; x < width; x += 16) {
    pixel(ctx, x, 0, 15, 9, '#4e4b47');
    pixel(ctx, x, height - 8, 15, 8, '#4e4b47');
    pixel(ctx, x + 1, 1, 13, 2, '#696153');
  }
  for (let y = 10; y < height - 10; y += 16) {
    pixel(ctx, 0, y, 6, 15, '#4e4b47');
    pixel(ctx, width - 6, y, 6, 15, '#4e4b47');
  }
  // Decorative debris stays outside the walkable centre; no fake obstacles.
  for (let i = 0; i < 18; i++) {
    const x = 13 + (i * 113) % (width - 26);
    const y = 18 + (i * 77) % (height - 36);
    pixel(ctx, x, y, 2, 4, '#52604a');
    pixel(ctx, x - 2, y + 2, 2, 1, '#52604a');
  }
}

export function drawStory(canvas, page, time) {
  const ctx = canvas.getContext('2d');
  if (page === 0) { drawRoom(ctx, time); return; }
  drawArena(ctx, 480, 270);
  if (page === 1) {
    drawElNegro(ctx, 240, 190, { scale: 2, time });
    [80, 133, 345, 410].forEach((x, i) => drawZombie(ctx, x, 180 + i % 2 * 30, { scale: 2, time, seed: i }));
  } else {
    pixel(ctx, 200, 57, 83, 145, '#302c40');
    pixel(ctx, 205, 62, 73, 135, '#493950');
    drawAdministrator(ctx, 240, 200, { time, scale: 3 });
  }
}
