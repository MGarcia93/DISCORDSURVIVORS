import { CHARACTERS, ROSTER } from './characters/index.mjs';

export const PROGRESS_STORAGE_KEY = 'discord-survivors.progress.v1';

// Bumped whenever the unlock rules change. A save written by another build keeps
// everything it knows except the characters that build handed out: they have to
// be earned again through their own encounter.
export const PROGRESS_STORAGE_VERSION = 2;

// The epilogue is not the campaign's ending: it is what the second ending finds.
// Two cleared campaigns is the whole condition, and it is counted from the last
// world of the campaign, never from an epilogue.
export const POSTGAME_CLEARS = 2;

// Registered unlockable characters. Legacy consumers retain roster order;
// campaign encounters and their saved flags belong to each character's sheet.
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

// A record from another build cannot be trusted about who was unlocked: the
// flags and the scenes that granted them are dropped and the rest of the save is
// kept. It runs on the first read, which is what the game does on entry.
function relock(progress, storage) {
  const next = { ...progress, version: PROGRESS_STORAGE_VERSION };
  const scenes = new Set();
  for (const character of Object.values(CHARACTERS)) {
    const { flag, scene } = character.unlock ?? {};
    if (flag) delete next[flag];
    if (typeof scene === 'string') scenes.add(scene);
  }
  if (Array.isArray(next.seenScenes) && scenes.size) {
    next.seenScenes = next.seenScenes.filter(seen => !scenes.has(seen));
  }
  try { storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next)); } catch { /* keep the in-memory copy */ }
  return next;
}

function readProgressRecord(storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return { valid: false, progress: null };
    const raw = target.getItem(PROGRESS_STORAGE_KEY);
    if (raw === null) return { valid: true, progress: { version: PROGRESS_STORAGE_VERSION } };
    const progress = JSON.parse(raw);
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return { valid: false, progress: null };
    if (progress.version !== PROGRESS_STORAGE_VERSION) return { valid: true, progress: relock(progress, target) };
    return { valid: true, progress };
  } catch {
    return { valid: false, progress: null };
  }
}

function readProgress(storage) {
  const record = readProgressRecord(storage);
  return record.valid ? record.progress : null;
}

function writeProgressRecord(progress, storage) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
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

// The Konami code opens the roster for the rest of the session and nothing more:
// it is never written to the save, so closing the tab closes the door again.
let sessionUnlockAll = false;

export function unlockAllForSession() {
  sessionUnlockAll = true;
  return true;
}

export function isCharacterUnlocked(character, storage) {
  const descriptor = unlockDescriptor(character);
  if (descriptor && descriptor.flag === null) return true;
  if (sessionUnlockAll) return true;
  const progress = readProgress(storage);
  if (!progress) return false;
  if (progress.debugUnlockAll === true) return true;
  if (!descriptor) return false;
  return progress[descriptor.flag] === true
    || (typeof descriptor.scene === 'string' && Array.isArray(progress.seenScenes)
      && progress.seenScenes.includes(descriptor.scene));
}

function clearsOf(progress) {
  const clears = progress?.campaignClears;
  return Number.isInteger(clears) && clears > 0 ? clears : 0;
}

export function campaignClears(storage) {
  return clearsOf(readProgress(storage));
}

export function recordCampaignClear(storage) {
  const record = readProgressRecord(storage);
  if (!record.valid) return false;
  return writeProgressRecord({ ...record.progress, campaignClears: clearsOf(record.progress) + 1 }, storage);
}

export function postgameOpen(storage) {
  return clearsOf(readProgress(storage)) >= POSTGAME_CLEARS;
}

export function isDebugUnlockAll(storage) {
  return sessionUnlockAll || readProgress(storage)?.debugUnlockAll === true;
}

export function unlockCharacter(character, storage) {
  const flag = unlockDescriptor(character)?.flag;
  if (!flag) return false;
  return writeProgressFlag(flag, storage);
}

// Legacy explicit API retained for compatibility. Gameplay no longer calls it:
// completed or skipped campaign encounters determine character availability.
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

// Compatibility hook: winning a world no longer grants a roster successor.
// The gameplay director persists successful encounters through sceneSeenStore.
export function handleWaveClearedEvent(_event, _storage) {
  return false;
}
