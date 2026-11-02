import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER } from '../src/characters/index.mjs';
import { statBlock } from '../src/characters/stat-block.mjs';
import { BASE_STATS, UNIT_PX, DEFENSE_MITIGATION_PER_POINT } from '../src/stats.mjs';

// The card is the only place a player compares fichas, so every ficha has to
// answer the same six questions in the same order: one row that one character
// shows and another drops is a comparison that cannot be made.
const LABELS = ['VIDA', 'DAÑO', 'DEFENSA', 'ALCANCE', 'ATQ/SEG', 'VELOCIDAD'];

const CELL = '<div><b[^>]*>[^<]*</b><small>[^<]*</small></div>';
const BLOCK = new RegExp(`<div class="stats">((?:${CELL})+)</div>`);

function rows(html) {
  return [...html.matchAll(/<div><b([^>]*)>([^<]*)<\/b><small>([^<]*)<\/small><\/div>/g)]
    .map(([, attributes, value, label]) => ({ attributes, value, label }));
}

test('every ficha shows the same six statistics, in the same order', () => {
  for (const ficha of ROSTER) {
    const block = ficha.profile.match(BLOCK);
    assert.ok(block, `${ficha.id} must render the shared statistics block`);
    const cells = rows(block[0]);
    assert.deepEqual(cells.map(cell => cell.label), LABELS, `${ficha.id} shows the shared rows`);
    for (const cell of cells) assert.match(cell.value, /^[+−]?[\d.]+(,\d)?%$|^∞$/, `${ficha.id} ${cell.label}`);
  }
});

test('the card and the engine read the same sheet', () => {
  const percentFor = {
    VIDA: stats => stats.maxHp / BASE_STATS.life * 100,
    DAÑO: stats => stats.damage / BASE_STATS.attack * 100,
    // Mitigation fraction back to the sheet's defense points percentage.
    DEFENSA: stats => stats.defense / DEFENSE_MITIGATION_PER_POINT / BASE_STATS.defense * 100,
    ALCANCE: stats => stats.attackRange / UNIT_PX / BASE_STATS.attackDistance * 100,
    'ATQ/SEG': stats => 100 / stats.shotInterval,
    VELOCIDAD: stats => stats.speed / UNIT_PX / BASE_STATS.moveSpeed * 100,
  };
  for (const ficha of ROSTER) {
    const block = ficha.profile.match(BLOCK)[0];
    for (const cell of rows(block)) {
      const shown = Number(cell.value.replace(/[%+]/g, '').replace('−', '-').replace(/\./g, '').replace(',', '.'));
      const expected = percentFor[cell.label](ficha.stats);
      assert.ok(Math.abs(shown - expected) < 0.05, `${ficha.id} ${cell.label}: card ${shown} vs engine ${expected}`);
    }
  }
});

test('the block signs what moved and flags only what fell below the reference', () => {
  const sheet = { life: 110, attack: 100, defense: 90, attackDistance: 260, attackSpeed: 152, moveSpeed: 3300 };
  const cells = rows(statBlock(sheet));
  assert.equal(cells[0].value, '+110%');
  assert.equal(cells[1].value, '100%', 'the untouched reference carries no sign');
  assert.equal(cells[1].attributes, '');
  assert.equal(cells[2].value, '90%');
  assert.match(cells[2].attributes, /penalty/, 'below the reference reads as a penalty');
  assert.equal(cells[5].value, '+3.300%', 'thousands keep the Spanish grouping');
});

test('a sheet missing a row fails instead of silently showing five', () => {
  assert.throws(() => statBlock({ life: 100, attack: 100, defense: 100, attackDistance: 100, attackSpeed: 100 }),
    /moveSpeed/);
});
