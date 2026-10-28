import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, ROSTER } from '../src/characters/index.mjs';
import { PROGRESS_STORAGE_KEY, UNLOCK_CHAIN, isCharacterUnlocked, recordMapVictory, unlockCharacter } from '../src/progression.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('every roster character owns its unlock descriptor', () => {
  for (const character of ROSTER) {
    assert.ok(character.unlock, `${character.id} exposes an unlock descriptor`);
    assert.ok('flag' in character.unlock, `${character.id} declares its unlock flag, even when it is null`);
    if (character.unlock.flag !== null) assert.match(character.unlock.flag, /Unlocked$/);
  }
  const flags = ROSTER.map(character => character.unlock.flag).filter(Boolean);
  assert.equal(new Set(flags).size, flags.length, 'unlock flags are unique per character');
  assert.deepEqual(
    UNLOCK_CHAIN,
    ROSTER.filter(character => character.unlock.flag).map(character => character.id),
    'the chain is derived from the registry order instead of a second hardcoded list',
  );
});

test('unlock state follows the descriptor, not an identity branch in progression', () => {
  const character = CHARACTERS.warrior;
  const original = character.unlock;
  try {
    character.unlock = { flag: 'renamedUnlockFlag' };
    const storage = memoryStorage();
    assert.equal(isCharacterUnlocked('warrior', storage), false);
    assert.equal(unlockCharacter('warrior', storage), true);
    assert.equal(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)).renamedUnlockFlag, true);
    assert.equal(isCharacterUnlocked('warrior', storage), true);
  } finally {
    character.unlock = original;
  }
});

test('a victory unlocks the next roster entry and the last one grants nothing', () => {
  const storage = memoryStorage();
  assert.equal(recordMapVictory('negro', storage), true);
  assert.equal(isCharacterUnlocked('solago', storage), true);
  assert.equal(isCharacterUnlocked('warrior', storage), false);

  const last = ROSTER.at(-1).id;
  assert.equal(recordMapVictory(last, memoryStorage()), false);
  assert.equal(recordMapVictory('unknown-character', memoryStorage()), false);
});

test('always-available and unknown characters keep their previous behaviour', () => {
  const storage = memoryStorage();
  assert.equal(CHARACTERS[ROSTER[0].id].unlock.flag, null);
  assert.equal(isCharacterUnlocked(ROSTER[0].id, storage), true, 'the starter is playable without saved progress');
  assert.equal(isCharacterUnlocked('future-character', storage), false, 'unknown ids stay locked');
  assert.equal(unlockCharacter('future-character', storage), false);
});
