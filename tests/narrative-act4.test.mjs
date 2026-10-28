import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog } from '../src/narrative/catalog.mjs';
import { ScenePlayer } from '../src/narrative/runtime.mjs';

test('Act 4 rescue preview preserves approved lines and needs no gameplay binding or unlock', async () => {
  const catalog = await loadCatalog({ fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) }) });
  const entry = catalog.entries.find(item => item.id === 'act-04-warrior-rescue-preview');
  assert.ok(entry, 'the rescue is selectable from the viewer catalog');
  assert.equal(entry.error, null);
  assert.deepEqual(catalog.bindings, []);
  assert.deepEqual(entry.scene.steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines.map(line => line.text)), [
    'Bueno, listo. Sos libre.',
    'JAJAJA. ¡Mirá qué lindo! ¡Liberamos un boliviano!',
    '¡VÁYANSE A LA MIERDA!',
    'Dale, vení con nosotros, que tenemos que salir de este juego.',
    '¿Qué? ¿Dejaste algo?',
    'Uh, negro... Me parece que encontró algo.',
  ]);
  const effects = [], player = new ScenePlayer(entry.scene, { ...catalog, onEffect: effect => effects.push(effect) });
  assert.equal(player.props.chains.state, 'bound');
  assert.equal(player.dialogue, null, 'sprite staging happens before conversation');
  player.tick(1.2); player.tick(0.6);
  assert.equal(player.props.chains.state, 'broken');
  assert.equal(player.dialogue.text, 'Bueno, listo. Sos libre.');
  assert.equal(player.actors.negro.x, 580);
  player.skip();
  assert.equal(player.status, 'skipped');
  assert.deepEqual(effects, [{ key: 'preview-warrior-rescue', value: true }], 'only a preview-local flag is produced');
  assert.equal(player.camera.zoom, 1);
});
