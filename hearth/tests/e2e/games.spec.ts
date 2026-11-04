import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
const sizes = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'short-tv', width: 1366, height: 768 },
  { name: 'tv', width: 1920, height: 1080 },
  { name: '4k', width: 3840, height: 2160 },
];
for (const size of sizes)
  for (const theme of ['light', 'dark'])
    test(`Games ${size.name} ${theme} is legible, contained and keyboard-ready`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.addInitScript(
        (value) =>
          localStorage.setItem(
            'hearth.appearance.v1',
            JSON.stringify({ theme: value, eveningDimming: false }),
          ),
        theme,
      );
      await page.goto('/games');
      await expect(page.getByRole('heading', { name: 'Connections', exact: true })).toBeVisible();
      await expect(page.locator('.games-word')).toHaveCount(16);
      await expect(page.locator('.games-word[aria-pressed="true"]')).toHaveCount(0);
      await expect(page.locator('[data-focus-id="games-word-0"]')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-focus-id="games-word-1"]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-focus-id="games-word-1"]')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (size.width >= 1200) {
        const box = await page.locator('.games-actions').boundingBox();
        expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
        await expect(page.getByRole('link', { name: 'Connections', exact: true })).toBeInViewport();
      }
      const audit = await new AxeBuilder({ page }).analyze();
      expect(
        audit.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      expect(errors).toEqual([]);
      if (size.name === 'tv' || size.name === 'phone')
        await page.screenshot({
          path: `/tmp/hearth-games-${size.name}-${theme}.png`,
          fullPage: false,
        });
    });

test('finds groups, preserves reload progress, and replay starts a clean board', async ({
  page,
}) => {
  await page.goto('/games');
  await expect(page.locator('.games-word')).toHaveCount(16);
  for (const words of [
    ['COVER', 'SPINE', 'INDEX', 'CHAPTER'],
    ['BATH', 'CURTAIN', 'CARD', 'BREATH'],
    ['SALES', 'MUSICAL', 'BASEBALL', 'ROOF'],
    ['TRAFFIC', 'SPOT', 'DAY', 'FLASH'],
  ]) {
    for (const word of words) await page.getByRole('button', { name: word, exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.locator('.games-status')).toContainText(
      words[0] === 'TRAFFIC' ? 'All four groups found' : 'Group found',
    );
    if (words[0] === 'COVER') {
      await page.reload();
      await expect(page.locator('.games-group')).toHaveCount(1);
      await expect(page.locator('.games-word')).toHaveCount(12);
    }
  }
  await expect(page.getByRole('button', { name: 'Next puzzle' })).toBeFocused();
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.games-word')).toHaveCount(16);
  await expect(page.locator('.games-group')).toHaveCount(0);
});

test('one-away, duplicate guesses, shuffle and four misses behave honestly', async ({ page }) => {
  await page.goto('/games');
  await expect(page.locator('.games-word')).toHaveCount(16);
  async function guess(words: string[]) {
    const deselect = page.getByRole('button', { name: 'Deselect', exact: true });
    if (await deselect.isEnabled()) await deselect.click();
    for (const word of words) await page.getByRole('button', { name: word, exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
  }
  await guess(['COVER', 'SPINE', 'INDEX', 'BATH']);
  await expect(page.locator('.games-status')).toContainText('One away');
  await page.getByRole('button', { name: 'Shuffle', exact: true }).click();
  await expect(page.locator('.games-word[aria-pressed="true"]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('.games-status')).toContainText('Already guessed');
  await expect(page.locator('.games-mistakes')).toHaveAttribute(
    'aria-label',
    '3 mistakes remaining',
  );
  for (const words of [
    ['COVER', 'SPINE', 'BATH', 'CURTAIN'],
    ['COVER', 'INDEX', 'BATH', 'CARD'],
    ['COVER', 'CHAPTER', 'BATH', 'BREATH'],
  ])
    await guess(words);
  await expect(page.locator('.games-group')).toHaveCount(4);
  await expect(page.locator('.games-word')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Play again' })).toBeFocused();
});

test('archive search and switching preserve each puzzle; Back restores the opener', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/more');
  await page.locator('[data-focus-id="more-games"]').click();
  await expect(page.locator('.games-word')).toHaveCount(16);
  for (const word of ['COVER', 'SPINE', 'INDEX', 'CHAPTER'])
    await page.getByRole('button', { name: word, exact: true }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('[role=dialog]') !== null)).toBe(
    true,
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Archive', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find puzzle' }).fill('2026-08-03');
  await page.locator('[data-focus-id="games-choose-3"]').click();
  await expect(page).toHaveURL(/puzzle=3/);
  await expect(page.locator('.games-word')).toHaveCount(16);
  await page.getByRole('button', { name: 'Earlier puzzle' }).click();
  await page.getByRole('button', { name: 'Earlier puzzle' }).click();
  await expect(page.locator('.games-group')).toHaveCount(1);
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.games-group')).toHaveCount(1);
});

test('offline cached play and denied browser storage remain usable', async ({ page, context }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await page.goto('/games');
  await expect(page.locator('.games-word')).toHaveCount(16);
  await context.setOffline(true);
  for (const word of ['COVER', 'SPINE', 'INDEX', 'CHAPTER'])
    await page.getByRole('button', { name: word, exact: true }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('.games-group')).toHaveCount(1);
  await expect(page.getByText('Progress can’t be saved on this device.')).toBeVisible();
  await context.setOffline(false);
});

test('a large archive pages within its dialog without losing Close or Back', async ({
  page,
  request,
}) => {
  const base = '/api/v1/households/household_hearth_demo/games/word-groups';
  const original = await (
    await request.get(`http://127.0.0.1:4310${base}/word_groups_demo_3`)
  ).json();
  const puzzles = Array.from({ length: 85 }, (_, index) => ({
    id: `word_groups_fixture_${85 - index}`,
    number: 85 - index,
    date: new Date(Date.UTC(2026, 0, 85 - index)).toISOString().slice(0, 10),
  }));
  await page.route(`**${base}`, (route) =>
    route.fulfill({ json: { status: 'ready', source: 'original-demo', puzzles } }),
  );
  await page.route(`**${base}/word_groups_fixture_*`, (route) => {
    const id = route.request().url().split('/').at(-1)!;
    const identity = puzzles.find((puzzle) => puzzle.id === id)!;
    return route.fulfill({ json: { ...original, ...identity } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games');
  await expect(page.locator('.games-word')).toHaveCount(16);
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Next', exact: true })).toBeInViewport();
  await expect(dialog.locator('.games-archive-list button')).toHaveCount(40);
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.locator('.games-archive-list button')).toHaveCount(40);
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.locator('.games-archive-list button')).toHaveCount(5);
  await expect(dialog.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Archive', exact: true })).toBeFocused();
});

test('missing archive and failed reads preserve Games chrome and allow recovery', async ({
  page,
}) => {
  const base = '**/api/v1/households/*/games/word-groups';
  await page.route(base, (route) =>
    route.fulfill({ json: { status: 'unconfigured', source: 'household-archive', puzzles: [] } }),
  );
  await page.goto('/games');
  await expect(page.getByRole('heading', { name: 'Connections', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No puzzles yet' })).toBeVisible();
  await page.unroute(base);
  let fail = true;
  await page.route(base, (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: {
            error: {
              code: 'INTEGRATION_UNAVAILABLE',
              message: 'Unavailable',
              retryable: true,
              requestId: null,
            },
          },
        })
      : route.continue(),
  );
  await page.reload();
  await expect(page.getByRole('button', { name: /Try again/ })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: /Try again/ }).click();
  await expect(page.locator('.games-word')).toHaveCount(16);
});
