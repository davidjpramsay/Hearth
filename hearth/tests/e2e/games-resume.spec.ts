import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import type { WordGroupsPuzzle } from '@hearth/shared';

const base = '/api/v1/households/household_hearth_demo/games/word-groups';
const key = 'hearth.word-groups.v2.demo.household_hearth_demo';
test.beforeEach(async ({ request }) => {
  await request.post('/api/v1/demo/reset');
});
test.afterEach(async ({ page }) => page.unrouteAll({ behavior: 'wait' }));

async function expectRemembered(page: Page, id: string) {
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').lastPuzzleId, key),
    )
    .toBe(id);
}

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tv', width: 1920, height: 1080 },
]) {
  for (const theme of ['light', 'dark']) {
    test(`Games resumes the same board, guesses and order on ${viewport.name} ${theme}`, async ({
      page,
      context,
      request,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.addInitScript(
        (theme) =>
          localStorage.setItem(
            'hearth.appearance.v1',
            JSON.stringify({ theme, eveningDimming: false }),
          ),
        theme,
      );
      const puzzle = (await (
        await request.get(`${base}/word_groups_demo_3`)
      ).json()) as WordGroupsPuzzle;
      await page.goto('/games/connections');
      await expect(page).toHaveTitle(/Hearth/);
      await page.getByRole('button', { name: 'Archive', exact: true }).click();
      await page.locator('[data-focus-id="games-choose-3"]').click();
      await expect(page.locator('.games-toolbar')).toContainText('#3');
      await expectRemembered(page, puzzle.id);
      // One solved group and one miss, then save a shuffled order without pending selections.
      for (const word of puzzle.groups[0]!.words)
        await page.getByRole('button', { name: word, exact: true }).click();
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      for (const word of [...puzzle.groups[1]!.words.slice(0, 3), puzzle.groups[2]!.words[0]!])
        await page.getByRole('button', { name: word, exact: true }).click();
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      await page.getByRole('button', { name: 'Deselect', exact: true }).click();
      await page.getByRole('button', { name: 'Shuffle', exact: true }).click();
      const order = await page.locator('.games-word').allTextContents();
      await page.getByRole('link', { name: 'Today', exact: true }).click();
      if (viewport.name === 'phone')
        await page.getByRole('link', { name: 'More', exact: true }).click();
      await page
        .locator(
          viewport.name === 'phone'
            ? '[data-focus-id="more-games"]'
            : '[data-focus-id="nav-games"]',
        )
        .click();
      await expect(page).toHaveURL(/\/games$/);
      await page.getByRole('link', { name: 'Connections', exact: true }).click();
      await expect(page.locator('.games-toolbar')).toContainText('#3');
      await expect(page.locator('.games-group')).toHaveCount(1);
      await expect(page.locator('.games-mistakes')).toHaveAttribute(
        'aria-label',
        '3 mistakes remaining',
      );
      await expect(page.locator('.games-word')).toHaveCount(12);
      expect(await page.locator('.games-word').allTextContents()).toEqual(order);
      await page.reload();
      await expect(page.locator('.games-toolbar')).toContainText('#3');
      await expect(page.locator('.games-group')).toHaveCount(1);
      // Fresh document/query cache in another tab, using only this device's durable browser store.
      const reopened = await context.newPage();
      try {
        reopened.on('pageerror', (error) => errors.push(error.message));
        await reopened.setViewportSize(viewport);
        await reopened.goto('/games/connections');
        await expect(reopened.locator('.games-toolbar')).toContainText('#3');
        await expect(reopened.locator('.games-group')).toHaveCount(1);
        await expect(reopened.locator('.games-word')).toHaveCount(12);
        expect(await reopened.locator('.games-word').allTextContents()).toEqual(order);
        expect(
          await reopened.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        ).toBe(true);
        if (process.env.HEARTH_GAMES_RESUME_EVIDENCE_DIR)
          await reopened.screenshot({
            path: resolve(
              process.env.HEARTH_GAMES_RESUME_EVIDENCE_DIR,
              `resume-${viewport.name}-${theme}.png`,
            ),
          });
      } finally {
        await reopened.close();
      }
      expect(errors).toEqual([]);
    });
  }
}

test('an untouched choice persists and explicit links override it without invalid links replacing it', async ({
  page,
}) => {
  await page.goto('/games/connections');
  await page.getByRole('button', { name: 'Later puzzle' }).click();
  await expectRemembered(page, 'word_groups_demo_2');
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#2');
  await expect(page.locator('.games-word')).toHaveCount(16);
  await page.goto('/games/connections?puzzle=3');
  await expectRemembered(page, 'word_groups_demo_3');
  await page.goto('/games/connections?puzzle=9999');
  await expect(page.getByRole('status')).toContainText('not in this archive');
  await expectRemembered(page, 'word_groups_demo_3');
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#3');
});

test('a failed puzzle read preserves the last playable board', async ({ page }) => {
  await page.goto('/games/connections?puzzle=3');
  await expectRemembered(page, 'word_groups_demo_3');
  await page.route(`**${base}/word_groups_demo_2`, (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: 'INTEGRATION_UNAVAILABLE',
          message: 'Puzzle unavailable',
          retryable: true,
          requestId: null,
        },
      },
    }),
  );
  await page.goto('/games/connections?puzzle=2');
  await expect(page.getByRole('button', { name: /Try again/ })).toBeVisible();
  await expectRemembered(page, 'word_groups_demo_3');
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#3');
  await expect(page.locator('.games-word')).toHaveCount(16);
});

test('old v2 progress resumes the recent attempt and removed archive IDs fall back safely', async ({
  page,
  request,
}) => {
  const puzzle = (await (
    await request.get(`${base}/word_groups_demo_3`)
  ).json()) as WordGroupsPuzzle;
  await page.goto('/today');
  await page.evaluate(
    ({ key, puzzle }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 2,
          completedIds: ['word_groups_demo_1'],
          entries: [
            {
              id: puzzle.id,
              outcome: 'in-progress',
              progress: {
                order: Array.from({ length: 16 }, (_, index) => index),
                attempts: [puzzle.groups[0]!.words.map((word) => puzzle.board.indexOf(word))],
              },
            },
          ],
        }),
      ),
    { key, puzzle },
  );
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#3');
  await expect(page.locator('.games-group')).toHaveCount(1);
  await expectRemembered(page, puzzle.id);
  await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...store, lastPuzzleId: 'word_groups_removed' }));
  }, key);
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#2');
  await expect(page.locator('.games-group')).toHaveCount(0);
  await expect(page.locator('.games-word')).toHaveCount(16);
  await expectRemembered(page, 'word_groups_demo_2');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('[data-focus-id="games-choose-1"]')).toContainText('Completed');
});
