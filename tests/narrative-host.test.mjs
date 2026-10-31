import test from 'node:test';
import assert from 'node:assert/strict';
import { NarrativeHost } from '../src/narrative/host.mjs';

const catalog = {
  characters: { guide: { name: 'Guide', sprite: 'negro', expressions: { neutral: 'sample.svg' } } }, sounds: {},
  entries: [{ id: 'test', actions: {}, scene: { id: 'test', steps: [{ type: 'dialogue', lines: [{ speaker: 'guide', text: 'Sample' }] }], effects: [{ key: 'sample', value: true }] } }],
  bindings: [{ when: 'before_wave', wave: 1, scene: 'test' }],
};
const root = () => ({ textContent: '', innerHTML: '', hidden: false });
const view = () => ({ render() {}, dispose() {} });
const audio = () => ({ play() {}, stop() {} });

test('wave-boundary observations preserve alarm voices while a shop scene owns playback', async () => {
  const sounds = { alarm: { frequency: 190, duration: 0.24, gain: 0.05 } };
  const scene = { id: 'alarm', steps: [
    { type: 'sound', sound: 'alarm', repeat: 9, interval: 0.4 },
    { type: 'dialogue', lines: [{ speaker: 'guide', text: 'Alarm!' }] },
  ] };
  let stops = 0, played = 0;
  const h = new NarrativeHost({
    load: async () => ({ ...catalog, sounds, entries: [{ id: 'alarm', scene, actions: {} }],
      bindings: [{ when: 'before_wave', wave: 4, scene: 'alarm' }] }),
    makeView: view,
    audio: { stop() { stops++; }, play() { played++; } },
  });
  const run = { phase: 'shop', wave: 3, time: 60 };
  await h.attach(run, root());
  h.nextWave(() => { run.phase = 'playing'; run.wave = 4; });
  const before = stops;
  for (let frame = 0; frame < 32; frame++) { h.tick(0.1); h.observe(); }
  assert.ok(played > 1, 'the alarm repeats during the transition');
  assert.equal(stops, before, 'observing the shop must not cut scene audio every frame');
  h.skip();
  assert.ok(stops > before, 'skip still releases the alarm');
  assert.equal(run.wave, 4);
  run.phase = 'shop';
  const idleStops = stops;
  h.observe();
  assert.ok(stops > idleStops, 'an idle shop still stops unowned audio');
});

test('host blocks while loading, ignores stale loads after exit and never restores old ownership', async () => {
  let resolve;
  const h = new NarrativeHost({ load: () => new Promise(r => { resolve = r; }), makeView: view, audio: audio() });
  const loading = h.attach({ phase: 'playing', time: 0, wave: 1 }, root());
  assert.equal(h.blocked, true);
  h.detach();
  resolve(catalog); await loading;
  assert.equal(h.blocked, false);
  assert.equal(h.director, null);
});

test('load failure and asset failure release blocking input and report the error', async () => {
  const h = new NarrativeHost({ load: async () => { throw Error('HTTP 404'); }, makeView: view, audio: audio() });
  await h.attach({ phase: 'playing', time: 0, wave: 1 }, root());
  assert.equal(h.blocked, false);
  assert.match(h.error, /404/);
  const h2 = new NarrativeHost({ load: async () => catalog, makeView: view, audio: audio() });
  await h2.attach({ phase: 'playing', time: 0, wave: 1 }, root());
  assert.equal(h2.blocked, true);
  h2.fail('Portrait not found');
  assert.equal(h2.blocked, false);
  assert.match(h2.error, /Portrait/);
});

test('preview restarts with isolated flags and cannot write progression storage', async () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = { setItem() { assert.fail('preview wrote progression'); }, getItem() { assert.fail('preview read progression'); } };
  try {
    const h = new NarrativeHost({ load: async () => catalog, makeView: view, audio: audio() });
    await h.attach(null, root(), { preview: true });
    h.preview('test');
    h.skip();
    assert.equal(h.director.flags.sample, true);
    h.preview('test');
    assert.equal(h.director.flags.sample, undefined);
    assert.equal(h.director.player.dialogue.text, 'Sample');
    h.advance();
    assert.equal(h.director.flags.sample, true);
    h.detach();
  } finally { globalThis.localStorage = original; }
});

test('keyboard controls consume scene input and stop being consumed on completion', async () => {
  const h = new NarrativeHost({ load: async () => catalog, makeView: view, audio: audio() });
  await h.attach({ phase: 'playing', time: 0, wave: 1 }, root());
  assert.equal(h.key('q'), true);
  assert.equal(h.director.player.active, true);
  assert.equal(h.key('enter'), true);
  assert.equal(h.blocked, false);
  assert.equal(h.key('q'), false);
});
