import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine.mjs';

// The run picture is a pure function of a run and a context, so the only thing
// the sandbox needs is a document for the module graph, never a real canvas.
const realDocument = globalThis.document;
const realWindow = globalThis.window;
globalThis.document = { querySelector: () => null };
globalThis.window = { matchMedia: () => ({ matches: false }) };
const { drawRunScene } = await import('../src/game/renderer.mjs');
globalThis.document = realDocument;
globalThis.window = realWindow;

function painted(run) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'canvas' ? null : (...args) => { calls.push([key, ...args]); return 0; },
    set: () => true,
  });
  drawRunScene(ctx, run);
  return calls.length;
}

test('every area effect a ficha hangs on the run is actually painted', () => {
  const run = createRun(() => 0.5, 'jhony');
  run.enemies.length = 0;
  run.effects.length = 0;
  run.projectiles.length = 0;
  const baseline = painted(run);
  for (const kind of ['tiltWave', 'tiltZone', 'shoutWave', 'stompWave', 'glassBlast']) {
    run.effects = [{ x: 400, y: 300, kind, r: 120, damage: 5, ttl: 0.4, duration: 0.4, tick: 0 }];
    assert.ok(painted(run) > baseline, `${kind} must reach the canvas, not only the hit`);
  }
});

test('a text effect and an area effect can share the frame', () => {
  const run = createRun(() => 0.5, 'jhony');
  run.enemies.length = 0;
  run.projectiles.length = 0;
  run.effects = [
    { x: 400, y: 300, kind: 'glass', text: '80', ttl: 0.6 },
    { x: 400, y: 300, kind: 'tiltWave', r: 120, ttl: 0.4, duration: 0.4 },
  ];
  assert.ok(painted(run) > 0);
});
