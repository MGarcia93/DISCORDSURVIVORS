import test from 'node:test';
import assert from 'node:assert/strict';

// A screen is a browser module: it wants #content, a canvas and the query the
// gate reads. The stand-in counts every rectangle the painter asks for, which is
// enough to prove the objects reach the canvas and that the sandbox did not
// quietly fall back to a placeholder.
const painted = [];
const ctx = new Proxy({}, {
  get: (_, key) => key === 'canvas' ? null : (...args) => { painted.push([key, ...args]); return 0; },
  set: () => true,
});
const canvas = { width: 1144, height: 748, getContext: () => ctx };
const realLocation = globalThis.location;
globalThis.location = { search: '?dev=items' };
globalThis.document = { querySelector: selector => (selector === '#item-stage' ? canvas : null) };
globalThis.window = { matchMedia: () => ({ matches: false }) };

const { state } = await import('../src/app/state.mjs');
const { itemsScreen, drawItemsPreview, isItemsDevelopment } = await import('../src/screens/items.mjs');
const { PICKUPS } = await import('../src/pickups.mjs');
const { ROSTER } = await import('../src/characters/index.mjs');

globalThis.location = realLocation;

const content = { innerHTML: '', querySelector: () => ({ textContent: '' }) };
state.content = content;

test('the sandbox lists the six objects it paints', () => {
  itemsScreen();
  assert.equal((content.innerHTML.match(/<li>/g) ?? []).length, 6);
  for (const character of ROSTER) assert.ok(content.innerHTML.includes(PICKUPS[character.id].label));
  assert.match(content.innerHTML, /0\.5%/, 'the first world states its real chance');
  assert.match(content.innerHTML, /4\.5%/, 'the last world states its real chance');
});

test('the preview paints every object on the ground layer', () => {
  painted.length = 0;
  drawItemsPreview(0);
  const rects = painted.filter(([key]) => key === 'fillRect');
  assert.ok(rects.length > 80, `the six drawings reach the canvas (${rects.length} rectangles)`);
  // Each object is painted at its own column, so no two can be stacked by accident.
  const columns = new Set(rects.map(([, x]) => Math.round(x / 180)));
  assert.ok(columns.size >= 6, 'the objects sit in six separate columns');
});

test('the dev gate only opens ?dev=items', () => {
  globalThis.location = { search: '?dev=items' };
  assert.equal(isItemsDevelopment(), true);
  globalThis.location = { search: '?dev=enemies' };
  assert.equal(isItemsDevelopment(), false);
  globalThis.location = realLocation;
});
