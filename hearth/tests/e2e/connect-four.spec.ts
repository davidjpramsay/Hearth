import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});
const api = 'http://127.0.0.1:4310/api/v1/households/household_hearth_demo';
for (const size of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
])
  for (const theme of ['light', 'dark'] as const)
    test(`Connect Four fits and plays at ${size.width} ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize(size);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/games');
      await page.getByRole('link', { name: 'Connect Four', exact: true }).click();
      const drop = page.locator('[data-focus-id="four-drop"]');
      await expect(drop).toHaveText('Drop in column 4');
      await drop.click();
      await expect(drop).toHaveText('Drop in column 4');
      await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
        'aria-label',
        /Player 2.*1 counters/,
      );
      await page.getByRole('button', { name: 'Next column', exact: true }).click();
      await expect(drop).toHaveText('Drop in column 5');
      await drop.click();
      await page.reload();
      await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
        'aria-label',
        /2 counters/,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (size.width >= 1200) {
        expect(
          await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
        ).toBe(true);
        const bounds = await page.locator('.four-footer').boundingBox();
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: `/tmp/hearth-connect-four-${size.width}-${theme}.png`,
        fullPage: true,
      });
      await page.getByRole('link', { name: 'Back to Games', exact: true }).click();
      await expect(page).toHaveURL(/\/games$/);
      expect(errors).toEqual([]);
    });
test('remote arrows, wins, full columns, Back and round confirmation preserve control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/games/connect-four');
  const drop = page.locator('[data-focus-id="four-drop"]');
  await drop.focus();
  for (let n = 0; n < 6; n++) await drop.press('Enter');
  await drop.press('Enter');
  await expect(page.locator('.four-footer')).toContainText('column is full');
  await drop.press('ArrowRight');
  await expect(drop).toHaveText('Drop in column 5');
  await expect(drop).toBeFocused();
  await drop.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'New round', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New round', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'New round', exact: true }).click();
  await page.getByRole('button', { name: 'Start new round', exact: true }).click();
  await drop.focus();
  // Player 2 starts the next round. Build a horizontal winning line using the remote.
  let column = 3;
  for (const target of [0, 6, 1, 6, 2, 5, 3]) {
    while (column !== target) {
      await drop.press('ArrowRight');
      column = (column + 1) % 7;
    }
    await drop.press('Enter');
  }
  await expect(drop).toHaveText('Player 2 wins!');
  await expect(page.locator('.four-cell--winner')).toHaveCount(4);
  await drop.press('Enter');
  await expect(page.locator('.four-cell--winner')).toHaveCount(4);
  await drop.press('ArrowUp');
  await expect(page.getByRole('link', { name: 'Back to Games', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/games$/);
});
test('adult game switches hide routes, retain saves, work with parent off, and leave the other game available', async ({
  page,
  request,
}) => {
  await page.goto('/games/connect-four');
  await page.locator('[data-focus-id="four-drop"]').click();
  await page.goto('/admin/modules');
  await page.getByRole('link', { name: 'Choose games', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Game modules', exact: true })).toBeVisible();
  const off = page.getByRole('switch', { name: 'Connect Four', exact: true });
  await off.click();
  await expect(off).toHaveAttribute('aria-checked', 'false');
  await page.goto('/games');
  await expect(page.getByRole('link', { name: 'Connections', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Connect Four', exact: true })).toHaveCount(0);
  await page.goto('/games/connect-four');
  await expect(page).not.toHaveURL(/\/games\/connect-four$/);
  await request.put(`${api}/modules/games`, {
    headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
    data: { requestId: 'request_parent_game_off', enabled: false },
  });
  await page.goto('/admin/modules/games');
  await expect(page.getByRole('heading', { name: 'Game modules' })).toBeVisible();
  await expect(page.getByText('Games is turned off.', { exact: false })).toBeVisible();
  await page.getByRole('switch', { name: 'Connect Four', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Connect Four', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await request.put(`${api}/modules/games`, {
    headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
    data: { requestId: 'request_parent_game_on', enabled: true },
  });
  await page.goto('/games/connect-four');
  await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
    'aria-label',
    /1 counters/,
  );
  await page.goto('/admin/modules/games');
  await page.getByRole('switch', { name: 'Connections', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Connections', exact: true })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await page.goto('/games');
  await expect(page.getByRole('link', { name: 'Connections', exact: true })).toHaveCount(0);
  expect((await request.get(`${api}/games/word-groups`)).status()).toBe(403);
});
test('bad or unavailable local storage never prevents play', async ({ page }) => {
  await page.goto('/games');
  await page.evaluate(() =>
    localStorage.setItem(
      'hearth.connect-four.v1.demo.household_hearth_demo',
      '{"firstPlayer":1,"moves":[9]}',
    ),
  );
  await page.goto('/games/connect-four');
  await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
    'aria-label',
    /0 counters/,
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
  });
  await page.locator('[data-focus-id="four-drop"]').click();
  await expect(page.getByText('This round can’t be saved on this device.')).toBeVisible();
  await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
    'aria-label',
    /1 counters/,
  );
});
for (const size of [
  { width: 390, height: 844 },
  { width: 1920, height: 1080 },
])
  for (const theme of ['light', 'dark'] as const)
    test(`Game modules settings are readable at ${size.width} ${theme}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/admin/modules/games');
      await expect(page.getByRole('heading', { name: 'Game modules', exact: true })).toBeVisible();
      await expect(page.getByRole('switch')).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: `/tmp/hearth-game-modules-${size.width}-${theme}.png`,
        fullPage: true,
      });
    });

test('all games off shows a useful empty menu without deleting local state', async ({
  page,
  request,
}) => {
  for (const id of ['connections', 'connectFour'])
    await request.put(`${api}/game-modules/${id}`, {
      headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
      data: { requestId: `request_empty_${id.toLowerCase()}`, enabled: false },
    });
  await page.goto('/games');
  await expect(page.getByText('No games are turned on.', { exact: false })).toBeVisible();
  await expect(page.locator('.games-choice')).toHaveCount(0);
  for (const path of ['/games/connections', '/games/connect-four', '/games?puzzle=2']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/games$/);
  }
});

for (const size of [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
])
  for (const finished of [false, true]) {
    test(`remote returns from the main menu to an ${finished ? 'ended' : 'active'} Connect Four round at ${size.width}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) errors.push(message.text());
      });
      await page.setViewportSize(size);
      await page.goto('/games/connect-four');
      const drop = page.locator('[data-focus-id="four-drop"]');
      if (finished) {
        let column = 3;
        for (const target of [0, 6, 1, 6, 2, 5, 3]) {
          while (column !== target) {
            await drop.press('ArrowRight');
            column = (column + 1) % 7;
          }
          await drop.press('Enter');
        }
        await expect(drop).toHaveText('Player 1 wins!');
      }
      const board = page.getByRole('img', { name: /Connect Four board/ });
      const savedBoard = await board.getAttribute('aria-label');
      await page.getByRole('button', { name: 'Previous column', exact: true }).focus();
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator(':focus')).toHaveAttribute('data-focus-id', /^nav-/);
      await page.keyboard.press('ArrowRight');
      await expect(finished ? page.locator('[data-focus-id="four-new"]') : drop).toBeFocused();
      await expect(board).toHaveAttribute('aria-label', savedBoard!);
      expect(errors).toEqual([]);
      if (finished && size.width === 1920)
        await page.screenshot({ path: '/tmp/hearth-connect-four-menu-return.png', fullPage: true });
    });
  }

test('a restored draw can be re-entered from another menu row, then returns to active play', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/games');
  await page.evaluate(() =>
    localStorage.setItem(
      'hearth.connect-four.v1.demo.household_hearth_demo',
      JSON.stringify({
        firstPlayer: 1,
        moves: [
          4, 2, 4, 4, 4, 5, 6, 3, 0, 1, 3, 0, 5, 4, 5, 2, 1, 1, 0, 2, 2, 6, 6, 1, 6, 4, 2, 2, 0, 6,
          0, 6, 5, 1, 3, 0, 1, 5, 5, 3, 3, 3,
        ],
      }),
    ),
  );
  await page.getByRole('link', { name: 'Connect Four', exact: true }).click();
  const drop = page.locator('[data-focus-id="four-drop"]');
  const restart = page.getByRole('button', { name: 'New round', exact: true });
  await expect(drop).toHaveText('A draw. Well played!');
  await page.getByRole('button', { name: 'Previous column', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute('data-focus-id', /^nav-/);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await expect(restart).toBeFocused();
  await expect(page).toHaveURL(/\/games\/connect-four$/);
  await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
    'aria-label',
    /42 counters/,
  );
  await page.screenshot({ path: '/tmp/hearth-connect-four-draw-menu-return.png', fullPage: true });
  await page.keyboard.press('Enter');
  await expect(drop).toHaveText('Drop in column 4');
  await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
    'aria-label',
    /0 counters/,
  );
  await page.getByRole('button', { name: 'Previous column', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute('data-focus-id', /^nav-/);
  await page.keyboard.press('ArrowRight');
  await expect(drop).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('img', { name: /Connect Four board/ })).toHaveAttribute(
    'aria-label',
    /1 counters/,
  );
});
