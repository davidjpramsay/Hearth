import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});

for (const size of [
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`Games submenu, Back and saved puzzle work at ${size.width} ${theme}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(size);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/games');
      await expect(page.getByRole('heading', { name: 'Games', exact: true })).toBeVisible();
      const game = page.getByRole('link', { name: 'Connections', exact: true });
      await expect(game).toBeVisible();
      await expect(page.locator('.games-word')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (size.width >= 1200)
        expect(
          await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
        ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `/tmp/hearth-games-menu-${size.width}-${theme}.png` });
      await game.click();
      await expect(page).toHaveURL(/\/games\/connections$/);
      await expect(page.locator('.games-word')).toHaveCount(16);
      if (size.width < 1200)
        await expect(page.getByRole('link', { name: 'More', exact: true })).toHaveClass(
          /phone-tab--active/,
        );
      await page.getByRole('button', { name: 'Archive', exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page).toHaveURL(/\/games\/connections$/);
      await page.getByRole('button', { name: 'Archive', exact: true }).click();
      await page.locator('[data-focus-id="games-choose-2"]').click();
      await expect(page.locator('.games-toolbar')).toContainText('#2');
      // Metadata appears before the selected board finishes loading. Reopening is promised for
      // the last successfully loaded board, so verify that save before deliberately leaving it.
      await expect(page.locator('.games-word')).toHaveCount(16);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(
                localStorage.getItem('hearth.word-groups.v2.demo.household_hearth_demo') ?? '{}',
              ).lastPuzzleId,
          ),
        )
        .toBe('word_groups_demo_2');
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/games$/);
      await expect(game).toBeFocused();
      await game.press('Enter');
      await expect(page.locator('.games-toolbar')).toContainText('#2');
      await page.getByRole('link', { name: 'Back to Games', exact: true }).click();
      await expect(page).toHaveURL(/\/games$/);
      await expect(game).toBeFocused();
      expect(errors).toEqual([]);
    });
  }

test('an old puzzle link and a direct entry both have a working native Back target', async ({
  page,
}) => {
  await page.goto('/games?puzzle=3');
  await expect(page).toHaveURL(/\/games\/connections\?puzzle=3$/);
  await expect(page.locator('.games-toolbar')).toContainText('#3');
  await page.evaluate(() => window.postMessage('{"type":"back"}', window.location.origin));
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.getByRole('heading', { name: 'Games', exact: true })).toBeVisible();
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#3');
  await page.getByRole('link', { name: 'Back to Games', exact: true }).click();
  await expect(page).toHaveURL(/\/games$/);
});

test('switching Games off blocks both the menu and Connections without fetching puzzles', async ({
  page,
  request,
}) => {
  await request.put('http://127.0.0.1:4310/api/v1/households/household_hearth_demo/modules/games', {
    headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
    data: { requestId: 'request_games_menu_off', enabled: false },
  });
  const puzzleReads: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/games/word-groups')) puzzleReads.push(r.url());
  });
  for (const path of ['/games', '/games/connections', '/games?puzzle=2']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.locator('[data-focus-id="nav-games"]')).toHaveCount(0);
  }
  expect(puzzleReads).toEqual([]);
});
