import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { LEGACY_BRIDGE_MODULE_IDS } from '../../packages/shared/src/home-assistant-bridge';
import { MODULE_IDS } from '../../packages/shared/src/modules';
import { LATEST_MIGRATION_VERSION } from '../../apps/server/src/database';

import { captureEvidence } from './visualEvidence';

const evidence = resolve('docs/evidence/phase-2/screenshots');
const peopleEvidence = resolve('docs/evidence/admin-people');
const calendarEvidence = resolve('docs/evidence/calendar-connection');
const homeAssistantEvidence = resolve('docs/evidence/home-assistant-connection');
const systemEvidence = resolve('docs/evidence/system-health');
const activityEvidence = resolve('docs/evidence/system-activity');
const accessEvidence = resolve('docs/evidence/adult-access');

test('phone admin keeps all five bottom destinations in one visible row', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, title] of [
    ['/admin/system', 'System health'],
    ['/admin/routines', 'Routines and chores'],
    ['/more', 'More'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    const tabs = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link');
    await expect(tabs).toHaveCount(5);
    const boxes = await tabs.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          bottom: box.bottom,
          width: box.width,
          left: box.left,
          right: box.right,
        };
      }),
    );
    expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
    for (const box of boxes) {
      expect(box.bottom).toBeLessThanOrEqual(844);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(390);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    if (path === '/admin/system') {
      await page.screenshot({ path: testInfo.outputPath('phone-admin-dock.png') });
    }
    await page.getByRole('link', { name: 'More', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'More' })).toBeVisible();
  }
});

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});

for (const viewport of [
  { name: 'narrow phone', width: 320, height: 700 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'TV-sized adult browser', width: 1920, height: 1080 },
]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Manage photos matches other settings colours on ${viewport.name} in ${theme}`, async ({
      page,
    }, testInfo) => {
      const issues: string[] = [];
      page.on('pageerror', (error) => issues.push(error.message));
      page.on('console', (message) => {
        if (['warning', 'error'].includes(message.type())) issues.push(message.text());
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/more');
      await expect(page).toHaveTitle('Hearth');
      await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      const menu = page.locator('.more-screen');
      const photos = menu.getByRole('link', { name: 'Manage photos', exact: true });
      await expect(photos).toHaveAttribute('href', '/admin/photos');
      await expect(menu.getByRole('link', { name: 'Photos', exact: true })).toHaveAttribute(
        'href',
        '/photos',
      );
      await photos.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const colours = await page
        .locator('[href="/admin/photos"], [href="/admin/household"]')
        .evaluateAll((rows) =>
          rows.map((row) => {
            const style = getComputedStyle(row);
            const icon = getComputedStyle(row.querySelector('.more-card__icon')!);
            return {
              text: style.color,
              background: style.backgroundColor,
              icon: icon.color,
              iconBackground: icon.backgroundColor,
            };
          }),
        );
      expect(colours).toHaveLength(2);
      expect(colours[0]).toEqual(colours[1]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await captureEvidence(page, { path: testInfo.outputPath(`more-photos-${theme}.png`) });

      await menu.getByRole('link', { name: 'Photos', exact: true }).focus();
      await page.keyboard.press('ArrowDown');
      await expect(menu.locator('[data-focus-id="more-games"]')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(menu.getByRole('link', { name: 'Modules', exact: true })).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(photos).toBeFocused();
      await expect(photos).not.toHaveCSS('box-shadow', 'none');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/admin\/photos$/);
      await expect(page.getByRole('heading', { name: 'Manage photos', exact: true })).toBeVisible();
      await page.getByRole('link', { name: 'Back to More', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/more$/);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(
        axe.violations.filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        ),
      ).toEqual([]);
      expect(issues).toEqual([]);
    });
  }
}

test('phone More opens setup and household/member changes survive reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/today');
  await page.getByRole('link', { name: 'More', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'More' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Lists/ })).toBeVisible();
  await expect(page.locator('.more-card small')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Photos', exact: true })).toHaveAttribute(
    'href',
    '/photos',
  );
  await page.getByRole('link', { name: /Manage photos/ }).click();
  await expect(page.getByRole('heading', { name: 'Manage photos' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to More' }).click();

  await page.getByRole('link', { name: /Household details/ }).click();
  await page.getByLabel('Household name').fill('Rowan household');
  await page.getByRole('button', { name: 'Save household' }).click();
  await expect(page.getByRole('status')).toContainText('Household saved');
  await page.reload();
  await expect(page.getByLabel('Household name')).toHaveValue('Rowan household');

  await page.getByRole('link', { name: 'Back to More' }).click();
  await page.getByRole('link', { name: /People/ }).click();
  const add = page.locator('.admin-form--add-member');
  await expect(add.getByRole('radio')).toHaveCount(0);
  await add.locator('.member-colour-disclosure > summary').click();
  await expect(add.getByRole('radio')).toHaveCount(12);
  await add.getByLabel('Display name').fill('Alex');
  await add.getByRole('radio', { name: 'Berry' }).check();
  await add.getByRole('button', { name: 'Add person' }).click();
  const alex = page.locator('.member-editor').filter({ hasText: 'Alex' });
  await expect(alex).toBeVisible();
  await expect(alex.locator('.member-colour-disclosure')).not.toHaveAttribute('open');
  await expect(alex.locator('.member-colour-disclosure > summary')).toContainText('Berry');
  await alex.locator('.member-colour-disclosure > summary').click();
  await expect(alex.getByRole('radio', { name: 'Berry' })).toBeChecked();
  await page.reload();
  const reloadedAlex = page.locator('.member-editor').filter({ hasText: 'Alex' });
  await expect(reloadedAlex).toBeVisible();
  await expect(reloadedAlex.locator('.member-colour-disclosure')).not.toHaveAttribute('open');
  await expect(reloadedAlex.locator('.member-colour-disclosure > summary')).toContainText('Berry');
  await reloadedAlex.locator('.member-colour-disclosure > summary').click();
  await expect(reloadedAlex.getByRole('radio', { name: 'Berry' })).toBeChecked();
});

test('Hearth settings groups household tasks and keeps remote movement continuous', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  await expect(page.locator('.admin-setting-group > h2')).toHaveText([
    'Family content',
    'Household & access',
    'Connections & displays',
    'System',
  ]);
  await expect(page.locator('.admin-setting-row small')).toHaveCount(0);
  await expect(page.locator('[data-focus-id="admin-manage"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-focus-id="admin-today"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-focus-id="admin-chores"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-focus-id="admin-modules"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-focus-id="admin-household"]')).toBeFocused();
});

test('desktop admin uses a full workspace while phone admin stays compact', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/admin/chore-day');

  await expect(page.getByRole('heading', { name: 'Chores this week' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Administration' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Planning', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.locator('.companion-shell--admin .phone-tabs')).toBeHidden();

  const desktopPage = await page.locator('.admin-page').boundingBox();
  expect(desktopPage?.width).toBeGreaterThan(800);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.getByRole('link', { name: 'Photos', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/photos$/);
  await expect(page.getByRole('heading', { name: 'Manage photos' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/chore-day');
  await expect(page.getByRole('heading', { name: 'Chores this week' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Administration' })).toBeHidden();
  await expect(page.locator('.companion-shell--admin .phone-tabs')).toBeVisible();

  const phonePage = await page.locator('.admin-page').boundingBox();
  expect(phonePage?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('Adult access explains private passkeys and recovery without exposing demo controls', async ({
  page,
}) => {
  const consoleProblems: string[] = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) consoleProblems.push(message.text());
  });
  page.on('pageerror', (error) => consoleProblems.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/access');

  await expect(page).toHaveURL(/\/admin\/access$/);
  await expect(page.getByRole('heading', { name: 'Adult access' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Adults', exact: true })).toBeVisible();
  await expect(page.getByText(/real passkeys and recovery codes are available only/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set up this phone' })).toBeDisabled();
  await expect(page.getByText('Recovery needed', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your recovery code' })).toBeHidden();
  await page.getByText('Advanced sign-in & recovery', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create recovery code' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Maya', exact: true })).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  expect(consoleProblems).toEqual([]);
});

test('Connections contains only services used directly by Hearth', async ({ page }) => {
  const consoleProblems: string[] = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) consoleProblems.push(message.text());
  });
  page.on('pageerror', (error) => consoleProblems.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  await page.getByRole('link', { name: /Connections/ }).click();

  await expect(page).toHaveURL(/\/admin\/connections$/);
  await expect(page.getByRole('heading', { name: 'Connections', exact: true })).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await expect(page.locator('[data-focus-id="connection-calendar"]')).toBeVisible();
  await expect(page.getByText('Home Assistant', { exact: true })).toBeVisible();
  await expect(page.getByText('Apple Reminders', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Jellyfin', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Music Assistant', { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-focus-id="connection-calendar"]')).toContainText('Set up');
  expect(consoleProblems).toEqual([]);
});

test('household can create, complete and review Hearth reminders', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/reminders');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Reminders', exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-focus-id="nav-reminders"]')).toBeVisible();
  await expect(page.locator('[data-focus-id="reminders-filter-open"]')).toBeFocused();
  await page.getByPlaceholder('Add a reminder').fill('Test Reminder');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-focus-id="reminder-create-date"]')).toBeFocused();
  // Native date fields can have several keyboard-editable segments.
  for (let step = 0; step < 5; step += 1) {
    if (
      await page
        .locator('[data-focus-id="reminder-create-submit"]')
        .evaluate((el) => el === document.activeElement)
    )
      break;
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('[data-focus-id="reminder-create-submit"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Test Reminder', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Complete Test Reminder' }).click();
  await expect(page.getByText('Test Reminder', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'All' }).click();
  await expect(page.getByText('Test Reminder', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByPlaceholder('Add a reminder')).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(
    accessibility.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);

  await page.goto('/today');
  const reminderBand = page.locator('[data-focus-id="today-summary-reminders"]');
  await expect(reminderBand).toContainText('open reminders');
  await reminderBand.click();
  await expect(page).toHaveURL(/\/reminders$/);
});

test('adult can test, select, map, save and remove a read-only calendar connection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/connections');
  await page.locator('[data-focus-id="connection-calendar"]').click();
  await expect(page).toHaveURL(/\/admin\/connections\/calendar$/);
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await expect(page.getByText(/Local demo:/)).toBeVisible();

  await page.getByLabel('Apple Account email or CalDAV username').fill('fictional@example.com');
  await page.getByLabel('App-specific password').fill('fictional-app-password');
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByText('Connection works')).toBeVisible();
  await expect(page.getByLabel('App-specific password')).toHaveCount(0);
  await expect(page.getByLabel('Person for Ezra')).toHaveValue('member_ezra');
  await page.getByRole('checkbox', { name: 'Maya' }).uncheck();
  await page.getByRole('button', { name: 'Save 2 calendars' }).click();

  await expect(page.getByRole('heading', { name: 'Family calendars' })).toBeVisible();
  await expect(page.getByText('caldav.icloud.com · f•••@example.com')).toBeVisible();
  await expect(page.getByText('2 calendars connected · Read-only')).toBeVisible();
  await captureEvidence(page, {
    path: resolve(calendarEvidence, 'calendar-connected-phone-portrait.png'),
    animations: 'disabled',
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Family calendars' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove connection' }).click();
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page.getByRole('button', { name: 'Test connection' })).toBeVisible();
});

test('calendar setup exposes a family-safe sign-in error and supports keyboard Back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/connections');
  await page.locator('[data-focus-id="connection-calendar"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-focus-id="calendar-server-url"]')).toBeFocused();
  await page.getByLabel('Apple Account email or CalDAV username').fill('fictional@example.com');
  await page.getByLabel('App-specific password').fill('wrong-password');
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByRole('alert')).toContainText('Calendar sign-in was not accepted');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/admin\/connections$/);
  await expect(page.locator('[data-focus-id="connection-calendar"]')).toBeFocused();
});

test('private calendar setup does not describe the live connection as a local demo', async ({
  page,
}) => {
  await page.route('**/api/v1/runtime', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'private',
        generatedAt: '2026-08-17T03:47:00.000Z',
        household: {
          id: 'household_hearth_demo',
          name: 'Private household',
          timezone: 'Australia/Perth',
          locale: 'en-AU',
        },
        timezone: 'Australia/Perth',
        locale: 'en-AU',
        localDate: '2026-08-17',
        weekStart: '2026-08-17',
        currentMonth: '2026-08',
        requiresSetup: false,
      }),
    }),
  );
  await page.route('**/api/v1/auth/status', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'private',
        configured: true,
        secureOrigin: true,
        requiresSetup: false,
        authenticated: true,
        actor: { id: 'member_maya', displayName: 'Maya', role: 'adult' },
      }),
    }),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/connections/calendar');

  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await expect(page.getByText(/Local demo:/)).toHaveCount(0);
  await expect(page.getByText(/For iCloud, use an app-specific password/)).toBeVisible();
  await expect(page.getByText('Keep this address for iCloud.')).toBeVisible();
  await expect(page.getByLabel('Apple Account email or CalDAV username')).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`Home Assistant connects all Hearth features with one approval at ${viewport.width}px`, async ({
    page,
    request,
  }, testInfo) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (['warning', 'error'].includes(message.type())) problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(error.message));
    await page.setViewportSize(viewport);
    const key = `ha_${randomBytes(32).toString('base64url')}`;
    const pending = await request.post(
      'http://127.0.0.1:4310/api/v1/home-assistant/pairing-requests',
      {
        data: { requestId: 'request_browser_ha_pair', secret: key },
      },
    );
    expect(pending.status()).toBe(200);
    const pairing = await pending.json();
    await page.goto('/admin/connections/home-assistant');
    await expect(page).toHaveTitle(/Hearth/);
    await expect(page.getByRole('heading', { name: 'Home Assistant', exact: true })).toBeVisible();
    const bridge = page.locator('.ha-bridge-settings');
    await expect(bridge.getByRole('checkbox')).toHaveCount(0);
    await expect(bridge.getByText('Read your calendar and chores.')).toBeVisible();
    await expect(bridge.getByText('Complete and reopen today’s chores.')).toBeVisible();
    await page
      .locator('.ha-bridge-settings')
      .screenshot({ path: testInfo.outputPath('six-letter-setup.png') });
    await expect(
      page.getByText(/Completing chores affects earned pocket money as usual/),
    ).toBeVisible();
    await page.getByLabel('Code shown in Home Assistant').fill(pairing.code.toLowerCase());
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Approve Home Assistant' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Approved. Home Assistant will finish/)).toBeVisible();
    const exchange = await request.post(
      `http://127.0.0.1:4310/api/v1/home-assistant/pairing-requests/${pairing.id}/exchanges`,
      { data: { secret: key } },
    );
    expect(exchange.status()).toBe(200);
    expect((await exchange.json()).receipt.replayed).toBe(false);
    await expect(page.getByRole('heading', { name: 'Home Assistant is connected' })).toBeVisible();
    await expect(page.getByLabel('One-time key', { exact: true })).toHaveCount(0);
    await expect(
      page.getByText('Complete and reopen today’s chores', { exact: true }),
    ).toBeVisible();
    const headers = { authorization: `HearthAutomation ${key}` };
    const state = await request.get('http://127.0.0.1:4310/api/v1/home-assistant/state', {
      headers,
    });
    expect(state.status()).toBe(200);
    const snapshot = await state.json();
    expect(snapshot.permissions).toEqual({
      shareChores: true,
      shareCalendar: true,
      controlChores: true,
      controlModules: true,
      moduleIds: [...MODULE_IDS],
    });
    const admin = await request.get(
      'http://127.0.0.1:4310/api/v1/households/household_hearth_demo/admin',
      {
        headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
      },
    );
    expect(admin.status()).toBe(200);
    const expectedScreens = (await admin.json()).pairedDevices
      .filter(
        (screen: { status: string; revokedAt: string | null }) =>
          screen.status !== 'revoked' && screen.revokedAt === null,
      )
      .map((screen: { id: string }) => screen.id)
      .sort();
    expect(snapshot.screens.map((screen: { id: string }) => screen.id).sort()).toEqual(
      expectedScreens,
    );
    expect(snapshot.calendar).not.toBeNull();
    expect(
      (
        await request.get('http://127.0.0.1:4310/api/v1/households/household_hearth_demo/admin', {
          headers,
        })
      ).status(),
    ).toBe(403);
    const chore = snapshot.chores.items.find(
      (item: { state: string; locked: boolean }) => item.state === 'pending' && !item.locked,
    );
    const url = `http://127.0.0.1:4310/api/v1/home-assistant/chores/${chore.id}/completion`;
    const data = {
      requestId: 'request_browser_chore',
      localDate: snapshot.chores.localDate,
      isCompleted: true,
      completionId: null,
    };
    const done = await request.post(url, { headers, data });
    expect(done.status()).toBe(200);
    const receipt = await done.json();
    expect(receipt.state).toBe('completed');
    expect((await request.post(url, { headers, data })).status()).toBe(200);
    const undo = await request.post(url, {
      headers,
      data: {
        ...data,
        requestId: 'request_browser_undo',
        isCompleted: false,
        completionId: receipt.completionId,
      },
    });
    expect(undo.status()).toBe(200);
    expect((await undo.json()).state).toBe('pending');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const a11y = await new AxeBuilder({ page }).analyze();
    expect(
      a11y.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
    await page
      .locator('.ha-bridge-settings')
      .screenshot({ path: testInfo.outputPath('chore-control-summary.png') });
    expect(problems).toEqual([]);
  });
}

test('a limited HA connection requires confirmed reconnect instead of a silent permissions upgrade', async ({
  page,
  request,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const secret = `ha_${randomBytes(32).toString('base64url')}`;
  const issued = await request.post(
    'http://127.0.0.1:4310/api/v1/households/household_hearth_demo/home-assistant-bridge',
    {
      headers: { 'X-Hearth-Demo-Actor': 'member_maya' },
      data: {
        requestId: 'request_browser_limited',
        secret,
        screenIds: [],
        shareChores: false,
        shareCalendar: false,
        controlChores: false,
      },
    },
  );
  expect(issued.status()).toBe(200);
  await page.goto('/admin/connections/home-assistant');
  await expect(page.getByText(/This connection has limited access/)).toBeVisible();
  await expect(page.getByLabel('Code shown in Home Assistant')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reconnect Home Assistant', exact: true }).click();
  const keep = page.getByRole('button', { name: 'Keep access', exact: true });
  await expect(keep).toBeVisible();
  await keep.click();
  const headers = { authorization: `HearthAutomation ${secret}` };
  const untouched = await request.get('http://127.0.0.1:4310/api/v1/home-assistant/state', {
    headers,
  });
  expect((await untouched.json()).permissions).toEqual({
    shareChores: false,
    shareCalendar: false,
    controlChores: false,
    controlModules: false,
    moduleIds: [...LEGACY_BRIDGE_MODULE_IDS],
  });
  await page.getByRole('button', { name: 'Reconnect Home Assistant', exact: true }).click();
  await page
    .locator('.ha-bridge-settings')
    .screenshot({ path: testInfo.outputPath('limited-connection-reconnect.png') });
  await page.getByRole('button', { name: 'Disconnect and reconnect', exact: true }).click();
  await expect(page.getByLabel('Code shown in Home Assistant')).toBeVisible();
  expect(
    (await request.get('http://127.0.0.1:4310/api/v1/home-assistant/state', { headers })).status(),
  ).toBe(401);
  await expect(page.locator('.ha-bridge-settings').getByRole('checkbox')).toHaveCount(0);
});

test('adult can test, map, save and remove a tightly scoped Home Assistant connection', async ({
  page,
}) => {
  const consoleProblems: string[] = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) consoleProblems.push(message.text());
  });
  page.on('pageerror', (error) => consoleProblems.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/connections');
  await page.locator('[data-focus-id="connection-home-assistant"]').click();
  await expect(page).toHaveURL(/\/admin\/connections\/home-assistant$/);
  await expect(page.getByRole('heading', { name: 'Home Assistant', exact: true })).toBeVisible();
  await page.getByText('Optional home-action controls', { exact: true }).click();
  await expect(page.getByText('Strictly limited')).toBeVisible();

  const token = 'private-home-assistant-token';
  await page.getByLabel('Long-lived access token').fill(token);
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByText('Connection works')).toBeVisible();
  await expect(page.getByLabel('Long-lived access token')).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCount(7);
  await expect(page.getByLabel('Evening', { exact: true })).toContainText('Evening · Script');
  await expect(page.getByLabel('Goodnight', { exact: true })).toContainText('Goodnight · Script');
  await expect(page.getByLabel('Screen off', { exact: true })).toContainText('Screen off · Script');
  await captureEvidence(page, {
    path: resolve(homeAssistantEvidence, 'home-assistant-mapping-phone-portrait.png'),
    animations: 'disabled',
  });
  const mappingA11y = await new AxeBuilder({ page }).analyze();
  expect(
    mappingA11y.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);

  await page.getByLabel('Connection name').fill('Living room');
  const saveConnection = page.getByRole('button', { name: 'Save connection' });
  await saveConnection.scrollIntoViewIfNeeded();
  await captureEvidence(page, {
    path: resolve(homeAssistantEvidence, 'home-assistant-mapping-actions-phone-portrait.png'),
    animations: 'disabled',
  });
  await saveConnection.click();
  await expect(page.getByRole('heading', { name: 'Living room' })).toBeVisible();
  await expect(page.getByText('4 safety states · 3 approved actions')).toBeVisible();
  await expect(page.getByText('Protected playback active')).toBeVisible();
  await expect(
    page.getByText('homeassistant.local · Last checked 3 Aug 2026, 7:42 am'),
  ).toBeVisible();
  await expect(page.getByText(token)).toHaveCount(0);
  await captureEvidence(page, {
    path: resolve(homeAssistantEvidence, 'home-assistant-connected-phone-portrait.png'),
    animations: 'disabled',
  });
  const removeConnection = page.getByRole('button', { name: 'Remove connection' });
  await removeConnection.scrollIntoViewIfNeeded();
  await captureEvidence(page, {
    path: resolve(homeAssistantEvidence, 'home-assistant-connected-actions-phone-portrait.png'),
    animations: 'disabled',
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Living room' })).toBeVisible();
  await page.getByRole('button', { name: 'Replace connection' }).click();
  await page.getByLabel('Long-lived access token').fill('replacement-token-that-must-be-forgotten');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Replace connection' }).click();
  await expect(page.getByLabel('Long-lived access token')).toHaveValue('');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Remove connection' }).click();
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await page.getByText('Optional home-action controls', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Test connection' })).toBeVisible();
  expect(consoleProblems).toEqual([]);
});

test('Home Assistant setup has family-safe authentication errors and keyboard Back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/connections');
  await page.locator('[data-focus-id="connection-home-assistant"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-focus-id="home-assistant-bridge-setup"]')).toBeFocused();
  await page.getByText('Optional home-action controls', { exact: true }).click();
  await page.getByLabel('Long-lived access token').fill('wrong-home-assistant-token');
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Home Assistant did not accept that access token',
  );
  await expect(page.getByRole('alert')).not.toContainText('wrong-home-assistant-token');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/admin\/connections$/);
  await expect(page.locator('[data-focus-id="connection-home-assistant"]')).toBeFocused();
});

test('Home controls are not presented as an administration setting', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');

  await expect(page.getByRole('link', { name: /Living room/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Household/ })).toBeVisible();

  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByLabel('Living room status')).toBeVisible();
});

test('adult sees concise system health and can create an advanced recovery copy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/more');
  await expect(page.getByRole('heading', { name: 'System' })).toBeVisible();
  await page.getByRole('link', { name: /System health/ }).click();
  await expect(page.getByRole('heading', { name: 'System health' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hearth is protected' })).toBeVisible();
  await expect(
    page.getByText(`Migration ${LATEST_MIGRATION_VERSION} · checked 3 Aug 2026, 7:42 am`),
  ).toBeVisible();
  await expect(page.getByText(/Last backup 3 Aug 2026, 1:00 pm · 2.5 MB/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Connections and photos' })).toBeVisible();
  const calendar = page.locator('.system-connection-row').filter({ hasText: 'Calendar' });
  await expect(calendar).toContainText('Not set up');
  const homeAssistant = page
    .locator('.system-connection-row')
    .filter({ hasText: 'Home Assistant' });
  await expect(homeAssistant).toContainText('Not set up');
  const photos = page.locator('.system-connection-row').filter({ hasText: 'Family photos' });
  await expect(photos).toContainText('Ready');
  const advanced = page.getByText('Advanced recovery', { exact: true });
  await expect(page.getByRole('button', { name: 'Create extra copy' })).toBeHidden();
  await advanced.click();
  const create = page.getByRole('button', { name: 'Create extra copy' });
  await create.scrollIntoViewIfNeeded();
  await create.click();
  await expect(page.getByRole('status')).toContainText('Recovery copy created and checked');
  await expect(page.getByText(/Last backup 3 Aug 2026, 7:42 am · 2.5 MB/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Last backup 3 Aug 2026, 7:42 am · 2.5 MB/)).toBeVisible();
});

test('adult reviews family-readable activity and filters it without technical identifiers', async ({
  page,
  request,
}) => {
  await seedRecentActivity(request);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/system');
  const activity = page.locator('[data-focus-id="system-activity"]');
  await activity.scrollIntoViewIfNeeded();
  await activity.focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/admin\/activity$/);
  await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
  await expect(page.getByText('Recovery copy created')).toBeVisible();
  await expect(page.getByText('Household details updated')).toBeVisible();
  await expect(page.getByText('Chore marked done')).toBeVisible();
  expect((await page.locator('.activity-row').allTextContents()).join(' ')).not.toMatch(
    /audit_|request_|occurrence_/,
  );

  const allFilter = page.getByRole('button', { name: 'All' });
  await expect(allFilter).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const familyFilter = page.getByRole('button', { name: 'Family' });
  await expect(familyFilter).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(familyFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Household details updated')).toBeVisible();
  await expect(page.getByText('Chore marked done')).toHaveCount(0);
  await expect(page.getByText('Recovery copy created')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/admin\/system$/);
  await expect(activity).toBeFocused();
});

test('recent activity explains empty and unavailable states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/activity');
  await expect(page.getByRole('heading', { name: 'No activity yet' })).toBeVisible();

  await page.route('**/activity?limit=50', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'INTEGRATION_UNAVAILABLE',
          message: 'Recent activity is temporarily unavailable. Try again shortly.',
          retryable: true,
          requestId: null,
        },
      }),
    });
  });
  await page.reload();
  await expect(page.getByRole('alert')).toHaveText(
    'Recent activity is temporarily unavailable. Try again shortly.',
  );
});

test('system backup retry keeps the same command identity after a lost response', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requestIds: string[] = [];
  let attempt = 0;
  await page.route('**/system-backups', async (route) => {
    const body = route.request().postDataJSON() as { requestId: string };
    requestIds.push(body.requestId);
    attempt += 1;
    if (attempt === 1) {
      await route.fetch();
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  await page.goto('/admin/system');
  await page.getByText('Advanced recovery', { exact: true }).click();
  const create = page.getByRole('button', { name: 'Create extra copy' });
  await create.scrollIntoViewIfNeeded();
  await create.click();
  await expect(page.getByRole('alert')).toContainText('Hearth could not confirm the recovery copy');
  const retry = page.getByRole('button', { name: 'Try again' });
  await expect(retry).toBeFocused();
  await retry.press('Enter');
  await expect(page.getByRole('status')).toContainText('Recovery copy created and checked');
  expect(requestIds).toHaveLength(2);
  expect(requestIds[1]).toBe(requestIds[0]);
});

test('one unavailable connection does not hide the remaining system status', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/calendar-connection', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'INTEGRATION_UNAVAILABLE',
          message: 'Calendar setup could not be checked just now.',
          retryable: true,
          requestId: null,
        },
      }),
    });
  });

  await page.goto('/admin/system');
  const calendar = page.locator('.system-connection-row').filter({ hasText: 'Calendar' });
  await expect(calendar).toContainText('Unavailable');
  await expect(calendar).toContainText('Could not read calendar status.');
  await expect(
    page.locator('.system-connection-row').filter({ hasText: 'Home Assistant' }),
  ).toContainText('Not set up');
  await expect(
    page.locator('.system-connection-row').filter({ hasText: 'Family photos' }),
  ).toContainText('Ready');
  await expect(page.getByRole('heading', { name: 'Hearth is protected' })).toBeVisible();
});

test('system connections have deterministic D-pad movement and Back restoration', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/system');
  await expect(page.locator('[data-focus-id="system-manage-connections"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const calendar = page.locator('[data-focus-id="system-calendar-health"]');
  await expect(calendar).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/admin\/connections\/calendar$/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/admin\/system$/);
  await expect(calendar).toBeFocused();
});

test('People palette supports native keyboard selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/people');

  const ezra = page.locator('.member-editor').filter({ hasText: 'Ezra' });
  const summary = ezra.locator('.member-colour-disclosure > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(ezra.getByRole('radio')).toHaveCount(12);
  await page.keyboard.press('Tab');
  const sky = ezra.getByRole('radio', { name: 'Sky' });
  await expect(sky).toBeFocused();
  await page.keyboard.press('ArrowRight');

  await expect(ezra.getByRole('radio', { name: 'Ocean' })).toBeFocused();
  await expect(ezra.getByRole('radio', { name: 'Ocean' })).toBeChecked();
  await expect(summary).toContainText('Ocean');
  await page.keyboard.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(ezra.getByRole('radio')).toHaveCount(0);
  await expect(summary).toContainText('Ocean');
  const receipt = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.url().includes('/members/'),
  );
  await ezra.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await receipt).ok()).toBe(true);
  await page.reload();
  const saved = page.locator('.member-editor').filter({ hasText: 'Ezra' });
  await expect(saved.locator('.member-colour-disclosure')).not.toHaveAttribute('open');
  await expect(saved.locator('.member-colour-disclosure > summary')).toContainText('Ocean');
});

test('People can crop, persist, replace and restore a local profile photo', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleProblems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleProblems.push(message.text());
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/people');
  await expect(page).toHaveTitle(/Hearth/);
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
  const ezra = page.locator('.member-editor').filter({ hasText: 'Ezra' });
  const originalAvatar = await ezra.locator('.avatar').getAttribute('src');

  await ezra
    .getByLabel('Choose profile photo for Ezra')
    .setInputFiles(resolve('apps/web/public/demo/photos/garden-morning.webp'));
  const dialog = page.getByRole('dialog', { name: "Position Ezra's photo" });
  await expect(dialog).toBeVisible();
  const crop = dialog.getByRole('button', { name: /Photo crop for Ezra/ });
  await expect(crop).toBeVisible();
  await expect(dialog.locator('input[type="range"]')).toHaveCount(0);
  await expect(dialog.getByText(/Pinch to zoom/)).toBeVisible();

  await crop.focus();
  await page.keyboard.press('+');
  await expect(crop).toHaveAttribute('aria-label', /Zoom 110 percent/);
  await page.keyboard.press('Home');
  await expect(crop).toHaveAttribute('aria-label', /Zoom 100 percent/);

  const cropBounds = await crop.boundingBox();
  expect(cropBounds).not.toBeNull();
  if (cropBounds === null) throw new Error('Crop surface was not rendered.');
  await page.mouse.move(cropBounds.x + cropBounds.width / 2, cropBounds.y + cropBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    cropBounds.x + cropBounds.width / 2,
    cropBounds.y + cropBounds.height / 2 + 40,
  );
  await page.mouse.up();
  expect(await crop.getAttribute('aria-label')).not.toContain('Vertical position 50 percent');
  await crop.focus();
  await page.keyboard.press('Home');
  await expect(crop).toHaveAttribute('aria-label', /Horizontal position 50 percent/);

  await crop.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const centreX = rect.left + rect.width / 2;
    const centreY = rect.top + rect.height / 2;
    const fire = (type: string, pointerId: number, clientX: number, clientY: number) => {
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          buttons: type === 'pointerup' ? 0 : 1,
          clientX,
          clientY,
          isPrimary: pointerId === 1,
          pointerId,
          pointerType: 'touch',
        }),
      );
    };
    fire('pointerdown', 1, centreX - 30, centreY);
    fire('pointerdown', 2, centreX + 30, centreY);
    fire('pointermove', 1, centreX - 50, centreY - 8);
    fire('pointermove', 2, centreX + 50, centreY + 8);
    fire('pointerup', 1, centreX - 50, centreY - 8);
    fire('pointerup', 2, centreX + 50, centreY + 8);
  });
  await expect(crop).toHaveAttribute('aria-label', /Zoom 1[6-7]\d percent/);
  await captureEvidence(page, { path: '/tmp/hearth-profile-photo-touch-crop-phone.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await captureEvidence(page, { path: '/tmp/hearth-profile-photo-touch-crop-phone-landscape.png' });
  await dialog.getByRole('button', { name: 'Use this photo' }).click();

  await expect(dialog).toBeHidden();
  await expect(ezra.locator('.avatar')).toHaveAttribute('src', /\/member_ezra\/avatar\?v=/);
  const customAvatar = await ezra.locator('.avatar').getAttribute('src');
  expect(customAvatar).not.toBe(originalAvatar);
  await captureEvidence(page, { path: '/tmp/hearth-profile-photo-saved-phone.png' });
  await page.reload();
  const reloadedEzra = page.locator('.member-editor').filter({ hasText: 'Ezra' });
  await expect(reloadedEzra.locator('.avatar')).toHaveAttribute('src', customAvatar ?? '');
  await expect(reloadedEzra.getByText('Replace photo')).toBeVisible();

  await reloadedEzra.getByRole('button', { name: 'Restore original' }).click();
  await expect(reloadedEzra.locator('.avatar')).toHaveAttribute('src', '/demo/ezra.png');
  await expect(reloadedEzra.getByText('Change photo')).toBeVisible();
  expect(consoleProblems).toEqual([]);
});

test('television code is approved on the companion and can be revoked', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/pair');
  await expect(page.getByRole('heading', { name: 'Connect this television' })).toBeVisible();
  const code = (await page.locator('.pairing-code').innerText()).replaceAll(/\s/g, '');
  expect(code).toHaveLength(6);

  const approval = await request.post(
    'http://127.0.0.1:4310/api/v1/households/household_hearth_demo/pairing-approvals',
    {
      headers: { 'x-hearth-demo-actor': 'member_maya' },
      data: { requestId: 'request_e2e_pair_approve', code },
    },
  );
  expect(approval.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Television connected' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/televisions');
  const newDevice = page.locator('.device-row').filter({ hasText: 'Living room TV' }).last();
  await expect(newDevice).toContainText('Connected');
  await newDevice.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(newDevice).toContainText('It will need a new code to reconnect.');
  await newDevice.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Living room TV disconnected');
  await expect(page.getByRole('heading', { name: 'Connected screens' })).toBeFocused();
  await page.getByText('Disconnected screen history (1)', { exact: true }).click();
  await expect(page.locator('.device-disconnected-history .device-row')).toContainText(
    'Disconnected',
  );
});

test('television pairing has deterministic initial focus and Back behaviour', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/today');
  await page.goto('/pair');
  await expect(page.locator('[data-focus-id="pair-new-code"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
});

for (const path of [
  '/admin',
  '/admin/household',
  '/admin/people',
  '/admin/access',
  '/admin/today',
  '/admin/televisions',
  '/admin/connections',
  '/admin/connections/calendar',
  '/admin/connections/home-assistant',
  '/admin/system',
  '/admin/activity',
]) {
  test(`@a11y ${path} has no serious accessibility violations`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
  });
}

for (const viewport of [
  { name: 'narrow-phone', width: 320, height: 700 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'desktop-controller', width: 1280, height: 720 },
] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`People colours stay compact and independent at ${viewport.name} in ${theme}`, async ({
      page,
    }, testInfo) => {
      const issues: string[] = [];
      page.on('pageerror', (error) => issues.push(error.message));
      page.on('console', (message) => {
        if (['warning', 'error'].includes(message.type())) issues.push(message.text());
      });
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(viewport);
      await page.goto('/admin/people');
      await expect(page).toHaveTitle(/Hearth/);
      await expect(page).toHaveURL(/\/admin\/people$/);
      await expect(page.getByRole('heading', { name: 'People', exact: true })).toBeVisible();
      await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      const palettes = page.locator('.member-colour-disclosure');
      expect(await palettes.count()).toBeGreaterThan(1);
      await expect(page.locator('.member-colour-disclosure[open]')).toHaveCount(0);
      await expect(page.getByRole('radio')).toHaveCount(0);
      const first = palettes.first();
      const closedHeight = (await first.boundingBox())!.height;
      expect(closedHeight).toBe(48);
      await page.screenshot({ path: testInfo.outputPath(`people-collapsed-${theme}.png`) });
      await first.locator('summary').click();
      await expect(first.getByRole('radio')).toHaveCount(12);
      await expect(page.locator('.member-colour-disclosure[open]')).toHaveCount(1);
      expect((await first.boundingBox())!.height).toBeGreaterThan(closedHeight * 2);
      await first.getByRole('radio', { name: 'Ocean' }).check();
      await expect(first.locator('summary')).toContainText('Ocean');
      if (viewport.name === 'phone') {
        const result = await new AxeBuilder({ page }).analyze();
        expect(
          result.violations.filter((violation) =>
            ['serious', 'critical'].includes(violation.impact ?? ''),
          ),
        ).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath(`people-expanded-${theme}.png`) });
      }
      await first.locator('summary').click();
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(first.locator('summary')).toContainText('Ocean');
      expect((await first.boundingBox())!.height).toBe(closedHeight);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (viewport.name === 'phone') {
        const result = await new AxeBuilder({ page }).analyze();
        expect(
          result.violations.filter((violation) =>
            ['serious', 'critical'].includes(violation.impact ?? ''),
          ),
        ).toEqual([]);
      }
      expect(issues).toEqual([]);
    });
  }
}

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual Adult access at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/admin/access');
    await expect(page.getByRole('heading', { name: 'Adult access' })).toBeVisible();
    await captureEvidence(page, {
      path: resolve(accessEvidence, `adult-access-${viewport.name}.png`),
      animations: 'disabled',
    });
    await page.getByText('Advanced sign-in & recovery', { exact: true }).click();
    await page.getByRole('heading', { name: 'Your recovery code' }).scrollIntoViewIfNeeded();
    await captureEvidence(page, {
      path: resolve(accessEvidence, `adult-access-recovery-${viewport.name}.png`),
      animations: 'disabled',
    });
  });
}

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual System health at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/admin/system');
    await expect(page.getByRole('heading', { name: 'System health' })).toBeVisible();
    await captureEvidence(page, {
      path: resolve(systemEvidence, `system-health-${viewport.name}.png`),
      animations: 'disabled',
    });
  });
}

test('@visual System health recovery action at phone portrait', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/system');
  await page.getByText('Advanced recovery', { exact: true }).click();
  const create = page.getByRole('button', { name: 'Create extra copy' });
  await create.scrollIntoViewIfNeeded();
  await captureEvidence(page, {
    path: resolve(systemEvidence, 'system-health-actions-phone-portrait.png'),
    animations: 'disabled',
  });
});

test('@visual @a11y dark System health at phone portrait', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'hearth.appearance.v1',
      JSON.stringify({ theme: 'dark', eveningDimming: false }),
    );
  });
  await page.goto('/admin/system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
  await captureEvidence(page, {
    path: resolve(systemEvidence, 'system-health-dark-phone-portrait.png'),
    animations: 'disabled',
  });
});

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual Recent activity at ${viewport.name}`, async ({ page, request }) => {
    await seedRecentActivity(request);
    await page.setViewportSize(viewport);
    await page.goto('/admin/activity');
    await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
    await captureEvidence(page, {
      path: resolve(activityEvidence, `recent-activity-${viewport.name}.png`),
      animations: 'disabled',
    });
    if (viewport.name === 'phone-landscape') {
      await page.locator('.activity-row').last().scrollIntoViewIfNeeded();
      await captureEvidence(page, {
        path: resolve(activityEvidence, 'recent-activity-phone-landscape-rows.png'),
        animations: 'disabled',
      });
    }
  });
}

test('@visual @a11y dark Recent activity at phone portrait', async ({ page, request }) => {
  await seedRecentActivity(request);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/v1/households/*/activity*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      'hearth.appearance.v1',
      JSON.stringify({ theme: 'dark', eveningDimming: false }),
    );
  });
  await page.goto('/admin/activity');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.admin-feedback')).toBeVisible();
  const loadingResults = await new AxeBuilder({ page }).analyze();
  expect(
    loadingResults.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
  await expect(page.locator('.activity-row').first()).toBeVisible();
  await expect(page.locator('.admin-feedback')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
  await captureEvidence(page, {
    path: resolve(activityEvidence, 'recent-activity-dark-phone-portrait.png'),
    animations: 'disabled',
  });
});

async function seedRecentActivity(request: APIRequestContext): Promise<void> {
  const base = 'http://127.0.0.1:4310/api/v1/households/household_hearth_demo';
  const headers = { 'X-Hearth-Demo-Actor': 'member_maya' };
  const household = await request.patch(`${base}/settings`, {
    headers,
    data: {
      requestId: 'request_activity_household_e2e',
      name: 'Hearth Demo Home',
      timezone: 'Australia/Perth',
    },
  });
  const chore = await request.post(`${base}/chore-occurrences/occurrence_school_bag/completions`, {
    data: { requestId: 'request_activity_chore_e2e' },
  });
  const backup = await request.post(`${base}/system-backups`, {
    headers,
    data: { requestId: 'request_activity_backup_e2e' },
  });
  expect(household.ok()).toBe(true);
  expect(chore.ok()).toBe(true);
  expect(backup.ok()).toBe(true);
}

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual calendar setup at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/admin/connections/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
    await captureEvidence(page, {
      path: resolve(calendarEvidence, `calendar-setup-${viewport.name}.png`),
      animations: 'disabled',
      fullPage: true,
    });
  });
}

test('@visual calendar selection at phone portrait', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/connections/calendar');
  await page.getByLabel('Apple Account email or CalDAV username').fill('fictional@example.com');
  await page.getByLabel('App-specific password').fill('fictional-app-password');
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByText('Connection works')).toBeVisible();
  await captureEvidence(page, {
    path: resolve(calendarEvidence, 'calendar-selection-phone-portrait.png'),
    animations: 'disabled',
    fullPage: true,
  });
});

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual Home Assistant setup at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/admin/connections/home-assistant');
    await expect(page.getByRole('heading', { name: 'Home Assistant', exact: true })).toBeVisible();
    await captureEvidence(page, {
      path: resolve(homeAssistantEvidence, `home-assistant-setup-${viewport.name}.png`),
      animations: 'disabled',
    });
  });
}

test('@a11y television pairing has no serious accessibility violations', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/pair');
  await expect(page.locator('h1')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
});

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual admin home at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Hearth settings' })).toBeVisible();
    await captureEvidence(page, {
      path: resolve(evidence, `admin-${viewport.name}.png`),
      animations: 'disabled',
    });
  });
}

test('@visual television pairing at 1080p', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/pair');
  await expect(page.locator('.pairing-code')).toBeVisible();
  await captureEvidence(page, {
    path: resolve(evidence, 'pairing-tv-1080.png'),
    animations: 'disabled',
  });
});

for (const viewport of [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const) {
  test(`@visual People colour palette at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/admin/people');
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
    const first = page.locator('.member-editor').first();
    await expect(first.getByRole('radio')).toHaveCount(0);
    await captureEvidence(page, {
      path: resolve(peopleEvidence, `people-colours-collapsed-${viewport.name}.png`),
      animations: 'disabled',
    });
    await first.locator('.member-colour-disclosure > summary').click();
    await expect(first.getByRole('radio')).toHaveCount(12);
    await captureEvidence(page, {
      path: resolve(peopleEvidence, `people-colour-picker-${viewport.name}.png`),
      animations: 'disabled',
      fullPage: true,
    });
  });
}
