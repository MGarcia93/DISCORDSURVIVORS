import { test } from 'node:test';
import assert from 'node:assert/strict';
import { on, off, emit } from '../src/bus.mjs';
import { createRun, step, startNextWave, activateSpecial } from '../src/engine.mjs';
import { handleWaveClearedEvent } from '../src/progression.mjs';

function fakeStorage() {
  const store = new Map();
  return {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => { store.set(key, String(value)); },
  };
}

test('bus dispatches to subscribers in order and off removes a subscription', () => {
  const calls = [];
  const remove = on('test:evt', payload => calls.push(`first:${payload.x}`));
  on('test:evt', payload => calls.push(`second:${payload.x}`));
  emit('test:evt', { x: 1 });
  assert.deepEqual(calls, ['first:1', 'second:1']);
  remove();
  emit('test:evt', { x: 2 });
  assert.deepEqual(calls, ['first:1', 'second:1', 'second:2']);
});

test('engine emits kill, waveCleared, playerDown and specialActivated as post-state events', () => {
  const events = [];
  const offKill = on('kill', event => events.push({ type: 'kill', hp: event.enemy.hp, run: event.run }));
  const offCleared = on('waveCleared', event => events.push({ type: 'waveCleared', run: event.run }));
  const offSpecial = on('specialActivated', event => events.push({ type: 'specialActivated', key: event.special }));
  const offDown = on('playerDown', event => events.push({ type: 'playerDown', run: event.run }));

  const run = createRun(() => 0.5);
  assert.equal(activateSpecial(run, 'chair'), true);
  run.enemies.push({ id: 1, kind: 'alarmZombie', boss: true, hp: 1, maxHp: 1, x: run.player.x, y: run.player.y,
    radius: 10 * 1.1, speed: 0 });
  for (let i = 0; i < 40 && run.phase === 'playing'; i++) step(run, 0.05, {});
  assert.equal(run.phase, 'won');
  assert.equal(run.kills, 1);

  const deadRun = createRun(() => 0.5);
  deadRun.player.hp = 1;
  deadRun.enemies.push({ id: 1, kind: 'zombie', hp: 999, maxHp: 999, x: deadRun.player.x + 30,
    y: deadRun.player.y, radius: 20, speed: 0 });
  step(deadRun, 0.05, {});
  assert.equal(deadRun.phase, 'dead');

  offKill(); offCleared(); offSpecial(); offDown();

  assert.equal(events.some(e => e.type === 'specialActivated' && e.key === 'chair'), true);
  const kill = events.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event emitted');
  assert.ok(kill.hp <= 0, 'kill event must be post-state: enemy already down');
  const cleared = events.find(e => e.type === 'waveCleared');
  assert.ok(cleared, 'waveCleared event emitted');
  assert.equal(cleared.run.phase, 'won', 'waveCleared must be post-state');
  const down = events.find(e => e.type === 'playerDown');
  assert.ok(down, 'playerDown event emitted');
  assert.equal(down.run.phase, 'dead', 'playerDown must be post-state');
});

test('progression records the unlock chain from waveCleared events', () => {
  const storage = fakeStorage();
  handleWaveClearedEvent({ run: { character: 'negro', phase: 'won' } }, storage);
  assert.equal(JSON.parse(storage.getItem('discord-survivors.progress.v1')).solagoUnlocked, true);

  const storage2 = fakeStorage();
  handleWaveClearedEvent({ run: { character: 'solago', phase: 'won' } }, storage2);
  assert.equal(JSON.parse(storage2.getItem('discord-survivors.progress.v1')).warriorUnlocked, true);

  const storage3 = fakeStorage();
  handleWaveClearedEvent({ run: { character: 'negro', phase: 'shop' } }, storage3);
  assert.equal(storage3.getItem('discord-survivors.progress.v1'), null, 'mid-wave shop events write nothing');
});
