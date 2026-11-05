import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { DEFAULT_MODULE_FLAGS, MODULE_IDS, type ModuleId } from '../../packages/shared/src/modules';

const api = 'http://127.0.0.1:4310/api/v1';
const home = `${api}/households/household_hearth_demo`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
async function setModule(request: APIRequestContext, id: ModuleId, enabled: boolean, suffix = '') {
  const result = await request.put(`${home}/modules/${id}`, {
    headers: adult,
    data: { requestId: `request_module_${id.toLowerCase()}_${enabled}${suffix}`, enabled },
  });
  expect(result.status()).toBe(200);
}
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
});

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'TV adult browser', width: 1920, height: 1080 },
]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Modules are simple, accessible and keyboard operable on ${viewport.name} in ${theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/more');
      await page
        .locator('.more-screen')
        .getByRole('link', { name: 'Modules', exact: true })
        .click();
      await expect(page.getByRole('heading', { name: 'Modules', exact: true })).toBeVisible();
      await expect(page.getByRole('switch')).toHaveCount(MODULE_IDS.length);
      await page.screenshot({
        path: info.outputPath(`modules-first-view-${viewport.name}-${theme}.png`),
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const photos = page.getByRole('switch', { name: 'Photos', exact: true });
      await photos.focus();
      await page.keyboard.press('Enter');
      await expect(photos).toHaveAttribute('aria-checked', 'false');
      await expect(photos).not.toHaveAttribute('aria-disabled', 'true');
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('switch', { name: 'Games', exact: true })).toBeFocused();
      await expect(page.getByRole('switch', { name: 'Games', exact: true })).toHaveCSS(
        'outline-offset',
        '-4px',
      );
      await photos.scrollIntoViewIfNeeded();
      const bounds = await photos.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(
        axe.violations.filter((entry) => ['serious', 'critical'].includes(entry.impact ?? '')),
      ).toEqual([]);
      await page.screenshot({ path: info.outputPath(`modules-${viewport.name}-${theme}.png`) });
      await page.goto('/more');
      await expect(page.locator('a[href="/photos"],a[href="/admin/photos"]')).toHaveCount(0);
      await page.goto('/admin/photos');
      await expect(page).toHaveURL(/\/admin\/modules$/);
      await page.getByRole('switch', { name: 'Photos', exact: true }).click();
      await expect(page.getByRole('switch', { name: 'Photos', exact: true })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await page.goto('/photos');
      await expect(page.locator('.photos-screen')).toBeVisible();
    });
  }
}

test('all modules off hides content, retains data, blocks direct links and keeps core recovery', async ({
  page,
  request,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await (await request.get(`${home}/reminders?includeCompleted=true`)).json();
  for (const id of MODULE_IDS) await setModule(request, id, false);
  await page.goto('/today');
  await expect(page.getByText('All set for today.', { exact: true })).toBeVisible();
  await expect(
    page.locator('.today-photo,.today-summary-row,.today-columns,.today-weather'),
  ).toHaveCount(0);
  const tabs = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveText('Today');
  await expect(tabs.nth(1)).toHaveText('More');
  await page.getByRole('link', { name: 'More', exact: true }).click();
  await expect(page.locator('.more-screen a[href="/admin/modules"]')).toBeVisible();
  await expect(page.locator('.more-screen a[href="/admin/people"]')).toBeVisible();
  await expect(
    page.locator('a[href="/reminders"],a[href="/weather"],a[href="/admin/planning"]'),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('all-off-core-phone.png') });
  for (const route of [
    '/calendar/week',
    '/weather',
    '/reminders',
    '/chores',
    '/lists',
    '/meals',
    '/home',
    '/photos',
    '/games',
    '/WEATHER/',
    '/%72eminders',
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/today$/);
  }
  for (const route of ['/ADMIN/PHOTOS', '/%61dmin/connections/calendar', '/ADMIN/PLANNING/']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/modules$/);
  }
  await page.goto('/admin/connections/home-assistant');
  await expect(page.getByText('Home Assistant controls Hearth', { exact: true })).toBeVisible();
  await expect(page.getByText('Hearth controls Home Assistant', { exact: true })).toHaveCount(0);
  await setModule(request, 'reminders', true);
  await page.goto('/reminders');
  await expect(
    page.getByRole('heading', { name: 'Reminders', exact: true, level: 1 }),
  ).toBeVisible();
  expect(await (await request.get(`${home}/reminders?includeCompleted=true`)).json()).toEqual(
    before,
  );
});

test('HA switch commands trigger realtime route exit and cannot access disabled features', async ({
  page,
  request,
}) => {
  const secret = `ha_${'f'.repeat(43)}`;
  const headers = { authorization: `HearthAutomation ${secret}` };
  const grant = await request.post(`${home}/home-assistant-bridge`, {
    headers: adult,
    data: {
      requestId: 'request_modules_grant',
      secret,
      screenIds: [],
      shareChores: true,
      shareCalendar: true,
      controlChores: true,
      controlModules: true,
    },
  });
  expect(grant.status()).toBe(200);
  await page.goto('/weather');
  await expect(page.locator('.weather-screen')).toBeVisible();
  const input = { requestId: 'request_modules_ha_weather', enabled: false };
  const first = await request.put(`${api}/home-assistant/modules/weather`, {
    headers,
    data: input,
  });
  expect(first.status()).toBe(200);
  await expect(page).toHaveURL(/\/today$/);
  const replay = await request.put(`${api}/home-assistant/modules/weather`, {
    headers,
    data: input,
  });
  expect((await replay.json()).replayed).toBe(true);
  expect((await request.get(`${home}/weather`)).status()).toBe(403);
  for (const id of ['calendar', 'chores'] as const)
    expect(
      (
        await request.put(`${api}/home-assistant/modules/${id}`, {
          headers,
          data: { requestId: `request_modules_ha_${id}`, enabled: false },
        })
      ).status(),
    ).toBe(200);
  const state = await (await request.get(`${api}/home-assistant/state`, { headers })).json();
  expect(state.modules).toEqual({
    ...DEFAULT_MODULE_FLAGS,
    weather: false,
    calendar: false,
    chores: false,
  });
  expect(state.chores).toBeNull();
  expect(state.calendar).toBeNull();
  expect(
    (
      await request.get(
        `${api}/home-assistant/calendar?start=2026-08-03T00:00:00Z&end=2026-08-04T00:00:00Z`,
        { headers },
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put(`${api}/home-assistant/modules/weather`, {
        headers,
        data: { requestId: 'request_modules_ha_on', enabled: true },
      })
    ).status(),
  ).toBe(200);
  await expect(page.locator('a[href="/weather"]:visible')).toHaveCount(1);
  expect((await request.get(`${home}/admin`, { headers })).status()).toBe(403);
});

test('a remote module change preserves an unrelated unsaved household form', async ({
  page,
  request,
}) => {
  await page.goto('/admin/household');
  const name = page.getByLabel('Household name', { exact: true });
  await expect(name).toBeVisible();
  await name.fill('Unsaved household draft');
  const refresh = page.waitForResponse(
    (response) => response.url().endsWith('/modules') && response.request().method() === 'GET',
  );
  await setModule(request, 'weather', false);
  expect((await (await refresh).json()).enabled.weather).toBe(false);
  await expect(page).toHaveURL(/\/admin\/household$/);
  await expect(name).toHaveValue('Unsaved household draft');
  await expect(page.getByRole('heading', { name: 'Modules', exact: true })).toHaveCount(0);
});

test('a paired screen can read flags but cannot turn modules back on', async ({
  page,
  request,
}) => {
  const secret = 'm'.repeat(43);
  const started = await request.post(`${api}/tv-pairing-sessions`, {
    data: {
      requestId: 'request_module_screen',
      deviceName: 'Module test screen',
      pairingSecret: secret,
      applicationVersion: 'test',
    },
  });
  const { pairing } = await started.json();
  expect(
    (
      await request.post(`${home}/pairing-approvals`, {
        headers: adult,
        data: { requestId: 'request_module_screen_approval', code: pairing.code },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post(`${api}/tv-pairing-sessions/${pairing.id}/credential-exchanges`, {
        data: { requestId: 'request_module_screen_exchange', pairingSecret: secret },
      })
    ).status(),
  ).toBe(200);
  const headers = { authorization: `Bearer ${secret}` };
  expect((await request.get(`${home}/modules`, { headers })).status()).toBe(200);
  expect(
    (
      await request.put(`${home}/modules/photos`, {
        headers,
        data: { requestId: 'request_screen_forbidden', enabled: false },
      })
    ).status(),
  ).toBe(401);
  await page.context().addCookies([
    {
      name: 'hearth_device',
      value: secret,
      url: 'http://127.0.0.1:4320',
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
  await page.goto('/more');
  await expect(page.locator('.more-screen')).toBeVisible();
  await expect(page.locator('a[href="/admin/modules"]')).toHaveCount(0);
  await page.goto('/admin/modules');
  await expect(page).toHaveURL(/\/today$/);
});
