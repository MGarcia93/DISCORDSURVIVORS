import arena from './arena.mjs';
import room from './room.mjs';
import zomboid from './zomboid.mjs';
import rift from './rift.mjs';
import inferno from './inferno.mjs';
import exiles from './exiles.mjs';
import laboratory from './laboratory.mjs';
import discord from './discord.mjs';

// World backgrounds live as one module per world. A scene picks one by id
// (`stage.background`), the story pages name theirs in story-pages.mjs, and
// the combat renderer uses the same seam.
//
// Each world is painted ONCE into an offscreen canvas and then blitted, so the
// per-frame cost of any world is a single drawImage no matter how many tiles
// it paints. Only what a world declares in `animate` runs every frame.
const WORLDS = Object.freeze({ arena, room, zomboid, rift, inferno, exiles, laboratory, discord });

export const worldIds = Object.freeze(Object.keys(WORLDS));
export const defaultWorld = 'arena';
// What a dev screen or a select needs: id and human title, no drawing code.
export const worlds = Object.freeze(worldIds.map(id => Object.freeze({ id, title: WORLDS[id].title })));

const bakeCache = new Map();

const defaultCanvasFactory = (width, height) => {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  if (typeof document?.createElement !== 'function') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

// A world that cannot bake (no canvas at all, as in Node) is painted straight
// into the caller's context instead of disappearing. Failures are not cached:
// only a real bake is worth remembering.
export function bakeWorld(world, width, height, factory = defaultCanvasFactory) {
  const key = `${world.id}:${width}x${height}`;
  if (bakeCache.has(key)) return bakeCache.get(key);
  let baked = null;
  try {
    const canvas = factory(width, height);
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      world.draw(ctx, { width, height });
      baked = canvas;
    }
  } catch {
    baked = null;
  }
  if (baked) bakeCache.set(key, baked);
  return baked;
}

export function clearBackgroundCache() {
  bakeCache.clear();
}

// The module for an id. Public so a check can inspect one world's painting
// without going through the per-frame path.
export function getWorld(id) {
  return WORLDS[id] ?? WORLDS[defaultWorld];
}

// Paints the named world and returns the id actually used, so a typo cannot
// leave an empty stage. Validation rejects unknown ids before playback; this
// fallback only protects a mistyped literal added after a catalog was loaded.
export function drawBackground(ctx, id, { width, height, time = 0, factory = defaultCanvasFactory } = {}) {
  const world = getWorld(id);
  const baked = bakeWorld(world, width, height, factory);
  if (baked) ctx.drawImage(baked, 0, 0);
  else world.draw(ctx, { width, height });
  world.animate?.(ctx, { width, height, time });
  return world.id;
}
