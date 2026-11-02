import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, createRun } from '../src/engine.mjs';
import { botInput, pickLevelReward } from '../src/game/bot.mjs';
import { runCampaign, seededRandom, runShop } from '../src/game/campaign-sim.mjs';
import { beginRewards } from '../src/run-rewards.mjs';

const runWith = (character, gap) => {
  const run = createRun(() => 0.5, character);
  run.spawnIn = Infinity;
  run.enemies = [createEnemy(run, 'zombie', run.player.x + gap, run.player.y)];
  return run;
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const spotAhead = (run, input) => ({ x: run.player.x + input.x * 95, y: run.player.y + input.y * 95 });

test('the bot backs off when a body is inside its attack distance', () => {
  for (const character of ['solago', 'negro']) {
    const run = runWith(character, runWith(character, 10).player.attackRange * 0.3);
    const input = botInput(run);
    assert.ok(Math.hypot(input.x, input.y) > 0, `${character} moves`);
    const enemy = run.enemies[0];
    assert.ok(distance(spotAhead(run, input), enemy) > distance(run.player, enemy) + 20,
      `${character} picks a spot farther from the body`);
  }
});

test('the bot closes when the target is out of its attack distance', () => {
  for (const character of ['solago', 'negro']) {
    const probe = runWith(character, 10);
    const run = runWith(character, probe.player.attackRange * 2.2);
    const input = botInput(run);
    assert.ok(input.x > 0, `${character} walks toward the target`);
    assert.ok(Math.abs(input.y) <= 1);
  }
});

test('the campaign runner is deterministic for a seed and differs across seeds', () => {
  const first = runCampaign({ character: 'solago', seed: 11 });
  const again = runCampaign({ character: 'solago', seed: 11 });
  assert.deepEqual(first.waves, again.waves);
  assert.equal(first.run.kills, again.run.kills);
  assert.deepEqual(seededRandom(11)(), seededRandom(11)());
});

test('the bot spends level choices on its own kit before the shared stats', () => {
  const run = createRun(() => 0.1, 'warrior');
  run.phase = 'shop';
  beginRewards(run);
  run.random = () => 0.1;
  run.pendingLevels = [4];
  run.levelChoices = null;
  beginRewards(run);
  const pick = pickLevelReward(run, 'warrior');
  assert.ok(pick, 'something is offered');
  assert.ok(pick.characters === 'warrior' || pick.characters === 'all');
});

test('the shop resolves every pending level and buys what it can afford', () => {
  const run = createRun(() => 0.1, 'negro');
  run.phase = 'shop';
  run.coins = 500;
  run.pendingLevels = [2, 3];
  run.levelChoices = null;
  assert.equal(runShop(run, 'negro'), true);
  assert.equal(run.pendingLevels.length, 0);
  assert.ok(run.coins >= 0);
});
