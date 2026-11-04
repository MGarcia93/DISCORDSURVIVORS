import { WORLD_SCALE } from './constants.mjs';
import { pixel } from './sprites.mjs';
import { emit } from './bus.mjs';

// The drop a body leaves behind. This module owns the whole rule: the chance,
// the heal, the object each ficha drops and the native-resolution drawing.
// The engine only rolls it on a kill, collects it on contact and clears the
// floor at the wave boundary.
//
// The drop is deliberately rare in the first worlds: act one pays 0.5% per
// kill and each world adds half a point, up to 3.5% in the last one. It also
// grows as the body's health falls, so the last sliver of life is the one time
// the game leans in. The `dropChance` / `dropHeal` effects are the upgrade's
// own contribution and stack on top of both.
export const DROP_HEAL = 14;
export const PICKUP_TTL = 12;
// One entry per world, so the first two can stay stingy without dragging the
// rest of the campaign down with them.
const ACT_CHANCE = Object.freeze([0.005, 0.010, 0.015, 0.020, 0.025, 0.030, 0.035]);
// Exported so the development sandbox states the real number instead of a copy
// that drifts the moment the drop is tuned.
export const MISSING_HEALTH_CHANCE = 0.08;
const MAX_CHANCE = 0.25;
// The object is small: it is picked up slightly before the bodies touch.
const REACH = 22 * WORLD_SCALE;

// Every object carries its own two-step outline: one black pixel against the
// body, one warm-white pixel outside it. That is what keeps a black purse and a
// pale chipá readable on a light floor and on a dark street alike. The ring is
// computed from the drawing itself, so a new object gets it for free.
const OUTLINE_INK = '#0d0b12';
const OUTLINE_LIGHT = '#f2ede0';

// Collect the ad-hoc rectangles into a cell map, last write wins, so the art is
// authored exactly as before.
function collect(body) {
  const cells = new Map();
  body((x, y, w, h, color) => {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) cells.set(`${col},${row}`, { x: col, y: row, color });
    }
  });
  return [...cells.values()];
}

// Rows of equal colour become one rectangle: the ring and the art paint as a
// few dozen rects instead of one per pixel.
function runs(cells) {
  const byRow = new Map();
  for (const cell of cells) {
    if (!byRow.has(cell.y)) byRow.set(cell.y, []);
    byRow.get(cell.y).push(cell);
  }
  const out = [];
  for (const [y, row] of byRow) {
    row.sort((a, b) => a.x - b.x);
    let start = row[0].x, end = start, color = row[0].color;
    for (const cell of row.slice(1)) {
      if (cell.x === end + 1 && cell.color === color) { end = cell.x; continue; }
      out.push({ x: start, y, w: end - start + 1, color });
      start = end = cell.x;
      color = cell.color;
    }
    out.push({ x: start, y, w: end - start + 1, color });
  }
  return out;
}

// The ring lives OUTSIDE the silhouette only: an enclosed hole (the chipá's)
// stays a hole instead of growing a frame of its own.
function outline(cells) {
  const filled = new Set(cells.map(cell => `${cell.x},${cell.y}`));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const cell of cells) {
    minX = Math.min(minX, cell.x); maxX = Math.max(maxX, cell.x);
    minY = Math.min(minY, cell.y); maxY = Math.max(maxY, cell.y);
  }
  minX -= 2; maxX += 2; minY -= 2; maxY += 2;
  const outside = new Set();
  const queue = [];
  for (let x = minX; x <= maxX; x++) queue.push([x, minY], [x, maxY]);
  for (let y = minY; y <= maxY; y++) queue.push([minX, y], [maxX, y]);
  while (queue.length) {
    const [x, y] = queue.pop();
    if (x < minX || x > maxX || y < minY || y > maxY) continue;
    const key = `${x},${y}`;
    if (filled.has(key) || outside.has(key)) continue;
    outside.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const ring = [];
  for (const key of outside) {
    const [x, y] = key.split(',').map(Number);
    let distance = 3;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const step = Math.max(Math.abs(dx), Math.abs(dy));
        if (step && step < distance && filled.has(`${x + dx},${y + dy}`)) distance = step;
      }
    }
    if (distance === 1) ring.push({ x, y, color: OUTLINE_INK });
    else if (distance === 2) ring.push({ x, y, color: OUTLINE_LIGHT });
  }
  return ring;
}

function art(body) {
  const cells = collect(body);
  return Object.freeze({ ring: runs(outline(cells)), cells: runs(cells) });
}

// The ground point is the origin: the object sits above the spot it fell on.
function paint(ctx, x, y, { scale = 2, bob = 0 } = {}, drawing) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(scale, scale);
  for (const run of drawing.ring) pixel(ctx, run.x, run.y, run.w, 1, run.color);
  for (const run of drawing.cells) pixel(ctx, run.x, run.y, run.w, 1, run.color);
  ctx.restore();
}

// El Negro's drop: the Kuromi coin purse he would never admit to owning. The
// silhouette is the joke: black round head, two big pointed ears, the zipper on
// top, the pink skull and the wide white face whose top edge dips in the middle
// where the hood comes down.
const KUROMI = art(p => {
  const INK = '#3a2f45';
  // Ears.
  p(-8, -19, 2, 1, INK);
  p(-8, -18, 3, 1, INK);
  p(-8, -17, 4, 1, INK);
  p(-8, -16, 4, 1, INK);
  p(-8, -15, 4, 1, INK);
  p(-8, -14, 4, 1, INK);
  p(-8, -13, 4, 1, INK);
  p(6, -19, 2, 1, INK);
  p(5, -18, 3, 1, INK);
  p(4, -17, 4, 1, INK);
  p(4, -16, 4, 1, INK);
  p(4, -15, 4, 1, INK);
  p(4, -14, 4, 1, INK);
  p(4, -13, 4, 1, INK);
  // Head.
  p(-4, -14, 8, 1, INK);
  p(-6, -13, 12, 1, INK);
  p(-7, -12, 14, 1, INK);
  p(-8, -11, 16, 10, INK);
  p(-6, -1, 12, 1, INK);
  // Zipper: a dashed silver line with the pull on the right.
  for (let col = -5; col <= 4; col += 2) p(col, -13, 1, 1, '#c9ccd6');
  p(4, -14, 2, 2, '#c9ccd6');
  // Pink skull on the hood.
  p(-2, -12, 5, 1, '#f2a7c3');
  p(-2, -11, 5, 1, '#f2a7c3');
  p(-2, -10, 5, 1, '#f2a7c3');
  p(-1, -9, 1, 1, '#f2a7c3');
  p(1, -9, 1, 1, '#f2a7c3');
  p(-1, -11, 1, 2, '#c4708f');
  p(1, -11, 1, 2, '#c4708f');
  // White face: the shoulders sit high, the hood dips in the middle.
  p(-6, -9, 4, 1, '#f2efe8');
  p(2, -9, 4, 1, '#f2efe8');
  p(-6, -8, 5, 1, '#f2efe8');
  p(1, -8, 5, 1, '#f2efe8');
  p(-6, -7, 12, 5, '#f2efe8');
  p(-5, -2, 10, 1, '#f2efe8');
  p(-4, -1, 8, 1, '#f2efe8');
  // Tall eyes on the sides, the lash on the outer top and a glint.
  p(-5, -6, 3, 4, '#121018');
  p(2, -6, 3, 4, '#121018');
  p(-6, -7, 1, 1, '#121018');
  p(5, -7, 1, 1, '#121018');
  p(-5, -6, 1, 1, '#f2efe8');
  p(2, -6, 1, 1, '#f2efe8');
  // The little nose between them, and the smile below.
  p(-1, -4, 2, 1, '#f2a7c3');
  p(-1, -2, 2, 1, '#121018');
});

// Solago's water ice pop: a frozen block on a wooden stick.
const ICE_POP = art(p => {
  p(-1, -2, 2, 6, '#d9c4a8');
  p(-4, -12, 8, 10, '#5c3a24');
  p(-3, -11, 6, 8, '#f0954f');
  p(-3, -11, 2, 8, '#ffb877');
  p(-3, -4, 6, 1, '#c96a28');
});

// Papazito's chipá: pale ivory dough with a cracked crust and a real hole in the
// middle. The hole is left unpainted on purpose, so the street (and the drop's
// own glow) shows through it exactly like the reference photo.
const CHIPA = art(p => {
  // Crust ring: the two middle rows are split to leave the hole open.
  p(-4, -11, 8, 1, '#b8a276');
  p(-6, -10, 12, 1, '#b8a276');
  p(-7, -9, 5, 2, '#b8a276');
  p(2, -9, 5, 2, '#b8a276');
  p(-7, -7, 14, 1, '#b8a276');
  p(-6, -6, 12, 1, '#b8a276');
  p(-4, -5, 8, 1, '#b8a276');
  // Dough, same split.
  p(-3, -10, 6, 1, '#e8dcb8');
  p(-6, -9, 3, 2, '#e8dcb8');
  p(3, -9, 3, 2, '#e8dcb8');
  p(-6, -7, 12, 1, '#e8dcb8');
  p(-5, -6, 10, 1, '#e8dcb8');
  p(-3, -5, 6, 1, '#e8dcb8');
  // Baked top-left, warm underside.
  p(-3, -10, 5, 1, '#f4ecd4');
  p(-6, -9, 3, 1, '#f4ecd4');
  p(-6, -6, 8, 1, '#cbb98d');
  p(-3, -5, 5, 1, '#cbb98d');
  // The rim right around the hole, a shade darker: depth, not a painted hole.
  p(-3, -9, 1, 2, '#a89464');
  p(2, -9, 1, 2, '#a89464');
  p(-2, -7, 4, 1, '#a89464');
  p(-2, -10, 4, 1, '#cbb98d');
  // Cracks.
  p(-5, -10, 1, 1, '#b09a68');
  p(1, -10, 1, 1, '#b09a68');
  p(-6, -7, 1, 1, '#b09a68');
  p(4, -7, 1, 1, '#b09a68');
});

// Warrior's mushroom: the same grey-green cap his smoke carries.
const MUSHROOM = art(p => {
  p(-1, -7, 2, 7, '#cfc4ad');
  p(-3, -12, 6, 1, '#3f4a3a');
  p(-4, -11, 8, 1, '#3f4a3a');
  p(-5, -10, 10, 2, '#3f4a3a');
  p(-4, -8, 8, 1, '#3f4a3a');
  p(-2, -11, 4, 1, '#7f9370');
  p(-3, -10, 6, 1, '#7f9370');
  p(-4, -9, 8, 1, '#7f9370');
  p(-3, -8, 6, 1, '#5b6a51');
  p(-2, -10, 1, 1, '#d8e2c6');
  p(1, -9, 1, 1, '#d8e2c6');
});

// Jhony's whisky: the bottle that pays for itself one sip at a time.
const WHISKY = art(p => {
  p(-1, -15, 2, 2, '#c9a24a');
  p(-1, -13, 2, 3, '#3a1c0c');
  p(-4, -10, 8, 10, '#2a1206');
  p(-3, -9, 6, 9, '#8a4a1c');
  p(-3, -9, 2, 9, '#a95f2a');
  p(-3, -6, 6, 4, '#e8dcc0');
  p(-2, -5, 4, 1, '#8a4a1c');
});

// Papafrita's handheld: the console the collection is made of. Two coloured
// halves, a screen in the middle and a stick on each side — a disc read as a
// donut at this size, the console is unmistakable.
const HANDHELD = art(p => {
  p(-8, -12, 17, 9, '#171b26');
  p(-7, -11, 4, 7, '#1fb6d8');
  p(-7, -11, 4, 1, '#63d9ef');
  p(4, -11, 4, 7, '#e0452f');
  p(4, -11, 4, 1, '#f27b63');
  p(-3, -11, 7, 7, '#242a3a');
  p(-2, -10, 5, 5, '#6fb3dd');
  p(-2, -10, 5, 1, '#a6d8f2');
  p(-6, -9, 2, 2, '#123a4a');
  p(5, -9, 2, 2, '#3a1410');
  p(6, -6, 1, 1, '#f2c14e');
  p(-7, -4, 14, 1, '#0e1119');
});

// One object per ficha. Same effect for all six: only the object and its drawing
// change, so the drop reads as the character's own and never as a stat.
export const PICKUPS = Object.freeze({
  negro: Object.freeze({ id: 'kuromi', label: 'Figura de Kuromi', draw: (ctx, x, y, options) => paint(ctx, x, y, options, KUROMI) }),
  solago: Object.freeze({ id: 'ice-pop', label: 'Paleta de agua', draw: (ctx, x, y, options) => paint(ctx, x, y, options, ICE_POP) }),
  warrior: Object.freeze({ id: 'mushroom', label: 'Hongo', draw: (ctx, x, y, options) => paint(ctx, x, y, options, MUSHROOM) }),
  papazito: Object.freeze({ id: 'chipa', label: 'Chipá', draw: (ctx, x, y, options) => paint(ctx, x, y, options, CHIPA) }),
  jhony: Object.freeze({ id: 'whisky', label: 'Whisky', draw: (ctx, x, y, options) => paint(ctx, x, y, options, WHISKY) }),
  papafrita: Object.freeze({ id: 'handheld', label: 'Consola portátil', draw: (ctx, x, y, options) => paint(ctx, x, y, options, HANDHELD) }),
});

export function pickupFor(character) {
  return PICKUPS[character] ?? PICKUPS.negro;
}

// The chance per kill, with every source already resolved: the world's floor,
// the missing health and the upgrade's own bonus.
export function actDropChance(order = 1) {
  const index = Math.max(1, Math.round(order)) - 1;
  return ACT_CHANCE[Math.min(index, ACT_CHANCE.length - 1)];
}

export function dropChance(run) {
  const p = run.player;
  const missing = p.maxHp > 0 ? Math.max(0, 1 - p.hp / p.maxHp) : 0;
  return Math.min(MAX_CHANCE,
    actDropChance(run.act?.order ?? 1) + missing * MISSING_HEALTH_CHANCE
    + (p.rewardBonuses?.dropChance ?? 0));
}

export function dropHeal(run) {
  return DROP_HEAL + (run.player.rewardBonuses?.dropHeal ?? 0);
}

// One roll per kill. A miss spends the roll and nothing else.
export function dropPickup(run, enemy) {
  if (run.random() >= dropChance(run)) return null;
  // The object arms for a moment: a melee kill lands the drop at the player's
  // own feet, and without the delay the body would swallow it in the same frame
  // and the drop would never be seen.
  const pickup = {
    character: run.player.character, x: enemy.x, y: enemy.y,
    ttl: PICKUP_TTL, arm: 0.35,
  };
  run.pickups.push(pickup);
  // The first drop of the run is also what introduces the mechanic: the shell
  // shows the Administrator's notice, and the loot upgrade only enters the
  // level-up pool once this flag is set. One flag, one introduction.
  if (!run.lootSeen) {
    run.lootSeen = true;
    run.lootNotice = { character: run.player.character };
  }
  return pickup;
}

// Walking over it is the whole interaction. A body at full health leaves it on
// the floor instead of wasting it: the object waits for the hit that opens it.
export function collectPickups(run, dt) {
  const list = run.pickups;
  if (!list?.length) return;
  const p = run.player;
  let kept = null;
  for (const pickup of list) {
    pickup.ttl -= dt;
    pickup.arm = (pickup.arm ?? 0) - dt;
    if (pickup.ttl <= 0) continue;
    if (pickup.arm > 0) {
      (kept ??= []).push(pickup);
      continue;
    }
    const gap = Math.hypot(p.x - pickup.x, p.y - pickup.y);
    if (p.hp >= p.maxHp || gap > REACH + p.hitRadius) {
      (kept ??= []).push(pickup);
      continue;
    }
    const healed = Math.min(dropHeal(run), Math.ceil(p.maxHp - p.hp));
    p.hp = Math.min(p.maxHp, p.hp + healed);
    run.effects.push({ x: pickup.x, y: pickup.y - 16, text: `+${healed}`, ttl: 0.9, heal: true, kind: 'pickup' });
    emit('pickup', { run, player: p, pickup, heal: healed });
  }
  run.pickups = kept ?? [];
}

// The ground layer of the run picture: a faint glow, then the object bobbing
// above it. It blinks on its last two seconds so a drop is never missed.
// `scale` exists for the development sandbox: the game always draws at 2.
export function drawPickups(ctx, run, time = 0, { scale = 2 } = {}) {
  const zoom = scale / 2;
  for (const pickup of run.pickups ?? []) {
    const item = pickupFor(pickup.character);
    const bob = Math.sin(time * 3 + pickup.x * 0.03) * 1.5;
    ctx.save();
    if (pickup.ttl < 2) ctx.globalAlpha *= Math.floor(pickup.ttl * 6) % 2 ? 0.35 : 1;
    ctx.fillStyle = 'rgba(215,247,121,0.14)';
    ctx.fillRect(Math.round(pickup.x - 10 * zoom), Math.round(pickup.y - 3 * zoom), 20 * zoom, 6 * zoom);
    ctx.fillStyle = 'rgba(215,247,121,0.07)';
    ctx.fillRect(Math.round(pickup.x - 5 * zoom), Math.round(pickup.y - 6 * zoom), 10 * zoom, 12 * zoom);
    item.draw(ctx, pickup.x, pickup.y, { bob, scale });
    ctx.restore();
  }
}
