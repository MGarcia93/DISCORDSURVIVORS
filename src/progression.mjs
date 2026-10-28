export const PROGRESS_STORAGE_KEY = 'discord-survivors.progress.v1';

// Victory unlock chain: negro is always playable; winning a map with the
// previous character unlocks the next one in this order.
export const UNLOCK_CHAIN = ['solago', 'warrior', 'papazito'];

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

export function isSolagoUnlocked(storage) {
  return isCharacterUnlocked('solago', storage);
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

export function isCharacterUnlocked(character, storage) {
  if (character === 'negro') return true;
  const progress = readProgress(storage);
  if (!progress) return false;
  if (progress.debugUnlockAll === true) return true;
  if (character === 'solago') return progress.solagoUnlocked === true;
  if (character === 'warrior') return progress.warriorUnlocked === true;
  return character === 'papazito' && progress.papazitoUnlocked === true;
}

export function isDebugUnlockAll(storage) {
  return readProgress(storage)?.debugUnlockAll === true;
}

export function unlockSolago(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    const record = readProgressRecord(target);
    if (!record.valid) return false;
    const progress = record.progress;
    progress.solagoUnlocked = true;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

// Victory unlock chain: negro wins the map -> Solago; Solago wins -> Warrior;
// Warrior wins -> Papazito.
export function unlockWarrior(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    const record = readProgressRecord(target);
    if (!record.valid) return false;
    record.progress.warriorUnlocked = true;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(record.progress));
    return true;
  } catch {
    return false;
  }
}

export function unlockPapazito(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    const record = readProgressRecord(target);
    if (!record.valid) return false;
    record.progress.papazitoUnlocked = true;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(record.progress));
    return true;
  } catch {
    return false;
  }
}

export function recordMapVictory(character, storage) {
  if (character === 'negro') return unlockSolago(storage);
  if (character === 'solago') return unlockWarrior(storage);
  if (character === 'warrior') return unlockPapazito(storage);
  return false;
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

// Solago unlock lives behind the waveCleared bus event instead of the UI
// overlay: any map victory advances the unlock chain (negro -> solago ->
// warrior) through recordMapVictory.
export function handleWaveClearedEvent(event, storage) {
  const run = event?.run;
  if (run?.phase === 'won') return recordMapVictory(run.character, storage);
  return false;
}

import { on } from './bus.mjs';
on('waveCleared', event => handleWaveClearedEvent(event));
