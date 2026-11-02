import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/characters/index.mjs';

test('every special declares a unique hotkey and a HUD label; characters declare draw + notes', () => {
  for (const [id, def] of Object.entries(CHARACTERS)) {
    assert.equal(typeof def.draw, 'function', `${id} needs a draw hook`);
    assert.ok(def.gameNote, `${id} needs a game-note`);
    const hotkeys = new Set();
    for (const special of def.specials) {
      assert.ok(special.hotkey, `${id}.${special.key} needs a hotkey`);
      assert.ok(special.name, `${id}.${special.key} needs a HUD label`);
      assert.equal(def.specials.filter(other => other.hotkey === special.hotkey).length, 1,
        `${id} hotkey ${special.hotkey} must be unique`);

      hotkeys.add(special.hotkey);
    }
    assert.ok(hotkeys.size === def.specials.length);
  }
  assert.equal(CHARACTERS.negro.specials.map(s => `${s.key},${s.hotkey},${s.name}`).join('|'),
    'anime,e,Modo Otaku|chair,q,Me da paja');
  assert.equal(CHARACTERS.solago.specials.map(s => `${s.key},${s.hotkey},${s.name}`).join('|'),
    'stand,q,La Patrona');
});

test('every ficha puts the ultimate on Q and the basic ability on E', () => {
  for (const [id, def] of Object.entries(CHARACTERS)) {
    const hotkeys = def.specials.map(special => special.hotkey).sort();
    const expected = def.specials.length === 1 ? ['q'] : ['e', 'q'];
    assert.deepEqual(hotkeys, expected, `${id} must use Q for the ultimate and E for the basic ability`);
  }
});

test('taskHud and regenHud only come from characters that render them', () => {
  assert.equal(typeof CHARACTERS.solago.taskHud, 'function');
  assert.equal(CHARACTERS.negro.taskHud, undefined);
  assert.equal(typeof CHARACTERS.negro.regenHud, 'function');
  assert.equal(typeof CHARACTERS.solago.regenHud, 'function');
});
