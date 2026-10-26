import test from 'node:test';
import assert from 'node:assert/strict';
import { drawElNegro, PALETTE } from '../src/sprites.mjs';

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
