import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYABLE_ACTS, nextPlayableAct } from '../src/campaign/acts.mjs';
import {
  PROGRESS_STORAGE_KEY, PROGRESS_STORAGE_VERSION, POSTGAME_CLEARS,
  campaignClears, postgameOpen, recordCampaignClear,
} from '../src/progression.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    read: () => JSON.parse(values.get(PROGRESS_STORAGE_KEY) ?? 'null'),
  };
}

test('the campaign ends at its last world and the epilogue is not the next one', () => {
  assert.deepEqual(
    PLAYABLE_ACTS.filter(act => act.postgame).map(act => act.id),
    ['act-06', 'act-07'],
    'the two epilogues are the only postgame acts',
  );
  assert.equal(nextPlayableAct('act-04').id, 'act-05', 'the campaign walks straight through');
  assert.equal(nextPlayableAct('act-05'), null, 'and stops there the first time');
  assert.equal(nextPlayableAct('act-05', { postgame: true }).id, 'act-06');
  assert.equal(nextPlayableAct('act-06', { postgame: true }).id, 'act-07');
  assert.equal(nextPlayableAct('act-07', { postgame: true }), null, 'and the epilogue still ends');
});

test('one cleared campaign reveals nothing, the second opens the epilogue', () => {
  const storage = memoryStorage();
  assert.equal(POSTGAME_CLEARS, 2);
  assert.equal(postgameOpen(storage), false, 'a new save has no ending yet');

  assert.equal(recordCampaignClear(storage), true);
  assert.equal(campaignClears(storage), 1);
  assert.equal(postgameOpen(storage), false, 'the first ending shows nothing');

  assert.equal(recordCampaignClear(storage), true);
  assert.equal(campaignClears(storage), 2);
  assert.equal(postgameOpen(storage), true);
  assert.equal(nextPlayableAct('act-05', { postgame: postgameOpen(storage) }).id, 'act-06', 'the second ending opens it');
});

test('the count rides the same record as the rest of the progress', () => {
  const storage = memoryStorage();
  recordCampaignClear(storage);
  recordCampaignClear(storage);
  assert.deepEqual(storage.read(), { version: PROGRESS_STORAGE_VERSION, campaignClears: 2 });
  assert.equal(postgameOpen(storage), true, 'and it survives a reload');
});

test('a storage that cannot be read keeps the epilogue closed', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(campaignClears(blocked), 0);
  assert.equal(postgameOpen(blocked), false);
  assert.equal(recordCampaignClear(blocked), false);
});
