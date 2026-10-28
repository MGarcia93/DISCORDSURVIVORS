import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESS_STORAGE_KEY, isCharacterUnlocked, unlockCharacter, unlockAllForTesting, recordMapVictory } from '../src/progression.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('Solago starts locked when there is no saved map-one victory', () => {
  assert.equal(isCharacterUnlocked('solago', memoryStorage()), false);
});

test('beating the first map can persist Solago unlocked in local storage', () => {
  const storage = memoryStorage();
  assert.equal(unlockCharacter('solago', storage), true);
  assert.equal(isCharacterUnlocked('solago', storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)), { version: 1, solagoUnlocked: true });
});

test('Warrior also starts locked and is the reward for winning the map chain as Solago', () => {
  const storage = memoryStorage();
  assert.equal(isCharacterUnlocked('warrior', storage), false);
  assert.equal(recordMapVictory('solago', storage), true);
  assert.equal(isCharacterUnlocked('warrior', storage), true);
  assert.equal(isCharacterUnlocked('solago', storage), false, 'a solago win grants Warrior, not Solago');
});

test('only El Negro winning the first map unlocks Solago', () => {
  const storage = memoryStorage();
  assert.equal(isCharacterUnlocked('solago', storage), false);
  assert.equal(recordMapVictory('negro', storage), true);
  assert.equal(isCharacterUnlocked('solago', storage), true);
  assert.equal(isCharacterUnlocked('warrior', storage), false, 'a negro win still only grants Solago');
});

test('Papazito starts locked and is the reward for winning the map chain as Warrior', () => {
  const storage = memoryStorage();
  assert.equal(isCharacterUnlocked('papazito', storage), false);
  assert.equal(recordMapVictory('warrior', storage), true);
  assert.equal(isCharacterUnlocked('papazito', storage), true);
  assert.equal(isCharacterUnlocked('warrior', storage), false, 'a warrior win grants Papazito, not Warrior');
});

test('one debug storage flag unlocks all registered and future character IDs', () => {
  const storage = memoryStorage();
  assert.equal(unlockAllForTesting(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)), { version: 1, debugUnlockAll: true });
  for (const id of ['solago', 'maxi', 'future-character']) assert.equal(isCharacterUnlocked(id, storage), true);
  assert.equal(isCharacterUnlocked('solago', storage), true);
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
    assert.equal(unlockCharacter('solago', storage), false);
    assert.equal(unlockAllForTesting(storage), false);
    assert.equal(storage.getItem(PROGRESS_STORAGE_KEY), original);
  }
});

test('malformed, unsupported or unavailable storage fails safely as locked', () => {
  assert.equal(isCharacterUnlocked('solago', memoryStorage({ [PROGRESS_STORAGE_KEY]: '{bad json' })), false);
  assert.equal(isCharacterUnlocked('solago', memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify({ version: 9, solagoUnlocked: true }) })), false);
  assert.equal(isCharacterUnlocked('solago', { getItem() { throw new Error('blocked'); } }), false);
  assert.equal(unlockCharacter('solago', { setItem() { throw new Error('blocked'); } }), false);
});
