import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import act03 from '../src/campaign/act-03-inferno.mjs';
import { ScenePlayer } from '../src/narrative/runtime.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';
import { createPresenter } from '../src/narrative/presenter.mjs';

// Act 3 ships its own manifest. These tests run the real files through the real
// loader, so a broken scene or a paraphrased line fails here and not mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act03)], fetcher });
const ACT_SCENES = ['act-03-arrival', 'act-03-papasito', 'act-03-loot', 'act-03-zir',
  'act-03-boss-intro', 'act-03-boss-defeat', 'act-03-epilogue'];

test('the act registers its seven cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(ACT_SCENES, catalog.entries.filter(entry => entry.id.startsWith('act-03-')).map(entry => entry.id));
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 7);
  assert.ok(catalog.banter.length >= 8, 'the walk to the boss carries the act banter');
});

test('every act three line is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const script = (await readFile(new URL('../context/historia/Discord_Survivors_Acto_3_Diablo.md', import.meta.url), 'utf8')).toLowerCase();
  const lines = [];
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-03-'))) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      if (step.type === 'notice') lines.push(...step.lines);
    }
  }
  lines.push(...catalog.banter.map(line => line.text));
  assert.ok(lines.length > 40, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the act three speakers and expressions exist in the catalog', async () => {
  const catalog = await catalogFor();
  const steps = catalog.entries.filter(entry => entry.id.startsWith('act-03-')).flatMap(entry => entry.scene.steps);
  const spoken = steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  const speakers = new Set([...spoken.map(line => line.speaker), ...catalog.banter.map(line => line.speaker)]);
  for (const speaker of speakers) assert.ok(catalog.characters[speaker], `unknown speaker: ${speaker}`);
  for (const line of [...spoken, ...catalog.banter]) {
    if (!line.expression) continue;
    assert.ok(catalog.characters[line.speaker].expressions[line.expression],
      `${line.speaker} has no ${line.expression} portrait`);
  }
});

test('Papasito is found on wave three and Zir and Lilith close their waves', async () => {
  const catalog = await catalogFor();
  const papasito = catalog.bindings.find(binding => binding.scene === 'act-03-papasito');
  assert.deepEqual({ when: papasito.when, wave: papasito.wave }, { when: 'before_wave', wave: 3 });
  const scene = catalog.entries.find(entry => entry.id === 'act-03-papasito').scene;
  assert.ok(scene.steps.some(step => step.type === 'notice'
    && step.lines.includes('¡PAPASITO DESBLOQUEADO!')), 'the unlock announcement is staged');
  assert.equal(act03.miniboss.wave, 5);
  assert.equal(act03.miniboss.kind, 'lordZir');
  assert.equal(act03.boss.wave, 6);
  assert.equal(act03.boss.kind, 'lilith');
});

test('the mini-boss and the boss each get their own scene before their wave', async () => {
  const catalog = await catalogFor();
  const zir = catalog.bindings.find(binding => binding.scene === 'act-03-zir');
  const boss = catalog.bindings.find(binding => binding.scene === 'act-03-boss-intro');
  assert.deepEqual({ when: zir.when, wave: zir.wave }, { when: 'before_wave', wave: 5 });
  assert.deepEqual({ when: boss.when, wave: boss.wave }, { when: 'before_wave', wave: 6 });
  const zirScene = catalog.entries.find(entry => entry.id === 'act-03-zir').scene;
  assert.equal(zirScene.stage.actors.zir.character, 'lord-zir');
  const bossScene = catalog.entries.find(entry => entry.id === 'act-03-boss-intro').scene;
  assert.equal(bossScene.stage.actors.lilith.character, 'lilith');
  assert.equal(bossScene.stage.actors.zir.state, 'dead');
});

test('the complete cast can initialize the presenter, including both act three bosses', async () => {
  const catalog = await catalogFor();
  const content = { innerHTML: '', querySelectorAll: () => [] };
  const root = { innerHTML: '', querySelector: key => key === '.narrative-content' ? content : {} };
  assert.doesNotThrow(() => createPresenter(root, catalog, assert.fail));
});

test('the Zir scene keeps the party on the left and the boss on the right', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-03-zir').scene;
  const player = new ScenePlayer(scene, catalog);
  const assertSpacing = () => {
    for (const id of ['negro', 'solago', 'papasito']) {
      assert.ok(player.actors[id].x <= 1144 * 0.45, `${id} stays on the left`);
      assert.ok(player.actors.zir.x - player.actors[id].x >= 350, `${id} stays clear of Zir`);
    }
    assert.ok(player.actors.zir.x >= 1144 * 0.8, 'Zir stays on the right');
  };
  let bossDialogue = false;
  for (let tick = 0; tick < 2000 && player.active; tick++) {
    assertSpacing();
    if (player.dialogue) {
      if (player.dialogue.speaker === 'lord-zir') {
        bossDialogue = true;
        assert.equal(player.camera.zoom, 1, 'the conversation uses a wide shot');
      }
      player.advance();
    } else player.tick(0.1);
  }
  assert.equal(player.status, 'completed');
  assert.equal(bossDialogue, true);
  assertSpacing();
  const skipped = new ScenePlayer(scene, catalog);
  skipped.skip();
  assert.deepEqual(skipped.actors, player.actors, 'skip keeps the separated positions');
});

test('all seven cinematics play and skip with the same final staging and effects', async () => {
  const catalog = await catalogFor();
  for (const id of ACT_SCENES) {
    const { scene, actions } = catalog.entries.find(entry => entry.id === id);
    assert.ok(scene.steps.some(step => step.type === 'camera' || step.type === 'parallel' && step.steps.some(child => child.type === 'camera')), `${id} has a camera beat`);
    const make = (effects, sounds) => new ScenePlayer(scene, { ...catalog, actions, onEffect: effect => effects.push(effect), onSound: sound => sounds.push(sound) });
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

test('Papasito reacts before entering, returns to loot, then rejoins the party', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-03-papasito').scene;
  const lines = scene.steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines.map(line => line.text));
  assert.ok(lines.includes('Bueno, vamos.'));
  assert.equal(lines.filter(text => text === '¡PAPASITO!').length, 2);
  const reaction = scene.steps.findIndex(step => step.lines?.some(line => line.text === '¿Tomi? ¿Dónde?'));
  const entrance = scene.steps.findIndex(step => step.type === 'move' && step.actor === 'papasito');
  assert.ok(reaction < entrance);
  assert.ok(scene.steps.some(step => step.type === 'animate' && step.actor === 'papasito' && step.animation === 'kneel'));
});

test('Papasito silently kills the elite and finds the boss loot before the epilogue', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-03-loot').scene;
  const player = new ScenePlayer(scene, catalog);
  player.skip();
  assert.equal(player.actors.elite.dead, true);
  assert.equal(player.actors.negro.x, scene.stage.points.ground[0]);
  const defeat = catalog.entries.find(entry => entry.id === 'act-03-boss-defeat').scene;
  assert.ok(defeat.steps.some(step => step.type === 'animate' && step.actor === 'papasito' && step.animation === 'kneel'));
  const epilogue = catalog.entries.find(entry => entry.id === 'act-03-epilogue').scene;
  assert.deepEqual(epilogue.stage.points[epilogue.stage.actors.papasito.at], defeat.stage.points.loot);
});

test('Papasito collects loot without a green placeholder behind the portraits', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-03-papasito').scene;
  const player = new ScenePlayer(scene, catalog);
  while (!player.dialogue && player.active) player.tick(0.1);
  const rectangles = [];
  const ctx = new Proxy({}, {
    get: (_, key) => key === 'getTransform' ? () => ({ a: 1, d: 1 })
      : key === 'fillRect' ? (...args) => rectangles.push(args) : () => {},
    set: () => true,
  });
  const content = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
  const root = { innerHTML: '', querySelector: key => ({
    canvas: { getContext: () => ctx }, '.narrative-content': content, '.narrative-error': {},
  })[key] };
  const priorDocument = globalThis.document;
  globalThis.document = { activeElement: null };
  try {
    const view = createPresenter(root, catalog, assert.fail);
    view.render(player, null, null);
    const [x, y] = scene.stage.points.loot;
    assert.ok(!rectangles.some(rect => JSON.stringify(rect) === JSON.stringify([x - 25, y - 65, 50, 60])), 'loot is not a placeholder rectangle');
    assert.match(content.innerHTML, /¡PAPASITO!/);
    assert.ok(scene.steps.some(step => step.type === 'move' && step.actor === 'papasito' && step.to === 'loot'));
    assert.ok(scene.steps.some(step => step.type === 'animate' && step.actor === 'papasito' && step.animation === 'kneel'));
    view.dispose();
  } finally {
    if (priorDocument === undefined) delete globalThis.document;
    else globalThis.document = priorDocument;
  }
});

test('the search banter is visible in order during the first two short preview waves', async () => {
  const catalog = await catalogFor();
  assert.ok(catalog.banter.every(line => line.wave <= 2));
  const director = new WaveDirector({ ...catalog, bindings: [] });
  const seen = [];
  for (const wave of [1, 2]) {
    const run = { phase: 'playing', wave, time: 0 };
    director.attach(run);
    let previous;
    for (let time = 0; time < 15; time += 0.1) {
      run.time = time;
      director.tick(0.1);
      const text = director.banter.current?.text;
      if (text && text !== previous) seen.push(text);
      previous = text;
    }
  }
  assert.deepEqual(seen, catalog.banter.map(line => line.text));
});

test('Lilith lies dead alone in the scene after the fight', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-03-boss-defeat').scene;
  assert.equal(scene.stage.actors.lilith.state, 'dead');
  assert.equal(Object.keys(scene.stage.actors).filter(id => scene.stage.actors[id].enemy === 'lilith').length, 1,
    'there is only ever one Lilith on screen');
});

test('no two actors finish a scene on the same spot', async () => {
  const catalog = await catalogFor();
  const walk = (steps, at) => {
    for (const step of steps) {
      if (step.type === 'move' && step.to) at[step.actor] = step.to;
      if (step.type === 'parallel') walk(step.steps, at);
    }
    return at;
  };
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-03-'))) {
    const { actors } = entry.scene.stage;
    const at = walk(entry.scene.steps, Object.fromEntries(Object.entries(actors).map(([id, actor]) => [id, actor.at])));
    const seen = new Map();
    for (const [id, point] of Object.entries(at)) {
      assert.ok(!seen.has(point), `${entry.id}: ${id} ends on the same spot as ${seen.get(point)} (${point})`);
      seen.set(point, id);
    }
  }
});
