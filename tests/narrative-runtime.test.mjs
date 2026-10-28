import test from 'node:test';
import assert from 'node:assert/strict';
import { ScenePlayer, validateScene } from '../src/narrative/runtime.mjs';

const characters = {
  guide: { name: 'Guide', sprite: 'negro', expressions: { neutral: 'guide.svg', surprised: 'surprised.svg' } },
  guest: { name: 'Guest', sprite: 'warrior', expressions: { neutral: 'guest.svg' } },
};
const scene = steps => ({
  id: 'example', repeat: 'once',
  stage: { points: { entrance: [100, 200], meeting: [500, 300] },
    actors: { visitor: { character: 'guest', at: 'entrance' } },
    props: { gate: { at: 'meeting', state: 'closed' } } },
  steps, effects: [{ key: 'arrived', value: true }],
});
const line = { speaker: 'guide', text: 'Sample dialogue.' };
const player = (steps, options = {}) => new ScenePlayer(scene(steps), { characters, ...options });

test('portrait dialogue resolves defaults and advances only on explicit input', () => {
  const p = player([{ type: 'dialogue', lines: [line, { ...line, expression: 'surprised', text: 'Second.' }] }]);
  assert.equal(p.dialogue.expression, 'neutral');
  p.tick(100);
  assert.equal(p.dialogue.text, line.text);
  p.advance();
  assert.equal(p.dialogue.expression, 'surprised');
  p.advance();
  assert.equal(p.status, 'completed');
  assert.equal(p.dialogue, null);
});

test('sprite movement and camera run together, followed by manual conversation', () => {
  const p = player([{ type: 'parallel', steps: [
    { type: 'move', actor: 'visitor', to: 'meeting', duration: 2 },
    { type: 'camera', to: 'meeting', zoom: 1.5, duration: 2 },
  ] }, { type: 'dialogue', lines: [line] }]);
  p.tick(1);
  assert.equal(p.actors.visitor.x, 300);
  assert.equal(p.camera.zoom, 1.25);
  assert.equal(p.dialogue, null);
  p.tick(1);
  assert.equal(p.actors.visitor.x, 500);
  assert.equal(p.actors.visitor.animation, 'idle');
  assert.equal(p.dialogue.text, line.text);
});

test('skip applies final stage state and required effects exactly once', () => {
  const effects = [];
  const p = player([
    { type: 'move', actor: 'visitor', to: 'meeting', duration: 2 },
    { type: 'prop', prop: 'gate', state: 'open' },
    { type: 'dialogue', lines: [line] },
  ], { onEffect: effect => effects.push(effect) });
  p.skip(); p.skip(); p.advance(); p.tick(10);
  assert.equal(p.status, 'skipped');
  assert.equal(p.actors.visitor.x, 500);
  assert.equal(p.props.gate.state, 'open');
  assert.equal(p.camera.zoom, 1);
  assert.deepEqual(effects, [{ key: 'arrived', value: true }]);
});

test('cancel and failure release presentation without granting completion effects', () => {
  const effects = [];
  for (const operation of ['cancel', 'fail']) {
    const p = player([{ type: 'dialogue', lines: [line] }], { onEffect: e => effects.push(e) });
    p[operation]('Example error');
    assert.equal(p.dialogue, null);
    assert.equal(p.splash, null);
    assert.equal(p.camera.zoom, 1);
    assert.equal(p.status, operation === 'cancel' ? 'cancelled' : 'failed');
  }
  assert.deepEqual(effects, []);
});

test('scene-local actions extend a scene without changing the interpreter', () => {
  let cancelled = 0;
  const actions = { tint: {
    validate(step) { if (typeof step.color !== 'string') throw Error('color required'); },
    start(step, p) {
      return { tick() { p.props.gate.state = step.color; return true; }, skip() { p.props.gate.state = step.color; }, cancel() { cancelled++; } };
    },
  } };
  const p = player([{ type: 'tint', color: 'blue' }], { actions });
  assert.equal(p.props.gate.state, 'blue');
  assert.equal(p.status, 'completed');
  assert.equal(cancelled, 0);
  assert.throws(() => player([{ type: 'tint' }], { actions }), /color required/);
});

test('invalid references and unsupported steps are rejected before effects run', () => {
  for (const [step, message] of [
    [{ type: 'dialogue', lines: [{ ...line, speaker: 'missing' }] }, /speaker/],
    [{ type: 'dialogue', lines: [{ ...line, expression: 'missing' }] }, /expression/],
    [{ type: 'move', actor: 'missing', to: 'meeting', duration: 1 }, /actor/],
    [{ type: 'move', actor: 'visitor', to: 'missing', duration: 1 }, /point/],
    [{ type: 'animate', actor: 'visitor', animation: 'missing', duration: 1 }, /animation/],
    [{ type: 'wait', duration: -1 }, /duration/],
    [{ type: 'sound', sound: 'missing' }, /sound/],
    [{ type: 'unknown' }, /action/],
  ]) assert.throws(() => validateScene(scene([step]), { characters }), message);
});

test('parallel actions reject competing writers and multiple dialogue owners', () => {
  assert.throws(() => player([{ type: 'parallel', steps: [
    { type: 'move', actor: 'visitor', to: 'meeting', duration: 1 },
    { type: 'move', actor: 'visitor', to: 'entrance', duration: 1 },
  ] }]), /conflict/);
  assert.throws(() => player([{ type: 'parallel', steps: [{ type: 'dialogue', lines: [line] }] }]), /parallel/);
});

test('scene data is not mutated and sound/splash/animation use the narrative clock', () => {
  const source = scene([
    { type: 'sound', sound: 'chime' },
    { type: 'animate', actor: 'visitor', animation: 'point', duration: 1 },
    { type: 'splash', speaker: 'guest', text: 'Sample arrival', duration: 1 },
  ]);
  const before = JSON.stringify(source), sounds = [];
  const p = new ScenePlayer(source, { characters, sounds: { chime: {} }, onSound: id => sounds.push(id) });
  assert.deepEqual(sounds, ['chime']);
  assert.equal(p.actors.visitor.animation, 'point');
  p.tick(1);
  assert.equal(p.splash.text, 'Sample arrival');
  p.tick(1);
  assert.equal(p.status, 'completed');
  assert.equal(JSON.stringify(source), before);
});
