import test from 'node:test';
import assert from 'node:assert/strict';
import { ScenePlayer, validateScene } from '../src/narrative/runtime.mjs';

// The stage is exactly the canvas: any camera that lets the visible frame leave
// it paints the black base behind the world. These cases pin the clamp.
const stage = { points: { corner: [1100, 730], middle: [572, 374] } };
// A trailing wait keeps the scene alive so the final camera can be observed
// instead of the completion reset.
const play = steps => new ScenePlayer({ id: 'probe', stage, steps: [...steps, { type: 'wait', duration: 5 }] }, {});

test('a camera aimed at a corner stops where the stage ends', () => {
  const player = play([{ type: 'camera', to: 'corner', zoom: 1.5, duration: 1 }]);
  player.tick(1);
  assert.equal(player.camera.zoom, 1.5);
  assert.equal(player.camera.x, 1144 - 1144 / 3);
  assert.equal(player.camera.y, 748 - 748 / 3);
});

test('at zoom 1 the whole stage is visible, so the camera cannot pan', () => {
  const player = play([{ type: 'camera', to: 'corner', zoom: 1, duration: 1 }]);
  player.tick(1);
  assert.deepEqual(player.camera, { zoom: 1, x: 572, y: 374 });
});

test('the visible frame never escapes the stage, whatever the target', () => {
  for (const [x, y] of [[0, 0], [1144, 748], [1100, 40], [40, 700]]) {
    for (const zoom of [1, 1.2, 2, 4]) {
      const player = new ScenePlayer({ id: 'probe', stage: { points: { target: [x, y] } }, steps: [{ type: 'camera', to: 'target', zoom, duration: 1 }, { type: 'wait', duration: 5 }] }, {});
      player.tick(1);
      const halfWidth = 1144 / (2 * zoom), halfHeight = 748 / (2 * zoom);
      assert.ok(player.camera.x - halfWidth >= 0 && player.camera.x + halfWidth <= 1144, `${x},${y} @${zoom} x`);
      assert.ok(player.camera.y - halfHeight >= 0 && player.camera.y + halfHeight <= 748, `${x},${y} @${zoom} y`);
    }
  }
});

test('zooming out below the stage is refused', () => {
  const scene = { id: 'probe', stage, steps: [{ type: 'camera', to: 'corner', zoom: 0.5, duration: 1 }] };
  assert.throws(() => validateScene(scene, {}), /Invalid camera zoom/);
});
