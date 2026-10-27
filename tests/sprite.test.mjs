import test from 'node:test';
import assert from 'node:assert/strict';
import { drawElNegro, drawSolago, drawPatrona, drawAnime, drawGamerProjectile, drawWarrior, PALETTE } from '../src/sprites.mjs';

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

function record(options = {}) {
  const rectangles = [];
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
  assert.notDeepEqual(remote, joystick);
  assert.notDeepEqual(joystick, phone);
  assert.notDeepEqual(remote, phone);
  assert.ok(joystick.some(rect => rect[4] === '#e9e0d3'), 'Joystick has its distinct D-pad');
  assert.ok(phone.some(rect => rect[4] === '#39585a'), 'Phone has its own screen');
  assert.ok(remote.some(rect => rect[4] === '#c7df8c'), 'Remote has separate channel buttons');
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
