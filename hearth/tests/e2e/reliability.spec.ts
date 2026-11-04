import { expect, test, type Page } from '@playwright/test';

const base = 'http://127.0.0.1:4310/api/v1';
const household = `${base}/households/household_hearth_demo`;
const headers = { 'X-Hearth-Demo-Actor': 'member_maya', 'X-Hearth-Source': 'companion' };

test.beforeEach(async ({ page, request }) => {
  await request.post(`${base}/demo/reset`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    // A stream gap is not a browser offline event. Deliver lifecycle signals independently.
    class TestEvents extends EventTarget {
      readonly reconnect = () => this.dispatchEvent(new Event('open'));
      readonly receive = (event: Event) => {
        const kind = (event as CustomEvent<string>).detail;
        this.dispatchEvent(
          new MessageEvent(kind, {
            data: JSON.stringify({
              id: 'realtime_test',
              kind,
              householdId: 'household_hearth_demo',
              targetId: 'test_target',
              occurredAt: '2026-08-03T10:00:00.000Z',
            }),
          }),
        );
      };
      constructor() {
        super();
        window.addEventListener('test-stream-open', this.reconnect);
        window.addEventListener('test-stream-event', this.receive);
      }
      close() {
        window.removeEventListener('test-stream-open', this.reconnect);
        window.removeEventListener('test-stream-event', this.receive);
      }
    }
    window.EventSource = TestEvents as unknown as typeof EventSource;
  });
});

async function reconnect(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('test-stream-open')));
}
async function changed(page: Page, kind: string) {
  await page.evaluate(
    (value) => window.dispatchEvent(new CustomEvent('test-stream-event', { detail: value })),
    kind,
  );
}
async function loseFirstReply(page: Page, pattern: string) {
  const ids: string[] = [];
  await page.route(pattern, async (route) => {
    if (route.request().method() === 'GET') return route.continue();
    const input = route.request().postDataJSON() as { requestId: string };
    ids.push(input.requestId);
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    if (ids.length === 1) await route.abort('failed');
    else await route.fulfill({ response });
  });
  return ids;
}

test('lost reminder reply retries one intent without making duplicate reminders', async ({
  page,
  request,
}) => {
  const ids = await loseFirstReply(page, '**/households/*/reminders');
  await page.goto('/reminders');
  await page.getByRole('textbox', { name: 'Reminder', exact: true }).fill('One reminder only');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Couldn’t reach Hearth' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'One reminder only' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Reminder', exact: true })).toHaveValue('');
  const overview = await (await request.get(`${household}/reminders?includeCompleted=true`)).json();
  expect(
    overview.reminders.filter((row: { title: string }) => row.title === 'One reminder only'),
  ).toHaveLength(1);
  expect(ids).toHaveLength(2);
  expect(ids[1]).toBe(ids[0]);
});

test('lost payment reply retries the same ledger record and preserves the note', async ({
  page,
  request,
}) => {
  const chores = await (await request.get(`${household}/chore-occurrences?date=2026-08-03`)).json();
  const pepper = chores.groups
    .flatMap((group: { occurrences: Array<{ id: string; title: string }> }) => group.occurrences)
    .find((row: { title: string }) => row.title === 'Feed Pepper');
  const result = await request.post(`${household}/chore-occurrences/${pepper.id}/completions`, {
    headers,
    data: { requestId: 'request_payment_setup' },
  });
  expect(result.ok()).toBe(true);
  const ids = await loseFirstReply(page, '**/pocket-money-payments');
  await page.goto('/admin/pocket-money');
  const form = page.locator('.pocket-payment-form').first();
  await form.getByLabel('Payment amount').fill('0.10');
  await form.getByLabel(/Note optional/).fill('One cash payment');
  await form.getByRole('button', { name: 'Record payment' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(form.getByLabel(/Note optional/)).toHaveValue('One cash payment');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('status')).toContainText('$0.10 recorded');
  const overview = await (
    await request.get(`${household}/pocket-money?weekStart=2026-08-03&asOf=2026-08-03`, { headers })
  ).json();
  const payments = overview.recentPayments.filter(
    (row: { note: string }) => row.note === 'One cash payment',
  );
  expect(payments).toHaveLength(1);
  expect(payments[0].amountCents).toBe(10);
  expect(ids[1]).toBe(ids[0]);
});

test('list draft survives failure and an accepted retry clears only the submitted draft', async ({
  page,
}) => {
  const ids = await loseFirstReply(page, '**/lists/*/items');
  await page.goto('/lists');
  await page.getByPlaceholder('Add an item').fill('Saved grocery draft');
  await page.getByLabel('Quantity (optional)').fill('2 packets');
  await page.locator('.phone-list-add').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByPlaceholder('Add an item')).toHaveValue('Saved grocery draft');
  await expect(page.getByLabel('Quantity (optional)')).toHaveValue('2 packets');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('button', { name: 'Check Saved grocery draft' })).toBeVisible();
  await expect(page.getByPlaceholder('Add an item')).toHaveValue('');
  expect(ids[1]).toBe(ids[0]);
});

test('a later list draft is not cleared when an earlier add succeeds', async ({ page }) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/lists/*/items', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/lists');
  await page.getByPlaceholder('Add an item').fill('First grocery');
  await page.locator('.phone-list-add').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('button', { name: 'Adding…' })).toBeVisible();
  await page.getByPlaceholder('Add an item').fill('Next grocery');
  await page.getByLabel('Quantity (optional)').fill('3');
  release?.();
  await expect(page.getByRole('button', { name: 'Check First grocery' })).toBeVisible();
  await expect(page.getByPlaceholder('Add an item')).toHaveValue('Next grocery');
  await expect(page.getByLabel('Quantity (optional)')).toHaveValue('3');
});

test('household retry preserves edits made after the unanswered save', async ({ page }) => {
  const ids = await loseFirstReply(page, '**/households/*/settings');
  await page.goto('/admin/household');
  const name = page.getByRole('textbox', { name: 'Household name' });
  await name.fill('First household name');
  await page.getByRole('button', { name: 'Save household' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await name.fill('Newer household name');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Household saved');
  await expect(name).toHaveValue('Newer household name');
  await page.getByRole('button', { name: 'Save household' }).click();
  await expect(page.getByRole('button', { name: 'Save household' })).toBeEnabled();
  await page.reload();
  await expect(name).toHaveValue('Newer household name');
  expect(ids).toHaveLength(3);
  expect(ids[1]).toBe(ids[0]);
  expect(ids[2]).not.toBe(ids[0]);
});

test('pocket-money retry preserves a newer amount until its own save succeeds', async ({
  page,
}) => {
  const ids = await loseFirstReply(page, '**/members/*/pocket-money-settings');
  await page.goto('/admin/pocket-money');
  const form = page.locator('.pocket-money-settings-form').first();
  const amount = form.getByRole('spinbutton');
  await amount.fill('9.50');
  await form.getByRole('button').click();
  await expect(page.getByRole('alert').filter({ hasText: 'Couldn’t reach Hearth' })).toBeVisible();
  await amount.fill('10.50');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('status')).toContainText('settings are saved');
  await expect(amount).toHaveValue('10.50');
  await form.getByRole('button').click();
  await expect(form.getByRole('button')).toBeEnabled();
  await page.reload();
  await expect(amount).toHaveValue('10.50');
  expect(ids).toHaveLength(3);
  expect(ids[1]).toBe(ids[0]);
  expect(ids[2]).not.toBe(ids[0]);
});

test('meal-week retry preserves and rebases newer dinner edits', async ({ page }) => {
  const ids = await loseFirstReply(page, '**/meal-plan-weeks');
  await page.goto('/admin/meals');
  const dinner = page.getByRole('textbox', { name: 'Mon dinner', exact: true });
  await dinner.fill('First Monday dinner');
  await page.getByRole('button', { name: 'Save week' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await dinner.fill('Newer Monday dinner');
  await page.getByRole('button', { name: 'Save week' }).click();
  await expect(page.getByRole('alert')).toContainText('Try the previous change again');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('status')).toContainText('dinner plan was saved');
  await expect(dinner).toHaveValue('Newer Monday dinner');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save week' })).toBeEnabled();
  await page.getByRole('button', { name: 'Save week' }).click();
  await expect(page.getByRole('button', { name: 'Save week' })).toBeEnabled();
  await page.reload();
  await expect(dinner).toHaveValue('Newer Monday dinner');
  expect(ids).toHaveLength(3);
  expect(ids[1]).toBe(ids[0]);
  expect(ids[2]).not.toBe(ids[0]);
});

test('meal drafts merge untouched dates and require a choice for conflicting dinners', async ({
  page,
  request,
}) => {
  await page.goto('/admin/meals');
  await page.getByRole('textbox', { name: 'Mon dinner', exact: true }).fill('My Monday draft');
  async function update(date: string, mealName: string) {
    const result = await request.put(`${household}/meal-plan-entries`, {
      headers,
      data: {
        requestId: `request_remote_${date.replaceAll('-', '_')}`,
        localDate: date,
        slot: 'dinner',
        mealName,
        savedMealId: null,
        note: null,
      },
    });
    expect(result.ok()).toBe(true);
    await changed(page, 'meal.changed');
  }
  await update('2026-08-04', 'Remote Tuesday');
  await expect(page.getByRole('textbox', { name: 'Tue dinner', exact: true })).toHaveValue(
    'Remote Tuesday',
  );
  await expect(page.getByRole('textbox', { name: 'Mon dinner', exact: true })).toHaveValue(
    'My Monday draft',
  );
  await update('2026-08-03', 'Remote Monday');
  await expect(page.getByRole('alert')).toContainText('Your edits are kept');
  await page.screenshot({ path: test.info().outputPath('meal-conflict-phone.png') });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: test.info().outputPath('meal-conflict-tv.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Save week' })).toBeDisabled();
  await page.getByRole('button', { name: 'Keep my edits' }).click();
  await page.getByRole('button', { name: 'Save week' }).click();
  await expect(page.getByRole('status')).toContainText('dinner plan was saved');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Mon dinner', exact: true })).toHaveValue(
    'My Monday draft',
  );
  await expect(page.getByRole('textbox', { name: 'Tue dinner', exact: true })).toHaveValue(
    'Remote Tuesday',
  );
});

test('live-stream reconnect catches up missed list changes while the browser stays online', async ({
  page,
  request,
}) => {
  await page.goto('/lists');
  await expect(page.locator('#active-list-heading')).toBeVisible();
  const overview = await (await request.get(`${household}/lists`)).json();
  const result = await request.post(`${household}/lists/${overview.lists[0].id}/items`, {
    headers,
    data: { requestId: 'request_stream_gap', text: 'Missed during gap', quantity: null },
  });
  expect(result.ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'Check Missed during gap' })).toHaveCount(0);
  expect(await page.evaluate(() => navigator.onLine)).toBe(true);
  await reconnect(page);
  await expect(page.getByRole('button', { name: 'Check Missed during gap' })).toBeVisible();
});

for (const kind of ['list', 'chore'] as const) {
  test(`pending ${kind} commands preserve remote focus and ignore repeated activation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    await page.route(
      kind === 'list' ? '**/list-items/*/completions' : '**/chore-occurrences/*/completions',
      async (route) => {
        calls += 1;
        await held;
        await route.continue();
      },
    );
    await page.goto(kind === 'list' ? '/lists' : '/chores');
    const item =
      kind === 'list'
        ? page.locator('[data-focus-id="list-item-list_item_milk"]')
        : page.locator('.chore-row').filter({ hasText: 'Pack school bag' });
    await item.focus();
    await page.keyboard.press('Enter');
    await expect(item).toContainText('Saving…');
    await expect(item).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    expect(calls).toBe(1);
    await page.keyboard.press('ArrowUp');
    await expect(item).not.toBeFocused();
    const nextFocus = await page.evaluate(
      () => (document.activeElement as HTMLElement).dataset.focusId,
    );
    expect(nextFocus).toBeTruthy();
    release?.();
    await expect(item).toContainText(kind === 'list' ? 'Checked' : 'Done');
    await expect(page.locator(`[data-focus-id="${nextFocus}"]`)).toBeFocused();
  });
}

test('failed chore rollback preserves another successful completion and tracks both pending jobs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route('**/chore-occurrences/*/completions', async (route) => {
    calls += 1;
    if (calls === 1) {
      await held;
      await route.abort('failed');
    } else await route.continue();
  });
  await page.goto('/chores');
  const first = page.locator('.chore-row').filter({ hasText: 'Pack school bag' });
  const second = page.locator('.chore-row').filter({ hasText: 'Feed Pepper' });
  await first.click();
  await expect(first).toContainText('Saving…');
  await second.click();
  await expect(first).toContainText('Saving…');
  await expect(page.getByRole('button', { name: 'Feed Pepper, done. Undo' })).toBeVisible();
  release?.();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Feed Pepper, done. Undo' })).toBeVisible();
  await expect(first).toContainText('Mark done');
});

test('list rollback and successful projections preserve other optimistic list commands', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route('**/list-items/*/completions', async (route) => {
    calls += 1;
    if (calls === 1) {
      await held;
      await route.abort('failed');
    } else await route.continue();
  });
  await page.goto('/lists');
  const rows = page.locator('.list-item-row[aria-label^="Check "]');
  const firstId = await rows.nth(0).getAttribute('data-focus-id');
  const secondId = await rows.nth(1).getAttribute('data-focus-id');
  const first = page.locator(`[data-focus-id="${firstId}"]`);
  const second = page.locator(`[data-focus-id="${secondId}"]`);
  await first.click();
  await expect(first).toBeDisabled();
  await second.click();
  await expect(second).toContainText('Checked');
  await expect(first).toContainText('Saving…');
  release?.();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(second).toContainText('Checked');
  await expect(first).toContainText('Check item');
});

test('hanging startup times out, offers recovery and never bypasses the runtime gate', async ({
  page,
}) => {
  let reads = 0;
  let householdReads = 0;
  page.on('request', (request) => {
    if (request.url().includes('/households/')) householdReads += 1;
  });
  await page.route('**/api/v1/runtime', (route) => {
    reads += 1;
    if (reads > 3) return route.continue();
  });
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Hearth could not start' })).toBeVisible({
    timeout: 26_000,
  });
  expect(reads).toBe(3);
  expect(householdReads).toBe(0);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
});

test('Meals follows Monday automatically, preserves intentional browsing and offers This week', async ({
  page,
  request,
}) => {
  await page.clock.install({ time: new Date('2026-08-09T15:59:55Z') });
  const original = await (await request.get(`${base}/runtime`)).json();
  let date = '2026-08-09';
  await page.route('**/api/v1/runtime', (route) =>
    route.fulfill({
      json: {
        ...original,
        mode: 'private',
        localDate: date,
        generatedAt: new Date(
          date === '2026-08-09' ? '2026-08-09T15:59:55Z' : '2026-08-09T16:00:00Z',
        ).toISOString(),
        weekStart: date === '2026-08-09' ? '2026-08-03' : '2026-08-10',
      },
    }),
  );
  await page.goto('/meals');
  await expect(page.locator('.screen-header')).toContainText('3–9 August');
  date = '2026-08-10';
  await page.clock.fastForward(10_000);
  await expect(page.locator('.screen-header')).toContainText('10–16 August');
  await page.getByRole('button', { name: 'Earlier week' }).click();
  await expect(page.locator('.tonight-band p')).toHaveText('Mon dinner');
  await reconnect(page);
  await page.clock.fastForward(500);
  await expect(page.locator('.screen-header')).toContainText('3–9 August');
  await page.getByRole('button', { name: 'This week' }).click();
  await expect(page.locator('.screen-header')).toContainText('10–16 August');
  await expect(page.locator('.tonight-band p')).toHaveText('Tonight');
});

test('admin loading retains Back without choosing it ahead of the loaded entry control', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/households/*/system-status', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/admin/system');
  const back = page.getByRole('link', { name: 'Back to Hearth settings' });
  await expect(page.getByRole('status').filter({ hasText: 'Loading…' })).toBeVisible();
  await expect(back).toBeVisible();
  await expect(back).not.toBeFocused();
  release?.();
  await expect(page.locator('[data-focus-id="system-manage-connections"]')).toBeFocused();
});

test('explicit loading-screen Back focus survives the arrival of admin content', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/households/*/system-status', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/admin/system');
  await expect(page.getByRole('status').filter({ hasText: 'Loading…' })).toBeVisible();
  const back = page.getByRole('link', { name: 'Back to Hearth settings' });
  await back.focus();
  release?.();
  await expect(page.locator('[data-focus-id="system-manage-connections"]')).toBeVisible();
  await expect(back).toBeFocused();
});

test('Calendar preserves explicit tab movement while a lazy view keeps the outgoing view visible', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let requested = false;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/WeekScreen-*.js', async (route) => {
    requested = true;
    await held;
    await route.continue();
  });
  await page.goto('/calendar/agenda');
  await expect(page.locator('[data-focus-id="calendar-view-agenda"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/calendar\/week$/);
  await expect.poll(() => requested).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-id="calendar-view-month"]')).toBeFocused();
  release?.();
  await expect(page.getByRole('heading', { name: 'This week', exact: true })).toBeVisible();
  await expect(page.locator('[data-focus-id="calendar-view-month"]')).toBeFocused();
});

for (const width of [390, 1920]) {
  test(`a delayed Calendar route preserves a quick remote direction without auto-opening an event at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    const original = await (await page.request.get(`${base}/runtime`)).json();
    await page.route('**/api/v1/runtime', (route) =>
      route.fulfill({
        json: { ...original, localDate: '2026-08-04', generatedAt: '2026-08-04T02:00:00.000Z' },
      }),
    );
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/households/*/week?start=2026-08-03', async (route) => {
      await held;
      await route.continue();
    });
    await page.goto('/calendar/agenda');
    await expect(page.locator('[data-focus-id="calendar-view-agenda"]')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/calendar\/week$/);
    await expect(page.getByLabel('Loading Hearth')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    release?.();
    await expect(page.locator('[data-focus-id="calendar-view-month"]')).toBeFocused();
    await expect(page).toHaveURL(/\/calendar\/week$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}

test('admin failures retain their heading and Back control and recover with a keyboard retry', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'hearth.appearance.v1',
      JSON.stringify({ theme: 'dark', eveningDimming: false }),
    ),
  );
  await page.route('**/households/*/list-settings', (route) => route.abort('failed'));
  await page.goto('/admin/lists');
  await expect(page.getByRole('heading', { name: 'Household lists' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Family planning' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('admin-retry-phone.png') });
  await page.unroute('**/households/*/list-settings');
  const retry = page.getByRole('button', { name: 'Try again' });
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'New list' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New list' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('meal drafts survive cancelled menu, remote Back and browser-history navigation', async ({
  page,
}) => {
  await page.goto('/admin/planning');
  await page.getByRole('link', { name: /Meals/ }).click();
  const dinner = page.getByRole('textbox', { name: 'Mon dinner', exact: true });
  await dinner.fill('Keep this dinner draft');
  let prompts = 0;
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Discard unsaved changes?');
    prompts += 1;
    await dialog.dismiss();
  });
  await page.getByRole('link', { name: 'Back to Family planning' }).click();
  await expect.poll(() => prompts).toBe(1);
  await expect(dinner).toHaveValue('Keep this dinner draft');
  await dinner.blur();
  await page.keyboard.press('Escape');
  await expect.poll(() => prompts).toBe(2);
  await expect(dinner).toHaveValue('Keep this dinner draft');
  await page.goBack();
  await expect.poll(() => prompts).toBe(3);
  await expect(dinner).toHaveValue('Keep this dinner draft');
  page.removeAllListeners('dialog');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('link', { name: 'Back to Family planning' }).click();
  await expect(page.getByRole('heading', { name: 'Family planning', exact: true })).toBeVisible();
});

for (const configured of [true, false]) {
  test(`weather distinguishes ${configured ? 'a saved location outage' : 'missing setup'} without losing recovery`, async ({
    page,
    request,
  }) => {
    const forecast = await (await request.get(`${household}/weather`)).json();
    await page.route('**/households/*/weather', (route) =>
      route.fulfill({
        json: {
          ...forecast,
          configured,
          current: null,
          hourly: [],
          daily: [],
          source: null,
          locationLabel: null,
          freshness: 'offline',
        },
      }),
    );
    await page.goto('/weather');
    await expect(
      page.getByRole('heading', {
        name: configured ? 'Weather is unavailable' : 'Set a weather location',
      }),
    ).toBeVisible();
    if (configured) {
      await expect(page.getByRole('link', { name: /Open settings/ })).toHaveCount(0);
      await page.unroute('**/households/*/weather');
      await page.getByRole('button', { name: 'Try again' }).click();
      await expect(page.getByRole('heading', { name: 'Weather', exact: true })).toBeVisible();
    } else await expect(page.getByRole('link', { name: /Open settings/ })).toBeVisible();
  });
}
