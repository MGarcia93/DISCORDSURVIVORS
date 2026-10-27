export const PROGRESS_STORAGE_KEY = 'discord-survivors.progress.v1';

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
  return character === 'solago' && progress.solagoUnlocked === true;
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

export function recordMapVictory(character, storage) {
  return character === 'negro' ? unlockSolago(storage) : false;
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
