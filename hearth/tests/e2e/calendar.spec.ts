import { resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { captureEvidence } from './visualEvidence';

const evidence = resolve('docs/evidence/calendar-navigation');

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`Calendar defaults to Agenda with ordered tabs at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/calendar');
    await expect(page).toHaveURL(/\/calendar\/agenda$/);
    await expect(page).toHaveTitle(/Hearth/);
    await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible();
    const tabs = page.getByRole('navigation', { name: 'Calendar view' });
    await expect(tabs.getByRole('link')).toHaveText(['Agenda', 'Week', 'Month']);
    await expect(tabs.getByRole('link', { name: 'Agenda', exact: true })).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.screenshot({ path: `/tmp/hearth-agenda-first-${viewport.width}.png` });
    for (const view of ['Week', 'Month']) {
      await page.keyboard.press('ArrowRight');
      await expect(tabs.getByRole('link', { name: view, exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/calendar/${view.toLowerCase()}$`));
    }
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/calendar\/week$/);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/calendar\/agenda$/);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}

test.beforeEach(async ({ page, request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test('Calendar is one television destination with Week, Month and Agenda views', async ({
  page,
}) => {
  await page.goto('/calendar/week');
  const rail = page.getByRole('complementary', { name: 'Primary navigation' });
  await expect(rail.getByRole('link', { name: 'Calendar', exact: true })).toBeVisible();
  await expect(rail.getByRole('link', { name: 'Week', exact: true })).toHaveCount(0);
  await expect(rail.getByRole('link', { name: 'Month', exact: true })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Calendar view' })).toContainText(
    'AgendaWeekMonth',
  );

  await page.locator('[data-focus-id="calendar-view-agenda"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/calendar\/agenda$/);
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  const agendaDays = page.locator('.agenda-day');
  await expect(agendaDays).toHaveCount(4);
  await expect(agendaDays.nth(0)).toContainText('Mon3 AugToday');
  await expect(agendaDays.nth(3)).toContainText('Thu6 Aug');
  await expect(page.getByRole('button', { name: /Earlier|Later/ })).toHaveCount(0);
  await expect(page.locator('[data-focus-id="calendar-view-agenda"]')).toBeFocused();
});

test('Agenda always starts today and ignores old period links', async ({ page }) => {
  await page.goto('/calendar/agenda?start=2026-07-20');
  const agendaDays = page.locator('.agenda-day');
  await expect(agendaDays).toHaveCount(4);
  await expect(agendaDays.nth(0)).toContainText('Mon3 AugToday');
  await expect(agendaDays.nth(3)).toContainText('Thu6 Aug');
  await expect(page.getByText('3–6 August')).toBeVisible();
  await expect(page.getByText('Fri7 Aug')).toHaveCount(0);
});

test('Agenda event details open and Back restores the exact event focus', async ({ page }) => {
  await page.goto('/calendar/agenda');
  const event = page.locator('.agenda-event').first();
  await expect(page.locator('[data-focus-id="calendar-view-agenda"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(event).toBeFocused();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'School drop-off' })).toBeVisible();
  await expect(dialog).toContainText('Ezra');
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(event).toBeFocused();
});

test('week navigation changes the requested date and returns to the real current week', async ({
  page,
}) => {
  await page.goto('/calendar/week');
  await page.getByRole('button', { name: 'Later week' }).click();
  await expect(page).toHaveURL(/start=2026-08-10/);
  await expect(page.getByText('10–16 August')).toBeVisible();
  await page.getByRole('button', { name: 'Go to this week' }).click();
  await expect(page).not.toHaveURL(/start=/);
  await expect(page.getByText('3–9 August')).toBeVisible();
});

test('legacy Week and Month links preserve their query while redirecting to Calendar', async ({
  page,
}) => {
  await page.goto('/week?scenario=unavailable');
  await expect(page).toHaveURL(/\/calendar\/week\?scenario=unavailable$/);
  await expect(page.getByRole('status')).toContainText('Showing saved plans');
  await page.goto('/month?month=2026-09');
  await expect(page).toHaveURL(/\/calendar\/month\?month=2026-09$/);
  await expect(page.getByRole('heading', { name: 'September' })).toBeVisible();
});

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`an empty week keeps date navigation at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route(/\/api\/v1\/households\/[^/]+\/week\?start=/, async (route) => {
      const response = await route.fetch();
      const week = await response.json();
      if (!route.request().url().includes('start=2026-08-03')) week.events = [];
      await route.fulfill({ response, json: week });
    });
    await page.goto('/calendar/week?start=2026-08-10');
    await expect(page.getByRole('status')).toContainText('Nothing planned this week.');
    await expect(page.getByRole('navigation', { name: 'Calendar view' })).toBeVisible();
    const earlier = page.getByRole('button', { name: 'Earlier week' });
    await expect(earlier).toBeVisible();
    await earlier.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Go to this week' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/start=/);
    await expect(page.getByText('3–9 August')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /School drop-off, Ezra$/ }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test('a multi-day event has a unique focus target on each day and a route out to week controls', async ({
  page,
}) => {
  await page.route(/\/api\/v1\/households\/[^/]+\/week\?start=/, async (route) => {
    const response = await route.fetch();
    const week = await response.json();
    const source = week.events[0];
    week.events = [
      {
        ...source,
        id: 'event_family_trip',
        title: 'Family trip',
        allDay: true,
        start: '2026-08-02T00:00:00+08:00',
        end: '2026-08-05T23:59:00+08:00',
        startLocalDate: '2026-08-02',
        endLocalDate: '2026-08-05',
      },
    ];
    await route.fulfill({ response, json: week });
  });
  await page.goto('/calendar/week');
  const events = page.locator('.week-event');
  await expect(events).toHaveCount(3);
  await expect(page.locator('[data-focus-id="calendar-view-week"]')).toBeFocused();
  const ids = await events.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-focus-id')),
  );
  expect(new Set(ids).size).toBe(3);
  await events.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Family trip');
  await page.keyboard.press('Escape');
  await expect(events.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'Earlier week' })).toBeFocused();
});

test('Month renders on television browsers without Array.prototype.toSorted', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Array.prototype, 'toSorted', {
      configurable: true,
      value: undefined,
      writable: true,
    });
  });

  await page.goto('/calendar/month');
  await expect(page.getByRole('heading', { name: 'August', exact: true })).toBeVisible();
  await expect(page.locator('.month-grid')).toBeVisible();
  await expect(page.locator('.month-legend')).toContainText('Calendar key');
});

test('Month fills the television height and matches the Week navigation bar', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/calendar/month');

  const monthGridBox = await page.locator('.month-grid').boundingBox();
  const monthFooterBox = await page.locator('.month-footer-controls').boundingBox();
  if (monthGridBox === null || monthFooterBox === null) {
    throw new Error('Expected the Month calendar and navigation bar to be visible');
  }

  expect(monthGridBox.height).toBeGreaterThan(470);
  expect(monthFooterBox.y + monthFooterBox.height).toBeGreaterThan(860);

  await page.goto('/calendar/week');
  const weekFooterBox = await page.locator('.week-footer-controls').boundingBox();
  if (weekFooterBox === null) throw new Error('Expected the Week navigation bar to be visible');
  expect(monthFooterBox.height).toBe(weekFooterBox.height);
});

for (const theme of ['light', 'dark']) {
  test(`Week, Month and Agenda event surfaces are opaque in ${theme}`, async ({ page }) => {
    await page.addInitScript((theme) => {
      localStorage.setItem(
        'hearth.appearance.v1',
        JSON.stringify({ theme, eveningDimming: false }),
      );
    }, theme);
    await page.goto('/calendar/week');
    const weekEvent = page.getByRole('button', { name: /School drop-off, Ezra$/ }).first();
    await expect(weekEvent).toBeVisible();
    await expect(weekEvent).toHaveCSS('background-color', /^rgb\(\d+, \d+, \d+\)$/);
    await expect(weekEvent).toHaveCSS('opacity', '1');
    await expect(weekEvent).toHaveCSS('border-left-width', '1px');
    expect(
      (await new AxeBuilder({ page }).include('.week-grid').analyze()).violations.filter(
        (violation) => ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);

    await page.goto('/calendar/month');
    const monthEvent = page
      .locator('.month-event-label')
      .filter({ hasText: 'School drop-off' })
      .first();
    await expect(monthEvent).toBeVisible();
    await expect(monthEvent).toHaveCSS('background-color', /^rgb\(\d+, \d+, \d+\)$/);
    await expect(monthEvent).toHaveCSS('opacity', '1');
    await expect(monthEvent.locator('i')).toHaveCount(0);
    await page.goto('/calendar/agenda');
    await expect(page.locator('.agenda-event').first()).toHaveCSS(
      'background-color',
      /^rgb\(\d+, \d+, \d+\)$/,
    );
  });
}

test('multiple all-day Week events stack without overlapping and keep D-pad order', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.route(/\/api\/v1\/households\/[^/]+\/week\?start=/, async (route) => {
    const response = await route.fetch();
    const week = (await response.json()) as {
      events: Array<Record<string, unknown>>;
    };
    const source = week.events[0];
    if (source === undefined) throw new Error('Expected seeded calendar events');

    week.events.push(
      {
        ...source,
        id: 'event_uniform_due',
        title: 'Formal uniform',
        start: '2026-08-06T00:00:00+08:00',
        end: '2026-08-06T23:59:00+08:00',
        startLocalDate: '2026-08-06',
        endLocalDate: '2026-08-06',
        allDay: true,
      },
      {
        ...source,
        id: 'event_homework_due',
        title: 'English HWK Due',
        start: '2026-08-06T00:00:00+08:00',
        end: '2026-08-06T23:59:00+08:00',
        startLocalDate: '2026-08-06',
        endLocalDate: '2026-08-06',
        allDay: true,
      },
    );
    await route.fulfill({ response, json: week });
  });

  await page.goto('/calendar/week');
  const uniform = page.getByRole('button', { name: /All day, Formal uniform/ });
  const homework = page.getByRole('button', { name: /All day, English HWK Due/ });
  const uniformBox = await uniform.boundingBox();
  const homeworkBox = await homework.boundingBox();
  if (uniformBox === null || homeworkBox === null) {
    throw new Error('Expected both all-day cards to be visible');
  }

  expect(uniformBox.y + uniformBox.height).toBeLessThan(homeworkBox.y);
  await uniform.focus();
  await page.keyboard.press('ArrowDown');
  await expect(homework).toBeFocused();
});

test('Week separates all-day plans and gives colliding timed events their own lanes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.route(/\/api\/v1\/households\/[^/]+\/week\?start=/, async (route) => {
    const response = await route.fetch();
    const week = (await response.json()) as {
      events: Array<Record<string, unknown>>;
    };
    const source = week.events[0];
    if (source === undefined) throw new Error('Expected seeded calendar events');

    week.events.push(
      {
        ...source,
        id: 'event_overlap_all_day',
        title: 'English homework due',
        start: '2026-08-06T00:00:00+08:00',
        end: '2026-08-06T23:59:00+08:00',
        startLocalDate: '2026-08-06',
        endLocalDate: '2026-08-06',
        allDay: true,
      },
      {
        ...source,
        id: 'event_overlap_breakfast',
        title: "Dad's breakfast",
        start: '2026-08-06T08:00:00+08:00',
        end: '2026-08-06T09:00:00+08:00',
        startLocalDate: '2026-08-06',
        endLocalDate: '2026-08-06',
        allDay: false,
      },
      {
        ...source,
        id: 'event_overlap_cooking',
        title: 'Cooking class',
        start: '2026-08-06T08:30:00+08:00',
        end: '2026-08-06T09:30:00+08:00',
        startLocalDate: '2026-08-06',
        endLocalDate: '2026-08-06',
        allDay: false,
      },
    );
    await route.fulfill({ response, json: week });
  });

  await page.goto('/calendar/week');
  const allDay = page.getByRole('button', { name: /All day, English homework due/ });
  const breakfast = page.getByRole('button', {
    name: /8:00 am, Dad's breakfast, Ezra, overlaps another event/,
  });
  const cooking = page.getByRole('button', {
    name: /8:30 am, Cooking class, Ezra, overlaps another event/,
  });
  const [allDayBox, breakfastBox, cookingBox] = await Promise.all([
    allDay.boundingBox(),
    breakfast.boundingBox(),
    cooking.boundingBox(),
  ]);
  if (allDayBox === null || breakfastBox === null || cookingBox === null) {
    throw new Error('Expected the all-day card and both timed cards to be visible');
  }

  expect(allDayBox.y + allDayBox.height).toBeLessThan(breakfastBox.y);
  expect(breakfastBox.x + breakfastBox.width).toBeLessThan(cookingBox.x);
  await page.evaluate(() => {
    window.localStorage.setItem(
      'hearth.appearance.v1',
      JSON.stringify({ theme: 'dark', eveningDimming: false }),
    );
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
  await expect(cooking).toBeVisible();
  await allDay.focus();
  await page.keyboard.press('ArrowDown');
  await expect(breakfast).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(cooking).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Cooking class');
  await page.keyboard.press('Escape');
  await expect(cooking).toBeFocused();
});

test('phone Calendar exposes sources and More exposes family tools before settings', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calendar/agenda');
  await expect(page.getByRole('link', { name: 'Calendar', exact: true })).toHaveClass(
    /phone-tab--active/,
  );
  await expect(page.getByRole('link', { name: 'Sources' })).toBeVisible();
  await page.getByRole('link', { name: 'More', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'More' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Lists/ })).toBeVisible();
  await expect(page.locator('[data-focus-id="more-games"]')).toHaveAccessibleName('Games');
  await expect(page.locator('[data-focus-id="more-games"]')).toHaveAttribute('href', '/games');
  const connectionsSettings = page.locator('[data-focus-id="more-admin-connections"]');
  await expect(connectionsSettings).toBeVisible();
  await expect(connectionsSettings).toHaveAccessibleName('Connections');
  await expect(connectionsSettings).toHaveAttribute('href', '/admin/connections');
});

for (const viewport of [
  { name: 'agenda-tv-1080', path: '/calendar/agenda', width: 1920, height: 1080 },
  { name: 'week-tv-1366', path: '/calendar/week', width: 1366, height: 768 },
  { name: 'month-tv-1366', path: '/calendar/month', width: 1366, height: 768 },
  { name: 'agenda-phone-portrait', path: '/calendar/agenda', width: 390, height: 844 },
  { name: 'week-phone-landscape', path: '/calendar/week', width: 844, height: 390 },
  { name: 'more-phone-portrait', path: '/more', width: 390, height: 844 },
] as const) {
  test(`@visual and @a11y ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(viewport.path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
    await captureEvidence(page, {
      path: resolve(evidence, `${viewport.name}.png`),
      animations: 'disabled',
    });
  });
}
