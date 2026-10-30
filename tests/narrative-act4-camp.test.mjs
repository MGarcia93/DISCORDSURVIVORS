import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actManifestURL, loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import { ScenePlayer } from '../src/narrative/runtime.mjs';
import act04 from '../src/campaign/act-04-exiles.mjs';
import { getWorld } from '../src/backgrounds/index.mjs';

const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
async function make() {
  const catalog = await loadCatalog({ urls: [manifestURL, actManifestURL(act04)], fetcher });
  const entry = catalog.entries.find(item => item.id === 'act-04-warrior');
  assert.equal(entry.error, null);
  return { player: new ScenePlayer(entry.scene, { ...catalog, actions: entry.actions }), scene: entry.scene };
}
const at = (player, id) => ({ ...player.actors[id] });
const reachDialogue = player => {
  for (let i = 0; i < 200 && !player.dialogue; i++) player.tick(0.1);
  assert.ok(player.dialogue, 'the arrival beat begins');
};

test('the rescue happens in the wide camp and reaches the wheel before the cell', async () => {
  const { player, scene } = await make();
  assert.equal(scene.stage.background, 'warrior-camp');
  assert.equal(getWorld('warrior-camp').id, 'warrior-camp');
  assert.deepEqual(scene.stage.size, [2744, 748]);
  reachDialogue(player);
  // Stopped at the Wheel of Pain: the cell and its prisoner are still far right.
  assert.equal(player.actors.negro.x, scene.stage.points.approach[0]);
  assert.ok(player.actors.warrior.x > player.actors.negro.x + 800, 'Warrior is not a few steps away');
  assert.ok(player.actors.warrior.x > player.camera.x + 572, 'and he is outside the first frame');
  const prisoners = Object.values(scene.stage.actors).filter(actor => actor.enemy === 'barbarian');
  assert.equal(prisoners.length, 2, 'the wheel is worked by prisoners, not painted hands');
  assert.ok(player.actors['prisoner-a'].x < player.actors.negro.x, 'they stand at the wheel the group stopped at');
});

test('the whole party walks in and then walks to the cell while the camera follows', async () => {
  const { player } = await make();
  const start = { negro: at(player, 'negro').x, solago: at(player, 'solago').x, papasito: at(player, 'papasito').x };
  reachDialogue(player);
  for (const id of ['negro', 'solago', 'papasito']) {
    assert.ok(player.actors[id].x > start[id] + 300, `${id} walks into the camp`);
    assert.ok(Math.abs(player.camera.x - player.actors.negro.x) < 620, 'the camera stays with the group');
  }
  const before = { negro: at(player, 'negro').x, camera: player.camera.x };
  while (player.dialogue) player.advance();
  player.tick(2.9);
  assert.ok(player.actors.negro.x > before.negro + 700, 'the party crosses the camp to the cell');
  assert.ok(player.camera.x > before.camera + 700, 'and the camera crosses it too');
  for (const id of ['negro', 'solago', 'papasito']) assert.equal(player.actors[id].animation !== 'walk', false, `${id} is walking`);
});

test('the recognition beat is a compact stage panel; the rest stays in portraits', async () => {
  const { player, scene } = await make();
  reachDialogue(player);
  assert.equal(player.dialogue.text, 'Pará... ¿qué?');
  assert.equal(player.dialogue.layout, 'stage', 'the arrival keeps the cast visible');
  const dialogues = scene.steps.filter(step => step.type === 'dialogue');
  assert.equal(dialogues.filter(step => step.layout === 'stage').length, 1, 'only the arrival switches layout');
  for (const step of dialogues.slice(1)) assert.equal(step.layout, undefined);
  player.advance(); player.advance(); player.advance();
  assert.equal(player.dialogue, null);
  assert.ok(player.actors.warrior.dead === false);
});

test('Warrior points at the smoking building before the camera reveals it', async () => {
  const { player, scene } = await make();
  const point = scene.steps.findIndex(step => step.type === 'animate' && step.actor === 'warrior' && step.animation === 'point');
  const reveal = scene.steps.findIndex(step => step.type === 'camera' && step.to === 'lab');
  assert.ok(point > 0 && reveal > point, 'the gesture comes before the reveal');
  const release = scene.steps.findIndex(step => step.type === 'prop' && step.prop === 'cell' && step.state === 'open');
  assert.ok(point > release, 'and after the cell opens');
  player.skip();
  assert.equal(player.props.cell.state, 'open');
  assert.equal(player.actors.arquero.dead, true);
  assert.deepEqual(player.camera, { x: 572, y: 374, zoom: 1 });
});
