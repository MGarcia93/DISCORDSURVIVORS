import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step } from '../src/engine.mjs';
import { CHARACTERS } from '../src/characters/index.mjs';

// The Jhony feature added hooks inside shared engine code. These pins keep the
// other four fichas reading undefined for every one of them, so an accidental
// behaviour change in the shared path shows up as a failure instead of a silent
// rebalance of the whole cast.
const OTHERS = ['negro', 'solago', 'warrior', 'papazito'];

function contactDamage(id, setup = () => {}) {
  const run = createRun(() => 0.5, id);
  run.spawnIn = 1e9;
  run.enemies.length = 0;
  const p = run.player;
  setup(p);
  run.enemies.push({
    id: 1, x: p.x + 5, y: p.y, hp: 1e6, maxHp: 1e6, speed: 0, radius: 10,
    kind: 'zombie', attackCd: 0, defense: 0,
  });
  const before = p.hp;
  step(run, 0.016, {});
  return before - p.hp;
}

test('the new engine hooks stay undefined for every ficha but the ones that own them', () => {
  // Solago's laugh pays per bite, so `onMeleeHit` is hers now; every other hook
  // still belongs to Jhony alone.
  const OWNED = { solago: ['onMeleeHit'] };
  for (const id of OTHERS) {
    for (const hook of ['onTick', 'onDamaged', 'onMeleeHit', 'passiveDamageMult', 'passiveDefenseMult']) {
      if (OWNED[id]?.includes(hook)) {
        assert.equal(typeof CHARACTERS[id][hook], 'function', `${id}.${hook} is declared on purpose`);
        continue;
      }
      assert.equal(CHARACTERS[id][hook], undefined, `${id}.${hook} must stay undefined`);
    }
    assert.equal(CHARACTERS[id].combat?.hitText, undefined);
    assert.equal(CHARACTERS[id].combat?.hitKind, undefined);
  }
  for (const hook of ['onTick', 'onDamaged', 'onMeleeHit', 'passiveDamageMult', 'passiveDefenseMult']) {
    assert.equal(typeof CHARACTERS.jhony[hook], 'function', `jhony.${hook} is the one that declares it`);
  }
});

test('damage intake keeps the original formula when passiveDefenseMult is absent', () => {
  const setups = [
    ['plain', () => {}],
    ['mitigation cap', p => { p.defense = 0.75; }],
    ['no mitigation', p => { p.defense = 0; }],
  ];
  for (const id of OTHERS) {
    // The raw swing: no mitigation at all, so every other case can be derived
    // from it instead of double-applying the character's own defence.
    const raw = contactDamage(id, p => { p.defense = 0; });
    for (const [label, setup] of setups) {
      let defense = 0;
      const delta = contactDamage(id, p => {
        setup(p);
        defense = p.defense;
      });
      // A sale's defence loss is a stat source now, so it arrives already
      // resolved in `p.defense` and intake keeps exactly one formula.
      const expected = raw * (1 - Math.min(0.75, defense));
      assert.ok(Math.abs(delta - expected) < 1e-9, `${id} ${label}: ${delta} vs ${expected}`);
    }
  }
});

test('a ranged ficha still fires the same damage with no passive multiplier', () => {
  for (const id of ['negro', 'warrior', 'papazito']) {
    const run = createRun(() => 0.5, id);
    run.spawnIn = 1e9;
    const p = run.player;
    run.enemies.length = 0;
    run.enemies.push({ id: 1, x: p.x + p.attackRange * 0.6, y: p.y, hp: 1e6, maxHp: 1e6, speed: 0, radius: 10, kind: 'zombie', defense: 0 });
    run.shotIn = 0.001;
    step(run, 0.016, {});
    const shot = run.projectiles[0];
    const expected = p.damage * (CHARACTERS[id].attack.damageMultiplier ?? 1);
    assert.ok(shot, `${id} fired`);
    assert.ok(Math.abs(shot.damage - expected) < 1e-9, `${id}: ${shot.damage} vs ${expected}`);
  }
});
