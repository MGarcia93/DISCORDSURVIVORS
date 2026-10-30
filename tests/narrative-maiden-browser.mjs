// Optional real-browser regression: serve the repo, then set CHROMIUM_PATH.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openChromium } from './helpers/chromium.mjs';

const browser = await openChromium();
const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const snapshot = `async () => {
  const p = (await import('/src/narrative/integration.mjs')).activeNarrativeHost().director.player;
  return { actors: p.actors, camera: p.camera, dialogue: p.dialogue, status: p.status };
}`;
try {
  await browser.page('Emulation.setDeviceMetricsOverride', { width: 1360, height: 1100, deviceScaleFactor: 1, mobile: false });
  await browser.navigate(`${url}/?dev=narrative`);
  await browser.wait('document.querySelector("#narrative-select option[value=act-02-maiden]")');
  const stored = await browser.evaluate('JSON.stringify(localStorage)');
  await browser.evaluate('document.querySelector("#narrative-select").value="act-02-maiden";document.querySelector("[data-action=narrative-play]").click()');
  await browser.wait('document.querySelector(".narrative-stage-dialog")');
  const before = await browser.evaluate(`(${snapshot})()`);
  await browser.wait(`(async () => {
    const p = (${snapshot});
    return (await p()).actors.negro.x > ${before.actors.negro.x + 160};
  })()`);
  const after = await browser.evaluate(`(${snapshot})()`);
  for (const id of ['negro', 'solago', 'maiden']) {
    assert.ok(after.actors[id].x > before.actors[id].x + 150, `${id} moves during dialogue`);
    assert.equal(after.actors[id].animation, 'walk');
  }
  // The camera eases from the entrance pan rather than snapping to the follow
  // point, so it tracks the runners' midpoint instead of jumping forward.
  const midpoint = (after.actors.negro.x + after.actors.solago.x) / 2;
  assert.ok(Math.abs(after.camera.x - midpoint) < 80, `camera follows the runners (${after.camera.x} vs ${midpoint})`);
  assert.equal(after.dialogue.text, before.dialogue.text, 'reading stays manual');
  assert.equal(await browser.evaluate('document.querySelector(".narrative-portraits")'), null);
  const screen = await browser.page('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(browser.scratch, 'maiden-chase-desktop.png'), Buffer.from(screen.data, 'base64'));
  await browser.page('Emulation.setDeviceMetricsOverride', { width: 480, height: 900, deviceScaleFactor: 1, mobile: true });
  assert.equal(await browser.evaluate('document.querySelector("[data-action=narrative-next]").getBoundingClientRect().width > 0'), true);
  assert.equal(await browser.evaluate(`(async () => {
    const p = (await import('/src/narrative/integration.mjs')).activeNarrativeHost().director.player;
    const canvas = document.querySelector('.narrative-stage').getBoundingClientRect();
    const panel = document.querySelector('.narrative-stage-dialog').getBoundingClientRect();
    return ['negro','solago','maiden'].every(id => canvas.top + p.actors[id].y * canvas.height / 748 < panel.top);
  })()`), true, 'the compact panel does not cover the runners on a narrow screen');
  const mobile = await browser.page('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(browser.scratch, 'maiden-chase-mobile.png'), Buffer.from(mobile.data, 'base64'));
  await browser.evaluate('document.querySelector("[data-action=narrative-next]").click()');
  assert.notEqual((await browser.evaluate(`(${snapshot})()`)).dialogue.text, before.dialogue.text);
  await browser.evaluate('document.querySelector("[data-action=narrative-skip]").click()');
  assert.equal((await browser.evaluate(`(${snapshot})()`)).status, 'skipped');
  await browser.evaluate('document.querySelector("[data-action=narrative-restart]").click()');
  await browser.wait('document.querySelector(".narrative-stage-dialog")');
  assert.equal((await browser.evaluate(`(${snapshot})()`)).dialogue.text, before.dialogue.text);
  assert.equal(await browser.evaluate('JSON.stringify(localStorage)'), stored);
  assert.deepEqual(browser.errors, []);
  console.log('PASS: both runners, pursuit, camera, manual dialogue, mobile controls, skip, restart and isolated storage.');
} finally { await browser.close(); }
