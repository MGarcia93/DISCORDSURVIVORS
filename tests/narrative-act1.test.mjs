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
  // Every living zombie starts outside the canvas and walks in; the street
  // itself is already a graveyard.
  const alive = Object.entries(jhony.stage.actors).filter(([, actor]) => actor.enemy && actor.state !== 'dead');
  assert.equal(alive.length, 3, 'one takes the first shot and two more arrive');
  for (const [id, actor] of alive) {
    const [x, y] = jhony.stage.points[actor.at];
    assert.ok(x > 1144 || x < 0 || y > 748 || y < 0, `${id} starts off the frame`);
  }
});

test('Jhony actually shoots one down in front of the player', async () => {
  const catalog = await catalogFor();
  const steps = catalog.entries.find(entry => entry.id === 'act-01-jhony').scene.steps;
  const shot = steps.findIndex(step => step.type === 'sound' && step.sound === 'gunshot');
  assert.ok(shot > 0, 'the shot is staged');
  assert.deepEqual(steps[shot + 1], { type: 'down', actor: 'walker' }, 'and the zombie drops right after it');
  // Two pans: it shows up in the first one and closes in on the second.
  const walks = steps.slice(0, shot).filter(step => step.type === 'parallel' && step.steps.some(child => child.type === 'move' && child.actor === 'walker'));
  assert.equal(walks.length, 2, 'one pan to appear, one to close in');
  for (const walk of walks) assert.ok(walk.steps.some(child => child.type === 'camera'), 'each walk is watched by the camera');
  assert.deepEqual(steps[shot - 1], { type: 'flash', at: 'muzzle', duration: 0.12 }, 'a muzzle flash fires with the shot');
  assert.deepEqual(steps[shot + 2], { type: 'flash', at: 'impact', duration: 0.18 }, 'and the hit sparks on the zombie');
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

test('Jhony shoots the runner first and says the line after it', async () => {
  const catalog = await catalogFor();
  const steps = catalog.entries.find(entry => entry.id === 'act-01-jhony').scene.steps;
  const lastDown = steps.map(step => step.type).lastIndexOf('down');
  const lastLine = steps.map(step => step.type).lastIndexOf('dialogue');
  assert.ok(lastDown >= 0 && lastLine > lastDown, 'the shot closes the action and the line closes the scene');
  assert.match(steps[lastLine].lines[0].text, /NO ME TRAIGAS MÁS ZOMBIES/);
});

test('the shambler comes from below and the runner from far above, a second later', async () => {
  const catalog = await catalogFor();
  const scene = catalog.entries.find(entry => entry.id === 'act-01-jhony').scene;
  const arrival = scene.steps.find(step => step.type === 'parallel' && step.steps.some(child => child.actor === 'late-a'));
  const runner = arrival.steps.find(child => child.actor === 'late-b');
  assert.equal(runner.delay, 1, 'the runner waits a full second');
  assert.ok(arrival.steps.some(child => child.type === 'camera'), 'one pan shows both');
  const [, shamblerY] = scene.stage.points[scene.stage.actors['late-a'].at];
  const [, runnerY] = scene.stage.points[scene.stage.actors['late-b'].at];
  assert.ok(shamblerY > 748, 'the shambler starts below the frame');
  assert.ok(runnerY < -100, 'the runner starts well above it');
  const legs = scene.steps.flatMap(step => (step.type === 'parallel' ? step.steps : [step]));
  const walk = id => legs.filter(child => child.type === 'move' && child.actor === id).at(-1);
  const jhony = scene.stage.points[scene.stage.actors.jhony.at];
  const reach = id => { const [x, y] = scene.stage.points[walk(id).to]; return Math.hypot(x - jhony[0], y - jhony[1]); };
  assert.ok(reach('late-b') > 120, 'the runner stops short of Jhony');
  assert.ok(reach('late-b') < reach('late-a'), 'and still gets closer than the shambler');
});

test('a delayed step does not move before its delay is over', () => {
  const stage = { points: { a: [100, 100], b: [300, 100] }, actors: { guide: { character: 'guide', at: 'a' } } };
  const player = new ScenePlayer({ id: 'probe', stage, steps: [{ type: 'move', actor: 'guide', to: 'b', duration: 1, delay: 0.5 }] },
    { characters: { guide: { expressions: { neutral: 'x.svg' } } } });
  player.tick(0.4);
  assert.equal(player.actors.guide.x, 100, 'still waiting');
  player.tick(0.2);
  assert.ok(player.actors.guide.x > 100 && player.actors.guide.x < 300, 'walking once the delay is over');
  player.tick(1.5);
  assert.equal(player.actors.guide.x, 300, 'completed after the delay');
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
