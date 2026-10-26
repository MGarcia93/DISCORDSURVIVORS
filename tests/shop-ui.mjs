import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const errors = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
    await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).click();
    await page.getByRole('button', { name: 'QUE EMPIECE EL DESASTRE' }).click();
    await page.getByRole('button', { name: 'SALTAR HISTORIA' }).click();
    await page.clock.runFor(61_000);
    await page.locator('.shop-dialog').waitFor();

    assert.equal(await page.locator('[data-upgrade]').count(), 6, 'All six upgrades are offered');
    assert.equal(await page.locator('[data-upgrade]:not([disabled])').count(), 6, 'The first shop is affordable');
    const next = page.locator('.shop-footer .primary');
    const nextBox = await next.boundingBox();
    const dialogBox = await page.locator('.shop-dialog').boundingBox();
    assert.ok(nextBox && dialogBox && nextBox.y + nextBox.height <= dialogBox.y + dialogBox.height + 1, 'Continue button must stay inside the shop panel');
    assert.equal(await next.isVisible(), true);

    await page.locator('[data-upgrade="damage"]').click();
    await page.locator('[data-upgrade="damage"]').click();
    assert.match(await page.locator('[data-upgrade="damage"] small').innerText(), /NIVEL 2\/4/);
    assert.ok(Number((await page.locator('#coins').innerText()).replace(/\D/g, '')) > 0, 'Purchases leave coins');

    await page.locator('.shop-footer .primary').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.overlay').count(), 0, 'Continue leaves the shop');
    assert.equal(await page.locator('#timer').innerText(), '00:59');
    assert.equal(await page.locator('#wave-title').innerText(), 'OLEADA 02 / 04');
    console.log(`PASS shop: ${mobile ? 'mobile' : 'desktop'}`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
