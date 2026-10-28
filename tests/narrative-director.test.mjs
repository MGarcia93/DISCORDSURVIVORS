import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveDirector, BanterQueue } from '../src/narrative/director.mjs';
import { createRun, startNextWave, step } from '../src/engine.mjs';

const characters = { guide: { name: 'Guide', expressions: { neutral: 'sample.svg' } } };
const entry = (id, repeat = 'always') => ({ id, scene: { id, repeat, steps: [{ type: 'dialogue', lines: [{ speaker: 'guide', text: id }] }], effects: [{ key: id, value: true }] }, actions: {} });
const catalog = { characters, sounds: {}, entries: [entry('before'), entry('after'), entry('once', 'once')], bindings: [
  { when: 'after_wave', wave: 1, scene: 'after' },
  { when: 'before_wave', wave: 2, scene: 'before' },
] };

test('pending level choices block the before-wave scene as well as combat restart', () => {
  const run = createRun(() => 0.5), director = new WaveDirector(catalog);
  director.attach(run);
  run.phase = 'shop';
  director.observe();
  director.advance();
  run.pendingLevels = [2];
  const before = JSON.stringify(run);
  assert.equal(director.nextWave(() => startNextWave(run)), false);
  assert.equal(director.blocked, false);
  assert.equal(JSON.stringify(run), before);
  assert.equal(director.flags.before, undefined);
});

test('wave boundary order is after-scene, shop, before-scene, next wave', () => {
  const run = createRun(() => 0.5), d = new WaveDirector(catalog);
  d.attach(run);
  run.phase = 'shop';
  d.observe();
  assert.equal(d.player.dialogue.text, 'after');
  assert.equal(run.phase, 'shop');
  assert.equal(d.blocked, true);
  d.advance();
  assert.equal(d.blocked, false);
  assert.deepEqual({ ...d.flags }, { after: true });
  let starts = 0;
  d.nextWave(() => { starts++; startNextWave(run); });
  assert.equal(d.player.dialogue.text, 'before');
  assert.equal(starts, 0);
  d.skip(); d.skip();
  assert.equal(starts, 1);
  assert.equal(run.wave, 2);
  assert.equal(run.phase, 'playing');
  d.observe();
  assert.equal(d.blocked, false);
});

test('the initial pre-scene freezes wave time and blocking scenes cannot start mid-wave', () => {
  const d = new WaveDirector({ ...catalog, bindings: [{ when: 'before_wave', wave: 1, scene: 'before' }] });
  const run = createRun(() => 0.5);
  d.attach(run);
  const before = JSON.stringify(run);
  for (let i = 0; i < 10; i++) { if (!d.blocked) step(run, 0.1, { x: 1, y: 0 }); d.tick(0.1); }
  assert.equal(JSON.stringify(run), before);
  d.advance();
  run.time = 2;
  assert.equal(d.play('before'), false);
  assert.equal(d.blocked, false);
});

test('empty bindings preserve combat/shop behavior and old run exit cancels pending transitions', () => {
  const run = createRun(() => 0.5), d = new WaveDirector({ ...catalog, bindings: [] });
  d.attach(run);
  assert.equal(d.blocked, false);
  run.phase = 'shop';
  d.nextWave(() => startNextWave(run));
  assert.equal(run.wave, 2);
  const withScenes = new WaveDirector(catalog);
  run.wave = 1; run.phase = 'shop';
  withScenes.attach(run);
  let starts = 0;
  withScenes.nextWave(() => starts++);
  withScenes.detach(); withScenes.skip(); withScenes.tick(10);
  assert.equal(starts, 0);
  assert.equal(withScenes.blocked, false);
});

test('repeat-once tracks completed/skipped scenes, not cancelled scenes or other runs', () => {
  const d = new WaveDirector(catalog), run = createRun(() => 0.5);
  run.phase = 'shop'; d.attach(run);
  assert.equal(d.play('once'), true);
  d.skip();
  assert.equal(d.play('once'), false);
  d.detach(); d.attach(run);
  assert.equal(d.play('once'), true, 'fresh attachment represents a new live narrative session');
});

test('invalid scenes report errors and do not strand wave transitions', () => {
  const bad = { ...catalog, entries: [{ id: 'before', error: 'Unknown expression' }], bindings: [{ when: 'before_wave', wave: 2, scene: 'before' }] };
  const run = createRun(() => 0.5); run.phase = 'shop';
  const d = new WaveDirector(bad); d.attach(run);
  d.nextWave(() => startNextWave(run));
  assert.equal(d.blocked, false);
  assert.equal(run.wave, 2);
  assert.match(d.error, /expression/);
});

test('banter is single-line, automatic, prioritized and expires without touching combat', () => {
  const queue = new BanterQueue(characters);
  queue.enqueue({ speaker: 'guide', text: 'First', duration: 1 });
  queue.enqueue({ speaker: 'guide', text: 'Stale', priority: 0, ttl: 0.5 });
  queue.enqueue({ speaker: 'guide', text: 'Story', priority: 10 });
  assert.equal(queue.current.text, 'First');
  queue.tick(1);
  assert.equal(queue.current.text, 'Story');
  queue.tick(100);
  assert.equal(queue.current, null);
  assert.throws(() => queue.enqueue({ speaker: 'missing', text: 'No' }), /speaker/);
});

test('wave end clears current/queued banter and refuses new combat comments', () => {
  const run = createRun(() => 0.5), d = new WaveDirector(catalog); d.attach(run);
  assert.equal(d.enqueueBanter({ speaker: 'guide', text: 'First' }), true);
  const before = JSON.stringify(run);
  d.tick(0.5);
  assert.equal(JSON.stringify(run), before);
  run.phase = 'shop'; d.observe();
  assert.equal(d.banter.current, null);
  assert.equal(d.enqueueBanter({ speaker: 'guide', text: 'Late' }), false);
});

test('banter sounds play when their line becomes visible, not when it is queued', () => {
  const played = [];
  const d = new WaveDirector({ ...catalog, sounds: { chime: {} } }, { onSound: id => played.push(id) });
  d.attach(createRun(() => 0.5));
  d.enqueueBanter({ speaker: 'guide', text: 'First', duration: 1 });
  d.enqueueBanter({ speaker: 'guide', text: 'Second', sound: 'chime' });
  assert.deepEqual(played, []);
  d.tick(1);
  assert.deepEqual(played, ['chime']);
  assert.throws(() => d.enqueueBanter({ speaker: 'guide', text: 'Bad', sound: 'missing' }), /sound/);
});
