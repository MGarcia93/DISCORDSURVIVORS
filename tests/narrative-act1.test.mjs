import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, campaignCatalogURLs, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import { ScenePlayer, validateScene } from '../src/narrative/runtime.mjs';
import { WaveDirector } from '../src/narrative/director.mjs';
import { createRun } from '../src/engine.mjs';
import act01 from '../src/campaign/act-01-zomboid.mjs';

// The act ships its own manifest: these tests run the real files through the
// real loader, so a broken scene fails here instead of mid-run.
const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalogFor = () => loadCatalog({ urls: [manifestURL, actManifestURL(act01)], fetcher });
const ACT_SCENES = ['act-01-arrival', 'act-01-wave-4-alarm', 'act-01-boss-intro', 'act-01-boss-defeat', 'act-01-jhony', 'act-01-epilogue'];

test('the act registers its six cinematics and every scene validates', async () => {
  const catalog = await catalogFor();
  assert.deepEqual(ACT_SCENES, catalog.entries.filter(entry => entry.id.startsWith('act-01-')).map(entry => entry.id));
  assert.ok(catalog.entries.every(entry => !entry.error), catalog.entries.map(entry => entry.error).filter(Boolean).join('; '));
  assert.equal(catalog.bindings.length, 6);
  assert.equal(catalog.banter.length, 2);
  assert.ok(catalog.sounds.alarm && catalog.sounds.gunshot, 'the act brings its own alarm and shots');
});

test('every portrait the act resolves points at a file that exists', async () => {
  const catalog = await catalogFor();
  assert.ok(catalog.characters['maxi-negro'].expressions.tired.endsWith('/assets/narrative/portraits/negro/tired.svg'),
    'expressions resolve from characters.json, not from the act manifest folder');
  for (const [id, character] of Object.entries(catalog.characters)) {
    for (const [expression, href] of Object.entries(character.expressions)) {
      const url = new URL(href);
      if (url.protocol !== 'file:') continue;
      await assert.doesNotReject(readFile(url), `${id}.${expression} → ${href}`);
    }
  }
});

test('the development viewer loads every campaign manifest, so a new act appears on its own', async () => {
  const urls = campaignCatalogURLs();
  const listed = urls.map(String);
  assert.ok(listed.includes(String(manifestURL)));
  assert.ok(listed.includes(String(actManifestURL(act01))));
  const catalog = await loadCatalog({ urls, fetcher });
  for (const id of ACT_SCENES) assert.ok(catalog.entries.some(entry => entry.id === id), `${id} is previewable`);
  assert.ok(catalog.entries.every(entry => !entry.error));
});

test('every act line is quoted from the approved script', async () => {
  const catalog = await catalogFor();
  const script = (await readFile(new URL('../context/historia/Discord_Survivors_Acto_1_Project_Zomboid.md', import.meta.url), 'utf8')).toLowerCase();
  const lines = [];
  for (const entry of catalog.entries.filter(item => item.id.startsWith('act-01-'))) {
    for (const step of entry.scene.steps) {
      if (step.type === 'dialogue') lines.push(...step.lines.map(line => line.text));
      if (step.type === 'notice') lines.push(step.title, ...step.lines);
    }
  }
  assert.ok(lines.length > 25, 'the act really carries dialogue');
  for (const line of lines) assert.ok(script.includes(line.toLowerCase()), `not in the approved script: ${line}`);
});

test('the epilogue answers the League announcement with Jhony refusing it', async () => {
  const catalog = await catalogFor();
  const epilogue = catalog.entries.find(entry => entry.id === 'act-01-epilogue').scene;
  const spoken = epilogue.steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  assert.deepEqual(spoken.slice(-3), [
    { speaker: 'jhony', expression: 'angry', text: '¡AL LOL NO JUEGO NI EN PEDO!' },
    { speaker: 'maxi-negro', expression: 'surprised', text: '¡¿Y ESO POR QUÉ, PORQUE NO TOMASTE?!' },
    { speaker: 'jhony', expression: 'angry', text: '¡TOMO LO QUE QUIERO, NEGRO PUTO! ¡AL LOL NO JUEGO SOBRIO!' },
  ]);
});

test('the act stages enemies instead of describing them', async () => {
  const catalog = await catalogFor();
  const scene = id => catalog.entries.find(entry => entry.id === id).scene;
  const actorsOf = id => Object.values(scene(id).stage.actors);
  const enemies = actorsOf('act-01-arrival').filter(actor => actor.enemy);
  assert.equal(enemies.length, 2, 'two zombies walk into the arrival');
  assert.ok(scene('act-01-arrival').steps.some(step => step.type === 'move' && step.actor === 'shambler'), 'and one really walks');
  const corpses = actorsOf('act-01-jhony').filter(actor => actor.state === 'dead');
  assert.equal(corpses.length, 9, 'the veteran stands on a street full of bodies');
  assert.equal(actorsOf('act-01-boss-defeat').find(actor => actor.enemy === 'alarmZombie').state, 'dead');
});

test('the shot is a noise burst and the zombies enter from outside the frame', async () => {
  const catalog = await catalogFor();
  assert.equal(catalog.sounds.gunshot.noise, true, 'a shot is noise, not a beep');
  const scene = id => catalog.entries.find(entry => entry.id === id).scene;
  // At the widest zoom each scene uses before the walk, the start point is out.
  const arrival = scene('act-01-arrival');
  const arrivalRight = Math.min(1144, arrival.stage.points.ground[0] + 1144 / (2 * 1.2));
  assert.ok(arrival.stage.points[arrival.stage.actors.shambler.at][0] > arrivalRight, 'the first zombie starts off the right edge');
  const jhony = scene('act-01-jhony');
  assert.ok(jhony.stage.points[jhony.stage.actors.walker.at][1] > 748, 'the only living zombie starts below the canvas');
  const alive = Object.entries(jhony.stage.actors).filter(([, actor]) => actor.enemy && actor.state !== 'dead');
  assert.deepEqual(alive.map(([id]) => id), ['walker'], 'everyone else on that street is already dead');
});

test('Jhony actually shoots one down in front of the player', async () => {
  const catalog = await catalogFor();
  const steps = catalog.entries.find(entry => entry.id === 'act-01-jhony').scene.steps;
  const shot = steps.findIndex(step => step.type === 'sound' && step.sound === 'gunshot');
  assert.ok(shot > 0, 'the shot is staged');
  assert.deepEqual(steps[shot + 1], { type: 'down', actor: 'walker' }, 'and the zombie drops right after it');
});

test('a down step kills an enemy and refuses a cast member', () => {
  const characters = { guide: { expressions: { neutral: 'x.svg' } } };
  const enemies = { zombie: {} };
  const stage = { points: { a: [10, 10] }, actors: { z: { enemy: 'zombie', at: 'a' }, guide: { character: 'guide', at: 'a' } } };
  const player = new ScenePlayer({ id: 'probe', stage, steps: [{ type: 'down', actor: 'z' }] }, { characters, enemies });
  assert.equal(player.actors.z.dead, true);
  assert.throws(() => validateScene({ id: 'probe', stage, steps: [{ type: 'down', actor: 'guide' }] }, { characters, enemies }),
    /Only an enemy actor can go down: guide/);
});

test('an enemy actor must name a real kind and a real state', () => {
  const stage = { points: { a: [10, 10] }, actors: { z: { enemy: 'dragon', at: 'a' } } };
  assert.throws(() => validateScene({ id: 'probe', stage, steps: [] }, { enemies: { zombie: {} } }), /Unknown enemy actor: z/);
  const asleep = { id: 'probe', stage: { ...stage, actors: { z: { enemy: 'zombie', at: 'a', state: 'asleep' } } }, steps: [] };
  assert.throws(() => validateScene(asleep, { enemies: { zombie: {} } }), /Invalid enemy state: z/);
});

test('the arrival scene owns the first wave and releases it when done', async () => {
  const catalog = await catalogFor();
  const director = new WaveDirector(catalog);
  const run = createRun(() => 0.5);
  director.attach(run);
  assert.equal(director.blocked, true, 'the pre-scene takes the first wave');
  assert.equal(director.player.scene.id, 'act-01-arrival');
  for (let i = 0; i < 30 && !director.player.dialogue; i++) director.tick(0.1);
  assert.equal(director.player.dialogue.text, '¿Qué carajo...?');
  director.skip();
  assert.equal(director.blocked, false, 'combat gets the wave back');
  assert.ok(director.seen.has('act-01-arrival'));
});

test('the boss boundary plays the defeat, the veteran and the epilogue in order', async () => {
  const catalog = await catalogFor();
  const director = new WaveDirector(catalog);
  const run = createRun(() => 0.5);
  run.wave = 6;
  run.phase = 'won';
  director.attach(run);
  director.observe();
  const played = [];
  for (let i = 0; i < 6 && director.blocked; i++) {
    played.push(director.player.scene.id);
    director.skip();
  }
  assert.deepEqual(played, ['act-01-boss-defeat', 'act-01-jhony', 'act-01-epilogue']);
  assert.equal(director.blocked, false);
});

test('the act schedules its wave comments once per run', async () => {
  const catalog = await catalogFor();
  const director = new WaveDirector(catalog);
  const run = createRun(() => 0.5);
  director.attach(run);
  director.skip(); // release the opening scene so the wave can run
  run.wave = 2;
  run.time = 8;
  director.tick(0.1);
  assert.equal(director.banter.current.text, '¿Eh? ¿Hay otro boludo vivo por acá?');
  run.time = 40;
  director.tick(0.1);
  assert.equal(director.due.size, 1, 'the same comment never fires twice');
  run.wave = 5;
  run.time = 8;
  director.tick(0.1);
  assert.equal(director.due.size, 2);
  assert.equal(director.banter.queue.length + (director.banter.current ? 1 : 0), 2);
});

test('an act can show a system notice without a portrait', async () => {
  const catalog = await catalogFor();
  const scene = { id: 'probe', steps: [{ type: 'notice', title: 'ADMINISTRADOR', lines: ['Dificultad ajustada.'], duration: 2 }] };
  validateScene(scene, { characters: catalog.characters, sounds: {}, backgrounds: catalog.backgrounds });
  const player = new ScenePlayer(scene, { characters: catalog.characters });
  assert.equal(player.notice.title, 'ADMINISTRADOR');
  player.tick(2);
  assert.equal(player.notice, null);
  assert.equal(player.status, 'completed');
  const nested = { id: 'probe', steps: [{ type: 'parallel', steps: [{ type: 'notice', title: 'X', lines: ['y'], duration: 1 }] }] };
  assert.throws(() => validateScene(nested, {}), /Notice is not allowed inside parallel actions/);
});
