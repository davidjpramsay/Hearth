import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEFAULT_MODULE_FLAGS, MODULE_IDS } from '../../packages/shared/src/modules';

const api = 'http://127.0.0.1:4310/api/v1';
const home = `${api}/households/household_hearth_demo`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
const verse = {
  reference: 'Demo preview',
  text: 'Let kindness shape the way you speak and serve one another today.',
  translation: 'Demo',
  sourceUrl: null,
  freshness: 'current',
  statusMessage: null,
};
const titles = [
  'Get dressed',
  'Shoes and socks',
  'Have breakfast',
  'Pack school bag',
  'Pack your lunch bag and water bottle',
  'Brush teeth',
  'Ready for school',
];
const overview = {
  householdId: 'household_hearth_demo',
  generatedAt: '2026-08-03T07:42:00+08:00',
  timezone: 'Australia/Perth',
  localDate: '2026-08-03',
  isWeekday: true,
  settingsRevision: 1,
  startTime: '07:00',
  endTime: '08:00',
  people: ['Ari', 'Bo', 'Kai'].map((name, i) => ({
    person: {
      id: `member_${name.toLowerCase()}`,
      displayName: name,
      color: ['#1668b7', '#3f7251', '#c97900'][i],
      role: 'child',
      avatarUrl: i === 1 ? '/demo/maya.png' : '/demo/ezra.png',
    },
    steps: titles.map((title, j) => ({
      id: `step_${i}_${j}`,
      title,
      isCompleted: j === 0,
      version: j === 0 ? 1 : 0,
    })),
  })),
};
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
});
for (const viewport of [
  { width: 3840, height: 2160 },
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1280, height: 640 },
  { width: 820, height: 1180 },
  { width: 1180, height: 820 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`Morning Routine fits ${viewport.width}x${viewport.height} ${theme} @visual @a11y`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.route('**/api/v1/households/*/modules', (route) =>
        route.fulfill({
          json: {
            householdId: overview.householdId,
            enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true },
          },
        }),
      );
      await page.route('**/api/v1/households/*/morning-routine', (route) =>
        route.fulfill({ json: overview }),
      );
      await page.route('**/api/v1/households/*/daily-verse', (route) =>
        route.fulfill({ json: verse }),
      );
      await page.goto('/morning-routine');
      await expect(page).toHaveURL(/\/morning-routine$/);
      await expect(page).toHaveTitle(/Hearth/);
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: 'Morning Routine', exact: true }),
      ).toBeVisible();
      await expect(page.getByText(/\d+ of \d+ steps done together/)).toHaveCount(0);
      await expect(page.locator('.morning-person__header p')).toHaveText([
        '1 of 7 done',
        '1 of 7 done',
        '1 of 7 done',
      ]);
      await expect(page.getByText('18:00', { exact: true })).toBeVisible();
      const verseCard = page.getByRole('button', { name: 'Read Demo preview', exact: true });
      await expect(verseCard).toBeVisible();
      await expect(
        page.getByRole('progressbar', { name: 'Morning time remaining' }),
      ).toHaveAttribute('aria-valuenow', '30');
      expect(
        await page
          .locator('.morning-timer__fill')
          .evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration)),
      ).toBeLessThanOrEqual(0.00001);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      if (viewport.width >= 1200) {
        expect(
          await page.locator('.morning-screen').evaluate((element) => {
            const screen = element.getBoundingClientRect();
            return screen.top >= 0 && Math.abs(screen.bottom - innerHeight) <= 1;
          }),
        ).toBe(true);
        await expect(page.locator('.morning-step')).toHaveCount(21);
        await expect(page.getByRole('button', { name: /^More steps for / })).toHaveCount(0);
        for (const step of await page.locator('.morning-step').all()) {
          await expect(step).toBeInViewport({ ratio: 1 });
          expect(
            await step.evaluate((element) => {
              const row = element.getBoundingClientRect();
              const card = element.closest('.morning-person')!.getBoundingClientRect();
              const text = element
                .querySelector(':scope > span:nth-child(2)')!
                .getBoundingClientRect();
              const style = getComputedStyle(element);
              return (
                row.bottom <= card.bottom &&
                row.right <= card.right &&
                text.top >= row.top &&
                text.bottom <= row.bottom &&
                row.height >= 56 &&
                parseFloat(style.fontSize) >= 20
              );
            }),
          ).toBe(true);
        }
        expect(
          await page
            .locator('.app-content')
            .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
        ).toBe(true);
        await expect(verseCard).toBeInViewport({ ratio: 1 });
        expect(
          await page
            .locator('.morning-screen')
            .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
        ).toBe(true);
        const first = page.getByRole('button', { name: 'Ari: Shoes and socks', exact: true });
        const last = page.getByRole('button', { name: `Ari: ${titles.at(-1)}`, exact: true });
        await first.focus();
        for (let i = 0; i < titles.length - 2; i++) await page.keyboard.press('ArrowDown');
        await expect(last).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(verseCard).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog', { name: 'Demo preview' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(verseCard).toBeFocused();
        await first.focus();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('.tv-rail :focus')).toHaveCount(1);
      }
      expect(
        (await new AxeBuilder({ page }).analyze()).violations.filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        ),
      ).toEqual([]);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: info.outputPath('morning-routine.png'),
        fullPage: viewport.width < 1200,
      });
    });
  }
test('lists longer than seven keep honest paging beside seven-step neighbours on short TVs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.route('**/api/v1/households/*/modules', (route) =>
    route.fulfill({
      json: {
        householdId: overview.householdId,
        enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true },
      },
    }),
  );
  await page.route('**/api/v1/households/*/daily-verse', (route) => route.fulfill({ json: verse }));
  let allLonger = false;
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({
      json: {
        ...overview,
        people: overview.people.map((person, index) =>
          index === 0 || allLonger
            ? {
                ...person,
                steps: [
                  ...person.steps,
                  ...['Check the weather', 'Choose a book'].map((title, extra) => ({
                    id: `step_extra_${index}_${extra}`,
                    title,
                    isCompleted: false,
                    version: 0,
                  })),
                ],
              }
            : person,
        ),
      },
    }),
  );
  for (const longer of [false, true]) {
    allLonger = longer;
    await page.goto('/morning-routine');
    if (longer) await page.reload();
    const next = page.getByRole('button', { name: 'More steps for Ari', exact: true });
    await expect(next).toBeVisible();
    if (!longer) {
      await expect(
        page.getByRole('button', { name: 'Bo: Ready for school', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'More steps for Bo', exact: true }),
      ).toHaveCount(0);
    }
    while (await next.isEnabled()) await next.click();
    await expect(
      page.getByRole('button', { name: 'Ari: Choose a book', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(next).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Read Demo preview', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    expect(
      await page
        .locator('.app-content')
        .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
    ).toBe(true);
  }
});

test('the morning verse follows module availability and closes its full-text view when disabled', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, enabled] of [
    ['morningRoutine', true],
    ['dailyVerse', false],
  ] as const)
    expect(
      (
        await request.put(`${home}/modules/${id}`, {
          headers: adult,
          data: { requestId: `request_morning_verse_${id.toLowerCase()}`, enabled },
        })
      ).ok(),
    ).toBe(true);
  let reads = 0;
  await page.route('**/api/v1/households/*/daily-verse', (route) => {
    reads += 1;
    return route.fulfill({ json: verse });
  });
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({ json: overview }),
  );
  await page.goto('/morning-routine');
  await expect(page.getByRole('heading', { name: 'Morning Routine', exact: true })).toBeVisible();
  await expect(page.locator('.morning-verse')).toHaveCount(0);
  expect(reads).toBe(0);
  expect(
    (
      await request.put(`${home}/modules/dailyVerse`, {
        headers: adult,
        data: { requestId: 'request_morning_verse_enable', enabled: true },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  const card = page.getByRole('button', { name: 'Read Demo preview' });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.getByRole('dialog', { name: 'Demo preview' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(card).toBeFocused();
  await card.click();
  await expect(page.getByRole('dialog', { name: 'Demo preview' })).toBeVisible();
  expect(
    (
      await request.put(`${home}/modules/dailyVerse`, {
        headers: adult,
        data: { requestId: 'request_morning_verse_disable', enabled: false },
      })
    ).ok(),
  ).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.morning-verse')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Ari: Shoes and socks', exact: true }),
  ).toBeVisible();
});

test('a missing or stale morning verse does not block the routine and its full text stays accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.route('**/api/v1/households/*/modules', (route) =>
    route.fulfill({
      json: {
        householdId: overview.householdId,
        enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true },
      },
    }),
  );
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({ json: overview }),
  );
  let available = false;
  let failed = false;
  const longVerse = {
    ...verse,
    text: 'A fictional longer demo reading about kindness and patience. '.repeat(18),
  };
  await page.route('**/api/v1/households/*/daily-verse', (route) =>
    failed
      ? route.fulfill({
          status: 503,
          json: {
            error: {
              code: 'OFFLINE',
              message: 'Verse unavailable',
              retryable: true,
              requestId: null,
            },
          },
        })
      : route.fulfill({ json: available ? longVerse : null }),
  );
  await page.goto('/morning-routine');
  const retry = page.getByRole('button', { name: 'Refresh daily verse' });
  await expect(retry).toContainText('Today’s verse isn’t available yet.');
  await expect(page.locator('.morning-step')).toHaveCount(21);
  await expect(
    page.getByRole('button', { name: 'Ari: Shoes and socks', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false');
  available = true;
  await retry.click();
  const card = page.getByRole('button', { name: 'Read Demo preview' });
  await expect(card).toBeVisible();
  failed = true;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(card).toContainText('Daily verse · saved');
  await card.click();
  const dialog = page.getByRole('dialog', { name: 'Demo preview' });
  await expect(dialog).toContainText(longVerse.text.trim());
  await expect(dialog).toContainText('Showing a saved verse.');
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
  expect(
    await page
      .locator('.app-content')
      .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
  ).toBe(true);
});
test('countdown time fields stay separated on narrow phones and save both values @visual @a11y', async ({
  page,
  request,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
  });
  expect(
    (
      await request.put(`${home}/modules/morningRoutine`, {
        headers: adult,
        data: { requestId: 'request_time_layout_morning', enabled: true },
      })
    ).ok(),
  ).toBe(true);
  await page.goto('/admin/morning-routine');
  await expect(page).toHaveURL(/\/admin\/morning-routine$/);
  await expect(page).toHaveTitle(/Hearth/);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Morning Routine', exact: true })).toBeVisible();
  const start = page.getByLabel('Start time', { exact: true });
  const end = page.getByLabel('Ready by', { exact: true });
  await expect(start).toHaveValue('07:00');
  await expect(end).toHaveValue('08:00');
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(viewport);
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      const bounds = await page.locator('.morning-settings__times').evaluate((grid) => {
        const container = grid.getBoundingClientRect();
        const fields = [...grid.querySelectorAll('input')].map((input) => {
          const rect = input.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            fontSize: parseFloat(getComputedStyle(input).fontSize),
          };
        });
        return { left: container.left, right: container.right, fields };
      });
      const [first, second] = bounds.fields;
      expect(first!.right + 8 <= second!.left || first!.bottom + 8 <= second!.top).toBe(true);
      if (viewport.width <= 480) expect(first!.bottom + 8 <= second!.top).toBe(true);
      for (const field of bounds.fields) {
        expect(field.left).toBeGreaterThanOrEqual(bounds.left - 1);
        expect(field.right).toBeLessThanOrEqual(bounds.right + 1);
        expect(field.height).toBeGreaterThanOrEqual(44);
        expect(field.fontSize).toBeGreaterThanOrEqual(16);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      if ([320, 390, 844].includes(viewport.width))
        await page.screenshot({
          path: info.outputPath(`countdown-${viewport.width}-${theme}.png`),
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await start.fill('07:10');
  await end.fill('08:10');
  await page.getByRole('button', { name: 'Save Morning Routine' }).click();
  await expect(page.getByText('Morning Routine saved.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(start).toHaveValue('07:10');
  await expect(end).toHaveValue('08:10');
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
});
test('adult settings save/reorder and any-order checks survive reopening; exact retry does not toggle twice', async ({
  page,
  request,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    (
      await request.put(`${home}/modules/morningRoutine`, {
        headers: adult,
        data: { requestId: 'request_enable_morning', enabled: true },
      })
    ).ok(),
  ).toBe(true);
  await page.goto('/admin/morning-routine');
  await expect(page.getByRole('checkbox', { name: 'Ezra', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Maya', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Add step for Ezra' }).click();
  await page.getByRole('textbox', { name: 'Ezra step 1' }).fill('Get dressed');
  await page.getByRole('button', { name: 'Add step for Ezra' }).click();
  await page.getByRole('textbox', { name: 'Ezra step 2' }).fill('Pack school bag');
  await page.getByRole('button', { name: 'Move Ezra step 2 up' }).click();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Pack school bag');
  await page.getByRole('button', { name: 'Save Morning Routine' }).click();
  await expect(page.getByText('Morning Routine saved.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Pack school bag');
  await page.screenshot({ path: info.outputPath('morning-settings-phone.png'), fullPage: true });
  await page.goto('/morning-routine');
  let lost = false;
  const requests: unknown[] = [];
  await page.route('**/morning-routine/completion', async (route) => {
    requests.push(route.request().postDataJSON());
    if (!lost) {
      lost = true;
      await route.fetch();
      await route.abort('failed');
    } else await route.continue();
  });
  const step = page.getByRole('button', { name: 'Ezra: Get dressed', exact: true });
  await step.click(); // A later step can be checked first.
  await expect(page.getByRole('button', { name: 'Retry check' })).toBeVisible();
  await expect(step).toHaveAttribute('aria-pressed', 'false'); // No false success for a lost response.
  await page.getByRole('button', { name: 'Retry check' }).click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  await page.reload();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await step.click();
  await expect(step).toHaveAttribute('aria-pressed', 'false');
  for (const id of MODULE_IDS.filter((id) => id !== 'morningRoutine'))
    expect(
      (
        await request.put(`${home}/modules/${id}`, {
          headers: adult,
          data: { requestId: `request_solo_${id.toLowerCase()}`, enabled: false },
        })
      ).ok(),
    ).toBe(true);
  await page.goto('/admin/planning');
  await expect(page.getByRole('link', { name: 'Morning Routine', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Routines and chores', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Morning Routine', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ezra step 1' })).toHaveValue('Pack school bag');
});
test('unassigned days and failed-refresh states prevent stale writes', async ({ page }) => {
  await page.route('**/api/v1/households/*/modules', (route) =>
    route.fulfill({
      json: {
        householdId: overview.householdId,
        enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true },
      },
    }),
  );
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({
      json: {
        ...overview,
        generatedAt: '2026-08-08T07:42:00+08:00',
        localDate: '2026-08-08',
        isWeekday: false,
      },
    }),
  );
  await page.goto('/morning-routine');
  await expect(page.getByRole('heading', { name: 'No routine scheduled today' })).toBeVisible();
  await expect(page.locator('.morning-verse')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Ari: Shoes and socks', exact: true })).toHaveCount(
    0,
  );
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: 'OFFLINE',
          message: 'Routine unavailable',
          retryable: true,
          requestId: null,
        },
      },
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(
    page.getByText('Showing saved progress. Refresh before ticking steps.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No routine scheduled today' })).toBeVisible();
});

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1280, height: 640 },
]) {
  test(`long steps and extra people remain paged and bounded at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/v1/households/*/modules', (route) =>
      route.fulfill({
        json: {
          householdId: overview.householdId,
          enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true },
        },
      }),
    );
    const people = [
      ...overview.people,
      {
        ...overview.people[0]!,
        person: { ...overview.people[0]!.person, id: 'member_extra', displayName: 'Dee' },
      },
    ].map((person, i) => ({
      ...person,
      steps: Array.from({ length: 12 }, (_, j) => ({
        id: `step_long_${i}_${j}`,
        title: 'Get ready for school and put your packed school bag and water bottle by the door',
        isCompleted: false,
        version: 0,
      })),
    }));
    await page.route('**/api/v1/households/*/morning-routine', (route) =>
      route.fulfill({ json: { ...overview, people } }),
    );
    await page.goto('/morning-routine');
    await expect(page.getByRole('heading', { name: 'Ari', exact: true })).toBeVisible();
    expect(
      await page
        .locator('.app-content')
        .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
    ).toBe(true);
    await page.getByRole('button', { name: 'More steps for Ari', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Previous steps for Ari', exact: true }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'More people', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dee', exact: true })).toBeVisible();
    expect(
      await page
        .locator('.app-content')
        .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
    ).toBe(true);
  });
}

for (const period of ['morning', 'afternoon'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${period} nine tasks use the complete screen above the bottom verse ${theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 1258, height: 856 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.route('**/api/v1/households/*/modules', (route) =>
        route.fulfill({
          json: {
            householdId: overview.householdId,
            enabled: {
              ...DEFAULT_MODULE_FLAGS,
              morningRoutine: true,
              afternoonRoutine: true,
              dailyVerse: true,
            },
          },
        }),
      );
      const people = overview.people.map((person, i) => ({
        ...person,
        steps:
          i === 2
            ? person.steps.slice(0, 4)
            : [
                ...person.steps,
                ...['Check the weather', 'Choose a book'].map((title, j) => ({
                  id: `extra_${i}_${j}`,
                  title,
                  isCompleted: false,
                  version: 0,
                })),
              ],
      }));
      await page.route(`**/api/v1/households/*/${period}-routine`, (route) =>
        route.fulfill({ json: { ...overview, people } }),
      );
      await page.route('**/api/v1/households/*/daily-verse', (route) =>
        route.fulfill({ json: verse }),
      );
      await page.goto(`/${period}-routine`);
      await expect(page.getByRole('link', { name: 'Today', exact: true })).toHaveCount(1);
      await expect(page.locator('.morning-footer').getByRole('link')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^More steps for / })).toHaveCount(0);
      await expect(page.locator('.morning-step')).toHaveCount(22);
      for (const row of await page.locator('.morning-step').all())
        await expect(row).toBeInViewport({ ratio: 1 });
      const verseCard = page.getByRole('button', { name: 'Read Demo preview', exact: true });
      expect(
        await verseCard.evaluate((el) => {
          const screen = el.closest('.morning-screen')!;
          return Math.abs(
            el.getBoundingClientRect().bottom -
              (screen.getBoundingClientRect().bottom -
                parseFloat(getComputedStyle(screen).paddingBottom)),
          );
        }),
      ).toBeLessThanOrEqual(1);
      expect(
        await page.locator('.app-content').evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBe(true);
      const last = page.getByRole('button', { name: 'Ari: Choose a book', exact: true });
      await last.focus();
      await page.keyboard.press('ArrowDown');
      await expect(verseCard).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(verseCard).toBeFocused();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath('full-height-nine-tasks.png') });
    });
  }
  for (const initial of [
    { width: 1920, height: 1080 },
    { width: 3840, height: 2160 },
  ])
    test(`${period} pages only when needed, fills its task area and preserves focus through resizing ${initial.width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize(initial);
      await page.route('**/api/v1/households/*/modules', (route) =>
        route.fulfill({
          json: {
            householdId: overview.householdId,
            enabled: {
              ...DEFAULT_MODULE_FLAGS,
              morningRoutine: true,
              afternoonRoutine: true,
              dailyVerse: true,
            },
          },
        }),
      );
      const people = overview.people.map((person, i) => ({
        ...person,
        steps: Array.from({ length: 12 }, (_, j) => ({
          id: `task_${i}_${j}`,
          title: `Get ready for activity ${j + 1}`,
          isCompleted: false,
          version: 0,
        })),
      }));
      await page.route(`**/api/v1/households/*/${period}-routine`, (route) =>
        route.fulfill({ json: { ...overview, people } }),
      );
      await page.route('**/api/v1/households/*/daily-verse', (route) =>
        route.fulfill({ json: verse }),
      );
      await page.goto(`/${period}-routine`);
      const person = page.getByRole('region', { name: `Ari’s ${period}`, exact: true });
      const more = page.getByRole('button', { name: 'More steps for Ari', exact: true });
      await expect(more).toBeVisible();
      const rows = person.locator('.morning-step');
      expect(await rows.count()).toBeGreaterThan(5);
      const last = rows.last();
      expect(
        await last.evaluate((el) => {
          const card = el.closest('.morning-person')!;
          const pager = card.querySelector(':scope > .morning-pager')!;
          return Math.abs(
            pager.getBoundingClientRect().top -
              el.getBoundingClientRect().bottom -
              (parseFloat(getComputedStyle(card).rowGap) * card.getBoundingClientRect().width) /
                card.clientWidth,
          );
        }),
      ).toBeLessThanOrEqual(1);
      await last.focus();
      const label = await last.getAttribute('aria-label');
      await page.setViewportSize({ width: 1258, height: 856 });
      await expect(page.getByRole('button', { name: label!, exact: true })).toBeFocused();
      await expect(page.getByRole('button', { name: label!, exact: true })).toBeInViewport({
        ratio: 1,
      });
      await more.click();
      await expect(
        page.getByRole('button', { name: 'Previous steps for Ari', exact: true }),
      ).toBeEnabled();
      expect(
        await person
          .locator('.morning-step')
          .first()
          .evaluate((el) => el === document.activeElement),
      ).toBe(true);
      expect(
        await page.locator('.app-content').evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBe(true);
      await page.screenshot({ path: info.outputPath('measured-task-pages.png') });
    });
}

test('removing the verse gives the space back to tasks without losing any checks', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1920, height: 1350 });
  let showVerse = true;
  await page.route('**/api/v1/households/*/modules', (route) =>
    route.fulfill({
      json: {
        householdId: overview.householdId,
        enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true, dailyVerse: showVerse },
      },
    }),
  );
  const people = overview.people.map((person, i) => ({
    ...person,
    steps: Array.from({ length: 12 }, (_, j) => ({
      id: `task_${i}_${j}`,
      title: `Activity ${j + 1}`,
      isCompleted: j === 0,
      version: j === 0 ? 1 : 0,
    })),
  }));
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({ json: { ...overview, people } }),
  );
  await page.route('**/api/v1/households/*/daily-verse', (route) => route.fulfill({ json: verse }));
  await page.goto('/morning-routine');
  await expect(page.getByRole('button', { name: 'More steps for Ari', exact: true })).toBeVisible();
  showVerse = false;
  expect(
    (
      await request.put(`${home}/modules/dailyVerse`, {
        headers: adult,
        data: { requestId: 'request_verse_space_off', enabled: false },
      })
    ).ok(),
  ).toBe(true);
  await expect(page.locator('.morning-verse')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^More steps for / })).toHaveCount(0);
  await expect(page.locator('.morning-step')).toHaveCount(36);
  await expect(page.getByRole('button', { name: 'Ari: Activity 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const row of await page.locator('.morning-step').all())
    await expect(row).toBeInViewport({ ratio: 1 });
  showVerse = true;
  expect(
    (
      await request.put(`${home}/modules/dailyVerse`, {
        headers: adult,
        data: { requestId: 'request_verse_space_on', enabled: true },
      })
    ).ok(),
  ).toBe(true);
  await expect(page.locator('.morning-verse')).toBeVisible();
  await expect(page.getByRole('button', { name: 'More steps for Ari', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ari: Activity 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('an empty routine without a verse has a clear focus target and an exit to the rail', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route('**/api/v1/households/*/modules', (route) =>
    route.fulfill({
      json: {
        householdId: overview.householdId,
        enabled: { ...DEFAULT_MODULE_FLAGS, morningRoutine: true, dailyVerse: false },
      },
    }),
  );
  await page.route('**/api/v1/households/*/morning-routine', (route) =>
    route.fulfill({ json: { ...overview, people: [] } }),
  );
  await page.goto('/morning-routine');
  await expect(page.locator('[data-focus-id="morning-empty"]')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.tv-rail :focus')).toHaveCount(1);
  await expect(page.locator('[data-focus-id="morning-today"]')).toHaveCount(0);
});
