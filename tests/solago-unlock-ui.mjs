import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).click();
  assert.equal(await page.locator('[data-character="solago"]').isDisabled(), true, 'Solago is locked before a map-one win');
  await page.getByRole('button', { name: '← VOLVER' }).click();

  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.press('u');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Alt');
  assert.equal(await page.locator('[data-character="solago"]').isEnabled(), true, 'The debug key unlocks Solago');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('discord-survivors.progress.v1'))), { version: 1, debugUnlockAll: true });
  assert.match(await page.locator('.roster-note').innerText(), /MODO PRUEBA/);
  await page.locator('[data-character="solago"]').click();
  assert.equal(await page.locator('.detail-panel h2').innerText(), 'SOLAGO');
  const bio = await page.locator('.character-desc').innerText();
  assert.match(bio, /Dientón, sin voz ni voto en su casa/);
  assert.match(bio, /hasta las hijas le sacan las cosas/);
  assert.match(bio, /miedo de que lo vuelvan a apuñalar por la espalda con una tijera/);
  assert.match(await page.locator('.detail-panel').innerText(), /MORDIDA DE PALETA/);
  assert.match(await page.locator('.detail-panel').innerText(), /STAND: ¡LA PATRONA!/);

  await page.getByRole('button', { name: 'QUE EMPIECE EL DESASTRE' }).click();
  await page.getByRole('button', { name: 'SALTAR HISTORIA' }).click();
  assert.equal(await page.locator('#player-name').innerText(), 'SOLAGO');
  assert.equal(await page.locator('[data-special="stand"]').isVisible(), true);
  assert.equal(await page.locator('[data-special="anime"]').count(), 0);
  assert.equal(await page.locator('#task-panel').isVisible(), true);
  await page.keyboard.press('e');
  await page.waitForFunction(() => document.querySelector('[data-special="stand"]')?.disabled === true);
  assert.equal(await page.locator('#task-label').innerText(), '0/8 BAJAS');

  await page.reload();
  await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).click();
  assert.equal(await page.locator('[data-character="solago"]').isEnabled(), true, 'The test unlock persists in local storage');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Solago selection fits mobile');
  console.log('PASS debug key unlocks characters in local storage; Solago melee, Stand and persistence');
  await context.close();
} finally {
  await browser.close();
}
