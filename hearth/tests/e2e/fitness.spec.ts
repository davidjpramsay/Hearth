import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test('goals show their own routines and daily cards keep their goal labels', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/fitness');
  await expect(page.locator('.fitness-person')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Maya: Run', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Maya: Swim', exact: true })).toBeVisible();
  const goals = page.getByRole('button', { name: 'Maya’s weekly progress', exact: true });
  await goals.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  const running = dialog.getByRole('list', { name: 'Run a comfortable 5 km weekly routine' });
  const strength = dialog.getByRole('list', { name: 'Build full-body strength weekly routine' });
  await expect(running.getByRole('listitem')).toHaveCount(2);
  await expect(running).toContainText('Easy run');
  await expect(running).not.toContainText('Full-body strength');
  await expect(strength).toContainText('Mon · Sun');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: '/tmp/hearth-fitness-goals-evidence/goals-tv.png' });
  await page.keyboard.press('Escape');
  await expect(goals).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await goals.click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: '/tmp/hearth-fitness-goals-evidence/goals-phone.png' });
});

test('removing an optional goal confirms and keeps its workouts as general fitness', async ({
  page,
  request,
}) => {
  await page.goto('/admin/fitness');
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
  await page.getByText('Goals (optional)', { exact: false }).click();
  const first = page.locator('.fitness-goal-editor').first();
  await first.locator(':scope > summary').click();
  page.once('dialog', (d) => d.dismiss());
  await first.getByRole('button', { name: 'Remove goal 1', exact: true }).click();
  await expect(page.locator('.fitness-goal-editor')).toHaveCount(2);
  page.once('dialog', (d) => d.accept());
  await first.getByRole('button', { name: 'Remove goal 1', exact: true }).click();
  await expect(page.locator('.fitness-goal-editor')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Add long-term goal', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('updated plan starts tomorrow');
  const saved = await (await request.get(`${home}/fitness/settings`, { headers: adult })).json();
  const maya = saved.configuration.plans.find(
    (p: { memberId: string }) => p.memberId === 'member_maya',
  );
  expect(maya.goals.map((g: { id: string }) => g.id)).toEqual(['goal_strength_member_maya']);
  expect(maya.workouts.map((w: { title: string }) => w.title)).toEqual([
    'Easy run',
    'Pool session',
    'Full-body strength',
    'Saturday studio',
  ]);
  expect(maya.workouts.slice(0, 2).every((w: { goalId: string | null }) => w.goalId === null)).toBe(
    true,
  );
  const overview = await (await request.get(`${home}/fitness`)).json();
  expect(
    overview.people.find((p: { person: { id: string } }) => p.person.id === 'member_maya').days[0]
      .sessions,
  ).toHaveLength(4);
});

test('standalone workouts can gain an optional goal without losing identity or current progress', async ({
  page,
  request,
}) => {
  await request.post(`${api}/demo/reset`);
  await request.put(`${home}/modules/fitness`, {
    headers: adult,
    data: { requestId: 'request_legacy_on', enabled: true },
  });
  const legacy = JSON.parse(JSON.stringify(configuration));
  legacy.plans.forEach((p: { workouts: Array<{ goalId?: string }> }) =>
    p.workouts.forEach((w) => {
      delete w.goalId;
    }),
  );
  await request.put(`${home}/fitness/settings`, {
    headers: adult,
    data: { requestId: 'request_legacy_settings', expectedRevision: 0, configuration: legacy },
  });
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Ezra: Run' }).click();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.goto('/admin/fitness');
  await expect(page.getByRole('heading', { name: 'Earlier unassigned routine' })).toHaveCount(0);
  const workout = page.locator('.fitness-workout-editor').first();
  await workout.locator(':scope > summary').click();
  await workout.getByText('Exercises & details', { exact: false }).click();
  await page
    .getByRole('combobox', { name: 'Goal (optional)', exact: true })
    .selectOption('goal_member_ezra');
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('updated plan starts tomorrow');
  const saved = await (await request.get(`${home}/fitness/settings`, { headers: adult })).json();
  const ezra = saved.configuration.plans.find(
    (p: { memberId: string }) => p.memberId === 'member_ezra',
  );
  expect(ezra.workouts[0].id).toBe('workout_member_ezra_0');
  expect(ezra.workouts[0].goalId).toBe('goal_member_ezra');
  expect(ezra.workouts[1].goalId).toBeUndefined();
  await page.goto('/fitness');
  await expect(page.getByRole('button', { name: 'Ezra: Run, done' })).toBeVisible();
  await page.getByRole('button', { name: 'Ezra: Run, done', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Goal:', { exact: false })).toHaveCount(0);
});
const api = 'http://127.0.0.1:4310/api/v1',
  home = `${api}/households/household_hearth_demo`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
const configuration = {
  selectedMemberIds: ['member_maya', 'member_ezra'],
  plans: ['member_maya', 'member_ezra'].map((memberId) => ({
    memberId,
    goals: [
      {
        id: `goal_${memberId}`,
        title: 'Run a comfortable 5 km',
        targetDate: '2026-12-01',
        achieved: false,
        weeklyFocus: 'Build this goal with regular sessions.',
      },
      {
        id: `goal_strength_${memberId}`,
        title: 'Build full-body strength',
        targetDate: null,
        achieved: false,
        weeklyFocus: 'Build strength with steady, comfortable sessions.',
      },
    ],
    weeklyFocus: '',
    workouts: ['running', 'swimming', 'weights', 'class'].map((activity, i) => ({
      id: `workout_${memberId}_${i}`,
      goalId: i >= 2 ? `goal_strength_${memberId}` : `goal_${memberId}`,
      title: ['Easy run', 'Pool session', 'Full-body strength', 'Saturday studio'][i],
      activity,
      days: i === 2 ? ['mon', 'sun'] : ['mon', 'wed'],
      durationMinutes: i === 2 ? null : 30,
      distanceKm: i === 0 ? 3 : null,
      notes: i === 2 ? 'Keep a comfortable pace. Record your planned exercises below.' : '',
      exercises:
        i === 2
          ? ['Squat', 'Dumbbell row', 'Overhead press', 'Romanian deadlift'].map((name, j) => ({
              id: `exercise_${j}`,
              name,
              weightKg: j === 0 ? 20 : 7.5,
              sets: 3,
              reps: 10,
            }))
          : [],
    })),
  })),
};
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
  expect(
    (
      await request.put(`${home}/modules/fitness`, {
        headers: adult,
        data: { requestId: 'request_fitness_on', enabled: true },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.put(`${home}/fitness/settings`, {
        headers: adult,
        data: { requestId: 'request_fitness_setup', expectedRevision: 0, configuration },
      })
    ).ok(),
  ).toBe(true);
});
for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
  { width: 1366, height: 768 },
  { width: 1280, height: 640 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 820, height: 1180 },
  { width: 1180, height: 820 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`Fitness fits ${viewport.width}x${viewport.height} ${theme} @visual @a11y`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (['error', 'warning'].includes(m.type())) errors.push(m.text());
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto('/fitness');
      await expect(page).toHaveTitle(/Hearth/);
      await expect(page).toHaveURL(/\/fitness$/);
      await expect(page.getByRole('heading', { name: 'Fitness', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Maya: Weights' })).toBeVisible();
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      if (viewport.width >= 1200)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= window.innerHeight + 1,
          ),
        ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (viewport.width === 1920 || viewport.width === 390) {
        await mkdir('/tmp/hearth-fitness-goals-evidence', { recursive: true });
        await page.screenshot({
          path: `/tmp/hearth-fitness-goals-evidence/fitness-${viewport.width}-${theme}.png`,
        });
      }
      const opener = page.getByRole('button', { name: 'Maya: Weights' });
      await opener.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Full-body strength' })).toBeVisible();
      await expect(dialog.getByRole('columnheader')).toHaveText(['Exercise', 'kg', 'Sets', 'Reps']);
      await expect(dialog.getByRole('rowheader', { name: 'Squat' })).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (viewport.width === 1920 || viewport.width === 390)
        await page.screenshot({
          path: `/tmp/hearth-fitness-goals-evidence/details-${viewport.width}-${theme}.png`,
        });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      expect(errors).toEqual([]);
    });
  }
test('TV check, undo, Sunday details and rest-day navigation survive reopening', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/today');
  await page.getByRole('link', { name: 'Fitness', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Fitness', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-id="fitness-day-0"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(':focus')).not.toHaveAttribute('data-focus-id', 'fitness-day-0');
  await page.getByRole('button', { name: 'Maya: Weights' }).click();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Maya: Weights, done' })).toBeVisible();
  await page.getByRole('button', { name: 'Maya: Weights, done' }).click();
  await page.getByRole('button', { name: 'Undo completed workout' }).click();
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Sunday,/ }).click();
  await page.getByRole('button', { name: 'Maya: Weights' }).click();
  await expect(page.getByText('Checks are available on the scheduled day.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Tuesday,/ }).click();
  await expect(page.getByText('Room to recharge.', { exact: false })).toHaveCount(2);
  for (let n = 0; n < 10; n++) await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute('data-focus-id', /nav-/);
});
test('phone edits goals, schedule and exercise details with an honest tomorrow boundary', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/fitness');
  await expect(page.getByRole('heading', { name: 'Fitness', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
  await page.getByText('Goals (optional)', { exact: false }).click();
  await page.locator('.fitness-goal-editor').first().locator(':scope > summary').click();
  await page.getByLabel('Goal 1', { exact: true }).fill('Finish a fun run');
  await page.getByText('Full-body strength', { exact: true }).click();
  const editor = page
    .locator('.fitness-workout-editor')
    .filter({ has: page.locator('summary strong').filter({ hasText: 'Full-body strength' }) });
  await editor.getByText('Exercises & details', { exact: false }).click();
  await editor.getByLabel('Weight (kg)', { exact: true }).first().fill('22.5');
  await editor.getByRole('checkbox', { name: 'Tuesday' }).check();
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('updated plan starts tomorrow');
  const saved = (await request.get(`${home}/fitness/settings`, { headers: adult })).json();
  expect((await saved).configuration.plans[0].workouts[2].exercises[0].weightKg).toBe(22.5);
  await page.reload();
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
  await page.getByText('Goals (optional)', { exact: false }).click();
  await page.locator('.fitness-goal-editor').first().locator(':scope > summary').click();
  await expect(page.getByLabel('Goal 1', { exact: true })).toHaveValue('Finish a fun run');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: '/tmp/hearth-fitness-goals-evidence/settings-phone.png',
    fullPage: true,
  });
});
test('module off removes the open route and denies retained workout writes', async ({
  page,
  request,
}) => {
  await page.goto('/fitness');
  await expect(page.getByRole('heading', { name: 'Fitness', exact: true })).toBeVisible();
  expect(
    (
      await request.put(`${home}/modules/fitness`, {
        headers: adult,
        data: { requestId: 'request_turn_off', enabled: false },
      })
    ).ok(),
  ).toBe(true);
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole('link', { name: 'Fitness', exact: true })).toHaveCount(0);
  expect((await request.get(`${home}/fitness`)).status()).toBe(403);
});
test('unknown check result retries the exact command without double counting', async ({ page }) => {
  const commands: unknown[] = [];
  let fail = true;
  await page.route('**/fitness/completion', async (route) => {
    commands.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (fail) {
      fail = false;
      await route.abort();
    } else await route.fulfill({ response });
  });
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Maya: Weights' }).click();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Retry check' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry check' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  expect(commands).toHaveLength(2);
  expect(commands[1]).toEqual(commands[0]);
});
test('empty and failed initial reads are intentional', async ({ page, request }) => {
  await request.post(`${api}/demo/reset`);
  await request.put(`${home}/modules/fitness`, {
    headers: adult,
    data: { requestId: 'request_empty_on', enabled: true },
  });
  await page.goto('/fitness');
  await expect(page.getByRole('heading', { name: 'Your next chapter starts here' })).toBeVisible();
  await page.route('**/api/v1/households/*/fitness', (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: 'UNAVAILABLE', message: 'Temporarily unavailable' } },
    }),
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('long instructions stay within the TV and scroll with arrows; focus stays in the dialog', async ({
  page,
  request,
}) => {
  const read = await request.get(`${home}/fitness`);
  const data = await read.json();
  const workout = data.people[0].days[0].sessions[2].workout;
  workout.title = 'A longer strength workout with carefully recorded exercise instructions';
  workout.notes = 'Read the saved plan at your own pace. '.repeat(20);
  workout.exercises = Array.from({ length: 20 }, (_, i) => ({
    id: `exercise_long_${i}`,
    name: `Exercise ${i + 1} with a longer descriptive name`,
    weightKg: null,
    sets: 3,
    reps: 12,
  }));
  await page.route('**/api/v1/households/*/fitness', (route) => route.fulfill({ json: data }));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/fitness');
  const activity = page.getByRole('button', {
    name: `${data.people[0].person.displayName}: Weights`,
    exact: true,
  });
  await activity.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const region = page.getByRole('region', { name: 'Workout instructions' });
  await expect(region).toBeFocused();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowDown');
  expect(await region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await region.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toBeFocused();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.getByRole('dialog').evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(activity).toBeFocused();
});
test('offline saved view disables checks and retains readable instructions', async ({
  page,
  context,
}) => {
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Maya: Weights' }).click();
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(
    page.getByText('Showing saved progress. Refresh before checking workouts.'),
  ).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Squat' })).toBeVisible();
  await context.setOffline(false);
});
test('adult draft survives refetch and blocks navigation until discarded', async ({ page }) => {
  await page.goto('/admin/fitness');
  await page.getByText('Goals (optional)', { exact: false }).click();
  await page.locator('.fitness-goal-editor').first().locator(':scope > summary').click();
  await page.getByLabel('Goal 1', { exact: true }).fill('My unsaved goal');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByLabel('Goal 1', { exact: true })).toHaveValue('My unsaved goal');
  let prompted = false;
  page.once('dialog', async (dialog) => {
    prompted = true;
    await dialog.dismiss();
  });
  await page.getByRole('link', { name: 'Back to More' }).click();
  await expect.poll(() => prompted).toBe(true);
  await expect(page).toHaveURL(/\/admin\/fitness$/);
  await expect(page.getByLabel('Goal 1', { exact: true })).toHaveValue('My unsaved goal');
});

test('a general-fitness class needs only an activity and days, with no goal', async ({
  page,
  request,
}) => {
  await request.post(`${api}/demo/reset`);
  await request.put(`${home}/modules/fitness`, {
    headers: adult,
    data: { requestId: 'request_first_on', enabled: true },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/fitness');
  await expect(page.getByRole('checkbox', { name: 'Maya', exact: true })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Maya', exact: true }).check();
  await page.getByRole('button', { name: 'Add workout', exact: true }).click();
  await page.getByRole('combobox', { name: 'Activity', exact: true }).selectOption('class');
  await page.getByRole('checkbox', { name: 'Monday', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Wednesday', exact: true }).check();
  await expect(page.getByRole('textbox', { name: 'Workout title', exact: true })).not.toBeVisible();
  await expect(page.getByLabel('Goal 1', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Ready to use today');
  const saved = await (await request.get(`${home}/fitness/settings`, { headers: adult })).json();
  expect(saved.configuration.plans[0].goals).toEqual([]);
  expect(saved.configuration.plans[0].workouts[0]).toMatchObject({
    goalId: null,
    title: 'Fitness class',
    activity: 'class',
    days: ['mon', 'wed'],
    exercises: [],
  });
  await page.reload();
  await expect(page.locator('.fitness-workout-editor > summary')).toContainText('Mon · Wed');
  await mkdir('/tmp/hearth-fitness-simple-evidence', { recursive: true });
  await page.screenshot({
    path: '/tmp/hearth-fitness-simple-evidence/general-fitness-class-phone.png',
  });
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Maya: Fitness class', exact: true }).click();
  await expect(page.getByText('Goal:', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('1 day streak', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Maya’s weekly progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('General fitness');
  await expect(page.getByRole('dialog')).toContainText('1 / 2 sessions done');
});

test('all same-activity routines stay behind one broad activity, including the fourteenth', async ({
  page,
  request,
}) => {
  const data = await (await request.get(`${home}/fitness`)).json();
  const day = data.people[0].days[0];
  day.sessions = Array.from({ length: 14 }, (_, i) => ({
    ...day.sessions[0],
    workout: { ...day.sessions[0].workout, id: `group_workout_${i}`, title: `Session ${i + 1}` },
  }));
  await page.route('**/api/v1/households/*/fitness', (route) => route.fulfill({ json: data }));
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto('/fitness');
  const person = page.getByRole('region', {
    name: `${data.people[0].person.displayName}’s fitness`,
    exact: true,
  });
  await expect(person.locator('.fitness-workout')).toHaveCount(1);
  await expect(person.locator('.fitness-activity-count')).toHaveText('0/14');
  await person.getByRole('button', { name: /: Run$/ }).click();
  await expect(page.getByRole('heading', { name: 'Session 14', exact: true })).toBeAttached();
  const last = page.getByRole('button', { name: 'Complete Session 14', exact: true });
  await last.focus();
  await expect(last).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(person.getByRole('button', { name: /: Run$/ })).toBeFocused();
});

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
  { width: 1366, height: 768 },
  { width: 1280, height: 640 },
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`five people and all activities fit ${viewport.width} ${theme} @visual @a11y`, async ({
      page,
      request,
    }) => {
      const data = await (await request.get(`${home}/fitness`)).json();
      const original = data.people[0];
      data.people = ['Ezra', 'Maya', 'Alex', 'Noah', 'Zara'].map((name, i) => ({
        ...structuredClone(original),
        person: { ...original.person, id: `family_${i}`, displayName: name },
      }));
      await page.route('**/api/v1/households/*/fitness', (route) => route.fulfill({ json: data }));
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (['error', 'warning'].includes(m.type())) errors.push(m.text());
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto('/fitness');
      await expect(page.locator('.fitness-person')).toHaveCount(5);
      await expect(page.locator('.fitness-workout')).toHaveCount(20);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      if (viewport.width >= 1200) {
        for (const person of await page.locator('.fitness-person').all()) {
          const bounds = await person.boundingBox();
          expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
        }
        expect(
          await page
            .locator('.app-content')
            .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
        ).toBe(true);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await mkdir('/tmp/hearth-fitness-family-evidence', { recursive: true });
      await page.screenshot({
        path: `/tmp/hearth-fitness-family-evidence/family-${viewport.width}-${theme}.png`,
        fullPage: viewport.width < 1200,
      });
      const card = page.getByRole('button', { name: 'Zara: Weights', exact: true });
      await card.click();
      await expect(page.getByRole('rowheader', { name: 'Squat' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(card).toBeFocused();
      if (viewport.width === 1280) {
        await page.getByRole('button', { name: 'Ezra: Weights', exact: true }).focus();
        for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
        await expect(card).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog')).toHaveAccessibleName('Full-body strength');
        await page.keyboard.press('Escape');
        await expect(card).toBeFocused();
        for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
        await expect(page.locator(':focus')).toHaveAttribute('data-focus-id', /nav-/);
      }
      expect(errors).toEqual([]);
    });
  }

test('an unknown check stays bound to its person when another activity is opened', async ({
  page,
}) => {
  const commands: Array<{ memberId: string; workoutId: string }> = [];
  let fail = true;
  await page.route('**/fitness/completion', async (route) => {
    commands.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (fail) {
      fail = false;
      await route.abort();
    } else await route.fulfill({ response });
  });
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Maya: Weights', exact: true }).click();
  await page.getByRole('button', { name: 'Mark workout done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry check' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Ezra: Weights', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Mark workout done', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'Retry check' }).click();
  await expect(
    page.getByRole('button', { name: 'Mark workout done', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false');
  expect(commands).toHaveLength(2);
  expect(commands[0]!.memberId).toBe('member_maya');
  expect(commands[1]).toEqual(commands[0]);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Maya: Weights, done', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ezra: Weights', exact: true })).toBeVisible();
});

test('two goals of the same activity keep independent checks and quantities', async ({
  page,
  request,
}) => {
  await request.post(`${api}/demo/reset`);
  await request.put(`${home}/modules/fitness`, {
    headers: adult,
    data: { requestId: 'request_group_on', enabled: true },
  });
  const grouped = structuredClone(configuration);
  grouped.selectedMemberIds = ['member_maya'];
  grouped.plans = [grouped.plans[0]!];
  grouped.plans[0]!.workouts.push({
    ...grouped.plans[0]!.workouts[0]!,
    id: 'workout_second_run',
    goalId: 'goal_strength_member_maya',
    title: 'Hill intervals',
    durationMinutes: 15,
    distanceKm: 1,
  });
  expect(
    (
      await request.put(`${home}/fitness/settings`, {
        headers: adult,
        data: { requestId: 'request_group_setup', expectedRevision: 0, configuration: grouped },
      })
    ).ok(),
  ).toBe(true);
  await page.goto('/fitness');
  const activity = page.getByRole('button', { name: 'Maya: Run', exact: true });
  await expect(activity).toContainText('0/2');
  await expect(activity).toHaveAccessibleDescription('0 of 2 workouts done');
  await activity.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Goal: Run a comfortable 5 km', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Goal: Build full-body strength', { exact: true })).toBeVisible();
  await expect(dialog.getByText('30 min · 3 km', { exact: true })).toBeVisible();
  await expect(dialog.getByText('15 min · 1 km', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Complete Easy run', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Undo Easy run', exact: true })).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Complete Hill intervals', exact: true }),
  ).toBeVisible();
  const overview = await (await request.get(`${home}/fitness`)).json();
  const today = overview.people[0].days.find(
    (d: { localDate: string }) => d.localDate === overview.localDate,
  );
  expect(today.sessions.filter((s: { isCompleted: boolean }) => s.isCompleted)).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(activity).toContainText('1/2');
  await expect(activity).toBeFocused();
  await activity.click();
  await dialog.getByRole('button', { name: 'Complete Hill intervals', exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: 'Undo Hill intervals', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Maya: Run, done', exact: true })).toContainText(
    '2/2',
  );
  await expect(page.getByLabel('0 day streak', { exact: true })).toBeVisible();
});

test('large households keep every participant on the same page without a picker', async ({
  page,
  request,
}) => {
  const data = await (await request.get(`${home}/fitness`)).json();
  data.people = Array.from({ length: 20 }, (_, i) => ({
    ...structuredClone(data.people[0]),
    person: { ...data.people[0].person, id: `large_${i}`, displayName: `Person ${i + 1}` },
  }));
  await page.route('**/api/v1/households/*/fitness', (route) => route.fulfill({ json: data }));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/fitness');
  await expect(page.locator('.fitness-person')).toHaveCount(20);
  const last = page.getByRole('button', { name: 'Person 20: Weights', exact: true });
  await last.focus();
  await expect(last).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('rowheader', { name: 'Squat' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(last).toBeFocused();
});

test('five full plans keep grouped counts and labels inside the short TV', async ({
  page,
  request,
}) => {
  const data = await (await request.get(`${home}/fitness`)).json();
  const original = data.people[0];
  data.people = ['Alexandria Patterson', 'Maya', 'Alex', 'Noah', 'Zara'].map((name, i) => {
    const person = structuredClone(original);
    person.person = { ...person.person, id: `full_${i}`, displayName: name };
    person.days[0].sessions = Array.from({ length: 14 }, (_, j) => ({
      ...structuredClone(original.days[0].sessions[j % 4]),
      workout: {
        ...structuredClone(original.days[0].sessions[j % 4].workout),
        id: `full_${i}_${j}`,
      },
    }));
    return person;
  });
  await page.route('**/api/v1/households/*/fitness', (route) => route.fulfill({ json: data }));
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto('/fitness');
  await expect(page.locator('.fitness-workout')).toHaveCount(20);
  expect(
    await page.locator('.app-content').evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const card of await page.locator('.fitness-workout').all()) {
    const label = await card.locator('strong').boundingBox();
    const count = await card.locator('.fitness-activity-count').boundingBox();
    expect(label!.x + label!.width).toBeLessThanOrEqual(count!.x);
    expect(
      await card.locator('strong').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
  }
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 820, height: 1180 },
  { width: 1920, height: 1080 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`compact Fitness settings ${viewport.width} ${theme} @visual @a11y`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (['error', 'warning'].includes(m.type())) errors.push(m.text());
      });
      await page.goto('/admin/fitness');
      await expect(page).toHaveURL(/\/admin\/fitness$/);
      await expect(page).toHaveTitle(/Hearth/);
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      await expect(page.locator('.fitness-settings__participants')).not.toHaveAttribute('open', '');
      await expect(page.locator('.fitness-settings__goals')).not.toHaveAttribute('open', '');
      await expect(page.locator('.fitness-workout-editor')).toHaveCount(4);
      await expect(page.locator('.fitness-workout-editor[open]')).toHaveCount(0);
      expect(
        (await page.getByRole('combobox', { name: 'Plan for', exact: true }).boundingBox())!.height,
      ).toBeGreaterThanOrEqual(48);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await mkdir('/tmp/hearth-fitness-simple-evidence', { recursive: true });
      await page.screenshot({
        path: `/tmp/hearth-fitness-simple-evidence/settings-${viewport.width}-${theme}.png`,
        fullPage: true,
      });
      const summary = page.locator('.fitness-workout-editor > summary').first();
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('combobox', { name: 'Activity', exact: true })).toBeVisible();
      const extra = page
        .locator('.fitness-workout-editor[open]')
        .getByText('Exercises & details', { exact: false });
      await extra.focus();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('combobox', { name: 'Goal (optional)', exact: true }),
      ).toBeVisible();
      for (const picker of await page.getByRole('combobox').all())
        expect((await picker.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (viewport.width === 390)
        await page.screenshot({
          path: `/tmp/hearth-fitness-simple-evidence/workout-${theme}.png`,
          fullPage: true,
        });
      expect(errors).toEqual([]);
    });
  }

test('a collapsed workout with no days opens with an actionable error before saving', async ({
  page,
}) => {
  await page.goto('/admin/fitness');
  await page.getByRole('button', { name: 'Add workout', exact: true }).click();
  const last = page.locator('.fitness-workout-editor').last();
  await last.locator(':scope > summary').click();
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Choose at least one day');
  await expect(last).toHaveAttribute('open', '');
  await expect(last.locator(':scope > summary')).toBeFocused();
});

test('unknown general-fitness settings save retries its exact command and retains independent details', async ({
  page,
  request,
}) => {
  const commands: unknown[] = [];
  let fail = true;
  await page.route('**/fitness/settings', async (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    commands.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (fail) {
      fail = false;
      await route.abort();
    } else await route.fulfill({ response });
  });
  await page.goto('/admin/fitness');
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
  const workout = page.locator('.fitness-workout-editor').first();
  await workout.locator(':scope > summary').click();
  await workout.getByText('Exercises & details', { exact: false }).click();
  await workout.getByRole('combobox', { name: 'Goal (optional)', exact: true }).selectOption('');
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Activity', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Fitness saved');
  expect(commands).toHaveLength(2);
  expect(commands[1]).toEqual(commands[0]);
  const saved = await (await request.get(`${home}/fitness/settings`, { headers: adult })).json();
  const original = configuration.plans.find(
    (p) => p.memberId === saved.configuration.plans[0].memberId,
  )!;
  expect(saved.configuration.plans[0].workouts).toEqual(
    original.workouts.map((w, i) => (i === 0 ? { ...w, goalId: null } : w)),
  );
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
  await expect(page.locator('.fitness-workout-editor')).toHaveCount(4);
});
