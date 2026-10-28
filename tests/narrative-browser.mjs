// Optional real-browser check; no npm installation required.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openChromium } from './helpers/chromium.mjs';

const browser = await openChromium();
const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
try {
  await browser.page('Emulation.setDeviceMetricsOverride', { width: 1360, height: 1000, deviceScaleFactor: 1, mobile: false });
  await browser.navigate(`${url}/?dev=narrative`);
  await browser.wait('document.querySelector("#narrative-select")?.options.length === 3');
  assert.equal(await browser.evaluate('localStorage.length'), 0);
  await browser.evaluate('document.querySelector("[data-action=narrative-play]").click()');
  await browser.wait('document.querySelector(".narrative-dialog") !== null');
  await browser.wait('[...document.querySelectorAll(".narrative-portrait")].every(img => img.complete && img.naturalWidth > 0)');
  assert.match(await browser.evaluate('document.querySelector(".narrative-text p").textContent'), /sample conversation/);
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }))');
  assert.match(await browser.evaluate('document.querySelector(".narrative-text p").textContent'), /Each line/);
  await browser.evaluate('document.querySelector("[data-action=narrative-restart]").click()');
  assert.match(await browser.evaluate('document.querySelector(".narrative-text p").textContent'), /sample conversation/);
  const desktop = await browser.page('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(browser.scratch, 'portraits.png'), Buffer.from(desktop.data, 'base64'));
  await browser.evaluate('document.querySelector("[data-action=narrative-skip]").click(); document.querySelector("#narrative-select").value="sample-arrival"; document.querySelector("[data-action=narrative-play]").click()');
  await browser.wait('(async () => (await import("/src/narrative/integration.mjs")).activeNarrativeHost().director.player.actors.visitor.x > 180)()');
  await browser.wait('document.querySelector(".narrative-dialog") !== null');
  const pose = await browser.evaluate('(async () => { const p=(await import("/src/narrative/integration.mjs")).activeNarrativeHost().director.player; return { x:p.actors.visitor.x, gate:p.props.gate.state, zoom:p.camera.zoom }; })()');
  assert.deepEqual(pose, { x: 650, gate: 'open', zoom: 1.35 });
  await browser.evaluate('document.querySelector("[data-action=narrative-skip]").click()');
  assert.equal(await browser.evaluate('(async () => (await import("/src/narrative/integration.mjs")).activeNarrativeHost().director.flags["sample-arrival-completed"])()'), true);
  await browser.evaluate('document.querySelector("#narrative-select").value="sample-extension"; document.querySelector("[data-action=narrative-play]").click()');
  await browser.wait('document.querySelector(".narrative-dialog") !== null');
  assert.equal(await browser.evaluate('(async () => (await import("/src/narrative/integration.mjs")).activeNarrativeHost().director.player.props.marker.state)()'), 'highlighted');
  await browser.page('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth > innerWidth'), false);
  const mobile = await browser.page('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(browser.scratch, 'mobile.png'), Buffer.from(mobile.data, 'base64'));
  await browser.evaluate('document.querySelector("[data-action=home]").click()');
  await browser.wait('document.querySelector("#menu-scene") !== null');
  assert.equal(await browser.evaluate('localStorage.length'), 0);
  assert.deepEqual(browser.errors, []);
  console.log('PASS real Chromium: manual portraits, restart/skip, sprite/camera/prop sequence, scene-local extension, responsive viewer, isolated storage and clean exit.');
} finally { await browser.close(); }
