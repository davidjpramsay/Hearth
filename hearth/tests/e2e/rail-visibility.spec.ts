import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1672, height: 941 },
  { width: 1920, height: 720 },
  { width: 3840, height: 1440 },
]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`TV rail retains Games and remote focus at ${viewport.width}×${viewport.height} in ${theme}`, async ({
      page,
    }, testInfo) => {
      const issues: string[] = [];
      page.on('pageerror', (error) => issues.push(error.message));
      page.on('console', (message) => {
        if (['warning', 'error'].includes(message.type())) issues.push(message.text());
      });
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({
        width: viewport.width,
        height: Math.max(viewport.height, 1080),
      });
      await page.goto('/games');
      await expect(page).toHaveTitle('Hearth');
      await expect(page.getByRole('heading', { name: 'Games', exact: true })).toBeVisible();
      await expect(page.locator('.games-word')).toHaveCount(0);
      await expect(page.locator('[data-focus-id="games-connections"]')).toBeVisible();
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      await page.setViewportSize(viewport);
      const games = page.locator('[data-focus-id="nav-games"]');
      const appearance = page.locator('[data-focus-id="nav-appearance"]');
      await expect(games).toBeInViewport({ ratio: 1 });
      const rowBox = (await games.boundingBox())!;
      const iconBox = (await games.locator('svg').boundingBox())!;
      const labelBox = (await games.locator('span').first().boundingBox())!;
      expect(iconBox.width).toBeGreaterThanOrEqual(20);
      expect(labelBox.x).toBeGreaterThanOrEqual(iconBox.x + iconBox.width);
      expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width - 4);
      await expect(page.locator('.household-date-time--rail')).toBeInViewport({ ratio: 1 });
      await expect(appearance).toBeInViewport({ ratio: 1 });
      await expect(page.locator('[data-focus-id="games-connections"]')).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath(`rail-games-${theme}.png`) });
      await games.focus();
      await page.keyboard.press('ArrowDown');
      await expect(appearance).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(games).toBeFocused();
      for (let index = 0; index < 9; index++) await page.keyboard.press('ArrowUp');
      const today = page.locator('[data-focus-id="nav-today"]');
      await expect(today).toBeFocused();
      await expect(today).toBeInViewport({ ratio: 1 });
      // Resizing while navigating must preserve the focused row, not drag
      // the scroll region back to the route's active Games item.
      await page.setViewportSize({ ...viewport, height: viewport.height + 40 });
      await expect(today).toBeFocused();
      await expect(today).toBeInViewport({ ratio: 1 });
      await page.setViewportSize(viewport);
      await expect(today).toBeFocused();
      for (const destination of [
        'calendar',
        'weather',
        'reminders',
        'chores',
        'lists',
        'meals',
        'home',
        'photos',
        'games',
      ]) {
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(`[data-focus-id="nav-${destination}"]`)).toBeFocused();
      }
      await expect(games).toBeFocused();
      await expect(games).toBeInViewport({ ratio: 1 });
      expect(await page.locator('.app-shell').evaluate((element) => element.scrollTop)).toBe(0);
      await expect(page.locator('.household-date-time--rail')).toBeInViewport({ ratio: 1 });
      const axe = await new AxeBuilder({ page }).analyze();
      expect(
        axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      expect(issues).toEqual([]);
    });
  }
}
