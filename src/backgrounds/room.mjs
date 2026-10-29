import { drawElNegro, drawChair } from '../sprites.mjs';
import { art, CONTOUR } from './paint.mjs';

// El Negro's room: the home screen illustration and story page 1.
//
// The layout is designed on a 480x270 grid, the size of the menu canvas, but
// every coordinate is painted as a fraction of whatever canvas the world is
// given. A fixed-pixel layout only works at one size: painted at stage size it
// piles the whole room into the top-left corner.
//
// `draw` is the scenery that gets baked once; `animate` is the layer that has
// to move every frame (El Negro breathing in the chair and the dust motes).
const DESIGN = { w: 480, h: 270 };

export default {
  id: 'room',
  title: 'Menu — El Negro’s room',
  draw(ctx, { width, height }) {
    const { fill, fx, fy } = art(ctx, width, height);
    // Design-grid helper: the numbers below stay readable as the original
    // 480x270 layout, and `fill()` snaps them onto the shared pixel unit.
    const u = (x, y, w, h, color) => fill(x / DESIGN.w, y / DESIGN.h, w / DESIGN.w, h / DESIGN.h, color);

    u(0, 0, DESIGN.w, DESIGN.h, '#1e1b2c');
    // Wallpaper stripes, moulding and a panelled floor.
    for (let x = 0; x < DESIGN.w; x += 12) u(x, 0, 1, 179, '#262235');
    u(0, 170, DESIGN.w, 7, '#4e3c4c');
    u(0, 170, DESIGN.w, 1, '#6b5468');
    u(0, 177, DESIGN.w, 4, '#110f1b');
    u(0, 181, DESIGN.w, DESIGN.h - 181, '#302332');
    for (let y = 184; y < DESIGN.h; y += 14) {
      u(0, y, DESIGN.w, 1, '#171521');
      u(0, y + 1, DESIGN.w, 1, '#413044');
      for (let x = (y % 3) * 24; x < DESIGN.w; x += 68) u(x, y + 1, 1, 13, '#201a27');
    }

    // Broken window and the distant city.
    u(291, 23, 151, 118, CONTOUR);
    u(296, 28, 141, 108, '#363148');
    u(300, 32, 133, 99, '#252a40');
    u(390, 40, 21, 21, '#9e98b1');
    u(387, 44, 27, 13, '#9e98b1');
    u(389, 41, 13, 17, '#252a40');
    for (let i = 0; i < 10; i++) {
      const buildingHeight = 15 + (i * 19) % 40;
      u(301 + i * 13, 131 - buildingHeight, 12, buildingHeight, '#191d2d');
      u(304 + i * 13, 135 - buildingHeight, 2, 3, i % 3 ? '#7a665f' : '#cdb386');
    }
    u(363, 30, 4, 103, '#4c4356');
    u(297, 80, 139, 4, '#4c4356');
    u(288, 135, 158, 6, '#675267');

    // Curtains, a poster and a warm lamp.
    u(283, 21, 13, 114, '#5d3b57');
    u(285, 23, 4, 107, '#825368');
    u(433, 21, 13, 114, '#5d3b57');
    u(438, 24, 4, 107, '#825368');
    u(230, 49, 34, 48, CONTOUR);
    u(232, 51, 30, 44, '#6a5666');
    u(234, 53, 26, 39, '#363249');
    u(243, 61, 9, 17, '#af8eb8');
    u(239, 77, 17, 10, '#86749f');
    u(249, 61, 3, 3, '#e5d5b0');
    u(453, 77, 3, 108, '#a08068');
    u(443, 76, 23, 5, '#d8aa78');
    u(447, 63, 15, 13, '#c59569');
    u(449, 64, 9, 11, '#f0c78b');

    // Desk and CRT monitor.
    u(218, 163, 91, 9, CONTOUR);
    u(219, 164, 89, 7, '#6d4b4f');
    u(221, 172, 6, 41, '#3f2e3a');
    u(299, 172, 6, 41, '#3f2e3a');
    u(234, 126, 53, 31, CONTOUR);
    u(235, 127, 51, 29, '#4d455d');
    u(238, 130, 45, 23, '#3a3547');
    u(241, 132, 39, 18, '#476f64');
    for (let i = 0; i < 4; i++) u(244, 135 + i * 3, 9 + (i * 7) % 23, 1, '#a0c995');
    u(257, 157, 7, 4, '#444053');
    u(248, 161, 26, 2, '#646072');
    u(285, 154, 7, 9, '#cab89b');

    // Rug and the empty chair; the character is animated on top of the bake.
    u(287, 203, 146, 43, CONTOUR);
    u(289, 205, 142, 39, '#51354a');
    u(293, 208, 134, 33, '#755062');
    u(297, 211, 126, 27, '#342638');
    drawChair(ctx, fx(355 / DESIGN.w), fy(221 / DESIGN.h), { scale: 2 });

    // Pizza box and the abandoned controller cable.
    u(270, 225, 28, 15, CONTOUR);
    u(271, 226, 26, 13, '#a87c5a');
    u(273, 227, 22, 11, '#d3aa7b');
    u(281, 229, 7, 6, '#a86556');
    u(421, 215, 5, 13, '#9dba83');
    u(422, 214, 3, 2, '#d3d7ac');
    // Mains socket the cable runs from, so the cable reads as connected.
    u(419, 209, 9, 7, CONTOUR);
    u(420, 210, 7, 5, '#4a4048');
  },
  animate(ctx, { width, height, time = 0 }) {
    // El Negro sits in the chair at the menu. Snapped to the even unit so the
    // scale-2 sprite lands on the same grid as the scenery.
    const x = Math.round((width * 355) / DESIGN.w / 2) * 2;
    const y = Math.round((height * 222) / DESIGN.h / 2) * 2;
    drawElNegro(ctx, x, y, { time, sitting: true, scale: 2 });
    // Dust motes move in discrete steps rather than smooth vector particles.
    for (let i = 0; i < 14; i++) {
      const mx = Math.round((width * (200 + (i * 47) % 267)) / 480 / 2) * 2;
      const my = Math.round((height * (35 + (i * 31 + Math.floor(time * 3)) % 180)) / 270 / 2) * 2;
      ctx.fillStyle = i % 2 ? '#8c7182' : '#ad976f';
      ctx.fillRect(mx, my, 2, 2);
    }
  },
};
