import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const api = 'http://127.0.0.1:4310/api/v1',
  home = `${api}/households/household_hearth_demo`,
  base = `${home}/fitness`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' },
  fixture = fileURLToPath(new URL('../fixtures/fitness-demo.mp4', import.meta.url));
const video = readFileSync(fixture);
const libraryId = 'library_squat';
async function upload(
  request: APIRequestContext,
  id = libraryId,
  version = 1,
  requestId = 'request_upload',
) {
  const response = await request.put(`${base}/exercises/${id}/demonstration`, {
    headers: {
      ...adult,
      'content-type': 'video/mp4',
      'x-hearth-request-id': requestId,
      'x-hearth-exercise-version': String(version),
    },
    data: video,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
  expect(
    (
      await request.put(`${home}/modules/fitness`, {
        headers: adult,
        data: { requestId: 'request_on', enabled: true },
      })
    ).ok(),
  ).toBe(true);
  for (const [id, name] of [
    [libraryId, 'Squat'],
    ['library_stretch', 'Stretch'],
  ])
    expect(
      (
        await request.put(`${base}/exercises/${id}`, {
          headers: adult,
          data: {
            requestId: `request_${id}`,
            expectedVersion: 0,
            name,
            instructions: `${name} written instructions.`,
          },
        })
      ).ok(),
    ).toBe(true);
  await upload(request);
  const configuration = {
    selectedMemberIds: ['member_maya', 'member_ezra'],
    plans: ['member_maya', 'member_ezra'].map((memberId) => ({
      memberId,
      weeklyFocus: '',
      goals: [
        { id: `goal_${memberId}`, title: 'Build strength', targetDate: null, achieved: false },
      ],
      workouts: [
        {
          id: `weights_${memberId}`,
          goalId: `goal_${memberId}`,
          title: 'Sunday weights',
          activity: 'weights',
          days: ['mon', 'sun'],
          durationMinutes: null,
          distanceKm: null,
          notes: 'A test workout with shared demonstrations.',
          exercises: [
            {
              id: 'exercise_squat',
              name: 'Squat',
              libraryExerciseId: libraryId,
              weightKg: memberId === 'member_maya' ? 20 : 5,
              sets: 3,
              reps: 8,
            },
            {
              id: 'exercise_stretch',
              name: 'Stretch',
              libraryExerciseId: 'library_stretch',
              weightKg: null,
              sets: null,
              reps: null,
            },
            { id: 'exercise_plain', name: 'No demonstration', weightKg: 2, sets: 2, reps: 10 },
          ],
        },
      ],
    })),
  };
  expect(
    (
      await request.put(`${base}/settings`, {
        headers: adult,
        data: { requestId: 'request_setup', expectedRevision: 0, configuration },
      })
    ).ok(),
  ).toBe(true);
});
async function openVideo(page: Page) {
  await page.goto('/fitness');
  await page
    .getByRole('button', { name: 'Sunday weights, Weights, Goal: Build strength', exact: true })
    .click();
  await expect(page.getByText('Stretch written instructions.', { exact: true })).toBeVisible();
  const exercise = page.getByRole('button', { name: 'Watch Squat demonstration' });
  await exercise.click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
  await expect
    .poll(() => page.locator('video').evaluate((v) => (v as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2);
}
test('remote Play/Pause/Replay/Back keep the exact exercise and workout check', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const before = await (await request.get(base)).json();
  await openVideo(page);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeFocused();
  await expect
    .poll(() => page.locator('video').evaluate((v) => (v as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0.1);
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.locator('video').evaluate((v) => (v as HTMLVideoElement).paused))
    .toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.locator('video').evaluate((v) => (v as HTMLVideoElement).paused))
    .toBe(false);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Watch Squat demonstration' })).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Sunday weights');
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toBeVisible();
  expect(await (await request.get(base)).json()).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', {
      name: 'Sunday weights, Weights, Goal: Build strength',
      exact: true,
    }),
  ).toBeFocused();
});
for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 393, height: 852 },
  { width: 768, height: 1024 },
])
  for (const theme of ['light', 'dark'] as const) {
    test(`demonstration fits ${viewport.width} ${theme} @visual @a11y`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await openVideo(page);
      const bounds = await page.getByRole('dialog').boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
      for (const name of ['Play', 'Replay', 'Back to exercises']) {
        const b = await page.getByRole('button', { name, exact: true }).boundingBox();
        expect(b!.y + b!.height).toBeLessThanOrEqual(viewport.height);
        expect(b!.x).toBeGreaterThanOrEqual(0);
        expect(b!.x + b!.width).toBeLessThanOrEqual(viewport.width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).include('.fitness-dialog').analyze()).violations,
      ).toEqual([]);
      mkdirSync('/tmp/hearth-fitness-demonstrations', { recursive: true });
      await page.screenshot({
        path: `/tmp/hearth-fitness-demonstrations/player-${viewport.width}-${theme}.png`,
      });
    });
  }
test('adult library uploads/retries exactly, reuses a clip, and keeps drafts on refetch', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/admin/fitness/exercises');
  await page.getByLabel('Exercise name', { exact: true }).fill('Lunge');
  await page
    .getByRole('textbox', { name: 'Instructions', exact: true })
    .fill('Written demonstration instructions.');
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Library updated');
  let uploads = 0;
  await page.route('**/api/v1/households/*/fitness/exercises/*/demonstration', async (route) => {
    uploads++;
    if (uploads === 1) {
      await route.fetch();
      await route.abort('failed');
    } else await route.continue();
  });
  await page.getByLabel('Add MP4', { exact: true }).setInputFiles(fixture);
  await expect(page.getByRole('button', { name: 'Retry same update' })).toBeVisible();
  await expect(page.getByLabel('Exercise name', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Retry same update' }).click();
  await expect(page.getByRole('status')).toContainText('Library updated');
  const library = await (await request.get(`${base}/exercises`)).json();
  const lunge = library.exercises.find((e: { name: string }) => e.name === 'Lunge');
  expect(lunge.version).toBe(2);
  await page
    .getByRole('textbox', { name: 'Instructions', exact: true })
    .fill('Unsaved instructions stay.');
  await request.put(`${base}/exercises/${libraryId}`, {
    headers: adult,
    data: {
      requestId: 'request_remote',
      expectedVersion: 2,
      name: 'Squat',
      instructions: 'Changed elsewhere.',
    },
  });
  await expect(page.getByRole('textbox', { name: 'Instructions', exact: true })).toHaveValue(
    'Unsaved instructions stay.',
  );
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'New exercise', exact: true }).click();
  await page.screenshot({ path: '/tmp/hearth-fitness-demonstrations/library-phone.png' });
  await page.goto('/admin/fitness');
  await expect(page.locator('.fitness-goal-editor').first()).toHaveAttribute('open', '');
  await page.locator('.fitness-workout-editor > summary').first().click();
  await page
    .getByRole('combobox', { name: 'Demonstration / library exercise', exact: true })
    .first()
    .selectOption(lunge.id);
  await page.getByRole('button', { name: 'Save Fitness', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('tomorrow');
  const saved = await (await request.get(`${base}/settings`, { headers: adult })).json();
  expect(
    saved.configuration.plans.some(
      (p: { workouts: Array<{ exercises: Array<{ libraryExerciseId: string }> }> }) =>
        p.workouts.some((w) => w.exercises.some((e) => e.libraryExerciseId === lunge.id)),
    ),
  ).toBe(true);
  // The other person's Squat still references the same original reusable library entry.
  const overview = await (await request.get(base)).json();
  expect(
    overview.people.every(
      (p: {
        days: Array<{
          sessions: Array<{ workout: { exercises: Array<{ libraryExerciseId: string }> } }>;
        }>;
      }) => p.days[0]!.sessions[0]!.workout.exercises[0]!.libraryExerciseId === libraryId,
    ),
  ).toBe(true);
});
test('unavailable clip can be retried, and deleted demonstrations leave workout instructions', async ({
  page,
  request,
}) => {
  await page.route('**/api/v1/households/*/fitness/demonstrations/*', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );
  await page.goto('/fitness');
  await page
    .getByRole('button', { name: 'Sunday weights, Weights, Goal: Build strength', exact: true })
    .click();
  await page.getByRole('button', { name: 'Watch Squat demonstration' }).click();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await page.unroute('**/api/v1/households/*/fitness/demonstrations/*');
  await page.getByRole('button', { name: 'Reload clip' }).click();
  await expect
    .poll(() => page.locator('video').evaluate((v) => (v as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2);
  await request.post(`${base}/exercises/${libraryId}/remove-video`, {
    headers: adult,
    data: { requestId: 'request_remove_video', expectedVersion: 2 },
  });
  await expect(page.getByRole('status')).toContainText('demonstration was removed');
  await expect(page.locator('video')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to exercises' }).click();
  await expect(page.getByText('Squat written instructions.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Watch Squat demonstration' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mark workout done' })).toBeVisible();
});
test('module switch stops an open demonstration and access while preserving library and ticks', async ({
  page,
  request,
}) => {
  await openVideo(page);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await request.put(`${home}/modules/fitness`, {
    headers: adult,
    data: { requestId: 'request_off', enabled: false },
  });
  await expect(page.locator('video')).toHaveCount(0);
  expect((await request.get(`${base}/exercises`)).status()).toBe(403);
  await request.put(`${home}/modules/fitness`, {
    headers: adult,
    data: { requestId: 'request_on_again', enabled: true },
  });
  await openVideo(page);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('native suspend and page hiding pause without automatically resuming', async ({ page }) => {
  await openVideo(page);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.evaluate(() =>
    window.postMessage(
      JSON.stringify({ type: 'presentation.status', active: false, generation: 2 }),
      location.origin,
    ),
  );
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.evaluate(() =>
    window.postMessage(
      JSON.stringify({ type: 'presentation.status', active: true, generation: 3 }),
      location.origin,
    ),
  );
  expect(await page.locator('video').evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});
test('Sunday long workout returns to the same exercise and scroll position', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const settings = await (await request.get(`${base}/settings`, { headers: adult })).json();
  for (const plan of settings.configuration.plans)
    plan.workouts[0].exercises = Array.from({ length: 20 }, (_, i) => ({
      id: `exercise_${i}`,
      name: `Movement ${i + 1}`,
      libraryExerciseId: libraryId,
      weightKg: 20,
      sets: 3,
      reps: 8,
    }));
  await request.put(`${base}/settings`, {
    headers: adult,
    data: { requestId: 'request_long', expectedRevision: 1, configuration: settings.configuration },
  });
  await request.put(`${base}/exercises/${libraryId}`, {
    headers: adult,
    data: {
      requestId: 'request_long_text',
      expectedVersion: 2,
      name: 'Squat',
      instructions: 'A long set of written instructions for the movement. '.repeat(30),
    },
  });
  await page.goto('/fitness');
  await page.getByRole('button', { name: 'Sunday, 9 Aug, 1 workouts', exact: true }).click();
  await page
    .getByRole('button', { name: 'Sunday weights, Weights, Goal: Build strength', exact: true })
    .click();
  const last = page.getByRole('button', { name: 'Watch Movement 20 demonstration' });
  await last.focus();
  await last.scrollIntoViewIfNeeded();
  const scroll = await page
    .getByRole('region', { name: 'Workout instructions' })
    .evaluate((el) => el.scrollTop);
  expect(scroll).toBeGreaterThan(100);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
  const instructions = page.getByRole('region', { name: 'Demonstration instructions' });
  await instructions.focus();
  await page.keyboard.press('ArrowDown');
  expect(await instructions.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(last).toBeFocused();
  expect(
    await page.getByRole('region', { name: 'Workout instructions' }).evaluate((el) => el.scrollTop),
  ).toBeCloseTo(scroll, 0);
  await expect(page.getByText('Checks are available on the scheduled day.')).toBeVisible();
});

test('cancelled playback is quiet while a rejected play remains recoverable', async ({ page }) => {
  await openVideo(page);
  await page.locator('video').evaluate((video) => {
    Object.defineProperty(video, 'play', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Cancelled while paused', 'AbortError')),
    });
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.locator('video').evaluate((video) => {
    Object.defineProperty(video, 'play', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Playback unavailable', 'NotSupportedError')),
    });
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not play');
  await page.getByRole('button', { name: 'Back to exercises' }).click();
  await expect(page.getByRole('button', { name: 'Watch Squat demonstration' })).toBeFocused();
});
