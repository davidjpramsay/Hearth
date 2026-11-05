import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const api = 'http://127.0.0.1:4310/api/v1';
const home = `${api}/households/household_hearth_demo`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
});
for (const size of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 820, height: 1180 },
  { width: 1180, height: 820 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
])
  for (const theme of ['light', 'dark'] as const)
    test(`Word Guess fits ${size.width}x${size.height} ${theme} @visual @a11y`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (['warning', 'error'].includes(m.type())) errors.push(m.text());
      });
      await page.setViewportSize(size);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto('/games');
      await page.getByRole('link', { name: 'Word Guess', exact: true }).click();
      await expect(page).toHaveURL(/\/games\/word-guess$/);
      await expect(page).toHaveTitle(/Hearth/);
      await expect(page.getByRole('heading', { name: 'Word Guess', exact: true })).toBeVisible();
      await expect(
        page.getByRole('group', { name: 'Letter keyboard' }).getByRole('button'),
      ).toHaveCount(26);
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      if (size.width >= 1200)
        expect(
          await page.locator('.app-content').evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
        ).toBe(true);
      if (size.width <= 390) {
        const guessBounds = await page
          .getByRole('button', { name: 'Guess', exact: true })
          .boundingBox();
        const navBounds = await page.getByRole('link', { name: 'More', exact: true }).boundingBox();
        expect(guessBounds!.y + guessBounds!.height).toBeLessThanOrEqual(navBounds!.y);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: `/tmp/hearth-word-guess-${size.width}-${size.height}-${theme}.png`,
        fullPage: size.width < 1200,
      });
      for (const letter of 'apple')
        await page
          .getByRole('button', { name: `Add ${letter.toUpperCase()}`, exact: true })
          .click();
      await page.getByRole('button', { name: 'Guess', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Nice work!');
      await expect(page.getByRole('button', { name: 'Next word', exact: true })).toBeFocused();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/games$/);
      await expect(page.getByRole('link', { name: 'Word Guess', exact: true })).toBeFocused();
      expect(errors).toEqual([]);
    });
test('physical typing, repeated letters, invalid guesses and reopen preserve the round', async ({
  page,
}) => {
  await page.goto('/games/word-guess');
  await page.getByRole('button', { name: 'Add Q', exact: true }).focus();
  await page.keyboard.type('zzzzz');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('not in this word list');
  await expect(page.locator('.word-cell--absent')).toHaveCount(0);
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('allee');
  await page.keyboard.press('Enter');
  await expect(page.locator('.word-row').first()).toHaveAttribute(
    'aria-label',
    /L: elsewhere.*L: not in.*E: not in.*E: correct spot/,
  );
  await page.screenshot({ path: '/tmp/hearth-word-guess-feedback.png' });
  await page.keyboard.type('ap');
  await page.reload();
  await expect(page.locator('.word-row').nth(1)).toHaveAttribute('aria-label', 'Guess 2: AP');
  await page.getByRole('button', { name: 'Restart word', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Restart word', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Guess', exact: true }).focus();
  await page.keyboard.type('ple');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Nice work! APPLE in 2');
  await page.getByRole('button', { name: 'Next word', exact: true }).click();
  await expect(page.locator('.word-number')).toContainText('Word 2');
  await expect(page.locator('.word-key--exact')).toHaveCount(0);
  await page.keyboard.type('cra');
  await page.getByRole('button', { name: 'Restart word', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restart word', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.word-number')).toContainText('Word 2');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: empty');
});
test('menu return works for active, won and lost rounds', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/games/word-guess');
  const q = page.locator('[data-focus-id="word-key-q"]');
  await q.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: Q');
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute('data-focus-id', /^nav-/);
  await page.keyboard.press('ArrowRight');
  await expect(q).toBeFocused();
  await page.getByRole('button', { name: 'Delete last letter' }).click();
  for (const word of ['crane', 'sweep', 'plant', 'brush', 'stone', 'lemon']) {
    await q.focus();
    await page.keyboard.type(word);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('status')).toContainText('The word was APPLE');
  const next = page.getByRole('button', { name: 'Next word', exact: true });
  await expect(next).toBeFocused();
  await page.getByRole('link', { name: 'Games', exact: true }).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(q).toBeFocused();
  await page.keyboard.type('crane');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Nice work!');
});
test('arrows and OK alone enter and submit a complete word, then restore menu focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/games');
  await expect(page.getByRole('link', { name: 'Word Guess', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Games', exact: true }).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('link', { name: 'Connections', exact: true })).toBeFocused();
  const press = async (...keys: string[]) => {
    for (const key of keys) await page.keyboard.press(key);
  };
  await press('ArrowDown', 'ArrowDown');
  await expect(page.getByRole('link', { name: 'Word Guess', exact: true })).toBeFocused();
  await press('Enter');
  await expect(page.locator('[data-focus-id="word-key-q"]')).toBeFocused();
  await press('ArrowDown', 'Enter');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: A');
  await press('ArrowUp', ...Array<string>(9).fill('ArrowRight'), 'Enter', 'Enter');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: APP');
  await press('ArrowDown', 'Enter');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: APPL');
  await press('ArrowUp', ...Array<string>(7).fill('ArrowLeft'), 'Enter');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: APPLE');
  await press('ArrowDown', 'ArrowDown', 'ArrowDown');
  if (
    await page
      .getByRole('button', { name: 'Delete last letter' })
      .evaluate((e) => e === document.activeElement)
  )
    await press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Guess', exact: true })).toBeFocused();
  await press('Enter');
  await expect(page.getByRole('status')).toContainText('Nice work! APPLE');
  await expect(page.getByRole('button', { name: 'Next word', exact: true })).toBeFocused();
  await press('Escape');
  await expect(page.getByRole('link', { name: 'Word Guess', exact: true })).toBeFocused();
});
test('the third adult switch gates direct reads, keeps saves and follows parent off', async ({
  page,
  request,
}) => {
  await page.goto('/games/word-guess');
  await page.getByRole('button', { name: 'Add A', exact: true }).click();
  const saved = await page.evaluate(() =>
    localStorage.getItem('hearth.word-guess.v1.demo.household_hearth_demo'),
  );
  await page.goto('/admin/modules/games');
  const toggle = page.getByRole('switch', { name: 'Word Guess', exact: true });
  await expect(page.getByRole('switch')).toHaveCount(3);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect((await request.get(`${home}/games/word-guess`)).status()).toBe(403);
  await page.goto('/games/word-guess');
  await expect(page).toHaveURL(/\/games$/);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('hearth.word-guess.v1.demo.household_hearth_demo'),
    ),
  ).toBe(saved);
  await request.put(`${home}/game-modules/wordGuess`, {
    headers: adult,
    data: { requestId: 'request_words_back', enabled: true },
  });
  await page.goto('/games/word-guess');
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: A');
  await request.put(`${home}/modules/games`, {
    headers: adult,
    data: { requestId: 'request_word_parent_off', enabled: false },
  });
  await expect(page).toHaveURL(/\/today$/);
  expect((await request.get(`${home}/games/word-guess`)).status()).toBe(403);
});
test('missing data, failures, stale cache, blocked storage and changed word lists are intentional', async ({
  page,
  context,
  request,
}) => {
  await page.route('**/games/word-guess', (route) =>
    route.request().resourceType() === 'document'
      ? route.continue()
      : route.fulfill({
          json: { status: 'unconfigured', source: 'household-word-list', snapshot: null },
        }),
  );
  await page.goto('/games/word-guess');
  await expect(page.getByRole('heading', { name: 'Your words are waiting' })).toBeVisible();
  await page.unroute('**/games/word-guess');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Letter keyboard' })).toBeVisible();
  await context.setOffline(true);
  await expect(
    page.getByText('Offline — this loaded word list is still playable.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add A', exact: true }).click();
  await page.route('**/api/v1/households/*/games/word-guess', (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: 'UNAVAILABLE', message: 'Unavailable' } },
    }),
  );
  await page.getByRole('button', { name: 'Refresh words', exact: true }).click();
  await context.setOffline(false);
  await expect(page.getByText('Showing the last word list.', { exact: false })).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
  });
  await page.getByRole('button', { name: 'Add P', exact: true }).click();
  await expect(page.getByText('This round cannot be saved on this device.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  const data = await (await request.get(`${home}/games/word-guess`)).json();
  data.snapshot.id = 'words_changed';
  data.snapshot.answers = ['crane'];
  await page.unroute('**/api/v1/households/*/games/word-guess');
  await page.route('**/api/v1/households/*/games/word-guess', (route) =>
    route.fulfill({ json: data }),
  );
  await page.reload();
  await expect(page.locator('.word-row').first()).toHaveAttribute('aria-label', 'Guess 1: empty');
  await page.getByRole('button', { name: 'Add Q', exact: true }).focus();
  await page.keyboard.type('crane');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Nice work! CRANE');
});
