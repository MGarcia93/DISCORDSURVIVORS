import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { ACTS, DEFAULT_ACT, PLAYABLE_ACTS, getAct } from '../src/campaign/acts.mjs';
import act01 from '../src/campaign/act-01-zomboid.mjs';
import act02 from '../src/campaign/act-02-rift.mjs';
import act03 from '../src/campaign/act-03-inferno.mjs';
import act04 from '../src/campaign/act-04-exiles.mjs';
import act05 from '../src/campaign/act-05-discord.mjs';
import { validateAct, validateCampaign } from '../src/campaign/validate.mjs';

const planned = () => ({ id: 'act-99', order: 99, title: 'Probe', status: 'planned', world: 'rift' });
const playable = () => structuredClone(act01);

test('the campaign registers five worlds in order and all five are playable', () => {
  assert.equal(ACTS.length, 5);
  assert.deepEqual(ACTS.map(act => act.order), [1, 2, 3, 4, 5]);
  assert.equal(new Set(ACTS.map(act => act.id)).size, 5);
  assert.equal(PLAYABLE_ACTS.length, 5);
  assert.equal(DEFAULT_ACT.id, 'act-01');
  assert.equal(getAct('act-03').status, 'playable');
  assert.equal(getAct('act-04').status, 'playable');
  assert.equal(getAct('act-05').status, 'playable');
  assert.equal(getAct('nope'), DEFAULT_ACT);
  // Monster Hunter is a rejected pitch in Act 4, not a world.
  assert.ok(!ACTS.some(act => /monster/i.test(act.id) || /monster/i.test(act.title)));
});

test('act five is the corrupted Discord with the four old bosses and the administrator', () => {
  assert.equal(act05.world, 'discord');
  assert.equal(act05.duration, 60);
  assert.equal(act05.waves.length, 6);
  // Wave five restores the four bosses already beaten, in script order.
  assert.deepEqual(act05.miniboss.map(entry => entry.kind), ['alarmZombie', 'yorick', 'lilith', 'taskmaster']);
  assert.ok(act05.miniboss.every(entry => entry.wave === 5));
  assert.deepEqual(act05.boss, { wave: 6, kind: 'administrator', name: 'EL ADMINISTRADOR DEL SERVIDOR' });
  // No new common kind: every wave before the gauntlet mixes shipped enemies.
  const shipped = new Set(['zombie', 'runner', 'brute', 'alarmZombie', 'meleeMinion', 'mageMinion', 'siegeMinion',
    'mistWalker', 'maiden', 'yorick', 'skeleton', 'lesserDemon', 'shaman', 'burningElite', 'batSwarm', 'lordZir',
    'lilith', 'barbarian', 'slaver', 'archer', 'alchemist', 'lotusAlchemist', 'taskmaster']);
  for (const row of act05.waves) {
    for (const kind of Object.keys(row.mix)) assert.ok(shipped.has(kind), `${kind} ships before act five`);
  }
  // The hotfix wave is faster and mutes the cast for a moment.
  assert.ok(act05.waves[3].speedBoost > 1);
  assert.ok(act05.waves[3].specialLock > 0);
  assert.equal(act05.waves[4].perMinute, 0, 'the gauntlet brings its own pressure');
  assert.equal(act05.waves[5].perMinute, 0, 'the boss wave fields the boss, not a clock budget');
});

test('act four is the Conan Exiles chapter with the lotus alchemist and the taskmaster', () => {
  assert.equal(act04.world, 'exiles');
  assert.equal(act04.duration, 60);
  assert.equal(act04.waves.length, 6);
  assert.deepEqual(act04.miniboss, { wave: 5, kind: 'lotusAlchemist', name: 'EL ALQUIMISTA DEL LOTO' });
  assert.deepEqual(act04.boss, { wave: 6, kind: 'taskmaster', name: 'EL CAPATAZ DE LA RUEDA DEL DOLOR' });
  assert.equal(act04.waves[0].perMinute > 0, true);
  assert.deepEqual(Object.keys(act04.waves[0].mix), ['barbarian']);
  assert.ok(Object.hasOwn(act04.waves[1].mix, 'slaver'));
  assert.ok(Object.hasOwn(act04.waves[1].mix, 'archer'));
  assert.ok(Object.hasOwn(act04.waves[3].mix, 'alchemist'));
  assert.equal(act04.waves[5].perMinute, 0, 'the boss wave fields the boss, not a clock budget');
});

test('act one is the approved Project Zomboid chapter the script describes', () => {
  assert.equal(act01.world, 'zomboid-combat');
  assert.equal(act01.title, '2.000 horas al pedo');
  assert.equal(act01.duration, 60);
  assert.equal(act01.waves.length, 6);
  assert.deepEqual(act01.boss, { wave: 6, kind: 'alarmZombie', name: 'EL ZOMBI DE LA ALARMA' });
  assert.equal(act01.waves[5].perMinute, 0, 'the boss wave fields the boss, not a clock budget');
});

test('act three is the Diablo chapter with Lord Zir and Lilith', () => {
  assert.equal(act03.world, 'inferno');
  assert.equal(act03.duration, 60);
  assert.equal(act03.waves.length, 6);
  assert.deepEqual(act03.miniboss, { wave: 5, kind: 'lordZir', name: 'LORD ZIR' });
  assert.deepEqual(act03.boss, { wave: 6, kind: 'lilith', name: 'LILITH' });
  assert.equal(act03.waves[5].perMinute, 0, 'the boss wave fields the boss, not a clock budget');
});

test('a planned world only needs its campaign slot', () => {
  assert.equal(validateAct(planned()).status, 'planned');
});

test('the validator names what an incomplete act is missing', () => {
  const cases = [
    ['unknown world', { world: 'atlantis' }, /unknown world: atlantis/],
    ['unknown status', { status: 'maybe' }, /invalid status/],
    ['missing duration', { duration: 0 }, /invalid duration/],
    ['no waves', { waves: [] }, /waves are required/],
    ['wave numbering gap', { waves: act01.waves.slice(0, 1) }, /boss must be on the last wave/],
    ['unknown enemy in a mix', { waves: act01.waves.map((row, i) => (i === 0 ? { ...row, mix: { dragon: 1 }, life: { dragon: 10 } } : row)) }, /unknown enemy: dragon/],
    ['mix that does not share one roll', { waves: act01.waves.map((row, i) => (i === 1 ? { ...row, mix: { zombie: 0.5, runner: 0.2 } } : row)) }, /mix must share one roll/],
    ['missing life for a kind', { waves: act01.waves.map((row, i) => (i === 2 ? { ...row, life: { zombie: 58, runner: 43 } } : row)) }, /must declare brute life/],
    ['unknown boss kind', { boss: { ...act01.boss, kind: 'nope' } }, /unknown boss kind/],
    ['boss before the last wave', { boss: { ...act01.boss, wave: 3 } }, /boss must be on the last wave/],
  ];
  for (const [label, patch, expected] of cases) {
    assert.throws(() => validateAct({ ...playable(), ...patch }), expected, label);
  }
});

test('the campaign rejects duplicate ids and order holes', () => {
  assert.throws(() => validateCampaign([playable(), planned()]), /order must be 2/);
  assert.throws(() => validateCampaign([playable(), { ...planned(), order: 2 }, { ...planned(), order: 2 }]), /order must be 3/);
  const duplicate = { ...playable(), id: 'act-01' };
  assert.throws(() => validateCampaign([duplicate, { ...planned(), order: 2, id: 'act-01' }]), /Duplicate act id/);
  assert.throws(() => validateCampaign([]), /at least one act/);
  assert.throws(() => validateCampaign([{ ...planned(), order: 1 }]), /one playable act/);
});

test('nothing outside the campaign layer decides the boss wave or the wave count', async () => {
  const files = [];
  const walk = async dir => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (path.endsWith('.mjs')) files.push(path);
    }
  };
  await walk('src');
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    // A parameter may be named bossWave; a hardcoded count may not exist.
    assert.ok(!/rewardBalance\.waves\.(bossWave|bossKind)/.test(source), `${file} must not read a boss wave from the balance`);
    assert.ok(!/bossWave\s*=\s*\d|bossKind\s*[:=]\s*['"]/.test(source), `${file} must not hardcode a boss wave`);
  }
});

test('act two is the approved League of Legends chapter the script describes', () => {
  assert.equal(act02.world, 'rift');
  assert.equal(act02.title, 'El murganeo perdido');
  assert.equal(act02.duration, 60);
  assert.equal(act02.waves.length, 6);
  assert.deepEqual(act02.boss, { wave: 6, kind: 'yorick', name: 'YORICK, EL ENTERRADOR' });
  assert.deepEqual(act02.miniboss, { wave: 5, kind: 'maiden', name: 'LA DONCELLA DE LA NIEBLA' });
  assert.equal(act02.waves[5].perMinute, 0, 'the boss wave fields the boss, not a clock budget');
  // The script's roster: minions in wave 1, mages and siege in 2, walkers in 3
  // and 4, the Maiden in 5 and Yorick in 6.
  assert.deepEqual(Object.keys(act02.waves[0].mix), ['meleeMinion']);
  assert.ok(Object.hasOwn(act02.waves[1].mix, 'mageMinion'));
  assert.ok(Object.hasOwn(act02.waves[1].mix, 'siegeMinion'));
  assert.ok(Object.hasOwn(act02.waves[2].mix, 'mistWalker'));
  assert.ok(Object.hasOwn(act02.waves[3].mix, 'mistWalker'));
});

test('a mini-boss is optional, must exist and must sit before the boss', () => {
  const withoutMiniboss = { ...structuredClone(act02) };
  delete withoutMiniboss.miniboss;
  assert.equal(validateAct(withoutMiniboss).id, 'act-02', 'an act without a mini-boss is valid');
  for (const [label, patch, expected] of [
    ['unknown kind', { kind: 'nope' }, /unknown miniboss kind/],
    ['no name', { name: ' ' }, /miniboss name is required/],
    ['on the boss wave', { wave: 6 }, /miniboss must be before the boss wave/],
    ['invalid wave', { wave: 0 }, /invalid miniboss wave/],
  ]) {
    const act = structuredClone(act02);
    act.miniboss = { ...act.miniboss, ...patch };
    assert.throws(() => validateAct(act), expected, label);
  }
  const notAnObject = structuredClone(act02);
  notAnObject.miniboss = 'maiden';
  assert.throws(() => validateAct(notAnObject), /miniboss must be an object/);
});
