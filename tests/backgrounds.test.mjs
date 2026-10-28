import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { drawBackground, worldIds, worlds, clearBackgroundCache } from '../src/backgrounds/index.mjs';
import { validateScene } from '../src/narrative/runtime.mjs';
import { loadCatalog } from '../src/narrative/catalog.mjs';
import { storyPages } from '../src/screens/story-pages.mjs';
import { drawCast } from '../src/screens/world-cast.mjs';
import { ROSTER } from '../src/characters/index.mjs';

// A recording 2d context: enough of the canvas surface to prove what a
// background paints, with no browser and no real pixels.
function recordingContext() {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, key) {
      if (key === 'canvas') return null;
      return (...args) => { calls.push([key, ...args]); return 0; };
    },
    set(_target, key, value) { calls.push(['set', key, value]); return true; },
  });
  return { ctx, calls };
}

// The bake cache is the whole point of the module: a world is painted once
// into an offscreen canvas and then blitted, so this factory counts paintings
// and keeps what each baked canvas received.
function canvasFactory() {
  const bakes = [];
  const factory = (width, height) => {
    const { ctx, calls } = recordingContext();
    bakes.push(calls);
    return { width, height, getContext: () => ctx };
  };
  return { factory, bakes, painted: () => bakes.length };
}

const kinds = calls => calls.map(([kind]) => kind);

test('every registered world exposes an id, a title and a draw function', () => {
  assert.ok(worldIds.length >= 2, 'the registry ships the room and the arena');
  assert.equal(new Set(worldIds).size, worldIds.length, 'world ids are unique');
  for (const id of worldIds) {
    const { ctx } = recordingContext();
    clearBackgroundCache();
    // A world that cannot paint on its own is a registry entry that lies.
    assert.equal(drawBackground(ctx, id, { width: 320, height: 180, factory: () => null }), id);
  }
});

test('drawBackground paints a world once and blits the baked copy afterwards', () => {
  clearBackgroundCache();
  const { factory, bakes, painted } = canvasFactory();
  const first = recordingContext(), second = recordingContext();
  drawBackground(first.ctx, 'arena', { width: 1144, height: 748, factory });
  drawBackground(second.ctx, 'arena', { width: 1144, height: 748, factory });
  assert.equal(painted(), 1, 'the world is painted exactly once per id and size');
  assert.ok(bakes[0].length > 100, 'the baking pass paints the whole world');
  assert.ok(kinds(bakes[0]).includes('fillRect'), 'the baking pass paints rectangles');
  assert.deepEqual(kinds(first.calls), ['drawImage'], 'the live context only receives the bake');
  assert.deepEqual(kinds(second.calls), ['drawImage'], 'a baked world costs a single blit per frame');
});

test('sizes do not share a bake and unknown ids fall back to the default world', () => {
  clearBackgroundCache();
  const { factory, painted } = canvasFactory();
  assert.equal(drawBackground(recordingContext().ctx, 'arena', { width: 320, height: 180, factory }), 'arena');
  assert.equal(drawBackground(recordingContext().ctx, 'arena', { width: 640, height: 360, factory }), 'arena');
  assert.equal(painted(), 2, 'a different canvas size needs its own bake');
  assert.equal(drawBackground(recordingContext().ctx, 'nope', { width: 320, height: 180, factory }), 'arena');
  assert.equal(painted(), 2, 'an unknown id reuses the default world bake');
});

test('without a canvas the world paints straight into the live context', () => {
  clearBackgroundCache();
  const { ctx, calls } = recordingContext();
  assert.equal(drawBackground(ctx, 'arena', { width: 320, height: 180, factory: () => null }), 'arena');
  assert.ok(calls.length > 10, 'the fallback still paints the whole world');
  assert.ok(kinds(calls).includes('fillRect'));
});

test('the room keeps its sitting character and dust motes animated over the bake', () => {
  clearBackgroundCache();
  const { factory, bakes } = canvasFactory();
  const { ctx, calls } = recordingContext();
  drawBackground(ctx, 'room', { width: 480, height: 270, time: 1.5, factory });
  assert.deepEqual(kinds(calls)[0], 'drawImage', 'the scenery is baked first');
  assert.ok(bakes[0].length > 100, 'the scenery really was painted into the bake');
  assert.ok(calls.length > 1, 'the animated layer still paints after the bake');
  const idle = recordingContext();
  drawBackground(idle.ctx, 'room', { width: 480, height: 270, time: 1.5 });
  assert.deepEqual(kinds(idle.calls), kinds(calls), 'the same time paints the same frames');
});

test('scene validation rejects an unknown world and a misspelled stage field', () => {
  const backgrounds = Object.fromEntries(worldIds.map(id => [id, true]));
  const base = stage => ({ id: 'scene', stage, steps: [] });
  assert.doesNotThrow(() => validateScene(base({ background: 'arena' }), { backgrounds }));
  assert.throws(() => validateScene(base({ background: 'lol' }), { backgrounds }), /Unknown background: lol/);
  assert.throws(() => validateScene(base({ backgroundd: 'arena' }), { backgrounds }), /Unknown stage field: backgroundd/);
  assert.throws(() => validateScene({ id: 'scene', stage: 'arena', steps: [] }), /Stage must be an object/);
});

test('the shipped catalog offers the registered worlds to its scenes', async () => {
  const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
  const catalog = await loadCatalog({ fetcher });
  for (const id of worldIds) assert.ok(catalog.backgrounds?.[id], `catalog exposes the ${id} world`);
});

test('every story page names a registered world', () => {
  assert.ok(storyPages.length > 0);
  for (const page of storyPages) {
    assert.ok(worldIds.includes(page.background), `${page.label} points at a real world`);
  }
});

test('the five act worlds are registered with their own titles', () => {
  for (const id of ['zomboid', 'rift', 'inferno', 'exiles', 'discord']) {
    assert.ok(worldIds.includes(id), `${id} is registered`);
  }
  assert.equal(worlds.length, worldIds.length, 'the metadata list covers the registry');
  assert.deepEqual(worlds.map(world => world.id), [...worldIds], 'metadata follows registry order');
  const titles = worlds.map(world => world.title);
  assert.equal(new Set(titles).size, titles.length, 'titles are distinct');
  for (const world of worlds) assert.ok(world.title.includes(world.id === 'arena' ? 'Zomboid' : world.title.split(' — ').pop()), world.id);
});

test('every world covers its whole canvas, so a bake never shows the stage through', () => {
  for (const [width, height] of [[1144, 748], [480, 270]]) {
    for (const id of worldIds) {
      const { ctx, calls } = recordingContext();
      clearBackgroundCache();
      drawBackground(ctx, id, { width, height, time: 1.3, factory: () => null });
      const cover = calls.some(([kind, x, y, w, h]) => kind === 'fillRect' && x <= 0 && y <= 0 && w >= width && h >= height);
      assert.ok(cover, `${id} paints a full-canvas base at ${width}x${height}`);
    }
  }
});

test('the dev viewer cast draws every playable ficha on the world', () => {
  assert.equal(ROSTER.length, 4, 'the roster still has four fichas');
  const { ctx, calls } = recordingContext();
  assert.doesNotThrow(() => drawCast(ctx, 1144, 748, 1.7));
  const rects = calls.filter(([kind]) => kind === 'fillRect');
  assert.ok(rects.length > 200, `the cast paints its sprites (${rects.length} rects)`);
  // Each ficha is positioned by the shared pose helper before it paints.
  const moved = calls.filter(([kind]) => kind === 'translate');
  assert.ok(moved.length >= ROSTER.length, `every ficha is positioned (${moved.length} translates)`);
});

test('the controlled ficha walks to the position the viewer gives it', () => {
  const positions = pos => {
    const { ctx, calls } = recordingContext();
    drawCast(ctx, 1144, 748, 1.1, { actor: 'solago', pos, moving: true, facing: -1 });
    return calls.filter(([kind]) => kind === 'translate').map(([, x, y]) => [x, y]);
  };
  const start = positions({ x: 0.20, y: 0.55 });
  const moved = positions({ x: 0.70, y: 0.80 });
  assert.ok(start.some(([x]) => x === Math.round(1144 * 0.20)), 'draws the actor at the given x');
  assert.ok(moved.some(([x]) => x === Math.round(1144 * 0.70)), 'draws the actor at the moved x');
  assert.ok(moved.some(([, y]) => y === Math.round(748 * 0.80)), 'draws the actor at the moved y');
});

test('the shipped Act 4 preview is staged in the Conan world', async () => {
  const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
  const catalog = await loadCatalog({ fetcher });
  const entry = catalog.entries.find(item => item.id === 'act-04-warrior-rescue-preview');
  assert.equal(entry.error, null, entry.error ?? '');
  assert.equal(entry.scene.stage.background, 'exiles');
});
