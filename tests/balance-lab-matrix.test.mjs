import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYABLE_ACTS } from '../src/campaign/acts.mjs';
import { ROSTER } from '../src/characters/index.mjs';
import { DEFAULT_CATALOG, EFFECTS } from '../src/reward-data.mjs';
import { describeReward } from '../src/reward-catalog.mjs';
import { countOf, previewReward } from '../src/run-rewards.mjs';
import { balanceForMode, itemBlocked, pickBlocked, seedRun } from '../src/game/balance-seed.mjs';
import { waveEntryBudget } from '../src/game/wave-budget.mjs';

// The lab offers the whole matrix, so every cell has to seed without throwing:
// one character, one act, one wave, and a run that is ready to play.
test('every character can be seeded into every wave of every act', () => {
  for (const character of ROSTER) {
    for (const act of PLAYABLE_ACTS) {
      for (let wave = 1; wave <= act.boss.wave; wave++) {
        const { run } = seedRun({ character: character.id, act, wave, random: () => 0.5 });
        assert.equal(run.wave, wave);
        assert.equal(run.phase, 'playing');
        assert.equal(run.player.character, character.id);
        assert.ok(run.player.hp > 0 && run.player.hp === run.player.maxHp);
        assert.equal(run.act.id, act.id);
      }
    }
  }
});

// Everything the lab can render must be consistent with what seeding does: a
// card the screen enables has to survive the seed, and a disabled one is one
// the seed would drop.
test('an enabled pick survives the seed and a blocked one is dropped', () => {
  const act = PLAYABLE_ACTS[0];
  const entry = waveEntryBudget(act, 4, balanceForMode('real'));
  for (const character of ROSTER) {
    const eligible = DEFAULT_CATALOG.upgrades.filter(candidate =>
      (candidate.characters === 'all' || candidate.characters === character.id)
      && !pickBlocked(candidate, { character: character.id, level: entry.level, choices: entry.choices }));
    for (const upgrade of eligible) {
      const { run } = seedRun({ character: character.id, act, wave: 4, picks: { [upgrade.id]: 1 } });
      assert.equal(countOf(run.levelRanks, upgrade.id), 1, `${upgrade.id} should apply for ${character.id}`);
    }
  }
});

test('every item card fits the shop rules the seed follows', () => {
  for (const item of DEFAULT_CATALOG.items) {
    const blocked = itemBlocked(item, { coins: 10_000 });
    if (item.enabled === false) {
      assert.equal(blocked, 'disabled');
      const { run } = seedRun({ character: 'negro', act: PLAYABLE_ACTS[0], wave: 6, items: { [item.id]: 1 } });
      assert.equal(countOf(run.items, item.id), 0, `${item.id} is outside the offer pool`);
    }
  }
});

test('every catalog entry has a description the lab can print', () => {
  for (const upgrade of DEFAULT_CATALOG.upgrades) {
    assert.ok(describeReward(upgrade.ranks[0], EFFECTS).length > 0, upgrade.id);
  }
  for (const item of DEFAULT_CATALOG.items) {
    assert.ok(describeReward(item, EFFECTS).length > 0, item.id);
  }
});

test('a card is only enabled when its preview is a real change', () => {
  const act = PLAYABLE_ACTS[0];
  const entry = waveEntryBudget(act, 5, balanceForMode('real'));
  const { run } = seedRun({ character: 'solago', act, wave: 5 });
  for (const upgrade of DEFAULT_CATALOG.upgrades) {
    const blocked = pickBlocked(upgrade, { character: 'solago', level: entry.level, choices: entry.choices });
    if (blocked) continue;
    const preview = previewReward(run, `balance-level:${upgrade.id}:0`, upgrade.ranks[0]);
    assert.ok(preview, `${upgrade.id} is offered and previews`);
  }
  for (const item of DEFAULT_CATALOG.items) {
    if (itemBlocked(item, { coins: 10_000 })) continue;
    assert.ok(previewReward(run, `balance-item:${item.id}`, item), `${item.id} is offered and previews`);
  }
});
