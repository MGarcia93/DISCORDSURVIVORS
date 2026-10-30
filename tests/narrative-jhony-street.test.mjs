import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ScenePlayer } from '../src/narrative/runtime.mjs';
import { loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import { getWorld } from '../src/backgrounds/index.mjs';

const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
const catalog = () => loadCatalog({ urls: [manifestURL, new URL('../assets/narrative/acts/act-01/manifest.json', import.meta.url)], fetcher });

test('Jhony is discovered beyond the first frame on his own cinematic street', async () => {
  const data = await catalog();
  const entry = data.entries.find(entry => entry.id === 'act-01-jhony');
  assert.equal(entry.error, null);
  const scene = entry.scene;
  assert.equal(scene.stage.background, 'jhony-street');
  assert.equal(getWorld(scene.stage.background).id, 'jhony-street');
  assert.deepEqual(scene.stage.size, [2288, 748]);
  const player = new ScenePlayer(scene, data);
  assert.ok(player.actors.jhony.x > player.camera.x + 572 + 60);
  const initialX = player.actors.negro.x;
  for (let i = 0; i < 60 && !player.dialogue; i++) player.tick(0.1);
  assert.ok(player.dialogue, 'the approach reaches the approved conversation promptly');
  assert.ok(player.actors.negro.x > initialX + 600);
  assert.ok(player.camera.x > 1144);
  assert.ok(Math.abs(player.actors.jhony.x - player.camera.x) < 572);
  assert.ok(Math.abs(player.actors.negro.x - player.camera.x) < 572);
  assert.equal(player.dialogue.text, '¿JHONY? ¡LA CONCHA DE TU MADRE! ¡ESTÁS VIVO!');
  player.skip();
  assert.equal(player.status, 'skipped');
  assert.equal(player.actors.walker.dead, true);
  assert.equal(player.actors['late-b'].dead, true);
  assert.equal(player.actors.negro.x, scene.stage.points.entrance[0]);
});

test('the departure accompanies Negro before returning to Jhony', async () => {
  const data = await catalog();
  const scene = data.entries.find(entry => entry.id === 'act-01-jhony').scene;
  const departure = scene.steps.find(step => step.type === 'parallel'
    && step.steps.some(child => child.actor === 'negro' && child.to === 'entrance'));
  assert.ok(departure);
  const move = departure.steps.find(child => child.type === 'move');
  const camera = departure.steps.find(child => child.type === 'camera');
  assert.equal(camera.to, 'departure-frame');
  assert.equal(camera.duration, move.duration);
});
