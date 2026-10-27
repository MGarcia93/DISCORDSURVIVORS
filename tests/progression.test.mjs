import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESS_STORAGE_KEY, isCharacterUnlocked, isSolagoUnlocked, unlockSolago, unlockAllForTesting, recordMapVictory } from '../src/progression.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('Solago starts locked when there is no saved map-one victory', () => {
  assert.equal(isSolagoUnlocked(memoryStorage()), false);
});

test('beating the first map can persist Solago unlocked in local storage', () => {
  const storage = memoryStorage();
  assert.equal(unlockSolago(storage), true);
  assert.equal(isSolagoUnlocked(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)), { version: 1, solagoUnlocked: true });
});

test('Warrior also starts locked and is the reward for winning the map chain as Solago', () => {
  const storage = memoryStorage();
  assert.equal(isCharacterUnlocked('warrior', storage), false);
  assert.equal(recordMapVictory('solago', storage), true);
  assert.equal(isCharacterUnlocked('warrior', storage), true);
  assert.equal(isSolagoUnlocked(storage), false, 'a solago win grants Warrior, not Solago');
});

test('only El Negro winning the first map unlocks Solago', () => {
  const storage = memoryStorage();
  assert.equal(isSolagoUnlocked(storage), false);
  assert.equal(recordMapVictory('negro', storage), true);
  assert.equal(isSolagoUnlocked(storage), true);
  assert.equal(isCharacterUnlocked('warrior', storage), false, 'a negro win still only grants Solago');
});

test('one debug storage flag unlocks all registered and future character IDs', () => {
  const storage = memoryStorage();
  assert.equal(unlockAllForTesting(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)), { version: 1, debugUnlockAll: true });
  for (const id of ['solago', 'maxi', 'future-character']) assert.equal(isCharacterUnlocked(id, storage), true);
  assert.equal(isSolagoUnlocked(storage), true);
});

test('debug unlock only writes its storage flag and fails closed on blocked storage', () => {
  const storage = memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify({ version: 1, solagoUnlocked: true }) });
  assert.equal(unlockAllForTesting(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)), { version: 1, solagoUnlocked: true, debugUnlockAll: true });
  assert.equal(unlockAllForTesting({ setItem() { throw new Error('blocked'); } }), false);
});

test('unlock commands preserve malformed and unsupported stored progression data', () => {
  for (const original of ['', '{bad json', JSON.stringify({ version: 9, futureField: 'keep me' })]) {
    const storage = memoryStorage({ [PROGRESS_STORAGE_KEY]: original });
    assert.equal(unlockSolago(storage), false);
    assert.equal(unlockAllForTesting(storage), false);
    assert.equal(storage.getItem(PROGRESS_STORAGE_KEY), original);
  }
});

test('malformed, unsupported or unavailable storage fails safely as locked', () => {
  assert.equal(isSolagoUnlocked(memoryStorage({ [PROGRESS_STORAGE_KEY]: '{bad json' })), false);
  assert.equal(isSolagoUnlocked(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify({ version: 9, solagoUnlocked: true }) })), false);
  assert.equal(isSolagoUnlocked({ getItem() { throw new Error('blocked'); } }), false);
  assert.equal(unlockSolago({ setItem() { throw new Error('blocked'); } }), false);
});
