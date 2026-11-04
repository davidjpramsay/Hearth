import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});

test('choosing a TV menu item keeps focus out of the page until Right is pressed', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/today');
  await expect(page).toHaveTitle('Hearth');
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  for (let step = 0; step < 8; step++) await page.keyboard.press('ArrowLeft');
  for (let step = 0; step < 12; step++) await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-focus-id="nav-today"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible();
  await expect(page.locator('[data-focus-id="nav-calendar"]')).toBeFocused();
  await expect(page.locator('[data-focus-id="nav-calendar"]')).toHaveClass(/rail-item--active/);
  await expect(page.locator('#main-content :focus')).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath('calendar-keeps-menu-focus.png'),
    animations: 'disabled',
  });

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-id="calendar-view-agenda"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const event = page.locator('.agenda-event').first();
  await expect(event).toBeFocused();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(event).toBeFocused();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('every available TV menu destination and Appearance leave page controls unhighlighted', async ({
  page,
  request,
}, info) => {
  for (const id of ['morningRoutine', 'nba']) {
    const result = await request.put(
      `http://127.0.0.1:4310/api/v1/households/household_hearth_demo/modules/${id}`,
      {
        headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
        data: { requestId: `request_menu_focus_${id.toLowerCase()}`, enabled: true },
      },
    );
    expect(result.ok()).toBe(true);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  for (const [id, heading] of [
    ['morning', 'Morning Routine'],
    ['calendar', 'Agenda'],
    ['weather', 'Weather'],
    ['reminders', 'Reminders'],
    ['chores', 'Chores'],
    ['lists', 'Lists'],
    ['meals', 'Meals'],
    ['home', 'Home'],
    ['photos', 'Photos'],
    ['games', 'Games'],
    ['nba', 'NBA'],
    ['appearance', 'Appearance'],
    ['today', 'Today'],
  ]) {
    const menu = page.locator(`[data-focus-id="nav-${id}"]`);
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: heading!, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.locator('#main-content [data-focus-loading="true"]')).toHaveCount(0);
    await expect(menu).toBeFocused();
    await expect(page.locator('#main-content :focus')).toHaveCount(0);
    await expect(menu).toBeInViewport({ ratio: 1 });
  }
  await page.screenshot({
    path: info.outputPath('today-no-page-highlight-dark.png'),
    animations: 'disabled',
  });
});

test('the desktop admin menu retains focus and the dashboard exit survives shell replacement', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/admin');
  const people = page
    .locator('.admin-desktop-rail')
    .getByRole('link', { name: 'People', exact: true });
  await people.click();
  await expect(page.getByRole('heading', { name: 'People', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('#main-content [data-focus-loading="true"]')).toHaveCount(0);
  await expect(people).toBeFocused();
  await expect(page.locator('#main-content :focus')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#main-content :focus')).toHaveCount(1);
  await page.getByRole('link', { name: 'Family dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  await expect(page.locator('[data-focus-id="nav-today"]')).toBeFocused();
  await expect(page.locator('#main-content :focus')).toHaveCount(0);
});

test('a lazy menu destination keeps navigation focus while loading and after content arrives', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  let release: (() => void) | undefined;
  let requested = false;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/AgendaScreen-*.js', async (route) => {
    requested = true;
    await held;
    await route.continue();
  });
  try {
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
    const menu = page.locator('[data-focus-id="nav-calendar"]');
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/calendar\/agenda$/);
    await expect.poll(() => requested).toBe(true);
    // React keeps the outgoing view usable while this lazy module is pending.
    await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
    await expect(menu).toBeFocused();
    release?.();
    await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible();
    await expect(menu).toBeFocused();
    await expect(page.locator('#main-content :focus')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-focus-id="calendar-view-agenda"]')).toBeFocused();
  } finally {
    release?.();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('an early Right enters a lazy Appearance page without needing a second press', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  let release: (() => void) | undefined;
  let requested = false;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/AppearanceSettingsScreen-*.js', async (route) => {
    requested = true;
    await held;
    await route.continue();
  });
  try {
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
    const menu = page.locator('[data-focus-id="nav-appearance"]');
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/appearance$/);
    await expect.poll(() => requested).toBe(true);
    await expect(menu).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(menu).toBeFocused();
    release?.();
    await expect(page.getByRole('heading', { name: 'Appearance', exact: true })).toBeVisible();
    await expect(page.locator('[data-focus-id="appearance-automatic"]')).toBeFocused();
  } finally {
    release?.();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test.describe('phone menu taps', () => {
  test.use({ hasTouch: true, isMobile: true });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    test(`tapping the bottom menu at ${viewport.width}px does not select a page action`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.goto('/today');
      await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
      for (const [id, heading] of [
        ['calendar', 'Agenda'],
        ['weather', 'Weather'],
        ['chores', 'Chores'],
        ['more', 'More'],
        ['today', 'Today'],
      ]) {
        const menu = page.locator(`[data-focus-id="phone-tab-${id}"]`);
        await menu.tap();
        await expect(
          page.getByRole('heading', { name: heading!, exact: true, level: 1 }),
        ).toBeVisible();
        await expect(page.locator('#main-content [data-focus-loading="true"]')).toHaveCount(0);
        await expect(menu).toBeFocused();
        await expect(page.locator('#main-content :focus')).toHaveCount(0);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
        if (id === 'more') {
          await page.evaluate(() =>
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
          );
          expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        }
      }
      await page.screenshot({
        path: info.outputPath('phone-today-no-page-highlight.png'),
        animations: 'disabled',
      });
      expect(errors).toEqual([]);
    });
  }
});
