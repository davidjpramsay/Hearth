import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test('goals show their own routines and daily cards keep their goal labels', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/fitness');
  await expect(page.locator('.fitness-workout-goal')).toHaveText([
    'Run a comfortable 5 km',
    'Run a comfortable 5 km',
    'Build full-body strength',
    'Build full-body strength',
  ]);
  const goals = page.locator('[data-focus-id="fitness-goals"]');
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

test('removing a goal confirms and only removes its own future routine', async ({
  page,
  request,
}) => {
  await page.goto('/admin/fitness');
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
  const first = page.locator('.fitness-goal-editor').first();
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
    'Full-body strength',
    'Saturday studio',
  ]);
  const overview = await (await request.get(`${home}/fitness`)).json();
  expect(
    overview.people.find((p: { person: { id: string } }) => p.person.id === 'member_maya').days[0]
      .sessions,
  ).toHaveLength(4);
});

test('earlier unassigned workouts can join a goal without losing identity or current progress', async ({
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
  await page.getByRole('button', { name: 'Easy run, Running' }).click();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.goto('/admin/fitness');
  await expect(page.getByRole('heading', { name: 'Earlier unassigned routine' })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Goal for Easy run', exact: true })
    .selectOption('goal_member_ezra');
  await expect(page.locator('#fitness-goal-goal_member_ezra')).toBeFocused();
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
  await expect(page.getByRole('button', { name: 'Easy run, Running, done' })).toBeVisible();
  await expect(page.locator('.fitness-workout-goal').first()).toHaveText('General fitness');
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
      await expect(page.getByRole('button', { name: 'Full-body strength, Weights' })).toBeVisible();
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
      const opener = page.getByRole('button', { name: 'Full-body strength, Weights' });
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
  await expect(page.locator('[data-focus-id="fitness-person"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(':focus')).not.toHaveAttribute('data-focus-id', 'fitness-person');
  await page.locator('[data-focus-id="fitness-person"]').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Maya', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fitness for Maya' })).toBeFocused();
  await page.getByRole('button', { name: 'Full-body strength, Weights' }).click();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Fitness for Ezra' }).click();
  await page.getByRole('button', { name: 'Maya', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Full-body strength, Weights, done' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Full-body strength, Weights, done' }).click();
  await page.getByRole('button', { name: 'Undo completed workout' }).click();
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Sunday,.*1 workouts/ }).click();
  await page.getByRole('button', { name: 'Full-body strength, Weights' }).click();
  await expect(page.getByText('Checks are available on the scheduled day.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Tuesday,.*0 workouts/ }).click();
  await expect(page.getByRole('heading', { name: 'A little room to recharge' })).toBeVisible();
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
  await page.getByLabel('Goal 1', { exact: true }).fill('Finish a fun run');
  await page.locator('#fitness-goal-goal_strength_member_maya').click();
  await page.getByText('Full-body strength', { exact: true }).click();
  const editor = page.locator('.fitness-workout-editor').filter({ hasText: 'Full-body strength' });
  await editor.getByLabel('Weight (kg)', { exact: true }).first().fill('22.5');
  await editor.getByRole('checkbox', { name: 'Tuesday' }).check();
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('updated plan starts tomorrow');
  const saved = (await request.get(`${home}/fitness/settings`, { headers: adult })).json();
  expect((await saved).configuration.plans[0].workouts[2].exercises[0].weightKg).toBe(22.5);
  await page.reload();
  await page.getByRole('combobox', { name: 'Plan for', exact: true }).selectOption('member_maya');
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
  await page.getByRole('button', { name: 'Full-body strength, Weights' }).click();
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
  await page.getByRole('button', { name: new RegExp(workout.title) }).focus();
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
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toBeFocused();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.getByRole('dialog').evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: new RegExp(workout.title) })).toBeFocused();
});
test('offline saved view disables checks and retains readable instructions', async ({
  page,
  context,
}) => {
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Full-body strength, Weights' }).click();
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

test('first plan can be created from an empty phone setup and used today', async ({
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
  await page.getByRole('button', { name: 'Add long-term goal', exact: true }).click();
  await page.getByLabel('Goal 1', { exact: true }).fill('Build a steady exercise habit');
  await page.getByRole('button', { name: 'Add workout', exact: true }).click();
  await page.getByLabel('Workout title', { exact: true }).fill('Strength session');
  await page.getByRole('combobox', { name: 'Activity', exact: true }).selectOption('weights');
  await page.getByRole('checkbox', { name: 'Monday', exact: true }).check();
  await page.getByRole('button', { name: 'Add exercise', exact: true }).click();
  await page.getByLabel('Exercise 1', { exact: true }).fill('Squat');
  await page.getByLabel('Weight (kg)', { exact: true }).fill('20');
  await page.getByLabel('Sets', { exact: true }).fill('3');
  await page.getByLabel('Reps', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Add long-term goal', exact: true }).click();
  await page.getByLabel('Goal 2', { exact: true }).fill('Run a comfortable 5 km');
  const runningGoal = page.locator('.fitness-goal-editor').nth(1);
  await runningGoal.getByRole('button', { name: 'Add workout', exact: true }).click();
  await runningGoal.getByLabel('Workout title', { exact: true }).fill('Gentle run');
  await runningGoal.getByRole('checkbox', { name: 'Monday', exact: true }).check();
  await runningGoal.getByRole('checkbox', { name: 'Wednesday', exact: true }).check();
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Ready to use today');
  await page.goto('/fitness');
  await expect(page.locator('.fitness-workout-goal')).toHaveText([
    'Build a steady exercise habit',
    'Run a comfortable 5 km',
  ]);
  await page.getByRole('button', { name: 'Strength session, Weights' }).click();
  await expect(page.getByRole('row', { name: 'Squat 20 3 8' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.fitness-stat').first().locator('strong')).toHaveText('0');
  await page.getByRole('button', { name: 'Gentle run, Running' }).click();
  await page.getByRole('button', { name: 'Mark workout done' }).click();
  await expect(page.getByRole('button', { name: 'Undo completed workout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.fitness-stat').first()).toContainText('1');
  await page.getByRole('button', { name: /Wednesday,.*1 workouts/ }).click();
  await expect(page.locator('.fitness-workout')).toHaveCount(1);
  await expect(page.locator('.fitness-workout-goal')).toHaveText('Run a comfortable 5 km');
});
test('many workouts page within the TV without losing the later sessions', async ({
  page,
  request,
}) => {
  const data = await (await request.get(`${home}/fitness`)).json();
  const day = data.people[0].days[0];
  day.sessions = Array.from({ length: 14 }, (_, i) => ({
    ...day.sessions[0],
    workout: { ...day.sessions[0].workout, id: `page_workout_${i}`, title: `Session ${i + 1}` },
  }));
  await page.route('**/api/v1/households/*/fitness', (route) => route.fulfill({ json: data }));
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto('/fitness');
  await expect(page.locator('.fitness-workout')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(
    true,
  );
  const more = page.getByRole('button', { name: 'More workouts', exact: true });
  for (let i = 0; i < 3; i++) await more.click();
  await expect(page.locator('.fitness-workout')).toHaveCount(2);
  await page.getByRole('button', { name: /Session 14, Running/ }).click();
  await expect(page.getByRole('heading', { name: 'Session 14', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Session 14, Running/ })).toBeFocused();
});
