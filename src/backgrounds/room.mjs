import { pixel, drawElNegro, drawChair } from '../sprites.mjs';

// El Negro's room, designed on a 480x270 pixel grid.
//
// `draw` is the scenery that gets baked once; `animate` is the layer that has
// to move every frame (the character breathing in the chair and the dust
// motes). A new world follows the same split: bake the static scenery, keep
// only what moves in `animate`.
export default {
  id: 'room',
  title: 'Menu — El Negro’s room',
  draw(ctx, { width, height }) {
    pixel(ctx, 0, 0, width, height, '#1e1b2c');
    // Wallpaper, moulding and panelled floor, built on the same low-resolution grid.
    for (let x = 0; x < width; x += 12) pixel(ctx, x, 0, 1, 179, '#262235');
    pixel(ctx, 0, 170, width, 7, '#4e3c4c');
    pixel(ctx, 0, 177, width, 4, '#110f1b');
    pixel(ctx, 0, 181, width, height - 181, '#302332');
    for (let y = 184; y < height; y += 14) {
      pixel(ctx, 0, y, width, 1, '#171521');
      pixel(ctx, 0, y + 1, width, 1, '#413044');
      for (let x = (y % 3) * 24; x < width; x += 68) pixel(ctx, x, y + 1, 1, 13, '#201a27');
    }
    // Broken window and distant city.
    pixel(ctx, 291, 23, 151, 118, '#100f1d');
    pixel(ctx, 296, 28, 141, 108, '#363148');
    pixel(ctx, 300, 32, 133, 99, '#252a40');
    pixel(ctx, 390, 40, 21, 21, '#9e98b1');
    pixel(ctx, 387, 44, 27, 13, '#9e98b1');
    pixel(ctx, 389, 41, 13, 17, '#252a40');
    for (let i = 0; i < 10; i++) {
      const buildingHeight = 15 + (i * 19) % 40;
      pixel(ctx, 301 + i * 13, 131 - buildingHeight, 12, buildingHeight, '#191d2d');
      pixel(ctx, 304 + i * 13, 135 - buildingHeight, 2, 3, i % 3 ? '#7a665f' : '#cdb386');
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
    // Rug and the empty chair; the character is animated on top of the bake.
    pixel(ctx, 289, 205, 142, 39, '#51354a');
    pixel(ctx, 293, 208, 134, 33, '#755062');
    pixel(ctx, 297, 211, 126, 27, '#342638');
    drawChair(ctx, 355, 221, { scale: 2 });
    // Pizza box and abandoned controller cable.
    pixel(ctx, 271, 227, 26, 13, '#a87c5a');
    pixel(ctx, 273, 225, 22, 11, '#d3aa7b');
    pixel(ctx, 281, 227, 7, 6, '#a86556');
    pixel(ctx, 421, 215, 5, 13, '#9dba83');
    pixel(ctx, 422, 214, 3, 2, '#d3d7ac');
  },
  animate(ctx, { time = 0 }) {
    drawElNegro(ctx, 355, 222, { time, sitting: true, scale: 2 });
    // Dust motes move in discrete steps rather than smooth vector particles.
    for (let i = 0; i < 14; i++) {
      const x = 200 + (i * 47) % 267;
      const y = 35 + (i * 31 + Math.floor(time * 3)) % 180;
      pixel(ctx, x, y, 1, 1, i % 2 ? '#8c7182' : '#ad976f');
    }
  },
};
