import { art, CONTOUR, CAST_SHADOW, disc, noise } from './paint.mjs';

// Act 1 — Project Zomboid. Knox County from above: a street block, roofs seen
// from the sky, wrecked cars and blood on the asphalt. The whole canvas is
// ground, so a character can walk anywhere on it.
//
// Proportions come from fractions (the same module paints the 1144x748 stage
// and the 480x270 story page). Everything is drawn through `art()` in art
// pixels, the 2px unit the cast uses, and props carry the cast's 1-unit
// contour and bottom-right shadow, so a car and a character read as one scene.
const GROUND = {
  asphalt: '#23272b',
  asphaltWorn: '#262b2f',
  street: '#2b3034',
  streetEdge: '#3a4045',
  kerb: '#4d4d45',
  kerbJoint: '#3d3d37',
  kerbShadow: '#2c2c28',
  paint: '#8a8468',
  manhole: '#1a1d20',
  manholeRim: '#282c30',
};
const ROOF = {
  shingle: '#414a4d',
  shingleAlt: '#363d40',
  ridge: '#4b5356',
  ridgeLit: '#687074',
  eave: '#5a6165',
  gutter: '#1d2225',
  seam: '#2f3639',
  seamDark: '#282e31',
};
const YARD = { grass: '#28322a', grassAlt: '#33422f', hedge: '#3d5136', hedgeLit: '#54704a', fence: '#6a6149' };
const CANOPY = { dark: '#22362a', mid: '#2f4b36', light: '#3b5f42', rim: '#4d7a52' };

export default {
  id: 'zomboid',
  title: 'Act 1 — Knox County',
  draw(ctx, { width, height }) {
    const { fill, px, solid, w: aw, h: ah } = art(ctx, width, height);
    const X = f => Math.round(f * aw);
    const Y = f => Math.round(f * ah);

    // --- Asphalt ----------------------------------------------------------
    fill(0, 0, 1, 1, GROUND.asphalt);
    // Round every noise-driven coordinate: px() takes art units, and a fraction
    // of a unit is half a pixel once it reaches the canvas.
    for (let i = 0; i < 240; i++) {
      px(Math.round((noise(i, 3) / 97) * aw), Math.round((noise(i, 7) / 97) * ah), 2, 1, noise(i, 11) < 50 ? '#1f2327' : GROUND.asphaltWorn);
    }

    // The road, its kerbs and the sidewalks: flat bands, one unit of edge each.
    fill(0, 0.24, 1, 0.52, GROUND.street);
    fill(0, 0.24, 1, 0.006, GROUND.streetEdge);
    fill(0, 0.754, 1, 0.006, '#171b1e');
    for (const [top, kerb] of [[0.185, 0.238], [0.762, 0.755]]) {
      const y = Y(top), h = Y(0.055);
      fill(0, top, 1, 0.055, GROUND.kerb);
      // Sunlit top edge, then slab joints: a sidewalk is poured in slabs, not
      // combed with equal teeth.
      px(0, y, aw, 1, '#585850');
      for (let x = 0, i = 0; x < aw; x += 11, i++) {
        px(x, y, 1, h, GROUND.kerbJoint);
        if (i % 3 === 0) px(x + 4, y + Math.round(h / 2), 4, 1, GROUND.kerbJoint);
        if (i % 5 === 1) px(x + 6, y + 2, 1, 2, '#434339');
      }
      fill(0, kerb, 1, 0.006, GROUND.kerbShadow);
    }

    // Lane dashes and a manhole, both on the unit grid.
    for (let i = 0; i < 11; i++) px(X(0.03 + i * 0.095), Y(0.492), 26, 3, GROUND.paint);
    px(X(0.47) - 2, Y(0.60) - 2, 28, 20, '#141719');
    px(X(0.47), Y(0.60), 24, 16, '#454b50');
    px(X(0.47) + 2, Y(0.60) + 2, 20, 12, '#2a2e32');
    px(X(0.47) + 4, Y(0.60) + 4, 16, 8, GROUND.manhole);
    px(X(0.47) + 5, Y(0.60) + 4, 6, 1, '#3b4045');
    px(X(0.47) + 5, Y(0.60) + 8, 10, 1, '#202427');

    // --- Rooftops ---------------------------------------------------------
    // A gable seen from above: two slopes with different values and a lit ridge
    // between them. One flat rectangle with a line down the middle reads as a
    // metal shed, which is what the first pass looked like.
    const roof = (fx, fy, fw, fh, lit, shade) => {
      const x = X(fx), y = Y(fy), w = X(fw), h = Y(fh);
      const half = Math.round(w / 2);
      px(x + 2, y + 2, w, h, CAST_SHADOW);
      px(x, y, w, h, CONTOUR);
      px(x + 1, y + 1, half - 1, h - 2, lit);
      px(x + half + 1, y + 1, w - half - 2, h - 2, shade);
      // Shingle courses on each slope, one unit thick, offset from the ridge.
      for (let sy = y + 4; sy < y + h - 5; sy += 4) {
        px(x + 2, sy, half - 3, 1, ROOF.seam);
        px(x + half + 2, sy + 2, w - half - 3, 1, ROOF.seamDark);
      }
      // Ridge, eaves and the gutter on the street side.
      px(x + half - 1, y + 1, 2, h - 2, ROOF.ridge);
      px(x + half - 1, y + 1, 1, h - 2, ROOF.ridgeLit);
      px(x + 1, y + 1, w - 2, 1, ROOF.eave);
      px(x + 1, y + h - 2, w - 2, 2, ROOF.gutter);
      // Chimney with its cap and a roof vent on the other slope.
      const cxp = x + Math.round(w * 0.74);
      px(cxp, y + Math.round(h * 0.20), 7, 8, CONTOUR);
      px(cxp + 1, y + Math.round(h * 0.20) + 1, 5, 6, '#3a3f42');
      px(cxp, y + Math.round(h * 0.20), 7, 2, '#22262a');
      px(cxp + 1, y + Math.round(h * 0.20) + 1, 5, 1, '#6b7275');
      px(x + Math.round(w * 0.26), y + Math.round(h * 0.55), 5, 4, ROOF.seamDark);
      px(x + Math.round(w * 0.26) + 1, y + Math.round(h * 0.55) + 1, 3, 2, ROOF.eave);
    };
    roof(0.02, 0.02, 0.20, 0.15, ROOF.shingle, ROOF.shingleAlt);
    roof(0.24, 0.03, 0.14, 0.13, ROOF.shingleAlt, ROOF.shingle);
    roof(0.64, 0.02, 0.16, 0.14, ROOF.shingle, ROOF.shingleAlt);
    roof(0.82, 0.04, 0.16, 0.12, ROOF.shingleAlt, ROOF.shingle);
    roof(0.03, 0.84, 0.19, 0.13, ROOF.shingleAlt, ROOF.shingle);
    roof(0.25, 0.86, 0.13, 0.11, ROOF.shingle, ROOF.shingleAlt);
    roof(0.74, 0.85, 0.22, 0.12, ROOF.shingleAlt, ROOF.shingle);

    // --- Yards ------------------------------------------------------------
    // Placed in the gaps between roofs, so no hedge overlaps a roof any more.
    const yard = (fx, fy, fw, fh, streetSide = 1) => {
      const x = X(fx), y = Y(fy), w = X(fw), h = Y(fh);
      px(x, y, w, h, YARD.grass);
      // Blades in clumps of two or three, never a uniform speckle field.
      for (let i = 0; i < 18; i++) {
        const gx = x + 2 + ((noise(i, Math.round(fx * 100), 5) * 7) % Math.max(1, w - 8));
        const gy = y + 2 + ((noise(i, Math.round(fy * 100), 9) * 7) % Math.max(1, h - 8));
        px(gx, gy, 3, 1, YARD.grassAlt);
        px(gx + 1, gy - 1, 1, 1, YARD.hedge);
      }
      // Hedge on the far side: one contoured band with leaf clumps inside it.
      // Contouring each clump separately turns the hedge into a black-and-green
      // checker, which is what the first pass produced.
      const hedgeY = streetSide > 0 ? y + 2 : y + h - 8;
      const hedgeW = Math.max(6, w - 4);
      px(x + 2, hedgeY, hedgeW, 6, CONTOUR);
      px(x + 3, hedgeY + 1, hedgeW - 2, 4, YARD.hedge);
      for (let hx = x + 4; hx < x + 1 + hedgeW - 2; hx += 4) {
        px(hx, hedgeY + 1, 2, 2, YARD.hedgeLit);
        px(hx + 2, hedgeY + 3, 2, 1, '#33452d');
      }
      // Picket fence with two rails and visible posts on the street side.
      const fenceY = streetSide > 0 ? y + h - 2 : y + 2;
      px(x, fenceY, w, 1, YARD.fence);
      px(x, fenceY - 2, w, 1, YARD.fence);
      for (let post = x + 1; post < x + w - 2; post += 7) px(post, fenceY - 3, 1, 3, YARD.fence);
    };
    yard(0.435, 0.035, 0.185, 0.145, 1);
    yard(0.170, 0.855, 0.070, 0.100, -1);
    yard(0.430, 0.855, 0.290, 0.100, -1);

    // --- Trees seen from above -------------------------------------------
    const tree = (fx, fy, radius) => {
      const cx = X(fx), cy = Y(fy), r = radius;
      // A round shadow under a stepped crown, not two stacked squares.
      disc(px, cx + 4, cy + 5, r, { light: CAST_SHADOW, mid: CAST_SHADOW, dark: CAST_SHADOW });
      disc(px, cx, cy, r, CANOPY, { edge: CONTOUR });
      // Clumps inside the crown so it reads as leaves, not a disc.
      px(cx - Math.round(r * 0.6), cy - Math.round(r * 0.5), Math.round(r * 0.7), Math.round(r * 0.6), CANOPY.light);
      px(cx + Math.round(r * 0.05), cy + Math.round(r * 0.05), Math.round(r * 0.8), Math.round(r * 0.7), CANOPY.dark);
      px(cx - 2, cy - Math.round(r * 0.65), 5, 4, CANOPY.rim);
      px(cx + Math.round(r * 0.35), cy + Math.round(r * 0.4), 4, 3, CANOPY.light);
    };
    // On the lawn, never on a roof: the yards are the only free ground up there.
    tree(0.525, 0.105, 13);
    tree(0.205, 0.905, 7);
    tree(0.600, 0.905, 11);

    // --- Wrecked cars -----------------------------------------------------
    const car = (fx, fy, fw, fh, body) => {
      const x = X(fx), y = Y(fy), w = X(fw), h = Y(fh);
      px(x + 2, y + 2, w, h, CAST_SHADOW);
      px(x, y, w, h, CONTOUR);
      px(x + 1, y + 1, w - 2, h - 2, body);
      // Windscreen, roof, rear window, wheels and lights, each a flat rectangle.
      px(x + 3, y + 2, w - 6, Math.round(h * 0.20), '#1b1d22');
      px(x + 4, y + Math.round(h * 0.24), w - 8, 1, '#3d444c');
      px(x + 2, y + Math.round(h * 0.30), w - 4, Math.round(h * 0.38), '#33383e');
      px(x + 3, y + Math.round(h * 0.32), w - 6, 2, '#3f454c');
      px(x + 3, y + Math.round(h * 0.26), 4, 1, '#4a5158');
      px(x + w - 12, y + Math.round(h * 0.74), 5, 1, '#33383e');
      px(x + 3, y + Math.round(h * 0.70), w - 6, Math.round(h * 0.14), '#202329');
      for (const wy of [y + 1, y + h - 4]) {
        px(x + 2, wy, 4, 3, '#111315');
        px(x + w - 6, wy, 4, 3, '#111315');
      }
      px(x + 3, y + Math.round(h * 0.47), 3, 2, '#6d3a33');
      px(x + w - 7, y + Math.round(h * 0.47), 4, 2, '#c9bb92');
      // One dent and a rust patch keep it from reading as a clean box.
      px(x + Math.round(w * 0.30), y + Math.round(h * 0.36), 5, 3, '#3a3f45');
      px(x + Math.round(w * 0.62), y + Math.round(h * 0.55), 4, 2, '#5c4034');
    };
    car(0.06, 0.30, 0.17, 0.13, '#46383a');
    car(0.735, 0.44, 0.16, 0.12, '#3d4242');
    car(0.45, 0.80, 0.11, 0.09, '#3a3f3a');

    // --- Barricade and dumpster ------------------------------------------
    // Sandbags: staggered rows, each bag a contoured volume.
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 7; i++) {
        const bx = X(0.55) + i * 10 - row * 5;
        const by = Y(0.19) + row * 8;
        px(bx + 1, by + 2, 10, 6, CAST_SHADOW);
        px(bx, by, 10, 7, CONTOUR);
        px(bx + 1, by + 1, 8, 5, row % 2 ? '#5b5442' : '#4f4939');
        px(bx + 1, by + 1, 8, 1, '#6d654e');
        px(bx + 7, by + 4, 2, 1, '#443f33');
      }
    }
    // Dumpster with a lid, a hinge line and a shadow.
    const dx2 = X(0.90), dy2 = Y(0.205), dw = 26, dh = 17;
    px(dx2 + 2, dy2 + 2, dw, dh, CAST_SHADOW);
    solid(dx2, dy2, dw, dh, '#2f4a3d', { shadow: false });
    px(dx2 + 2, dy2 + 2, dw - 4, 4, '#3c5c4a');
    px(dx2 + 2, dy2 + 6, dw - 4, 1, '#1f3329');
    px(dx2 + dw - 6, dy2 + 3, 2, 2, '#446354');

    // --- Blood, debris and cracks ----------------------------------------
    // Chunky splats: a body, a darker core and two droplets, all on the grid.
    for (const [bx, by, size] of [[0.34, 0.58, 2], [0.60, 0.36, 1], [0.22, 0.66, 1], [0.82, 0.66, 2], [0.50, 0.30, 1]]) {
      const cx = X(bx), cy = Y(by);
      px(cx - 4 * size, cy - 2 * size, 8 * size, 4 * size, '#3c171d');
      px(cx - 3 * size, cy - 1 * size, 6 * size, 2 * size, '#4d1c22');
      px(cx - 1 * size, cy - 1 * size, 2 * size, 1, '#5c2129');
      px(cx + 5 * size, cy + 1, 2, 2, '#3c171d');
      px(cx - 6 * size, cy + 2, 2, 1, '#3c171d');
    }
    for (let i = 0; i < 34; i++) {
      const x = Math.round((noise(i, 17) / 97) * aw);
      const y = Math.round(Y(0.26) + (noise(i, 19) / 97) * Y(0.46));
      px(x, y, 2, 1, i % 3 ? '#1c2023' : '#33383c');
    }
    for (let i = 0; i < 9; i++) {
      const x = Math.round(X(0.05 + (noise(i, 23) / 97) * 0.9));
      const y = Math.round(Y(0.28 + (noise(i, 29) / 97) * 0.42));
      px(x - 4, y, 4, 1, '#15181b');
      px(x, y + 1, 4, 1, '#15181b');
      px(x - 2, y + 2, 4, 1, '#15181b');
    }
  },
  animate(ctx, { width, height, time = 0 }) {
    // A shorted street lamp at the top kerb, still stuttering. Alpha bands in
    // steps of two so the glow stays on the same grid as everything else.
    if (Math.sin(time * 11) + Math.sin(time * 27) > 0.9) {
      ctx.save();
      ctx.globalAlpha *= 0.10;
      const x = Math.round(width * 0.30 / 2) * 2;
      const y = Math.round(height * 0.16 / 2) * 2;
      ctx.fillStyle = '#e7d9a4';
      ctx.fillRect(x, y, 56, 36);
      ctx.fillRect(x + 8, y - 6, 40, 48);
      ctx.restore();
    }
  },
};
