import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ROSTER } from '../src/characters/index.mjs';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';
import { PROGRESS_STORAGE_KEY, isCharacterUnlocked, sceneSeenStore, handleWaveClearedEvent } from '../src/progression.mjs';

const encounters = [
  { act: 'act-02', scene: 'act-02-solago', character: 'solago' },
  { act: 'act-03', scene: 'act-03-papasito', character: 'papazito' },
  { act: 'act-04', scene: 'act-04-warrior', character: 'warrior' },
];
// Encounter order the selection screen follows. Jhony refuses to join all the
// way through Act 1: he only comes back to Discord when his own epilogue ends,
// so his note is the last one a save reads.
const encounterOrder = [...encounters,
  { scene: 'act-05-final', character: 'papafrita' },
  { scene: 'act-07-credits', character: 'jhony' }];
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
function memoryStorage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test('each real encounter unlocks its character when completed or skipped, with any survivor', async () => {
  for (const encounter of encounters) {
    const act = PLAYABLE_ACTS.find(act => act.id === encounter.act);
    const catalog = await loadCatalog({ urls: [manifestURL, actManifestURL(act)], fetcher });
    for (const survivor of ROSTER) for (const skip of [false, true]) {
      const store = memoryStorage();
      const director = new WaveDirector(catalog, { seen: sceneSeenStore(store) });
      director.attach({ act, character: survivor.id, phase: 'playing', wave: 3, time: 0 });
      assert.equal(director.player.scene.id, encounter.scene);
      assert.equal(isCharacterUnlocked(encounter.character, store), false, 'not before the encounter finishes');
      if (skip) director.skip();
      else for (let frame = 0; director.blocked && frame < 20000; frame++) {
        if (director.player.dialogue || director.player.notice || director.player.splash) director.advance();
        else director.tick(0.05);
      }
      assert.equal(director.blocked, false, `${encounter.scene} finishes`);
      assert.equal(isCharacterUnlocked(encounter.character, store), true, `${survivor.id}: ${encounter.scene}, skip=${skip}`);
      const saved = store.getItem(PROGRESS_STORAGE_KEY);
      const reloaded = memoryStorage(saved);
      assert.equal(isCharacterUnlocked(encounter.character, reloaded), true, 'survives reloading');
      for (const other of encounters.filter(item => item !== encounter)) {
        assert.equal(isCharacterUnlocked(other.character, reloaded), false, 'does not grant other encounters');
      }
      assert.equal(isCharacterUnlocked('jhony', reloaded), false, 'and never grants Jhony his epilogue unlock');
      assert.equal(reloaded.getItem(PROGRESS_STORAGE_KEY), saved, 'checking an unlock never rewrites progress');
    }
  }
});

test('existing encounter history restores all characters without replaying or rewriting the save', () => {
  const original = JSON.stringify({ version: 2, seenScenes: encounters.map(item => item.scene), custom: { keep: 123 } });
  const store = memoryStorage(original);
  for (const { character } of encounters) assert.equal(isCharacterUnlocked(character, store), true);
  assert.equal(store.getItem(PROGRESS_STORAGE_KEY), original);
});

function playToTheEnd(director, frames = 40000) {
  for (let frame = 0; director.blocked && frame < frames; frame++) {
    if (director.player.dialogue || director.player.notice || director.player.splash) director.advance();
    else director.tick(0.05);
  }
  assert.equal(director.blocked, false, 'the scenes finish');
}

test('Jhony refusing to join in Act 1 never makes him selectable', async () => {
  const act = PLAYABLE_ACTS.find(act => act.id === 'act-01');
  const catalog = await loadCatalog({ urls: [manifestURL, actManifestURL(act)], fetcher });
  const store = memoryStorage();
  const director = new WaveDirector(catalog, { seen: sceneSeenStore(store) });
  director.attach({ act, character: 'negro', phase: 'won', wave: 6, time: 0 });
  assert.equal(isCharacterUnlocked('jhony', store), false);
  director.observe();
  playToTheEnd(director);
  assert.equal(director.player.scene.id, 'act-01-epilogue', 'Act 1 closes with the epilogue');
  assert.equal(isCharacterUnlocked('jhony', store), false, 'the Act 1 meeting is not the unlock');
});

test('the last scene of his own epilogue is what makes Jhony selectable', async () => {
  const act = PLAYABLE_ACTS.find(act => act.id === 'act-07');
  const catalog = await loadCatalog({ urls: [manifestURL, actManifestURL(act)], fetcher });
  const store = memoryStorage();
  const director = new WaveDirector(catalog, { seen: sceneSeenStore(store) });
  director.attach({ act, character: 'negro', phase: 'won', wave: 6, time: 0 });
  assert.equal(isCharacterUnlocked('jhony', store), false, 'not before his epilogue ends');
  director.observe();
  playToTheEnd(director);
  assert.equal(director.player.scene.id, 'act-07-credits', 'his epilogue closes with the post-credits');
  assert.equal(isCharacterUnlocked('jhony', store), true);
});

test('victories no longer unlock the next played-character successor', () => {
  for (const { id } of ROSTER) for (const phase of ['won', 'shop']) {
    const store = memoryStorage();
    assert.equal(handleWaveClearedEvent({ run: { character: id, phase } }, store), false);
    for (const { character } of encounters) assert.equal(isCharacterUnlocked(character, store), false);
    assert.equal(store.getItem(PROGRESS_STORAGE_KEY), null);
  }
});

test('cancelled encounters and isolated dev previews cannot unlock characters', async () => {
  const act = PLAYABLE_ACTS.find(act => act.id === 'act-02');
  const catalog = await loadCatalog({ urls: [manifestURL, actManifestURL(act)], fetcher });
  const store = memoryStorage();
  const cancelled = new WaveDirector(catalog, { seen: sceneSeenStore(store) });
  cancelled.attach({ act, phase: 'playing', wave: 3, time: 0 });
  cancelled.detach();
  assert.equal(store.getItem(PROGRESS_STORAGE_KEY), null);
  const preview = new WaveDirector(catalog);
  preview.attach({ act, phase: 'playing', wave: 3, time: 0 });
  preview.skip();
  assert.equal(store.getItem(PROGRESS_STORAGE_KEY), null);
  assert.equal(isCharacterUnlocked('solago', store), false);
});

test('roster guidance follows encounter order and recovered characters are selectable', async () => {
  const original = { document: globalThis.document, window: globalThis.window, localStorage: globalThis.localStorage };
  const content = { innerHTML: '' };
  const store = memoryStorage();
  globalThis.document = { querySelector: selector => selector === '#content' ? content : null };
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  globalThis.localStorage = store;
  try {
    const { characters } = await import('../src/screens/characters.mjs');
    const { state } = await import('../src/app/state.mjs');
    characters();
    assert.ok(content.innerHTML.includes(ROSTER.find(item => item.id === 'solago').unlockNote.locked), 'a fresh save points at the first encounter');
    assert.doesNotMatch(content.innerHTML, /GANÁ EL MAPA|CADENA DE MAPAS|ganá el mapa anterior/);
    for (const [index, encounter] of encounterOrder.entries()) {
      sceneSeenStore(store).add(encounter.scene);
      state.selectedCharacter = encounter.character;
      characters();
      assert.equal(state.selectedCharacter, encounter.character);
      assert.doesNotMatch(content.innerHTML, new RegExp(`data-character="${encounter.character}"[^>]*disabled`));
      if (index < encounterOrder.length - 1) {
        assert.ok(content.innerHTML.includes(ROSTER.find(item => item.id === encounterOrder[index + 1].character).unlockNote.locked));
      }
    }
    assert.match(content.innerHTML, /TODOS LOS PERSONAJES IMPLEMENTADOS DESBLOQUEADOS/);
  } finally {
    Object.assign(globalThis, original);
  }
});
