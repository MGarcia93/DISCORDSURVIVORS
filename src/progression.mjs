import { CHARACTERS, ROSTER } from './characters/index.mjs';

export const PROGRESS_STORAGE_KEY = 'discord-survivors.progress.v1';

// Victory unlock chain: winning a map with one roster entry unlocks the next
// one. The order and the flags live on the characters themselves, so this
// module never names a character.
export const UNLOCK_CHAIN = ROSTER.filter(character => character.unlock.flag).map(character => character.id);

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

// Unknown ids have no descriptor; a descriptor with a null flag means the
// character is always playable.
function unlockDescriptor(character) {
  return Object.hasOwn(CHARACTERS, character) ? CHARACTERS[character].unlock : null;
}

function readProgressRecord(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return { valid: false, progress: null };
    const raw = target.getItem(PROGRESS_STORAGE_KEY);
    if (raw === null) return { valid: true, progress: { version: 1 } };
    const progress = JSON.parse(raw);
    if (!progress || progress.version !== 1 || typeof progress !== 'object' || Array.isArray(progress)) {
      return { valid: false, progress: null };
    }
    return { valid: true, progress };
  } catch {
    return { valid: false, progress: null };
  }
}

function readProgress(storage) {
  const record = readProgressRecord(storage);
  return record.valid ? record.progress : null;
}

function writeProgressFlag(flag, storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    const record = readProgressRecord(target);
    if (!record.valid) return false;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...record.progress, [flag]: true }));
    return true;
  } catch {
    return false;
  }
}

// Scenes already played, so `repeat: once` means once per playthrough and not
// once per run. It rides the same record and stays additive.
export function seenScenes(storage) {
  const list = readProgress(storage)?.seenScenes;
  return Array.isArray(list) ? list.filter(id => typeof id === 'string') : [];
}

export function markSceneSeen(scene, storage) {
  const record = readProgressRecord(storage);
  if (!record.valid) return false;
  const seen = new Set(seenScenes(storage));
  if (seen.has(scene)) return true;
  seen.add(scene);
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...record.progress, seenScenes: [...seen] }));
    return true;
  } catch { return false; }
}

// What the narrative director needs: the same `has`/`add` a Set offers.
export function sceneSeenStore(storage) {
  return {
    has: id => seenScenes(storage).includes(id),
    add: id => markSceneSeen(id, storage),
  };
}

export function isCharacterUnlocked(character, storage) {
  const descriptor = unlockDescriptor(character);
  if (descriptor && descriptor.flag === null) return true;
  const progress = readProgress(storage);
  if (!progress) return false;
  if (progress.debugUnlockAll === true) return true;
  if (!descriptor) return false;
  return progress[descriptor.flag] === true;
}

export function isDebugUnlockAll(storage) {
  return readProgress(storage)?.debugUnlockAll === true;
}

export function unlockCharacter(character, storage) {
  const flag = unlockDescriptor(character)?.flag;
  if (!flag) return false;
  return writeProgressFlag(flag, storage);
}

// A victory grants the next roster entry; the last entry grants nothing.
export function recordMapVictory(character, storage) {
  const index = ROSTER.findIndex(entry => entry.id === character);
  if (index < 0) return false;
  const next = ROSTER[index + 1];
  if (!next) return false;
  return unlockCharacter(next.id, storage);
}

export function unlockAllForTesting(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    const record = readProgressRecord(target);
    if (!record.valid) return false;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...record.progress, debugUnlockAll: true }));
    return true;
  } catch {
    return false;
  }
}

// The unlock chain hangs off the waveCleared bus event instead of the UI
// overlay: any map victory advances it through recordMapVictory.
export function handleWaveClearedEvent(event, storage) {
  const run = event?.run;
  if (run?.phase === 'won') return recordMapVictory(run.character, storage);
  return false;
}

import { on } from './bus.mjs';
on('waveCleared', event => handleWaveClearedEvent(event));
