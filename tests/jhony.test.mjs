import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import jhony, { drawJhony } from '../src/npcs/jhony.mjs';
import { CHARACTERS, ROSTER } from '../src/characters/index.mjs';
import { drawCast, STAGE_CAST } from '../src/screens/world-cast.mjs';

function record(draw) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform'
      ? () => ({ a: 1, d: 1 })
      : (...args) => { calls.push([key, ...args]); },
    set: (_, key, value) => { calls.push(['set', key, value]); return true; },
  });
  draw(ctx);
  return calls;
}

// The sprite is pinned by the pixels it paints, not by the order of its calls:
// an order-only refactor across disjoint rectangles must not read as a redraw.
function rasterize(draw) {
  const pixels = new Map();
  const state = { a: 1, d: 1, e: 0, f: 0, fill: '#000000' };
  const stack = [];
  const ctx = {
    imageSmoothingEnabled: false,
    getTransform: () => ({ a: 1, d: 1 }),
    save() { stack.push({ ...state }); },
    restore() { Object.assign(state, stack.pop() ?? state); },
    translate(x, y) { state.e += state.a * x; state.f += state.d * y; },
    scale(x, y) { state.a *= x; state.d *= y; },
    fillRect(x, y, w, h) {
      const x0 = Math.round(state.a * x + state.e), y0 = Math.round(state.d * y + state.f);
      const x1 = Math.round(state.a * (x + w) + state.e), y1 = Math.round(state.d * (y + h) + state.f);
      for (let py = Math.min(y0, y1); py < Math.max(y0, y1); py++) {
        for (let px = Math.min(x0, x1); px < Math.max(x0, x1); px++) pixels.set(`${px},${py}`, state.fill);
      }
    },
  };
  const proxy = new Proxy(ctx, {
    get: (target, key) => key === 'fillStyle' ? state.fill : target[key],
    set: (target, key, value) => { if (key === 'fillStyle') state.fill = value; else target[key] = value; return true; },
  });
  draw(proxy);
  const sorted = [...pixels.entries()].sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }));
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}

test('Jhony preserves the approved black-leather sprite in both directions and walk frames', () => {
  // Pixel fingerprints captured from approved draft 03 before production
  // integration; the shared-with-the-ficha refactor kept every one of them.
  const cases = [
    [{}, '1ea9c40105c3d5fc7a74512d5e668b1a66372e899e4809e32febbfef630ac5ae'],
    [{ facing: -1 }, '0c9e9ab1ff9245257cc1974ff15e827f6498ad65575ee64efa6284f6c5d4947b'],
    [{ moving: true, time: 0 }, '1ea9c40105c3d5fc7a74512d5e668b1a66372e899e4809e32febbfef630ac5ae'],
    [{ moving: true, time: 0.125 }, '52abf6c4dc8defcf9338a2cc80098b0d7dda3b90a974433e36644df12f3a5112'],
  ];
  for (const [options, expected] of cases) {
    assert.equal(rasterize(ctx => drawJhony(ctx, 100, 150, options)), expected, JSON.stringify(options));
    const calls = record(ctx => drawJhony(ctx, 100, 150, options));
    for (const [kind, ...args] of calls.filter(([kind]) => kind === 'fillRect')) {
      assert.equal(kind, 'fillRect');
      assert.ok(args.every(Number.isInteger), 'all sprite rectangles use integer pixels');
    }
  }
});

test('the playable Jhony carries a beer bottle that swings forward on attack', () => {
  const idle = rasterize(ctx => drawJhony(ctx, 100, 150, {}));
  const bottled = rasterize(ctx => drawJhony(ctx, 100, 150, { bottle: true }));
  const swinging = rasterize(ctx => drawJhony(ctx, 100, 150, { bottle: true, attacking: true }));
  assert.notEqual(bottled, idle, 'the bottle is drawn in his hand');
  assert.notEqual(swinging, bottled, 'the attack pose is its own drawing');

  // The bottle lives in the same hand in both poses: hanging forward when idle,
  // thrust further forward when the botellazo lands.
  const bounds = draw => {
    const xs = [];
    const recording = new Proxy({}, {
      get: (_, key) => key === 'fillRect'
        ? (x, y, w) => xs.push(x, x + w)
        : key === 'getTransform' ? () => ({ a: 1, d: 1 }) : () => {},
      set: () => true,
    });
    draw(recording);
    return [Math.min(...xs), Math.max(...xs)];
  };
  assert.ok(bounds(ctx => drawJhony(ctx, 0, 0, { bottle: true }))[1] > 20, 'the bottle hangs forward');
  assert.ok(bounds(ctx => drawJhony(ctx, 0, 0, { bottle: true, attacking: true }))[1] > 30, 'the swing reaches further');
});

test('Tilt shows on the face: knitted brows, red cheeks and anger ticks', () => {
  const calm = record(ctx => drawJhony(ctx, 100, 150, {}));
  const angry = record(ctx => drawJhony(ctx, 100, 150, { tilt: 0.6 }));
  const furious = record(ctx => drawJhony(ctx, 100, 150, { tilt: 1 }));
  assert.deepEqual(calm, record(ctx => drawJhony(ctx, 100, 150, { tilt: 0 })), 'a calm Jhony draws the approved face');
  assert.ok(angry.length > calm.length, 'the tilt face adds features');
  assert.ok(furious.length > angry.length, 'the last tick only shows at full tilt');
  assert.ok(record(ctx => drawJhony(ctx, 100, 150, { tilt: 0.6 }))
    .some(([kind, key, color]) => kind === 'set' && key === 'fillStyle' && color === '#b4543c'), 'red cheeks');
});

test('Jhony is a playable ficha unlocked by his Act 1 encounter', () => {
  assert.deepEqual(ROSTER.map(character => character.id), ['negro', 'solago', 'warrior', 'papazito', 'jhony', 'papafrita']);
  assert.equal(CHARACTERS.jhony.id, 'jhony');
  assert.equal(CHARACTERS.jhony.unlock.flag, 'jhonyUnlocked');
  assert.equal(CHARACTERS.jhony.unlock.scene, 'act-01-jhony', 'meeting him in Act 1 is the unlock');
  // The stage cast is the roster now: Jhony is not listed twice.
  assert.deepEqual(STAGE_CAST.map(character => character.id), ROSTER.map(character => character.id));
  assert.equal(jhony.id, 'jhony');
  assert.equal(jhony.label, 'Jhony');
  assert.equal(jhony.stats, undefined, 'the narrative NPC keeps no combat sheet');
  assert.equal(jhony.unlock, undefined);
});

test('the world viewer draws the controlled Jhony with the approved movement and facing', () => {
  const pos = { x: 0.70, y: 0.80 };
  const options = { actor: 'jhony', pos, moving: true, facing: -1 };
  const ficha = ROSTER.find(character => character.id === 'jhony');
  const cast = record(ctx => drawCast(ctx, 1144, 748, 0.125, options));
  const expected = record(ctx => ficha.draw(ctx, 1144 * pos.x, 748 * pos.y, {
    time: 0.125, moving: true, facing: -1, player: {},
  }));
  // Jhony is no longer the last ficha, so the drawn block is found by shape.
  const drawn = JSON.stringify(expected);
  assert.ok(cast.some((_, index) => JSON.stringify(cast.slice(index, index + expected.length)) === drawn),
    'the viewer draws the controlled Jhony exactly as his ficha does');
  assert.ok(expected.some(call => call[0] === 'scale' && call[1] === -2 && call[2] === 2));
  assert.ok(expected.some(call => call[0] === 'translate' && call[1] === 801 && call[2] === 598));
});

test('adding the NPC leaves every existing world-viewer actor drawing unchanged', () => {
  for (const actor of ROSTER.map(character => character.id)) {
    const pos = { x: 0.42, y: 0.63 };
    const options = { actor, pos, moving: true, facing: -1 };
    const expected = record(ctx => ROSTER.forEach((character, index) => {
      const controlled = character.id === actor;
      character.draw(ctx, 1144 * (controlled ? pos.x : 0.30 + index * 0.14),
        748 * (controlled ? pos.y : 0.68), {
          time: 1.1, moving: controlled, facing: controlled ? -1 : 1, player: {},
        });
    }));
    const actual = record(ctx => drawCast(ctx, 1144, 748, 1.1, options));
    assert.deepEqual(actual.slice(0, expected.length), expected, actor);
  }
});

// The pixel hash above pins the picture; this pins the drawing budget, so an
// extra rectangle hidden behind existing ones still fails.
function rects(options) {
  const out = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 })
      : (...args) => { if (key === 'fillRect') out.push(JSON.stringify(args)); },
    set: () => true,
  });
  drawJhony(ctx, 100, 150, options);
  return out;
}

test('the approved NPC rectangle set is never lost, and the bottle adds exactly thirteen', () => {
  const pin = options => createHash('sha256').update(JSON.stringify([...rects(options)].sort())).digest('hex');
  assert.equal(pin({}), 'ab24dcf79d7aff43652536fa9d086913ad34e7bccdd0bcd88b89bd3696e6f22e');
  assert.equal(pin({ moving: true, time: 0.125 }), 'bc93f66a6eb8d686bdf7e8f622c0dae8f6f77bbdd1cfb4f9b085f98c970079c7');
  assert.equal(rects({ bottle: true }).length - rects({}).length, 13, 'the bottle is the only added art');
});
