import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { DEFAULT_MODULE_FLAGS } from '../../packages/shared/src/modules';
const api = 'http://127.0.0.1:4310/api/v1';
const home = `${api}/households/household_hearth_demo`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
async function enable(request: APIRequestContext) {
  expect(
    (
      await request.put(`${home}/modules/morningRoutine`, {
        headers: adult,
        data: { requestId: 'request_profiles_enable', enabled: true },
      })
    ).ok(),
  ).toBe(true);
}
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
});

test('adult edits both routines, automatic day selection preserves school steps and daily checks', async ({
  page,
  request,
}, info) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enable(request);
  const school = {
    startTime: '07:00',
    endTime: '08:00',
    selectedMemberIds: ['member_ezra'],
    routines: [
      { memberId: 'member_ezra', steps: [{ id: 'step_school_kept', title: 'Pack school bag' }] },
    ],
  };
  expect(
    (
      await request.put(`${home}/morning-routine/settings`, {
        headers: adult,
        data: { requestId: 'request_school_seed', expectedRevision: 0, configuration: school },
      })
    ).ok(),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/morning-routine');
  await expect(page.getByLabel('Monday routine')).toHaveValue('schoolDays');
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Pack school bag');
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Use a countdown' })).not.toBeChecked();
  await expect(page.getByLabel('Start time', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add step for Ezra' }).click();
  await page.getByRole('textbox', { name: 'Ezra step 1' }).fill('Weekend reading');
  await page.getByLabel('Monday routine').selectOption('weekends');
  await page.getByRole('button', { name: 'School days', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Pack school bag');
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Weekend reading');
  await page.getByRole('button', { name: 'Save Morning Routine' }).click();
  await expect(page.getByText('Morning Routine saved.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Monday routine')).toHaveValue('weekends');
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Pack school bag');
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Weekend reading');
  const profileButtons = page.getByRole('group', { name: 'Edit routine' });
  const profileColours = () =>
    profileButtons
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => getComputedStyle(button).backgroundColor));
  await expect(page.getByRole('button', { name: 'Weekends', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(new Set(await profileColours()).size).toBe(2);
  await page.screenshot({ path: info.outputPath('weekend-settings-phone.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(new Set(await profileColours()).size).toBe(2);
  await page.screenshot({
    path: info.outputPath('weekend-settings-phone-dark.png'),
    fullPage: true,
  });
  const darkAudit = await new AxeBuilder({ page }).analyze();
  expect(
    darkAudit.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.reload();
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const audit = await new AxeBuilder({ page }).analyze();
  expect(
    audit.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
  await page.goto('/morning-routine');
  await expect(page.locator('.morning-day-label')).toHaveText('Weekends');
  await expect(page.getByRole('progressbar', { name: 'Morning time remaining' })).toHaveCount(0);
  const check = page.getByRole('button', { name: 'Ezra: Weekend reading', exact: true });
  await check.click();
  await expect(check).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(check).toHaveAttribute('aria-pressed', 'true');
  const saved = await (
    await request.get(`${home}/morning-routine/settings`, { headers: adult })
  ).json();
  expect(saved.profiles.schoolDays.configuration).toEqual(school);
  saved.profiles.weekends.days = saved.profiles.weekends.days.filter(
    (day: string) => day !== 'mon',
  );
  saved.profiles.schoolDays.days.push('mon');
  expect(
    (
      await request.put(`${home}/morning-routine/settings`, {
        headers: adult,
        data: {
          requestId: 'request_back_to_school',
          expectedRevision: saved.revision,
          profiles: saved.profiles,
        },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await expect(page.locator('.morning-day-label')).toHaveText('School days');
  await expect(
    page.getByRole('button', { name: 'Ezra: Pack school bag', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('progressbar', { name: 'Morning time remaining' })).toBeVisible();
  saved.profiles.schoolDays.days = saved.profiles.schoolDays.days.filter(
    (day: string) => day !== 'mon',
  );
  expect(
    (
      await request.put(`${home}/morning-routine/settings`, {
        headers: adult,
        data: {
          requestId: 'request_unassigned_monday',
          expectedRevision: saved.revision + 1,
          profiles: saved.profiles,
        },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'No routine scheduled today' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ezra:/ })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test('an accepted profiles save with a lost response can still retry after its own revision refresh', async ({
  page,
  request,
}) => {
  await enable(request);
  await page.goto('/admin/morning-routine');
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Use a countdown' }).check();
  await page.getByLabel('Start time', { exact: true }).fill('09:00');
  await page.getByLabel('Ready by', { exact: true }).fill('10:00');
  const bodies: unknown[] = [];
  let lost = false;
  let replayed = false;
  await page.route('**/morning-routine/settings', async (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    bodies.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (!lost) {
      lost = true;
      await route.abort();
    } else {
      replayed = (await response.json()).replayed;
      await route.fulfill({ response });
    }
  });
  await page.getByRole('button', { name: 'Save Morning Routine' }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeEnabled();
  // The server revision has changed even though its write response was lost.
  expect(
    (await (await request.get(`${home}/morning-routine/settings`, { headers: adult })).json())
      .revision,
  ).toBe(1);
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(page.getByText('Morning Routine saved.', { exact: true })).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toEqual(bodies[1]);
  expect(replayed).toBe(true);
});

for (const viewport of [
  { width: 1280, height: 640 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`untimed weekend keeps seven steps and verse at ${viewport.width}x${viewport.height} ${theme}`, async ({
      page,
    }, info) => {
      const issues: string[] = [];
      page.on('pageerror', (error) => issues.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') issues.push(message.text());
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.route('**/api/v1/households/*/modules', (route) =>
        route.fulfill({
          json: {
            householdId: 'household_hearth_demo',
            enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true },
          },
        }),
      );
      await page.route('**/api/v1/households/*/morning-routine', (route) =>
        route.fulfill({
          json: {
            householdId: 'household_hearth_demo',
            generatedAt: '2026-08-08T09:15:00+08:00',
            timezone: 'Australia/Perth',
            localDate: '2026-08-08',
            isWeekday: false,
            profileId: 'weekends',
            countdownEnabled: false,
            settingsRevision: 1,
            startTime: '09:00',
            endTime: '10:00',
            people: ['Ari', 'Bo', 'Kai'].map((name, i) => ({
              person: {
                id: `member_${name.toLowerCase()}`,
                displayName: name,
                color: ['#1668b7', '#3f7251', '#c97900'][i],
                role: 'child',
                avatarUrl: '/demo/ezra.png',
              },
              steps: [
                'Get dressed',
                'Have breakfast',
                'Brush teeth',
                'Tidy your room',
                'Feed pets',
                'Read a book',
                'Choose an activity',
              ].map((title, j) => ({
                id: `step_weekend_${i}_${j}`,
                title,
                isCompleted: j === 0,
                version: j === 0 ? 1 : 0,
              })),
            })),
          },
        }),
      );
      await page.route('**/api/v1/households/*/daily-verse', (route) =>
        route.fulfill({
          json: {
            reference: 'Demo preview',
            text: 'Let kindness shape the way you speak and serve one another today.',
            translation: 'Demo',
            sourceUrl: null,
            freshness: 'current',
            statusMessage: null,
          },
        }),
      );
      await page.goto('/morning-routine');
      await expect(page).toHaveTitle('Hearth');
      await expect(
        page.getByRole('heading', { name: 'Morning Routine', exact: true }),
      ).toBeVisible();
      await expect(page.locator('.morning-day-label')).toHaveText('Weekends');
      await expect(page.getByRole('progressbar', { name: 'Morning time remaining' })).toHaveCount(
        0,
      );
      await expect(page.getByText('Ready by', { exact: false })).toHaveCount(0);
      await expect(page.locator('.morning-step')).toHaveCount(21);
      if (viewport.width >= 1200) {
        for (const row of await page.locator('.morning-step').all())
          await expect(row).toBeInViewport({ ratio: 1 });
        expect(
          await page
            .locator('.app-content')
            .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
        ).toBe(true);
      }
      const verse = page.getByRole('button', { name: 'Read Demo preview', exact: true });
      await expect(verse).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: info.outputPath('weekend-routine.png') });
      expect(issues).toEqual([]);
    });
  }

test('a foreground screen switches profiles at household midnight before the next 30-second poll', async ({
  page,
  request,
}) => {
  await enable(request);
  // Keep the date fixed while the page loads; a slow runner must not cross midnight first.
  await page.clock.setFixedTime(new Date('2026-08-07T23:59:59+08:00'));
  await page.route('**/api/v1/runtime', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: {
        ...(await response.json()),
        mode: 'private',
        generatedAt: '2026-08-07T23:59:59+08:00',
        localDate: '2026-08-07',
      },
    });
  });
  await page.route('**/api/v1/auth/status', (route) =>
    route.fulfill({
      json: {
        mode: 'private',
        accessMethod: 'phone',
        configured: true,
        secureOrigin: true,
        requiresSetup: false,
        authenticated: true,
        actor: { id: 'member_maya', displayName: 'Maya', role: 'adult' },
      },
    }),
  );
  let reads = 0;
  await page.route('**/api/v1/households/*/morning-routine', (route) => {
    reads++;
    const weekend = reads > 1;
    return route.fulfill({
      json: {
        householdId: 'household_hearth_demo',
        generatedAt: weekend ? '2026-08-08T00:00:01+08:00' : '2026-08-07T23:59:59+08:00',
        timezone: 'Australia/Perth',
        localDate: weekend ? '2026-08-08' : '2026-08-07',
        isWeekday: !weekend,
        profileId: weekend ? 'weekends' : 'schoolDays',
        countdownEnabled: !weekend,
        settingsRevision: 1,
        startTime: '07:00',
        endTime: '08:00',
        people: [],
      },
    });
  });
  await page.goto('/morning-routine');
  await expect(page.locator('.morning-day-label')).toHaveText('School days');
  await page.clock.setFixedTime(new Date('2026-08-08T00:00:01+08:00'));
  await expect(page.locator('.morning-day-label')).toHaveText('Weekends');
  expect(reads).toBeGreaterThan(1);
});

test('saving identifies an invalid draft in the other profile without discarding either list', async ({
  page,
  request,
}) => {
  await enable(request);
  await page.goto('/admin/morning-routine');
  await page.getByRole('button', { name: 'Add step for Ezra' }).click();
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await page.getByRole('button', { name: 'Add step for Ezra' }).click();
  await page.getByRole('textbox', { name: 'Ezra step 1' }).fill('Read a book');
  await page.getByRole('button', { name: 'Save Morning Routine' }).click();
  await expect(page.getByRole('button', { name: 'School days', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('alert')).toContainText('School days:');
  await page.getByRole('textbox', { name: 'Ezra step 1' }).fill('Pack bag');
  await page.getByRole('button', { name: 'Weekends', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Read a book');
  await page.getByRole('button', { name: 'Save Morning Routine' }).click();
  await expect(page.getByText('Morning Routine saved.', { exact: true })).toBeVisible();
});
