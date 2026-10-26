import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const errors = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: mobile, isMobile: mobile });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
    assert.equal(await page.locator('.server-rail, .topbar, .footer, .feature-grid, .hero-art').count(), 0, 'No promotional website shell');
    await page.locator('#menu-scene').waitFor();
    assert.equal(await page.locator('#menu-scene').evaluate(canvas => getComputedStyle(canvas).imageRendering), 'pixelated');
    const pixelCheck = await page.evaluate(async () => {
      const { drawElNegro, drawChair, drawZombie, drawAdministrator, drawAnime, PALETTE } = await import('/src/sprites.mjs');
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      let partialAlpha = 0;
      for (const draw of [drawElNegro, drawChair, drawZombie, drawAdministrator, drawAnime]) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, 256, 256);
        ctx.scale(0.5, 0.5);
        draw(ctx, 200.7, 250.3, { time: 1.5 });
        const data = ctx.getImageData(0, 0, 256, 256).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] !== 0 && data[i] !== 255) partialAlpha++;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 256, 256);
      drawElNegro(ctx, 100, 100, { scale: 1 });
      const data = ctx.getImageData(0, 0, 256, 256).data;
      // Check the restored sprite's belly, not an arbitrary total-color quota.
      const belly = [...ctx.getImageData(88, 88, 1, 1).data];
      return { partialAlpha, belly };
    });
    assert.equal(pixelCheck.partialAlpha, 0, 'Sprites must retain hard, non-antialiased pixels');
    assert.deepEqual(pixelCheck.belly, [216, 207, 120, 255], 'The modest belly retains the yellow hoodie');
    await page.getByRole('button', { name: 'CONTROLES', exact: true }).click();
    await page.getByRole('dialog', { name: 'Controles' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'EMPEZAR PARTIDA' }).click();
    await page.locator('#sprite-preview').waitFor();
    assert.equal(await page.locator('.locked-card').count(), 6);
    const description = await page.locator('.character-desc').textContent();
    assert.match(description, /se cree blanco cuando es negro/i);
    assert.match(description, /dice que se baña, pero nadie le cree/i);
    assert.match(description, /coloradas/i);
    assert.match(description, /Hello Kitty Girls/);
    assert.match(description, /sin papá/i);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#sprite-preview').evaluate(canvas => getComputedStyle(canvas).imageRendering), 'pixelated');
    await page.getByRole('button', { name: 'QUE EMPIECE EL DESASTRE' }).click();
    await page.locator('#story-scene').waitFor();
    await page.getByRole('button', { name: 'CONTINUAR', exact: false }).click();
    await page.getByRole('button', { name: 'CONTINUAR', exact: false }).click();
    await page.getByRole('button', { name: 'ENTRAR AL CAOS' }).click();
    await page.waitForFunction(() => document.querySelector('#timer')?.textContent === '00:29');
    await page.keyboard.press('q');
    await page.waitForFunction(() => document.querySelector('[data-special="anime"]')?.disabled);
    await page.keyboard.press('e');
    await page.waitForFunction(() => document.querySelector('[data-special="chair"]')?.disabled);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'Partida pausada' }).waitFor();
    await page.getByRole('button', { name: 'SEGUIR JUGANDO' }).click();
    await page.waitForFunction(() => !document.querySelector('.overlay'));
    if (mobile) assert.equal(await page.getByRole('button', { name: 'Arriba', exact: true }).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.close();
    console.log(`PASS pixel UI and combat: ${mobile ? 'touch mobile' : 'desktop'}`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
