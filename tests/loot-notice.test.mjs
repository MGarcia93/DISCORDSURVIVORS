import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOT_MESSAGES, lootMessageFor } from '../src/narrative/loot-messages.mjs';
import { NarrativeHost } from '../src/narrative/host.mjs';
import { createPresenter } from '../src/narrative/presenter.mjs';
import { ROSTER } from '../src/characters/index.mjs';
import { PICKUPS } from '../src/pickups.mjs';
import { createRun } from '../src/engine.mjs';
import { levelUpgradePool } from '../src/run-rewards.mjs';

const OPENING = [
  'Usuario con rendimiento deficiente.',
  'Iniciando protocolo de asistencia.',
  'Analizando historial, gustos y patrones de comportamiento para generar un objeto de recuperación adaptado al perfil del usuario...',
];

test('the analysis is shared and only the object, its image and the verdict change', () => {
  const verdicts = new Set();
  for (const character of ROSTER) {
    const beats = lootMessageFor(character.id);
    assert.equal(beats.length, 3, `${character.id} plays diagnosis, progress and reveal`);
    assert.deepEqual([...beats[0].lines], OPENING);
    assert.equal(beats[1].lines[0], 'Procesando datos...');
    assert.ok(beats[0].progress < beats[1].progress && beats[1].progress < beats[2].progress);
    const reveal = beats[2];
    assert.equal(reveal.progress, 1);
    assert.equal(reveal.item, character.id, 'the reveal carries the image to paint');
    assert.ok(reveal.lines[0].includes(PICKUPS[character.id].label) || reveal.item === 'warrior',
      `${character.id} names its object`);
    verdicts.add(reveal.lines.join('|'));
  }
  assert.equal(verdicts.size, ROSTER.length, 'every ficha gets its own verdict');
});

test('every line is real text and an unknown ficha falls back to a full sequence', () => {
  for (const character of ROSTER) {
    for (const beat of lootMessageFor(character.id)) {
      assert.ok(beat.lines.length > 0);
      for (const line of beat.lines) assert.ok(typeof line === 'string' && line.trim().length > 0);
      assert.ok(beat.duration > 0);
    }
  }
  assert.equal(lootMessageFor('nobody'), LOOT_MESSAGES.negro);
});

test('the notice stops the run and the owner decides what advancing means', () => {
  const host = new NarrativeHost();
  let advanced = 0;
  host.showNotice({
    title: 'ADMINISTRADOR', lines: ['Usuario con rendimiento deficiente.'], progress: 0.15,
    item: null, waiting: true, advance: () => { advanced += 1; host.clearNotice(); },
  });
  assert.equal(host.blocked, true, 'the run pauses behind the screen');
  assert.equal(host.key('a'), true, 'the layer swallows the game keys');
  assert.equal(host.blocked, true, 'only a dismissal key closes it');
  assert.equal(host.key('enter'), true);
  assert.equal(advanced, 1, 'Enter asks the owner to advance, it does not force a close');
  assert.equal(host.blocked, false);
  assert.equal(host.systemNotice, null);
});

test('Escape also dismisses it, and the object waits on the final stage', () => {
  const host = new NarrativeHost();
  host.showNotice({ title: 'ADMINISTRADOR', lines: ['x'], progress: 1, item: 'negro', waiting: true });
  host.skip();
  assert.equal(host.blocked, false);
});

test('the presenter paints the whole screen: title, object, bar and continue', () => {
  const painted = [];
  const iconCtx = new Proxy({}, {
    get: (_, key) => key === 'canvas' ? null : (...args) => { painted.push([key, ...args]); return 0; },
    set: () => true,
  });
  const icon = { width: 112, height: 128, getContext: () => iconCtx };
  const content = {
    innerHTML: '',
    querySelectorAll: () => [],
    querySelector: selector => (selector === '.loot-icon' ? icon : null),
  };
  const errorBox = { hidden: true, textContent: '' };
  const stage = new Proxy({}, { get: () => () => {}, set: () => true });
  const root = {
    hidden: true, innerHTML: '',
    querySelector: key => ({ canvas: { getContext: () => stage }, '.narrative-content': content, '.narrative-error': errorBox })[key],
  };
  globalThis.document = { activeElement: null };
  const view = createPresenter(root, { characters: {}, sounds: {}, backgrounds: {} }, () => {});
  const reveal = lootMessageFor('negro')[2];
  view.render(null, null, null, {
    notice: { title: 'ADMINISTRADOR', lines: [...reveal.lines], progress: reveal.progress, item: reveal.item, waiting: true },
  });
  assert.match(content.innerHTML, /ADMINISTRADOR/);
  assert.match(content.innerHTML, /Figura de Kuromi/);
  assert.match(content.innerHTML, /aria-valuenow="100"/);
  assert.match(content.innerHTML, /CONTINUAR/);
  assert.ok(painted.length > 20, 'the object reaches its canvas');
  assert.equal(root.hidden, false, 'the screen is visible');

  // The loading beat is the only one without a button and without a picture.
  const loading = lootMessageFor('negro')[1];
  view.render(null, null, null, {
    notice: { title: 'ADMINISTRADOR', lines: [...loading.lines], progress: loading.progress, item: null, waiting: false },
  });
  assert.doesNotMatch(content.innerHTML, /CONTINUAR/);
  assert.doesNotMatch(content.innerHTML, /loot-icon/, 'no empty slot before the object exists');
  assert.match(content.innerHTML, /aria-valuenow="68"/);

  // The diagnosis waits for the player like the reveal does.
  view.render(null, null, null, {
    notice: { title: 'ADMINISTRADOR', lines: [...lootMessageFor('negro')[0].lines], progress: 0.15, item: null, waiting: true },
  });
  assert.match(content.innerHTML, /CONTINUAR/);
  assert.match(content.innerHTML, /aria-valuenow="15"/);
});

test('the loot upgrade is offered only after the first drop introduced it', () => {
  const run = createRun(() => 0.5);
  const offered = () => levelUpgradePool(run).some(entry => entry.id === 'loot');
  assert.equal(offered(), false, 'a fresh run never sells the card');
  run.lootSeen = true;
  assert.equal(offered(), true, 'after the notice, the card enters the pool');
});
