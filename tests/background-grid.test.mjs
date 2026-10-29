import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorld, worldIds } from '../src/backgrounds/index.mjs';
import { UNIT } from '../src/backgrounds/paint.mjs';

// The cast is drawn at scale 2, so one art pixel is two canvas pixels. A world
// that paints odd coordinates puts a coarser, misaligned raster behind sprites
// drawn on a clean even grid; it reads as a different game. Every rectangle a
// world paints itself must therefore land on the same unit.
//
// Rectangles emitted while a transform is applied come from a shared sprite
// (the room bakes the chair, for example) and keep the sprite layer's own grid.
function recordingContext() {
  const calls = [];
  let transformed = 0;
  const sprite = () => transformed > 0;
  const ctx = new Proxy({}, {
    get(_target, key) {
      if (key === 'canvas') return null;
      if (key === 'fillRect') return (...args) => { calls.push({ sprite: sprite(), args }); };
      if (key === 'translate' || key === 'scale') return () => { transformed++; };
      if (key === 'restore') return () => { transformed = Math.max(0, transformed - 1); };
      return () => 0;
    },
    set() { return true; },
  });
  return { ctx, calls };
}

// Only the baked scenery: `animate` draws the cast on top of it every frame.
function worldRects(id, width, height) {
  const { ctx, calls } = recordingContext();
  getWorld(id).draw(ctx, { width, height });
  return calls.filter(call => !call.sprite).map(call => call.args);
}

for (const [width, height] of [[1144, 748], [480, 270]]) {
  test(`every world paints on the cast ${UNIT}px grid at ${width}x${height}`, () => {
    for (const id of worldIds) {
      const rects = worldRects(id, width, height);
      assert.ok(rects.length > 0, `${id} paints something`);
      for (const [x, y, w, h] of rects) {
        // Whole canvas and every detail share one grid, so no seam or prop can
        // land half an art pixel away from its neighbour.
        // `=== 0` and not assert.equal: a clipped rectangle can carry -0, and
        // Object.is(-0, 0) is false.
        assert.ok(x % UNIT === 0, `${id} paints x=${x} off the ${UNIT}px grid`);
        assert.ok(y % UNIT === 0, `${id} paints y=${y} off the ${UNIT}px grid`);
        assert.ok(w > 0 && w % UNIT === 0, `${id} paints width ${w} off the ${UNIT}px grid`);
        assert.ok(h > 0 && h % UNIT === 0, `${id} paints height ${h} off the ${UNIT}px grid`);
      }
    }
  });
}
