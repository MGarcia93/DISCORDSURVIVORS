import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import act04 from '../src/campaign/act-04-exiles.mjs';
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

// Act 4 ships its own manifest. These tests run the real files through the real
// loader, so a broken scene or a paraphrased line fails here and not mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act04)], fetcher });
const ACT_SCENES = ['act-04-arrival', 'act-04-warrior', 'act-04-lotus', 'act-04-alchemist',
  'act-04-lab-after', 'act-04-boss', 'act-04-defeat', 'act-04-epilogue'];
const actEntries = catalog => catalog.entries.filter(entry => ACT_SCENES.includes(entry.id));

test('the act registers its eight cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(actEntries(catalog).map(entry => entry.id), ACT_SCENES);
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 8);
  assert.ok(catalog.banter.length >= 20, 'the six waves carry the act banter');
});

test('every act four line is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const scriptRaw = await readFile(new URL('../context/historia/Discord_Survivors_Acto_4_Conan_Exiles.md', import.meta.url), 'utf8');
  // The script marks speakers and emphasis with Markdown; the catalog carries
  // the same words without it, so both sides are normalised before comparing.
  const script = scriptRaw.toLowerCase().replace(/\*\*/g, '').replace(/^>\s?/gm, '');
  const lines = [];
  for (const entry of actEntries(catalog)) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      if (step.type === 'notice') lines.push(...step.lines);
    }
  }
  lines.push(...catalog.banter.map(line => line.text));
  assert.ok(lines.length > 90, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the act four speakers and expressions exist in the catalog', async () => {
  const catalog = await catalogFor();
  const steps = actEntries(catalog).flatMap(entry => entry.scene.steps);
  const spoken = steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  const speakers = new Set([...spoken.map(line => line.speaker), ...catalog.banter.map(line => line.speaker)]);
  for (const speaker of speakers) assert.ok(catalog.characters[speaker], `unknown speaker: ${speaker}`);
  for (const line of [...spoken, ...catalog.banter]) {
    if (!line.expression) continue;
    assert.ok(catalog.characters[line.speaker].expressions[line.expression],
      `${line.speaker} has no ${line.expression} portrait`);
  }
});

test('Warrior is rescued on wave three and the cell opens before the unlock', async () => {
  const catalog = await catalogFor();
  const binding = catalog.bindings.find(item => item.scene === 'act-04-warrior');
  assert.deepEqual({ when: binding.when, wave: binding.wave }, { when: 'before_wave', wave: 3 });
  const { scene, actions } = catalog.entries.find(entry => entry.id === 'act-04-warrior');
  const player = new ScenePlayer(scene, { ...catalog, actions });
  assert.equal(player.props.cell.state, 'locked');
  assert.equal(player.actors.esclavista.character, 'esclavista');
  assert.equal(player.actors.arquero.enemy, 'archer');
  while (!player.dialogue && player.active) player.tick(0.1);
  assert.equal(player.dialogue.text, 'Pará... ¿qué?');
  player.skip();
  assert.equal(player.props.cell.state, 'open');
  assert.equal(player.actors.arquero.dead, true);
  assert.ok(scene.steps.some(step => step.type === 'splash' && step.speaker === 'warrior'
    && step.text.includes('¡WARRIOR DESBLOQUEADO!')));
  assert.equal(act04.miniboss.wave, 5);
  assert.equal(act04.miniboss.kind, 'lotusAlchemist');
  assert.equal(act04.boss.wave, 6);
  assert.equal(act04.boss.kind, 'taskmaster');
});

test('the mini-boss and the boss each get their own scene before their wave', async () => {
  const catalog = await catalogFor();
  const alchemist = catalog.bindings.find(item => item.scene === 'act-04-alchemist');
  const boss = catalog.bindings.find(item => item.scene === 'act-04-boss');
  const defeat = catalog.bindings.find(item => item.scene === 'act-04-defeat');
  assert.deepEqual({ when: alchemist.when, wave: alchemist.wave }, { when: 'before_wave', wave: 5 });
  assert.deepEqual({ when: boss.when, wave: boss.wave }, { when: 'before_wave', wave: 6 });
  assert.deepEqual({ when: defeat.when, wave: defeat.wave }, { when: 'after_wave', wave: 6 });
  const alchemistScene = catalog.entries.find(entry => entry.id === 'act-04-alchemist').scene;
  assert.equal(alchemistScene.stage.actors.alquimista.character, 'lotus-alchemist');
  const bossScene = catalog.entries.find(entry => entry.id === 'act-04-boss').scene;
  assert.equal(bossScene.stage.actors.capataz.character, 'taskmaster');
  const defeatScene = catalog.entries.find(entry => entry.id === 'act-04-defeat').scene;
  assert.equal(defeatScene.stage.actors.capataz.state, 'dead');
});

test('the boss scene keeps the party on the left and the taskmaster on his wheel', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-04-boss').scene;
  const player = new ScenePlayer(scene, catalog);
  const assertSpacing = () => {
    for (const id of ['negro', 'solago', 'papasito']) {
      assert.ok(player.actors[id].x <= 1144 * 0.5, `${id} stays on the left`);
      assert.ok(player.actors.capataz.x - player.actors[id].x >= 350, `${id} stays clear of the taskmaster`);
    }
    assert.ok(player.actors.capataz.x >= 1144 * 0.8, 'the taskmaster stays on the wheel side');
  };
  let bossLine = false;
  for (let tick = 0; tick < 2000 && player.active; tick++) {
    assertSpacing();
    if (player.dialogue) {
      if (player.dialogue.speaker === 'taskmaster') bossLine = true;
      player.advance();
    } else player.tick(0.1);
  }
  assert.equal(player.status, 'completed');
  assert.equal(bossLine, true, 'the taskmaster speaks with his own portrait');
  assertSpacing();
  const skipped = new ScenePlayer(scene, catalog);
  skipped.skip();
  assert.deepEqual(skipped.actors, player.actors, 'skip keeps the separated positions');
});

test('all eight cinematics play and skip with the same final staging and effects', async () => {
  const catalog = await catalogFor();
  for (const id of ACT_SCENES) {
    const { scene, actions } = catalog.entries.find(entry => entry.id === id);
    const hasCamera = scene.steps.some(step => step.type === 'camera'
      || step.type === 'parallel' && step.steps.some(child => child.type === 'camera'));
    assert.ok(hasCamera, `${id} has a camera beat`);
    const make = (effects, sounds) => new ScenePlayer(scene, {
      ...catalog, actions, onEffect: effect => effects.push(effect), onSound: sound => sounds.push(sound),
    });
    const effects = [], sounds = [], skippedEffects = [], skippedSounds = [];
    const player = make(effects, sounds);
    for (let tick = 0; tick < 20000 && player.active; tick++) {
      if (player.dialogue) player.advance();
      else player.tick(0.1);
    }
    assert.equal(player.status, 'completed', `${id}: ${player.error}`);
    const skipped = make(skippedEffects, skippedSounds);
    skippedSounds.length = 0; // Construction may already play the first cue.
    skipped.skip();
    assert.equal(skipped.status, 'skipped', id);
    assert.deepEqual(skipped.actors, player.actors, `${id}: skip preserves final actor state`);
    assert.deepEqual(skipped.props, player.props, `${id}: skip preserves final prop state`);
    assert.deepEqual(skippedEffects, effects);
    assert.deepEqual(skippedSounds, [], `${id}: skip suppresses remaining cues`);
    assert.ok(sounds.length, `${id} has sound staging`);
  }
});

test('no two actors finish an act four scene on the same spot', async () => {
  const catalog = await catalogFor();
  const walk = (steps, at) => {
    for (const step of steps) {
      if (step.type === 'move' && step.to) at[step.actor] = step.to;
      if (step.type === 'parallel') walk(step.steps, at);
    }
    return at;
  };
  for (const entry of actEntries(catalog)) {
    const { actors } = entry.scene.stage;
    const at = walk(entry.scene.steps, Object.fromEntries(Object.entries(actors).map(([id, actor]) => [id, actor.at])));
    const seen = new Map();
    for (const [id, point] of Object.entries(at)) {
      assert.ok(!seen.has(point), `${entry.id}: ${id} ends on the same spot as ${seen.get(point)} (${point})`);
      seen.set(point, id);
    }
  }
});
