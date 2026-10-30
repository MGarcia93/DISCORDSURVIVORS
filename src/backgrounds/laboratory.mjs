import { art, CONTOUR, glow, noise } from './paint.mjs';

// Act 4 — the Lotus Alchemist's laboratory, seen from above: a timber room
// inside the slavers' camp, plank floor stained with lotus powder, shelves of
// vials along the back wall, two work tables with caldrons, the vat where the
// yellow lotus is steeped and the copper still that feeds it.
//
// It is a stage world, not a new act: the act is `exiles`, and the laboratory
// scenes only change the room the camera is in so the player can tell the
// plantation, the lab and the wheel apart.
const FLOOR = { deep: '#3a2a1a', plank: '#54402a', plankAlt: '#5d4831', worn: '#463322', joint: '#241a10', grain: '#6a5236' };
const WALL = { body: '#241a11', light: '#352616', dark: '#140e08', edge: '#0b0704' };
const IRON = { body: '#4a4750', light: '#8f8b95', dark: '#2b2930' };
const COPPER = { body: '#a5622c', light: '#cf8a4a', dark: '#6d3d18' };
const LOTUS = { light: '#ffe9a0', base: '#f0c24e', mid: '#c4912a', dark: '#8a5f18' };
const GLASS = { green: '#6f9a4a', red: '#a8483a', violet: '#7a5aa8', blue: '#4a7a9a' };
const HERB = { light: '#9fb35c', base: '#6f8a3a', dark: '#4a5c26' };
const SMOKE = '#d8cda8';

export default {
  id: 'laboratory',
  title: 'Act 4 — The Lotus Laboratory',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);
    const fx = f => Math.round(f * aw);
    const fy = f => Math.round(f * ah);
    const wall = Math.round((0.055 * ah) / 2) * 2;
    const side = Math.round((0.04 * aw) / 2) * 2;

    // Opaque base, then planks running across the room.
    fill(0, 0, 1, 1, FLOOR.deep);
    const plankH = Math.max(6, Math.round((0.052 * ah) / 2) * 2);
    for (let y = 0, row = 0; y < ah; y += plankH, row++) {
      px(0, y, aw, plankH, row % 2 ? FLOOR.plank : FLOOR.plankAlt);
      px(0, y, aw, 1, FLOOR.grain);
      px(0, y + plankH - 2, aw, 2, FLOOR.joint);
      // Short board ends, staggered so the floor never reads as one sheet.
      for (let x = (row % 2) * 210; x < aw; x += 420) px(x, y, 2, plankH - 2, FLOOR.joint);
    }
    // Wear: darker patches where the caldrons and the still stand.
    for (let i = 0; i < 90; i++) {
      const x = fx(0.05 + (noise(i, 5) / 97) * 0.9);
      const y = fy(0.1 + (noise(i, 11) / 97) * 0.8);
      px(x, y, 6 + (noise(i, 3) % 3) * 2, 2, FLOOR.worn);
    }

    // --- Walls -------------------------------------------------------------
    px(0, 0, aw, wall, WALL.body);
    px(0, wall - 4, aw, 4, WALL.dark);
    px(0, 0, aw, 2, WALL.edge);
    for (let x = 8; x < aw - 10; x += 62) {
      px(x, 0, 12, wall + 8, WALL.edge);
      px(x + 2, 0, 8, wall + 6, WALL.body);
      px(x + 2, 0, 2, wall + 6, WALL.light);
    }
    for (const sideX of [0, aw - side]) {
      px(sideX, 0, side, ah, WALL.body);
      px(sideX + (sideX ? 0 : side - 2), 0, 2, ah, WALL.dark);
      px(sideX + (sideX ? side - 3 : 2), 0, 2, ah, WALL.light);
      for (let y = 40; y < ah - 20; y += 74) px(sideX, y, side, 10, WALL.edge);
    }
    px(0, ah - wall, aw, wall, WALL.body);
    px(0, ah - wall, aw, 3, WALL.light);
    px(0, ah - 2, aw, 2, WALL.edge);
    // The doorway back to the camp, bottom left, with its frame lit.
    const doorX = fx(0.14), doorW = Math.max(24, fx(0.12) - doorX);
    px(doorX - 4, ah - wall, doorW + 8, wall, WALL.edge);
    px(doorX, ah - wall + 4, doorW, wall, '#0d0a06');
    px(doorX - 2, ah - wall, 4, wall, WALL.light);
    px(doorX + doorW - 2, ah - wall, 4, wall, WALL.light);

    // --- Back wall: shelves of vials --------------------------------------
    const shelfX = fx(0.3), shelfW = fx(0.4);
    for (let row = 0; row < 2; row++) {
      const sy = wall + 10 + row * 26;
      px(shelfX, sy, shelfW, 5, WALL.edge);
      px(shelfX + 1, sy, shelfW - 2, 3, COPPER.dark);
      px(shelfX + 1, sy, shelfW - 2, 1, COPPER.body);
      const colors = [GLASS.green, GLASS.red, GLASS.violet, GLASS.blue, LOTUS.base];
      for (let i = 0; i < 14; i++) {
        const bx = shelfX + 6 + i * Math.round((shelfW - 12) / 14);
        const bh = 7 + (noise(i, row) % 3) * 2;
        px(bx, sy - bh, 6, bh, IRON.dark);
        px(bx + 1, sy - bh + 2, 4, bh - 3, colors[(i + row) % colors.length]);
        px(bx + 1, sy - bh + 2, 2, 2, LOTUS.light);
        px(bx + 2, sy - bh - 2, 2, 2, COPPER.dark);
      }
    }
    // Hanging herbs nailed to the back wall.
    for (let i = 0; i < 8; i++) {
      const hx = fx(0.08 + i * 0.105);
      px(hx, wall + 2, 2, 6, WALL.edge);
      for (let k = 0; k < 5; k++) {
        px(hx - 2 + (k % 2) * 3, wall + 8 + k * 4, 5, 3, k % 2 ? HERB.base : HERB.light);
      }
      px(hx - 1, wall + 26, 4, 2, HERB.dark);
    }

    // --- Left work table: caldron and bowls --------------------------------
    const table = (x, y, w, h) => {
      px(x + 4, y + h + 2, w, 4, '#241a10');
      px(x, y, w, h, CONTOUR);
      px(x + 2, y + 2, w - 4, h - 4, '#a07850');
      px(x + 2, y + 2, w - 4, 3, '#c09a6a');
      px(x + 2, y + h - 6, w - 4, 4, '#6a4a2a');
      px(x + 4, y + h - 2, 5, 8, WALL.edge);
      px(x + w - 9, y + h - 2, 5, 8, WALL.edge);
    };
    const tableX = fx(0.18), tableY = fy(0.42), tableW = fx(0.24), tableH = Math.max(16, fy(0.09));
    table(tableX, tableY, tableW, tableH);
    // Caldron: a stepped iron pot with its yellow brew.
    const pot = (cx, cy, radius) => {
      disc(cx, cy, radius, { light: IRON.light, mid: IRON.body, dark: IRON.dark }, { edge: CONTOUR });
      disc(cx, cy - 2, Math.max(3, radius - 5), { light: LOTUS.base, mid: LOTUS.mid, dark: LOTUS.dark });
      px(cx - 2, cy - 3, 4, 2, LOTUS.light);
      glow(ctx, cx * 2, cy * 2 - 6, radius * 3, LOTUS.base, { steps: 3, alpha: 0.05 });
    };
    pot(tableX + Math.round(tableW * 0.3), tableY + Math.round(tableH * 0.4), Math.max(5, Math.round(tableW * 0.13)));
    pot(tableX + Math.round(tableW * 0.72), tableY + Math.round(tableH * 0.5), Math.max(4, Math.round(tableW * 0.1)));
    // Bowls and a mortar on the near edge.
    px(tableX + 8, tableY + tableH - 14, 10, 5, CONTOUR);
    px(tableX + 9, tableY + tableH - 13, 8, 3, '#b7a678');
    px(tableX + 24, tableY + tableH - 12, 8, 6, CONTOUR);
    px(tableX + 25, tableY + tableH - 11, 6, 4, '#8a7a58');

    // --- Right work table: the still --------------------------------------
    const stillX = fx(0.6), stillY = fy(0.36), stillW = fx(0.26), stillH = Math.max(18, fy(0.1));
    table(stillX, stillY, stillW, stillH);
    const potX = stillX + Math.round(stillW * 0.34), potY = stillY + Math.round(stillH * 0.42);
    disc(potX, potY, Math.max(6, Math.round(stillW * 0.12)), { light: COPPER.light, mid: COPPER.body, dark: COPPER.dark }, { edge: CONTOUR });
    // Copper coil climbing out of the pot to a glass receiver.
    for (let i = 0; i < 9; i++) {
      px(potX + 4 + i * 3, potY - 8 - i * 3, 6, 3, i % 2 ? COPPER.body : COPPER.light);
    }
    px(potX + 30, potY - 40, 3, 16, COPPER.body);
    px(potX + 26, potY - 24, 11, 8, CONTOUR);
    px(potX + 27, potY - 23, 9, 6, GLASS.green);
    px(potX + 28, potY - 22, 3, 2, HERB.light);
    // The vat: the yellow lotus steeping in the open.
    const vatX = fx(0.79), vatY = fy(0.62), vatR = Math.max(8, Math.round(fx(0.045)));
    disc(vatX, vatY, vatR, { light: '#9a7a48', mid: '#7a5a34', dark: '#543c22' }, { edge: CONTOUR });
    disc(vatX, vatY - 3, vatR - 3, { light: LOTUS.light, mid: LOTUS.base, dark: LOTUS.mid });
    px(vatX - 4, vatY - 6, 6, 2, '#fff6cf');
    glow(ctx, vatX * 2, vatY * 2 - 8, vatR * 2, LOTUS.base, { steps: 3, alpha: 0.05 });

    // --- Floor clutter: crates, sacks, mushrooms, powder ------------------
    const crate = (x, y, s) => {
      px(x + 2, y + 2, s, s, '#241a10');
      px(x, y, s, s, CONTOUR);
      px(x + 2, y + 2, s - 4, s - 4, '#6a4a2a');
      px(x + 2, y + 2, s - 4, 2, '#8a6538');
      px(x + 2, y + Math.round(s / 2), s - 4, 2, CONTOUR);
    };
    crate(fx(0.09), fy(0.78), 14);
    crate(fx(0.53), fy(0.8), 12);
    crate(fx(0.9), fy(0.76), 15);
    // Sacks: rounded, tied at the neck.
    const sack = (x, y, w, h) => {
      px(x + 1, y + h, w, 3, '#241a10');
      px(x, y, w, h, CONTOUR);
      px(x + 1, y + 2, w - 2, h - 2, '#a99770');
      px(x + 2, y + 3, 3, h - 6, '#c2b28a');
      px(x + 2, y + 3, w - 6, 2, '#bfae86');
      px(x + 3, y - 3, w - 6, 5, '#8a7a58');
    };
    sack(fx(0.4), fy(0.85), 14, 12);
    sack(fx(0.44), fy(0.88), 12, 10);
    // Mushrooms in the corners.
    for (let i = 0; i < 10; i++) {
      const mx = fx(0.06 + (noise(i, 31) / 97) * 0.14);
      const my = fy(0.3 + (noise(i, 37) / 97) * 0.4);
      px(mx, my, 2, 6, '#d8cfb4');
      disc(mx, my - 2, Math.max(2, 2 + (noise(i, 41) % 2)), { light: '#c9b0e0', mid: '#8f6fa8', dark: '#5e4670' });
    }
    // Lotus powder spilled on the floor: the only saturated thing down there.
    for (let i = 0; i < 70; i++) {
      const x = fx(0.1 + (noise(i, 43) / 97) * 0.8);
      const y = fy(0.2 + (noise(i, 47) / 97) * 0.7);
      px(x, y, 4, 2, i % 3 ? LOTUS.mid : LOTUS.dark);
    }

    // --- Smoke: the room always smells of the lotus -----------------------
    for (let i = 0; i < 5; i++) {
      const sx = fx(0.22 + i * 0.13), sy = fy(0.16 + (i % 2) * 0.06);
      px(sx, sy, 6, 4, `${SMOKE}33`);
      px(sx + 3, sy - 5, 5, 4, `${SMOKE}22`);
    }
  },
  animate(ctx, { width, height, time }) {
    const { px, w: aw, h: ah } = art(ctx, width, height);
    const fx = f => Math.round(f * aw);
    const fy = f => Math.round(f * ah);
    // Two caldrons breathe: a slow pulse of light on the brew, no redraw of the room.
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    ctx.save();
    ctx.globalAlpha = 0.12 + pulse * 0.12;
    px(fx(0.23), fy(0.47), 8, 4, LOTUS.light);
    px(fx(0.34), fy(0.5), 6, 3, LOTUS.base);
    ctx.globalAlpha = 0.1 + (1 - pulse) * 0.1;
    px(fx(0.79), fy(0.61), 10, 4, LOTUS.light);
    ctx.restore();
  },
};
