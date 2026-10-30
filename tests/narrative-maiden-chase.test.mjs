import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog, manifestURL } from '../src/narrative/catalog.mjs';
import { ScenePlayer, validateScene } from '../src/narrative/runtime.mjs';

const fetcher = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
async function make() {
  const catalog = await loadCatalog({ urls: [manifestURL, new URL('../assets/narrative/acts/act-02/manifest.json', import.meta.url)], fetcher });
  const entry = catalog.entries.find(entry => entry.id === 'act-02-maiden');
  assert.equal(entry.error, null);
  return { player: new ScenePlayer(entry.scene, { ...catalog, actions: entry.actions }), scene: entry.scene };
}
const reachDialogue = player => {
  for (let i = 0; i < 100 && !player.dialogue; i++) player.tick(0.1);
  assert.ok(player.dialogue);
};

test('both friends run from the Maiden while the same manual line stays readable', async () => {
  const { player, scene } = await make();
  assert.deepEqual(scene.stage.size, [3432, 748]);
  reachDialogue(player);
  assert.equal(player.dialogue.layout, 'stage');
  const line = { ...player.dialogue };
  const before = Object.fromEntries(['negro', 'solago', 'maiden'].map(id => [id, { ...player.actors[id] }]));
  player.tick(1);
  assert.deepEqual(player.dialogue, line, 'reading never auto-advances');
  for (const id of Object.keys(before)) {
    assert.ok(player.actors[id].x > before[id].x + 150, `${id} actually travels`);
    assert.equal(player.actors[id].animation, 'walk');
  }
  assert.ok(player.actors.maiden.x < player.actors.negro.x);
  const spoken = scene.steps.filter(step => step.type === 'dialogue').flatMap(step => step.lines);
  for (let i = 0; i < spoken.length; i++) {
    assert.equal(player.dialogue.text, spoken[i].text);
    player.advance();
  }
  player.tick(1);
  assert.equal(player.status, 'completed');
});

test('Solago runs closest to the Maiden and Negro trails him', async () => {
  const { player } = await make();
  reachDialogue(player);
  for (let i = 0; i < 80; i++) {
    assert.ok(player.actors.maiden.x < player.actors.solago.x, 'the Maiden is behind Solago');
    assert.ok(player.actors.solago.x < player.actors.negro.x, 'Negro stays behind Solago');
    assert.ok(Math.abs(player.actors.solago.x - player.actors.maiden.x - 200) < 2, 'Solago keeps the short gap');
    assert.ok(Math.abs(player.actors.negro.x - player.actors.solago.x - 150) < 2, 'Negro keeps the trailing gap');
    player.tick(0.1);
  }
});

test('the chase starts without a cut: the camera eases and nobody teleports', async () => {
  const { player } = await make();
  // Walk the entrance pan one frame at a time and keep the last positions.
  let previous = { camera: player.camera.x, ...Object.fromEntries(['negro', 'solago', 'maiden'].map(id => [id, player.actors[id].x])) };
  let chaseStart = null, worst = 0;
  for (let i = 0; i < 300; i++) {
    player.tick(0.05);
    const now = { camera: player.camera.x, ...Object.fromEntries(['negro', 'solago', 'maiden'].map(id => [id, player.actors[id].x])) };
    for (const key of Object.keys(now)) worst = Math.max(worst, Math.abs(now[key] - previous[key]));
    if (player.dialogue && !chaseStart) chaseStart = { ...now };
    previous = now;
    if (chaseStart && i > 40) break;
  }
  assert.ok(chaseStart, 'the conversation begins');
  // At 230 px/s and a 0.05 s step the cast may advance 11.5 px; a snap is far larger.
  assert.ok(worst < 16, `largest step per frame is ${worst.toFixed(1)} px, not a cut`);
  assert.ok(Math.abs(chaseStart.maiden - 620) < 12, 'the Maiden starts where her entrance left her');
  assert.ok(Math.abs(chaseStart.solago - 820) < 12 && Math.abs(chaseStart.negro - 970) < 12);
  const midpoint = (chaseStart.negro + chaseStart.solago) / 2;
  assert.ok(Math.abs(chaseStart.camera - midpoint) < 90, 'the eased camera tracks the runners');
});


test('the chase stays moving and in frame even when a reader waits past the end of the long lane', async () => {
  const { player } = await make();
  reachDialogue(player);
  let furthestCamera = 0, turned = false;
  for (let i = 0; i < 1800; i++) {
    player.tick(0.1);
    furthestCamera = Math.max(furthestCamera, player.camera.x);
    const { x, y, zoom } = player.camera;
    assert.equal(zoom, 1);
    assert.ok(x - 572 >= 0 && x + 572 <= 3432);
    assert.equal(y, 374);
    for (const id of ['negro', 'solago', 'maiden']) {
      const actor = player.actors[id];
      assert.ok(Math.abs(actor.x - x) < 500, `${id} remains visible`);
      assert.ok(actor.y > 250 && actor.y < 560);
      assert.equal(actor.animation, 'walk');
      if (id === 'solago' && actor.facing < 0) turned = true;
    }
  }
  assert.ok(furthestCamera > 2200, 'the camera actually traverses the extended world');
  assert.ok(turned, 'the cast turns instead of freezing at the boundary');
  assert.equal(player.active, true);
});

test('near misses are presentation only and every terminal path cleans up pursuit', async () => {
  for (const end of ['skip', 'cancel', 'fail']) {
    const { player } = await make();
    reachDialogue(player);
    player.tick(2.7);
    assert.ok(player.flash, 'the Maiden attacks beside the fleeing cast');
    player[end]('probe');
    assert.equal(player.active, false);
    assert.equal(player.dialogue, null);
    assert.equal(player.flash, null);
    assert.deepEqual(player.camera, { x: 572, y: 374, zoom: 1 });
    for (const actor of Object.values(player.actors)) assert.equal(actor.animation, 'idle');
    const positions = structuredClone(player.actors);
    player.tick(5);
    assert.deepEqual(player.actors, positions);
  }
});

test('optional dialogue staging preserves ordinary dialogue and validates the extension', () => {
  const characters = { guide: { expressions: { neutral: 'portrait.png' } } };
  const line = { speaker: 'guide', text: 'Existing line.' };
  const scene = { id: 'probe', steps: [{ type: 'dialogue', lines: [line] }] };
  const player = new ScenePlayer(scene, { characters });
  player.tick(1);
  assert.deepEqual(player.dialogue, { expression: 'neutral', ...line });
  const staged = structuredClone(scene);
  staged.steps[0].staging = 'missing';
  assert.throws(() => validateScene(staged, { characters }), /Unknown dialogue staging/);
  staged.steps[0].staging = undefined;
  staged.steps[0].layout = 'typo';
  assert.throws(() => validateScene(staged, { characters }), /Invalid dialogue layout/);
});
