import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';

// Exercise the exact native template, not a second browser implementation.
const kotlin = await readFile(
  new URL('../../apps/tv/app/src/main/java/app/hearth/tv/TvViewport.kt', import.meta.url),
  'utf8',
);
const template = kotlin.match(/return """([\s\S]*?)"""\.trimIndent\(\)/)?.[1];
if (template === undefined) throw new Error('Native TV viewport template was not found.');
const nativeScript = (scale: string) => template.replaceAll('$scale', scale);
const nginx = await readFile(new URL('../../deploy/synology/nginx.conf', import.meta.url), 'utf8');
const policy = nginx.match(/add_header Content-Security-Policy "([^"]+)"/)?.[1];
if (policy === undefined) throw new Error('Production CSP was not found.');

test('launcher renditions preserve the original fern left of Hearth and correct proportions', async () => {
  for (const asset of [
    { name: 'tv_banner', width: 320, height: 180 },
    { name: 'tv_icon', width: 160, height: 160 },
  ]) {
    const png = await readFile(
      new URL(`../../apps/tv/app/src/main/res/drawable-xhdpi/${asset.name}.png`, import.meta.url),
    );
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(asset.width);
    expect(png.readUInt32BE(20)).toBe(asset.height);
    const rgba = await sharp(png).ensureAlpha().raw().toBuffer();
    let fernPixels = 0;
    let wordmarkPixels = 0;
    for (let y = 0; y < asset.height; y++) {
      for (let x = 0; x < asset.width; x++) {
        const offset = (y * asset.width + x) * 4;
        if (rgba[offset]! > 245 && rgba[offset + 1]! > 235 && rgba[offset + 2]! > 215) {
          if (x < asset.width * 0.29) fernPixels++;
          else wordmarkPixels++;
        }
      }
    }
    // The mark scales in two dimensions; compare area rather than canvas width.
    expect(fernPixels).toBeGreaterThan(asset.width * asset.height * 0.004);
    expect(wordmarkPixels).toBeGreaterThan(fernPixels);
    const source = await readFile(
      new URL(`../../apps/tv/app/src/main/res/drawable/${asset.name}.xml`, import.meta.url),
      'utf8',
    );
    expect(source).toContain('@drawable/tv_launcher_fern');
    expect(source).toContain('@drawable/tv_wordmark');
  }
  const fern = await readFile(
    new URL('../../apps/tv/app/src/main/res/drawable/tv_launcher_fern.xml', import.meta.url),
    'utf8',
  );
  expect(fern).toContain('android:src="@drawable/hearth_mark"');
  await promisify(execFile)(process.execPath, [
    fileURLToPath(new URL('../../apps/tv/design/render-launcher.mjs', import.meta.url)),
    '--check',
  ]);
  const manifest = await readFile(
    new URL('../../apps/tv/app/src/main/AndroidManifest.xml', import.meta.url),
    'utf8',
  );
  expect(manifest).toContain('android:banner="@drawable/tv_banner"');
  expect(manifest).toContain('android:icon="@drawable/tv_icon"');
});

for (const scenario of [
  { name: 'density-two 1080p', width: 960, height: 540, scale: '0.5' },
  { name: 'density-two 4K', width: 1920, height: 1080, scale: '1.0' },
]) {
  test.describe(scenario.name, () => {
    test.use({
      isMobile: true,
      deviceScaleFactor: 2,
      viewport: { width: scenario.width, height: scenario.height },
      screen: { width: scenario.width, height: scenario.height },
      userAgent: 'Mozilla/5.0 Android HearthTV/0.1.0',
    });
    test('native startup and reload retain the TV canvas without the server sizing script', async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.addInitScript(nativeScript(scenario.scale));
      await page.route('**/hearth-bootstrap.js', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: '// No server bootstrap.' }),
      );
      await page.route(/\/today$/, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), 'content-security-policy': policy! },
        });
      });
      for (const load of [() => page.goto('/today'), () => page.reload()]) {
        await load();
        await expect(page.locator('html')).toHaveAttribute('data-hearth-tv-native', 'true');
        await expect(page.locator('.tv-rail')).toBeVisible();
        await expect(page.locator('.phone-tabs')).toBeHidden();
        await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1920);
        await expect.poll(() => page.evaluate(() => innerHeight)).toBe(1080);
        await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
      }
      await page.locator('[data-focus-id="nav-games"]').focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/games$/);
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-focus-id="games-connections"]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/games\/connections$/);
      await expect(page.locator('.games-word')).toHaveCount(16);
      await page.goto('/calendar/week');
      await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
      expect(
        await page
          .locator('.app-content')
          .evaluate((main) => main.scrollHeight - main.clientHeight),
      ).toBe(0);
      await expect(page.getByRole('button', { name: 'Later week' })).toBeInViewport();
      expect(errors).toEqual([]);
    });
  });
}

test.describe('older WebView fallback', () => {
  test.use({
    isMobile: true,
    deviceScaleFactor: 2,
    viewport: { width: 960, height: 540 },
    screen: { width: 960, height: 540 },
  });
  test('post-parser fallback creates a missing viewport and is idempotent', async ({ page }) => {
    await page.goto('/today');
    await page.locator('meta[name="viewport"]').evaluate((node) => node.remove());
    await page.evaluate(nativeScript('0.5'));
    await page.evaluate(nativeScript('0.5'));
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1920);
    await expect(page.locator('.tv-rail')).toBeVisible();
    await expect(page.locator('.phone-tabs')).toBeHidden();
  });
  test('bootstrap does not resize or mark subframes', async ({ page }) => {
    await page.addInitScript(nativeScript('0.5'));
    await page.goto('/today');
    await page.evaluate(() => {
      const frame = document.createElement('iframe');
      frame.srcdoc =
        '<html><head><meta name="viewport" content="width=device-width"></head></html>';
      document.body.appendChild(frame);
    });
    const child = page.frameLocator('iframe');
    await expect(child.locator('html')).not.toHaveAttribute('data-hearth-tv-native', 'true');
    await expect(child.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      'width=device-width',
    );
  });
});
