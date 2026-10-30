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

const largeScene = () => ({
  id: 'large-stage',
  stage: {
    size: [2288, 1496],
    points: { start: [572, 374], destination: [1800, 1100] },
    actors: { walker: { character: 'guide', at: 'start' } },
    props: { gate: { at: 'destination', state: 'closed' } },
  },
  steps: [
    { type: 'parallel', steps: [
      { type: 'move', actor: 'walker', to: 'destination', duration: 2 },
      { type: 'camera', to: 'destination', duration: 2 },
    ] },
    { type: 'wait', duration: 5 },
  ],
});
const largeOptions = { characters: { guide: { expressions: { neutral: 'portrait.png' } } } };

test('a large stage pans at zoom 1 while an actor walks beyond the viewport', () => {
  const scene = largeScene(), original = structuredClone(scene);
  const player = new ScenePlayer(scene, largeOptions);
  assert.deepEqual(player.stageSize, { width: 2288, height: 1496 });
  player.tick(1);
  assert.deepEqual(player.camera, { x: 1186, y: 737, zoom: 1 });
  assert.equal(player.actors.walker.x, 1186);
  player.tick(1);
  assert.deepEqual(player.camera, { x: 1716, y: 1100, zoom: 1 });
  assert.equal(player.actors.walker.x, 1800);
  assert.deepEqual(player.props.gate, { at: 'destination', state: 'closed' });
  assert.deepEqual(scene, original);
});

test('large stage cameras stay inside every edge throughout pan and zoom', () => {
  for (const target of [[-500, -500], [3000, 2000]]) {
    const scene = largeScene();
    scene.stage.points.destination = target;
    scene.steps[0].steps[1].zoom = 2;
    const player = new ScenePlayer(scene, largeOptions);
    for (let i = 0; i < 8; i++) {
      player.tick(0.25);
      const { x, y, zoom } = player.camera;
      assert.ok(x - 572 / zoom >= 0 && x + 572 / zoom <= 2288);
      assert.ok(y - 374 / zoom >= 0 && y + 374 / zoom <= 1496);
    }
  }
});

test('finishing, skipping and cancelling a large scene restore the original camera', () => {
  for (const finish of [p => { p.tick(2); p.tick(5); }, p => p.skip(), p => p.cancel(), p => p.fail('probe')]) {
    const player = new ScenePlayer(largeScene(), largeOptions);
    player.tick(1);
    finish(player);
    assert.equal(player.active, false);
    assert.deepEqual(player.camera, { x: 572, y: 374, zoom: 1 });
  }
});

test('stage dimensions reject malformed, undersized and excessive canvases', () => {
  for (const size of [null, {}, [2288], [2288, 1496, 1], [1143, 748], [1144, 747], [Infinity, 748], [NaN, 748], ['2288', 1496], [2288.5, 1496], [8193, 748], [1144, 8193]]) {
    const scene = largeScene();
    scene.stage.size = size;
    assert.throws(() => validateScene(scene, largeOptions), /Invalid stage size/);
  }
});

test('omitting the stage size preserves the legacy viewport and camera', () => {
  const player = play([{ type: 'camera', to: 'corner', duration: 1 }]);
  assert.deepEqual(player.stageSize, { width: 1144, height: 748 });
  player.tick(1);
  assert.deepEqual(player.camera, { x: 572, y: 374, zoom: 1 });
});
