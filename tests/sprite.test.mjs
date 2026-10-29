import test from 'node:test';
import assert from 'node:assert/strict';
import { drawElNegro, drawSolago, drawPatrona, drawAnime, drawGamerProjectile, drawEnemyShot, drawWarrior, drawPapazito, drawSmokeCloud, drawShroomBlast, drawAstralAura, PALETTE } from '../src/sprites.mjs';
import { ENEMY_IDS, getEnemyKind } from '../src/enemies/index.mjs';
import { getCharacter } from '../src/characters/index.mjs';

// Renders a drawer into world-space rectangles (transform applied), so a
// silhouette can be measured instead of eyeballed.
function bounds(draw) {
  const rects = [];
  let sx = 1, sy = 1, tx = 0, ty = 0;
  const ctx = {
    fillStyle: '',
    save() {}, restore() {},
    getTransform: () => ({ a: sx, d: sy }),
    translate(x, y) { tx += x * sx; ty += y * sy; },
    scale(x, y) { sx *= x; sy *= y; },
    fillRect(x, y, w, h) { rects.push({ x: tx + x * sx, y: ty + y * sy, w: w * sx, h: h * sy, color: this.fillStyle }); },
  };
  draw(ctx);
  const left = Math.min(...rects.map(r => r.x));
  const right = Math.max(...rects.map(r => r.x + r.w));
  const top = Math.min(...rects.map(r => r.y));
  const bottom = Math.max(...rects.map(r => r.y + r.h));
  return { width: right - left, height: bottom - top, rects };
}

const enemyShape = kind => bounds(ctx => getEnemyKind(kind).draw(ctx, 0, 0, { time: 0.15, seed: 1 }));
const characterShape = id => bounds(ctx => getCharacter(id).draw(ctx, 0, 0,
  { time: 0.3, moving: true, facing: 1, player: { chair: 0, stand: 0, smile: 0, anime: 0 } }));

test('every enemy kind draws its own body, and no two silhouettes are the same', () => {
  const shapes = Object.fromEntries(ENEMY_IDS.map(kind => [kind, enemyShape(kind)]));
  for (const [kind, shape] of Object.entries(shapes)) {
    assert.ok(shape.rects.length > 10, `${kind} draws a full figure, not an empty frame`);
  }
  const seen = new Set(Object.values(shapes).map(shape => JSON.stringify(shape.rects)));
  assert.equal(seen.size, ENEMY_IDS.length, 'sharing one recipe across kinds is how they became palette swaps');
});

test('the walker kinds are one connected body, never floating pieces', () => {
  // The runner shipped with a one-unit gap at the shoulder and the head off the
  // neck: a sprite can be "different" and still be broken. Every walker must
  // flood-fill as a single figure from its shadow to its head.
  // The boss is excluded on purpose: its sound rings are separate VFX in the air,
  // so the body is connected but the particle rings are not part of the figure.
  for (const kind of ['zombie', 'runner', 'brute', 'meleeMinion', 'mageMinion', 'siegeMinion']) {
    const cells = new Set();
    for (const rect of enemyShape(kind).rects) {
      for (let y = Math.round(rect.y); y < Math.round(rect.y + rect.h); y++) {
        for (let x = Math.round(rect.x); x < Math.round(rect.x + rect.w); x++) cells.add(`${x},${y}`);
      }
    }
    const lowest = [...cells].sort((a, b) => Number(b.split(',')[1]) - Number(a.split(',')[1]))[0];
    const seen = new Set([lowest]);
    const queue = [lowest];
    while (queue.length) {
      const [x, y] = queue.pop().split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx},${y + dy}`;
        if (cells.has(key) && !seen.has(key)) { seen.add(key); queue.push(key); }
      }
    }
    assert.equal(seen.size, cells.size, `${kind} must render as one connected figure`);
  }
});

test('the act 1 boss draws its own alarm zombie at boss density', () => {
  const boss = enemyShape('alarmZombie');
  const player = characterShape('negro');
  assert.ok(boss.height > player.height * 1.3, 'a boss is allowed to tower over the player');
  assert.ok(boss.rects.length > 120, 'bosses carry cast-level detail, far above the ~30 of a common enemy');
  assert.ok(boss.rects.some(rect => rect.color === '#7a2f2f'), 'the dragged alarm is part of the boss, not borrowed art');
});

test('the runner reads lean and tall, and the brute reads wide but never bigger than the player', () => {
  const zombie = enemyShape('zombie');
  const runner = enemyShape('runner');
  const brute = enemyShape('brute');
  const player = characterShape('negro');
  assert.ok(runner.height > zombie.height * 1.1, 'the runner stands taller than the walker');
  assert.ok(runner.width < zombie.width, 'and narrower, so the frame reads as fast');
  assert.ok(brute.width > zombie.width * 1.2, 'the brute is wider than a walker with thicker arms');
  assert.ok(brute.height > zombie.height, 'and a head taller');
  assert.ok(brute.height <= player.height, 'but it never towers over the player');
});


test('drawPapazito draws his photo outfit with a brick instead of a goblet in both facings', () => {
  for (const facing of [1, -1]) {
    const rectangles = [];
    const ctx = { save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1 }),
      translate() {}, fillRect(...args) { rectangles.push([...args, this.fillStyle]); } };
    drawPapazito(ctx, 100, 100, { scale: 1, time: 1, moving: true, facing });
    assert.ok(rectangles.length > 20, 'a full sketch, not an empty frame');
    assert.ok(rectangles.some(r => r[4] === '#1d1c26'), 'plain black t-shirt from the photo');
    assert.ok(rectangles.some(r => r[4] === '#8faecc'), 'light blue jeans with rolled cuffs');
    assert.ok(rectangles.some(r => r[4] === '#efe9dc'), 'white low sneakers');
    assert.ok(rectangles.some(r => r[4] === '#b4543c'), 'an oversized red brick replaces the goblet');
    assert.ok(rectangles.some(r => r[4] === '#8f3f2e'), 'dark holes make the brick readable');
    assert.ok(!rectangles.some(r => r[4] === '#dad8dc' || r[4] === '#7c3b55'), 'no goblet or wine remains');
  }
});

test('Papazito wears the orange hi-vis vest from his portrait over the black tee', () => {
  for (const facing of [1, -1]) {
    const rectangles = [];
    const ctx = { save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1 }),
      translate() {}, fillRect(...args) { rectangles.push([...args, this.fillStyle]); } };
    drawPapazito(ctx, 100, 100, { scale: 1, time: 1, moving: false, facing });
    const has = color => rectangles.some(rect => rect[4] === color);
    assert.ok(has('#e8942f'), 'the construction vest is the portrait orange');
    assert.ok(has('#eef2dc'), 'each vest panel carries a reflective strip');
    assert.ok(has('#1d1c26'), 'the vest is open at the front: the black tee still shows');
  }
});

test('Papazito keeps a connected silhouette and visible jeans in idle and walking poses', () => {
  for (const facing of [1, -1]) for (const moving of [false, true]) for (const time of [0, 0.125]) {
    const pixels = new Map();
    let tx = 0, ty = 0, sx = 1, sy = 1;
    const ctx = {
      save() {}, restore() {}, getTransform: () => ({ a: sx, d: sy }),
      translate(x, y) { tx += x * sx; ty += y * sy; },
      scale(x, y) { sx *= x; sy *= y; },
      fillRect(x, y, w, h) {
        for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
          pixels.set(`${Math.floor(tx + (x + col + 0.5) * sx)},${Math.floor(ty + (y + row + 0.5) * sy)}`, this.fillStyle);
        }
      },
    };
    drawPapazito(ctx, 64, 64, { scale: 1, facing, moving, time });
    const denim = new Set(['#8faecc', '#7d9ab8', '#6f8fb3', '#b6cddd']);
    assert.ok([...pixels.values()].filter(color => denim.has(color)).length >= 160,
      'both jeans legs must remain visible after the shirt is painted');
    for (let y = 24; y < 59; y++) {
      assert.ok(Array.from({ length: 10 }, (_, i) => pixels.has(`${59 + i},${y}`)).some(Boolean),
        `head, neck, shirt and hips must connect at row ${y}`);
    }
  }
});

test('Papazito sprites as a heavier, stockier silhouette than Warrior', () => {
  const silhouette = draw => {
    const rectangles = [];
    const ctx = { save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1, e: 0, f: 0 }),
      translate() {}, fillRect(x, y, w, h) { rectangles.push([x, y, w, h]); } };
    draw(ctx, 100, 100, { scale: 1, time: 1, moving: false, facing: 1 });
    return Math.max(...rectangles.map(r => r[0] + r[2])) - Math.min(...rectangles.map(r => r[0]));
  };
  assert.ok(silhouette((...args) => drawPapazito(...args)) > silhouette((...args) => drawWarrior(...args)),
    'the seña survivor is the bulk frame of the roster');
});

// House-style contract for the late-roster sprites: Warrior and Papazito must
// sit on El Negro's grid and share his closed ink contour, so the whole cast
// reads as one set instead of four different pixel-art languages.
const CONTOUR_INK = '#171526';

function castPixels(draw) {
  const pixels = new Map();
  let tx = 0, ty = 0, sx = 1, sy = 1;
  const ctx = {
    save() {}, restore() {},
    getTransform: () => ({ a: sx, d: sy }),
    translate(x, y) { tx += x * sx; ty += y * sy; },
    scale(x, y) { sx *= x; sy *= y; },
    fillRect(x, y, w, h) {
      for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
        pixels.set(`${Math.floor(tx + (x + col + 0.5) * sx)},${Math.floor(ty + (y + row + 0.5) * sy)}`, this.fillStyle);
      }
    },
  };
  draw(ctx, 64, 64, { scale: 1, time: 0, moving: false, facing: 1 });
  return pixels;
}

function silhouetteBounds(pixels) {
  const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const [key, color] of pixels) {
    // The ground shadow and the alpha smoke puffs are staging, not body.
    if (color === '#11141c' || color.length === 9) continue;
    const [x, y] = key.split(',').map(Number);
    box.left = Math.min(box.left, x); box.right = Math.max(box.right, x + 1);
    box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y + 1);
  }
  return { ...box, width: box.right - box.left, height: box.bottom - box.top };
}

test('Warrior and Papazito share El Negro’s 46px grid', () => {
  const negro = silhouetteBounds(castPixels(drawElNegro));
  for (const [name, draw] of [['Warrior', drawWarrior], ['Papazito', drawPapazito]]) {
    const sprite = silhouetteBounds(castPixels(draw));
    assert.ok(Math.abs(sprite.height - negro.height) <= 1,
      `${name} is ${sprite.height}px tall and must sit on El Negro’s ${negro.height}px grid`);
  }
});

test('Warrior and Papazito carry the same closed ink contour as the rest of the cast', () => {
  for (const [name, draw] of [['Warrior', drawWarrior], ['Papazito', drawPapazito]]) {
    const pixels = castPixels(draw);
    // Torso band on the shared grid: both silhouettes must be fully present
    // there, so the outermost pixel of every row has to be the outline ink.
    for (let y = 34; y < 55; y++) {
      let left = null, right = null;
      for (const [key, color] of pixels) {
        const [x, py] = key.split(',').map(Number);
        if (py !== y) continue;
        if (!left || x < left.x) left = { x, color };
        if (!right || x > right.x) right = { x, color };
      }
      assert.ok(left && right, `${name} must be present at row ${y}`);
      assert.equal(left.color, CONTOUR_INK, `${name} left edge at row ${y} must be the contour ink`);
      assert.equal(right.color, CONTOUR_INK, `${name} right edge at row ${y} must be the contour ink`);
    }
  }
});

test('drawWarrior draws his photo outfit in both facings', () => {
  for (const facing of [1, -1]) {
    const rectangles = [];
    const ctx = { save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1 }),
      translate() {}, fillRect(...args) { rectangles.push([...args, this.fillStyle]); } };
    drawWarrior(ctx, 100, 100, { scale: 1, time: 1, moving: true, facing });
    assert.ok(rectangles.length > 20, 'a full sketch, not an empty frame');
    assert.ok(rectangles.some(r => r[4] === '#c4404e'), 'red headband from the photo');
    assert.ok(rectangles.some(r => r[4] === '#e2627d'), 'salmon shorts from the photo');
    assert.ok(rectangles.some(r => r[4] === '#f2eee1'), 'white training tank');
  }
});

test('the shroom projectile is a little tumbling mushroom with a capped head', () => {
  const rectangles = [];
  const ctx = { save() {}, restore() {}, translate() {}, fillRect(...args) { rectangles.push([...args, this.fillStyle]); } };
  drawGamerProjectile(ctx, 'shroom');
  assert.ok(rectangles.length >= 5, 'a full little shroom, not a bare frame');
  const width = Math.max(...rectangles.map(r => r[0] + r[2])) - Math.min(...rectangles.map(r => r[0]));
  assert.ok(width >= 28, 'the mushroom is large enough to read as a bomb in flight');
  assert.ok(rectangles.some(r => r[4] === '#c9556b'), 'the pink hongo cap from the kit');
  assert.ok(rectangles.some(r => r[4] === '#e9dfc8'), 'cream stem');
  assert.ok(rectangles.some(r => r[4] === '#f2e9d8'), 'cap spots');
});

test('smoke, mushroom blasts, and Viaje Astral each draw visible animated pixels', () => {
  const rectangles = [];
  const ctx = { save() {}, restore() {}, fillRect(...args) { rectangles.push([...args, this.fillStyle]); } };
  drawSmokeCloud(ctx, 100, 100, 90, 1.2);
  const smokeCount = rectangles.length;
  drawShroomBlast(ctx, 100, 100, 80, 0.5);
  const blastCount = rectangles.length - smokeCount;
  drawAstralAura(ctx, 100, 100, 170, 1.2);
  const astralCount = rectangles.length - smokeCount - blastCount;
  assert.ok(smokeCount >= 20, 'smoke renders a broad cloud, not an undefined text label');
  assert.ok(blastCount >= 30, 'the bomb renders an expanding area blast');
  assert.ok(astralCount >= 30, 'Viaje Astral renders an animated orbiting aura');
});

function record(options = {}) {  const rectangles = [];
  const translations = [];
  const ctx = {
    save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1 }),
    translate: (...args) => translations.push(args),
    fillRect(...args) { rectangles.push([...args, this.fillStyle]); },
  };
  drawElNegro(ctx, 100, 100, { scale: 1, ...options });
  return { rectangles, translations };
}

function silhouette(draw, options = {}) {
  const rectangles = [];
  const ctx = {
    save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1, e: 0, f: 0 }),
    translate() {},
    fillRect(x, y, width, height) { rectangles.push([x, y, width, height]); },
  };
  draw(ctx, 100, 100, { scale: 1, ...options });
  return rectangles.reduce((box, [x, y, width, height]) => ({
    left: Math.min(box.left, x), top: Math.min(box.top, y),
    right: Math.max(box.right, x + width), bottom: Math.max(box.bottom, y + height),
  }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
}

function recordSolago(options = {}) {
  const rectangles = [];
  const ctx = {
    save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1, e: 0, f: 0 }),
    translate() {},
    fillRect(...rect) { rectangles.push([...rect, this.fillStyle]); },
  };
  drawSolago(ctx, 100, 100, { scale: 2, ...options });
  return rectangles;
}

test('El Negro preserves the earlier face, hair, glasses, beard and height in every pose', () => {
  for (const options of [{}, { sitting: true }, { moving: true, time: 0.15, facing: -1 }]) {
    const { rectangles, translations } = record(options);
    const walkingFrame = options.moving ? 1 : 0;
    assert.deepEqual(translations[1], [-18, -46 + walkingFrame]);
    for (const feature of [
      [4, 3, 28, 18, PALETTE.ink],
      [3, 0, 7, 7, PALETTE.hair],
      [8, 8, 20, 14, PALETTE.skin],
      [10, 12, 7, 5, PALETTE.ink],
      [20, 12, 7, 5, PALETTE.ink],
      [13, 20, 12, 2, PALETTE.hair],
      [17, 23, 5, 2, PALETTE.hair],
      [23, 22, 1, 2, PALETTE.metal],
    ]) assert.ok(rectangles.some(rect => JSON.stringify(rect) === JSON.stringify(feature)), `Missing reference feature ${feature}`);
  }
});

test('only the lower hoodie widens into a modest belly without stretching the sprite', () => {
  const { rectangles } = record();
  assert.ok(rectangles.some(rect => JSON.stringify(rect) === JSON.stringify([1, 30, 34, 7, PALETTE.ink])));
  assert.ok(rectangles.some(rect => JSON.stringify(rect) === JSON.stringify([3, 30, 30, 6, PALETTE.hoodie])));
  assert.ok(rectangles.some(rect => JSON.stringify(rect) === JSON.stringify([8, 36, 18, 9, PALETTE.ink])));
});

test('the anime summon is smaller and has a detailed dressed waifu sprite', () => {
  const rectangles = [];
  const ctx = {
    save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1 }),
    translate() {},
    fillRect(x, y, w, h) { rectangles.push([x, y, w, h, this.fillStyle]); },
  };
  drawAnime(ctx, 100, 100, { scale: 2 });
  const bounds = rectangles.reduce((box, [x, y, width, height]) => ({
    left: Math.min(box.left, x), top: Math.min(box.top, y),
    right: Math.max(box.right, x + width), bottom: Math.max(box.bottom, y + height),
  }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
  assert.ok(bounds.right - bounds.left <= 56, 'Summon remains smaller than El Negro');
  assert.ok(rectangles.some(rect => rect[4] === '#e7a3d1'), 'Summon keeps a distinctive waifu hair bow');
  assert.ok(rectangles.some(rect => rect[4] === '#f0c9b9'), 'The cropped outfit shows a small skin-tone midriff');
  assert.ok(rectangles.some(rect => rect[4] === '#302342'), 'Character wears a distinct dark skirt outfit');
});

test('remote, joystick and phone use visibly distinct pixel-art sprites', () => {
  const drawDevice = device => {
    const rectangles = [];
    drawGamerProjectile({ fillRect(x, y, w, h) { rectangles.push([x, y, w, h, this.fillStyle]); } }, device);
    return rectangles;
  };
  const remote = drawDevice('remote');
  const joystick = drawDevice('joystick');
  const phone = drawDevice('phone');
  const brick = drawDevice('brick');
  assert.notDeepEqual(remote, joystick);
  assert.notDeepEqual(joystick, phone);
  assert.notDeepEqual(remote, phone);
  assert.notDeepEqual(brick, remote, 'Papazito bricks are their own tumbling device');
  assert.ok(joystick.some(rect => rect[4] === '#e9e0d3'), 'Joystick has its distinct D-pad');
  assert.ok(phone.some(rect => rect[4] === '#39585a'), 'Phone has its own screen');
  assert.ok(remote.some(rect => rect[4] === '#c7df8c'), 'Remote has separate channel buttons');
  assert.ok(brick.some(rect => rect[4] === '#b4543c'), 'the fired red brick');
  assert.ok(brick.some(rect => rect[4] === '#8f3f2e'), 'the mortar holes of the ladrillo');
});

test('Solago has visible front teeth and a wristwatch; his Stand is taller and translucent', () => {
  const makeContext = () => {
    const rectangles = [];
    const alphaStack = [];
    return {
      rectangles, globalAlpha: 1,
      save() { alphaStack.push(this.globalAlpha); },
      restore() { this.globalAlpha = alphaStack.pop(); },
      scale() {}, translate() {}, getTransform: () => ({ a: 1, d: 1, e: 0, f: 0 }),
      fillRect(x, y, width, height) { rectangles.push({ x, y, width, height, color: this.fillStyle, alpha: this.globalAlpha }); },
    };
  };
  const solago = makeContext();
  const patrona = makeContext();
  drawSolago(solago, 100, 100, { scale: 2 });
  drawPatrona(patrona, 130, 100, { scale: 2 });
  assert.ok(solago.rectangles.some(rect => rect.color === '#fbebd4'), 'Front teeth are a distinct light pixel block');
  assert.ok(solago.rectangles.some(rect => rect.color === '#555878'), 'The watch has a readable face');
  assert.ok(patrona.rectangles.some(rect => rect.alpha === 0.58), 'The Stand is visibly semi-transparent');
  const standBounds = patrona.rectangles.reduce((bounds, rect) => ({
    top: Math.min(bounds.top, rect.y), bottom: Math.max(bounds.bottom, rect.y + rect.height),
  }), { top: Infinity, bottom: -Infinity });
  const solagoBounds = solago.rectangles.reduce((bounds, rect) => ({
    top: Math.min(bounds.top, rect.y), bottom: Math.max(bounds.bottom, rect.y + rect.height),
  }), { top: Infinity, bottom: -Infinity });
  assert.ok(standBounds.bottom - standBounds.top > solagoBounds.bottom - solagoBounds.top, 'The Stand towers behind its user');
  assert.ok(patrona.rectangles.some(rect => rect.color === '#dfe4ed'), 'The Stand carries bright crossed scissor blades');
  assert.ok(patrona.rectangles.filter(rect => rect.color === '#302a3e').length >= 2, 'Both scissor handles have separate dark finger loops');
});

test('Solago reads as a short, skinny guy next to the fat El Negro tank', () => {
  const solago = silhouette(drawSolago);
  const negro = silhouette(drawElNegro);
  const solagoWidth = solago.right - solago.left;
  const solagoHeight = solago.bottom - solago.top;
  const negroWidth = negro.right - negro.left;
  const negroHeight = negro.bottom - negro.top;
  assert.ok(solagoWidth <= negroWidth * 0.8, `Solago silhouette ${solagoWidth}px must be clearly narrower than El Negro’s ${negroWidth}px`);
  assert.ok(solagoHeight <= negroHeight * 0.85, `Solago silhouette ${solagoHeight}px must be clearly shorter than El Negro’s ${negroHeight}px`);
});

test('Solago keeps his body centred over the ground shadow and hitbox anchor', () => {
  const rects = [];
  let offset = [0, 0];
  const ctx = {
    save() {}, restore() {}, scale() {}, getTransform: () => ({ a: 1, d: 1, e: 0, f: 0 }),
    translate(x, y) { offset = [offset[0] + x, offset[1] + y]; },
    fillRect(x, y, w, h) { rects.push({ x: x + offset[0], y: y + offset[1], w, h, color: this.fillStyle }); },
  };
  drawSolago(ctx, 0, 0, { scale: 1 });
  const body = rects.filter(rect => rect.color !== '#11141c');
  const shadow = rects.find(rect => rect.color === '#11141c');
  const left = Math.min(...body.map(rect => rect.x));
  const right = Math.max(...body.map(rect => rect.x + rect.w));
  assert.ok(Math.abs((left + right) / 2) <= 2, `Solago body centre ${(left + right) / 2} must sit over the shadow and hitbox centre`);
  assert.ok(shadow.x >= left - 3 && shadow.x + shadow.w <= right + 3, 'The ground shadow must not stick out past the body');
});

test('Solago torso and legs are slimmer than El Negro’s tank silhouette', () => {
  const rectangles = recordSolago();
  const bodyWidths = rectangles.filter(rect => rect[4] === '#33303a').map(rect => rect[2]);
  const trouserWidths = rectangles.filter(rect => rect[4] === '#292735').map(rect => rect[2]);
  assert.ok(bodyWidths.length > 0 && Math.max(...bodyWidths) <= 31, 'Solago tee is narrower than the tank hoodie');
  assert.ok(trouserWidths.length > 0 && Math.max(...trouserWidths) <= 11, 'Solago legs stay compact');
});

test('Solago uses a distinct forward lunge and open-mouth bite while attacking', () => {
  const idle = recordSolago();
  const biting = recordSolago({ attacking: true, time: 0.1 });
  assert.notDeepEqual(biting, idle);
  assert.ok(biting.some(rect => rect[4] === '#f0cf8a'), 'Bite frame has a separate impact flash');
});

test('Solago has a visibly compressed crouching pose during the Stand', () => {
  const standing = recordSolago();
  const crouching = recordSolago({ crouching: true });
  const trouserTop = rectangles => Math.min(...rectangles.filter(rect => rect[4] === '#292735').map(rect => rect[1]));
  assert.notDeepEqual(crouching, standing);
  assert.ok(trouserTop(crouching) < trouserTop(standing), 'Crouched legs tuck higher under the body');
});

test('the Rift minions stay on the cast grid and never tower over the player', () => {
  const player = characterShape('negro');
  for (const kind of ['meleeMinion', 'mageMinion', 'siegeMinion']) {
    const shape = enemyShape(kind);
    assert.ok(shape.height <= player.height, `${kind} is ${shape.height}px and must not pass the player's ${player.height}px`);
    assert.ok(shape.rects.length >= 25, `${kind} carries a full body, not a placeholder`);
  }
});

test('enemy shots are drawn per shooter and the siege shell is not a dot', () => {
  const render = device => {
    const rectangles = [];
    drawEnemyShot({ fillRect(...args) { rectangles.push([...args, this.fillStyle]); }, fillStyle: '' }, device);
    const width = Math.max(...rectangles.map(r => r[0] + r[2])) - Math.min(...rectangles.map(r => r[0]));
    return { count: rectangles.length, width };
  };
  const bolt = render('bolt');
  const shell = render('shell');
  assert.ok(bolt.count >= 3 && shell.count >= 5, 'both shots have their own art');
  assert.ok(shell.width >= 14, `the shell is ${shell.width}px wide and must read as artillery`);
  assert.notDeepEqual(render('shell'), bolt, 'artillery is not a magic dart');
});
