// Optional end-to-end check. Playwright is a test tool, not a game dependency.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).waitFor();
  assert.equal(await page.locator('#menu-scene').evaluate(canvas => canvas.width === 480 && getComputedStyle(canvas).imageRendering === 'pixelated'), true);
  await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).click();
  assert.equal(await page.locator('.locked-card').count(), 6);
  await page.getByRole('button', { name: 'QUE EMPIECE EL DESASTRE' }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'CONTINUAR' }).click();
  await page.getByRole('button', { name: 'ENTRAR AL CAOS' }).click();
  await page.waitForFunction(() => document.querySelector('#timer')?.textContent === '00:59');
  await page.keyboard.press('q');
  await page.waitForFunction(() => document.querySelector('[data-special="anime"]')?.disabled);
  await page.keyboard.press('e');
  await page.waitForFunction(() => document.querySelector('[data-special="chair"]')?.disabled);
  await page.getByRole('button', { name: 'PAUSA', exact: false }).click();
  await page.getByRole('dialog', { name: 'Partida pausada' }).waitFor();
  const timer = await page.locator('#timer').textContent();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('#timer').textContent(), timer);
  await page.getByRole('button', { name: 'SEGUIR JUGANDO' }).click();
  await page.waitForFunction(() => !document.querySelector('.overlay'));
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Partida pausada' }).waitFor();
  await page.getByRole('button', { name: 'SALIR AL INICIO' }).click();
  await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).waitFor();
  console.log('PASS desktop: start, character, story, combat, abilities, pause/resume, exit');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.getByRole('button', { name: 'EMPEZAR PARTIDA' }).click();
  await mobile.getByRole('button', { name: 'QUE EMPIECE EL DESASTRE' }).click();
  await mobile.getByRole('button', { name: 'SALTAR HISTORIA' }).click();
  await mobile.locator('canvas').waitFor();
  assert.equal(await mobile.getByRole('button', { name: 'Arriba', exact: true }).isVisible(), true);
  const up = await mobile.getByRole('button', { name: 'Arriba', exact: true }).boundingBox();
  await mobile.touchscreen.tap(up.x + up.width / 2, up.y + up.height / 2);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log('PASS mobile: responsive layout, story skip, arena, touch controls');
  assert.deepEqual(errors, []);
  console.log('PASS no browser runtime errors');
} finally {
  await browser.close();
}
